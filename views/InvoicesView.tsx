
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  IndianRupee, 
  Calendar, 
  FileText, 
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Edit,
  Printer,
  ShieldCheck,
  QrCode,
  Mail,
  History,
  TrendingUp,
  CreditCard,
  Building2,
  Package,
  Eye,
  Check,
  Ban,
  ReceiptText,
  FileCheck,
  FileWarning,
  Hash,
  ArrowUp,
  MapPin,
  User,
  Banknote,
  Percent,
  Calculator,
  BellRing,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
  Receipt,
  FileStack,
  ArrowLeft,
  Truck as TruckIcon,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Invoice, InvoiceStatus, Client, Order, TripStatus, PaymentEntry, Site, ItemProduct, Truck, Driver, Bank } from '../types';
import { SearchableSelect } from '../components/SearchableSelect';
import { useToast } from '../components/Toast';

interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[];
  orders: Order[];
  sites: Site[];
  itemProducts: ItemProduct[];
  trucks: Truck[];
  drivers: Driver[];
  banks?: Bank[];
  settings: any;
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateOrder: (order: Order) => void;
  onUpdateSite: (site: Site) => void;
  onUpdateClient: (client: Client) => void;
}

const generatePerfectPDF = async (elementOrId: HTMLElement | string, filename: string) => {
  const source = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!source) return;

  const parent = source.parentElement;
  const isHidden = parent?.classList.contains('hidden') || parent?.style.display === 'none';
  const originalParentStyle = parent ? parent.style.cssText : '';
  const originalParentClassName = parent ? parent.className : '';

  const originalClassName = source.className;
  const originalStyle = source.style.cssText;

  const noPrintElements = Array.from(source.querySelectorAll('.no-print')) as HTMLElement[];
  const originalNoPrintDisplays = noPrintElements.map(el => ({
    el,
    display: el.style.display
  }));

  const divs = Array.from(source.querySelectorAll('div'));
  const pages = divs.filter(el => {
    const styleAttr = el.getAttribute('style') || '';
    return styleAttr.includes('width: 210mm') || styleAttr.includes('width:210mm') || el.style.width === '210mm';
  });

  const originalPagesStyles = pages.map(el => ({
    el,
    className: el.className,
    styleCssText: el.style.cssText
  }));

  try {
    if (isHidden && parent) {
      parent.className = "";
      parent.style.cssText = "position: fixed; left: -9999px; top: 0; width: 210mm; display: block; z-index: 9999;";
    }

    noPrintElements.forEach(el => {
      el.style.display = 'none';
    });

    source.className = "flex flex-col items-center bg-white relative";
    source.style.padding = "0";
    source.style.margin = "0";
    source.style.gap = "0";

    pages.forEach((page, index) => {
      page.className = "bg-white overflow-hidden relative";
      page.style.width = "210mm";
      page.style.height = "296.5mm";
      page.style.minHeight = "296.5mm";
      page.style.maxHeight = "296.5mm";
      page.style.margin = "0";
      page.style.padding = "11mm 15mm";
      page.style.boxSizing = "border-box";
      page.style.boxShadow = "none";
      page.style.border = "none";
      page.style.outline = "none";

      if (index < pages.length - 1) {
        page.style.pageBreakAfter = "always";
        page.style.breakAfter = "page";
      } else {
        page.style.pageBreakAfter = "avoid";
        page.style.breakAfter = "avoid";
      }
    });

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true },
      pagebreak: { mode: 'css' as const }
    };

    await html2pdf().from(source).set(opt).save();

  } catch (error) {
    console.error('Perfect PDF Generation Error:', error);
    throw error;
  } finally {
    if (isHidden && parent) {
      parent.className = originalParentClassName;
      parent.style.cssText = originalParentStyle;
    }

    source.className = originalClassName;
    source.style.cssText = originalStyle;

    originalNoPrintDisplays.forEach(item => {
      item.el.style.display = item.display;
    });

    originalPagesStyles.forEach(item => {
      item.el.className = item.className;
      item.el.style.cssText = item.styleCssText;
    });
  }
};

const getDynamicChunks = (items: any[], normalLimit = 10, lastPageLimit = 5) => {
  if (items.length <= lastPageLimit) {
    return [items];
  }
  const chunks = [];
  let currentIndex = 0;
  while (currentIndex < items.length) {
    const remainingCount = items.length - currentIndex;
    if (remainingCount <= lastPageLimit) {
      chunks.push(items.slice(currentIndex));
      break;
    }
    if (remainingCount > lastPageLimit && remainingCount <= normalLimit) {
      const takeCount = Math.ceil(remainingCount / 2);
      chunks.push(items.slice(currentIndex, currentIndex + takeCount));
      currentIndex += takeCount;
    } else {
      chunks.push(items.slice(currentIndex, currentIndex + normalLimit));
      currentIndex += normalLimit;
    }
  }
  return chunks;
};

const numberToIndianWords = (num: number): string => {
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const doubleDigits = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const formatGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += singleDigits[n] + ' ';
      } else {
        str += doubleDigits[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          str += singleDigits[n % 10] + ' ';
        }
      }
    }
    return str.trim();
  };

  const roundedAmount = Math.round(num * 100) / 100;
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);

  let rupeesStr = '';
  let r = rupees;

  if (r === 0) {
    rupeesStr = 'Zero ';
  } else {
    if (r >= 10000000) {
      const crore = Math.floor(r / 10000000);
      rupeesStr += formatGroup(crore) + ' Crore ';
      r %= 10000000;
    }
    if (r >= 100000) {
      const lakh = Math.floor(r / 100000);
      rupeesStr += formatGroup(lakh) + ' Lakh ';
      r %= 100000;
    }
    if (r >= 1000) {
      const thousand = Math.floor(r / 1000);
      rupeesStr += formatGroup(thousand) + ' Thousand ';
      r %= 1000;
    }
    if (r > 0) {
      rupeesStr += formatGroup(r) + ' ';
    }
  }

  let finalStr = 'Rupees ' + rupeesStr.trim();
  
  if (paise > 0) {
    finalStr += ' and ' + formatGroup(paise) + ' Paise';
  }
  
  return finalStr.trim() + ' Only';
};

const InvoicesView: React.FC<InvoicesViewProps> = ({ 
  invoices, 
  clients, 
  orders, 
  sites, 
  itemProducts, 
  trucks,
  drivers,
  banks = [],
  settings, 
  onAddInvoice, 
  onUpdateInvoice, 
  onDeleteInvoice,
  onUpdateOrder,
  onUpdateSite,
  onUpdateClient
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'>('ALL');
  const [billingSubTab, setBillingSubTab] = useState<'SITES' | 'CLIENTS'>('CLIENTS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [bulkSelectedBankId, setBulkSelectedBankId] = useState<string | null>(null);
  const [bulkInvoicesBankId, setBulkInvoicesBankId] = useState<string | null>(null);
  const [bulkExportData, setBulkExportData] = useState({
    clientId: 'ALL',
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
    endDate: new Date().toISOString().split('T')[0]
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'preview' | 'payments' | 'history'>('preview');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentFormData, setPaymentFormData] = useState<Partial<PaymentEntry>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    mode: 'RTGS',
    referenceNo: '',
    note: ''
  });
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isBulkPrint, setIsBulkPrint] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [shipmentStartDate, setShipmentStartDate] = useState('');
  const [shipmentEndDate, setShipmentEndDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterClientId, setFilterClientId] = useState('ALL');
  const [filterProductName, setFilterProductName] = useState('ALL');
  const [filterSiteName, setFilterSiteName] = useState('ALL');
  const [filterTruckId, setFilterTruckId] = useState('ALL');
  const [showFilters, setShowFilters] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState<'client' | 'trips' | 'tax'>('client');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [modalScrollProgress, setModalScrollProgress] = useState(0);
  const [isFullView, setIsFullView] = useState<'NONE' | 'SITES' | 'CLIENTS'>('NONE');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const clientFilterOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Clients', sub: 'No client filter' },
      ...(clients || []).map(c => ({
        value: c.id,
        label: c.name,
        sub: c.gstNumber || ''
      }))
    ];
  }, [clients]);

  const productFilterOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Products', sub: 'No product filter' },
      ...(itemProducts || []).map(p => ({
        value: p.productName,
        label: p.productName,
        sub: `HSN/SAC: ${p.hsnSacCode || 'N/A'}`
      }))
    ];
  }, [itemProducts]);

  const siteFilterOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Stations & Sites', sub: 'No filter' },
      ...(sites || []).map(s => ({
        value: s.name,
        label: s.name,
        sub: `${s.type === 'TPS' ? 'TPS (Station)' : 'Client Site'} • ${s.location || s.city || ''}`
      }))
    ];
  }, [sites]);

  const truckFilterOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Trucks', sub: 'No truck filter' },
      ...(trucks || []).map(t => ({
        value: t.id,
        label: t.truckNumber,
        sub: t.ownerName || ''
      }))
    ];
  }, [trucks]);

  useEffect(() => {
    const handleScroll = () => {
        setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, filterStartDate, filterEndDate, filterClientId, filterProductName, filterSiteName, filterTruckId]);

  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setModalScrollProgress(progress);
  };

  const initialForm: Partial<Invoice> = {
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    orderIds: [],
    poNumber: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    soNumber: `SO-${Math.floor(1000 + Math.random() * 9000)}`,
    ewayBill: '',
    sacCode: '9965',
    placeOfSupply: 'Gujarat (24)',
    bankAccount: settings?.bankDetails?.[0]?.bankName || '',
    selectedBankId: settings?.bankDetails?.[0]?.id || '',
    gstRate: 5,
    gstType: 'CGST_SGST',
    tdsAmount: 0,
    tcsRate: 0,
    tcsAmount: 0,
    discountAmount: 0,
    roundOff: 0,
    autoRoundOff: 0,
    notes: '',
    status: InvoiceStatus.DRAFT,
    terms: '1. Payment due within 30 days.\n2. Interest @ 18% p.a. for late payments.\n3. Weight at destination is final.'
  };

  const [formData, setFormData] = useState<Partial<Invoice>>(initialForm);

  // Automation: Check for OVERDUE invoices
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    invoices.forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const isPastDue = dueDate < today;
      
      // Only update if it's past due and NOT already marked as OVERDUE
      if (isPastDue && inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED && inv.status !== InvoiceStatus.OVERDUE) {
        onUpdateInvoice({
          ...inv,
          status: InvoiceStatus.OVERDUE,
          overdueCount: (inv.overdueCount || 0) + 1,
          history: [
            ...inv.history,
            { 
              action: 'EDITED', 
              user: 'System', 
              timestamp: new Date().toLocaleString(), 
              note: `Status automatically marked as OVERDUE. This is the ${(inv.overdueCount || 0) + 1} time this invoice has been past due. Due date was ${inv.dueDate}.` 
            }
          ]
        });
      }
    });
  }, [invoices, onUpdateInvoice]); 

  // Dynamically calculate Real-time Outstanding Stats for Registry
  const billingStats = useMemo(() => {
    const siteBalances: Record<string, number> = {};
    const clientBalances: Record<string, number> = {};

    invoices.forEach(inv => {
      if (inv.status === InvoiceStatus.CANCELLED || inv.status === InvoiceStatus.PAID) return;
      
      const unpaid = inv.totalAmount - inv.paidAmount;
      if (unpaid <= 0) return;

      // Update Client Balance
      clientBalances[inv.clientId] = (clientBalances[inv.clientId] || 0) + unpaid;

      // Update Site Balance (looking up from first order linked)
      const firstOrder = orders.find(o => o.id === inv.orderIds[0]);
      if (firstOrder && firstOrder.projectSite) {
        siteBalances[firstOrder.projectSite] = (siteBalances[firstOrder.projectSite] || 0) + unpaid;
      }
    });

    return { siteBalances, clientBalances };
  }, [invoices, orders]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      
      // Get all linked orders for this invoice to search their details
      const linkedOrders = orders.filter(o => inv.orderIds.includes(o.id));
      
      const orderSearchString = linkedOrders.map(o => {
        const truck = trucks.find(t => t.id === o.assignedTruckId);
        return [
          o.id,
          o.materialName || '',
          o.projectSite || '',
          o.brokerName || '',
          o.soNo || '',
          o.dcNo || '',
          truck?.truckNumber || '',
          truck?.driverName || ''
        ].join(' ').toLowerCase();
      }).join(' ');

      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientGst.toLowerCase().includes(q) ||
        (inv.orderIds || []).some(id => id.toLowerCase().includes(q)) ||
        (inv.poNumber || '').toLowerCase().includes(q) ||
        (inv.soNumber || '').toLowerCase().includes(q) ||
        orderSearchString.includes(q);

      const isOverdue = (i: Invoice) => {
        const isPastDue = new Date(i.dueDate) < new Date();
        return i.status === InvoiceStatus.OVERDUE || (isPastDue && i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED);
      };
      const matchesTab = activeTab === 'ALL' || (activeTab === 'OVERDUE' ? isOverdue(inv) : inv.status === activeTab);

      const matchesStartDate = !filterStartDate || inv.date >= filterStartDate;
      const matchesEndDate = !filterEndDate || inv.date <= filterEndDate;
      const matchesClient = filterClientId === 'ALL' || inv.clientId === filterClientId;
      const matchesProduct = filterProductName === 'ALL' || linkedOrders.some(o => o.materialName === filterProductName);
      const matchesSite = filterSiteName === 'ALL' || linkedOrders.some(o => o.projectSite === filterSiteName);
      const matchesTruck = filterTruckId === 'ALL' || linkedOrders.some(o => o.assignedTruckId === filterTruckId);

      return matchesSearch && matchesTab && matchesStartDate && matchesEndDate && matchesClient && matchesProduct && matchesSite && matchesTruck;
    });
  }, [invoices, searchQuery, activeTab, orders, trucks, filterStartDate, filterEndDate, filterClientId, filterProductName, filterSiteName, filterTruckId]);

  const hasActiveFilters = 
    filterStartDate !== '' || 
    filterEndDate !== '' || 
    filterClientId !== 'ALL' || 
    filterProductName !== 'ALL' || 
    filterSiteName !== 'ALL' || 
    filterTruckId !== 'ALL';

  const clearAllFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterClientId('ALL');
    setFilterProductName('ALL');
    setFilterSiteName('ALL');
    setFilterTruckId('ALL');
  };

  const blockedOrderIds = useMemo(() => {
    const blocked = new Set<string>();
    (invoices || []).forEach(inv => {
      // If we are currently editing an invoice, the order IDs already on that invoice are not blocked
      if (formData.id && inv.id === formData.id) return;
      
      if (inv.status !== InvoiceStatus.CANCELLED) {
        (inv.orderIds || []).forEach(id => blocked.add(id));
      }
    });
    return blocked;
  }, [invoices, formData.id]);

  const deliveredTrips = useMemo(() => {
    return orders.filter(o => {
      const isDelivered = o.status === TripStatus.DELIVERED;
      const matchesClient = !formData.clientId || o.clientName === (clients || []).find(c => c.id === formData.clientId)?.name;
      
      if (!isDelivered || !matchesClient) return false;
      if (blockedOrderIds.has(o.id)) return false;

      const q = shipmentSearchQuery.toLowerCase();
      const matchesSearch = 
        !q || 
        o.id.toLowerCase().includes(q) ||
        (o.materialName || '').toLowerCase().includes(q) ||
        (o.projectSite || '').toLowerCase().includes(q) ||
        (o.brokerName || '').toLowerCase().includes(q);

      const tripDate = o.deliveryDate || o.pickupDate;
      const matchesDate = 
        (!shipmentStartDate || tripDate >= shipmentStartDate) &&
        (!shipmentEndDate || tripDate <= shipmentEndDate);

      return matchesSearch && matchesDate;
    });
  }, [orders, formData.clientId, clients, shipmentSearchQuery, shipmentStartDate, shipmentEndDate, blockedOrderIds]);

  const billableClients = useMemo(() => {
    const clientsWithDeliveredOrders = new Set(
      orders
        .filter(o => o.status === TripStatus.DELIVERED && !blockedOrderIds.has(o.id))
        .map(o => o.clientName)
    );
    return clients.filter(c => clientsWithDeliveredOrders.has(c.name));
  }, [clients, orders, blockedOrderIds]);

  const calculateTotals = (selectedOrders: string[], gstR: number, tds: number, manualRoundOff: number, discount: number, tcsR: number) => {
    const linkedOrders = orders.filter(o => selectedOrders.includes(o.id));
    const sub = linkedOrders.reduce((acc, o) => acc + (o.quantity * o.ratePerMT), 0);
    const afterDiscount = sub - discount;
    const gstAmt = (afterDiscount * gstR) / 100;
    const amountBeforeTcs = afterDiscount + gstAmt;
    const tcsAmt = (amountBeforeTcs * tcsR) / 100;
    
    const rawTotal = amountBeforeTcs + tcsAmt - tds + manualRoundOff;
    const totalAmount = Math.round(rawTotal);
    const autoRoundOff = Number((totalAmount - rawTotal).toFixed(2));
    
    return { sub, afterDiscount, gstAmt, tcsAmt, totalAmount, autoRoundOff, manualRoundOff };
  };

  const totals = useMemo(() => {
    return calculateTotals(
      formData.orderIds || [],
      formData.gstRate || 18,
      formData.tdsAmount || 0,
      formData.roundOff || 0,
      formData.discountAmount || 0,
      formData.tcsRate || 0
    );
  }, [formData.orderIds, formData.gstRate, formData.tdsAmount, formData.roundOff, formData.discountAmount, formData.tcsRate]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const currentInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateNew = () => {
    setFormData(initialForm);
    setActiveFormTab('client');
    setIsModalOpen(true);
  };

  const handleEdit = (inv: Invoice) => {
    setFormData({
      ...inv,
      subTotal: Number(inv.subTotal) || 0,
      gstRate: Number(inv.gstRate) || 0,
      gstAmount: Number(inv.gstAmount) || 0,
      tdsAmount: Number(inv.tdsAmount) || 0,
      discountAmount: Number(inv.discountAmount) || 0,
      tcsRate: Number(inv.tcsRate) || 0,
      tcsAmount: Number(inv.tcsAmount) || 0,
      roundOff: Number(inv.roundOff) || 0,
      autoRoundOff: Number(inv.autoRoundOff) || 0,
      totalAmount: Number(inv.totalAmount) || 0,
      paidAmount: Number(inv.paidAmount) || 0,
    });
    setActiveFormTab('client');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    onDeleteInvoice(id);
  };

  const handleCancel = (inv: Invoice) => {
    const reason = "Cancelled by Admin";
    onUpdateInvoice({
      ...inv,
      status: InvoiceStatus.CANCELLED,
      previousStatus: inv.status,
      history: [...inv.history, {
        action: 'CANCELLED',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: reason
      }]
    });
  };

  const handleUncancel = (inv: Invoice) => {
    const targetStatus = inv.previousStatus || InvoiceStatus.DRAFT;
    onUpdateInvoice({
      ...inv,
      status: targetStatus,
      previousStatus: undefined,
      history: [...inv.history, {
        action: 'EDITED',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: `Invoice uncancelled and moved back to ${targetStatus} status.`
      }]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || formData.orderIds?.length === 0) {
      toast('Required: Client and at least one trip.', 'warning');
      return;
    }

    const client = (clients || []).find(c => c.id === formData.clientId);
    const invoiceData: Invoice = {
      ...(formData as Invoice),
      id: formData.id || `INV-${Date.now()}`,
      invoiceNumber: formData.invoiceNumber || `FA/24-25/${(invoices.length + 1).toString().padStart(3, '0')}`,
      clientName: client?.name || 'Unknown',
      clientGst: client?.gstNumber || 'N/A',
      subTotal: totals.sub,
      gstAmount: totals.gstAmt,
      tcsAmount: totals.tcsAmt,
      totalAmount: totals.totalAmount,
      roundOff: totals.manualRoundOff,
      autoRoundOff: totals.autoRoundOff,
      paidAmount: formData.paidAmount || 0,
      payments: formData.payments || [],
      history: formData.history ? [
        ...formData.history,
        { action: 'EDITED', user: 'Admin', timestamp: new Date().toLocaleString() }
      ] : [{
        action: 'CREATED',
        user: 'Admin',
        timestamp: new Date().toLocaleString()
      }]
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDueDate = new Date(invoiceData.dueDate);
    newDueDate.setHours(0, 0, 0, 0);

    const isFullyPaid = Math.abs(invoiceData.paidAmount - invoiceData.totalAmount) < 0.1 || invoiceData.paidAmount >= invoiceData.totalAmount;
    const isPartiallyPaid = invoiceData.paidAmount > 0 && !isFullyPaid;
    
    if (isFullyPaid) invoiceData.status = InvoiceStatus.PAID;
    else if (isPartiallyPaid && invoiceData.status !== InvoiceStatus.CANCELLED) {
      // If it was overdue but now has a future date, and is partially paid, it should probably be PARTIAL
      if (invoiceData.status === InvoiceStatus.OVERDUE && newDueDate >= today) {
        invoiceData.status = InvoiceStatus.PARTIAL;
        invoiceData.history.push({
          action: 'EDITED',
          user: 'Admin',
          timestamp: new Date().toLocaleString(),
          note: `Due date extended to ${invoiceData.dueDate}. Invoice moved to PARTIAL status.`
        });
      } else {
        invoiceData.status = InvoiceStatus.PARTIAL;
      }
    }
    else if (invoiceData.status === InvoiceStatus.OVERDUE && newDueDate >= today) {
      invoiceData.status = InvoiceStatus.SENT;
      invoiceData.history.push({
        action: 'EDITED',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: `Due date extended to ${invoiceData.dueDate}. Invoice moved back to SENT tab.`
      });
    } else if (!formData.id) {
      invoiceData.status = InvoiceStatus.SENT;
    }

    if (formData.id) {
      onUpdateInvoice(invoiceData);
    } else {
      onAddInvoice(invoiceData);
    }
    setIsModalOpen(false);
  };

  const handleAddPaymentClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentFormData({
      date: new Date().toISOString().split('T')[0],
      amount: inv.totalAmount - inv.paidAmount,
      fromWhere: inv.clientName,
      bankId: '',
      mode: 'RTGS',
      referenceNo: '',
      note: ''
    });
    setIsPaymentModalOpen(true);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = Number(paymentFormData.amount);
    if (amt <= 0) return;

    const newPayment: PaymentEntry = {
      id: `PAY-${Date.now()}`,
      date: paymentFormData.date || new Date().toISOString().split('T')[0],
      amount: amt,
      mode: (paymentFormData.mode as any) || 'RTGS',
      referenceNo: paymentFormData.referenceNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      note: paymentFormData.note,
      bankId: paymentFormData.bankId,
      fromWhere: paymentFormData.fromWhere
    };

    const updatedPaid = selectedInvoice.paidAmount + amt;
    const isFullyPaid = Math.abs(updatedPaid - selectedInvoice.totalAmount) < 0.1 || updatedPaid >= selectedInvoice.totalAmount;
    
    onUpdateInvoice({
      ...selectedInvoice,
      paidAmount: updatedPaid,
      payments: [...selectedInvoice.payments, newPayment],
      status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
      history: [...selectedInvoice.history, {
        action: 'PAID',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: `Received ₹${amt} via ${newPayment.mode}. Ref: ${newPayment.referenceNo}`
      }]
    });

    if (isFullyPaid) {
      (selectedInvoice.orderIds || []).forEach(oid => {
        const order = orders.find(o => o.id === oid);
        if (order) onUpdateOrder({ ...order, status: TripStatus.PAID });
      });
    }

    setIsPaymentModalOpen(false);
  };

  const handleMarkAsPaid = (inv: Invoice) => {
    if (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.CANCELLED) return;
    
    const amt = inv.totalAmount - inv.paidAmount;
    const newPayment: PaymentEntry = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      mode: 'RTGS',
      referenceNo: 'MANUAL-PAID',
      note: 'Marked as fully paid manually'
    };

    onUpdateInvoice({
      ...inv,
      paidAmount: inv.totalAmount,
      payments: [...inv.payments, newPayment],
      status: InvoiceStatus.PAID,
      history: [...inv.history, {
        action: 'PAID',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: 'Marked as fully paid manually.'
      }]
    });

    (inv.orderIds || []).forEach(oid => {
      const order = orders.find(o => o.id === oid);
      if (order) onUpdateOrder({ ...order, status: TripStatus.PAID });
    });
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    if (isGeneratingPdf) return;

    onUpdateInvoice({
      ...inv,
      history: [...inv.history, {
        action: 'INVOICE_DOWNLOADED',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: 'PDF Invoice generated and downloaded.'
      }]
    });

    // Set view to preview mode for the selected invoice
    setIsBulkPrint(false);
    setSelectedInvoice(inv);
    setDetailTab('preview');
    setIsDetailOpen(true);

    // Increased delay to ensure all assets (fonts, images) are fully rendered in the DOM
    setIsGeneratingPdf(true);
    setTimeout(async () => {
      try {
        await generatePerfectPDF('printable-invoice', `Invoice_${inv.invoiceNumber}.pdf`);
      } catch {
        setPdfError('Could not export the invoice. Please close and try again.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 2000);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedInvoiceIds.length} selected invoices?`)) {
      selectedInvoiceIds.forEach(id => handleDelete(id));
      setSelectedInvoiceIds([]);
    }
  };

  const handleBulkPreview = () => {
    if (selectedInvoiceIds.length === 0) return;
    setIsBulkPrint(true);
    setDetailTab('preview');
    setIsDetailOpen(true);
    setBulkInvoicesBankId(null); // Reset selection
  };

  const executeBulkDownload = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generatePerfectPDF('printable-invoice', `Batch_Invoices_${new Date().getTime()}.pdf`);
    } catch {
      setPdfError('Could not export the batch invoices. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMarkAsSentBulk = () => {
    if (selectedInvoiceIds.length === 0) return;
    
    selectedInvoiceIds.forEach(id => {
      const inv = (invoices || []).find(i => i.id === id);
      if (inv && inv.status === InvoiceStatus.DRAFT) {
        onUpdateInvoice({
          ...inv,
          status: InvoiceStatus.SENT,
          history: [
            ...inv.history,
            {
              action: 'SENT',
              user: 'Admin',
              timestamp: new Date().toLocaleString(),
              note: 'Batch status update to SENT'
            }
          ]
        });
      }
    });
    
    setSelectedInvoiceIds([]);
    setActiveTab('SENT');
  };

  const handleShareWhatsApp = (inv: Invoice) => {
    const msg = `FlyAsh Pro Logistics: Invoice ${inv.invoiceNumber} for ₹${(inv.totalAmount || 0).toLocaleString()} is ready. View here: [LINK]`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handleSendReminder = (inv: Invoice) => {
    onUpdateInvoice({
      ...inv,
      history: [...inv.history, {
        action: 'REMINDER_SENT',
        user: 'Admin',
        timestamp: new Date().toLocaleString(),
        note: 'E-mail payment reminder sent to client.'
      }]
    });
    toast('Payment reminder sent successfully.', 'success');
  };

  // Helper inside component to render common content
  const renderBulkTemplateContent = () => {
    const filteredInvoices = invoices.filter(inv => {
       const isNotCancelled = inv.status !== InvoiceStatus.CANCELLED;
       const matchesClient = bulkExportData.clientId === 'ALL' || inv.clientId === bulkExportData.clientId;
       const matchesDate = inv.date >= bulkExportData.startDate && inv.date <= bulkExportData.endDate;
       return isNotCancelled && matchesClient && matchesDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Create a faster lookup for order-to-invoice mapping for accurate tax/code logic
    const orderToInvoiceMap = new Map();
    filteredInvoices.forEach(inv => {
      (inv.orderIds || []).forEach(id => orderToInvoiceMap.set(id, inv));
    });

    const allOrderIds = filteredInvoices.flatMap(inv => inv.orderIds);
    const selectedOrders = orders.filter(o => allOrderIds.includes(o.id));
    
    // Group orders dynamically to make sure the footer page has at most 5 items for perfect layout fit
    const chunks = getDynamicChunks(selectedOrders, 10, 5);

    const client = clients.find(c => c.id === bulkExportData.clientId);
    const totalSub = filteredInvoices.reduce((sum, inv) => sum + inv.subTotal, 0);
    const totalGst = filteredInvoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
    const totalTcs = filteredInvoices.reduce((sum, inv) => sum + (inv.tcsAmount || 0), 0);
    const totalRoundOff = filteredInvoices.reduce((sum, inv) => sum + (inv.roundOff || 0) + (inv.autoRoundOff || 0), 0);
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return (
      <div className="flex flex-col gap-16 print:gap-0 items-center">
        {chunks.map((chunk, pageIndex) => (
          <div key={pageIndex} className="bg-white print:shadow-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 print:ring-0 print:break-after-page mb-8 overflow-hidden relative" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
             {/* Header Section (Same to same as Single Preview) */}
             <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                   <h1 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight leading-none">{settings?.companyName?.toUpperCase() || 'ARMIN TRANSPORT CO'}</h1>
                   <p className="text-[11px] font-bold text-slate-600 mt-2">{settings?.companyAddress || 'AT& PO Songadh Tapi.'}</p>
                   <p className="text-[11px] font-medium text-slate-500">Phone: {settings?.companyContact || '9426365268'} • Email: {settings?.companyEmail?.toUpperCase() || 'ARMINTRANSPORT1@GMAIL.COM'}</p>
                   <div className="mt-2 flex gap-4 t-label">
                     <span>GSTIN: <span className="text-slate-900">{settings?.companyGst || '24AARFA6502G1ZM'}</span></span>
                     <span>State: <span className="text-slate-900">24-Gujarat</span></span>
                   </div>
                </div>
                <div className="w-20 h-20 flex items-center justify-center border-2 border-slate-100 rounded-2xl p-1 bg-[#F5F4F0]/50 overflow-hidden shadow-inner">
                  {settings?.companyLogo ? (
                    <img 
                      src={settings.companyLogo}
                      alt="Company Logo"
                      className="w-full h-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center font-black text-slate-300 italic">
                      <span className="text-3xl">{settings?.companyName?.substring(0, 2).toUpperCase() || 'ATC'}</span>
                      <div className="absolute inset-0 border border-slate-200 rounded-full scale-75 opacity-20" />
                    </div>
                  )}
                </div>
             </div>

             <div className="text-center py-2 mb-6 border-y-2 border-blue-500 bg-blue-50/30">
                <h2 className="text-xl font-black text-blue-600 uppercase tracking-[0.2em]">Consolidated Tax Statement</h2>
             </div>

             {pageIndex === 0 && (
                <div className="grid grid-cols-3 gap-8 mb-8 text-[11px]">
                   <div className="space-y-1">
                      <p className="font-black border-b border-slate-200 pb-1 mb-2 text-blue-600 uppercase tracking-widest">Bill To</p>
                      <p className="text-sm font-black text-slate-900 leading-tight">{client?.name || 'Multiple Accounts'}</p>
                      <div className="font-medium text-slate-600 whitespace-pre-line leading-relaxed mt-1">
                         {client ? `${client.address}\n${client.city}, ${client.state} - ${client.pincode}` : 'Consolidated Report for All Restricted Accounts'}
                      </div>
                      {client && (
                         <div className="mt-3 p-2 bg-[#F5F4F0] rounded border border-slate-100">
                           <p className="font-bold text-slate-900">GSTIN: {client.gstNumber}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">STATE: {client.state}</p>
                         </div>
                      )}
                   </div>
                   <div className="space-y-1">
                      <p className="font-black border-b border-slate-200 pb-1 mb-2 text-blue-600 uppercase tracking-widest">Transport Scope</p>
                      <div className="space-y-2 flex flex-col">
                        <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">Period:</span> <span className="font-black text-slate-900">{bulkExportData.startDate} — {bulkExportData.endDate}</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">Invoices:</span> <span className="font-black text-slate-900">{filteredInvoices.length} Documents</span></div>
                        <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">Total Trips:</span> <span className="font-black text-blue-600">{selectedOrders.length} Count</span></div>
                      </div>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="font-black border-b border-slate-200 pb-1 mb-2 text-right text-blue-600 uppercase tracking-widest">Document Info</p>
                      <p className="text-xs font-black text-slate-900"># REF-{Date.now().toString().slice(-6)}</p>
                      <p className="font-black text-slate-900 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Place of Supply</p>
                      <p className="font-bold text-slate-700">24-GUJARAT</p>
                   </div>
                </div>
             )}

             <div className="flex-1">
               <table className="w-full border-collapse mb-4 text-[11px]">
                  <thead>
                     <tr className="bg-[#00A5E3] text-white">
                        <th className="p-2 border border-blue-600 text-center w-10">#</th>
                        <th className="p-2 border border-blue-600 text-left">Item Description</th>
                        <th className="p-2 border border-blue-600 text-center">HSN/SAC</th>
                        <th className="p-2 border border-blue-600 text-right">Quantity</th>
                        <th className="p-2 border border-blue-600 text-right">Rate</th>
                        <th className="p-2 border border-blue-600 text-right">GST</th>
                        <th className="p-2 border border-blue-600 text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="text-[10px]">
                     {chunk.map((o, idx) => {
                        const parentInv = orderToInvoiceMap.get(o.id);
                        const gstRate = parentInv?.gstRate || 5;
                        const sacCode = parentInv?.sacCode || '9965';
                        const lineSub = o.quantity * o.ratePerMT;
                        const lineGst = lineSub * (gstRate / 100);
                        const lineTotal = lineSub + lineGst;
                        
                        return (
                          <tr key={o.id} className="border-b border-slate-100 group">
                             <td className="p-2 border-x border-slate-100 text-center text-slate-400">{(pageIndex * 10) + idx + 1}</td>
                             <td className="p-2 border-r border-slate-100">
                                <p className="uppercase font-bold text-slate-900">{o.materialName || o.productName || 'FLY-ASH'}</p>
                                <p className="text-[9px] text-slate-400 font-bold">Site: {o.projectSite || 'N/A'}</p>
                             </td>
                             <td className="p-2 border-r border-slate-100 text-center text-slate-600">{sacCode}</td>
                             <td className="p-2 border-r border-slate-100 text-right font-black">{Number(o.quantity).toFixed(3)} MT</td>
                             <td className="p-2 border-r border-slate-100 text-right font-bold">₹ {o.ratePerMT.toLocaleString()}</td>
                             <td className="p-2 border-r border-slate-100 text-right leading-none">
                                <p className="font-bold">₹ {lineGst.toLocaleString()}</p>
                                <p className="text-[8px] text-slate-400 font-bold">({gstRate}%)</p>
                             </td>
                             <td className="p-2 text-right font-black">₹ {lineTotal.toLocaleString()}</td>
                          </tr>
                        );
                     })}
                     {/* Fill remaining space depending on whether this is the last page with the large footer */}
                     {Array.from({ length: Math.max(0, (pageIndex === chunks.length - 1 ? 5 : 10) - chunk.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-10 border-b border-slate-50"><td className="border-x border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td/></tr>
                     ))}
                  </tbody>
               </table>
             </div>

             {pageIndex === chunks.length - 1 ? (
                <div className="mt-8 border-t-2 border-slate-200 pt-6">
                   <div className="flex justify-between gap-12 text-[11px]">
                      <div className="flex-1 space-y-6">
                         <div>
                            <p className="font-black text-blue-600 uppercase mb-1 text-[10px] tracking-widest">Consolidated Amount In Words</p>
                            <p className="text-slate-900 font-black italic capitalize leading-relaxed text-xs">{numberToIndianWords(totalAmount)}</p>
                         </div>
                         <div className="p-4 bg-[#F5F4F0] border-2 border-slate-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                               <p className="font-black text-blue-600 uppercase text-[10px] tracking-widest">Settlement Account</p>
                               <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[8px] font-black uppercase tracking-tighter">Verified</div>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                               {(() => {
                                 // Use explicitly selected bank or fallback to first invoice default
                                 const bank = settings?.bankDetails?.find((b: any) => b.id === (bulkSelectedBankId || filteredInvoices[0]?.selectedBankId)) || settings?.bankDetails?.[0];
                                 return bank ? (
                                   <div className="space-y-1">
                                      <div className="flex justify-between border-b border-slate-200/50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">Bank:</span> <span className="font-black text-slate-900">{bank.bankName}</span></div>
                                      <div className="flex justify-between border-b border-slate-200/50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">A/C No:</span> <span className="font-black text-slate-900 tracking-wider">{bank.accountNo}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">IFSC Code:</span> <span className="font-black text-slate-900 uppercase">{bank.ifscCode}</span></div>
                                   </div>
                                 ) : (
                                   <div className="text-slate-400 italic font-bold">No verified bank account linked.</div>
                                 );
                               })()}
                            </div>
                         </div>
                         
                         <div className="pt-2">
                            <p className="font-black text-slate-900 uppercase text-[10px] border-b border-slate-100 pb-1 mb-2">Terms & Conditions</p>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed whitespace-pre-line">1. Consolidated statement subject to clerical verification.\n2. Weight at destination site will be final for settlement.\n3. Payment due within 15 days of presentation of this report.</p>
                         </div>
                      </div>
                      
                      <div className="w-72 space-y-2">
                         <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Taxable Sub Total</span> <span className="font-black text-slate-900">₹ {totalSub.toLocaleString()}</span></div>
                         <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Consolidated CGST</span> <span className="font-black text-slate-900">₹ {(totalGst/2).toLocaleString()}</span></div>
                         <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Consolidated SGST</span> <span className="font-black text-slate-900">₹ {(totalGst/2).toLocaleString()}</span></div>
                         {totalTcs > 0 && <div className="flex justify-between py-1 border-b border-slate-100 text-amber-600 italic"><span className="font-bold uppercase text-[10px]">Total TCS Applied</span> <span className="font-black">₹ {totalTcs.toLocaleString()}</span></div>}
                         <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Total Round Off</span> <span className="font-black text-slate-900">₹ {totalRoundOff.toLocaleString()}</span></div>
                         
                         <div className="flex justify-between bg-blue-600 text-white p-4 rounded-2xl shadow-xl mt-4 items-center ring-4 ring-blue-50">
                            <div className="flex flex-col">
                               <span className="font-black uppercase tracking-widest text-[9px] opacity-70">Payable Balance</span>
                               <span className="font-black text-xs">Full Consolidated Amount</span>
                            </div>
                            <span className="text-xl font-black font-mono">₹ {totalAmount.toLocaleString()}</span>
                         </div>
                         
                         <div className="pt-8 text-center">
                            <div className="mb-2 h-20 flex items-end justify-center">
                               {settings?.companySignature ? (
                                  <img src={settings.companySignature} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                               ) : (
                                  <div className="w-24 h-12 border-2 border-blue-600/10 rounded-full flex items-center justify-center opacity-10">
                                     <span className="text-[10px] font-black text-blue-600 italic">SIG STAMP</span>
                                  </div>
                               )}
                            </div>
                            <p className="font-black text-slate-900 text-xs text-center">For, {settings?.companyName?.toUpperCase() || 'ARMIN TRANSPORT'}</p>
                            <div className="mt-2 h-0.5 bg-slate-900 w-40 mx-auto opacity-10" />
                            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest leading-none">Authorized Signatory</p>
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="mt-8 py-6 border-t border-dashed border-slate-200 text-center">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Continued on next page...</p>
                </div>
             )}
             
             <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                   <span>Consolidated Shipping Report</span>
                </div>
                <span>Page {pageIndex + 1} of {chunks.length}</span>
             </div>
          </div>
        ))}
      </div>
    );
  };

  if (isFullView !== 'NONE') {
    const isSites = isFullView === 'SITES';
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => setIsFullView('NONE')}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-black text-xs uppercase mb-2"
            >
              <ArrowLeft size={16} /> Back to Billing Hub
            </button>
            <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">
              {isSites ? 'Station & Site Billing Ledger' : 'Client-Wise Outstanding Registry'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Comprehensive breakdown of all {isSites ? 'stations and project sites' : 'corporate accounts'}.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 px-6">
                <div className={`w-3 h-3 rounded-full ${isSites ? 'bg-blue-600' : 'bg-indigo-600'}`}></div>
                <span className="text-sm font-black text-slate-900">Total {isSites ? 'Stations & Sites' : 'Clients'}: {isSites ? sites.length : clients.length}</span>
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-xl min-h-[60vh]">
          {isSites ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {sites.map(site => (
                  <div key={site.id} className="p-6 bg-[#F5F4F0] rounded-2xl border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                     <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                           <MapPin size={20} />
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${site.type === 'TPS' ? 'bg-slate-200 text-slate-700 font-extrabold' : 'bg-blue-50 text-blue-600 font-extrabold'}`}>
                              {site.type === 'TPS' ? 'TPS' : 'Site'}
                           </span>
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${(billingStats.siteBalances[site.name] || 0) > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                              {(billingStats.siteBalances[site.name] || 0) > 0 ? 'Action Needed' : 'In Sync'}
                           </span>
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{site.location || 'Project Location'}</p>
                        <h4 className="text-lg font-black text-slate-900 truncate">{site.name}</h4>
                     </div>
                     <div className="pt-4 border-t border-slate-200/60 mt-auto">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Outstanding</p>
                        <p className={`text-2xl font-black ${(billingStats.siteBalances[site.name] || 0) > 50000 ? 'text-red-600' : 'text-slate-900'}`}>
                           ₹{(billingStats.siteBalances[site.name] || 0).toLocaleString()}
                        </p>
                     </div>
                  </div>
               ))}
               {sites.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400 text-sm font-bold">No active stations or client sites found.</div>
               )}
            </div>
          ) : (
            <div className="page-stack pb-10">
               <div className="relative mb-4">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search corporate account by name..."
                   value={clientSearchQuery}
                   onChange={(e) => setClientSearchQuery(e.target.value)}
                   className="w-full max-w-xl pl-12 pr-4 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                 />
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-100">
                           <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-4 w-1/3">Corporate Account / Client</th>
                           <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                           <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Compliance</th>
                           <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Outstanding Balance</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {clients
                          .filter(c => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                          .map(client => (
                           <tr key={client.id} className="group hover:bg-[#F5F4F0]/80 transition-colors">
                              <td className="py-6 pl-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
                                       {client.name.charAt(0)}
                                    </div>
                                    <div>
                                       <span className="text-base font-black text-slate-900 block">{client.name}</span>
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic">{client.id}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-6">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-800">{client.contactPerson}</span>
                                    <span className="text-xs font-bold text-slate-500">{client.phone}</span>
                                 </div>
                              </td>
                              <td className="py-6">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-700">GST: {client.gstNumber}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{client.email}</span>
                                 </div>
                              </td>
                              <td className="py-6 text-right pr-4">
                                 <div className="flex flex-col items-end">
                                    <span className={`text-xl font-black ${(billingStats.clientBalances[client.id] || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                       ₹{(billingStats.clientBalances[client.id] || 0).toLocaleString()}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                       {(billingStats.clientBalances[client.id] || 0) > 100000 ? 'High Priority Aging' : 'Standard Account'}
                                    </span>
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {clients.filter(c => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length === 0 && (
                           <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400 text-sm font-bold">No clients found matching your research.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Invoice Command Center</h2>
          <p className="text-slate-500 text-sm font-medium">Compliance, Aging & Receivable Management.</p>
        </div>
        <div className="flex gap-3">
           <button 
              onClick={() => setIsBulkExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs hover:bg-[#F5F4F0] transition-all"
           >
              <Download size={16} /> Bulk Export
           </button>
           <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
           >
            <Plus size={20} /> Create New
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="Total Billing" value={`₹${(invoices.filter(i => i.status !== InvoiceStatus.CANCELLED).reduce((a,b) => a+b.totalAmount, 0) || 0).toLocaleString()}`} icon={TrendingUp} color="blue" />
         <StatCard label="Overdue" value={`₹${(invoices.filter(i => {
           const isPastDue = new Date(i.dueDate) < new Date();
           return i.status === InvoiceStatus.OVERDUE || (isPastDue && i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED);
         }).reduce((a,b) => a+b.totalAmount, 0) || 0).toLocaleString()}`} icon={Clock} color="red" />
         <StatCard label="GST Collected" value={`₹${(invoices.filter(i => i.status !== InvoiceStatus.CANCELLED).reduce((a,b) => a+b.gstAmount, 0) || 0).toLocaleString()}`} icon={ShieldCheck} color="green" />
         <StatCard label="Receivables" value={`₹${(invoices.filter(i => i.status !== InvoiceStatus.CANCELLED).reduce((a,b) => a + (b.totalAmount - b.paidAmount), 0) || 0).toLocaleString()}`} icon={Banknote} color="indigo" />
      </div>

      {/* FEATURE: BILLING REGISTRY (SITE & CLIENT OUTSTANDING) */}
      <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-100/50 transition-all duration-700" />
         
         <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 relative z-10">
            <div className="flex items-center gap-6">
               <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 transition-transform group-hover:rotate-12">
                  <Calculator size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     Billing Registry 
                     <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                        Live Sync
                     </span>
                  </h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Real-time Outstanding Balance & Receivables</p>
                </div>
             </div>
             <div className="flex items-center gap-3 bg-[#F5F4F0] p-1.5 rounded-xl border border-slate-100">
               {/* Station & Site Aging tab removed
               <button
                 onClick={() => setBillingSubTab('SITES')}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${billingSubTab === 'SITES' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <MapPin size={14} /> Station & Site Aging
               </button>
               */}
               <button
                 onClick={() => setBillingSubTab('CLIENTS')}
                 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${billingSubTab === 'CLIENTS' ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <User size={14} /> Client-Wise Balance
               </button>
            </div>
         </div>

         {billingSubTab === 'SITES' ? (
           /* Station & Site Aging tab content removed
           <div className="page-stack pb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                 {sites.slice(0, 8).map(site => (
                    <div key={site.id} className="p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100 flex flex-col gap-1 hover:bg-white hover:shadow-md transition-all">
                       <div className="flex justify-between items-center gap-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase truncate">{site.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${site.type === 'TPS' ? 'bg-slate-200 text-slate-700' : 'bg-blue-50 text-blue-600'}`}>
                             {site.type === 'TPS' ? 'TPS' : 'Site'}
                          </span>
                       </div>
                       <p className={`text-lg font-black ${(billingStats.siteBalances[site.name] || 0) > 50000 ? 'text-red-600' : 'text-slate-900'}`}>
                          ₹{(billingStats.siteBalances[site.name] || 0).toLocaleString()}
                       </p>
                       <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${(billingStats.siteBalances[site.name] || 0) > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                          <span className="text-[8px] font-black text-slate-400 uppercase">Status: {(billingStats.siteBalances[site.name] || 0) > 0 ? 'DUE' : 'CLEAR'}</span>
                       </div>
                    </div>
                 ))}
                 {sites.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold">No stations or sites found in Master Data.</div>
                 )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsFullView('SITES')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-blue-600 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <Eye size={14} /> View More Stations & Sites
                </button>
              </div>
           </div>
           */
           null
         ) : (
           <div className="space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search client by name..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full max-w-md pl-10 pr-4 py-2 bg-[#F5F4F0] border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 t-label pl-2">Client Name</th>
                      <th className="pb-4 t-label">Contact Person</th>
                      <th className="pb-4 t-label">Phone</th>
                      <th className="pb-4 t-label text-right pr-2">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {clients
                      .filter(c => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                      .slice(0, 10)
                      .map(client => (
                      <tr key={client.id} className="group hover:bg-[#F5F4F0]/50 transition-colors">
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                              {client.name.charAt(0)}
                            </div>
                            <span className="text-sm font-black text-slate-900">{client.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-600">{client.contactPerson}</td>
                        <td className="py-4 text-xs font-bold text-slate-600">{client.phone}</td>
                        <td className="py-4 text-right pr-2">
                          <span className={`text-sm font-black ${(billingStats.clientBalances[client.id] || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{(billingStats.clientBalances[client.id] || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {clients.filter(c => c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-bold">No clients match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsFullView('CLIENTS')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <Eye size={14} /> View More Clients
                </button>
              </div>
           </div>
         )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sticky top-4 z-40 bg-[#F5F4F0]/80 backdrop-blur-md p-2 rounded-2xl -m-2">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Inv #, Client, Order id, Product, Site, Broker, Truck, Driver, SO/PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E7E5E0] rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all font-bold"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border transition-all font-black text-xs uppercase shadow-sm ${
              showFilters 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-[#F5F4F0]'
            }`}
            title="Toggle Advanced Filters"
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {(['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200/60 shadow-sm mt-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
                <SlidersHorizontal size={16} />
              </div>
              <h4 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">Advanced Billing Filters</h4>
            </div>
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shadow-sm"
              >
                <X size={14} /> Clear All Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</span>
              <input 
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E7E5E0] rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm text-xs font-bold text-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">To Date</span>
              <input 
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E7E5E0] rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm text-xs font-bold text-slate-700"
              />
            </div>
            <SearchableSelect
              label="Client"
              value={filterClientId}
              options={clientFilterOptions}
              onChange={(val) => setFilterClientId(val)}
            />
            <SearchableSelect
              label="Product"
              value={filterProductName}
              options={productFilterOptions}
              onChange={(val) => setFilterProductName(val)}
            />
            <SearchableSelect
              label="Station / Site"
              value={filterSiteName}
              options={siteFilterOptions}
              onChange={(val) => setFilterSiteName(val)}
            />
            <SearchableSelect
              label="Truck"
              value={filterTruckId}
              options={truckFilterOptions}
              onChange={(val) => setFilterTruckId(val)}
            />
          </div>
        </div>
      )}

      {filteredInvoices.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm mb-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                const allCurrentIds = currentInvoices.map(inv => inv.id);
                const hasAllCurrentSelected = allCurrentIds.every(id => selectedInvoiceIds.includes(id));
                
                if (hasAllCurrentSelected) {
                  // Deselect current page
                  setSelectedInvoiceIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
                } else {
                  // Select current page
                  setSelectedInvoiceIds(prev => {
                    const next = [...prev];
                    allCurrentIds.forEach(id => {
                      if (!next.includes(id)) next.push(id);
                    });
                    return next;
                  });
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#F5F4F0] hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                currentInvoices.every(i => selectedInvoiceIds.includes(i.id)) 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : selectedInvoiceIds.some(i => currentInvoices.some(ci => ci.id === i))
                    ? 'bg-blue-100 border-blue-300 text-blue-600'
                    : 'bg-white border-slate-300'
              }`}>
                {currentInvoices.every(i => selectedInvoiceIds.includes(i.id)) ? (
                  <Check size={10} className="stroke-[3px]" />
                ) : selectedInvoiceIds.some(i => currentInvoices.some(ci => ci.id === i)) ? (
                  <div className="w-2 h-0.5 bg-blue-600 rounded" />
                ) : null}
              </div>
              Select Current Page ({currentInvoices.length})
            </button>

            <button
              onClick={() => {
                const allFilteredIds = filteredInvoices.map(inv => inv.id);
                const hasAllFilteredSelected = allFilteredIds.every(id => selectedInvoiceIds.includes(id));

                if (hasAllFilteredSelected) {
                  // Deselect all matching
                  setSelectedInvoiceIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                } else {
                  // Select all matching
                  setSelectedInvoiceIds(prev => {
                    const next = [...prev];
                    allFilteredIds.forEach(id => {
                      if (!next.includes(id)) next.push(id);
                    });
                    return next;
                  });
                }
              }}
              className="px-3.5 py-2 bg-[#F5F4F0] hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
            >
              Select All Filtered ({filteredInvoices.length})
            </button>

            {selectedInvoiceIds.length > 0 && (
              <button
                onClick={() => setSelectedInvoiceIds([])}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-rose-100 cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="text-right text-xs text-slate-500 font-extrabold uppercase tracking-wide">
            {selectedInvoiceIds.length} of {filteredInvoices.length} Selected
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500 pb-8">
        {currentInvoices.map((inv) => (
          <div key={inv.id} className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-300 p-8 group flex flex-col relative ${selectedInvoiceIds.includes(inv.id) ? 'border-blue-500 bg-blue-50/10' : inv.status === InvoiceStatus.CANCELLED ? 'border-red-50 bg-[#F5F4F0]/50' : 'border-slate-100'}`}>
             <div className="absolute top-6 left-6 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvoiceIds(prev => 
                      prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id]
                    );
                  }}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedInvoiceIds.includes(inv.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'
                  }`}
                >
                  {selectedInvoiceIds.includes(inv.id) && <Check size={14} />}
                </button>
             </div>
             <div className={`${selectedInvoiceIds.includes(inv.id) ? 'opacity-100' : ''} flex items-start justify-between mb-6 pl-10`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all ${
                    inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-600' : 
                    inv.status === InvoiceStatus.PARTIAL ? 'bg-amber-50 text-amber-600' :
                    inv.status === InvoiceStatus.OVERDUE ? 'bg-rose-50 text-rose-600' :
                    inv.status === InvoiceStatus.CANCELLED ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <ReceiptText size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h3 className="text-xl font-black text-slate-900">{inv.invoiceNumber}</h3>
                       <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                          inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-600 border-green-200' :
                          inv.status === InvoiceStatus.PARTIAL ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          inv.status === InvoiceStatus.OVERDUE ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          inv.status === InvoiceStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                       }`}>
                          {inv.status}
                       </span>
                    </div>
                    <p className="text-sm font-black text-blue-600 mt-1 uppercase tracking-tight">{inv.clientName}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="t-label">Payable</p>
                   <p className="text-2xl font-black text-[#1C1917] tracking-tight">₹{(inv.totalAmount || 0).toLocaleString()}</p>
                   {inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount && (
                     <p className="text-xs font-black text-amber-600 mt-1">
                       Remaining: ₹{(inv.totalAmount - inv.paidAmount).toLocaleString()}
                     </p>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Aging</span>
                   <span className="text-xs font-black text-slate-900">{Math.floor((Date.now() - new Date(inv.date).getTime()) / (1000*60*60*24))} Days</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Due Date</span>
                   <span className={`text-xs font-black ${new Date(inv.dueDate) < new Date() && inv.status !== InvoiceStatus.PAID ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                      {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                   </span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Orders</span>
                   <span className="text-xs font-black text-slate-900">{(inv.orderIds || []).length} Linked</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center shadow-sm">
                   <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Collection</span>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-green-500 h-full transition-all" style={{ width: `${(inv.paidAmount / inv.totalAmount) * 100}%` }} />
                   </div>
                </div>
             </div>

             <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-tight">
                   <History size={12} className="text-indigo-500"/> {inv.gstType} ({inv.gstRate}%)
                </div>
                {inv.overdueCount && inv.overdueCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-lg border border-rose-100 text-[9px] font-black text-rose-600 uppercase tracking-tight">
                     <Clock size={12}/> Overdue x{inv.overdueCount}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F4F0] rounded-lg border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-tight">
                   <MapPin size={12} className="text-slate-400"/> {inv.placeOfSupply}
                </div>
                {inv.ewayBill && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F4F0] rounded-lg border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-tight">
                    <QrCode size={12} className="text-slate-400"/> E-Way: {inv.ewayBill}
                  </div>
                )}
                {inv.soNumber && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F4F0] rounded-lg border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-tight">
                    <FileText size={12} className="text-blue-500"/> SO: {inv.soNumber}
                  </div>
                )}
                {inv.poNumber && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F4F0] rounded-lg border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-tight">
                    <ShieldCheck size={12} className="text-green-500"/> PO: {inv.poNumber}
                  </div>
                )}
                {(() => {
                  const linkedOrders = orders.filter(o => inv.orderIds.includes(o.id));
                  const uniqSites = Array.from(new Set(linkedOrders.map(o => o.projectSite).filter(Boolean)));
                  const uniqProducts = Array.from(new Set(linkedOrders.map(o => o.materialName).filter(Boolean)));
                  const uniqTrucks = Array.from(new Set(linkedOrders.map(o => {
                    const truck = trucks.find(t => t.id === o.assignedTruckId);
                    return truck?.truckNumber;
                  }).filter(Boolean)));
                  
                  return (
                    <>
                      {uniqSites.map(site => (
                        <div key={site} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/50 rounded-lg border border-blue-100 text-[9px] font-black text-blue-600 uppercase tracking-tight">
                          <MapPin size={12}/> {site}
                        </div>
                      ))}
                      {uniqProducts.map(prod => (
                        <div key={prod} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/50 rounded-lg border border-amber-100 text-[9px] font-black text-amber-600 uppercase tracking-tight">
                          <Package size={12}/> {prod}
                        </div>
                      ))}
                      {uniqTrucks.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-tight">
                          <TruckIcon size={12}/> {uniqTrucks.length} {uniqTrucks.length === 1 ? 'Truck' : 'Trucks'}
                        </div>
                      )}
                    </>
                  );
                })()}
             </div>

             <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto relative">
                <div className="flex gap-1">
                   <button onClick={() => handleDownloadInvoice(inv)} disabled={isGeneratingPdf} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed" title="Download PDF">{isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>}</button>
                   <button onClick={() => handleEdit(inv)} className="p-2.5 bg-[#F5F4F0] text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all" title="Edit"><Edit size={18}/></button>
                   <button onClick={() => handleAddPaymentClick(inv)} disabled={inv.status === InvoiceStatus.CANCELLED} className={`p-2.5 rounded-xl transition-all ${inv.status === InvoiceStatus.CANCELLED ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white shadow-md'}`} title={inv.status === InvoiceStatus.CANCELLED ? "Cannot add payment to cancelled invoice" : "Add Billing Record"}><IndianRupee size={18}/></button>
                   <button onClick={() => handleMarkAsPaid(inv)} disabled={inv.status === InvoiceStatus.CANCELLED} className={`p-2.5 rounded-xl transition-all ${inv.status === InvoiceStatus.CANCELLED ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-[#F5F4F0] text-slate-400 hover:bg-blue-600 hover:text-white'}`} title={inv.status === InvoiceStatus.CANCELLED ? "Cannot mark cancelled invoice as paid" : "Mark as Paid"}><Check size={18}/></button>
                   {inv.status === InvoiceStatus.CANCELLED && (
                      <button 
                        onClick={() => handleUncancel(inv)} 
                        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white shadow-sm" 
                        title="Restore Invoice"
                      >
                        <RotateCcw size={18}/>
                      </button>
                    )}
                   
                   <div className="relative">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === inv.id ? null : inv.id)}
                        className={`p-2.5 rounded-xl transition-all ${openDropdownId === inv.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title="More Actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDropdownId === inv.id && (
                        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="px-4 py-2 border-b border-slate-50 mb-1">
                            <p className="t-label">Invoicing & Sharing</p>
                          </div>
                          <button 
                            onClick={() => { handleDownloadInvoice(inv); setOpenDropdownId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                          >
                            <Download size={16} /> Download PDF
                          </button>
                          <button 
                            onClick={() => { handleShareWhatsApp(inv); setOpenDropdownId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-green-50 hover:text-green-600 transition-all text-left"
                          >
                            <MessageCircle size={16} /> Share via WhatsApp
                          </button>
                          <button 
                            onClick={() => { handleSendReminder(inv); setOpenDropdownId(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-all text-left"
                          >
                            <BellRing size={16} /> Send Payment Reminder
                          </button>
                          <div className="h-px bg-[#F5F4F0] my-1" />
                          {inv.status === InvoiceStatus.CANCELLED ? (
                            <button 
                              onClick={() => { handleUncancel(inv); setOpenDropdownId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-green-600 hover:bg-green-50 transition-all text-left"
                            >
                              <History size={16} /> Uncancel Invoice
                            </button>
                          ) : (
                            <button 
                              onClick={() => { handleCancel(inv); setOpenDropdownId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                            >
                              <Ban size={16} /> Cancel Invoice
                            </button>
                          )}
                        </div>
                      )}
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleDelete(inv.id)} className="p-2.5 bg-white text-slate-400 hover:text-red-600 transition-all" title="Delete Invoice"><Trash2 size={18}/></button>
                   <button onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-black transition-all">Preview</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm mb-32">
           <div className="t-label">
              Showing <span className="text-slate-900">{Math.min(filteredInvoices.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-slate-900">{Math.min(filteredInvoices.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900">{filteredInvoices.length}</span> Invoices
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${currentPage === 1 ? 'bg-[#F5F4F0] text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
              >
                <ArrowLeft size={14} className={currentPage === 1 ? 'text-slate-300' : ''} /> Previous
              </button>
              
              <div className="flex items-center gap-1">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)).map((pageNum, idx, arr) => (
                    <React.Fragment key={pageNum}>
                       {idx > 0 && arr[idx-1] !== pageNum - 1 && <span className="text-slate-300">...</span>}
                       <button
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-slate-900 text-white shadow-xl' : 'bg-[#F5F4F0] text-slate-400 hover:bg-slate-100'}`}
                       >
                          {pageNum}
                       </button>
                    </React.Fragment>
                 ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${currentPage === totalPages ? 'bg-[#F5F4F0] text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
              >
                Next <ArrowLeft size={14} className={`rotate-180 ${currentPage === totalPages ? 'text-slate-300' : ''}`} />
              </button>
           </div>
        </div>
      )}

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-32 right-8 z-[60] w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-600 active:scale-90 transition-all animate-in zoom-in duration-300"
          title="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {selectedInvoiceIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 duration-500">
           <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden py-3 px-8 flex items-center gap-8 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">{selectedInvoiceIds.length}</div>
                 <div>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-none">Selected</p>
                    <p className="text-sm font-black">Invoices</p>
                 </div>
              </div>
              
                 <div className="flex items-center gap-2">
                    <button 
                     onClick={handleMarkAsSentBulk}
                     className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg"
                    >
                       <Send size={16} /> Mark as Sent
                    </button>
                    <button 
                     onClick={handleBulkPreview}
                     className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-blue-50 transition-all shadow-lg border border-slate-200"
                    >
                       <FileStack size={16} className="text-blue-600" /> Preview & Batch
                    </button>
                 <button 
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all"
                 >
                    <Trash2 size={16} /> Delete Selected
                 </button>
                 <button 
                  onClick={() => setSelectedInvoiceIds([])}
                  className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-black text-[10px] uppercase"
                 >
                    Deselect
                 </button>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
               <div>
                  <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{formData.id ? 'Edit Invoice' : 'Generate Tax Invoice'}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">FlyAsh Logistics Accounting • GST Standard</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24} /></button>
            </div>

            <div className="flex bg-[#F5F4F0] border-b border-slate-100 px-10 gap-8">
               {(['client', 'trips', 'tax'] as const).map(tab => (
                 <button 
                  key={tab} 
                  onClick={() => setActiveFormTab(tab)}
                  className={`py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeFormTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                 >
                   {tab === 'client' ? '1. Partner Info' : tab === 'trips' ? '2. Shipment Selection' : '3. Taxation & Totals'}
                 </button>
               ))}
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1">
               {activeFormTab === 'client' && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="t-label px-1">Client Partner*</label>
                            <select 
                                required 
                                className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                value={formData.clientId}
                                onChange={e => {
                                  const cid = e.target.value;
                                  const client = clients.find(c => c.id === cid);
                                  setFormData({
                                    ...formData, 
                                    clientId: cid,
                                    orderIds: [], // Reset selected orders when client changes
                                    placeOfSupply: client ? `${client.state} (${client.city})` : formData.placeOfSupply
                                  });
                                }}
                            >
                                <option value="">Select partner account...</option>
                                {billableClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1">PO & SO Numbers</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input type="text" className="w-full pl-10 pr-4 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs" value={formData.poNumber || ""} onChange={e => setFormData({...formData, poNumber: e.target.value})} placeholder="PO No." />
                              </div>
                              <div className="relative">
                                <ReceiptText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <input type="text" className="w-full pl-10 pr-4 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs" value={formData.soNumber || ""} onChange={e => setFormData({...formData, soNumber: e.target.value})} placeholder="SO No." />
                              </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="t-label px-1">Place of Supply*</label>
                            <input type="text" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={formData.placeOfSupply || ""} onChange={e => setFormData({...formData, placeOfSupply: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1">Invoice Date*</label>
                            <input type="date" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={formData.date || ""} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1">Due Date*</label>
                            <input type="date" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold border-amber-200 bg-amber-50/30" value={formData.dueDate || ""} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="t-label px-1">Company Bank Profile (for Printing)</label>
                        <select 
                          className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" 
                          value={formData.selectedBankId} 
                          onChange={e => {
                            const bank = settings?.bankDetails?.find((b: any) => b.id === e.target.value);
                            setFormData({...formData, selectedBankId: e.target.value, bankAccount: bank ? `${bank.bankName} - ${bank.accountNo}` : ''});
                          }}
                        >
                            <option value="">Choose Settlement Bank...</option>
                            {settings?.bankDetails?.map((bank: any) => (
                              <option key={bank.id} value={bank.id}>{bank.bankName} ({bank.accountNo})</option>
                            ))}
                        </select>
                    </div>
                 </div>
               )}

               {activeFormTab === 'trips' && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
                       <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                             <Package size={18} className="text-blue-600" /> Choose Delivered Trips to Bill
                          </h4>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{formData.orderIds?.length} Selected</span>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative group">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                             <input 
                                type="text"
                                placeholder="Search by Order ID, Product, Site or Broker..."
                                value={shipmentSearchQuery}
                                onChange={(e) => setShipmentSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                             />
                             {shipmentSearchQuery && (
                                <button 
                                  onClick={() => setShipmentSearchQuery('')}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
                                >
                                  <X size={14} />
                                </button>
                             )}
                          </div>
                          <div className="flex gap-2">
                             <div className="flex-1 relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                   type="date"
                                   value={shipmentStartDate}
                                   onChange={(e) => setShipmentStartDate(e.target.value)}
                                   className="w-full pl-9 pr-2 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-[10px] font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                />
                             </div>
                             <div className="flex-1 relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                   type="date"
                                   value={shipmentEndDate}
                                   onChange={(e) => setShipmentEndDate(e.target.value)}
                                   className="w-full pl-9 pr-2 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-[10px] font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                />
                             </div>
                             {(shipmentStartDate || shipmentEndDate) && (
                                <button 
                                  onClick={() => { setShipmentStartDate(''); setShipmentEndDate(''); }}
                                  className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                                  title="Clear Date Filters"
                                >
                                  <X size={16} />
                                </button>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto no-scrollbar p-2">
                        {deliveredTrips.map(o => (
                           <label key={o.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${formData.orderIds?.includes(o.id) ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.orderIds?.includes(o.id)}
                                onChange={e => {
                                   const current = formData.orderIds || [];
                                   if(e.target.checked) setFormData({...formData, orderIds: [...current, o.id]});
                                   else setFormData({...formData, orderIds: current.filter(id => id !== o.id)});
                                }}
                              />
                              <div className="flex-1">
                                 <div className="flex justify-between items-center">
                                    <p className="text-sm font-black text-slate-900">Order #{o.orderNumber ?? '—'}</p>
                                    <span className="text-[10px] font-black text-blue-600">{o.quantity} MT</span>
                                 </div>
                                 <div className="flex flex-col gap-0.5 mt-1">
                                    <p className="text-[11px] text-slate-500 font-bold truncate flex items-center gap-1">
                                       <MapPin size={10} /> {o.projectSite}
                                    </p>
                                    <div className="flex items-center gap-3">
                                       <div className="flex items-center gap-1 text-slate-400">
                                          <Package size={10} />
                                          <span className="text-[9px] font-black uppercase truncate max-w-[80px]">{o.materialName || 'FLY-ASH'}</span>
                                       </div>
                                       {o.brokerName && (
                                          <div className="flex items-center gap-1 text-slate-400">
                                             <User size={10} />
                                             <span className="text-[9px] font-black uppercase truncate max-w-[80px]">{o.brokerName}</span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </label>
                        ))}
                        {deliveredTrips.length === 0 && (
                          <div className="col-span-full py-12 text-center bg-[#F5F4F0] rounded-2xl border border-dashed border-slate-200">
                             <FileWarning size={32} className="mx-auto text-slate-300 mb-2" />
                             <p className="text-xs font-bold text-slate-400 uppercase">No Delivered Orders Found for Billing</p>
                          </div>
                        )}
                    </div>
                    <div className="space-y-3">
                        <label className="t-label px-1">E-Way Bill Number (if applicable)</label>
                        <input type="text" className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={formData.ewayBill ?? ""} onChange={e => setFormData({...formData, ewayBill: e.target.value})} placeholder="12-digit E-Way Bill No." />
                    </div>
                 </div>
               )}

               {activeFormTab === 'tax' && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-6 bg-blue-50/50 border-2 border-blue-100/50 rounded-2xl space-y-6">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                             <Package size={16} />
                          </div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Master Product Sync</h3>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                             <label className="t-label px-1">Select Product Name (Master DB)</label>
                             <select 
                                className="w-full px-5 py-4 bg-white border border-[#E7E5E0] rounded-xl font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                onChange={(e) => {
                                   const product = itemProducts.find(p => p.id === e.target.value);
                                   if (product) {
                                      setFormData({
                                         ...formData,
                                         sacCode: product.hsnSacCode || formData.sacCode,
                                         gstRate: Number(product.gstRate) || formData.gstRate
                                      });
                                   }
                                }}
                             >
                                <option value="">Choose from item-products...</option>
                                {itemProducts.map(p => (
                                   <option key={p.id} value={p.id}>{p.productName}</option>
                                ))}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <label className="t-label px-1">Applicable Services (Operations)</label>
                             <div className="flex flex-wrap gap-2 p-3 bg-white border border-[#E7E5E0] rounded-xl min-h-[58px]">
                                {(() => {
                                   const selectedProd = itemProducts.find(p => p.hsnSacCode === formData.sacCode);
                                   const services = selectedProd?.services || [];
                                   return services.length > 0 ? services.map((s, i) => (
                                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase border border-blue-200">{s}</span>
                                   )) : <span className="text-[10px] text-slate-400 font-bold p-2 italic">Select a product to view operational services</span>;
                                })()}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="t-label px-1">HSN/SAC CODE</label>
                            <input type="text" className="w-full px-5 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={formData.sacCode ?? ""} onChange={e => setFormData({...formData, sacCode: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1">GST Structure</label>
                            <select className="w-full px-5 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={formData.gstType ?? "CGST_SGST"} onChange={e => setFormData({...formData, gstType: e.target.value as any})}>
                                <option value="IGST">IGST (Inter-state)</option>
                                <option value="CGST_SGST">CGST + SGST (Local)</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1">GST Rate (%)</label>
                            <select className="w-full px-5 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={formData.gstRate ?? 5} onChange={e => setFormData({...formData, gstRate: Number(e.target.value)})}>
                                <option value={5}>5% (Transport)</option>
                                <option value={12}>12% (Logistics)</option>
                                <option value={18}>18% (Service)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="t-label px-1 flex items-center gap-2">
                                <Percent size={14} className="text-green-600" /> Add Discount (₹)
                            </label>
                            <input type="number" className="w-full px-5 py-4 bg-white border border-green-200 rounded-2xl font-black text-green-700" value={formData.discountAmount ?? 0} onChange={e => setFormData({...formData, discountAmount: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1 flex items-center gap-2">
                                <Banknote size={14} className="text-indigo-600" /> Retention / TDS (₹)
                            </label>
                            <input type="number" className="w-full px-5 py-4 bg-white border border-indigo-200 rounded-2xl font-black text-indigo-700" value={formData.tdsAmount ?? 0} onChange={e => setFormData({...formData, tdsAmount: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1 flex items-center gap-2">
                                <Calculator size={14} className="text-red-600" /> Round Off (₹)
                            </label>
                            <input type="number" className="w-full px-5 py-4 bg-white border border-red-200 rounded-2xl font-black text-red-700" value={formData.roundOff ?? 0} onChange={e => setFormData({...formData, roundOff: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-3">
                            <label className="t-label px-1 flex items-center gap-2">
                                <Banknote size={14} className="text-amber-600" /> TCS (%)
                            </label>
                            <select className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl font-black text-amber-700" value={formData.tcsRate ?? 0} onChange={e => setFormData({...formData, tcsRate: Number(e.target.value)})}>
                                <option value={0}>No TCS (0%)</option>
                                <option value={0.1}>0.1% (Standard)</option>
                                <option value={1}>1.0% (Special)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden gap-8">
                        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Calculator size={160}/></div>
                        <div className="relative z-10 space-y-2 text-center md:text-left">
                            <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em]">Payable Statement Total</p>
                            <p className="text-5xl font-black tracking-tighter">₹{(totals.totalAmount || 0).toLocaleString()}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">
                                TCS: ₹{(totals.tcsAmt || 0).toLocaleString()} | 
                                System Rounding: ₹{totals.autoRoundOff || 0} | 
                                Manual Round Off: ₹{totals.manualRoundOff || 0}
                            </p>
                        </div>
                        <div className="relative z-10 grid grid-cols-1 gap-2 min-w-[200px]">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase border-b border-white/10 pb-2">
                               <span>Subtotal</span>
                               <span>₹{(totals.sub || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase pt-2">
                               <span>Tax ({formData.gstType})</span>
                               <span>₹{(totals.gstAmt || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="t-label px-1">Specific Terms & Conditions</label>
                        <textarea rows={3} className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs" value={formData.terms ?? ""} onChange={e => setFormData({...formData, terms: e.target.value})} />
                    </div>
                 </div>
               )}

               <div className="pt-8 flex gap-4 sticky bottom-0 bg-white border-t border-slate-50 py-4 z-20">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-5 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-[#F5F4F0] transition-all uppercase tracking-widest text-xs">Discard</button>
                  
                  {activeFormTab !== 'client' && (
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveFormTab(activeFormTab === 'tax' ? 'trips' : 'client');
                      }}
                      className="px-8 py-5 border-2 border-slate-900 text-slate-900 rounded-2xl font-black hover:bg-[#F5F4F0] transition-all uppercase tracking-widest text-xs"
                    >
                      Back
                    </button>
                  )}

                  {activeFormTab !== 'tax' ? (
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (activeFormTab === 'trips' && (!formData.orderIds || formData.orderIds.length === 0)) {
                           toast('Please select at least one shipment to proceed.', 'warning');
                           return;
                        }
                        if (activeFormTab === 'client' && !formData.clientId) {
                           toast('Please select a client to proceed.', 'warning');
                           return;
                        }
                        setActiveFormTab(activeFormTab === 'client' ? 'trips' : 'tax');
                      }} 
                      className="flex-1 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                       Next Step <Check size={16} />
                    </button>
                  ) : (
                    <button type="submit" className="flex-1 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                       <FileCheck size={18} /> {formData.id ? 'Save Changes' : 'Confirm & Finalize'}
                    </button>
                  )}
               </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
               <div>
                  <h3 className="text-xl font-black text-slate-900">Add Billing Record</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">INV: {selectedInvoice.invoiceNumber}</p>
               </div>
               <button onClick={() => setIsPaymentModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={submitPayment} className="p-8 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Total Payable</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{selectedInvoice.status === InvoiceStatus.CANCELLED ? '0' : selectedInvoice.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Remaining</span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{selectedInvoice.status === InvoiceStatus.CANCELLED ? '0' : (selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="t-label px-1">Receive From Where (Client Name)*</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        value={paymentFormData.fromWhere || ''}
                        onChange={e => setPaymentFormData({...paymentFormData, fromWhere: e.target.value})}
                        placeholder="Client Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Select Bank*</label>
                    <div className="relative">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <select 
                        required
                        className="w-full pl-10 pr-4 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                        value={paymentFormData.bankId || ''}
                        onChange={e => setPaymentFormData({...paymentFormData, bankId: e.target.value})}
                      >
                        <option value="">Select Bank...</option>
                        <option value="CASH">Cash (Hand)</option>
                        {settings.bankDetails?.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="t-label px-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="date" 
                        required 
                        className="w-full pl-10 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-xs" 
                        value={paymentFormData.date} 
                        onChange={e => setPaymentFormData({...paymentFormData, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        type="number" 
                        required 
                        step="0.01"
                        max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                        className="w-full pl-10 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-xs" 
                        value={paymentFormData.amount} 
                        onChange={e => setPaymentFormData({...paymentFormData, amount: Number(e.target.value)})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="t-label px-1">Mode</label>
                    <select 
                      required 
                      className="w-full px-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-xs" 
                      value={paymentFormData.mode} 
                      onChange={e => setPaymentFormData({...paymentFormData, mode: e.target.value as any})}
                    >
                      <option value="CASH">CASH</option>
                      <option value="RTGS">RTGS</option>
                      <option value="NEFT">NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Reference No.</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-xs" 
                      placeholder="TXN ID / Chq No" 
                      value={paymentFormData.referenceNo} 
                      onChange={e => setPaymentFormData({...paymentFormData, referenceNo: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="t-label px-1">Private Note</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-xs" 
                    placeholder="Optional details..." 
                    rows={2}
                    value={paymentFormData.note} 
                    onChange={e => setPaymentFormData({...paymentFormData, note: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="flex-1 px-4 py-4 border-2 border-slate-100 rounded-xl font-black text-slate-400 hover:bg-[#F5F4F0] transition-all uppercase tracking-widest text-[10px]"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-4 bg-green-600 text-white rounded-xl font-black shadow-lg hover:bg-green-700 transition-all uppercase tracking-widest text-[10px]"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && (selectedInvoice || isBulkPrint) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`bg-white w-full ${isBulkPrint ? 'max-w-5xl' : 'max-w-4xl'} rounded-[4rem] shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]`}>
             <div className="px-10 py-8 bg-[#F5F4F0] flex items-center justify-between border-b border-slate-100 no-print flex-col sm:flex-row gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText size={24}/></div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1C1917] tracking-tight uppercase tracking-tighter">
                      {isBulkPrint ? 'Bulk Invoices PDF' : detailTab === 'preview' ? 'Invoice Preview' : 'Audit History'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                       {isBulkPrint ? `${selectedInvoiceIds.length} Selected Invoices` : `INV: ${selectedInvoice?.invoiceNumber}`}
                    </p>
                  </div>
                </div>

                {!isBulkPrint && (
                  <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-center">
                    <button 
                      onClick={() => setDetailTab('preview')}
                      className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${detailTab === 'preview' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
                    >
                      Preview
                    </button>
                    <button 
                      onClick={() => setDetailTab('payments')}
                      className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${detailTab === 'payments' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
                    >
                      Payments
                    </button>
                    <button 
                      onClick={() => setDetailTab('history')}
                      className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${detailTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
                    >
                      History
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                    {isBulkPrint ? (
                      <button onClick={executeBulkDownload} disabled={isGeneratingPdf} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed" title="Download Bulk PDF">{isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20}/>}</button>
                    ) : (
                     selectedInvoice && (
                       <button onClick={() => handleDownloadInvoice(selectedInvoice)} disabled={isGeneratingPdf} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed" title="Download PDF">{isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20}/>}</button>
                     )
                   )}
                   <button onClick={() => window.print()} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:bg-[#F5F4F0] transition-all shadow-sm" title="Print Invoices"><Printer size={20}/></button>
                   <button onClick={() => { setIsDetailOpen(false); setIsBulkPrint(false); }} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:rotate-90 transition-all shadow-sm" title="Close"><X size={20}/></button>
                </div>
             </div>

             {isBulkPrint && (
               <div className="h-1 bg-slate-100 no-print flex shrink-0">
                 <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${modalScrollProgress}%` }} />
               </div>
             )}

             <div 
               onScroll={handleModalScroll}
               className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#F5F4F0] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-400 transition-colors relative"
             >
                {isBulkPrint && (
                   <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50 no-print bg-white/40 backdrop-blur-sm p-2 rounded-full border border-white/50">
                      {invoices.filter(i => selectedInvoiceIds.includes(i.id)).map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                             const el = document.getElementById(`invoice-page-${i}`);
                             el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`w-3 h-3 rounded-full transition-all border-2 border-white shadow-sm ${modalScrollProgress > (i / selectedInvoiceIds.length) * 100 && modalScrollProgress < ((i + 1) / selectedInvoiceIds.length) * 100 ? 'bg-blue-600 scale-125' : 'bg-slate-300 hover:bg-blue-400'}`}
                          title={`Page ${i + 1}`}
                        />
                      ))}
                   </div>
                )}

                {detailTab === 'preview' || isBulkPrint ? (
                      <div className="py-20 px-10 print:p-0 flex flex-col items-center bg-[#f8fafc] print:bg-white gap-16 relative" id="printable-invoice">
                        {isBulkPrint && (
                          <div className="sticky top-4 z-[60] w-full max-w-4xl bg-white/90 backdrop-blur-xl border-2 border-blue-100 p-6 rounded-2xl shadow-2xl shadow-blue-900/10 mb-8 no-print flex flex-col sm:flex-row items-center justify-between gap-6 ring-8 ring-blue-50/50">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                <Receipt size={28} />
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Bulk Settlement Update</h4>
                                <p className="text-slate-500 font-medium text-sm">Applying to <span className="text-blue-600 font-bold">{selectedInvoiceIds.length} Invoices</span></p>
                              </div>
                            </div>

                            <div className="flex flex-col min-w-[280px]">
                              <label className="t-label mb-1.5 ml-1">Select Dispatch Account</label>
                              <select 
                                value={bulkInvoicesBankId || ''} 
                                onChange={(e) => setBulkInvoicesBankId(e.target.value || null)}
                                className="w-full bg-[#F5F4F0] border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                              >
                                <option value="">Invoice Defaults (As Individual)</option>
                                {settings?.bankDetails?.map((bank: any) => (
                                  <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNo}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={executeBulkDownload}
                              disabled={isGeneratingPdf}
                              className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                              {isGeneratingPdf ? 'PROCESSING…' : 'PROCESS BATCH'}
                            </button>
                          </div>
                        )}
                        {(isBulkPrint ? invoices.filter(i => selectedInvoiceIds.includes(i.id)) : [selectedInvoice]).map((inv, invIdx) => {
                          if (!inv) return null;
                          const invOrders = orders.filter(o => inv.orderIds.includes(o.id));
                          const chunks = getDynamicChunks(invOrders, 10, 5);
                          return chunks.map((chunk, pageIdx) => (
                            <div key={`${inv.id}-${pageIdx}`} id={pageIdx === 0 ? `invoice-page-${invIdx}` : undefined} className="bg-white print:shadow-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 print:ring-0 print:break-after-page mb-8 overflow-hidden relative" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
                              {/* Header Section */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h1 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight leading-none">{settings?.companyName?.toUpperCase() || 'ARMIN TRANSPORT CO'}</h1>
                                  <p className="text-[11px] font-bold text-slate-600 mt-2">{settings?.companyAddress || 'AT& PO Songadh Tapi.'}</p>
                                  <p className="text-[11px] font-medium text-slate-500">Phone: {settings?.companyContact || '9426365268'} • Email: {settings?.companyEmail?.toUpperCase() || 'ARMINTRANSPORT1@GMAIL.COM'}</p>
                                  <div className="mt-2 flex gap-4 t-label">
                                    <span>GSTIN: <span className="text-slate-900">{settings?.companyGst || '24AARFA6502G1ZM'}</span></span>
                                    <span>State: <span className="text-slate-900">24-Gujarat</span></span>
                                  </div>
                                </div>
                                <div className="w-20 h-20 flex items-center justify-center border-2 border-slate-100 rounded-2xl p-1 bg-[#F5F4F0]/50 overflow-hidden shadow-inner">
                                  {settings?.companyLogo ? (
                                    <img
                                      src={settings.companyLogo}
                                      alt="Company Logo"
                                      className="w-full h-full object-contain mix-blend-multiply"
                                      referrerPolicy="no-referrer"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className="relative w-full h-full flex items-center justify-center font-black text-slate-300 italic">
                                      <span className="text-3xl">{settings?.companyName?.substring(0, 2).toUpperCase() || 'ATC'}</span>
                                      <div className="absolute inset-0 border border-slate-200 rounded-full scale-75 opacity-20" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-center py-2 mb-6 border-y-2 border-blue-500 bg-blue-50/30">
                                <h2 className="text-xl font-black text-blue-600 uppercase tracking-[0.2em]">Tax Invoice</h2>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-3 gap-8 mb-8 text-[11px]">
                                <div className="space-y-1">
                                  <p className="font-black border-b border-slate-200 pb-1 mb-2 text-blue-600 uppercase tracking-widest">Bill To</p>
                                  <p className="text-sm font-black text-slate-900 leading-tight">{inv.clientName}</p>
                                  <div className="font-medium text-slate-600 whitespace-pre-line leading-relaxed mt-1">
                                    {(() => {
                                      const c = clients.find(cl => cl.id === inv.clientId);
                                      return c ? (
                                        <>
                                          {c.address}<br />
                                          {c.city}, {c.state} - {c.pincode}
                                        </>
                                      ) : 'N/A';
                                    })()}
                                  </div>
                                  <div className="mt-3 p-2 bg-[#F5F4F0] rounded border border-slate-100">
                                    <p className="font-bold text-slate-900">GSTIN: {inv.clientGst}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">STATE: {clients.find(cl => cl.id === inv.clientId)?.state?.toUpperCase() || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black border-b border-slate-200 pb-1 mb-2 text-blue-600 uppercase tracking-widest">Transport Details</p>
                                  <div className="space-y-2 flex flex-col">
                                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">PO No:</span> <span className="font-black text-slate-900">{inv.poNumber || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">SO No:</span> <span className="font-black text-slate-900">{inv.soNumber || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">E-Way Bill:</span> <span className="font-black text-slate-900">{inv.ewayBill || 'N/A'}</span></div>
                                  </div>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="font-black border-b border-slate-200 pb-1 mb-2 text-right text-blue-600 uppercase tracking-widest">Invoice Info</p>
                                  <p className="text-xs font-black text-slate-900"># {inv.invoiceNumber}</p>
                                  <p className="font-black text-slate-900 mt-1">Date: {new Date(inv.date).toLocaleDateString('en-GB')}</p>
                                  <p className="font-black text-red-600">Due: {new Date(inv.dueDate).toLocaleDateString('en-GB')}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Place of Supply</p>
                                  <p className="font-bold text-slate-700">{inv.placeOfSupply}</p>
                                </div>
                              </div>

                              {/* Table Content */}
                              <div>
                                <table className="w-full border-collapse mb-4 text-[11px]">
                                  <thead>
                                    <tr className="bg-[#00A5E3] text-white">
                                      <th className="p-2 border border-blue-600 text-center w-10">#</th>
                                      <th className="p-2 border border-blue-600 text-left">Item Description</th>
                                      <th className="p-2 border border-blue-600 text-center">HSN/SAC</th>
                                      <th className="p-2 border border-blue-600 text-right">Quantity</th>
                                      <th className="p-2 border border-blue-600 text-right">Rate</th>
                                      <th className="p-2 border border-blue-600 text-right">GST</th>
                                      <th className="p-2 border border-blue-600 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chunk.map((o, idx) => (
                                      <tr key={o.id} className="border-b border-slate-100 group">
                                        <td className="p-2 border-x border-slate-100 text-center text-slate-400">{(pageIdx * 10) + idx + 1}</td>
                                        <td className="p-2 border-r border-slate-100">
                                          <p className="uppercase font-bold text-slate-900">{o.materialName || 'FLY-ASH'}</p>
                                          <p className="text-[9px] text-slate-400 font-bold">Site: {o.projectSite}</p>
                                        </td>
                                        <td className="p-2 border-r border-slate-100 text-center text-slate-600">{inv.sacCode}</td>
                                        <td className="p-2 border-r border-slate-100 text-right font-bold">{Number(o.quantity).toFixed(3)} MT</td>
                                        <td className="p-2 border-r border-slate-100 text-right font-bold">₹{o.ratePerMT.toLocaleString()}</td>
                                        <td className="p-2 border-r border-slate-100 text-right leading-none">
                                          <p className="font-bold">₹{(o.quantity * o.ratePerMT * (inv.gstRate / 100)).toLocaleString()}</p>
                                          <p className="text-[8px] text-slate-400 font-bold">({inv.gstRate}%)</p>
                                        </td>
                                        <td className="p-2 text-right font-black">₹{(o.quantity * o.ratePerMT * (1 + inv.gstRate / 100)).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                    {Array.from({ length: Math.max(0, (pageIdx === chunks.length - 1 ? 5 : 10) - chunk.length) }).map((_, i) => (
                                      <tr key={`f-${i}`} className="h-10 border-b border-slate-50"><td className="border-x border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td className="border-r border-slate-50"/><td/></tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Footer content - Last page only */}
                              {pageIdx === chunks.length - 1 ? (
                                <div className="mt-8 border-t-2 border-slate-200 pt-6">
                                  <div className="flex justify-between gap-12 text-[11px]">
                                    <div className="flex-1 space-y-6">
                                      <div>
                                        <p className="font-black text-blue-600 uppercase mb-1 text-[10px] tracking-widest">Amount In Words</p>
                                        <p className="text-slate-900 font-black italic capitalize leading-relaxed text-xs">{numberToIndianWords(inv.totalAmount)}</p>
                                      </div>
                                      <div className="p-4 bg-[#F5F4F0] border-2 border-slate-100 rounded-2xl">
                                        <div className="flex justify-between items-center mb-3">
                                          <p className="font-black text-blue-600 uppercase text-[10px] tracking-widest">Settlement Account</p>
                                          <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[8px] font-black uppercase tracking-tighter">Verified</div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1">
                                          {(() => {
                                            // Apply bulk selection if set, otherwise fallback to individual invoice preference
                                            const targetBankId = (isBulkPrint && bulkInvoicesBankId) ? bulkInvoicesBankId : inv.selectedBankId;
                                            const bank = settings?.bankDetails?.find((b: any) => b.id === targetBankId) || settings?.bankDetails?.[0];
                                            
                                            return bank ? (
                                              <div className="space-y-1">
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">Bank:</span> <span className="font-black text-slate-900">{bank.bankName}</span></div>
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">A/C No:</span> <span className="font-black text-slate-900 tracking-wider">{bank.accountNo}</span></div>
                                                <div className="flex justify-between border-b border-slate-200/50 pb-1"><span className="text-slate-400 font-bold uppercase text-[9px]">IFSC Code:</span> <span className="font-black text-slate-900 uppercase">{bank.ifscCode}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Branch:</span> <span className="font-black text-slate-900">{bank.branchName || 'Main Branch'}</span></div>
                                              </div>
                                            ) : <p className="font-black text-slate-900">{inv.bankAccount}</p>;
                                          })()}
                                        </div>
                                      </div>
                                      
                                      <div className="pt-2">
                                        <p className="font-black text-slate-900 uppercase text-[10px] border-b border-slate-100 pb-1 mb-2">Terms & Conditions</p>
                                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed whitespace-pre-line">{inv.terms || '1. Payments are due within 15 days of invoice date.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Weight & Quality at Destination will be final.'}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="w-72 space-y-2">
                                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Sub Total</span> <span className="font-black text-slate-900">₹ {inv.subTotal.toLocaleString()}</span></div>
                                      {inv.discountAmount > 0 && <div className="flex justify-between py-1 border-b border-slate-100 text-green-600"><span className="font-bold uppercase text-[10px]">Discount</span> <span className="font-black">- ₹ {inv.discountAmount.toLocaleString()}</span></div>}
                                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">CGST @ {(inv.gstRate/2).toFixed(1)}%</span> <span className="font-black text-slate-900">₹ {(inv.gstAmount/2).toLocaleString()}</span></div>
                                      <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">SGST @ {(inv.gstRate/2).toFixed(1)}%</span> <span className="font-black text-slate-900">₹ {(inv.gstAmount/2).toLocaleString()}</span></div>
                                      {inv.tcsAmount > 0 && <div className="flex justify-between py-1 border-b border-slate-100 text-amber-600 italic"><span className="font-bold uppercase text-[10px]">TCS @ {inv.tcsRate}%</span> <span className="font-black">₹ {inv.tcsAmount.toLocaleString()}</span></div>}
                                      {(inv.roundOff !== 0 || inv.autoRoundOff !== 0) && <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Round Off</span> <span className="font-black text-slate-900">₹ {((inv.roundOff || 0) + (inv.autoRoundOff || 0)).toLocaleString()}</span></div>}
                                      
                                      <div className="flex justify-between bg-blue-600 text-white p-4 rounded-2xl shadow-xl mt-4 items-center ring-4 ring-blue-50">
                                        <div className="flex flex-col">
                                          <span className="font-black uppercase tracking-widest text-[9px] opacity-70">Total Amount Payable</span>
                                          <span className="font-black text-xs">Inclusive of GST</span>
                                        </div>
                                        <span className="text-xl font-black font-mono">₹ {inv.totalAmount.toLocaleString()}</span>
                                      </div>
                                      
                                      <div className="pt-8 text-center">
                                        <div className="mb-2 h-20 flex items-end justify-center">
                                           {settings?.companySignature ? (
                                              <img src={settings.companySignature} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                                           ) : (
                                              /* Placeholder for Signature Stamp if needed */
                                              <div className="w-24 h-12 border-2 border-blue-600/10 rounded-full flex items-center justify-center opacity-10">
                                                 <span className="text-[10px] font-black text-blue-600 italic">SIG STAMP</span>
                                              </div>
                                           )}
                                        </div>
                                        <p className="font-black text-slate-900 text-xs">For, {settings?.companyName?.toUpperCase() || 'ARMIN TRANSPORT'}</p>
                                        <div className="mt-2 h-0.5 bg-slate-900 w-40 mx-auto opacity-10" />
                                        <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest leading-none">Authorized Signatory</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-8 py-6 border-t border-dashed border-slate-200 text-center">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Continued on next page...</p>
                                </div>
                              )}
                              
                              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>Digital Tax Invoice</span>
                                </div>
                                <span>Page {pageIdx + 1} of {chunks.length}</span>
                              </div>
                            </div>
                          ));
                        })}
                      </div>
                    ) : detailTab === 'payments' ? (
                       <div className="p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                              <IndianRupee size={18} className="text-green-600" /> Payment Records
                            </h4>
                            <button 
                              onClick={() => handleAddPaymentClick(selectedInvoice!)}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-all flex items-center gap-2"
                            >
                              <Plus size={14} /> Add Payment
                            </button>
                          </div>
                          <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-[#F5F4F0] border-b border-slate-100">
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Date</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Mode</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Reference</th>
                                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {(selectedInvoice!.payments || []).map((p) => (
                                  <tr key={p.id} className="hover:bg-[#F5F4F0]/50 transition-all">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-900">{new Date(p.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-6 py-4 text-xs font-black text-blue-600">{p.mode}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{p.referenceNo}</td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                                  </tr>
                                ))}
                                {selectedInvoice!.payments.length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold italic text-xs uppercase">No payments recorded yet.</td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot className="bg-[#F5F4F0]/50">
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Total Paid</td>
                                  <td className="px-6 py-4 text-right text-sm font-black text-green-600">₹{selectedInvoice!.paidAmount.toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase">Balance Due</td>
                                  <td className="px-6 py-4 text-right text-sm font-black text-red-600">₹{(selectedInvoice!.totalAmount - selectedInvoice!.paidAmount).toLocaleString()}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                       </div>
                    ) : (
                      <div className="p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                    <History size={18} className="text-blue-600" /> Complete Audit Trail
                  </h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase">System Logs</span>
                </div>

                <div className="relative space-y-6">
                  {/* Vertical Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100" />

                  {(selectedInvoice.history || []).map((entry, idx) => (
                    <div key={idx} className="relative flex items-start gap-6 group">
                      <div className={`w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10 transition-all ${
                        entry.action === 'PAID' ? 'bg-green-500 text-white' : 
                        entry.action === 'CANCELLED' ? 'bg-red-500 text-white' : 
                        entry.action === 'CREATED' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {entry.action === 'PAID' ? <CheckCircle2 size={16} /> : 
                         entry.action === 'CANCELLED' ? <Ban size={16} /> : 
                         entry.action === 'CREATED' ? <Plus size={16} /> : <FileText size={16} />}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                            {entry.action.replace(/_/g, ' ')}
                          </h5>
                          <span className="text-[10px] font-bold text-slate-400 bg-[#F5F4F0] px-2 py-1 rounded-md border border-slate-100">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-2">
                          Managed by <span className="text-slate-900">{entry.user}</span>
                        </p>
                        {entry.note && (
                          <div className="mt-3 p-3 bg-[#F5F4F0]/50 rounded-xl border border-slate-200 border-dashed">
                            <p className="text-[11px] font-medium text-slate-600 italic">"{entry.note}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedInvoice.history.length === 0 && (
                    <div className="py-20 text-center">
                      <History size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activity logs found for this invoice.</p>
                    </div>
                  )}
                </div>
              </div>
             )}
           </div>
         </div>
       </div>
      )}

      {isBulkExportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                 <div>
                    <h3 className="text-2xl font-black text-[#1C1917] tracking-tight leading-tight uppercase tracking-tight">Bulk Export PDF</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Generate 10-entry per page invoices.</p>
                 </div>
                 <button onClick={() => setIsBulkExportModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block t-label mb-2.5">Select Client Partner</label>
                    <div className="relative">
                       <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <select 
                         value={bulkExportData.clientId}
                         onChange={(e) => setBulkExportData({ ...bulkExportData, clientId: e.target.value })}
                         className="w-full pl-12 pr-4 py-3.5 bg-[#F5F4F0] border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                       >
                          <option value="ALL">All Clients</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block t-label mb-2.5">From Date</label>
                       <input 
                         type="date"
                         value={bulkExportData.startDate}
                         onChange={(e) => setBulkExportData({ ...bulkExportData, startDate: e.target.value })}
                         className="w-full px-4 py-3.5 bg-[#F5F4F0] border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                       />
                    </div>
                    <div>
                       <label className="block t-label mb-2.5">To Date</label>
                       <input 
                         type="date"
                         value={bulkExportData.endDate}
                         onChange={(e) => setBulkExportData({ ...bulkExportData, endDate: e.target.value })}
                         className="w-full px-4 py-3.5 bg-[#F5F4F0] border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                       />
                    </div>
                 </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => {
                           const filtered = invoices.filter(inv => {
                             const matchesClient = bulkExportData.clientId === 'ALL' || inv.clientId === bulkExportData.clientId;
                             const matchesDate = inv.date >= bulkExportData.startDate && inv.date <= bulkExportData.endDate;
                             return matchesClient && matchesDate;
                           });

                           if (filtered.length === 0) {
                             toast('No invoices found for the selected criteria.', 'warning');
                             return;
                           }
                           setIsPreviewModalOpen(true);
                         }}
                         className="py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                          <Eye size={18} /> Preview
                       </button>
                       <button 
                         onClick={() => {
                           const filtered = invoices.filter(inv => {
                             const matchesClient = bulkExportData.clientId === 'ALL' || inv.clientId === bulkExportData.clientId;
                             const matchesDate = inv.date >= bulkExportData.startDate && inv.date <= bulkExportData.endDate;
                             return matchesClient && matchesDate;
                           });

                           if (filtered.length === 0) {
                             setPdfError("No invoices found for the selected criteria.");
                             return;
                           }
                           if (isGeneratingPdf) return;

                           setIsGeneratingPdf(true);
                           generatePerfectPDF('bulk-invoice-export-template', `Bulk-Invoices-${bulkExportData.clientId}-${bulkExportData.startDate}-to-${bulkExportData.endDate}.pdf`)
                             .catch(() => {
                               setPdfError('Could not export invoices. Please try again.');
                             })
                             .finally(() => setIsGeneratingPdf(false));
                         }}
                         disabled={isGeneratingPdf}
                         className="py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                       >
                          {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} {isGeneratingPdf ? 'Generating…' : 'Download'}
                       </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase">
                       {invoices.filter(inv => {
                          const matchesClient = bulkExportData.clientId === 'ALL' || inv.clientId === bulkExportData.clientId;
                          const matchesDate = inv.date >= bulkExportData.startDate && inv.date <= bulkExportData.endDate;
                          return matchesClient && matchesDate;
                       }).length} Invoices Found
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Preview Modal for Bulk Export */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 no-print">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                       <FileStack size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Bulk Export Preview</h3>
                       <p className="text-slate-500 font-medium text-sm">
                          Consolidated statements for <span className="text-blue-600 font-bold">{bulkExportData.clientId === 'ALL' ? 'All Accounts' : clients.find(c => c.id === bulkExportData.clientId)?.name}</span>
                       </p>
                    </div>
                 </div>

                 {settings?.bankDetails && settings.bankDetails.length > 0 && (
                    <div className="flex items-center gap-4 px-6 py-2 bg-[#F5F4F0] rounded-2xl border border-slate-100 mx-4 flex-1 max-w-sm no-print">
                       <div className="flex flex-col w-full">
                          <span className="t-label">Settlement Bank Account</span>
                          <select 
                             value={bulkSelectedBankId || ''} 
                             onChange={(e) => setBulkSelectedBankId(e.target.value || null)}
                             className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 p-0 cursor-pointer w-full"
                          >
                             <option value="">Default (From First Invoice)</option>
                             {settings.bankDetails.map((bank: any) => (
                                <option key={bank.id} value={bank.id}>{bank.bankName} - {bank.accountNo}</option>
                             ))}
                          </select>
                       </div>
                    </div>
                 )}
                 
                 <div className="flex gap-2">
                    <button
                      onClick={() => {
                         if (isGeneratingPdf) return;
                         setIsGeneratingPdf(true);
                         generatePerfectPDF('bulk-invoice-export-template', `Bulk-Invoices-${bulkExportData.clientId}-${bulkExportData.startDate}-to-${bulkExportData.endDate}.pdf`)
                           .catch(() => {
                             setPdfError('Could not export invoices. Please try again.');
                           })
                           .finally(() => setIsGeneratingPdf(false));
                      }}
                      disabled={isGeneratingPdf}
                      className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Download PDF"
                    >
                       {isGeneratingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    </button>
                    <button onClick={() => window.print()} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:bg-[#F5F4F0] transition-all shadow-sm" title="Print"><Printer size={20}/></button>
                    <button onClick={() => setIsPreviewModalOpen(false)} className="p-3 bg-white border border-[#E7E5E0] rounded-xl hover:rotate-90 transition-all shadow-sm" title="Close">
                       <X size={20} />
                    </button>
                 </div>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#F5F4F0] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-400 transition-colors relative bg-slate-100/50 backdrop-blur-sm"
              >
                 <div className="py-20 px-10 print:p-0 flex flex-col items-center gap-16">
                    <div id="preview-content-area" className="bg-transparent shadow-none">
                       {/* This will be rendered by a helper function to ensure sync */}
                       {renderBulkTemplateContent()}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Hidden PDF Template for Bulk Export */}
      <div className="hidden">
        <div id="bulk-invoice-export-template" className="bg-white">
           {renderBulkTemplateContent()}
        </div>
      </div>

      {pdfError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-xs font-bold rounded-2xl px-5 py-3.5 shadow-2xl max-w-sm w-full mx-4">
          <span className="flex-1">{pdfError}</span>
          <button onClick={() => setPdfError(null)} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss">✕</button>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
  const colors: Record<string, string> = { 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    green: 'bg-green-50 text-green-600 border-green-100', 
    red: 'bg-red-50 text-red-600 border-red-100', 
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100' 
  };
  return (
    <div className={`p-6 bg-white rounded-2xl border-2 shadow-sm ${colors[color]} flex items-center gap-5 group hover:-translate-y-1 transition-all cursor-default`}>
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="t-label">{label}</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{value}</p>
       </div>
    </div>
  );
};

export default InvoicesView;
