import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  X,
  IndianRupee,
  Calendar,
  Tag,
  Truck,
  FileText,
  User,
  MoreVertical,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  Camera,
  Edit,
  History,
  Check,
  Ban,
  AlertTriangle,
  Fuel,
  Zap,
  // Added Factory icon for PLANT_ADVANCE category
  Factory,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  Order,
  UserRole,
  HistoryEntry,
  MaintenanceExpense,
  Truck as TruckType,
  Bank,
} from "../types";

interface ExpensesViewProps {
  expenses: Expense[];
  maintenance: MaintenanceExpense[];
  orders: Order[];
  trucks: TruckType[];
  activeRole: UserRole;
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  banks?: Bank[];
}

// Fixed: Added missing [ExpenseCategory.PLANT_ADVANCE] property to CATEGORY_ICONS
const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  [ExpenseCategory.DIESEL]: Fuel,
  [ExpenseCategory.PETROL]: Fuel,
  [ExpenseCategory.CNG]: Fuel,
  [ExpenseCategory.EV]: Zap,
  [ExpenseCategory.DRIVER_ALLOWANCE]: User,
  [ExpenseCategory.TOLL_FASTAG]: Truck,
  [ExpenseCategory.MAINTENANCE]: Truck,
  [ExpenseCategory.TYRE_PARTS]: Truck,
  [ExpenseCategory.OFFICE]: FileText,
  [ExpenseCategory.MISC]: Tag,
  [ExpenseCategory.PLANT_ADVANCE]: Factory,
  [ExpenseCategory.DRIVER_SALARY]: IndianRupee,
  [ExpenseCategory.EMPLOYEE_SALARY]: IndianRupee,
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.DIESEL]: "bg-blue-50 text-blue-600",
  [ExpenseCategory.PETROL]: "bg-blue-50 text-blue-600",
  [ExpenseCategory.CNG]: "bg-blue-50 text-blue-600",
  [ExpenseCategory.EV]: "bg-indigo-50 text-indigo-600",
  [ExpenseCategory.DRIVER_ALLOWANCE]: "bg-emerald-50 text-emerald-600",
  [ExpenseCategory.TOLL_FASTAG]: "bg-amber-50 text-amber-600",
  [ExpenseCategory.MAINTENANCE]: "bg-rose-50 text-rose-600",
  [ExpenseCategory.TYRE_PARTS]: "bg-orange-50 text-orange-600",
  [ExpenseCategory.OFFICE]: "bg-slate-50 text-slate-600",
  [ExpenseCategory.MISC]: "bg-slate-50 text-slate-600",
  [ExpenseCategory.PLANT_ADVANCE]: "bg-indigo-50 text-indigo-600",
  [ExpenseCategory.DRIVER_SALARY]: "bg-teal-50 text-teal-600",
  [ExpenseCategory.EMPLOYEE_SALARY]: "bg-cyan-50 text-cyan-600",
};

export const formatCategory = (cat: string) => {
  if (cat === "DRIVER_SALARY") return "Payroll (Driver Salary/Daily Wage)";
  if (cat === "EMPLOYEE_SALARY") return "Payroll (Employee Salary)";
  return (cat || "").replace("_", " ");
};

const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  maintenance,
  orders,
  trucks,
  activeRole,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  banks = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "ALL">(
    "ALL",
  );
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "UNPAID">(
    "ALL",
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [formData, setFormData] = useState<Partial<Expense>>({
    category: ExpenseCategory.DIESEL,
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    paymentMode: "CASH",
    vendorName: "",
    description: "",
    status: ExpenseStatus.APPROVED,
    paymentStatus: "PAID",
    responsibleStaff: "",
    dueDate: "",
    paidDate: new Date().toISOString().split("T")[0],
    isAuto: false,
    history: [],
  });

  const mappedMaintenance = useMemo(() => {
    return maintenance.map(
      (m) =>
        ({
          id: m.id,
          category: ExpenseCategory.MAINTENANCE,
          date: m.date,
          amount: m.amount,
          paymentMode:
            m.paymentMode === "BANK_TRANSFER"
              ? "BANK"
              : m.paymentMode === "UPI"
                ? "UPI"
                : "CASH",
          referenceNo: m.id,
          orderId: m.orderId,
          truckId: m.truckId,
          vendorName: `${m.workshopName}${m.odometerReading ? ` (Odo: ${m.odometerReading})` : ""}`,
          description: `[${m.category}] ${m.description}${m.partsReplaced?.length ? ` | Parts: ${m.partsReplaced.join(", ")}` : ""}`,
          status: ExpenseStatus.APPROVED,
          paymentStatus: m.status,
          dueDate: m.dueDate,
          paidDate: m.paidDate,
          responsibleStaff: m.responsibleStaff,
          isAuto: true,
          history: [],
          // Flag to identify maintenance records
          isMaintenance: true,
        }) as any,
    );
  }, [maintenance]);

  const allCombinedExpenses = useMemo(
    () => [...expenses, ...mappedMaintenance],
    [expenses, mappedMaintenance],
  );

  const filteredExpenses = useMemo(() => {
    return allCombinedExpenses.filter((exp) => {
      const matchesSearch =
        (exp.vendorName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (exp.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (exp.responsibleStaff || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (exp.referenceNo || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "ALL" || exp.category === categoryFilter;
      const matchesPayment =
        paymentFilter === "ALL" || exp.paymentStatus === paymentFilter;
      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [allCombinedExpenses, searchQuery, categoryFilter, paymentFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, paymentFilter]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredExpenses.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / rowsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      const updatedExpense: Expense = {
        ...(formData as Expense),
        history: [
          ...(formData.history || []),
          {
            action: "EDITED",
            user: activeRole === UserRole.ADMIN ? "Admin" : "Accountant",
            timestamp: new Date().toLocaleString(),
            note: "Manual entry update",
          },
        ],
      };
      onUpdateExpense(updatedExpense);
    } else {
      const newExpense: Expense = {
        ...(formData as Expense),
        id: `EXP-${Date.now()}`,
        referenceNo:
          formData.referenceNo || `REF-${Math.floor(Math.random() * 100000)}`,
        isAuto: false,
        history: [
          {
            action: "CREATED",
            user: activeRole === UserRole.ADMIN ? "Admin" : "Accountant",
            timestamp: new Date().toLocaleString(),
          },
        ],
      };
      onAddExpense(newExpense);
    }
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const handleEdit = (exp: Expense) => {
    setFormData(exp);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleApprove = (exp: Expense) => {
    const history: HistoryEntry[] = [
      ...exp.history,
      {
        action: "APPROVED",
        user: "Admin",
        timestamp: new Date().toLocaleString(),
        note: "Verified and approved.",
      },
    ];
    onUpdateExpense({ ...exp, status: ExpenseStatus.APPROVED, history });
  };

  const handleReject = (exp: Expense) => {
    const reason = window.prompt("Reason for rejection:");
    const history: HistoryEntry[] = [
      ...exp.history,
      {
        action: "REJECTED",
        user: "Admin",
        timestamp: new Date().toLocaleString(),
        note: reason || "Rejected without note.",
      },
    ];
    onUpdateExpense({ ...exp, status: ExpenseStatus.REJECTED, history });
  };

  const openDetails = (exp: Expense) => {
    setSelectedExpense(exp);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Expense Ledger
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Complete record of operational and office costs.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              category: ExpenseCategory.DIESEL,
              date: new Date().toISOString().split("T")[0],
              amount: 0,
              paymentMode: "CASH",
              vendorName: "",
              description: "",
              status: ExpenseStatus.APPROVED,
              paymentStatus: "PAID",
              responsibleStaff: "",
              dueDate: "",
              paidDate: new Date().toISOString().split("T")[0],
              isAuto: false,
              history: [],
              bankId: "",
              bankName: "",
              referenceNo: "",
            });
            setIsEditing(false);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Expenses (Approved)
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-slate-900">
              ₹
              {(
                allCombinedExpenses
                  .filter((e) => e.status === ExpenseStatus.APPROVED)
                  .reduce((a, b) => a + b.amount, 0) || 0
              ).toLocaleString()}
            </p>
            <TrendingDown size={20} className="text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Paid
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-emerald-600">
              ₹
              {(
                allCombinedExpenses
                  .filter((e) => e.paymentStatus === "PAID")
                  .reduce((a, b) => a + b.amount, 0) || 0
              ).toLocaleString()}
            </p>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Total Unpaid
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-amber-600">
              ₹
              {(
                allCombinedExpenses
                  .filter((e) => e.paymentStatus === "UNPAID")
                  .reduce((a, b) => a + b.amount, 0) || 0
              ).toLocaleString()}
            </p>
            <Clock size={20} className="text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Pending Approval
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-blue-600">
              {
                allCombinedExpenses.filter(
                  (e) => e.status === ExpenseStatus.PENDING,
                ).length
              }{" "}
              Items
            </p>
            <AlertCircle size={20} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Payment sub-tabs (New) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(["ALL", "PAID", "UNPAID"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setPaymentFilter(status)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                paymentFilter === status
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {status === "ALL" ? "Everything" : status}
            </button>
          ))}
        </div>

        <div className="flex-1 relative w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by vendor, staff, category..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none shadow-sm transition-all font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full lg:w-64">
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-sm">
                {categoryFilter === "ALL"
                  ? "All Categories"
                  : formatCategory(categoryFilter)}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isCategoryDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsCategoryDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 py-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setCategoryFilter("ALL");
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-5 py-2.5 text-sm font-bold hover:bg-slate-50 flex items-center justify-between ${categoryFilter === "ALL" ? "text-red-600 bg-red-50/50" : "text-slate-600"}`}
                >
                  All Categories
                  {categoryFilter === "ALL" && <Check size={14} />}
                </button>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                {Object.values(ExpenseCategory).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 text-sm font-bold hover:bg-slate-50 flex items-center justify-between ${categoryFilter === cat ? "text-red-600 bg-red-50/50" : "text-slate-600"}`}
                  >
                    {formatCategory(cat)}
                    {categoryFilter === cat && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Entry Date
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Truck No
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Responsible Staff
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Workshop / Vendor
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Amount (₹)
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Paid Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  Date Paid
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  Due Date
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Mode
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  Bank Account
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Trip ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Notes
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedExpenses.map((exp) => {
                const Icon = CATEGORY_ICONS[exp.category];
                return (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => openDetails(exp)}
                  >
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-slate-900">
                        {exp.date}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        #{exp.referenceNo}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-black text-blue-600">
                        {trucks.find((t) => t.id === exp.truckId)
                          ?.truckNumber || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-700">
                        {exp.responsibleStaff || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[exp.category] || "bg-slate-50 text-slate-600"}`}
                        >
                          <Icon size={14} />
                        </div>
                        <p className="text-xs font-black text-slate-900">
                          {formatCategory(exp.category)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-slate-900">
                        {exp.vendorName || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">
                        ₹{(exp.amount || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${exp.paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-600">
                        {exp.paidDate || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-amber-600">
                        {exp.dueDate || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                        {exp.paymentMode === "CASH" ? "Cash" : exp.paymentMode === "BANK" ? "Bank (NEFT,RTGS)" : exp.paymentMode}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
                        {exp.bankName || "Self (Cash)"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-tight">
                        {exp.referenceNo || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {exp.orderId || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-5 max-w-[150px]">
                      <div className="space-y-1">
                        {exp.poolId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-tighter border border-blue-100">
                            POOL: {exp.poolId}
                          </span>
                        )}
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                          {exp.poolId
                            ? exp.description
                                .replace(`[POOL: ${exp.poolId}]`, "")
                                .trim()
                            : exp.description || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          exp.status === ExpenseStatus.APPROVED
                            ? "bg-green-100 text-green-600 border border-green-200"
                            : exp.status === ExpenseStatus.PENDING
                              ? "bg-amber-100 text-amber-600 border-amber-200"
                              : "bg-red-100 text-red-600 border-red-200"
                        }`}
                      >
                        {exp.status}
                      </div>
                    </td>
                    <td
                      className="px-6 py-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {exp.status === ExpenseStatus.PENDING &&
                          activeRole === UserRole.ADMIN &&
                          !exp.isMaintenance && (
                            <>
                              <button
                                onClick={() => handleApprove(exp)}
                                className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl shadow-sm border border-green-100 transition-all"
                                title="Approve"
                              >
                                <Check size={16} strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => handleReject(exp)}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl shadow-sm border border-red-100 transition-all"
                                title="Reject"
                              >
                                <Ban size={16} strokeWidth={3} />
                              </button>
                            </>
                          )}
                        {!exp.isMaintenance && (
                          <>
                            <button
                              onClick={() => handleEdit(exp)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Edit Entry"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {exp.isMaintenance && (
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                            Maintenance Record
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Tag size={48} className="text-slate-200" />
                      <p className="text-slate-400 font-medium italic">
                        No expenses recorded for this period.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {filteredExpenses.length} Records
          </p>
        </div>
      </div>

      {/* Expense Detail Modal */}
      {isDetailOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Voucher Details
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Reference: {selectedExpense.referenceNo}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Category
                  </label>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {formatCategory(selectedExpense?.category || "")}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Responsible Staff
                  </label>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {selectedExpense.responsibleStaff || "System"}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Workshop / Vendor
                  </label>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {selectedExpense.vendorName || "N/A"}
                  </p>
                </div>
                {selectedExpense.isMaintenance && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Maintenance Info
                    </label>
                    <p className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-tight">
                      Source: Truck Health Center
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Voucher Amount
                  </label>
                  <p className="text-xl font-black text-blue-600 mt-1">
                    ₹{(selectedExpense.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Payment Status
                  </label>
                  <div
                    className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-lg text-xs font-black ${selectedExpense.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {selectedExpense.paymentStatus === "PAID" ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    {selectedExpense.paymentStatus}
                  </div>
                </div>
                {selectedExpense.paymentStatus === "PAID" ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Date Paid
                    </label>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedExpense.paidDate || "N/A"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Due Date
                    </label>
                    <p className="text-sm font-bold text-amber-600 mt-1">
                      {selectedExpense.dueDate || "N/A"}
                    </p>
                  </div>
                )}
                {selectedExpense.liters && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Liters & Rate
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Fuel size={14} className="text-slate-400" />
                      <p
                        className={`text-sm font-bold ${selectedExpense.isLimitExceeded ? "text-amber-600" : "text-slate-900"}`}
                      >
                        {selectedExpense.liters} L @ ₹{selectedExpense.rate}/L
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Payment Mode
                  </label>
                  <div className="inline-flex items-center gap-2 mt-1 bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600">
                    <IndianRupee size={12} /> {selectedExpense.paymentMode}
                  </div>
                </div>
              </div>

              {selectedExpense.isLimitExceeded && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-red-900 uppercase tracking-tight">
                      Fraud Prevention Alert
                    </p>
                    <p className="text-[11px] font-bold text-red-700/80 leading-snug mt-1">
                      This diesel entry exceeds the pre-calculated trip limit of
                      the assigned route. Verify the loadings slips and mileage
                      details before approval.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                  <History size={14} /> Audit Trail & Logs
                </h4>
                <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {selectedExpense.history.map((entry, idx) => (
                    <div key={idx} className="relative pl-7">
                      <div
                        className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                          entry.action === "APPROVED"
                            ? "bg-green-500"
                            : entry.action === "REJECTED"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-none">
                            {entry.action} by {entry.user}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5">
                            {entry.timestamp}
                          </p>
                        </div>
                      </div>
                      {entry.note && (
                        <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                          <div className="absolute top-[-6px] left-4 w-2 h-2 bg-slate-50 border-t border-l border-slate-100 rotate-45"></div>
                          <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">
                            "{entry.note}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedExpense.status === ExpenseStatus.PENDING &&
                activeRole === UserRole.ADMIN && (
                  <div className="pt-6 flex gap-4">
                    <button
                      onClick={() => {
                        handleApprove(selectedExpense);
                        setIsDetailOpen(false);
                      }}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                    >
                      <Check size={20} strokeWidth={3} /> Approve Entry
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedExpense);
                        setIsDetailOpen(false);
                      }}
                      className="flex-1 py-4 bg-white text-red-600 rounded-2xl font-black border-2 border-red-50 shadow-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Ban size={20} strokeWidth={3} /> Reject
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Expense Modal remains unchanged but uses CATEGORY_ICONS now */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {isEditing ? "Modify Entry" : "Record Expense"}
                </h3>
                <p className="text-sm text-slate-500 font-medium italic">
                  {isEditing
                    ? "Update the details of this financial voucher."
                    : "Manually post operational or office costs."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                }}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-6 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Entry Date*
                  </label>
                  <input
                    type="date"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    required
                    value={formData.date ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Responsible Staff*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    required
                    value={formData.responsibleStaff ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibleStaff: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Category*
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    value={formData.category ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as ExpenseCategory,
                      })
                    }
                  >
                    {Object.values(ExpenseCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {formatCategory(cat)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Workshop / Vendor*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Oil, Reliance..."
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    required
                    value={formData.vendorName ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Amount (₹)*
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      className="w-full pl-9 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-black text-slate-900 text-lg"
                      required
                      placeholder="0.00"
                      value={formData.amount ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Paid / Unpaid Status*
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, paymentStatus: "PAID" })
                      }
                      className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${formData.paymentStatus === "PAID" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, paymentStatus: "UNPAID" })
                      }
                      className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${formData.paymentStatus === "UNPAID" ? "bg-amber-500 text-white border-amber-500 shadow-lg" : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
                    >
                      Unpaid
                    </button>
                  </div>
                </div>
                {formData.paymentStatus === "PAID" ? (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Date Paid*
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-900"
                      required
                      value={formData.paidDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, paidDate: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2 animate-in slide-in-from-right-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Payment Due Date*
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-900"
                      required
                      value={formData.dueDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Payment Mode
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    value={formData.paymentMode ?? "CASH"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMode: e.target.value as any,
                        ...(e.target.value === "CASH" ? { bankId: "", bankName: "" } : {})
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank (NEFT,RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Transaction ID / Ref No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-12938102"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                    value={formData.referenceNo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, referenceNo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {formData.paymentMode !== "CASH" ? (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Select Bank Account
                    </label>
                    <select
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                      value={formData.bankId || ""}
                      onChange={(e) => {
                        const selectedBank = banks.find((b) => b.id === e.target.value);
                        setFormData({
                          ...formData,
                          bankId: e.target.value,
                          bankName: selectedBank ? selectedBank.bankName : "",
                        });
                      }}
                    >
                      <option value="">Select Bank Account</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - A/C: {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-widest select-none">
                      Bank Details (Not Required)
                    </label>
                    <div className="w-full px-5 py-3.5 bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl text-xs font-medium text-slate-400 select-none">
                      Paid via Cash (In Hand)
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Linked Trip ID
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                    value={formData.orderId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, orderId: e.target.value })
                    }
                  >
                    <option value="">None</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} - {o.projectSite}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-slate-900"
                  placeholder="Additional expense details..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditing(false);
                  }}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 hover:-translate-y-1 transition-all"
                >
                  {isEditing ? "Save Changes" : "Confirm Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;
