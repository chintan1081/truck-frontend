import React, { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  X,
  Wallet,
  Search,
  Plus,
  Filter,
  IndianRupee,
  TrendingDown,
  Calendar,
  Download,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Fuel,
  Users,
  Briefcase,
  SlidersHorizontal,
  History,
  Tag,
  Truck,
  Zap,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Calculator,
  UserCheck,
  ShieldCheck,
  Package,
  Printer,
  FileText,
  Hash,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Expense,
  DriverSalary,
  Driver,
  Order,
  UserRole,
  ExpenseCategory,
  ExpenseStatus,
  Bank,
  BankTransaction,
  PaymentRecord,
  Employee,
  EmployeeSalary,
  AppSettings,
  Invoice,
  MaintenanceExpense,
  Truck as TruckType,
  PlantAdvance,
  PlantAdvancePoolEntry,
  Site,
} from "../types";
import SalaryView from "./SalaryView";
import ExpensesView, { formatCategory } from "./ExpensesView";
import EmployeeSalaryView from "./EmployeeSalaryView";

interface AccountabilityViewProps {
  expenses: Expense[];
  maintenance: MaintenanceExpense[];
  salaries: DriverSalary[];
  employeeSalaries: EmployeeSalary[];
  plantAdvances: PlantAdvance[];
  plantPool: PlantAdvancePoolEntry[];
  sites: Site[];
  drivers: Driver[];
  employees: Employee[];
  trucks: TruckType[];
  orders: Order[];
  banks: Bank[];
  bankTransactions: BankTransaction[];
  paymentRecords: PaymentRecord[];
  invoices: Invoice[];
  activeRole: UserRole;
  settings: AppSettings;
  onAddExpense: (e: Expense) => void;
  onUpdateExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddSalary: (s: DriverSalary) => void;
  onUpdateSalary: (s: DriverSalary) => void;
  onDeleteSalary: (id: string) => void;
  onAddEmployeeSalary: (s: EmployeeSalary) => void;
  onUpdateEmployeeSalary: (s: EmployeeSalary) => void;
  onDeleteEmployeeSalary: (id: string) => void;
  onAddBankTransaction: (t: BankTransaction) => void;
  onUpdateBankTransaction: (t: BankTransaction) => void;
  onDeleteBankTransaction: (id: string) => void;
  onAddPaymentRecord: (r: PaymentRecord) => void;
  onUpdatePaymentRecord: (r: PaymentRecord) => void;
  onDeletePaymentRecord: (id: string) => void;
  onUpdateInvoice: (i: Invoice) => void;
}

const AccountabilityView: React.FC<AccountabilityViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<
    | "LEDGER"
    | "PAYROLL"
    | "EMP_PAYROLL"
    | "EXPENSES"
    | "BANK"
    | "PAYMENTS"
    | "PLANT_ADVANCES"
    | "AUDIT"
  >("LEDGER");
  const [paymentSubTab, setPaymentSubTab] = useState<
    "RECEIVE" | "PAY" | "BILLING"
  >("RECEIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankTransaction, setEditingBankTransaction] =
    useState<BankTransaction | null>(null);
  const [bankForm, setBankForm] = useState<Partial<BankTransaction>>({
    bankId: "",
    bankName: "",
    type: "RECEIVE_MONEY",
    fromWhere: "",
    toWhom: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    checkNo: "",
    neftUpiId: "",
    description: "",
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentRecord, setEditingPaymentRecord] =
    useState<PaymentRecord | null>(null);
  const [isInvoicePaymentModalOpen, setIsInvoicePaymentModalOpen] =
    useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);
  const [invoicePaymentMode, setInvoicePaymentMode] = useState("CASH");

  const [paymentForm, setPaymentForm] = useState<Partial<PaymentRecord>>({
    type: "RECEIVE",
    partyName: "",
    method: "CASH",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    bankId: "",
    bankName: "",
    transactionId: "",
    chequeNo: "",
    description: "",
  });

  const billingPayments = useMemo(() => {
    const list: any[] = [];
    props.invoices.forEach((inv) => {
      inv.payments.forEach((p) => {
        list.push({
          ...p,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
        });
      });
    });
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [props.invoices]);

  const pendingInvoices = useMemo(() => {
    return props.invoices.filter(
      (inv) =>
        inv.totalAmount - inv.paidAmount > 0.1 && inv.status !== "CANCELLED",
    );
  }, [props.invoices]);

  const clientNames = useMemo(() => {
    return Array.from(new Set(props.orders.map((o) => o.clientName)))
      .filter(Boolean)
      .sort();
  }, [props.orders]);

  // Pagination States
  const [ledgerPage, setLedgerPage] = useState(1);
  const [bankPage, setBankPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const rowsPerPage = 10;

  // Advanced Filter State
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: 0,
    maxAmount: 1000000,
    entity: "ALL",
    status: "ALL",
    paymentMode: "ALL",
    category: "ALL",
    bankId: "ALL",
  });

  const filteredPayments = useMemo(() => {
    let rawList: any[] = [];
    
    if (paymentSubTab === 'RECEIVE') {
      // Include both general RECEIVE records and BILLING payments
      rawList = [
        ...props.paymentRecords.filter((r) => r.type === "RECEIVE"),
        ...billingPayments.map(bp => ({ 
          ...bp, 
          type: 'RECEIVE', 
          isBilling: true,
          partyName: bp.clientName, // Unify the field name for search
          method: bp.mode, // Unify the field name for search
          transactionId: bp.referenceNo, // Unify the field name for search
          description: bp.note || `Invoice Payment: ${bp.invoiceNumber}`
        }))
      ];
    } else if (paymentSubTab === 'PAY') {
      rawList = [
        ...props.paymentRecords.filter((r) => r.type === "PAY"),
        ...(props.salaries || []).map(s => ({
          id: `payroll-${s.id}`,
          type: 'PAY',
          partyName: s.driverName || 'N/A',
          method: s.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (s.paymentMode as any),
          amount: s.totalAmount || 0,
          date: s.dateGiven || new Date().toISOString().split('T')[0],
          bankId: s.bankId || '',
          bankName: s.bankName || (s.bankId && props.banks.find(b => b.id === s.bankId)?.bankName) || 'Self (Cash)',
          transactionId: s.referenceNo || '',
          description: s.notes || `Driver Salary Payroll for ${s.month}`,
          isPayroll: true
        })),
        ...(props.employeeSalaries || []).map(s => ({
          id: `emp-payroll-${s.id}`,
          type: 'PAY',
          partyName: s.employeeName || 'N/A',
          method: s.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (s.paymentMode as any),
          amount: s.netAmount || 0,
          date: s.dateGiven || new Date().toISOString().split('T')[0],
          bankId: s.bankId || '',
          bankName: s.bankName || (s.bankId && props.banks.find(b => b.id === s.bankId)?.bankName) || 'Self (Cash)',
          transactionId: s.referenceNo || '',
          description: s.notes || `Employee Salary Payroll for ${s.salaryMonth}`,
          isEmployeePayroll: true
        })),
        ...(props.expenses || [])
          .filter(
            (e) =>
              e.category !== ExpenseCategory.DRIVER_SALARY &&
              e.category !== ExpenseCategory.EMPLOYEE_SALARY
          )
          .map(e => ({
            id: `expense-${e.id}`,
            type: 'PAY',
            partyName: e.vendorName || 'N/A',
            method: e.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (e.paymentMode as any),
            amount: e.amount || 0,
            date: e.date || new Date().toISOString().split('T')[0],
            bankId: e.bankId || '',
            bankName: e.bankName || (e.bankId && props.banks.find(b => b.id === e.bankId)?.bankName) || 'Self (Cash)',
            transactionId: e.referenceNo || '',
            description: e.description || `Expense: ${formatCategory(e.category)}`,
            isExpense: true
          })),
        ...(props.maintenance || []).map(m => ({
          id: `maintenance-${m.id}`,
          type: 'PAY',
          partyName: m.workshopName || 'N/A',
          method: m.paymentMode === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : (m.paymentMode as any || 'CASH'),
          amount: m.amount || 0,
          date: m.date || new Date().toISOString().split('T')[0],
          bankId: '',
          bankName: 'Self (Cash)',
          transactionId: m.orderId || '',
          description: m.description || 'Vehicle Maintenance',
          isMaintenance: true
        }))
      ];
    } else {
      // BILLING tab
      rawList = billingPayments;
    }

    return rawList.filter((r) => {
      const q = searchQuery.toLowerCase();

      const clientName = (r.isBilling ? r.clientName : r.partyName) || "";
      const invoiceNo = r.invoiceNumber || "";
      const transId = (r.isBilling ? r.referenceNo : (r.transactionId || r.chequeNo)) || "";
      const method = (r.isBilling ? r.mode : r.method) || "";
      const bankId = r.bankId || "";
      const bankName =
        props.banks.find((b) => b.id === bankId)?.bankName ||
        props.settings.bankDetails?.find((b) => b.id === bankId)?.bankName ||
        "Self (Cash)";

      const matchesSearch =
        !searchQuery ||
        clientName.toLowerCase().includes(q) ||
        invoiceNo.toLowerCase().includes(q) ||
        transId.toLowerCase().includes(q) ||
        method.toLowerCase().includes(q) ||
        bankName.toLowerCase().includes(q) ||
        (r.poolId || "").toLowerCase().includes(q);

      const matchesBank =
        filters.bankId === "ALL" ||
        (filters.bankId === "CASH"
          ? !bankId || bankId === "CASH"
          : bankId === filters.bankId);
      const matchesMode =
        filters.paymentMode === "ALL" || method === filters.paymentMode;

      const date = new Date(r.date);
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      const matchesDate = (!start || date >= start) && (!end || date <= end);

      return matchesSearch && matchesBank && matchesMode && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    paymentSubTab,
    billingPayments,
    props.paymentRecords,
    searchQuery,
    filters,
    props.banks,
    props.settings.bankDetails,
    props.salaries,
    props.employeeSalaries,
    props.expenses,
    props.maintenance
  ]);

  const paymentMethodStats = useMemo(() => {
    // Shared filter logic for payment records to keep stats in sync with table
    const applyRecordFilters = (r: any) => {
      const q = searchQuery.toLowerCase();
      const clientName = (r.isBilling ? r.clientName : r.partyName) || "";
      const invoiceNo = r.invoiceNumber || "";
      const transId = (r.isBilling ? r.referenceNo : (r.transactionId || r.chequeNo)) || "";
      const method = (r.isBilling ? r.mode : r.method) || "";
      const bankId = r.bankId || "";
      const bankName =
        props.banks.find((b) => b.id === bankId)?.bankName ||
        props.settings.bankDetails?.find((b) => b.id === bankId)?.bankName ||
        "Self (Cash)";

      const matchesSearch =
        !searchQuery ||
        clientName.toLowerCase().includes(q) ||
        invoiceNo.toLowerCase().includes(q) ||
        transId.toLowerCase().includes(q) ||
        method.toLowerCase().includes(q) ||
        bankName.toLowerCase().includes(q) ||
        (r.poolId || "").toLowerCase().includes(q);

      const matchesBank =
        filters.bankId === "ALL" ||
        (filters.bankId === "CASH"
          ? !bankId || bankId === "CASH"
          : bankId === filters.bankId);
      
      const matchesMode =
        filters.paymentMode === "ALL" || method === filters.paymentMode;

      const date = new Date(r.date);
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      const matchesDate = (!start || date >= start) && (!end || date <= end);

      return matchesSearch && matchesBank && matchesMode && matchesDate;
    };

    const received = [
      ...props.paymentRecords.filter((r) => r.type === "RECEIVE" && !r.poolId).map(r => ({ ...r, isBilling: false })),
      ...billingPayments.map(bp => ({ ...bp, isBilling: true, date: bp.date }))
    ].filter(applyRecordFilters)
     .reduce((sum, r) => sum + (r.amount || 0), 0);

    const generalPaid = props.paymentRecords
      .filter((r) => r.type === "PAY" && !r.poolId)
      .map(r => ({ ...r, isBilling: false }))
      .filter(applyRecordFilters)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const driverPaid = (props.salaries || [])
      .map(s => ({
        id: `payroll-${s.id}`,
        type: 'PAY',
        partyName: s.driverName || 'N/A',
        method: s.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (s.paymentMode as any),
        amount: s.totalAmount || 0,
        date: s.dateGiven || new Date().toISOString().split('T')[0],
        bankId: s.bankId || '',
        bankName: s.bankName || (s.bankId && props.banks.find(b => b.id === s.bankId)?.bankName) || 'Self (Cash)',
        transactionId: s.referenceNo || '',
        description: s.notes || `Driver Salary Payroll for ${s.month}`,
        isPayroll: true
      }))
      .filter(applyRecordFilters)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const employeePaid = (props.employeeSalaries || [])
      .map(s => ({
        id: `emp-payroll-${s.id}`,
        type: 'PAY',
        partyName: s.employeeName || 'N/A',
        method: s.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (s.paymentMode as any),
        amount: s.netAmount || 0,
        date: s.dateGiven || new Date().toISOString().split('T')[0],
        bankId: s.bankId || '',
        bankName: s.bankName || (s.bankId && props.banks.find(b => b.id === s.bankId)?.bankName) || 'Self (Cash)',
        transactionId: s.referenceNo || '',
        description: s.notes || `Employee Salary Payroll for ${s.salaryMonth}`,
        isEmployeePayroll: true
      }))
      .filter(applyRecordFilters)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const expensesPaid = (props.expenses || [])
      .filter(
        (e) =>
          e.category !== ExpenseCategory.DRIVER_SALARY &&
          e.category !== ExpenseCategory.EMPLOYEE_SALARY
      )
      .map(e => ({
        id: `expense-${e.id}`,
        type: 'PAY',
        partyName: e.vendorName || 'N/A',
        method: e.paymentMode === 'BANK' ? 'BANK_TRANSFER' : (e.paymentMode as any),
        amount: e.amount || 0,
        date: e.date || new Date().toISOString().split('T')[0],
        bankId: e.bankId || '',
        bankName: e.bankName || (e.bankId && props.banks.find(b => b.id === e.bankId)?.bankName) || 'Self (Cash)',
        transactionId: e.referenceNo || '',
        description: e.description || `Expense: ${formatCategory(e.category)}`,
        isExpense: true
      }))
      .filter(applyRecordFilters)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const maintenancePaid = (props.maintenance || [])
      .map(m => ({
        id: `maintenance-${m.id}`,
        type: 'PAY',
        partyName: m.workshopName || 'N/A',
        method: m.paymentMode === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : (m.paymentMode as any || 'CASH'),
        amount: m.amount || 0,
        date: m.date || new Date().toISOString().split('T')[0],
        bankId: '',
        bankName: 'Self (Cash)',
        transactionId: m.orderId || '',
        description: m.description || 'Vehicle Maintenance',
        isMaintenance: true
      }))
      .filter(applyRecordFilters)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const paid = generalPaid + driverPaid + employeePaid + expensesPaid + maintenancePaid;

    // Unpaid invoices only match search, date and status. 
    // They don't have bank/mode yet, so they are hidden if a specific bank/mode filter is active to prevent confusion.
    const unpaid = props.invoices
      .filter((inv) => {
        if (inv.status === "CANCELLED") return false;
        
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
          inv.clientName.toLowerCase().includes(q) || 
          inv.invoiceNumber.toLowerCase().includes(q);
          
        const date = new Date(inv.date);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const matchesDate = (!start || date >= start) && (!end || date <= end);
        
        // Bank and Mode filters don't apply to unpaid debt.
        // We set to 0 if these filters are active to signal they don't apply.
        const matchesBank = filters.bankId === "ALL";
        const matchesMode = filters.paymentMode === "ALL";

        return matchesSearch && matchesDate && matchesBank && matchesMode;
      })
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

    return { received, paid, unpaid, generalPaid, driverPaid, employeePaid, expensesPaid, maintenancePaid };
  }, [
    props.paymentRecords, 
    billingPayments, 
    props.invoices, 
    searchQuery, 
    filters, 
    props.banks, 
    props.settings.bankDetails,
    props.salaries,
    props.employeeSalaries,
    props.expenses,
    props.maintenance
  ]);

  const totalSalaries = props.salaries.reduce(
    (sum, s) => sum + s.totalAmount,
    0,
  ) + props.employeeSalaries.reduce(
    (sum, s) => sum + s.netAmount,
    0,
  );
  const totalExpenses = props.expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingApprovals = props.expenses.filter(
    (e) => e.status === ExpenseStatus.PENDING,
  ).length;

  const mergedLedger = useMemo(() => {
    const data: any[] = [
      ...props.expenses
        .filter(
          (e) =>
            e.category !== ExpenseCategory.DRIVER_SALARY &&
            e.category !== ExpenseCategory.EMPLOYEE_SALARY
        )
        .map((e) => ({
          id: e.id,
          date: e.date,
          title: formatCategory(e.category),
          subtitle: e.vendorName || e.description,
          amount: e.amount,
          type: "OUTFLOW",
          category: "EXPENSE",
          status: e.status,
          mode: e.paymentMode,
          truckId: e.truckId,
          raw: e,
        })),
      ...props.maintenance.map((m) => ({
        id: m.id,
        date: m.date,
        title: "MAINTENANCE",
        subtitle: `${m.workshopName}: ${m.description}`,
        amount: m.amount,
        type: "OUTFLOW",
        category: "MAINTENANCE",
        status: m.status === "PAID" ? "APPROVED" : "PENDING",
        mode: m.paymentMode === "BANK_TRANSFER" ? "BANK" : m.paymentMode || "CASH",
        truckId: m.truckId,
        raw: m,
      })),
      ...props.salaries.map((s) => ({
        id: s.id,
        date: s.dateGiven,
        title: "Driver Salary",
        subtitle: s.driverName,
        amount: s.totalAmount,
        type: "OUTFLOW",
        category: "PAYROLL",
        status: "PAID",
        mode: s.paymentMode,
        raw: s,
      })),
      ...props.employeeSalaries.map((s) => ({
        id: s.id,
        date: s.dateGiven,
        title: "Employee Salary",
        subtitle: s.employeeName,
        amount: s.netAmount,
        type: "OUTFLOW",
        category: "PAYROLL",
        status: "PAID",
        mode: s.paymentMode,
        raw: s,
      })),
      ...props.paymentRecords
        .filter(r => !r.poolId || r.type === 'RECEIVE') // Only hide PAY entries with poolId (duplicates Expense), but keep RECEIVE (refunds)
        .map((r) => ({
        id: r.id,
        date: r.date,
        title: r.poolId ? "PLANT ADVANCE RECOVERY" : (r.type === "RECEIVE" ? "Manual Receipt" : "Manual Payment"),
        subtitle: r.partyName || r.description,
        amount: r.amount,
        type: r.type === "RECEIVE" ? "INFLOW" : "OUTFLOW",
        category: r.poolId ? "EXPENSE" : (r.type === "RECEIVE" ? "RECEIPT_MANUAL" : "EXTERNAL_TRANSFER"),
        status: "PAID",
        mode: r.method,
        raw: r,
      })),
      ...props.bankTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        title: t.type === "RECEIVE_MONEY" ? "Bank Deposit" : "Bank Withdrawal",
        subtitle: t.description || (t.type === "RECEIVE_MONEY" ? t.fromWhere : t.toWhom),
        amount: t.amount,
        type: t.type === "RECEIVE_MONEY" ? "INFLOW" : "OUTFLOW",
        category: t.type === "RECEIVE_MONEY" ? "BANK_INFLOW" : "BANK_OUTFLOW",
        status: "PAID",
        mode: "BANK",
        raw: t,
      })),
      ...billingPayments.map((p) => ({
        id: p.id,
        date: p.date,
        title: "Billing Settlement",
        subtitle: `Inv: ${p.invoiceNumber} | ${p.clientName}`,
        amount: p.amount,
        type: "INFLOW",
        category: "INVOICE_SETTLEMENT",
        status: "PAID",
        mode: p.mode,
        raw: p,
      })),
    ];

    return data
      .filter((item) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        
        const matchesMode = filters.paymentMode === "ALL" || item.mode === filters.paymentMode;
        const matchesAmt = item.amount >= filters.minAmount && item.amount <= filters.maxAmount;
        const matchesType = filters.entity === "ALL" || item.type === filters.entity;
        const matchesCategory = filters.category === "ALL" || item.category === filters.category;

        const date = new Date(item.date);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const matchesDate = (!start || date >= start) && (!end || date <= end);

        return matchesSearch && matchesMode && matchesAmt && matchesType && matchesCategory && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [props.expenses, props.salaries, props.employeeSalaries, props.paymentRecords, props.bankTransactions, billingPayments, searchQuery, filters]);

  const cashFlowStats = useMemo(() => {
    const inflow = mergedLedger
      .filter(i => i.type === 'INFLOW')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    const outflow = mergedLedger
      .filter(i => i.type === 'OUTFLOW')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [mergedLedger]);

  const dailyPulseData = useMemo(() => {
    // Group last 30 days of data for the chart
    const days: { [key: string]: { inflow: number; outflow: number } } = {};
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last30Days.forEach(day => {
      days[day] = { inflow: 0, outflow: 0 };
    });

    mergedLedger.forEach(item => {
      if (days[item.date]) {
        if (item.type === 'INFLOW') days[item.date].inflow += item.amount;
        else days[item.date].outflow += item.amount;
      }
    });

    return last30Days.map(day => ({
      date: day,
      inflow: days[day].inflow,
      outflow: days[day].outflow,
      net: days[day].inflow - days[day].outflow
    }));
  }, [mergedLedger]);

  const categoryDistributionData = useMemo(() => {
    const cats: { [key: string]: number } = {};
    mergedLedger.forEach(item => {
      cats[item.category] = (cats[item.category] || 0) + (item.amount || 0);
    });
    return Object.entries(cats).map(([name, value]) => ({ 
      name: name.replace('_', ' '), 
      value 
    }));
  }, [mergedLedger]);

  const expensiveCategoryData = useMemo(() => {
    const cats: { [key: string]: number } = {};
    props.expenses.forEach(e => {
      const cat = (e.category || "General").replace("_", " ");
      cats[cat] = (cats[cat] || 0) + (e.amount || 0);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [props.expenses]);

  const payrollDistributionData = useMemo(() => {
    const drivers = props.salaries.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const employees = props.employeeSalaries.reduce((sum, s) => sum + (s.netAmount || 0), 0);
    return [
      { name: 'Drivers', value: drivers },
      { name: 'Staff', value: employees }
    ];
  }, [props.salaries, props.employeeSalaries]);

  const billingEfficiencyData = useMemo(() => {
    const realized = props.invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const total = props.invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pending = total - realized;
    return [
      { name: 'Collected', value: realized },
      { name: 'Pending', value: Math.max(0, pending) }
    ];
  }, [props.invoices]);

  const methodFrequencyData = useMemo(() => {
    const methods: { [key: string]: number } = {};
    mergedLedger.forEach(item => {
      const mode = item.mode || "CASH";
      methods[mode] = (methods[mode] || 0) + 1; // Count frequency
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [mergedLedger]);

  const advancesData = useMemo(() => {
    // 1. Calculate from ACTUAL data in Advance Command Hub (props.plantAdvances)
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    const filteredAdv = props.plantAdvances.filter(a => {
      const d = new Date(a.date);
      return (!start || d >= start) && (!end || d <= end);
    });

    const filteredPool = props.plantPool.filter(p => {
      const d = new Date(p.date);
      return (!start || d >= start) && (!end || d <= end) && p.transactionType === 'PAID';
    });

    const utilizedAdvances = props.plantAdvances.filter(a => {
      const d = new Date(a.date);
      return (!start || d >= start) && (!end || d <= end);
    });

    const poolTotal = filteredPool.reduce((sum, p) => sum + p.amount, 0);
    const utilizedTotal = utilizedAdvances.reduce((sum, a) => sum + a.amount, 0);

    const lifetimePoolTotal = props.plantPool.filter(p => p.transactionType === 'PAID').reduce((sum, p) => sum + p.amount, 0);
    const lifetimeUtilized = props.plantAdvances.reduce((sum, a) => sum + a.amount, 0);
    const remainingBalance = lifetimePoolTotal - lifetimeUtilized;

    // 2. Legacy fallback/ledger matching for other cards
    const isAdvance = (item: any) => 
      item.title.toLowerCase().includes('advance') || 
      item.subtitle.toLowerCase().includes('advance') ||
      (item.raw?.description || "").toLowerCase().includes('advance');
    
    const ledgerAdvances = mergedLedger.filter(isAdvance);
    
    return {
      total: ledgerAdvances.reduce((sum, a) => sum + a.amount, 0),
      plantTotal: poolTotal, // Lifetime Advance added to pool is the actual Expense/Outflow
      lifetimePlantTotal: lifetimePoolTotal,
      issuedTotal: utilizedTotal,
      poolDepositTotal: poolTotal,
      utilizedTotal,
      lifetimeUtilized,
      remainingBalance,
      count: filteredPool.length,
      tpsCount: filteredAdv.length,
      methodBreakdown: filteredPool.reduce((acc: any, a: any) => {
        const m = (a.paymentMethod || 'CASH').toUpperCase();
        acc[m] = (acc[m] || 0) + a.amount;
        return acc;
      }, {})
    };
  }, [mergedLedger, props.plantAdvances, props.plantPool, filters]);

  const advanceMethodChart = useMemo(() => {
    return Object.entries(advancesData.methodBreakdown).map(([name, value]) => ({ name, value }));
  }, [advancesData]);

  const inflowDistributionData = useMemo(() => {
    const manualResources = props.paymentRecords.filter(r => r.type === 'RECEIVE' && !r.poolId);
    const manualTotal = manualResources.reduce((sum, r) => sum + r.amount, 0);
    const billingTotal = props.invoices.reduce((sum, inv) => 
      sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0), 0);
    const bankTotal = props.bankTransactions.filter(t => t.type === 'RECEIVE_MONEY').reduce((sum, t) => sum + t.amount, 0);

    return {
      chart: [
        { name: 'Manual Receipts', value: manualTotal, count: manualResources.length },
        { name: 'Billing Invoices', value: billingTotal, count: props.invoices.reduce((sum, inv) => sum + inv.payments.length, 0) },
        { name: 'Bank Deposits', value: bankTotal, count: props.bankTransactions.filter(t => t.type === 'RECEIVE_MONEY').length }
      ],
      manualTotal,
      manualCount: manualResources.length
    };
  }, [props.paymentRecords, props.invoices, props.bankTransactions]);

  useEffect(() => {
    setLedgerPage(1);
  }, [searchQuery, filters]);
  useEffect(() => {
    setBankPage(1);
  }, [searchQuery]);
  useEffect(() => {
    setExpensePage(1);
  }, [searchQuery, filters]);

  const paginatedLedger = useMemo(() => {
    return mergedLedger.slice(
      (ledgerPage - 1) * rowsPerPage,
      ledgerPage * rowsPerPage,
    );
  }, [mergedLedger, ledgerPage]);

  const totalLedgerPages = Math.ceil(mergedLedger.length / rowsPerPage);

  const paginatedBankTrans = useMemo(() => {
    return props.bankTransactions
      .filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice((bankPage - 1) * rowsPerPage, bankPage * rowsPerPage);
  }, [props.bankTransactions, searchQuery, bankPage]);

  const totalBankPages = Math.ceil(
    props.bankTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()),
    ).length / rowsPerPage,
  );

  const paginatedExpenses = useMemo(() => {
    return props.expenses
      .filter(
        (e) =>
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.vendorName || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (e.poolId || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice((expensePage - 1) * rowsPerPage, expensePage * rowsPerPage);
  }, [props.expenses, searchQuery, expensePage]);

  const totalExpensePages = Math.ceil(
    props.expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.vendorName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.poolId || "").toLowerCase().includes(searchQuery.toLowerCase()),
    ).length / rowsPerPage,
  );

  const chartData = useMemo(() => {
    // Generate last 7 days distribution
    return [
      {
        name: "Fuel",
        value: props.expenses
          .filter((e) => e.category === ExpenseCategory.DIESEL)
          .reduce((a, b) => a + b.amount, 0),
      },
      { name: "Salary", value: totalSalaries },
      {
        name: "Toll",
        value: props.expenses
          .filter((e) => e.category === ExpenseCategory.TOLL_FASTAG)
          .reduce((a, b) => a + b.amount, 0),
      },
      {
        name: "Maint.",
        value: props.expenses
          .filter((e) => e.category === ExpenseCategory.MAINTENANCE)
          .reduce((a, b) => a + b.amount, 0),
      },
    ];
  }, [props.expenses, totalSalaries]);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Main Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Wallet size={32} className="text-blue-600" /> Accountability Hub
          </h2>
          <p className="text-slate-500 font-medium">
            Unified financial governance for payroll and operations.
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {(
            [
              "LEDGER",
              "PAYROLL",
              "EMP_PAYROLL",
              "EXPENSES",
              "PLANT_ADVANCES",
              "BANK",
              "PAYMENTS",
              "AUDIT",
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {tab === "PAYMENTS"
                ? "Methods"
                : tab === "LEDGER"
                  ? "Cash Flow"
                  : tab === "EMP_PAYROLL"
                    ? "Emp Salary"
                    : tab === "PLANT_ADVANCES"
                      ? "Plant Advances"
                      : tab.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "LEDGER" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <ArrowDownRight size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Manual Receipts</h4>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{inflowDistributionData.manualTotal.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">{inflowDistributionData.manualCount} manual entries counted</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Fuel size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Exp</h4>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{totalExpenses.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Total operational burn rate</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Plant Advances (Pool Outflow)</h4>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{advancesData.poolDepositTotal.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">₹{advancesData.utilizedTotal.toLocaleString()} utilized in {advancesData.tpsCount} TPS advances</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Billing Realized</h4>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{billingEfficiencyData[0].value.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">₹{billingEfficiencyData[1].value.toLocaleString()} pending</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Payroll</h4>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{(payrollDistributionData[0].value + payrollDistributionData[1].value).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">Staff & Driver liability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownRight size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Inflow</h4>
                  <p className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">₹{cashFlowStats.inflow.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Outflow</h4>
                  <p className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">₹{cashFlowStats.outflow.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min((cashFlowStats.outflow / (cashFlowStats.inflow || 1)) * 100, 100)}%` }} />
              </div>
            </div>

            <div className={`${cashFlowStats.net >= 0 ? 'bg-blue-600' : 'bg-slate-900'} p-8 rounded-[2.5rem] shadow-xl transition-all hover:shadow-2xl group relative overflow-hidden text-white`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingDown size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Net Balance</h4>
                    <p className="text-2xl font-black text-white mt-1.5 tracking-tight">₹{cashFlowStats.net.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                  {cashFlowStats.net >= 0 ? <CheckCircle2 size={12} className="text-emerald-400" /> : <AlertCircle size={12} className="text-amber-400" />}
                  {cashFlowStats.net >= 0 ? "Profit in selected period" : "Deficit in selected period"}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl transition-all hover:shadow-2xl group relative overflow-hidden text-white flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                <IndianRupee size={100} />
              </div>
              <div className="relative z-10 w-full space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Across All Stations</p>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">Advance Command Hub</p>
                </div>
                
                <p className="text-2xl font-black tracking-tighter mt-2 text-white">
                  ₹{advancesData.remainingBalance.toLocaleString()}
                  <span className="text-[9px] font-bold block text-white/50 uppercase mt-1 tracking-wider font-sans leading-none">Remaining Advance Balance</span>
                </p>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-white/60 uppercase tracking-tighter">Total Lifetime Advance</span>
                    <span className="text-blue-400 font-extrabold">₹{advancesData.lifetimePlantTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <div className="flex flex-col">
                      <span className="text-white/60 leading-none uppercase tracking-tighter">Operational Debits</span>
                      <span className="text-[8px] text-white/40 uppercase tracking-tighter mt-0.5">Total Utilized Payment</span>
                    </div>
                    <span className="text-rose-400 font-extrabold">₹{advancesData.lifetimeUtilized.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search Matrix */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-6 bg-slate-50/50">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Universal Search: ID, Vendor, Party, Invoice, Desk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${showFilters ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  <SlidersHorizontal size={16} /> Advanced Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300 border-b border-slate-100 bg-white">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date Range</label>
                   <div className="grid grid-cols-2 gap-2">
                     <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                     <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Movement Type
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.entity}
                    onChange={(e) =>
                      setFilters({ ...filters, entity: e.target.value })
                    }
                  >
                    <option value="ALL">All Movements</option>
                    <option value="INFLOW">Incoming Money</option>
                    <option value="OUTFLOW">Outgoing Money</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                  >
                    <option value="ALL">All Categories</option>
                    <option value="BILLING">Billing Inflow</option>
                    <option value="EXPENSE">Operational OpEx</option>
                    <option value="PAYROLL">Payroll / Salaries</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BANK_TRANSFER">Manual Adjustments</option>
                    <option value="EXTERNAL_TRANSFER">General Rec/Pay</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Payment Mode
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.paymentMode}
                    onChange={(e) =>
                      setFilters({ ...filters, paymentMode: e.target.value })
                    }
                  >
                    <option value="ALL">All Modes</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="BANK">Bank / RTGS / NEFT</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Transfer</option>
                  </select>
                </div>
                <div className="col-span-1 flex items-end">
                   <button 
                     onClick={() => setFilters({
                       startDate: "", endDate: "", minAmount: 0, maxAmount: 5000000, 
                       entity: "ALL", status: "ALL", paymentMode: "ALL", category: "ALL", bankId: "ALL"
                     })}
                     className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     Reset Filters
                   </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Txn Date & Summary
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Method
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Flow
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedLedger.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-default"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${item.type === "INFLOW" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                          >
                            {item.type === "INFLOW" ? (
                              <ArrowDownRight size={22} />
                            ) : (
                              <ArrowUpRight size={22} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                              {item.date} • {item.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border bg-white text-slate-500 border-slate-200">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.mode || 'CASH'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${item.type === 'INFLOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                           {item.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-lg font-black tracking-tighter ${item.type === 'INFLOW' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {item.type === 'INFLOW' ? '+' : '-'} ₹{(item.amount || 0).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {paginatedLedger.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <Calculator
                            size={64}
                            className="mx-auto text-slate-100"
                          />
                          <p className="text-sm font-black text-slate-300 uppercase tracking-widest">
                            No flow data matching your search criteria.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page {ledgerPage} of {totalLedgerPages || 1}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={ledgerPage === 1}
                      onClick={() => setLedgerPage(ledgerPage - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={ledgerPage >= totalLedgerPages}
                      onClick={() => setLedgerPage(ledgerPage + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {mergedLedger.length} Records Detected
                </p>
              </div>
            </div>
          </div>

          {/* Visualization Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[500px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                    <Zap size={24} className="text-blue-600" /> Cash Flow Analytics
                  </h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Real-time Inflow vs Outflow (Last 30 Days)</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Inflow
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Outflow
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyPulseData}>
                    <defs>
                      <linearGradient id="colIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} hide/>
                    <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}/>
                    <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} />
                    <Area type="monotone" dataKey="inflow" stroke="#10b981" fill="url(#colIn)" strokeWidth={3} stackId="1" />
                    <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="url(#colOut)" strokeWidth={3} stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col h-[500px]">
              <h3 className="text-xl font-black mb-8 tracking-tighter uppercase">Category Distribution</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {COLORS.map((color, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Transactions</span>
                  <span className="text-white">{mergedLedger.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Dive Analysis Section */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-4 px-4">
              <div className="w-1.5 h-12 bg-blue-600 rounded-full" />
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Deep Dive Analysis</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Statistical breakups of business verticals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Inflow Composition Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownRight size={16} className="text-violet-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Inflow Composition</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Receipts vs Billing vs Bank Deposits</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inflowDistributionData.chart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <div className="space-y-1">
                    {inflowDistributionData.chart.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-violet-500' : (i === 1 ? 'bg-emerald-500' : 'bg-blue-500')}`} />
                           <span className="text-[10px] font-black text-slate-500 uppercase">{p.name} ({p.count})</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-900">₹{p.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expensive Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[400px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <History size={16} className="text-rose-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Expensive Breakdown</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 5 OpEx Categories</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensiveCategoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        {expensiveCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <table className="w-full text-[9px] font-bold">
                    <tbody>
                      {expensiveCategoryData.map((cat, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 h-6">
                           <td className="text-slate-500 whitespace-nowrap">{cat.name}</td>
                           <td className="text-right text-slate-900">₹{cat.value.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advance Hub Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-amber-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Advance Hub (Plant)</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advances by Payment Mode</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={advanceMethodChart}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        {advanceMethodChart.map((_, i) => <Cell key={i} fill={['#f59e0b', '#3b82f6', '#10b981', '#ef4444'][i % 4]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-2 rounded-lg">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Total Volume</p>
                       <p className="text-sm font-black text-slate-900">₹{advancesData.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                       <p className="text-[8px] font-black text-amber-600 uppercase">Plant Subset</p>
                       <p className="text-sm font-black text-amber-700">₹{advancesData.plantTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Hub Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-emerald-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Billing Efficiency</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collected vs Pending Amount</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={billingEfficiencyData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4 space-y-2">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-emerald-600">Paid Invoices</span>
                      <span className="text-slate-900">{props.invoices.filter(i => i.status === 'PAID').length}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-amber-600">Partially Paid</span>
                      <span className="text-slate-900">{props.invoices.filter(i => i.paidAmount > 0 && i.paidAmount < i.totalAmount).length}</span>
                   </div>
                </div>
              </div>

              {/* Salary Payroll Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-indigo-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Salary Payrolls</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drivers vs Employee Staff</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={payrollDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#a855f7" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <div className="space-y-1">
                    {payrollDistributionData.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-purple-500'}`} />
                           <span className="text-[10px] font-black text-slate-500 uppercase">{p.name}</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-900">₹{p.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Methods Analysis */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[520px]">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator size={16} className="text-blue-500" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Payment Methods</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Frequency by Mode</p>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodFrequencyData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={70}
                        innerRadius={50}
                        paddingAngle={5}
                      >
                        {methodFrequencyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 border-t border-slate-50 pt-4 overflow-y-auto max-h-24 no-scrollbar">
                  <table className="w-full text-[9px] font-bold">
                    <thead>
                       <tr className="text-slate-400 uppercase border-b border-slate-50 whitespace-nowrap">
                         <th className="text-left pb-1 font-black">Mode</th>
                         <th className="text-right pb-1 font-black">Txns</th>
                       </tr>
                    </thead>
                    <tbody>
                      {methodFrequencyData.map((m, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 h-6">
                           <td className="text-slate-600 uppercase">{m.name}</td>
                           <td className="text-right text-slate-900">{m.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "PAYROLL" && (
        <SalaryView
          drivers={props.drivers}
          salaries={props.salaries}
          settings={props.settings}
          banks={props.banks}
          onAddSalary={props.onAddSalary}
          onUpdateSalary={props.onUpdateSalary}
          onDeleteSalary={props.onDeleteSalary}
        />
      )}

      {activeTab === "EMP_PAYROLL" && (
        <EmployeeSalaryView
          employees={props.employees}
          employeeSalaries={props.employeeSalaries}
          settings={props.settings}
          banks={props.banks}
          onAddSalary={props.onAddEmployeeSalary}
          onUpdateSalary={props.onUpdateEmployeeSalary}
          onDeleteSalary={props.onDeleteEmployeeSalary}
        />
      )}

      {activeTab === "EXPENSES" && (
        <ExpensesView
          expenses={props.expenses}
          maintenance={props.maintenance}
          orders={props.orders}
          trucks={props.trucks}
          activeRole={props.activeRole}
          onAddExpense={props.onAddExpense}
          onUpdateExpense={props.onUpdateExpense}
          onDeleteExpense={props.onDeleteExpense}
          banks={props.banks}
        />
      )}

      {activeTab === "BANK" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Bank Transactions
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Record and track all bank-level movements.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBankTransaction(null);
                setBankForm({
                  bankId: "",
                  bankName: "",
                  type: "RECEIVE_MONEY",
                  fromWhere: "",
                  toWhom: "",
                  amount: 0,
                  date: new Date().toISOString().split("T")[0],
                  checkNo: "",
                  neftUpiId: "",
                  description: "",
                });
                setIsBankModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all"
            >
              <Plus size={16} /> New Transaction
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBankTrans.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 ${t.type === "RECEIVE_MONEY" ? "border-l-emerald-500" : "border-l-rose-500"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${t.type === "RECEIVE_MONEY" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                    >
                      {t.type === "RECEIVE_MONEY" ? (
                        <ArrowDownRight size={24} />
                      ) : (
                        <ArrowUpRight size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg leading-none">
                        {t.bankName}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                        {t.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingBankTransaction(t);
                        setBankForm(t);
                        setIsBankModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <History size={16} />
                    </button>
                    <button
                      onClick={() => props.onDeleteBankTransaction(t.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t.type === "RECEIVE_MONEY" ? "From" : "To"}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {t.type === "RECEIVE_MONEY" ? t.fromWhere : t.toWhom}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{(t.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-50 grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">
                        Check No
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">
                        {t.checkNo || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase">
                        NEFT/UPI
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 truncate">
                        {t.neftUpiId || "N/A"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic line-clamp-2">
                    {t.description}
                  </p>
                </div>
              </div>
            ))}
            {props.bankTransactions.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <Banknote size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                  No bank transactions recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "PLANT_ADVANCES" && (
        <div className="space-y-8 animate-in fade-in duration-500" id="plant-advances-content">
           <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5">
               <Package size={200} />
             </div>
             <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
               <div className="flex-1 space-y-6">
                 <div>
                   <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Advance Command Intelligence</h3>
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                     Plant Advance <span className="text-blue-600">Governance</span>
                   </h2>
                   <p className="text-slate-500 font-medium text-lg mt-6 leading-relaxed max-w-xl">
                     Operational oversight of lifetime advances and liquidity pools deployed via Advance Command Intelligence.
                   </p>
                 </div>
                 
                 <div className="flex flex-wrap gap-4 pt-4">
                   <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Scope</p>
                     <p className="text-sm font-black text-slate-900">
                       {filters.startDate || 'Beginning'} — {filters.endDate || 'Present'}
                     </p>
                   </div>
                   <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Deployments</p>
                     <p className="text-sm font-black text-slate-900">{advancesData.count} Entities</p>
                   </div>
                 </div>
               </div>

               <div className="w-full lg:w-[450px] bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                   <IndianRupee size={80} />
                 </div>
                 <div className="relative z-10">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Across All Stations</p>
                     <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Liquid Capital</p>
                   </div>
                   <p className="text-5xl font-black tracking-tighter mt-4" id="liquid-capital-value">₹{advancesData.remainingBalance.toLocaleString()}</p>
                   
                   <div className="mt-8 space-y-4 pt-8 border-t border-white/10">
                     <div className="flex justify-between items-center text-xs font-bold" id="total-lifetime-advance">
                       <span className="text-white/60 uppercase tracking-tighter">Total Lifetime Advance</span>
                       <span className="text-blue-400">₹{advancesData.lifetimePlantTotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold" id="operational-debits">
                       <div className="flex flex-col">
                         <span className="text-white/60 leading-none uppercase tracking-tighter">Operational Debits</span>
                         <span className="text-[8px] text-white/40 uppercase mt-1 tracking-tighter italic">Total Utilized Payment</span>
                       </div>
                       <span className="text-rose-400 font-black">₹{advancesData.lifetimeUtilized.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-bold" id="remaining-balance-metric">
                       <span className="text-white/60 uppercase tracking-tighter">Remaining Advance Balance</span>
                       <span className="text-emerald-400 font-black italic">₹{advancesData.remainingBalance.toLocaleString()}</span>
                     </div>
                   </div>
                   
                   <div className="mt-10 p-4 bg-white/10 rounded-2xl flex items-center gap-3 border border-white/5">
                     <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                       <Calculator size={16} />
                     </div>
                     <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tight">Advance Command Validated</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm overflow-hidden relative">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Landmark size={14} className="text-blue-600" /> Station Liquidity Status
                </h4>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {props.sites.filter(s => s.type === 'TPS').map(site => {
                    const pool = props.plantPool.filter(p => p.stationId === site.id && p.transactionType === 'PAID').reduce((sum, p) => sum + p.amount, 0);
                    const issued = props.plantAdvances.filter(a => a.stationId === site.id).reduce((sum, a) => sum + a.amount, 0);
                    const net = pool - issued;
                    return (
                      <div key={site.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{site.name}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pool Funding: <span className="text-blue-600 font-extrabold">₹{pool.toLocaleString()}</span></span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Utilized: <span className="font-extrabold">₹{issued.toLocaleString()}</span></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Station Liquidity</p>
                          <p className={`text-lg font-black tracking-tight ${net > 0 ? 'text-emerald-600' : net === 0 ? 'text-slate-400' : 'text-red-500'}`}>₹{net.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Zap size={14} className="text-blue-600" /> Fund Distribution
                </h4>
                <div className="space-y-8">
                  {props.sites.filter(s => s.type === 'TPS').map(site => {
                    const pool = props.plantPool.filter(p => p.stationId === site.id && p.transactionType === 'PAID').reduce((sum, p) => sum + p.amount, 0);
                    const issued = props.plantAdvances.filter(a => a.stationId === site.id).reduce((sum, a) => sum + a.amount, 0);
                    const net = pool - issued;
                    const percentage = Math.min(((net / (advancesData.remainingBalance || 1)) * 100), 100);
                    return (
                      <div key={site.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                             <p className="text-[10px] font-black text-slate-700 uppercase">{site.name}</p>
                           </div>
                           <p className="text-[10px] font-black text-slate-900 tracking-tighter">₹{net.toLocaleString()} <span className="text-slate-400 ml-1">({percentage.toFixed(1)}%)</span></p>
                        </div>
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                           <div 
                             className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                             style={{ width: `${percentage}%` }}
                           />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] text-white">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Liquidity Dispersion Matrix</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/60 uppercase">Max Station Pool</p>
                      <p className="text-lg font-black text-blue-400">
                        ₹{Math.max(...props.sites.filter(s => s.type === 'TPS').map(site => {
                          const pool = props.plantPool.filter(p => p.stationId === site.id && p.transactionType === 'PAID').reduce((sum, p) => sum + p.amount, 0);
                          const issued = props.plantAdvances.filter(a => a.stationId === site.id).reduce((sum, a) => sum + a.amount, 0);
                          return pool - issued;
                        })).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/60 uppercase">System Liquidity</p>
                      <p className="text-lg font-black text-emerald-400">
                        {((advancesData.remainingBalance / (advancesData.lifetimePlantTotal || 1)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Bank Transaction Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">
                {editingBankTransaction
                  ? "Edit Transaction"
                  : "New Bank Transaction"}
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedBank = props.banks.find(
                  (b) => b.id === bankForm.bankId,
                );
                const finalData = {
                  ...bankForm,
                  bankName: selectedBank ? selectedBank.bankName : "",
                  id: editingBankTransaction
                    ? editingBankTransaction.id
                    : `BT-${Date.now()}`,
                } as BankTransaction;

                if (editingBankTransaction) {
                  props.onUpdateBankTransaction(finalData);
                } else {
                  props.onAddBankTransaction(finalData);
                }
                setIsBankModalOpen(false);
              }}
              className="p-8 space-y-6 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Select Bank*
                  </label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={bankForm.bankId ?? ""}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, bankId: e.target.value })
                    }
                  >
                    <option value="">Choose Bank...</option>
                    {props.banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber?.slice(-4) || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Transaction Type*
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBankForm({ ...bankForm, type: "RECEIVE_MONEY" })
                      }
                      className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-1.5 ${bankForm.type === "RECEIVE_MONEY" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-100 text-slate-400 bg-slate-50"}`}
                    >
                      <ArrowDownRight size={14} /> Receive
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBankForm({ ...bankForm, type: "PAID_MONEY" })
                      }
                      className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-1.5 ${bankForm.type === "PAID_MONEY" ? "border-rose-500 bg-rose-50 text-rose-900" : "border-slate-100 text-slate-400 bg-slate-50"}`}
                    >
                      <ArrowUpRight size={14} /> Paid
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    {bankForm.type === "RECEIVE_MONEY"
                      ? "Receive From Where*"
                      : "Paid To Whom*"}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={
                      bankForm.type === "RECEIVE_MONEY"
                        ? bankForm.fromWhere
                        : bankForm.toWhom
                    }
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        [bankForm.type === "RECEIVE_MONEY"
                          ? "fromWhere"
                          : "toWhom"]: e.target.value,
                      })
                    }
                    placeholder={
                      bankForm.type === "RECEIVE_MONEY"
                        ? "e.g. Client Name"
                        : "e.g. Vendor Name"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Amount (₹)*
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={bankForm.amount ?? 0}
                    onChange={(e) =>
                      setBankForm({
                        ...bankForm,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Date*
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={bankForm.date ?? ""}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Check No
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={bankForm.checkNo ?? ""}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, checkNo: e.target.value })
                    }
                    placeholder="e.g. 123456"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    NEFT / UPI ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={bankForm.neftUpiId ?? ""}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, neftUpiId: e.target.value })
                    }
                    placeholder="Ref ID..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  Description
                </label>
                <textarea
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  rows={2}
                  value={bankForm.description ?? ""}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, description: e.target.value })
                  }
                  placeholder="Transaction details..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all"
              >
                {editingBankTransaction
                  ? "Update Transaction"
                  : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "PAYMENTS" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Accountability Hub • Methods
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Verified cash and bank movement registry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setPaymentSubTab("RECEIVE")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentSubTab === "RECEIVE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Receive History
                </button>
                <button
                  onClick={() => setPaymentSubTab("PAY")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentSubTab === "PAY" ? "bg-white text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Payment History
                </button>
                <button
                  onClick={() => setPaymentSubTab("BILLING")}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentSubTab === "BILLING" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Billing Hub
                </button>
              </div>
              <button
                onClick={() => {
                  setEditingPaymentRecord(null);
                  setPaymentForm({
                    type:
                      paymentSubTab === "BILLING" ? "RECEIVE" : paymentSubTab,
                    partyName: "",
                    method: "CASH",
                    amount: 0,
                    date: new Date().toISOString().split("T")[0],
                    bankId: "",
                    bankName: "",
                    transactionId: "",
                    chequeNo: "",
                    description: "",
                  });
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all"
              >
                <Plus size={16} /> New{" "}
                {paymentSubTab === "PAY" ? "Payment" : "Receipt"}
              </button>
            </div>
          </div>

          {/* Payment Method Stats Carousel/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shadow-emerald-100">
                <ArrowDownRight size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Payment Received</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">₹</span>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {paymentMethodStats.received.toLocaleString()}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                  Mnl: {props.paymentRecords.filter(r => r.type === 'RECEIVE').length} • Bill: {billingPayments.length}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shadow-rose-100">
                <ArrowUpRight size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Payment Paid To</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">₹</span>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {paymentMethodStats.paid.toLocaleString()}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">
                  Mnl: ₹{paymentMethodStats.generalPaid.toLocaleString()} • Driver: ₹{paymentMethodStats.driverPaid.toLocaleString()} • Emp: ₹{paymentMethodStats.employeePaid.toLocaleString()} • Exp: ₹{paymentMethodStats.expensesPaid.toLocaleString()} • Maint: ₹{paymentMethodStats.maintenancePaid.toLocaleString()}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lifetime Advance Ledger (Credits)</p>
                  <p className="text-xs font-black text-rose-600">₹{advancesData.lifetimePlantTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
              <div className="w-16 h-16 rounded-[1.5rem] bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shadow-amber-100">
                <Calculator size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Payment Unpaid</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">₹</span>
                  <p className="text-3xl font-black text-amber-600 tracking-tighter">
                    {paymentMethodStats.unpaid.toLocaleString()}
                  </p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Outstanding Billing Balance</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Matrix for Payments */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-6 bg-slate-50/50">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search: Client, Bank, Trans ID, Method, Invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${showFilters ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  <SlidersHorizontal size={16} /> Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300 border-b border-slate-100 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Select Bank
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.bankId}
                    onChange={(e) =>
                      setFilters({ ...filters, bankId: e.target.value })
                    }
                  >
                    <option value="ALL">All Accounts</option>
                    <option value="CASH">Cash (Hand)</option>
                    {props.settings.bankDetails?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNo?.slice(-4) || "N/A"}
                      </option>
                    ))}
                    {props.banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Method
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.paymentMode}
                    onChange={(e) =>
                      setFilters({ ...filters, paymentMode: e.target.value })
                    }
                  >
                    <option value="ALL">All Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {(paymentSubTab === "BILLING" || paymentSubTab === "RECEIVE") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none text-blue-600">
                          Billing Registry
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Pending Collections & Invoices
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {pendingInvoices.length === 0 ? (
                      <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                        All invoices are cleared
                      </div>
                    ) : (
                      pendingInvoices.slice(0, 5).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-5 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-3xl transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                              <Hash size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">
                                {inv.invoiceNumber}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500">
                                {inv.clientName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-xs font-black text-blue-600">
                                ₹
                                {(
                                  inv.totalAmount - inv.paidAmount
                                ).toLocaleString()}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">
                                Balance
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv);
                                setPaymentForm({
                                  ...paymentForm,
                                  amount: inv.totalAmount - inv.paidAmount,
                                  partyName: inv.clientName,
                                });
                                setInvoicePaymentMode("CASH");
                                setIsInvoicePaymentModalOpen(true);
                              }}
                              className="px-4 py-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            >
                              Add Payment
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 opacity-80">
                    Total Outstanding
                  </p>
                  <p className="text-4xl font-black mt-2 tracking-tighter">
                    ₹
                    {pendingInvoices
                      .reduce(
                        (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
                        0,
                      )
                      .toLocaleString()}
                  </p>
                  <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-100">
                      <span>Pending Invoices</span>
                      <span>{pendingInvoices.length}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-100">
                      <span>Total Billed</span>
                      <span>
                        ₹
                        {props.invoices
                          .reduce((sum, inv) => sum + inv.totalAmount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 text-slate-900">
                    Billing Analytics
                  </h5>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          ₹
                          {props.invoices
                            .reduce((sum, inv) => sum + inv.paidAmount, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Received Amount
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          ₹
                          {pendingInvoices
                            .reduce(
                              (sum, inv) =>
                                sum + (inv.totalAmount - inv.paidAmount),
                              0,
                            )
                            .toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Unpaid Amount
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {paymentSubTab === "RECEIVE"
                  ? "Receive History (Manual + Billing)"
                  : paymentSubTab === "PAY"
                    ? "Payment History"
                    : "Billing Entry History"}
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Transaction
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Method
                    </th>
                    {paymentSubTab === "RECEIVE" ? (
                      <>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Received From (Client/Party)
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Credited To
                        </th>
                      </>
                    ) : paymentSubTab === "PAY" ? (
                      <>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Paid From
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Paid To (Party Name)*
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Receive From Where (Client Name)*
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Select Bank*
                        </th>
                      </>
                    )}
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Amount (₹)
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Transaction ID*
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Description
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-default"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${r.isBilling || r.type === "RECEIVE" ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              r.isBilling || r.type === "RECEIVE"
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {r.isBilling ? "BILLING" : r.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600">
                          {r.isBilling ? (
                            <>
                              {r.mode === "CASH" ? (
                                <Wallet
                                  size={14}
                                  className="text-emerald-500"
                                />
                              ) : r.mode === "CHEQUE" ? (
                                <Banknote
                                  size={14}
                                  className="text-amber-500"
                                />
                              ) : r.mode === "UPI" ? (
                                <Zap size={14} className="text-indigo-500" />
                              ) : (
                                <Landmark size={14} className="text-blue-500" />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-tight">
                                {r.mode}
                              </span>
                            </>
                          ) : (
                            <>
                              {r.method === "CASH" ? (
                                <Wallet
                                  size={14}
                                  className="text-emerald-500"
                                />
                              ) : r.method === "BANK_TRANSFER" ? (
                                <Landmark size={14} className="text-blue-500" />
                              ) : r.method === "UPI" ? (
                                <Zap size={14} className="text-indigo-500" />
                              ) : (
                                <Banknote
                                  size={14}
                                  className="text-amber-500"
                                />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-tight">
                                {(r.method || "").replace("_", " ")}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      {paymentSubTab === "RECEIVE" ? (
                        <>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                                {r.partyName || r.clientName || "N/A"}
                              </p>
                              {r.isBilling && (
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">
                                  Inv: {r.invoiceNumber}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                              {r.bankName || (r.bankId && props.banks.find(b => b.id === r.bankId)?.bankName) || "Self (Cash)"}
                            </p>
                          </td>
                        </>
                      ) : paymentSubTab === "PAY" ? (
                        <>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                              {r.bankName || "Self (Cash)"}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[150px] font-black">
                              {r.partyName || "N/A"}
                            </p>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                                {r.clientName || r.fromWhere || "N/A"}
                              </p>
                              <p className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">
                                Inv: {r.invoiceNumber}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">
                              {props.banks.find((b) => b.id === r.bankId)
                                ?.bankName ||
                                props.settings.bankDetails?.find(
                                  (b) => b.id === r.bankId,
                                )?.bankName ||
                                "Self (Cash)"}
                            </p>
                          </td>
                        </>
                      )}
                      <td className="px-8 py-6">
                        <p
                          className={`text-sm font-black tracking-tighter ${paymentSubTab === "PAY" ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          ₹{(r.amount || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-500">
                          {r.date}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px]">
                          {r.isBilling
                            ? r.referenceNo
                            : r.transactionId || r.chequeNo || "N/A"}
                        </p>
                      </td>
                      <td className="px-8 py-6 max-w-[200px]">
                        <div className="space-y-1">
                          {r.poolId && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-tighter border border-blue-100 mb-1">
                              PLANT ADVANCE • {r.poolId}
                            </span>
                          )}
                          <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">
                            {r.poolId
                              ? (r.description || "")
                                  .replace(`[POOL: ${r.poolId}]`, "")
                                  .trim() || "-"
                              : r.isBilling
                                ? r.note || `Invoice: ${r.invoiceNumber}`
                                : r.description || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!r.isBilling && !r.isPayroll && !r.isEmployeePayroll && !r.isExpense && !r.isMaintenance ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPaymentRecord(r);
                                  setPaymentForm(r);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <History size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  props.onDeletePaymentRecord(r.id)
                                }
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase italic px-2 py-1">
                              {r.isBilling ? "Synced from Invoice" : r.isPayroll || r.isEmployeePayroll ? "Synced from Payroll" : r.isExpense ? "Synced from Expense" : "Synced from Maintenance"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-8 py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs"
                      >
                        No records matching your search/filters were found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Record Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">
                {editingPaymentRecord
                  ? "Edit Payment Record"
                  : "New Payment Record"}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedBank = props.settings.bankDetails?.find(
                  (b) => b.id === paymentForm.bankId,
                );
                const finalData = {
                  ...paymentForm,
                  bankName: selectedBank
                    ? selectedBank.bankName
                    : paymentForm.bankName,
                  id: editingPaymentRecord
                    ? editingPaymentRecord.id
                    : `PR-${Date.now()}`,
                } as PaymentRecord;

                if (editingPaymentRecord) {
                  props.onUpdatePaymentRecord(finalData);
                } else {
                  props.onAddPaymentRecord(finalData);
                }
                setIsPaymentModalOpen(false);
              }}
              className="p-8 space-y-6 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Transaction Type*
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentForm({ ...paymentForm, type: "RECEIVE" })
                      }
                      className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-1.5 ${paymentForm.type === "RECEIVE" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-100 text-slate-400 bg-slate-50"}`}
                    >
                      <ArrowDownRight size={14} /> Receive
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentForm({ ...paymentForm, type: "PAY" })
                      }
                      className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all flex items-center justify-center gap-1.5 ${paymentForm.type === "PAY" ? "border-rose-500 bg-rose-50 text-rose-900" : "border-slate-100 text-slate-400 bg-slate-50"}`}
                    >
                      <ArrowUpRight size={14} /> Pay
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Method*
                  </label>
                  <select
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        method: e.target.value as any,
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  {paymentForm.type === "RECEIVE"
                    ? "Receive From Where (Client Name) or Party Name*"
                    : "Party Name / Paid To*"}
                </label>
                <input
                  type="text"
                  required
                  list="party-names"
                  placeholder="Enter Client Name or Party Name"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  value={paymentForm.partyName || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      partyName: e.target.value,
                    })
                  }
                />
                <datalist id="party-names">
                  {clientNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Amount (₹)*
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={paymentForm.amount ?? 0}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Date*
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={paymentForm.date || ""}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Transaction ID*
                  </label>
                  <input
                    type="text"
                    required={paymentForm.method !== "CASH"}
                    placeholder={
                      paymentForm.method === "CHEQUE"
                        ? "Cheque No"
                        : "Ref No / Trans ID"
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={paymentForm.transactionId || ""}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        transactionId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {paymentForm.method !== "CASH" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Select Bank Account
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={paymentForm.bankId || ""}
                    onChange={(e) => {
                      const bank = props.settings.bankDetails?.find(
                        (b) => b.id === e.target.value,
                      );
                      setPaymentForm({
                        ...paymentForm,
                        bankId: e.target.value,
                        bankName: bank ? bank.bankName : "",
                      });
                    }}
                  >
                    <option value="">Choose Account...</option>
                    {props.settings.bankDetails?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNo?.slice(-4) || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Cash Mode
                  </label>
                  <div className="px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 font-bold text-sm flex items-center gap-2">
                    <Banknote size={18} /> Recorded as Cash in Hand
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Description
                </label>
                <textarea
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  rows={2}
                  value={paymentForm.description || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter transaction description..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all"
              >
                {editingPaymentRecord
                  ? "Update Payment Record"
                  : "Create Payment Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "AUDIT" && (
        <div className="bg-white rounded-[3rem] border border-slate-200 p-12 text-center animate-in fade-in duration-500">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <Calculator size={40} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                Compliance Audit Mode
              </h3>
              <p className="text-slate-500 text-lg font-medium mt-3 leading-relaxed">
                This terminal allows for the automated generation of Profit &
                Loss statements and GST reconciliation reports for the Adani
                Project Hubs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuditFeature
                label="GST Reconciliation"
                description="Match invoice GST with operational input tax."
              />
              <AuditFeature
                label="P&L Breakdown"
                description="Project-wise profitability analysis."
              />
            </div>
            <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
              Initialize System Audit
            </button>
          </div>
        </div>
      )}
      {/* Invoice Payment Modal */}
      {isInvoicePaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Add Billing Record
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Inv: {selectedInvoiceForPayment.invoiceNumber} •{" "}
                    {selectedInvoiceForPayment.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInvoicePaymentModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number((e.target as any).amount.value);
                const date = (e.target as any).date.value;
                const mode = (e.target as any).mode.value;
                const bankId = (e.target as any).bankId.value;
                const referenceNo = (e.target as any).referenceNo.value;
                const note = (e.target as any).note.value;

                const newPayment = {
                  id: `PY-${Date.now()}`,
                  amount,
                  date,
                  mode,
                  bankId,
                  referenceNo,
                  note,
                };

                const updatedInvoice = {
                  ...selectedInvoiceForPayment,
                  payments: [...selectedInvoiceForPayment.payments, newPayment],
                  paidAmount: selectedInvoiceForPayment.paidAmount + amount,
                  status:
                    selectedInvoiceForPayment.paidAmount + amount >=
                    selectedInvoiceForPayment.totalAmount
                      ? "PAID"
                      : "PARTIAL",
                } as Invoice;

                props.onUpdateInvoice(updatedInvoice);
                setIsInvoicePaymentModalOpen(false);
                setSelectedInvoiceForPayment(null);
              }}
              className="p-8 space-y-6 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Amount (₹)*
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    defaultValue={
                      selectedInvoiceForPayment.totalAmount -
                      selectedInvoiceForPayment.paidAmount
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Date*
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Payment Mode*
                  </label>
                  <select
                    name="mode"
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                    value={invoicePaymentMode}
                    onChange={(e) => setInvoicePaymentMode(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  {invoicePaymentMode === "CASH" ? (
                    <>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Cash Mode
                      </label>
                      <div className="px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 font-bold text-sm flex items-center gap-2">
                        <Banknote size={18} /> Recorded as Cash
                        <input type="hidden" name="bankId" value="CASH" />
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        Select Bank*
                      </label>
                      <select
                        name="bankId"
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                      >
                        <option value="">Select Account</option>
                        {props.settings.bankDetails?.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} - {b.accountNo?.slice(-4) || "N/A"}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Reference No / Private Note
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="referenceNo"
                    type="text"
                    placeholder="Ref No"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                  <input
                    name="note"
                    type="text"
                    placeholder="Internal Note"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all mt-4"
              >
                Record Billing Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FinanceCard: React.FC<{
  label: string;
  value: string | number;
  icon: any;
  color: string;
  subtext: string;
}> = ({ label, value, icon: Icon, color, subtext }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group cursor-default">
      <div className="flex items-center justify-between mb-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${colors[color]}`}
        >
          <Icon size={24} />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {subtext}
        </span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900 mt-1 tracking-tighter">
        {value}
      </p>
    </div>
  );
};

const AuditFeature: React.FC<{ label: string; description: string }> = ({
  label,
  description,
}) => (
  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left space-y-2">
    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
      {label}
    </h4>
    <p className="text-xs text-slate-500 font-medium">{description}</p>
  </div>
);

export default AccountabilityView;
