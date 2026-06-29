import React, { useState, useMemo, useEffect } from 'react';
import { 
  Fuel, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  BarChart3, 
  Calendar, 
  Truck, 
  MapPin, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  FilterX,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  TrendingUp,
  Droplet,
  Clock,
  ExternalLink,
  Plus,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { FuelSite, FuelTransaction, Truck as TruckType, Driver, Expense, ExpenseCategory, ExpenseStatus, Order, Client, Site, Bank } from '../types';
import { QuickAddModal, QuickAddEntityType } from '../components/QuickAddModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { SearchableSelect } from '../components/SearchableSelect';

interface FuelManagementViewProps {
  fuelSites: FuelSite[];
  fuelTransactions: FuelTransaction[];
  trucks: TruckType[];
  drivers: Driver[];
  orders: Order[];
  clients: Client[];
  sites: Site[];
  banks?: Bank[];
  onUpdateFuelTransactions: (transactions: FuelTransaction[]) => void;
  onAddExpense: (expense: Expense) => void;
  onAddTruck?: (truck: TruckType) => void;
  onAddDriver?: (driver: Driver) => void;
  onAddFuelSite?: (site: FuelSite) => void;
}

const FuelManagementView: React.FC<FuelManagementViewProps> = ({
  fuelSites,
  fuelTransactions,
  trucks,
  drivers,
  orders,
  clients,
  sites,
  banks = [],
  onUpdateFuelTransactions,
  onAddExpense,
  onAddTruck,
  onAddDriver,
  onAddFuelSite,
}) => {
  const [quickAdd, setQuickAdd] = useState<{ type: QuickAddEntityType; initialName: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'site' | 'reports' | 'account'>('site');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    siteId: 'ALL',
    truckId: 'ALL',
    startDate: '',
    endDate: '',
    minQty: '',
    maxQty: ''
  });

  // SITE TAB LOGIC
  const filteredTransactions = useMemo(() => {
    return fuelTransactions.filter(ft => {
      const matchSearch = (
        ft.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ft.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ft.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ft.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchSite = filters.siteId === 'ALL' || ft.siteId === filters.siteId;
      const matchTruck = filters.truckId === 'ALL' || ft.truckId === filters.truckId;
      const matchStart = !filters.startDate || ft.date >= filters.startDate;
      const matchEnd = !filters.endDate || ft.date <= filters.endDate;
      const matchMin = !filters.minQty || ft.quantity >= parseFloat(filters.minQty);
      const matchMax = !filters.maxQty || ft.quantity <= parseFloat(filters.maxQty);

      return matchSearch && matchSite && matchTruck && matchStart && matchEnd && matchMin && matchMax;
    });
  }, [fuelTransactions, searchQuery, filters]);

  // REPORTS TAB LOGIC
  const [reportFilters, setReportFilters] = useState({
    siteId: 'ALL',
    vehicleType: 'ALL',
    truckId: 'ALL',
    dateRange: 'LAST_30' // LAST_7, LAST_30, CUSTOM
  });

  const reportsData = useMemo(() => {
    // Total consumption
    const totalQty = fuelTransactions.reduce((acc, ft) => acc + ft.quantity, 0);
    const totalAmount = fuelTransactions.reduce((acc, ft) => acc + (ft.totalAmount || 0), 0);

    // Site wise distribution
    const siteWise = fuelSites.map(site => {
      const siteTrans = fuelTransactions.filter(ft => ft.siteId === site.id);
      const qty = siteTrans.reduce((acc, ft) => acc + ft.quantity, 0);
      return { name: site.companyName, value: qty };
    }).filter(d => d.value > 0);

    // Vehicle wise consumption
    const vehicleWise = trucks.map(truck => {
      const truckTrans = fuelTransactions.filter(ft => ft.truckId === truck.id);
      const qty = truckTrans.reduce((acc, ft) => acc + ft.quantity, 0);
      const cost = truckTrans.reduce((acc, ft) => acc + (ft.totalAmount || 0), 0);
      
      // Simulated mileage logic: currentOdometer - (odometer of first fuel entry) / total fuel
      // For mock purposes, we'll use a random realistic mileage or truck.mileage
      const mileage = truckTrans.length > 1 
        ? (Math.max(...truckTrans.map(t => t.odometerReading || 0)) - Math.min(...truckTrans.map(t => t.odometerReading || 0))) / qty
        : truck.mileage;

      return {
        id: truck.id,
        truckNumber: truck.truckNumber,
        truckType: truck.modelNumber,
        qty,
        cost,
        mileage: parseFloat(mileage.toFixed(2)),
        trips: truckTrans.length, // approximation: each fuel up ~ trip
        status: mileage >= truck.mileage ? 'EXCELLENT' : mileage >= truck.mileage * 0.8 ? 'GOOD' : 'POOR'
      };
    }).sort((a, b) => b.qty - a.qty);

    return { totalQty, totalAmount, siteWise, vehicleWise };
  }, [fuelTransactions, fuelSites, trucks]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipTxn, setSlipTxn] = useState<FuelTransaction | null>(null);
  const [isEditingTxn, setIsEditingTxn] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState({
    siteId: '',
    truckId: '',
    driverId: '',
    responsibleStaff: '',
    fuelCategory: 'DIESEL' as 'DIESEL' | 'PETROL' | 'CNG' | 'EV',
    quantity: '',
    rate: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    odometerReading: '',
    fuelLevelBefore: '',
    fuelLevelAfter: '',
    paymentStatus: 'UNPAID' as 'PAID' | 'UNPAID',
    paymentDueDate: '',
    paidDate: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI',
    bankId: '',
    tripId: '',
    notes: '',
    referenceNo: ''
  });

  const handleLogFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const site = fuelSites.find(s => s.id === logForm.siteId);
    const truck = trucks.find(t => t.id === logForm.truckId);
    const driver = drivers.find(d => d.id === logForm.driverId);
    const selectedBank = banks.find(b => b.id === logForm.bankId);

    if (!site || !truck || !driver) return;

    const totalAmount = parseFloat(logForm.quantity) * parseFloat(logForm.rate);

    const transactionData: Partial<FuelTransaction> = {
      siteId: logForm.siteId,
      siteName: site.companyName,
      truckId: logForm.truckId,
      truckNumber: truck.truckNumber,
      driverId: logForm.driverId,
      driverName: driver.name,
      responsibleStaff: logForm.responsibleStaff,
      fuelCategory: logForm.fuelCategory,
      quantity: parseFloat(logForm.quantity),
      rate: parseFloat(logForm.rate),
      totalAmount,
      date: logForm.date,
      time: logForm.time,
      odometerReading: parseFloat(logForm.odometerReading),
      fuelLevelBefore: parseFloat(logForm.fuelLevelBefore),
      fuelLevelAfter: parseFloat(logForm.fuelLevelAfter),
      paymentStatus: logForm.paymentStatus,
      paymentDate: logForm.paymentStatus === 'PAID' ? logForm.paidDate : undefined,
      paymentDueDate: logForm.paymentStatus === 'UNPAID' ? logForm.paymentDueDate : undefined,
      paymentMode: logForm.paymentStatus === 'PAID' ? logForm.paymentMode : undefined,
      bankId: logForm.paymentStatus === 'PAID' ? logForm.bankId : undefined,
      bankName: (logForm.paymentStatus === 'PAID' && selectedBank) ? selectedBank.bankName : undefined,
      referenceNo: logForm.referenceNo || undefined,
      tripId: logForm.tripId,
      notes: logForm.notes
    };

    if (isEditingTxn && editingTxnId) {
      const updatedTransactions = fuelTransactions.map(ft => 
        ft.id === editingTxnId ? { ...ft, ...transactionData } : ft
      );
      onUpdateFuelTransactions(updatedTransactions);
    } else {
      const newTransaction: FuelTransaction = {
        id: `FT-${Date.now()}`,
        ...(transactionData as FuelTransaction)
      };
      onUpdateFuelTransactions([newTransaction, ...fuelTransactions]);
      
      // If it's PAID immediately, also record as expense
      if (logForm.paymentStatus === 'PAID') {
        const fuelExpense: Expense = {
          id: `EXP-FUEL-NEW-${Date.now()}`,
          category: logForm.fuelCategory as unknown as ExpenseCategory,
          date: logForm.date,
          amount: totalAmount,
          paymentMode: logForm.paymentMode as 'UPI' | 'BANK' | 'CASH',
          referenceNo: logForm.referenceNo || `FUEL-NEW-${newTransaction.id}`,
          truckId: truck.id,
          vendorName: site.companyName,
          description: `Instant ${logForm.fuelCategory} Purchase for ${truck.truckNumber} at ${site.companyName} (${newTransaction.quantity}L)`,
          status: ExpenseStatus.APPROVED,
          isAuto: true,
          history: [{
            action: 'CREATED',
            user: 'System',
            timestamp: new Date().toLocaleString(),
            note: `Auto-generated from new fuel log`
          }],
          liters: newTransaction.quantity,
          paymentStatus: 'PAID',
          paidDate: logForm.paidDate,
          responsibleStaff: logForm.responsibleStaff,
          bankId: logForm.bankId || undefined,
          bankName: selectedBank ? selectedBank.bankName : undefined
        };
        onAddExpense(fuelExpense);
      }
    }

    setShowLogModal(false);
    setIsEditingTxn(false);
    setEditingTxnId(null);
    resetForm();
  };

  const resetForm = () => {
    setLogForm({
      siteId: '',
      truckId: '',
      driverId: '',
      responsibleStaff: '',
      fuelCategory: 'DIESEL',
      quantity: '',
      rate: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      odometerReading: '',
      fuelLevelBefore: '',
      fuelLevelAfter: '',
      paymentStatus: 'UNPAID',
      paymentDueDate: '',
      paidDate: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      bankId: '',
      tripId: '',
      notes: '',
      referenceNo: ''
    });
  };

  const handleEditClick = (ft: FuelTransaction) => {
    setLogForm({
      siteId: ft.siteId,
      truckId: ft.truckId,
      driverId: ft.driverId,
      responsibleStaff: ft.responsibleStaff || '',
      fuelCategory: ft.fuelCategory || 'DIESEL',
      quantity: ft.quantity.toString(),
      rate: (ft.rate || 0).toString(),
      date: ft.date,
      time: ft.time,
      odometerReading: (ft.odometerReading || 0).toString(),
      fuelLevelBefore: (ft.fuelLevelBefore || 0).toString(),
      fuelLevelAfter: (ft.fuelLevelAfter || 0).toString(),
      paymentStatus: ft.paymentStatus,
      paymentDueDate: ft.paymentDueDate || '',
      paidDate: ft.paymentDate || new Date().toISOString().split('T')[0],
      paymentMode: ft.paymentMode || 'UPI',
      bankId: ft.bankId || '',
      tripId: ft.tripId || '',
      notes: ft.notes || '',
      referenceNo: ft.referenceNo || ''
    });
    setEditingTxnId(ft.id);
    setIsEditingTxn(true);
    setShowLogModal(true);
  };

  const handleDeleteClick = (id: string) => {
    onUpdateFuelTransactions(fuelTransactions.filter(ft => ft.id !== id));
  };

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSiteId]);

  // ACCOUNT TAB LOGIC
  const siteAccountStats = useMemo(() => {
    return fuelSites.map(site => {
      const siteTrans = fuelTransactions.filter(ft => ft.siteId === site.id);
      const totalPurchase = siteTrans.reduce((acc, ft) => acc + (ft.totalAmount || 0), 0);
      const paidAmount = siteTrans
        .filter(ft => ft.paymentStatus === 'PAID')
        .reduce((acc, ft) => acc + (ft.totalAmount || 0), 0);
      const outstanding = totalPurchase - paidAmount;
      const unpaidCount = siteTrans.filter(ft => ft.paymentStatus === 'UNPAID').length;
      
      return { 
        ...site, 
        totalPurchase, 
        paidAmount, 
        outstanding,
        unpaidCount
      };
    }).sort((a, b) => b.outstanding - a.outstanding);
  }, [fuelSites, fuelTransactions]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<FuelTransaction | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mode: 'UPI',
    referenceNo: ''
  });

  const handleProcessPayment = () => {
    if (!selectedTxn) return;

    const updatedTransactions = fuelTransactions.map(ft => {
      if (ft.id === selectedTxn.id) {
        return {
          ...ft,
          paymentStatus: 'PAID' as const,
          paymentDate: paymentForm.date,
          paymentMode: paymentForm.mode,
          referenceNo: paymentForm.referenceNo
        };
      }
      return ft;
    });

    // Also record it as an expense in the global ledger
    const fuelExpense: Expense = {
      id: `EXP-FUEL-${selectedTxn.id}-${Date.now()}`,
      category: ExpenseCategory.DIESEL,
      date: paymentForm.date,
      amount: selectedTxn.totalAmount || 0,
      paymentMode: (paymentForm.mode === 'BANK_TRANSFER' ? 'BANK' : paymentForm.mode) as any,
      referenceNo: paymentForm.referenceNo || `FUEL-${selectedTxn.id}`,
      truckId: selectedTxn.truckId,
      orderId: selectedTxn.tripId,
      responsibleStaff: selectedTxn.responsibleStaff,
      vendorName: selectedTxn.siteName,
      description: `Fuel Settlement: #${selectedTxn.id} | Trip: ${selectedTxn.tripId || 'N/A'} | ${selectedTxn.truckNumber} @ ${selectedTxn.siteName}`,
      status: ExpenseStatus.APPROVED,
      isAuto: true,
      history: [{
        action: 'PAID',
        user: 'Admin',
        timestamp: new Date().toISOString(),
        note: `Slip No: ${selectedTxn.id} | Staff: ${selectedTxn.responsibleStaff || 'N/A'} | Trip: ${selectedTxn.tripId || 'N/A'}`
      }],
      liters: selectedTxn.quantity,
      paymentStatus: 'PAID',
      paidDate: paymentForm.date
    };

    onAddExpense(fuelExpense);
    onUpdateFuelTransactions(updatedTransactions);
    setShowPaymentModal(false);
    setSelectedTxn(null);
  };

  const handleBulkPayment = (paymentData: { date: string; mode: string; referenceNo: string }) => {
    const selectedTxns = fuelTransactions.filter(ft => selectedTxnIds.includes(ft.id));

    const updatedTransactions = fuelTransactions.map(ft => {
      if (selectedTxnIds.includes(ft.id)) {
        return {
          ...ft,
          paymentStatus: 'PAID' as const,
          paymentDate: paymentData.date,
          paymentMode: paymentData.mode,
          referenceNo: paymentData.referenceNo
        };
      }
      return ft;
    });

    onUpdateFuelTransactions(updatedTransactions);
    
    // Record each individual slip as an expense in the Ledger
    selectedTxns.forEach((ft, index) => {
      onAddExpense({
        id: `EXP-FUEL-SETTLE-${ft.id}-${Date.now()}-${index}`,
        category: ExpenseCategory.DIESEL,
        amount: ft.totalAmount || 0,
        date: paymentData.date,
        status: ExpenseStatus.APPROVED,
        description: `Fuel Settlement: #${ft.id} | Trip: ${ft.tripId || 'N/A'} | ${ft.truckNumber} @ ${ft.siteName}`,
        paymentMode: (paymentData.mode === 'BANK_TRANSFER' ? 'BANK' : paymentData.mode) as any,
        referenceNo: paymentData.referenceNo,
        vendorName: ft.siteName,
        truckId: ft.truckId,
        orderId: ft.tripId,
        responsibleStaff: ft.responsibleStaff,
        liters: ft.quantity,
        isAuto: true,
        history: [{ 
          action: 'PAID', 
          user: 'Admin', 
          timestamp: new Date().toISOString(),
          note: `Slip No: ${ft.id} | Staff: ${ft.responsibleStaff || 'N/A'} | Trip: ${ft.tripId || 'N/A'}`
        }],
        paymentStatus: 'PAID',
        paidDate: paymentData.date
      });
    });

    setShowBulkPaymentModal(false);
    setSelectedTxnIds([]);
  };

  const toggleTxnSelection = (id: string) => {
    setSelectedTxnIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/20 rotate-3">
              <Fuel size={24} />
            </div>
            <h1 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Fuel Management</h1>
          </div>
          <p className="text-slate-500 font-bold ml-14">Track, manage and optimize fleet energy consumption</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('site')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'site' ? 'bg-white text-blue-600 shadow-md translate-y-[-2px]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <MapPin size={18} />
            Fuel Site
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'reports' ? 'bg-white text-blue-600 shadow-md translate-y-[-2px]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <BarChart3 size={18} />
            Based Reports
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'account' ? 'bg-white text-blue-600 shadow-md translate-y-[-2px]' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Wallet size={18} />
            Fuel Account
          </button>
        </div>
      </div>

      {activeTab === 'site' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
           {/* Site Selector & Quick Stats */}
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Fuel Site</h3>
                   <div className="space-y-2">
                      <button 
                        onClick={() => setSelectedSiteId(null)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${!selectedSiteId ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-black' : 'bg-[#F5F4F0] text-slate-600 hover:bg-slate-100 font-bold'}`}
                      >
                         <span className="text-sm">Global Overview</span>
                         <ArrowUpRight size={16} />
                      </button>
                      {fuelSites.map(site => (
                        <button 
                          key={site.id}
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedSiteId === site.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-black' : 'bg-[#F5F4F0] text-slate-600 hover:bg-slate-100 font-bold'}`}
                        >
                           <span className="text-sm truncate pr-2">{site.companyName}</span>
                           <MapPin size={16} className={selectedSiteId === site.id ? 'text-blue-100' : 'text-slate-300'} />
                        </button>
                      ))}
                   </div>
                </div>

                {!selectedSiteId && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                     <Fuel size={120} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                           <TrendingUp size={24} />
                        </div>
                        <h4 className="text-2xl font-black mb-2">Fleet Fuel Status</h4>
                        <p className="text-sm font-bold text-slate-400 mb-6 leading-relaxed">Centralized telemetry for fuel dispatch across all logistics partners.</p>
                        <button onClick={() => setShowLogModal(true)} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors">
                           Create Dispatch Log
                        </button>
                     </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 space-y-8">
                 {/* Current Context Details */}
                 {selectedSiteId ? (
                   <div className="page-stack-lg">
                      {/* Site Details Card */}
                      <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center gap-6">
                               <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                                  <MapPin size={40} />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{fuelSites.find(s => s.id === selectedSiteId)?.companyName}</h3>
                                  <div className="flex flex-wrap items-center gap-4 mt-2">
                                     <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase border border-blue-100">Partner Site</span>
                                     <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <User size={12} className="text-slate-300" />
                                        {fuelSites.find(s => s.id === selectedSiteId)?.ownerName}
                                     </span>
                                     <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock size={12} className="text-slate-300" />
                                        Last Refill: {fuelTransactions.filter(ft => ft.siteId === selectedSiteId)[0]?.date || 'N/A'}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex gap-3">
                               <a 
                                 href={fuelSites.find(s => s.id === selectedSiteId)?.googleMapLink} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="w-14 h-14 bg-[#F5F4F0] text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                               >
                                  <ExternalLink size={24} />
                               </a>
                               <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95 transition-all">
                                  Export Site Ledger
                               </button>
                            </div>
                         </div>

                         {/* Site Details Grid */}
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-12 border-t border-slate-50">
                            <div>
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-none uppercase">GST Number</p>
                               <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{fuelSites.find(s => s.id === selectedSiteId)?.gstNumber}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-none uppercase">Contact</p>
                               <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{fuelSites.find(s => s.id === selectedSiteId)?.phoneNumber}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-none uppercase">Bank Account</p>
                               <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{fuelSites.find(s => s.id === selectedSiteId)?.accountNumber}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-none uppercase">IFSC Code</p>
                               <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{fuelSites.find(s => s.id === selectedSiteId)?.ifscCode}</p>
                            </div>
                         </div>
                      </div>

                      {/* Site Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                            <div className="flex items-center justify-between mb-6">
                               <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                  <Droplet size={24} />
                               </div>
                               <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest leading-none">+12% vs LY</span>
                            </div>
                            <p className="t-label mb-1">Total Supply (Liters)</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                               {fuelTransactions
                                 .filter(ft => ft.siteId === selectedSiteId)
                                 .reduce((acc, ft) => acc + ft.quantity, 0)
                                 .toLocaleString()}
                            </h3>
                         </div>
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                            <div className="flex items-center justify-between mb-6">
                               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                  <Truck size={24} />
                               </div>
                               <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest leading-none">Active Fleet</span>
                            </div>
                            <p className="t-label mb-1">Vehicles Refueled</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                               {new Set(fuelTransactions.filter(ft => ft.siteId === selectedSiteId).map(ft => ft.truckId)).size}
                            </h3>
                         </div>
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm group hover:border-red-200 transition-all">
                            <div className="flex items-center justify-between mb-6">
                               <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                                  <AlertCircle size={24} />
                               </div>
                               <button 
                                 onClick={() => setActiveTab('account')}
                                 className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest leading-none"
                               >
                                 Settle Dues
                               </button>
                            </div>
                            <p className="t-label mb-1">Outstanding Balance</p>
                            <h3 className="text-4xl font-black text-red-600 tracking-tighter">
                               ₹{siteAccountStats.find(s => s.id === selectedSiteId)?.outstanding.toLocaleString()}
                            </h3>
                         </div>
                      </div>

                      {/* Site Transaction Log */}
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                         <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                               <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Dispatch Activity</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-[0.2em]">Live feed of fuel issues at this station</p>
                            </div>
                            <div className="flex gap-2">
                               <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                  <input 
                                    className="pl-9 pr-4 py-2 bg-[#F5F4F0] border-none rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-blue-500/10 outline-none w-48"
                                    placeholder="Filter by Truck No."
                                  />
                               </div>
                            </div>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full">
                               <thead className="bg-[#F5F4F0]/50">
                                  <tr>
                                     <th className="px-10 py-5 text-left t-label">Reference No.</th>
                                     <th className="px-10 py-5 text-left t-label">Time & Date</th>
                                     <th className="px-10 py-5 text-left t-label">Vehicle Dispatch</th>
                                     <th className="px-10 py-5 text-left t-label">Staff Record</th>
                                     <th className="px-10 py-5 text-left t-label">Quantity</th>
                                     <th className="px-10 py-5 text-left t-label">Vehicle Level</th>
                                     <th className="px-10 py-5 text-left t-label">Status</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {fuelTransactions
                                    .filter(ft => ft.siteId === selectedSiteId)
                                    .map(ft => {
                                      const truck = trucks.find(t => t.id === ft.truckId);
                                      return (
                                        <tr key={ft.id} className="hover:bg-[#F5F4F0] transition-colors group cursor-pointer" onClick={() => {setSlipTxn(ft); setShowSlipModal(true);}}>
                                           <td className="px-10 py-6">
                                              <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-tighter">#{ft.id.split('-')[1]}</span>
                                           </td>
                                           <td className="px-10 py-6">
                                              <div className="flex flex-col">
                                                 <span className="text-xs font-black text-slate-900 tracking-tight">{ft.date}</span>
                                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ft.time}</span>
                                              </div>
                                           </td>
                                           <td className="px-10 py-6">
                                              <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                    <Truck size={18} />
                                                 </div>
                                                 <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{ft.truckNumber}</span>
                                              </div>
                                           </td>
                                           <td className="px-10 py-6">
                                              <div className="flex items-center gap-2">
                                                 <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-black">
                                                    {ft.responsibleStaff?.charAt(0) || 'S'}
                                                 </div>
                                                 <span className="text-xs font-black text-slate-700">{ft.responsibleStaff || 'System'}</span>
                                              </div>
                                           </td>
                                           <td className="px-10 py-6">
                                              <div className="flex items-baseline gap-1">
                                                 <span className="text-sm font-black text-slate-900 tracking-tighter">{ft.quantity}</span>
                                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ft.fuelCategory === 'EV' ? 'kWh' : 'L'}</span>
                                              </div>
                                           </td>
                                           <td className="px-10 py-6">
                                              <div className="w-24">
                                                 <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Level</span>
                                                    <span className={`text-[10px] font-black ${
                                                      (truck?.fuelLevel || 50) < 20 ? 'text-red-500' : 'text-emerald-500'
                                                    }`}>{truck?.fuelLevel || 50}%</span>
                                                 </div>
                                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                      className={`h-full rounded-full transition-all duration-1000 ${
                                                        (truck?.fuelLevel || 50) < 20 ? 'bg-red-500' : 'bg-emerald-500'
                                                      }`}
                                                      style={{ width: `${truck?.fuelLevel || 50}%` }}
                                                    />
                                                 </div>
                                              </div>
                                           </td>
                                           <td className="px-10 py-6">
                                              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                ft.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                              }`}>
                                                 {ft.paymentStatus === 'PAID' ? 'Settled' : 'Credit Log'}
                                              </span>
                                           </td>
                                        </tr>
                                      );
                                    })}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                 ) : (
                   /* GLOBAL OVERVIEW */
                   <div className="space-y-8 pb-32">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                            <div>
                               <p className="t-label mb-1">Network Sites</p>
                               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{fuelSites.length}</h3>
                            </div>
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <MapPin size={28} />
                            </div>
                         </div>
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                            <div>
                               <p className="t-label mb-1">Total Fuel Vol.</p>
                               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{(fuelTransactions.reduce((acc, ft) => acc + Number(ft.quantity), 0) / 1000).toFixed(1)}k</h3>
                            </div>
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <Droplet size={28} />
                            </div>
                         </div>
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                            <div>
                               <p className="t-label mb-1">Total Exposure</p>
                               <h3 className="text-4xl font-black text-red-600 tracking-tighter">₹{(siteAccountStats.reduce((acc, s) => acc + s.outstanding, 0) / 100000).toFixed(1)}L</h3>
                            </div>
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <AlertCircle size={28} />
                            </div>
                         </div>
                         <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                            <div>
                               <p className="t-label mb-1">Dispatch Count</p>
                               <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{fuelTransactions.length}</h3>
                            </div>
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <CheckCircle2 size={28} />
                            </div>
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                         <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
                            <div>
                               <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Fuel Site Performance</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-[0.2em]">Aggregated supply and financial exposure</p>
                            </div>
                            <button onClick={() => setShowLogModal(true)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                               Log Global dispatch
                            </button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full">
                               <thead className="bg-[#F5F4F0]/50">
                                  <tr>
                                     <th className="px-10 py-5 text-left t-label">Partner Station</th>
                                     <th className="px-10 py-5 text-left t-label">Location</th>
                                     <th className="px-10 py-5 text-left t-label">Total Issued</th>
                                     <th className="px-10 py-5 text-left t-label">Total Value</th>
                                     <th className="px-10 py-5 text-left t-label">Dispatch Count</th>
                                     <th className="px-10 py-5 text-left t-label">Outstanding</th>
                                     <th className="px-10 py-5 text-left t-label">Last Activity</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-50">
                                  {siteAccountStats.map(site => (
                                    <tr key={site.id} className="hover:bg-[#F5F4F0] transition-colors group cursor-pointer" onClick={() => setSelectedSiteId(site.id)}>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                <Fuel size={20} />
                                             </div>
                                             <span className="text-sm font-black text-slate-900 tracking-tight">{site.companyName}</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px] block">{site.address}</span>
                                       </td>
                                       <td className="px-10 py-6">
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-sm font-black text-slate-900 tracking-tighter">
                                               {fuelTransactions.filter(ft => ft.siteId === site.id).reduce((acc, ft) => acc + ft.quantity, 0).toLocaleString()}
                                             </span>
                                             <span className="text-[10px] font-bold text-slate-400 uppercase">L</span>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className="text-sm font-black text-slate-900 tracking-tighter">₹{site.totalPurchase.toLocaleString()}</span>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className="text-sm font-black text-slate-700">{fuelTransactions.filter(ft => ft.siteId === site.id).length} Logs</span>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className={`text-sm font-black ${site.outstanding > 10000 ? 'text-red-500 underline decoration-red-200' : 'text-slate-900'}`}>₹{site.outstanding.toLocaleString()}</span>
                                       </td>
                                       <td className="px-10 py-6 text-right">
                                          <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500 transition-all ml-auto" />
                                       </td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-10">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Fleet Fuel Consumption History</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 tracking-[0.2em]">Detailed audit trail for individual vehicles</p>
                           </div>
                           <div className="flex gap-4">
                              <select 
                                className="px-6 py-3 bg-[#F5F4F0] border-none rounded-2xl text-xs font-black uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10"
                                value={filters.truckId}
                                onChange={(e) => setFilters({...filters, truckId: e.target.value})}
                              >
                                 <option value="ALL">Select a Vehicle</option>
                                 {trucks.map(t => <option key={t.id} value={t.id}>{t.truckNumber}</option>)}
                              </select>
                           </div>
                        </div>

                        {filters.truckId !== 'ALL' ? (
                          <div className="page-stack pb-10">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-100">
                                   <p className="t-label mb-1">Total Refuel Activity</p>
                                   <h4 className="text-2xl font-black text-[#1C1917] tracking-tight">{fuelTransactions.filter(ft => ft.truckId === filters.truckId).length} Dispatches</h4>
                                </div>
                                <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-100">
                                   <p className="t-label mb-1">Lifetime Quantity</p>
                                   <h4 className="text-2xl font-black text-[#1C1917] tracking-tight">{fuelTransactions.filter(ft => ft.truckId === filters.truckId).reduce((acc, ft) => acc + ft.quantity, 0).toLocaleString()} Ltr</h4>
                                </div>
                                <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-100">
                                   <p className="t-label mb-1">Avg Refill Size</p>
                                   <h4 className="text-2xl font-black text-[#1C1917] tracking-tight">
                                      {Math.round(fuelTransactions.filter(ft => ft.truckId === filters.truckId).reduce((acc, ft) => acc + ft.quantity, 0) / (fuelTransactions.filter(ft => ft.truckId === filters.truckId).length || 1))} Ltr
                                   </h4>
                                </div>
                                <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-100">
                                   <p className="t-label mb-1">Current Tank State</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                         <div className="h-full bg-blue-600 rounded-full" style={{ width: `${trucks.find(t => t.id === filters.truckId)?.fuelLevel || 0}%` }} />
                                      </div>
                                      <span className="text-xs font-black text-slate-900">{trucks.find(t => t.id === filters.truckId)?.fuelLevel || 0}%</span>
                                   </div>
                                </div>
                             </div>

                             <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="w-full">
                                   <thead className="bg-[#F5F4F0]/50">
                                      <tr>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Site Supplied</th>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Odometer</th>
                                         <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Slip</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                      {fuelTransactions
                                        .filter(ft => ft.truckId === filters.truckId)
                                        .map(ft => (
                                          <tr key={ft.id} className="hover:bg-[#F5F4F0]/80 transition-colors">
                                             <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                   <span className="text-[11px] font-black text-slate-900">{ft.date}</span>
                                                   <span className="text-[9px] font-bold text-slate-400">{ft.time}</span>
                                                </div>
                                             </td>
                                             <td className="px-8 py-4">
                                                <div className="flex items-center gap-2">
                                                   <MapPin size={10} className="text-blue-500" />
                                                   <span className="text-[11px] font-black text-slate-900 uppercase">{ft.siteName}</span>
                                                </div>
                                             </td>
                                             <td className="px-8 py-4">
                                                <span className="text-[11px] font-black text-slate-900 tracking-tighter">{ft.quantity} L</span>
                                             </td>
                                             <td className="px-8 py-4">
                                                <span className="text-[11px] font-black text-slate-900 tracking-tighter">₹{ft.totalAmount?.toLocaleString()}</span>
                                             </td>
                                             <td className="px-8 py-4">
                                                <span className="text-[11px] font-black text-slate-500">{ft.odometerReading?.toLocaleString()} KM</span>
                                             </td>
                                             <td className="px-8 py-4">
                                                <button onClick={() => {setSlipTxn(ft); setShowSlipModal(true);}} className="p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all">
                                                   <FileText size={12} />
                                                </button>
                                             </td>
                                          </tr>
                                        ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                        ) : (
                          <div className="py-20 bg-[#F5F4F0]/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Truck size={32} className="text-slate-300" />
                             </div>
                             <h4 className="text-lg font-black text-slate-900">Vehicle Ledger History</h4>
                             <p className="text-sm font-bold text-slate-400 mt-2 max-w-xs">Select a specific vehicle from the dropdown above to view its complete fuel acquisition history and consumption metrics.</p>
                          </div>
                        )}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="page-stack-lg">
          {/* Analysis Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
              <div>
                <p className="t-label mb-2">Total Consumption</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900">{reportsData.totalQty.toLocaleString()}</h3>
                  <span className="text-sm font-black text-blue-600 tracking-widest uppercase">Ltrs</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform">
                <Droplet size={28} />
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
              <div>
                <p className="t-label mb-2">Total Fuel Spend</p>
                <h3 className="text-4xl font-black text-slate-900">₹{(reportsData.totalAmount / 1000).toFixed(1)}k</h3>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:rotate-12 transition-transform">
                <BarChart3 size={28} />
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
              <div>
                <p className="t-label mb-2">Avg Efficiency</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-900">3.8</h3>
                  <span className="text-sm font-black text-amber-600 tracking-widest uppercase">Km/L</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform">
                <TrendingUp size={28} />
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
              <div>
                <p className="t-label mb-2">Active Fuel Sites</p>
                <h3 className="text-4xl font-black text-slate-900">{fuelSites.length}</h3>
              </div>
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform">
                <MapPin size={28} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Pie Chart: Site Distribution */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-slate-900">Site-wise Consumption</h4>
                  <p className="text-xs text-slate-500 font-bold">Distribution by supply source</p>
                </div>
                <PieChartIcon size={20} className="text-slate-400" />
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsData.siteWise}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportsData.siteWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Vehicle Consumption */}
            <div className="xl:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-lg font-black text-slate-900">Top Consuming Vehicles</h4>
                  <p className="text-xs text-slate-500 font-bold">Liters consumed vs Truck ID</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 bg-[#F5F4F0] rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                    <Download size={18} />
                  </button>
                  <button className="p-2.5 bg-[#F5F4F0] rounded-xl hover:bg-slate-100 transition-colors text-slate-600">
                    <FileSpreadsheet size={18} />
                  </button>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData.vehicleWise.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="truckNumber" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="qty" radius={[10, 10, 0, 0]}>
                      {reportsData.vehicleWise.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.qty > 500 ? '#3b82f6' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Vehicle Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Vehicle Wise Fuel Performance</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-widest leading-none">Last 30 Days Analysis</p>
              </div>
              <div className="flex gap-3">
                 <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">
                    <Download size={14} />
                    EXPORT PDF
                 </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F4F0]/50">
                  <tr>
                    <th className="px-8 py-5 text-left t-label">Vehicle No.</th>
                    <th className="px-8 py-5 text-left t-label">Type</th>
                    <th className="px-8 py-5 text-left t-label">Fuel Consumed</th>
                    <th className="px-8 py-5 text-left t-label">Trips</th>
                    <th className="px-8 py-5 text-left t-label">Fuel Level</th>
                    <th className="px-8 py-5 text-left t-label">Mileage (Km/L)</th>
                    <th className="px-8 py-5 text-left t-label">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportsData.vehicleWise.map((v) => {
                    const truck = trucks.find(t => t.id === v.id);
                    return (
                      <tr key={v.id} className="hover:bg-[#F5F4F0] transition-colors">
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-900 uppercase">{v.truckNumber}</span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500 whitespace-nowrap">{v.truckType}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900">{v.qty}</span>
                            <span className="text-[10px] text-slate-400 uppercase">L</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-700">{v.trips}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-24">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] font-black ${
                                (truck?.fuelLevel || 50) < 20 ? 'text-red-500' : 'text-emerald-500'
                              }`}>{truck?.fuelLevel || 50}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  (truck?.fuelLevel || 50) < 20 ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${truck?.fuelLevel || 50}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-blue-600">{v.mileage}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                            v.status === 'EXCELLENT' ? 'bg-green-50 text-green-600 border-green-100' :
                            v.status === 'GOOD' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {selectedSiteId ? (
            /* SITE DETAIL VIEW */
            <div className="space-y-8 pb-32">
               {/* Site Header & Navigation */}
               <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6">
                     <button 
                       onClick={() => setSelectedSiteId(null)}
                       className="w-12 h-12 bg-[#F5F4F0] text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                     >
                       <ArrowLeft size={20} />
                     </button>
                     <div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-500" />
                          <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{fuelSites.find(s => s.id === selectedSiteId)?.companyName}</h3>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-6">Detailed Station Ledger</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Download Statement</button>
                     <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:-translate-y-0.5 transition-all">Settle All</button>
                  </div>
               </div>

               {/* Site Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                     <div className="relative z-10">
                       <p className="t-label mb-4">Total station Purchases</p>
                       <div className="flex items-end justify-between">
                          <h3 className="text-5xl font-black text-slate-900 tracking-tighter">
                            ₹{siteAccountStats.find(s => s.id === selectedSiteId)?.totalPurchase.toLocaleString()}
                          </h3>
                          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                            <Fuel size={28} />
                          </div>
                       </div>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-2xl border-2 border-red-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                     <div className="relative z-10">
                       <p className="t-label mb-4">Current Outstanding</p>
                       <div className="flex items-end justify-between">
                          <h3 className="text-5xl font-black text-red-600 tracking-tighter">
                            ₹{siteAccountStats.find(s => s.id === selectedSiteId)?.outstanding.toLocaleString()}
                          </h3>
                          <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100">
                            <AlertCircle size={28} />
                          </div>
                       </div>
                     </div>
                  </div>
               </div>

               {/* Site Pending Slips */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-50 bg-[#F5F4F0]/30 flex items-center justify-between">
                     <div>
                       <h3 className="text-xl font-black text-slate-900">Station-Wise Pending Slips</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct settlement for this specific partner</p>
                     </div>
                     <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase">
                       {fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length} Records
                     </div>
                  </div>
                  <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {fuelTransactions
                         .filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID')
                         .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                         .map(ft => (
                         <div key={ft.id} className={`p-6 bg-white border-2 rounded-2xl hover:border-blue-500 transition-all hover:shadow-xl group relative ${selectedTxnIds.includes(ft.id) ? 'border-blue-600 shadow-lg' : 'border-slate-100'}`}>
                            <div className="absolute top-6 left-6 z-10">
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   toggleTxnSelection(ft.id);
                                 }}
                                 className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                   selectedTxnIds.includes(ft.id) 
                                     ? 'bg-blue-600 border-blue-600 text-white' 
                                     : 'bg-white border-slate-200 text-transparent hover:border-blue-300'
                                 }`}
                               >
                                 <Check size={14} strokeWidth={4} />
                               </button>
                            </div>
                            <div className="flex justify-between items-start mb-6 ml-10">
                               <div className="w-12 h-12 bg-[#F5F4F0] rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                 <Clock size={24} />
                               </div>
                               <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-400 uppercase">{ft.date}</p>
                                 <p className="text-lg font-black text-slate-900">₹{(ft.totalAmount || 0).toLocaleString()}</p>
                               </div>
                            </div>
                            <div className="space-y-4 mb-6">
                               <div className="flex items-center gap-2">
                                 <Truck size={14} className="text-indigo-500" />
                                 <span className="text-xs font-black text-slate-700 uppercase">{ft.truckNumber}</span>
                               </div>
                               <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                 <span>{ft.quantity} {ft.fuelCategory === 'EV' ? 'kWh' : 'Ltrs'}</span>
                                 <span className="text-red-500">Due: {ft.paymentDueDate || 'TBD'}</span>
                               </div>
                            </div>
                            <button 
                              onClick={() => {
                                setSelectedTxn(ft);
                                setShowPaymentModal(true);
                              }}
                              className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                               <CreditCard size={14} /> Settle Transaction
                            </button>
                         </div>
                       ))}
                       {fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length === 0 && (
                         <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                              <CheckCircle2 size={48} />
                            </div>
                            <h4 className="text-xl font-black text-slate-900">No Pending Payments</h4>
                            <p className="text-sm font-bold text-slate-400 mt-2">All fuel purchases for this station are settled.</p>
                         </div>
                       )}
                    </div>

                    {/* Pagination Controls */}
                    {fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length > itemsPerPage && (
                      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-8">
                        <div className="t-label">
                          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length)} - {Math.min(currentPage * itemsPerPage, fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length)} of {fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-6 py-3 bg-white border border-[#E7E5E0] rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-[#F5F4F0] transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            <ArrowLeft size={14} /> Previous
                          </button>
                          <button 
                            disabled={currentPage * itemsPerPage >= fuelTransactions.filter(ft => ft.siteId === selectedSiteId && ft.paymentStatus === 'UNPAID').length}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-6 py-3 bg-white border border-[#E7E5E0] rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-[#F5F4F0] transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <>
              {/* Section Header with Action */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Financial Ledger</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage settlements and verify fuel transactions</p>
              </div>
              <button 
                onClick={() => setShowLogModal(true)}
                className="px-8 py-3.5 bg-blue-600 text-white fill-white rounded-2xl text-sm font-black shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Plus size={18} />
                Log Fuel Purchase
              </button>
           </div>

           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="t-label">Enrolled Sites</p>
                  <h3 className="text-xl font-black text-slate-900">{fuelSites.length} Stations</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                   <AlertCircle size={24} />
                </div>
                <div>
                   <p className="t-label">Total Outstanding</p>
                   <h3 className="text-xl font-black text-red-600">₹{siteAccountStats.reduce((acc, s) => acc + s.outstanding, 0).toLocaleString()}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                   <Fuel size={24} />
                </div>
                <div>
                   <p className="t-label">Total Purchases</p>
                   <h3 className="text-xl font-black text-slate-900">₹{siteAccountStats.reduce((acc, s) => acc + s.totalPurchase, 0).toLocaleString()}</h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                   <CheckCircle2 size={24} />
                </div>
                <div>
                   <p className="t-label">Settled Amount</p>
                   <h3 className="text-xl font-black text-green-600">₹{siteAccountStats.reduce((acc, s) => acc + s.paidAmount, 0).toLocaleString()}</h3>
                </div>
              </div>
           </div>

           {/* Site Wise Ledger */}
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-[#F5F4F0]/20">
                  <h3 className="text-lg font-black text-slate-900">Partner Fuel Sites</h3>
                  <button className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">+ Register New Site</button>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {siteAccountStats.map(site => (
                    <div key={site.id} className="p-6 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all hover:border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{site.companyName}</p>
                            <p className="text-xs font-bold text-slate-400">{site.ownerName}</p>
                          </div>
                        </div>
                        <div className={`p-2 rounded-xl ${site.outstanding > 10000 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                           {site.outstanding > 10000 ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</p>
                          <p className={`text-sm font-black ${site.outstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ₹{site.outstanding.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Purchase</p>
                          <p className="text-sm font-black text-slate-700">₹{site.totalPurchase.toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedSiteId(site.id)}
                        className="w-full mt-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100"
                      >
                        View Site Details <ChevronRight size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
            </div>


           {/* Full History (Transaction Logs - Moved from Site) */}
           <div className="page-stack pb-10">
             <div className="flex items-center justify-between px-2">
                <div>
                   <h3 className="text-xl font-black text-slate-900">Transaction History</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complete archive of all fuel logs</p>
                </div>
                <div className="bg-white border border-slate-100 p-1 rounded-xl flex gap-1 shadow-sm">
                   <button className="px-4 py-2 bg-[#F5F4F0] text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">Export CSV</button>
                   <button className="px-4 py-2 bg-[#F5F4F0] text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">Print Logs</button>
                </div>
             </div>

             {/* Filters Bar (Moved from Site) */}
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search Truck, Driver, Site..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    className="bg-[#F5F4F0] border-none rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10"
                    value={filters.siteId}
                    onChange={(e) => setFilters({...filters, siteId: e.target.value})}
                  >
                    <option value="ALL">All Fuel Sites</option>
                    {fuelSites.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                  </select>
                  <select 
                    className="bg-[#F5F4F0] border-none rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider outline-none focus:ring-4 focus:ring-blue-500/10"
                    value={filters.truckId}
                    onChange={(e) => setFilters({...filters, truckId: e.target.value})}
                  >
                    <option value="ALL">All Vehicles</option>
                    {trucks.map(t => <option key={t.id} value={t.id}>{t.truckNumber}</option>)}
                  </select>
                  <div className="flex items-center bg-[#F5F4F0] rounded-2xl px-4 py-3 gap-2">
                    <input type="date" className="bg-transparent border-none text-[10px] font-black uppercase outline-none" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                    <span className="text-slate-300 font-bold">→</span>
                    <input type="date" className="bg-transparent border-none text-[10px] font-black uppercase outline-none" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                  </div>
                  <button 
                    onClick={() => setFilters({siteId: 'ALL', truckId: 'ALL', startDate: '', endDate: '', minQty: '', maxQty: ''})}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                    title="Clear Filters"
                  >
                    <FilterX size={20} />
                  </button>
                </div>
              </div>

              {/* Site Logs Table (Moved from Site) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Fuel Transaction Logs</h3>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <span className="text-blue-600 font-black text-xs uppercase tracking-widest">{filteredTransactions.length} Entries Found</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F5F4F0]/50">
                      <tr>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Date</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Vehicle</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Staff</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Category</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Station</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Qty/Rate</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Amount</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Status</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Settlement</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Mode</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Bank Account</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Transaction ID</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Trip ID</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Odometer</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Notes</th>
                        <th className="px-3 py-5 text-left t-label whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredTransactions.map((ft) => (
                        <tr key={ft.id} className="hover:bg-[#F5F4F0] transition-colors group">
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-slate-900">{ft.date}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{ft.time}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{ft.truckNumber}</span>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{ft.responsibleStaff || 'N/A'}</p>
                            <p className="text-[8px] font-bold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{ft.driverName}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              ft.fuelCategory === 'EV' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {ft.fuelCategory || 'DIESEL'}
                            </span>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px]" title={ft.siteName}>{ft.siteName}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                             <p className="text-[10px] font-black text-slate-900">{ft.quantity}{ft.fuelCategory === 'EV' ? 'kWh' : 'L'}</p>
                             <p className="text-[8px] font-bold text-slate-400">@₹{ft.rate || '-'}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-green-600">₹{(ft.totalAmount || 0).toLocaleString()}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              ft.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {ft.paymentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-slate-700">
                              {ft.paymentStatus === 'PAID' ? ft.paymentDate : (ft.paymentDueDate || '-')}
                            </p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-slate-500 uppercase">{ft.paymentMode || 'N/A'}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-bold text-slate-700">{ft.bankName || (ft.paymentMode === 'CASH' ? 'CASH' : '-')}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-tight" title={ft.referenceNo}>{ft.referenceNo || '-'}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter" title={ft.tripId}>{ft.tripId || 'N/A'}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <span className="text-[10px] font-black text-slate-700">{ft.odometerReading?.toLocaleString() || '-'}</span>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px]" title={ft.notes}>{ft.notes || '-'}</p>
                          </td>
                          <td className="px-3 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                               <button 
                                 onClick={() => {
                                   setSlipTxn(ft);
                                   setShowSlipModal(true);
                                 }}
                                 className="p-1 bg-slate-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                 title="View Slip"
                               >
                                 <FileText size={12} />
                               </button>
                               <button 
                                 onClick={() => handleEditClick(ft)}
                                 className="p-1 bg-slate-100 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                               >
                                 <Edit size={12} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteClick(ft.id)}
                                 className="p-1 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedTxnIds.length > 0 && selectedSiteId && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-12 animate-in slide-in-from-bottom-8 duration-500 border border-slate-700/50 backdrop-blur-xl">
             <div className="flex items-center gap-4 border-r border-slate-700 pr-12">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
                   {selectedTxnIds.length}
                </div>
                <div>
                  <p className="t-label whitespace-nowrap">Slips Selected</p>
                  <p className="text-lg font-black tracking-tighter">₹{
                    fuelTransactions
                      .filter(ft => selectedTxnIds.includes(ft.id))
                      .reduce((sum, ft) => sum + (ft.totalAmount || 0), 0)
                      .toLocaleString()
                  }</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedTxnIds([])}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Clear Selection
                </button>
                <button 
                  onClick={() => setShowBulkPaymentModal(true)}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2"
                >
                  <CreditCard size={18} /> Record Payment
                </button>
             </div>
          </div>
        )}
      </div>
    )}

      {/* Fuel Log Modal */}
      <FuelLogModal 
        isOpen={showLogModal}
        isEditing={isEditingTxn}
        onClose={() => {
          setShowLogModal(false);
          setIsEditingTxn(false);
          setEditingTxnId(null);
          resetForm();
        }}
        onSubmit={handleLogFuel}
        form={logForm}
        setForm={setLogForm}
        sites={fuelSites}
        trucks={trucks}
        drivers={drivers}
        orders={orders}
        clients={clients}
        customerSites={sites}
        banks={banks}
        onQuickAdd={(type, initialName) => setQuickAdd({ type, initialName })}
      />

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                       <CreditCard size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Fuel Purchase Settlement</h3>
                       <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.1em]">Settling {selectedTxnIds.length} Slips</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowBulkPaymentModal(false)}
                   className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                 >
                   <Plus size={24} className="rotate-45" />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="p-6 bg-[#F5F4F0] rounded-2xl border border-slate-100 mb-2">
                    <p className="t-label mb-1">Total Settlement Amount</p>
                    <p className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tighter">
                       ₹{fuelTransactions
                          .filter(ft => selectedTxnIds.includes(ft.id))
                          .reduce((sum, ft) => sum + (ft.totalAmount || 0), 0)
                          .toLocaleString()}
                    </p>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="t-label ml-1">Payment Date</label>
                      <input 
                        type="date" 
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                        className="w-full px-6 py-4 bg-[#F5F4F0] border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="t-label ml-1">Payment Mode</label>
                      <select 
                        value={paymentForm.mode}
                        onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value})}
                        className="w-full px-6 py-4 bg-[#F5F4F0] border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-sm appearance-none"
                      >
                         <option value="UPI">UPI / Digital</option>
                         <option value="CASH">Cash Payment</option>
                         <option value="BANK_TRANSFER">Bank Transfer</option>
                         <option value="CARD">Debit / Credit Card</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="t-label ml-1">Reference Number / Transaction ID</label>
                      <input 
                        type="text" 
                        placeholder="UTR / Ref No."
                        value={paymentForm.referenceNo}
                        onChange={(e) => setPaymentForm({...paymentForm, referenceNo: e.target.value})}
                        className="w-full px-6 py-4 bg-[#F5F4F0] border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-sm"
                      />
                    </div>
                 </div>

                 <button 
                   onClick={() => handleBulkPayment(paymentForm)}
                   disabled={!paymentForm.date}
                   className="w-full py-5 bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
                 >
                   CONFIRM SETTLEMENT
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTxn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-blue-600 text-white relative">
               <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-2">Fuel Purchase Settlement</p>
                <h3 className="text-2xl font-black">Record Payment</h3>
                <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Fuel size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">₹{selectedTxn.totalAmount?.toLocaleString()}</h4>
                    <p className="text-xs font-bold text-blue-100">{selectedTxn.siteName}</p>
                  </div>
                </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="t-label ml-1">Payment Date</label>
                  <input 
                    type="date" 
                    value={paymentForm.date}
                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                    className="w-full px-5 py-3 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="t-label ml-1">Mode</label>
                  <select 
                    value={paymentForm.mode}
                    onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})}
                    className="w-full px-5 py-3 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="t-label ml-1">Reference Number / Txn ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter Reference No..."
                    value={paymentForm.referenceNo}
                    onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})}
                    className="w-full px-5 py-3 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                  />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleProcessPayment}
                  className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-xl text-sm font-black shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  CONFIRM SETTLEMENT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Slip Modal */}
      <FuelSlipModal
        isOpen={showSlipModal}
        onClose={() => {
          setShowSlipModal(false);
          setSlipTxn(null);
        }}
        transaction={slipTxn}
      />

      {quickAdd && (
        <QuickAddModal
          entityType={quickAdd.type}
          initialName={quickAdd.initialName}
          onClose={() => setQuickAdd(null)}
          onCreated={(entity) => {
            if (quickAdd.type === 'truck' && onAddTruck) onAddTruck(entity);
            else if (quickAdd.type === 'driver' && onAddDriver) onAddDriver(entity);
            else if (quickAdd.type === 'fuelSite' && onAddFuelSite) onAddFuelSite(entity);
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
};

const FuelSlipModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transaction: FuelTransaction | null;
}> = ({ isOpen, onClose, transaction }) => {
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  if (!isOpen || !transaction) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setDownloadError(null);
    const element = document.getElementById('fuel-slip-content');
    if (!element) return;

    setIsDownloading(true);
    try {
      // Create a temporary clone to ensure consistent width during capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '800px'; // Consistent width for predictable layout
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 4, // Higher scale for ultra-clear text
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [216, 279] // 216 x 279 mm (Letter size)
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentWidth = pdfWidth - 40; // 20mm margin on each side
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      // Calculate vertical centering if content is shorter than page
      const yOffset = contentHeight < (pdfHeight - 40) ? (pdfHeight - contentHeight) / 2 : 20;

      pdf.setProperties({
        title: `Fuel Purchase Slip - ${transaction.id}`,
        subject: 'Fuel Receipt',
        author: 'FlyAsh Pro Logistics',
        keywords: 'fuel, logistics, receipt',
        creator: 'FlyAsh Pro System'
      });

      pdf.addImage(imgData, 'PNG', 20, yOffset, contentWidth, contentHeight, undefined, 'FAST');
      pdf.save(`Fuel_Slip_${transaction.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloadError('Could not generate the PDF. Please try again or use the print option.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 no-print">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
         <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <FileText size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Receipt Preview</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <Plus size={20} className="rotate-45" />
            </button>
         </div>

         <div className="p-8 overflow-y-auto bg-slate-100/50" id="fuel-slip-capture-area">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200/60 flex flex-col gap-8 relative overflow-hidden" id="fuel-slip-content">
               {/* Decorative Element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-16 -mt-16 z-0" />
               
               {/* Slip Header */}
               <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                         <Fuel size={16} className="text-white" />
                       </div>
                       <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tighter">FLYASH PRO</h2>
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-10">Logistics Excellence</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Slip No: {transaction.id}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-slate-400">
                      <Clock size={10} />
                      <p className="text-[9px] font-bold uppercase tracking-widest">{transaction.date} • {transaction.time}</p>
                    </div>
                  </div>
               </div>

               {/* Transaction Grid */}
               <div className="grid grid-cols-2 gap-x-12 gap-y-8 relative z-10">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Vehicle Details</p>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#F5F4F0] text-slate-600 rounded-lg">
                        <Truck size={14} />
                      </div>
                      <p className="text-sm font-black text-slate-900 uppercase">{transaction.truckNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Operations Staff</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-sm font-black text-slate-900">{transaction.responsibleStaff || 'System'}</p>
                      <div className="p-1.5 bg-[#F5F4F0] text-slate-600 rounded-lg">
                        <User size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Service Station</p>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#F5F4F0] text-blue-600 rounded-lg">
                        <MapPin size={14} />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-slate-900 leading-tight">{transaction.siteName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{transaction.fuelCategory || 'DIESEL'} FUELING</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Odometer Reading</p>
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-slate-900">{transaction.odometerReading?.toLocaleString() || '-'} KM</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase">Current Registry</p>
                      </div>
                      <div className="p-1.5 bg-[#F5F4F0] text-amber-600 rounded-lg">
                        <TrendingUp size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Energy Metrics</p>
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>Initial Level</span>
                          <span className="font-black text-slate-900">{transaction.fuelLevelBefore || 0}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${transaction.fuelLevelBefore || 0}%` }} />
                       </div>
                       <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>Final Level</span>
                          <span className="font-black text-emerald-600">{transaction.fuelLevelAfter || 0}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${transaction.fuelLevelAfter || 0}%` }} />
                       </div>
                    </div>
                  </div>
               </div>

               {/* Financial Summary */}
               <div className="mt-2 p-8 bg-[#F5F4F0] rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/50 -mr-8 -mt-8 rotate-45" />
                  
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-center bg-white/40 p-3 rounded-xl border border-white/60">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Quantity</p>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{transaction.quantity} {transaction.fuelCategory === 'EV' ? 'kWh' : 'Ltrs'}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Unit Rate</p>
                        <p className="text-sm font-black text-slate-900 tracking-tight">₹{transaction.rate}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-t-2 border-slate-200 pt-5">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Payment Info</p>
                        <div className="flex flex-col gap-2 mt-2">
                           <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase w-fit ${
                             transaction.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {transaction.paymentStatus === 'PAID' ? 'Settled Instant' : 'Credit Account'}
                           </div>
                           {transaction.paymentStatus === 'PAID' ? (
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Settlement Date</span>
                               <span className="text-[11px] font-black text-green-600">{transaction.paymentDate || transaction.date}</span>
                             </div>
                           ) : (
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-red-400">Payment Due Date</span>
                               <span className="text-[11px] font-black text-red-600 underline decoration-red-200 decoration-2 underline-offset-2">{transaction.paymentDueDate || 'As per Agreement'}</span>
                             </div>
                           )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-blue-600 tracking-tighter leading-none">₹{transaction.totalAmount?.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Inclusive of GST</p>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Footer Details */}
               <div className="flex flex-col gap-4 mt-2">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#F5F4F0] rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase bg-white px-2 py-0.5 rounded-md shadow-sm">{transaction.paymentMode || 'COD'}</span>
                    </div>
                    {transaction.referenceNo && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Txn ID</span>
                        <span className="text-[10px] font-mono font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{transaction.referenceNo}</span>
                      </div>
                    )}
                    {transaction.tripId && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trip ID</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{transaction.tripId}</span>
                      </div>
                    )}
                  </div>

                  {transaction.notes && (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100/50">
                      <p className="text-[9px] text-amber-700 font-bold leading-relaxed">
                        <span className="uppercase tracking-widest text-[8px] block mb-1 opacity-60">Operations Remark</span>
                        {transaction.notes}
                      </p>
                    </div>
                  )}
               </div>

               {/* Verification Footer */}
               <div className="mt-6 flex flex-col items-center gap-2 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="h-0.5 w-12 bg-current" />
                    <CheckCircle2 size={12} />
                    <div className="h-0.5 w-12 bg-current" />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Digitally Verified Token</p>
               </div>
            </div>
         </div>

         {downloadError && (
           <div className="mx-8 mb-0 mt-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 no-print">
             {downloadError}
           </div>
         )}
         <div className="p-8 bg-white border-t border-slate-100 flex gap-4 no-print">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all uppercase"
            >
              Back
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-md shadow-blue-500/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {isDownloading ? 'Generating…' : 'Export PDF'}
            </button>
         </div>
      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #fuel-slip-content, #fuel-slip-content * {
            visibility: visible !important;
          }
          #fuel-slip-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 40px !important;
            margin: 0 !important;
            z-index: 9999 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};


const FuelLogModal: React.FC<{
  isOpen: boolean;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: any;
  setForm: any;
  sites: FuelSite[];
  trucks: TruckType[];
  drivers: Driver[];
  orders: Order[];
  clients: Client[];
  customerSites: Site[];
  banks?: Bank[];
  onQuickAdd?: (type: QuickAddEntityType, initialName: string) => void;
}> = ({ isOpen, isEditing, onClose, onSubmit, form, setForm, sites, trucks, drivers, orders, clients, customerSites, banks = [], onQuickAdd }) => {
  if (!isOpen) return null;

  // Searchable Options
  const vehicleOptions = trucks.map(t => ({
    value: t.id,
    label: `${t.truckNumber} (${t.modelNumber})`,
    sub: t.driverName && t.driverName !== 'Unassigned' ? `Assigned: ${t.driverName}` : 'No driver assigned'
  }));

  const driverOptions = drivers.map(d => ({
    value: d.id,
    label: d.name,
    sub: d.phoneNumber ? `Phone: ${d.phoneNumber}` : undefined
  }));

  const fuelStationOptions = sites.map(s => ({
    value: s.id,
    label: s.companyName,
    sub: s.address || undefined
  }));

  const searchableTripOptions = orders.map(order => ({
    value: order.id,
    label: order.id,
    sub: `${order.clientName} → ${order.projectSite}`
  }));

  const bankOptions = banks.map(b => ({
    value: b.id,
    label: b.bankName,
    sub: b.accountNumber ? `A/C: ${b.accountNumber} — ${b.bankAddress}` : undefined
  }));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
         {/* Header */}
         <div className="p-8 bg-blue-600 text-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
              <Plus size={20} className="rotate-45" />
            </button>
            <div className="flex items-center gap-3 mb-2">
               <Fuel size={24} />
               <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Operation Log</p>
            </div>
            <h3 className="text-2xl font-black">{isEditing ? 'Update Fuel Record' : 'Register Fuel Purchase'}</h3>
         </div>

         {/* Form */}
         <form onSubmit={onSubmit} className="p-8 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="t-label ml-1">Entry Date</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="t-label ml-1">Responsible Staff</label>
                  <input 
                    type="text" 
                    placeholder="Staff in charge"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.responsibleStaff}
                    onChange={e => setForm({...form, responsibleStaff: e.target.value})}
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <SearchableSelect
                    label="Vehicle"
                    variant="slate"
                    placeholder="Select Truck..."
                    value={form.truckId}
                    options={vehicleOptions}
                    onCreateNew={name => onQuickAdd?.('truck', name)}
                    createNewLabel="Add Truck"
                    onChange={val => {
                      const selectedTruck = trucks.find(t => t.id === val);
                      let autoDriverId = selectedTruck?.assignedDriverId || "";
                      if (!autoDriverId && selectedTruck?.driverName) {
                        const matchingDriver = drivers.find(d => d.name.toLowerCase() === selectedTruck.driverName.toLowerCase());
                        if (matchingDriver) {
                          autoDriverId = matchingDriver.id;
                        }
                      }
                      setForm({
                        ...form,
                        truckId: val,
                        odometerReading: selectedTruck ? selectedTruck.currentOdometer.toString() : form.odometerReading,
                        driverId: autoDriverId || form.driverId
                      });
                    }}
                  />
               </div>
               <div className="space-y-1">
                  <SearchableSelect
                    label="Driver"
                    variant="slate"
                    placeholder="Select Driver..."
                    value={form.driverId}
                    options={driverOptions}
                    onCreateNew={name => onQuickAdd?.('driver', name)}
                    createNewLabel="Add Driver"
                    onChange={val => setForm({...form, driverId: val})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <SearchableSelect
                    label="Fuel Station"
                    variant="slate"
                    placeholder="Select Station..."
                    value={form.siteId}
                    options={fuelStationOptions}
                    onCreateNew={name => onQuickAdd?.('fuelSite', name)}
                    createNewLabel="Add Fuel Station"
                    onChange={val => setForm({...form, siteId: val})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="t-label ml-1">Fuel Category</label>
                  <select 
                    required
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none font-black text-blue-600"
                    value={form.fuelCategory}
                    onChange={e => setForm({...form, fuelCategory: e.target.value as any})}
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">Electric (kWh)</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-2">
                  <label className="t-label ml-1">Quantity ({form.fuelCategory === 'EV' ? 'kWh' : 'Ltrs'})</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.quantity}
                    onChange={e => setForm({...form, quantity: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="t-label ml-1">Rate / Unit</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="₹0.00"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.rate}
                    onChange={e => setForm({...form, rate: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="t-label ml-1">Odometer</label>
                  <input 
                    required
                    type="number"
                    placeholder="KM"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.odometerReading}
                    onChange={e => setForm({...form, odometerReading: e.target.value})}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-100/50 rounded-2xl border border-slate-200/50">
               <div className="space-y-2">
                  <label className="t-label ml-1">Status</label>
                  <select 
                    className={`w-full px-5 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none ${form.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    value={form.paymentStatus}
                    onChange={e => setForm({...form, paymentStatus: e.target.value as any})}
                  >
                    <option value="UNPAID">Unpaid (Credit Account)</option>
                    <option value="PAID">Paid (Instant Settlement)</option>
                  </select>
               </div>
               
               {form.paymentStatus === 'PAID' ? (
                  <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                    <label className="t-label ml-1">Paid Date</label>
                    <input 
                      type="date" 
                      className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                      value={form.paidDate}
                      onChange={e => setForm({...form, paidDate: e.target.value})}
                    />
                  </div>
               ) : (
                  <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
                    <label className="t-label ml-1">Payment Due Date</label>
                    <input 
                      type="date" 
                      className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none underline decoration-red-400"
                      value={form.paymentDueDate}
                      onChange={e => setForm({...form, paymentDueDate: e.target.value})}
                    />
                  </div>
               )}
            </div>

            {form.paymentStatus === 'PAID' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="t-label ml-1">Payment Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setForm({...form, paymentMode: mode, bankId: mode === 'CASH' ? '' : form.bankId})}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${form.paymentMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#F5F4F0] text-slate-400 hover:bg-slate-100'}`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {form.paymentMode !== 'CASH' && (
                  <div className="space-y-1 duration-300 animate-in slide-in-from-right-4">
                    <SearchableSelect
                      label="Select Bank Account"
                      variant="slate"
                      placeholder="Select Bank Account..."
                      value={form.bankId}
                      options={bankOptions}
                      onChange={val => setForm({...form, bankId: val})}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="t-label ml-1">Transaction ID / Ref No</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TXN-12938102"
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.referenceNo}
                    onChange={e => setForm({...form, referenceNo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="t-label ml-1">Purchase Time</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})}
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <SearchableSelect
                    label="Linked Trip ID"
                    variant="slate"
                    placeholder="No Linked Trip"
                    value={form.tripId}
                    options={[{ value: '', label: 'No Linked Trip' }, ...searchableTripOptions]}
                    onChange={val => setForm({...form, tripId: val})}
                  />
                </div>
                <div className="space-y-2">
                   <label className="t-label ml-1">Fuel Level Before (%)</label>
                   <input 
                     type="number"
                     placeholder="Level before"
                     className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                     value={form.fuelLevelBefore}
                     onChange={e => setForm({...form, fuelLevelBefore: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="t-label ml-1">Fuel Level After (%)</label>
                   <input 
                     type="number"
                     placeholder="Level after"
                     className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                     value={form.fuelLevelAfter}
                     onChange={e => setForm({...form, fuelLevelAfter: e.target.value})}
                   />
                </div>
            </div>

            <div className="space-y-2">
               <label className="t-label ml-1">Additional Notes</label>
               <textarea 
                 rows={2}
                 placeholder="Enter any additional details..."
                 className="w-full px-5 py-3.5 bg-[#F5F4F0] border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                 value={form.notes}
                 onChange={e => setForm({...form, notes: e.target.value})}
               />
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all"
              >
                DISCARD
              </button>
              <button
                type="submit"
                className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-md shadow-blue-500/20 hover:-translate-y-1 transition-all"
              >
                {isEditing ? 'UPDATE RECORD' : 'RECORD FUEL PURCHASE'}
              </button>
            </div>
         </form>
      </div>
    </div>
  );
};

export default FuelManagementView;
