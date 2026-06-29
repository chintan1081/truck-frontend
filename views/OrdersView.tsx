import React, { useState, useMemo, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  FileText,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Truck as TruckIcon,
  CreditCard,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Package,
  Edit,
  Trash2,
  History,
  AlertCircle,
  Navigation,
  Fuel,
  Info,
  User,
  Loader2,
  MessageCircle,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  QrCode,
  Zap,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import {
  Order,
  TripStatus,
  Truck,
  Route,
  Broker,
  ItemProduct,
  Driver,
  AppSettings,
  Client,
  Site,
  PlantAdvance,
  PlantAdvancePoolEntry,
} from "../types";
import { SearchableSelect } from "../components/SearchableSelect";
import { QuickAddModal, QuickAddEntityType } from "../components/QuickAddModal";
import { useFormErrors } from '../hooks/useFormErrors';
import { useToast } from '../components/Toast';
import {
  sendDriverWhatsAppNotification,
  sendAppNotification,
} from "../services/notificationService";

interface OrdersViewProps {
  orders: Order[];
  brokers: Broker[];
  routes: Route[];
  itemProducts: ItemProduct[];
  settings: AppSettings;
  trucks: Truck[];
  drivers: Driver[];
  clients: Client[];
  sites: Site[];
  plantAdvances: PlantAdvance[];
  plantAdvancePool: PlantAdvancePoolEntry[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateTruck?: (truck: Truck) => void;
  onAddClient?: (client: Client) => void;
  onAddSite?: (site: Site) => void;
  onAddBroker?: (broker: Broker) => void;
  onAddRoute?: (route: Route) => void;
  onAddDriver?: (driver: Driver) => void;
  onAddTruck?: (truck: Truck) => void;
}

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  [TripStatus.CREATED]: {
    label: "Created",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: Clock,
  },
  [TripStatus.ASSIGNED]: {
    label: "Assigned",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: TruckIcon,
  },
  [TripStatus.PICKED]: {
    label: "Picked",
    color: "text-amber-600",
    bg: "bg-amber-100",
    icon: Package,
  },
  [TripStatus.DELIVERED]: {
    label: "Delivered",
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: CheckCircle2,
  },
  [TripStatus.INVOICED]: {
    label: "Invoiced",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    icon: FileText,
  },
  [TripStatus.PAID]: {
    label: "Paid",
    color: "text-green-600",
    bg: "bg-green-100",
    icon: CreditCard,
  },
};

const STATUS_ORDER = [
  TripStatus.CREATED,
  TripStatus.ASSIGNED,
  TripStatus.PICKED,
  TripStatus.DELIVERED,
  TripStatus.INVOICED,
  TripStatus.PAID,
];

const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  brokers,
  routes,
  itemProducts,
  settings,
  trucks,
  drivers,
  clients,
  sites,
  plantAdvances,
  plantAdvancePool,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onUpdateTruck,
  onAddClient,
  onAddSite,
  onAddBroker,
  onAddRoute,
  onAddDriver,
  onAddTruck,
}) => {
  const { toast, confirm: showConfirm } = useToast();
  const [quickAdd, setQuickAdd] = useState<{ type: QuickAddEntityType; initialName: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [bulkExportData, setBulkExportData] = useState({
    clientId: "ALL",
    startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0], // 1st of current month
    endDate: new Date().toISOString().split("T")[0],
  });
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportError, setBulkExportError] = useState<string | null>(null);
  const [selectedOrderForChallan, setSelectedOrderForChallan] =
    useState<Order | null>(null);
  const [challanType, setChallanType] = useState<"TRANSPORTER" | "DELIVERY">(
    "TRANSPORTER",
  );
  const [isDownloadingChallan, setIsDownloadingChallan] = useState(false);
  const [challanError, setChallanError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "ALL">("ALL");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Category Filters
  const [brokerFilter, setBrokerFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [truckFilter, setTruckFilter] = useState("ALL");
  const [driverFilter, setDriverFilter] = useState("ALL");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [routeFilter, setRouteFilter] = useState("ALL");

  const { errors: fe, validate, validateField, isValid, clearField, clearAll } = useFormErrors();

  // Validation rules for the order form, derived from current form state. Shared
  // by live per-field checks, the submit-button enablement, and submit.
  const orderRules = (fd: typeof formData = formData) => ({
    clientName:   { value: fd.clientName, label: 'Client Name' },
    projectSite:  { value: fd.projectSite, label: 'Project Site' },
    quantity:     { value: fd.quantity, label: 'Quantity', type: 'positiveNumber' as const },
    ratePerMT:    { value: fd.ratePerMT, label: 'Rate per MT', type: 'positiveNumber' as const },
    pickupDate:   { value: fd.pickupDate, label: 'Pickup Date' },
    deliveryDate: { value: fd.deliveryDate, label: 'Delivery Date' },
  });
  const [dateError, setDateError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Searchable Select Component for Filters
  const SearchableFilter = ({
    label,
    value,
    onChange,
    options,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase()),
    );

    const activeLabel =
      options.find((opt) => opt.value === value)?.label || placeholder;

    return (
      <div className="space-y-1.5 relative" ref={containerRef}>
        <label className="t-label px-1">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white border border-[#E7E5E0] rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 flex items-center justify-between text-slate-900 shadow-sm transition-all"
        >
          <span className="truncate">{activeLabel}</span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5">
            <div className="p-2 border-b border-slate-50 bg-[#F5F4F0]/50">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  autoFocus
                  placeholder={`Search ${label}...`}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-blue-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsOpen(false);
                  }}
                />
              </div>
            </div>
            <div className="max-h-[180px] overflow-y-auto no-scrollbar p-1">
              <div
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all mb-0.5 ${value === "ALL" ? "bg-blue-50 text-blue-700" : "hover:bg-[#F5F4F0] text-slate-600"}`}
                onClick={() => {
                  onChange("ALL");
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                <span className="text-[11px] font-bold">All {label}s</span>
                {value === "ALL" && (
                  <Check size={12} className="text-blue-600" />
                )}
              </div>
              {filteredOptions.filter((o) => o.value !== "ALL").length > 0 ? (
                filteredOptions
                  .filter((o) => o.value !== "ALL")
                  .map((opt, index) => (
                    <div
                      key={`${opt.value}-${index}`}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all mb-0.5 ${value === opt.value ? "bg-blue-50 text-blue-700" : "hover:bg-[#F5F4F0] text-slate-600"}`}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="text-[11px] font-bold truncate pr-4">
                        {opt.label}
                      </span>
                      {value === opt.value && (
                        <Check size={12} className="text-blue-600" />
                      )}
                    </div>
                  ))
              ) : (
                <div className="p-3 text-center">
                  <p className="text-[10px] text-slate-400 italic font-medium">
                    No {label.toLowerCase()}s found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Assignment Form State
  const [assignmentData, setAssignmentData] = useState({
    truckId: "",
    routeId: "",
  });

  const [formData, setFormData] = useState<Partial<Order>>({
    clientName: "Adani Power",
    hasGST: true,
    paymentTerms: "30 Days Net",
    materialName: "",
    quantity: 0,
    ratePerMT: 0,
    pickupDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date(Date.now() + 86400000 * 3)
      .toISOString()
      .split("T")[0],
    totalKm: 0,
    estimatedDiesel: 0,
    dieselRatePerLiter: 0,
    brokerCommissionPerMT: 0,
    totalBrokerCommission: 0,
    hsnSacCode: "",
    gstRate: 0,
    itemCode: "",
    services: [],
    dcNo: "",
    soNo: "",
    remarks: "",
  });

  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const truck = trucks.find((t) => t.id === order.assignedTruckId);
      const driver = drivers.find((d) => d.id === truck?.assignedDriverId);
      const route = routes.find((r) => r.id === order.assignedRouteId);
      const client = clients.find((c) => c.name === order.clientName);

      const searchTerms = [
        order.id,
        order.clientName,
        order.projectSite,
        order.materialName || "",
        order.brokerName || "Direct",
        order.dcNo || order.id.replace("ORD-", "DC"),
        order.soNo || (order.id ? `SO-${order.id.split("-")[1]}` : ""),
        order.remarks || order.id.replace("ORD-", "REF"),
        truck?.truckNumber || "",
        driver?.name || "",
        driver?.trackingId || "",
        route?.source || "",
        client?.city || "",
      ].map((t) => t.toLowerCase());

      const matchesSearch =
        searchQuery === "" ||
        searchTerms.some((term) => term.includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      // Category Matches
      const matchesBroker =
        brokerFilter === "ALL" ||
        (order.brokerName || "Direct") === brokerFilter;
      const matchesClient =
        clientFilter === "ALL" ||
        clients.find((c) => c.id === clientFilter)?.name === order.clientName;
      const matchesSite = siteFilter === "ALL" || client?.city === siteFilter;
      const matchesTruck =
        truckFilter === "ALL" || truck?.id === truckFilter;
      const matchesDriver =
        driverFilter === "ALL" || driver?.id === driverFilter;
      const matchesMaterial =
        materialFilter === "ALL" || order.materialName === materialFilter;
      const matchesRoute =
        routeFilter === "ALL" || route?.source === routeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBroker &&
        matchesClient &&
        matchesSite &&
        matchesTruck &&
        matchesDriver &&
        matchesMaterial &&
        matchesRoute
      );
    });
  }, [
    orders,
    searchQuery,
    statusFilter,
    trucks,
    drivers,
    routes,
    clients,
    brokerFilter,
    clientFilter,
    siteFilter,
    truckFilter,
    driverFilter,
    materialFilter,
    routeFilter,
  ]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  // Assignment Calculations & Logics
  const selectedTruck = trucks.find((t) => t.id === assignmentData.truckId);
  const selectedRoute = routes.find((r) => r.id === assignmentData.routeId);

  // LOGIC 1: Auto-select route when opening assignment for an order
  useEffect(() => {
    if (isAssignModalOpen && assigningOrder && !assignmentData.routeId) {
      // Try to match based on project site city and some common source (or previous order site)
      const matchingRoute = routes.find(r => 
        r.destination.toLowerCase().includes(assigningOrder.projectSite.toLowerCase()) ||
        assigningOrder.projectSite.toLowerCase().includes(r.destination.toLowerCase())
      );
      if (matchingRoute) {
        setAssignmentData(prev => ({ ...prev, routeId: matchingRoute.id }));
      }
    }
  }, [isAssignModalOpen, assigningOrder, routes]);

  // LOGIC 5: Auto Diesel Estimation based on Route & Truck
  const estimatedDieselCalc = useMemo(() => {
    if (selectedTruck && selectedRoute && selectedTruck.mileage > 0) {
      return Number(
        (selectedRoute.distanceKm / selectedTruck.mileage).toFixed(2),
      );
    }
    return 0;
  }, [selectedTruck, selectedRoute]);

  // LOGIC 4: TPS Available Balance
  const stationBalance = useMemo(() => {
    if (!selectedRoute) return 0;
    const tps = sites.find(s => s.name === selectedRoute.source && s.type === 'TPS');
    if (!tps) return 0;
    
    const lifetime = plantAdvancePool.filter(p => p.stationId === tps.id).reduce((a, b) => a + b.amount, 0);
    const utilized = plantAdvances.filter(a => a.stationId === tps.id).reduce((a, b) => a + b.amount, 0);
    return lifetime - utilized;
  }, [selectedRoute, plantAdvancePool, plantAdvances, sites]);

  const generateOrderId = () => {
    const prefix = "ORD";
    const random = Math.floor(1000 + Math.random() * 9000);
    const datePart = new Date().getFullYear().toString().slice(-2);
    return `${prefix}-${datePart}${random}`;
  };

  const handleOpenCreate = () => {
    setEditingOrder(null);
    setDateError(null);
    setFormData({
      clientName: "",
      hasGST: true,
      paymentTerms: "30 Days Net",
      materialName: "",
      quantity: 0,
      ratePerMT: 0,
      pickupDate: new Date().toISOString().split("T")[0],
      deliveryDate: new Date(Date.now() + 86400000 * 3)
        .toISOString()
        .split("T")[0],
      totalKm: 0,
      estimatedDiesel: 0,
      dieselRatePerLiter: 0,
      brokerCommissionPerMT: 0,
      totalBrokerCommission: 0,
      hsnSacCode: "",
      gstRate: 0,
      itemCode: "",
      services: [],
      dcNo: "",
      soNo: "",
      remarks: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setDateError(null);
    setFormData({
      ...order,
      quantity: Number(order.quantity) || 0,
      ratePerMT: Number(order.ratePerMT) || 0,
      gstRate: Number(order.gstRate) || 0,
      totalKm: Number(order.totalKm) || 0,
      estimatedDiesel: Number(order.estimatedDiesel) || 0,
      dieselRatePerLiter: Number(order.dieselRatePerLiter) || 0,
      brokerCommissionPerMT: Number(order.brokerCommissionPerMT) || 0,
      totalBrokerCommission: Number(order.totalBrokerCommission) || 0,
    });
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenAssign = (order: Order) => {
    setAssigningOrder(order);
    setAssignmentData({
      truckId: order.assignedTruckId || "",
      routeId: order.assignedRouteId || "",
    });
    setIsAssignModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenChallan = (
    order: Order,
    type: "TRANSPORTER" | "DELIVERY" = "TRANSPORTER",
  ) => {
    setSelectedOrderForChallan(order);
    setChallanType(type);
    setIsChallanModalOpen(true);
    setActiveMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(orderRules());
    if (!ok) return;
    if (formData.pickupDate && formData.deliveryDate) {
      if (new Date(formData.deliveryDate) < new Date(formData.pickupDate)) {
        setDateError("Delivery date cannot be earlier than the pickup date.");
        return;
      }
    }
    setDateError(null);

    const quantity = formData.quantity || 0;
    const commissionPerMT = formData.brokerCommissionPerMT || 0;
    const totalCommission = quantity * commissionPerMT;

    if (editingOrder) {
      // LOGIC 8: Reset assignment if status changed to CREATED
      const updatedOrder = {
        ...editingOrder,
        ...formData,
        totalBrokerCommission: totalCommission,
      } as Order;

      if (formData.status === TripStatus.CREATED) {
        updatedOrder.assignedTruckId = "";
        updatedOrder.assignedRouteId = "";
      }

      onUpdateOrder(updatedOrder);
    } else {
      const newOrder: Order = {
        ...(formData as Order),
        id: generateOrderId(),
        status: TripStatus.CREATED,
        totalBrokerCommission: totalCommission,
      };
      onAddOrder(newOrder);
    }
    setIsModalOpen(false);
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !assigningOrder ||
      !assignmentData.truckId ||
      !assignmentData.routeId ||
      !selectedTruck ||
      !selectedRoute
    )
      return;

    // LOGIC 2: Maintenance Lock (Extra Security)
    if (selectedTruck.isMaintenanceMode || selectedTruck.status === 'MAINTENANCE') {
      toast(`Critical Error: Asset ${selectedTruck.truckNumber} is currently under maintenance and cannot be dispatched.`, 'error');
      return;
    }

    setIsDispatching(true);

    const updatedOrder: Order = {
      ...assigningOrder,
      assignedTruckId: assignmentData.truckId,
      assignedRouteId: assignmentData.routeId,
      estimatedDiesel: estimatedDieselCalc,
      totalKm: selectedRoute.distanceKm,
      status: TripStatus.ASSIGNED,
    };
    onUpdateOrder(updatedOrder);

    try {
      await sendDriverWhatsAppNotification(
        selectedTruck,
        updatedOrder,
        selectedRoute,
      );
      sendAppNotification(
        "Trip Assigned",
        `Truck ${selectedTruck.truckNumber} has been dispatched for Order ${assigningOrder.id}.`,
      );
    } catch (e) {
      console.error("Dispatch notification failed", e);
    }

    setIsDispatching(false);
    setIsAssignModalOpen(false);
  };

  const advanceStatus = (order: Order) => {
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    if (currentIdx < STATUS_ORDER.length - 1) {
      const nextStatus = STATUS_ORDER[currentIdx + 1];
      let updatedOrder = { ...order, status: nextStatus };

      // LOGIC 5: DC Number Prompt when moving to PICKED
      if (nextStatus === TripStatus.PICKED && !order.dcNo) {
        const dc = window.prompt("Enter Delivery Challan (DC) Number to confirm pick-up:", `DC-${order.id.split('-')[1]}`);
        if (dc) {
          updatedOrder.dcNo = dc;
        } else {
          // If they cancel, we still advance but warn them? 
          // User asked for logic, prompt is a good way to ensure data.
          toast('Warning: DC Number is missing for this picked-up order.', 'warning');
        }
      }

      onUpdateOrder(updatedOrder);
    }
  };

  const handlePrintChallan = () => {
    const el = document.getElementById('printable-challan');
    if (!el) return;

    // Collect all stylesheets from the current page
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((l) => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
      .join('\n');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map((s) => `<style>${s.innerHTML}</style>`)
      .join('\n');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Challan</title>
      ${styleLinks}
      ${inlineStyles}
      <style>
        * { box-sizing: border-box; }
        body { background: white; margin: 0; padding: 0; }
        @page { size: A4; margin: 0; }
      </style>
    </head><body style="display:flex;justify-content:center;">
      <div style="width:210mm;min-height:296mm;padding:10mm;color:#000;font-family:sans-serif;box-sizing:border-box;">
        ${el.innerHTML}
      </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const handleDownloadPDF = async () => {
    if (!selectedOrderForChallan || isDownloadingChallan) return;
    const element = document.getElementById("printable-challan");
    if (!element) {
      setChallanError("Could not find the challan to download. Please reopen it and try again.");
      return;
    }

    const opt = {
      margin: 0,
      filename: `${challanType === "TRANSPORTER" ? "Transporter" : "Delivery"}-Challan-${selectedOrderForChallan.orderNumber ?? selectedOrderForChallan.id}.pdf`,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        logging: false,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
      pagebreak: { mode: "avoid-all" },
    };

    setIsDownloadingChallan(true);
    setChallanError(null);
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      setChallanError("Failed to generate the challan PDF. Please try again.");
    } finally {
      setIsDownloadingChallan(false);
    }
  };

  const handleWhatsAppChallan = (order: Order) => {
    const truck = trucks.find((t) => t.id === order.assignedTruckId);
    const message =
      `*${challanType === "TRANSPORTER" ? "TRANSPORTER" : "DELIVERY"} CHALLAN - ${order.id}*\n\n` +
      `*Client:* ${order.clientName}\n` +
      `*Site:* ${order.projectSite}\n` +
      `*Quantity:* ${order.quantity} MT\n` +
      `*Truck:* ${truck?.truckNumber || "N/A"}\n\n` +
      `_FlyAsh Logistics Pro._`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="page-stack pb-10">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">
            Orders & Client Tracking
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Full client logistics and delivery lifecycle management.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsBulkExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Download size={20} />
            Bulk Export
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={20} />
            New Order
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID, Broker, Site, Client, Truck, Remarks, DC/SO, Supply Place, Driver, Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border border-[#E7E5E0] rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
            />
            <button
              onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase transition-all ${
                isFiltersVisible ||
                [
                  brokerFilter,
                  clientFilter,
                  siteFilter,
                  truckFilter,
                  driverFilter,
                  materialFilter,
                  routeFilter,
                ].some((f) => f !== "ALL")
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <Filter size={14} />
              {isFiltersVisible ? "Hide Filters" : "Advanced Filters"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${statusFilter === "ALL" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-[#F5F4F0]"}`}
            >
              All
            </button>
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${statusFilter === status ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-slate-600 border-slate-200 hover:bg-[#F5F4F0]"}`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        </div>

        {isFiltersVisible && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-[#F5F4F0] rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
            <SearchableFilter
              label="Broker"
              value={brokerFilter}
              onChange={setBrokerFilter}
              options={[
                { value: "ALL", label: "All Brokers" },
                { value: "Direct", label: "Direct" },
                ...brokers.map((b) => ({ value: b.name, label: b.name })),
              ]}
              placeholder="All Brokers"
            />

            <SearchableFilter
              label="Client"
              value={clientFilter}
              onChange={setClientFilter}
              options={[
                { value: "ALL", label: "All Clients" },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.name} ${c.gstNumber ? `(${c.gstNumber})` : ""}`,
                })),
              ]}
              placeholder="All Clients"
            />

            <SearchableFilter
              label="Location (City)"
              value={siteFilter}
              onChange={setSiteFilter}
              options={[
                { value: "ALL", label: "All Cities" },
                ...Array.from(new Set(clients.map((c) => c.city))).map(
                  (city) => ({ value: String(city), label: String(city) }),
                ),
              ]}
              placeholder="All Cities"
            />

            <SearchableFilter
              label="Product"
              value={materialFilter}
              onChange={setMaterialFilter}
              options={[
                { value: "ALL", label: "All Products" },
                ...itemProducts.map((p) => ({
                  value: p.productName,
                  label: p.productName,
                })),
              ]}
              placeholder="All Products"
            />

            <SearchableFilter
              label="Truck"
              value={truckFilter}
              onChange={setTruckFilter}
              options={[
                { value: "ALL", label: "All Trucks" },
                ...trucks.map((t) => ({
                  value: t.id,
                  label: t.truckNumber,
                })),
              ]}
              placeholder="All Trucks"
            />

            <SearchableFilter
              label="Driver"
              value={driverFilter}
              onChange={setDriverFilter}
              options={[
                { value: "ALL", label: "All Drivers" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.trackingId})`,
                })),
              ]}
              placeholder="All Drivers"
            />

            <SearchableFilter
              label="Supply Source"
              value={routeFilter}
              onChange={setRouteFilter}
              options={[
                { value: "ALL", label: "All Sources" },
                ...Array.from(new Set(routes.map((r) => r.source))).map(
                  (source) => ({
                    value: String(source),
                    label: String(source),
                  }),
                ),
              ]}
              placeholder="All Sources"
            />

            <div className="flex items-end">
              <button
                onClick={() => {
                  setBrokerFilter("ALL");
                  setClientFilter("ALL");
                  setSiteFilter("ALL");
                  setTruckFilter("ALL");
                  setDriverFilter("ALL");
                  setMaterialFilter("ALL");
                  setRouteFilter("ALL");
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="w-full px-4 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-red-50"
              >
                <X size={14} />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {paginatedOrders.length === 0 ? (
          <div className="xl:col-span-2 flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
            <Package size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium italic text-center px-4">
              {searchQuery || statusFilter !== "ALL"
                ? "No orders match your filters."
                : "No orders found. Create your first transport order to get started."}
            </p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const currentStatus = STATUS_CONFIG[order.status];
            const StatusIcon = currentStatus.icon;
            const statusIdx = STATUS_ORDER.indexOf(order.status);
            const isMenuOpen = activeMenu === order.id;
            const truck = trucks.find((t) => t.id === order.assignedTruckId);
            const route = routes.find((r) => r.id === order.assignedRouteId);
            const driver = drivers.find((d) => d.id === truck?.assignedDriverId);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group flex flex-col relative ${isMenuOpen ? "z-30" : "z-0"} ${order.status !== TripStatus.DELIVERED && order.status !== TripStatus.PAID && new Date(order.deliveryDate) < new Date() ? "ring-2 ring-red-500/20 border-red-100 bg-red-50/10" : ""}`}
              >
                {order.status !== TripStatus.DELIVERED && order.status !== TripStatus.PAID && new Date(order.deliveryDate) < new Date() && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5 z-20">
                    <AlertCircle size={10} /> Delayed Delivery
                  </div>
                )}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg leading-none">
                            Order #{order.orderNumber ?? '—'}
                          </h3>
                          {order.materialName && (
                            <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                              {order.materialName}
                            </div>
                          )}
                          <div
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.color} flex items-center gap-1.5`}
                          >
                            <StatusIcon size={12} />
                            {currentStatus.label}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-blue-600 mt-1">
                          {order.clientName}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(isMenuOpen ? null : order.id)
                        }
                        className={`p-2 rounded-xl transition-colors ${isMenuOpen ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-[#F5F4F0]"}`}
                      >
                        <MoreVertical size={20} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                              onClick={() => handleOpenAssign(order)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#F5F4F0] transition-colors"
                            >
                              <TruckIcon size={16} className="text-blue-500" />
                              Assign Truck
                            </button>
                            <button
                              onClick={() =>
                                handleOpenChallan(order, "TRANSPORTER")
                              }
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#F5F4F0] transition-colors"
                            >
                              <Printer size={16} className="text-blue-500" />
                              Transporter Challan
                            </button>
                            <button
                              onClick={() =>
                                handleOpenChallan(order, "DELIVERY")
                              }
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#F5F4F0] transition-colors"
                            >
                              <Printer size={16} className="text-emerald-500" />
                              Delivery Challan
                            </button>
                            <button
                              onClick={() => handleOpenEdit(order)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#F5F4F0] transition-colors"
                            >
                              <Edit size={16} className="text-slate-500" />
                              Edit Order
                            </button>
                            <button
                              onClick={() => {
                                advanceStatus(order);
                                setActiveMenu(null);
                              }}
                              disabled={statusIdx === STATUS_ORDER.length - 1}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#F5F4F0] transition-colors disabled:opacity-30"
                            >
                              <History size={16} className="text-amber-500" />
                              Advance Status
                            </button>
                            <div className="h-px bg-[#F5F4F0] my-1" />
                            <button
                              onClick={() => {
                                onDeleteOrder(order.id);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete Order
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Client Location
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <MapPin size={14} className="text-slate-300" />
                        <span className="truncate">
                          {clients.find((c) => c.name === order.clientName)
                            ? `${clients.find((c) => c.name === order.clientName)?.city}, ${clients.find((c) => c.name === order.clientName)?.state}`
                            : order.projectSite}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 truncate italic">
                        {
                          clients.find((c) => c.name === order.clientName)
                            ?.address
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Weight
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {order.quantity} MT
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Broker
                      </p>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {order.brokerName || "Direct"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Truck/Driver
                      </p>
                      <div className="flex flex-col">
                        <p
                          className={`text-sm font-bold truncate ${truck ? "text-slate-800" : "text-slate-300 italic"}`}
                        >
                          {truck ? truck.truckNumber : "Not Assigned"}
                        </p>
                        {driver && (
                          <p className="text-[10px] font-medium text-blue-600 truncate">
                            {driver.name} ({driver.trackingId})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="relative pt-2 px-2 pb-2">
                    <div className="absolute top-[17px] left-6 right-6 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-700 ease-in-out"
                        style={{
                          width: `${(statusIdx / (STATUS_ORDER.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="relative flex justify-between">
                      {STATUS_ORDER.map((s, i) => {
                        const isActive = i <= statusIdx;
                        const isCurrent = i === statusIdx;
                        const StepIcon = STATUS_CONFIG[s].icon;

                        return (
                          <div
                            key={s}
                            className="flex flex-col items-center gap-2 relative group/step cursor-help"
                          >
                            <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/step:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 font-bold shadow-lg">
                              {STATUS_CONFIG[s].label}
                            </div>

                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 ${
                                isCurrent
                                  ? "bg-blue-600 border-blue-100 scale-125 shadow-md shadow-blue-500/20 text-white"
                                  : isActive
                                    ? "bg-blue-500 border-white text-white"
                                    : "bg-white border-slate-50 shadow-sm text-slate-300"
                              }`}
                            >
                              {isActive && i < statusIdx ? (
                                <CheckCircle2 size={12} strokeWidth={3} />
                              ) : (
                                <StepIcon
                                  size={12}
                                  strokeWidth={isCurrent ? 3 : 2}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#F5F4F0]/50 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Revenue (Est)
                      </span>
                      <span className="text-xs font-black text-green-600">
                        ₹
                        {(
                          order.quantity * order.ratePerMT || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        Pickup
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {order.pickupDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.status === TripStatus.ASSIGNED && (
                      <button
                        onClick={() => advanceStatus(order)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-amber-700 transition-all flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Pick Up
                      </button>
                    )}
                    {order.status === TripStatus.PICKED && (
                      <button
                        onClick={() => advanceStatus(order)}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-green-700 transition-all flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} /> Deliver
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenChallan(order)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition-all flex items-center gap-1.5"
                    >
                      <Printer size={14} /> Challan
                    </button>
                    <button
                      onClick={() => handleOpenEdit(order)}
                      className="text-slate-500 font-black text-xs flex items-center gap-1 hover:text-blue-600 transition-all px-2"
                    >
                      Edit <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="t-label">
            Showing page {currentPage} of {totalPages} ({filteredOrders.length}{" "}
            total orders)
          </p>
          <div className="flex gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-2 bg-[#F5F4F0] border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all font-mono"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all font-mono shadow-lg shadow-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Export Modal */}
      {isBulkExportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <div>
                <h3 className="text-2xl font-black text-[#1C1917] tracking-tight leading-tight uppercase tracking-tight">
                  Bulk Export PDF
                </h3>
                <p className="text-slate-500 font-medium text-sm mt-1">
                  Generate 10-entry per page tax invoices.
                </p>
              </div>
              <button
                onClick={() => setIsBulkExportModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <div className="space-y-4">
                  <SearchableSelect
                    label="Select Client"
                    value={bulkExportData.clientId}
                    onChange={(val) =>
                      setBulkExportData({
                        ...bulkExportData,
                        clientId: val,
                      })
                    }
                    placeholder="All Clients"
                    options={[
                      { value: "ALL", label: "All Clients" },
                      ...clients.map((c) => ({
                        value: c.id,
                        label: c.name,
                        sub: c.gstNumber ? `GST: ${c.gstNumber}` : `ID: ${c.id}`
                      }))
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block t-label mb-2.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bulkExportData.startDate}
                    onChange={(e) =>
                      setBulkExportData({
                        ...bulkExportData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3.5 bg-[#F5F4F0] border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block t-label mb-2.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={bulkExportData.endDate}
                    onChange={(e) =>
                      setBulkExportData({
                        ...bulkExportData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3.5 bg-[#F5F4F0] border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {bulkExportError && (
                  <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{bulkExportError}</div>
                )}
                <button
                  disabled={isBulkExporting}
                  onClick={async () => {
                    const filtered = orders.filter((o) => {
                      const matchesClient =
                        bulkExportData.clientId === "ALL" ||
                        clients.find((c) => c.id === bulkExportData.clientId)
                          ?.name === o.clientName;
                      const matchesDate =
                        o.pickupDate >= bulkExportData.startDate &&
                        o.pickupDate <= bulkExportData.endDate;
                      return matchesClient && matchesDate;
                    });

                    if (filtered.length === 0) {
                      setBulkExportError("No orders found for the selected criteria.");
                      return;
                    }

                    const element = document.getElementById(
                      "bulk-export-pdf-template",
                    );
                    if (!element) {
                      setBulkExportError("Could not build the export template. Please try again.");
                      return;
                    }

                    const opt = {
                      margin: 0,
                      filename: `Bulk-Export-${bulkExportData.clientId}-${bulkExportData.startDate}-to-${bulkExportData.endDate}.pdf`,
                      image: { type: "jpeg" as const, quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true },
                      jsPDF: {
                        unit: "mm" as const,
                        format: "a4" as const,
                        orientation: "portrait" as const,
                      },
                    };

                    setIsBulkExporting(true);
                    setBulkExportError(null);
                    try {
                      await html2pdf().from(element).set(opt).save();
                    } catch (err) {
                      setBulkExportError("Failed to generate the bulk export PDF. Please try again.");
                    } finally {
                      setIsBulkExporting(false);
                    }
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isBulkExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  {isBulkExporting ? 'Generating…' : 'Generate Bulk PDF'}
                </button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase">
                  {
                    orders.filter((o) => {
                      const matchesClient =
                        bulkExportData.clientId === "ALL" ||
                        o.clientName === bulkExportData.clientId;
                      const matchesDate =
                        o.pickupDate >= bulkExportData.startDate &&
                        o.pickupDate <= bulkExportData.endDate;
                      return matchesClient && matchesDate;
                    }).length
                  }{" "}
                  Orders Selected
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Template for Bulk Export */}
      <div className="hidden">
        <div
          id="bulk-export-pdf-template"
          className="bg-white"
          style={{ width: "210mm", color: "#000" }}
        >
          {(() => {
            const filteredOrders = orders
              .filter((o) => {
                const matchesClient =
                  bulkExportData.clientId === "ALL" ||
                  o.clientName === bulkExportData.clientId;
                const matchesDate =
                  o.pickupDate >= bulkExportData.startDate &&
                  o.pickupDate <= bulkExportData.endDate;
                return matchesClient && matchesDate;
              })
              .sort(
                (a, b) =>
                  new Date(a.pickupDate).getTime() -
                  new Date(b.pickupDate).getTime(),
              );

            // Chunk by 10 entries per page
            const chunks = [];
            for (let i = 0; i < filteredOrders.length; i += 10) {
              chunks.push(filteredOrders.slice(i, i + 10));
            }

            return chunks.map((chunk, pageIndex) => {
              const subTotal = chunk.reduce(
                (sum, order) => sum + order.quantity * order.ratePerMT,
                0,
              );
              const gstTotal = subTotal * 0.05;
              const total = subTotal + gstTotal;

              return (
                <div
                  key={pageIndex}
                  className="relative p-[10mm] border-b border-slate-100 last:border-0"
                  style={{
                    height: "297mm",
                    pageBreakAfter: "always",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-3xl font-black tracking-tight">
                        {settings.companyName || "ARMIN TRANSPORT CO"}
                      </h1>
                      <div className="text-[10px] text-slate-600 mt-2 space-y-0.5">
                        <p>
                          {settings.companyAddress || "AT& PO Songadh Tapi."}
                        </p>
                        <p>
                          Phone no.: {settings.companyPhone || "9426365268"}
                        </p>
                        <p>
                          Email:{" "}
                          {settings.companyEmail || "ARMINTRANSPORT1@GMAIL.COM"}
                        </p>
                        <p>GSTIN: {settings.companyGst || "24AARFA6502G1ZM"}</p>
                        <p>State: 24-Gujarat</p>
                      </div>
                    </div>
                    <div className="w-32">
                      {settings.companyLogo ? (
                        <img
                          src={settings.companyLogo}
                          crossOrigin="anonymous"
                          className="w-full object-contain"
                        />
                      ) : (
                        <div className="bg-[#F5F4F0] p-4 rounded-xl text-center border-2 border-slate-100 flex flex-col items-center">
                          <TruckIcon
                            size={32}
                            className="text-slate-300 mb-2"
                          />
                          <span className="text-[10px] font-black text-slate-300 tracking-tighter">
                            TRANS CO.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-y-2 border-blue-500 py-2 mb-8 text-center bg-blue-50/30">
                    <h2 className="text-2xl font-black text-blue-600 uppercase tracking-[0.3em]">
                      Tax Invoice
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 gap-8 mb-8 text-[11px]">
                    <div>
                      <h3 className="font-black border-b border-black pb-1 mb-2">
                        Bill To
                      </h3>
                      <p className="font-black text-sm">
                        {bulkExportData.clientId === "ALL"
                          ? "Various Clients"
                          : bulkExportData.clientId}
                      </p>
                      <div className="text-slate-600 mt-1 space-y-0.5">
                        {bulkExportData.clientId !== "ALL" && (
                          <>
                            <p>
                              {clients.find(
                                (c) => c.name === bulkExportData.clientId,
                              )?.city || "Gujarat"}
                            </p>
                            <p>
                              GSTIN:{" "}
                              {clients.find(
                                (c) => c.name === bulkExportData.clientId,
                              )?.gstNumber || "N/A"}
                            </p>
                            <p>State: 24-Gujarat</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black border-b border-black pb-1 mb-2">
                        Transportation Details
                      </h3>
                      <p className="text-slate-600">Vehicle Number: BULK</p>
                    </div>
                    <div>
                      <h3 className="font-black border-b border-black pb-1 mb-2 text-right">
                        Invoice Details
                      </h3>
                      <div className="text-right space-y-1">
                        <p>
                          <span className="font-bold">Invoice No.:</span> BK-
                          {pageIndex + 1}-
                          {new Date().getTime().toString().slice(-4)}
                        </p>
                        <p>
                          <span className="font-bold">Date:</span>{" "}
                          {new Date().toLocaleDateString("en-GB")}
                        </p>
                        <p>
                          <span className="font-bold">Place of Supply:</span>{" "}
                          24-Gujarat
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-500 text-white text-[11px] font-black">
                          <th className="p-2 w-8 text-center">#</th>
                          <th className="p-2 text-left">Item name</th>
                          <th className="p-2 text-left w-24">HSN/ SAC</th>
                          <th className="p-2 text-right w-24">Quantity</th>
                          <th className="p-2 text-right w-24">Price/ Unit</th>
                          <th className="p-2 text-right w-24">GST</th>
                          <th className="p-2 text-right w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunk.map((order, idx) => {
                          const amt = order.quantity * order.ratePerMT;
                          const gst = amt * 0.05;
                          const totalAmt = amt + gst;
                          return (
                            <tr
                              key={order.id}
                              className="border-b border-slate-100 text-[10px]"
                            >
                              <td className="p-2 align-top text-center font-bold">
                                {pageIndex * 10 + idx + 1}
                              </td>
                              <td className="p-2 align-top">
                                <p className="font-black uppercase">
                                  {order.materialName || "FLY-ASH"}
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  ({order.projectSite})
                                </p>
                              </td>
                              <td className="p-2 align-top">
                                {itemProducts.find(
                                  (p) => p.productName === order.materialName,
                                )?.hsnCode || "26219000"}
                              </td>
                              <td className="p-2 align-top text-right font-bold">
                                {Number(order.quantity).toFixed(2)}
                              </td>
                              <td className="p-2 align-top text-right font-mono">
                                ₹{order.ratePerMT.toLocaleString()}
                              </td>
                              <td className="p-2 align-top text-right text-[9px]">
                                <p className="font-bold">
                                  ₹{gst.toLocaleString()}
                                </p>
                                <p className="text-slate-400 opacity-70">
                                  (5.0%)
                                </p>
                              </td>
                              <td className="p-2 align-top text-right font-black">
                                ₹{totalAmt.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Fill remaining space to maintain layout */}
                        {[...Array(Math.max(0, 10 - chunk.length))].map(
                          (_, i) => (
                            <tr
                              key={i}
                              className="h-12 border-b border-slate-50"
                            >
                              <td colSpan={7}></td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Footer (Only on last page or repeated if needed) */}
                  <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-slate-900 pt-8">
                    <div className="page-stack pb-10">
                      <div className="bg-[#F5F4F0] p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">
                          Pay To:
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <span className="font-bold">Bank Name:</span>
                          <span>KOTAK MAHINDRA BANK</span>
                          <span className="font-bold">Account No.:</span>
                          <span className="font-bold">9227132528</span>
                          <span className="font-bold">IFSC code:</span>
                          <span>KKBK0002848</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-black italic text-slate-400 p-2 border-l-4 border-blue-500 bg-blue-50/30">
                        Thanks for doing business with us!
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-[11px]">
                      <div className="w-full flex justify-between py-1 px-2">
                        <span className="font-bold text-slate-400">
                          Sub Total
                        </span>
                        <span className="font-bold font-mono">
                          ₹{subTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full flex justify-between py-1 px-2">
                        <span className="font-bold text-slate-400">
                          GST (5%)
                        </span>
                        <span className="font-bold font-mono">
                          ₹{gstTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full flex justify-between bg-blue-600 text-white rounded-xl py-3 px-4 shadow-lg shadow-blue-100 mt-2">
                        <span className="font-black uppercase tracking-widest">
                          Total Amount
                        </span>
                        <span className="text-lg font-black font-mono">
                          ₹{total.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-12 text-center w-full max-w-[240px]">
                        <div className="h-px bg-slate-300 mb-4" />
                        <p className="text-[10px] font-black uppercase leading-none">
                          {settings.companyName || "ARMIN TRANSPORT CO"}
                        </p>
                        <p className="text-[9px] mt-2 italic text-slate-400">
                          Authorized Signatory
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 flex justify-between items-center text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                    <span>
                      Page {pageIndex + 1} of {chunks.length}
                    </span>
                    <span>Generated via FlyAsh Logistics Pro</span>
                    <span className="text-blue-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
      {/* Challan Print Modal */}
      {isChallanModalOpen && selectedOrderForChallan && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {challanType} CHALLAN
              </h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100">
                REF: Order #{selectedOrderForChallan.orderNumber ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingChallan}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloadingChallan ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                  {isDownloadingChallan ? 'Generating…' : 'Download PDF'}
                </span>
              </button>
              <button
                onClick={handlePrintChallan}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 px-6"
              >
                <Printer size={18} />
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                  Print
                </span>
              </button>
              <button
                onClick={() => setIsChallanModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {challanError && (
            <div className="px-6 pt-4 bg-white border-b border-slate-200 no-print">
              <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{challanError}</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 sm:p-8 no-print">
            <div
              id="printable-challan"
              className="bg-white mx-auto shadow-2xl overflow-hidden print:shadow-none print:border print:border-slate-300"
              style={{
                width: "210mm",
                height: "296mm",
                padding: "10mm",
                color: "#000",
                fontFamily: "sans-serif",
                boxSizing: "border-box",
              }}
            >
              <div className="border border-black w-full h-full flex flex-col font-sans box-border">
                <div className="border-b border-black py-2 text-center bg-[#F5F4F0]">
                  <h1 className="text-lg font-black uppercase tracking-[0.2em]">
                    {challanType} CHALLAN
                  </h1>
                </div>
                <div className="flex border-b border-black">
                  <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                    <h2 className="text-xl font-black uppercase mb-1 leading-none">
                      {settings.companyName ||
                        "Ashtech (India) Private Limited"}
                    </h2>
                    <p className="text-[9px] leading-tight max-w-sm mb-1">
                      {settings.companyAddress ||
                        "11th FLOOR, B-1109/1110 K.P EPITOME, Makarba Road AHMEDABAD 380051, State Code: 24 Gujarat"}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-tight">
                      GSTIN No.: {settings.companyGst || "24AAECA4133B1ZG"}
                    </p>
                  </div>
                  <div className="w-28 border-l border-black p-2 flex items-center justify-center">
                    {settings.companyLogo ? (
                      <img
                        src={settings.companyLogo}
                        alt="Logo"
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-3xl font-black text-slate-300 grayscale opacity-50 text-center">
                        ASH
                        <br />
                        TECH
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="flex-1 flex flex-col border-r border-black">
                    <div className="p-2 border-b border-black flex-1 min-h-[110px]">
                      <p className="text-[9px] font-black underline uppercase mb-1">
                        Ship To,
                      </p>
                      <h4 className="text-[11px] font-black mb-0.5 leading-none">
                        {selectedOrderForChallan?.clientName}
                      </h4>
                      {(clients || []).find(
                        (c) => c.name === selectedOrderForChallan?.clientName,
                      ) ? (
                        <>
                          <p className="text-[9px] leading-tight text-slate-700 whitespace-pre-wrap">
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.address
                            }
                          </p>
                          <p className="text-[9px] leading-tight text-slate-700">
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.city
                            }
                            ,{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.state
                            }{" "}
                            -{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.pincode
                            }
                          </p>
                          <p className="text-[9px] font-bold mt-1">
                            GSTIN No.:{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.gstNumber
                            }
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] leading-tight text-slate-700">
                            {selectedOrderForChallan.projectSite}
                          </p>
                          <p className="text-[9px] mt-1 font-bold">
                            State code: 24 Gujarat
                          </p>
                          <p className="text-[9px] font-bold">GSTIN No.: N/A</p>
                        </>
                      )}
                      {challanType === "DELIVERY" && (
                        <p className="text-[9px] mt-2 font-black italic">
                          Unloading Point :{" "}
                          {(clients || []).find(
                            (c) =>
                              c.name === selectedOrderForChallan?.clientName,
                          )?.city || "N/A"}
                        </p>
                      )}
                    </div>
                    <div className="p-2 flex-1 min-h-[110px]">
                      <p className="text-[9px] font-black underline uppercase mb-1">
                        Bill To,
                      </p>
                      <h4 className="text-[11px] font-black mb-0.5 leading-none">
                        {selectedOrderForChallan?.clientName}
                      </h4>
                      {(clients || []).find(
                        (c) => c.name === selectedOrderForChallan?.clientName,
                      ) ? (
                        <>
                          <p className="text-[9px] leading-tight text-slate-700 whitespace-pre-wrap">
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.address
                            }
                          </p>
                          <p className="text-[9px] leading-tight text-slate-700">
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.city
                            }
                            ,{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.state
                            }{" "}
                            -{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.pincode
                            }
                          </p>
                          <p className="text-[9px] font-bold mt-1">
                            GSTIN No.:{" "}
                            {
                              (clients || []).find(
                                (c) =>
                                  c.name === selectedOrderForChallan?.clientName,
                              )?.gstNumber
                            }
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] leading-tight text-slate-700">
                            {selectedOrderForChallan.projectSite}
                          </p>
                          <p className="text-[9px] mt-1 font-bold">
                            State code: 24 - Gujarat
                          </p>
                          <p className="text-[9px] font-bold">GSTIN No.: N/A</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        D.C.No.
                      </div>
                      <div className="p-1.5">
                        {selectedOrderForChallan.dcNo ||
                          selectedOrderForChallan.id.replace("ORD-", "DC")}
                      </div>
                    </div>
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        Date :
                      </div>
                      <div className="p-1.5">
                        {selectedOrderForChallan.pickupDate}
                      </div>
                    </div>
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        SO No.
                      </div>
                      <div className="p-1.5">
                        {selectedOrderForChallan.soNo ||
                          `SO-${selectedOrderForChallan.id.split("-")[1]}`}
                      </div>
                    </div>
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        Date :
                      </div>
                      <div className="p-1.5">
                        {selectedOrderForChallan.pickupDate}
                      </div>
                    </div>
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        Your Ref No.
                      </div>
                      <div className="p-1.5">N/A</div>
                    </div>
                    <div className="flex border-b border-black text-[9px] font-black uppercase">
                      <div className="w-20 p-1.5 border-r border-black">
                        Date :
                      </div>
                      <div className="p-1.5">
                        {selectedOrderForChallan.pickupDate}
                      </div>
                    </div>
                    <div className="bg-[#F5F4F0] p-1.5 border-b border-black">
                      <p className="text-[9px] font-black uppercase text-center tracking-widest">
                        Destination
                      </p>
                    </div>
                    <div className="p-2 space-y-1.5 text-[9px]">
                      <div className="flex">
                        <span className="w-28 font-black italic">
                          Despatched Through
                        </span>
                        <span>:</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-black italic">
                          Name of Transporter
                        </span>
                        <span className="flex-1 uppercase font-black">
                          : {settings.companyName || "ARMIN TRANSPORT CO"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-black italic">
                          Vehicle No.
                        </span>
                        <span className="flex-1 font-black">
                          :{" "}
                          {trucks.find(
                            (t) =>
                              t.id === selectedOrderForChallan.assignedTruckId,
                          )?.truckNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-black italic">
                          Despatch From
                        </span>
                        <span className="flex-1 uppercase font-black">
                          :{" "}
                          {sites.find(
                            (s) =>
                              s.name === selectedOrderForChallan.projectSite,
                          )?.city ||
                            routes.find(
                              (r) =>
                                r.id ===
                                selectedOrderForChallan.assignedRouteId,
                            )?.source ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-28 font-black italic">
                          Place of Supply
                        </span>
                        <span className="flex-1 uppercase font-black">
                          :{" "}
                          {clients.find(
                            (c) =>
                              c.name === selectedOrderForChallan.clientName,
                          )?.city || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 border-b border-black overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] font-black uppercase bg-[#F5F4F0] border-b border-black">
                        <th className="p-1.5 border-r border-black w-10 text-center">
                          S.NO
                        </th>
                        <th className="p-1.5 border-r border-black w-28">
                          HSN/SAC Code
                        </th>
                        <th className="p-1.5 border-r border-black w-28">
                          Item Code
                        </th>
                        <th className="p-1.5 border-r border-black">
                          Item Description
                        </th>
                        <th className="p-1.5 border-r border-black w-16 text-center">
                          Unit
                        </th>
                        <th className="p-1.5 w-24 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-[10px] border-b border-slate-200">
                        <td className="p-1.5 border-r border-black text-center pt-2">
                          1
                        </td>
                        <td className="p-1.5 border-r border-black pt-2">
                          {selectedOrderForChallan.hsnSacCode ||
                            itemProducts.find(
                              (p) =>
                                p.productName ===
                                selectedOrderForChallan.materialName,
                            )?.hsnSacCode ||
                            "26219000"}
                        </td>
                        <td className="p-1.5 border-r border-black pt-2">
                          {selectedOrderForChallan.itemCode || "FLYR00004"}
                        </td>
                        <td className="p-1.5 border-r border-black pt-2 font-black uppercase">
                          {selectedOrderForChallan.materialName || "Fly Ash"}
                        </td>
                        <td className="p-1.5 border-r border-black text-center pt-2 uppercase">
                          MTS
                        </td>
                        <td className="p-1.5 text-right pt-2 font-black">
                          {Number(selectedOrderForChallan.quantity).toFixed(2)}
                        </td>
                      </tr>
                      {[...Array(12)].map((_, i) => (
                        <tr key={i} className="h-6">
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-[10px] font-black uppercase bg-[#F5F4F0] border-t border-black">
                        <td
                          colSpan={5}
                          className="p-2 text-right border-r border-black uppercase tracking-widest"
                        >
                          Total Quantity
                        </td>
                        <td className="p-2 text-right">
                          {Number(selectedOrderForChallan.quantity).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="p-2 border-b border-black text-[9px]">
                  <p>
                    <span className="font-black uppercase italic">
                      Remarks:
                    </span>{" "}
                    {selectedOrderForChallan.remarks ||
                      selectedOrderForChallan.id.replace("ORD-", "REF")}
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="flex border-b border-black h-24">
                    <div className="flex-1 p-2 border-r border-black flex flex-col justify-between">
                      <p className="text-[9px] text-center">
                        Received the above goods in good condition.
                      </p>
                      <p className="text-[9px] text-center pt-1 italic">
                        Receiver's Signature with Seal.
                      </p>
                    </div>
                    <div className="flex-1 p-2 flex flex-col justify-between text-right">
                      <p className="text-[9px] font-black uppercase underline text-center">
                        For{" "}
                        {settings.companyName ||
                          "Ashtech (India) Private Limited"}
                      </p>
                      <p className="text-[9px] text-center pt-1 italic">
                        Authorised Signatory
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#F5F4F0] text-center py-1.5 px-4">
                    <p className="text-[8px] font-black uppercase tracking-tight leading-none">
                      Corporate Office :{" "}
                      {settings.companyAddress ||
                        "Ashtech House 1st Floor, 30 - Popatwadi Kalbadevi Road, Mumbai - 400002, Maharastra, India"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <div>
                <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">
                  {editingOrder ? "Edit Order" : "New Order"}
                </h3>
                <p className="text-sm text-slate-500 font-medium italic">
                  Configure operational details and logistics limits.
                </p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); clearAll(); setDateError(null); }}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-6 overflow-y-auto"
            >
              {dateError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-xs font-black uppercase">{dateError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SearchableSelect
                    label="Client Name*"
                    value={clients.find(c => c.name === formData.clientName)?.id ?? ""}
                    onChange={(val) => {
                      const client = clients.find(c => c.id === val);
                      setFormData({ ...formData, clientName: client?.name ?? "" });
                      validateField('clientName', { value: client?.name ?? "", label: 'Client Name' });
                    }}
                    options={clients.map((c) => ({
                      value: c.id,
                      label: c.name,
                      sub: c.city
                    }))}
                    placeholder="Select Client..."
                    onCreateNew={(name) => setQuickAdd({ type: 'client', initialName: name })}
                    createNewLabel="Add Client"
                  />
                  {fe['clientName'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['clientName']}</p>}
                </div>
                <div className="space-y-2">
                  <SearchableSelect
                    label="Thermal Power Site*"
                    value={sites.find(s => s.name === formData.projectSite)?.id ?? ""}
                    onChange={(val) => {
                      const site = sites.find(s => s.id === val);
                      setFormData({ ...formData, projectSite: site?.name ?? "" });
                      validateField('projectSite', { value: site?.name ?? "", label: 'Project Site' });
                    }}
                    options={sites.map((s) => ({
                      value: s.id,
                      label: s.name,
                      sub: s.location
                    }))}
                    placeholder="Select Site..."
                    onCreateNew={(name) => setQuickAdd({ type: 'site', initialName: name })}
                    createNewLabel="Add Site"
                  />
                  {fe['projectSite'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['projectSite']}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SearchableSelect
                    label="Material (Product)*"
                    value={itemProducts.find(p => p.productName === formData.materialName)?.id ?? ""}
                    onChange={(val) => {
                      const prod = itemProducts.find(
                        (p) => p.id === val,
                      );
                      if (prod) {
                        setFormData({
                          ...formData,
                          materialName: prod.productName,
                          itemCode: prod.trackingId,
                          hsnSacCode: prod.hsnSacCode,
                          gstRate: Number(prod.gstRate) || 0,
                          services: prod.services || [],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          materialName: "",
                          itemCode: "",
                          hsnSacCode: "",
                          gstRate: 0,
                          services: [],
                        });
                      }
                    }}
                    options={itemProducts.map((p) => ({
                      value: p.id,
                      label: p.productName
                    }))}
                    placeholder="Select Material..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Item Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600"
                    readOnly
                    placeholder="Tracking ID"
                    value={formData.itemCode ?? ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    HSN & SAC Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600"
                    value={formData.hsnSacCode ?? ""}
                    readOnly
                    placeholder="e.g. 26219000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-bold text-slate-600"
                    value={formData.gstRate ?? 0}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  Services (Operations)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={!formData.materialName}
                    onClick={() =>
                      setIsServicesDropdownOpen(!isServicesDropdownOpen)
                    }
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none flex items-center justify-between font-bold text-slate-900 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {formData.services && formData.services.length > 0
                        ? formData.services.join(", ")
                        : "Select Services..."}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform ${isServicesDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isServicesDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsServicesDropdownOpen(false)}
                      />
                      <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200 ring-4 ring-black/5">
                        {(() => {
                          const selectedProd = itemProducts.find(
                            (p) => p.productName === formData.materialName,
                          );
                          const availableServices =
                            selectedProd?.services || [];

                          if (availableServices.length === 0) {
                            return (
                              <p className="p-4 text-[10px] text-slate-400 italic text-center">
                                No services available for this product
                              </p>
                            );
                          }

                          return (
                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                              {availableServices.map((service) => (
                                <div
                                  key={service}
                                  onClick={() => {
                                    const current = formData.services || [];
                                    if (current.includes(service)) {
                                      setFormData({
                                        ...formData,
                                        services: current.filter(
                                          (s) => s !== service,
                                        ),
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        services: [...current, service],
                                      });
                                    }
                                  }}
                                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                                    formData.services?.includes(service)
                                      ? "bg-blue-50 text-blue-700"
                                      : "hover:bg-[#F5F4F0] text-slate-600"
                                  }`}
                                >
                                  <span className="text-xs font-bold uppercase tracking-tight">
                                    {service}
                                  </span>
                                  {formData.services?.includes(service) && (
                                    <Check
                                      size={14}
                                      className="text-blue-600"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    D.C. NO
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                    value={formData.dcNo ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dcNo: e.target.value })
                    }
                    placeholder="Delivery Challan No."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    SO NO
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                    value={formData.soNo ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, soNo: e.target.value })
                    }
                    placeholder="Sales Order No."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                  Remarks
                </label>
                <textarea
                  className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 min-h-[80px]"
                  value={formData.remarks ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  placeholder="Additional delivery instructions or notes..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Quantity (MT)*
                  </label>
                  <input
                    type="number"
                    className={`w-full px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 border ${fe['quantity'] ? 'bg-red-50 border-red-300' : 'bg-[#F5F4F0] border-slate-200'}`}
                    placeholder="0.00"
                    value={formData.quantity ?? ""}
                    onChange={(e) => { setFormData({ ...formData, quantity: Number(e.target.value) }); validateField('quantity', { value: Number(e.target.value), label: 'Quantity', type: 'positiveNumber' }); }}
                  />
                  {fe['quantity'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['quantity']}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Rate per MT (₹)*
                  </label>
                  <input
                    type="number"
                    className={`w-full px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 border ${fe['ratePerMT'] ? 'bg-red-50 border-red-300' : 'bg-[#F5F4F0] border-slate-200'}`}
                    placeholder="0"
                    value={formData.ratePerMT ?? ""}
                    onChange={(e) => { setFormData({ ...formData, ratePerMT: Number(e.target.value) }); validateField('ratePerMT', { value: Number(e.target.value), label: 'Rate per MT', type: 'positiveNumber' }); }}
                  />
                  {fe['ratePerMT'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['ratePerMT']}</p>}
                </div>
              </div>

              {/* Logistics Details: KM and Diesel */}
              <div className="p-6 bg-[#F5F4F0] rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Total KM Between
                  </label>
                  <div className="relative">
                    <Navigation
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />
                    <input
                      type="number"
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none font-black text-slate-900"
                      placeholder="0 KM"
                      value={formData.totalKm ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalKm: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Diesel Amount (L)
                  </label>
                  <div className="relative">
                    <Fuel
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />
                    <input
                      type="number"
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none font-black text-slate-900"
                      placeholder="0 Liters"
                      value={formData.estimatedDiesel ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDiesel: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Diesel rate/L (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />
                    <input
                      type="number"
                      className="w-full pl-12 pr-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none font-black text-slate-900"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.dieselRatePerLiter ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dieselRatePerLiter: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Pickup Date*
                  </label>
                  <input
                    type="date"
                    className={`w-full px-5 py-3.5 rounded-2xl outline-none font-bold text-slate-900 border ${fe['pickupDate'] ? 'bg-red-50 border-red-300' : 'bg-[#F5F4F0] border-slate-200'}`}
                    value={formData.pickupDate ?? ""}
                    onChange={(e) => { setFormData({ ...formData, pickupDate: e.target.value }); validateField('pickupDate', { value: e.target.value, label: 'Pickup Date' }); }}
                  />
                  {fe['pickupDate'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['pickupDate']}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Estimated Delivery*
                  </label>
                  <input
                    type="date"
                    className={`w-full px-5 py-3.5 rounded-2xl outline-none font-bold text-slate-900 border ${fe['deliveryDate'] ? 'bg-red-50 border-red-300' : 'bg-[#F5F4F0] border-slate-200'}`}
                    value={formData.deliveryDate ?? ""}
                    onChange={(e) => { setFormData({ ...formData, deliveryDate: e.target.value }); validateField('deliveryDate', { value: e.target.value, label: 'Delivery Date' }); }}
                  />
                  {fe['deliveryDate'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['deliveryDate']}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Payment Terms
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                    value={formData.paymentTerms ?? "30 Days Net"}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTerms: e.target.value })
                    }
                  >
                    <option>Advance Payment</option>
                    <option>15 Days Net</option>
                    <option>30 Days Net</option>
                    <option>Payment on Delivery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Trip Status
                  </label>
                  <select
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                    value={formData.status ?? TripStatus.CREATED}
                    onChange={(e) => {
                      const newStatus = e.target.value as TripStatus;
                      let newDCNo = formData.dcNo;

                      if (newStatus === TripStatus.PICKED && !formData.dcNo) {
                        const dc = window.prompt("Enter Delivery Challan (DC) Number:", `DC-${editingOrder?.id.split('-')[1] || Date.now().toString().slice(-6)}`);
                        if (dc) newDCNo = dc;
                      }

                      setFormData({
                        ...formData,
                        status: newStatus,
                        dcNo: newDCNo
                      });
                    }}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <SearchableSelect
                    label="Broker Mapping"
                    value={formData.brokerId ?? ""}
                    onChange={(val) => {
                      const broker = brokers.find((b) => b.id === val);
                      setFormData({
                        ...formData,
                        brokerId: val,
                        brokerName: broker?.name || "",
                      });
                    }}
                    options={[
                      { value: "", label: "Direct (No Broker)" },
                      ...brokers.map((b) => ({ value: b.id, label: b.name, sub: b.phone })),
                    ]}
                    placeholder="Direct (No Broker)"
                    onCreateNew={(name) => setQuickAdd({ type: 'broker', initialName: name })}
                    createNewLabel="Add Broker"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Broker Commission (₹/MT)
                  </label>
                  <div className="relative">
                    <IndianRupee
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />
                    <input
                      type="number"
                      className="w-full pl-12 pr-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-black text-slate-900"
                      placeholder="0"
                      value={formData.brokerCommissionPerMT ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brokerCommissionPerMT: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  {formData.quantity && formData.brokerCommissionPerMT ? (
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1 mt-1">
                      Total Commission: ₹
                      {(
                        formData.quantity * formData.brokerCommissionPerMT || 0
                      ).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="pt-6 flex gap-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-[#F5F4F0] transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={!isValid(orderRules())}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {editingOrder ? "Update Order" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch/Assign Modal (Preserved but logic cleanup) */}
      {isAssignModalOpen && assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50 shrink-0">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">
                Dispatch Trip
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAssignmentSubmit} className="flex flex-col flex-1 overflow-hidden">
               <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {/* LOGIC 4: TPS & Client Balance Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                 {selectedRoute && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${stationBalance < 10000 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                      <Info size={16} />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest leading-none">Pool Balance: {selectedRoute.source}</p>
                        <p className="text-sm font-black">₹{stationBalance.toLocaleString()}</p>
                      </div>
                    </div>
                 )}
                 {(() => {
                   const client = clients.find(c => c.name === assigningOrder?.clientName);
                   const balance = client?.outstandingBalance ?? 0;
                   return (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${balance > 50000 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-[#F5F4F0] border-slate-100 text-slate-700'}`}>
                      <User size={16} />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest leading-none">Outstanding: {assigningOrder?.clientName}</p>
                        <p className="text-sm font-black">₹{balance.toLocaleString()}</p>
                      </div>
                    </div>
                   );
                 })()}
              </div>

              <div className="space-y-4">
                <SearchableSelect
                  label="Select Truck"
                  value={assignmentData.truckId ?? ""}
                  onChange={(truckId) => {
                    const truck = trucks.find((t) => t.id === truckId);
                    setAssignmentData({
                      ...assignmentData,
                      truckId,
                      routeId:
                        truck?.defaultRouteId || assignmentData.routeId,
                    });
                  }}
                  options={[
                    ...trucks.filter(t => t.status === 'AVAILABLE' && !t.isMaintenanceMode).map((t) => ({
                      value: t.id,
                      label: t.truckNumber,
                      sub: t.driverName && t.driverName !== 'Unassigned' ? `Driver: ${t.driverName}` : 'No Driver Assigned'
                    })),
                    ...trucks.filter(t => t.isMaintenanceMode).map((t) => ({
                      value: t.id,
                      label: `${t.truckNumber} (MAINTENANCE)`,
                      sub: 'Asset Disabled',
                      disabled: true
                    })),
                    ...trucks.filter(t => t.status === 'ON_TRIP' && !t.isMaintenanceMode).map((t) => ({
                      value: t.id,
                      label: `${t.truckNumber} (ON TRIP)`,
                      sub: 'Currently Busy',
                      disabled: true
                    }))
                  ]}
                  placeholder="Choose an available asset..."
                  onCreateNew={(name) => setQuickAdd({ type: 'truck', initialName: name })}
                  createNewLabel="Add Truck"
                />
                
                <SearchableSelect
                  label="Select Route (TPS → Client)"
                  value={assignmentData.routeId ?? ""}
                  onChange={async (routeId) => {
                    const route = routes.find(r => r.id === routeId);
                    setAssignmentData({
                      ...assignmentData,
                      routeId,
                    });

                    // LOGIC 9: Smart Delivery Date Prediction
                    if (route && assigningOrder) {
                      const travelDays = Math.ceil(route.distanceKm / 400); // Assume 400km per day for transit safety
                      const suggestedDate = new Date();
                      suggestedDate.setDate(suggestedDate.getDate() + travelDays);

                      const ok = await showConfirm({ message: `Suggested Delivery Date based on ${route.distanceKm}KM is ${suggestedDate.toISOString().split('T')[0]}. Update order?`, confirmLabel: 'Update' });
                      if (ok) {
                        onUpdateOrder({
                          ...assigningOrder,
                          deliveryDate: suggestedDate.toISOString().split('T')[0]
                        });
                      }
                    }
                  }}
                  options={routes.map((r) => ({
                    value: r.id,
                    label: `${r.source} → ${r.destination}`,
                    sub: `${r.distanceKm} KM — Route Master`
                  }))}
                  placeholder="Choose trip route..."
                  onCreateNew={(name) => setQuickAdd({ type: 'route', initialName: name })}
                  createNewLabel="Add Route"
                />
              </div>
            </div>
            <div className="p-8 pt-0">
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isDispatching ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MessageCircle size={20} />
                  )}{" "}
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quickAdd && (
        <QuickAddModal
          entityType={quickAdd.type}
          initialName={quickAdd.initialName}
          onClose={() => setQuickAdd(null)}
          onCreated={(entity) => {
            setQuickAdd(null);
            if (quickAdd.type === 'client' && onAddClient) {
              onAddClient(entity);
              setFormData(prev => ({ ...prev, clientName: entity.name }));
            } else if (quickAdd.type === 'site' && onAddSite) {
              onAddSite(entity);
              setFormData(prev => ({ ...prev, projectSite: entity.name }));
            } else if (quickAdd.type === 'broker' && onAddBroker) {
              onAddBroker(entity);
              setFormData(prev => ({ ...prev, brokerId: entity.id, brokerName: entity.name }));
            } else if (quickAdd.type === 'route' && onAddRoute) {
              onAddRoute(entity);
              setAssignmentData(prev => ({ ...prev, routeId: entity.id }));
            } else if (quickAdd.type === 'driver' && onAddDriver) {
              onAddDriver(entity);
            } else if (quickAdd.type === 'truck' && onAddTruck) {
              onAddTruck(entity);
              setAssignmentData(prev => ({ ...prev, truckId: entity.id }));
            }
          }}
        />
      )}
    </div>
  );
};

export default OrdersView;
