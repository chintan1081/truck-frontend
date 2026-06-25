
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Factory, 
  Search, 
  Plus, 
  X, 
  IndianRupee, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Truck as TruckIcon, 
  Zap,
  Calendar,
  Filter,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Printer,
  History,
  Info,
  ShieldCheck,
  Package,
  SlidersHorizontal,
  Copy,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Eye,
  MoreVertical,
  QrCode,
  Tag,
  TrendingUp,
  Banknote,
  Coins,
  History as HistoryIcon,
  UserCheck,
  MapPin,
  PieChart as PieChartIcon,
  FilterX,
  Briefcase,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { PlantAdvance, PlantAdvancePoolEntry, StationRate, Site, Order, Truck, ExpenseCategory, ExpenseStatus, Employee, Bank } from '../types';

import { SearchableSelect } from '../components/SearchableSelect';
import { QuickAddModal, QuickAddEntityType } from '../components/QuickAddModal';

interface PlantHubViewProps {
  advances: PlantAdvance[];
  pool: PlantAdvancePoolEntry[];
  sites: Site[];
  orders: Order[];
  trucks: Truck[];
  employees: Employee[];
  banks: Bank[];
  onAddAdvance: (adv: PlantAdvance) => void;
  onUpdateAdvance: (adv: PlantAdvance) => void;
  onDeleteAdvance: (id: string) => void;
  onAddPoolEntry: (entry: PlantAdvancePoolEntry) => void;
  onUpdatePoolEntry: (entry: PlantAdvancePoolEntry) => void;
  onDeletePoolEntry: (id: string) => void;
  stationRates?: StationRate[];
  onAddStationRate?: (rate: StationRate) => void;
  onUpdateStationRate?: (rate: StationRate) => void;
  onDeleteStationRate?: (id: string) => void;
  onAddTruck?: (truck: Truck) => void;
  onAddSite?: (site: Site) => void;
}

const PlantHubView: React.FC<PlantHubViewProps> = ({
  advances, pool, sites, orders, trucks, employees, banks, onAddAdvance, onUpdateAdvance, onDeleteAdvance, onAddPoolEntry, onUpdatePoolEntry, onDeletePoolEntry,
  stationRates = [],
  onAddStationRate = () => {},
  onUpdateStationRate = () => {},
  onDeleteStationRate = () => {},
  onAddTruck,
  onAddSite,
}) => {
  const [quickAdd, setQuickAdd] = useState<{ type: QuickAddEntityType; initialName: string } | null>(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [editingPoolEntry, setEditingPoolEntry] = useState<PlantAdvancePoolEntry | null>(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<PlantAdvance | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<StationRate | null>(null);
  const [rateForm, setRateForm] = useState<Partial<StationRate>>({
    stationId: '',
    rate: undefined,
    notes: ''
  });
  const [activeViewTab, setActiveViewTab] = useState<'DASHBOARD' | 'LEDGER' | 'USAGE' | 'POOL' | 'RATE'>('DASHBOARD');

  const [searchQuery, setSearchQuery] = useState('');
  
  const [ledgerPage, setLedgerPage] = useState(1);
  const [poolPage, setPoolPage] = useState(1);
  const [usagePage, setUsagePage] = useState(1);
  const rowsPerPage = 10;
  
  // Advanced Filter State
  const [filters, setFilters] = useState({
    stationId: 'ALL',
    employeeName: 'ALL',
    truckId: 'ALL',
    clientId: 'ALL',
    orderId: 'ALL',
    paymentMode: 'ALL',
    startDate: '',
    endDate: ''
  });

  const stations = useMemo(() => sites.filter(s => s.type === 'TPS'), [sites]);
  const clients = useMemo(() => Array.from(new Set(orders.map(o => o.clientName))), [orders]);

  // Form States
  const [poolForm, setPoolForm] = useState<Partial<PlantAdvancePoolEntry>>({
    stationId: '', 
    employeeId: '', 
    employeeName: '', 
    amount: 0, 
    date: new Date().toISOString().split('T')[0], 
    referenceNo: '', 
    notes: '',
    transactionType: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    bankId: ''
  });
  
  const [advForm, setAdvForm] = useState<Partial<PlantAdvance>>({
    orderId: '', truckId: '', stationId: '', amount: 0, date: new Date().toISOString().split('T')[0], 
    paymentMode: 'RTGS', referenceNo: '', status: 'PENDING', isPriority: false, notes: '',
    quantity: undefined, rate: undefined
  });

  // Station-wise balance calculation helper
  const getStationBalances = (sId: string) => {
    const totalLifetime = pool.filter(p => p.stationId === sId).reduce((a, b) => a + b.amount, 0);
    const totalUtilized = advances.filter(a => a.stationId === sId).reduce((a, b) => a + b.amount, 0);
    return { totalLifetime, totalUtilized, remaining: totalLifetime - totalUtilized };
  };

  // Aggregate Totals (Filtered or Global)
  const currentTotals = useMemo(() => {
    const targetPool = filters.stationId === 'ALL' ? pool : pool.filter(p => p.stationId === filters.stationId);
    const targetAdv = filters.stationId === 'ALL' ? advances : advances.filter(a => a.stationId === filters.stationId);
    
    const totalLifetime = targetPool.reduce((a, b) => a + b.amount, 0);
    const totalUtilized = targetAdv.reduce((a, b) => a + b.amount, 0);
    return { totalLifetime, totalUtilized, remaining: totalLifetime - totalUtilized };
  }, [pool, advances, filters.stationId]);

  const filteredAdvances = useMemo(() => {
    return advances.filter(adv => {
      const station = stations.find(s => s.id === adv.stationId);
      const truck = trucks.find(t => t.id === adv.truckId);
      const order = orders.find(o => o.id === adv.orderId);
      const query = searchQuery.toLowerCase();
      
      const matchesSearch = 
        (station?.name || "").toLowerCase().includes(query) ||
        (truck?.truckNumber || "").toLowerCase().includes(query) ||
        (adv.referenceNo || "").toLowerCase().includes(query) ||
        (adv.orderId || "").toLowerCase().includes(query);

      const matchesStation = filters.stationId === 'ALL' || adv.stationId === filters.stationId;
      const matchesTruck = filters.truckId === 'ALL' || adv.truckId === filters.truckId;
      const matchesClient = filters.clientId === 'ALL' || order?.clientName === filters.clientId;
      const matchesOrder = filters.orderId === 'ALL' || adv.orderId === filters.orderId;
      const matchesMode = filters.paymentMode === 'ALL' || adv.paymentMode === filters.paymentMode;
      const matchesDates = (!filters.startDate || new Date(adv.date) >= new Date(filters.startDate)) &&
                           (!filters.endDate || new Date(adv.date) <= new Date(filters.endDate));

      return matchesSearch && matchesStation && matchesTruck && matchesClient && matchesOrder && matchesMode && matchesDates;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [advances, stations, trucks, orders, searchQuery, filters]);

  useEffect(() => { setLedgerPage(1); }, [filters, searchQuery]);
  useEffect(() => { setPoolPage(1); }, [filters, searchQuery]);
  useEffect(() => { setUsagePage(1); }, [filters, searchQuery]);

  const activeFiltersList = useMemo(() => {
    const list: { label: string; value: string; onClear: () => void }[] = [];
    if (filters.stationId !== 'ALL') {
      const s = stations.find(st => st.id === filters.stationId);
      list.push({
        label: 'Station',
        value: s?.name || filters.stationId,
        onClear: () => setFilters(f => ({ ...f, stationId: 'ALL' }))
      });
    }
    if (filters.clientId !== 'ALL') {
      list.push({
        label: 'Client',
        value: filters.clientId,
        onClear: () => setFilters(f => ({ ...f, clientId: 'ALL' }))
      });
    }
    if (filters.truckId !== 'ALL') {
      const t = trucks.find(tr => tr.id === filters.truckId);
      list.push({
        label: 'Truck',
        value: t?.truckNumber || filters.truckId,
        onClear: () => setFilters(f => ({ ...f, truckId: 'ALL' }))
      });
    }
    if (filters.orderId !== 'ALL') {
      list.push({
        label: 'Order',
        value: filters.orderId,
        onClear: () => setFilters(f => ({ ...f, orderId: 'ALL' }))
      });
    }
    if (filters.paymentMode !== 'ALL') {
      list.push({
        label: 'Payment Mode',
        value: filters.paymentMode,
        onClear: () => setFilters(f => ({ ...f, paymentMode: 'ALL' }))
      });
    }
    if (filters.startDate) {
      list.push({
        label: 'Start Date',
        value: filters.startDate,
        onClear: () => setFilters(f => ({ ...f, startDate: '' }))
      });
    }
    if (filters.endDate) {
      list.push({
        label: 'End Date',
        value: filters.endDate,
        onClear: () => setFilters(f => ({ ...f, endDate: '' }))
      });
    }
    if (searchQuery) {
      list.push({
        label: 'Search',
        value: searchQuery,
        onClear: () => setSearchQuery('')
      });
    }
    return list;
  }, [filters, stations, trucks, searchQuery]);

  const totalQuantityUtilized = useMemo(() => {
    return filteredAdvances.reduce((sum, a) => sum + (a.quantity || 0), 0);
  }, [filteredAdvances]);

  const totalAmountUtilized = useMemo(() => {
    return filteredAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
  }, [filteredAdvances]);

  const paginatedAdvances = useMemo(() => {
    return filteredAdvances.slice((ledgerPage - 1) * rowsPerPage, ledgerPage * rowsPerPage);
  }, [filteredAdvances, ledgerPage]);

  const totalLedgerPages = Math.ceil(filteredAdvances.length / rowsPerPage);

  const paginatedUsageAdvances = useMemo(() => {
    return filteredAdvances.slice((usagePage - 1) * rowsPerPage, usagePage * rowsPerPage);
  }, [filteredAdvances, usagePage]);

  const totalUsagePages = Math.ceil(filteredAdvances.length / rowsPerPage);

  const filteredPoolEntries = useMemo(() => {
    return pool.filter(entry => {
      const station = stations.find(s => s.id === entry.stationId);
      const bank = banks.find(b => b.id === entry.bankId);
      const query = searchQuery.toLowerCase();
      
      const matchesSearch = 
        (station?.name || "").toLowerCase().includes(query) ||
        (bank?.bankName || "").toLowerCase().includes(query) ||
        (bank?.accountNumber || "").toLowerCase().includes(query) ||
        (entry.referenceNo || "").toLowerCase().includes(query) ||
        (entry.employeeName || "").toLowerCase().includes(query) ||
        (entry.id || "").toLowerCase().includes(query) ||
        (entry.notes || "").toLowerCase().includes(query) ||
        (entry.transactionType || "").toLowerCase().includes(query) ||
        (entry.paymentMethod || "").replace('_', ' ').toLowerCase().includes(query);

      const matchesStation = filters.stationId === 'ALL' || entry.stationId === filters.stationId;
      const matchesEmployee = (filters as any).employeeName === 'ALL' || entry.employeeName === (filters as any).employeeName;
      const matchesMode = filters.paymentMode === 'ALL' || entry.paymentMethod === filters.paymentMode;
      const matchesDates = (!filters.startDate || new Date(entry.date) >= new Date(filters.startDate)) &&
                           (!filters.endDate || new Date(entry.date) <= new Date(filters.endDate));
      
      return matchesSearch && matchesStation && matchesEmployee && matchesDates && matchesMode;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [pool, stations, searchQuery, filters]);

  const paginatedPool = useMemo(() => {
    return filteredPoolEntries.slice((poolPage - 1) * rowsPerPage, poolPage * rowsPerPage);
  }, [filteredPoolEntries, poolPage]);

  const totalPoolPages = Math.ceil(filteredPoolEntries.length / rowsPerPage);

  const handlePoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolForm.stationId) { alert("Please select a station."); return; }
    
    // Find employee name if employeeId is set
    const empName = poolForm.employeeId ? employees.find(e => e.id === poolForm.employeeId)?.fullName : '';
    
    if (editingPoolEntry) {
      onUpdatePoolEntry({
        ...editingPoolEntry,
        ...(poolForm as PlantAdvancePoolEntry),
        employeeName: empName
      });
    } else {
      onAddPoolEntry({ 
          ...(poolForm as PlantAdvancePoolEntry), 
          id: `POOL-${Date.now()}`,
          employeeName: empName
      });
    }
    
    setIsPoolModalOpen(false);
    setEditingPoolEntry(null);
    setPoolForm({ 
      stationId: '', 
      employeeId: '', 
      employeeName: '', 
      amount: 0, 
      date: new Date().toISOString().split('T')[0], 
      referenceNo: '', 
      notes: '',
      transactionType: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      bankId: ''
    });
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateForm.stationId) { alert("Please select a thermal power station."); return; }
    if (!rateForm.rate || rateForm.rate <= 0) { alert("Please enter a valid rate."); return; }

    const isExisting = stationRates?.some(r => r.stationId === rateForm.stationId);

    if (editingRate) {
      onUpdateStationRate({
        ...editingRate,
        stationId: rateForm.stationId,
        rate: rateForm.rate,
        notes: rateForm.notes || ''
      });
    } else if (isExisting) {
      const existing = stationRates.find(r => r.stationId === rateForm.stationId);
      if (existing) {
        onUpdateStationRate({
          ...existing,
          rate: rateForm.rate,
          notes: rateForm.notes || '',
          dateAdded: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      onAddStationRate({
        id: `RATE-${Date.now()}`,
        stationId: rateForm.stationId,
        rate: rateForm.rate,
        dateAdded: new Date().toISOString().split('T')[0],
        notes: rateForm.notes || ''
      });
    }

    setIsRateModalOpen(false);
    setEditingRate(null);
    setRateForm({ stationId: '', rate: undefined, notes: '' });
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advForm.stationId) { alert("Please select a station."); return; }
    
    // Total utilization for this station (excluding the one being edited if applicable)
    const existingTotalUtilized = advances
      .filter(a => a.stationId === advForm.stationId && (!editingAdvance || a.id !== editingAdvance.id))
      .reduce((a, b) => a + b.amount, 0);
    
    const totalLifetime = pool.filter(p => p.stationId === advForm.stationId).reduce((a, b) => a + b.amount, 0);
    const availableBalance = totalLifetime - existingTotalUtilized;

    if ((advForm.amount || 0) > availableBalance) {
      alert(`Validation Error: Requested amount (₹${advForm.amount?.toLocaleString()}) exceeds available balance for this station (₹${(availableBalance || 0).toLocaleString()}).`);
      return;
    }
    
    if (editingAdvance) {
      onUpdateAdvance({
        ...editingAdvance,
        ...(advForm as PlantAdvance)
      });
    } else {
      onAddAdvance({ ...(advForm as PlantAdvance), id: `TPS-ADV-${Date.now()}` });
    }
    
    setIsAdvanceModalOpen(false);
    setEditingAdvance(null);
    setAdvForm({ orderId: '', truckId: '', stationId: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentMode: 'RTGS', referenceNo: '', status: 'PENDING', isPriority: false, notes: '', quantity: undefined, rate: undefined });
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8 pb-20">
      {/* Strategic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight flex items-center gap-3">
             <Factory size={32} className="text-blue-600" /> Advance Command Hub
          </h2>
          <p className="text-slate-500 font-medium">Station-specific financial segregation and master pool management.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => {
               setEditingRate(null);
               setRateForm({ stationId: '', rate: undefined, notes: '' });
               setIsRateModalOpen(true);
             }}
             className="flex items-center gap-2 px-5 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
           >
              <Tag size={18} /> Create Rate
           </button>
           <button 
             onClick={() => setIsPoolModalOpen(true)}
             className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
           >
              <Coins size={18} /> Add Lifetime Advance
           </button>
           <button 
             onClick={() => setIsAdvanceModalOpen(true)}
             className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
           >
              <Plus size={18} /> Create New TPS Advance
           </button>
        </div>
      </div>

      {/* Real-time Advance Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatCard label="Total Lifetime Advance" value={`₹${(currentTotals.totalLifetime || 0).toLocaleString()}`} icon={Banknote} color="blue" sub={filters.stationId === 'ALL' ? 'Across All Stations' : 'Selected Station Pool'} />
         <StatCard label="Total Utilized Payment" value={`₹${(currentTotals.totalUtilized || 0).toLocaleString()}`} icon={TrendingUp} color="amber" sub="Operational Debits" />
         <StatCard 
            label="Remaining Advance Balance" 
            value={`₹${(currentTotals.remaining || 0).toLocaleString()}`} 
            icon={IndianRupee} 
            color={currentTotals.remaining < (currentTotals.totalLifetime * 0.1) ? 'red' : 'green'} 
            sub="Liquid Capital" 
         />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
           {(['DASHBOARD', 'LEDGER', 'USAGE', 'POOL', 'RATE'] as const).map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveViewTab(tab)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeViewTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search UTR, Truck..."
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold w-48 focus:w-64 transition-all outline-none shadow-sm"
              />
           </div>
           <button onClick={() => setFilters({stationId: 'ALL', employeeName: 'ALL', truckId: 'ALL', clientId: 'ALL', orderId: 'ALL', paymentMode: 'ALL', startDate: '', endDate: ''})} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Clear Filters"><FilterX size={18}/></button>
        </div>
      </div>

      {/* Persistent Filters Matrix */}
      <div className="card card-pad-lg grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <FilterGroup label="TPS Station" value={filters.stationId} onChange={v => setFilters({...filters, stationId: v})} options={['ALL', ...stations.map(s=>s.id)]} labels={['All Stations', ...stations.map(s=>s.name)]} />
          <FilterGroup label="Client" value={filters.clientId} onChange={v => setFilters({...filters, clientId: v})} options={['ALL', ...clients]} />
          <FilterGroup label="Asset / Truck" value={filters.truckId} onChange={v => setFilters({...filters, truckId: v})} options={['ALL', ...trucks.map(t=>t.id)]} labels={['All Assets', ...trucks.map(t=>t.truckNumber)]} />
          <FilterGroup label="Order / Booking" value={filters.orderId} onChange={v => setFilters({...filters, orderId: v})} options={['ALL', ...orders.map(o=>o.id)]} />
          <FilterGroup label="Payment Mode" value={filters.paymentMode} onChange={v => setFilters({...filters, paymentMode: v})} options={['ALL', 'RTGS', 'UPI', 'NEFT', 'CASH']} />
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Start Date</label>
             <input type="date" className="w-full bg-[#F5F4F0] border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold" value={filters.startDate} onChange={e=>setFilters({...filters, startDate: e.target.value})} />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-1">End Date</label>
             <input type="date" className="w-full bg-[#F5F4F0] border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold" value={filters.endDate} onChange={e=>setFilters({...filters, endDate: e.target.value})} />
          </div>
      </div>

      {activeViewTab === 'DASHBOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
           {/* Station Liquidity Table */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                 <ShieldCheck size={24} className="text-green-600"/> Station Liquidity Status
              </h3>
              <div className="page-stack pb-10">
                 {stations.map((s, i) => {
                    const bal = getStationBalances(s.id);
                    const usagePercent = bal.totalLifetime > 0 ? (bal.totalUtilized / bal.totalLifetime) * 100 : 0;
                    return (
                       <div key={s.id} className="p-5 rounded-2xl border border-slate-50 bg-[#F5F4F0]/30 space-y-3">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-sm font-black text-slate-900">{s.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.location}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-black text-blue-600">Bal: ₹{(bal.remaining || 0).toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Limit: ₹{(bal.totalLifetime || 0).toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${usagePercent}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                             <span>{usagePercent.toFixed(1)}% Consumed</span>
                             <span>{bal.totalLifetime === 0 ? 'No Advance' : 'Active Pool'}</span>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Distribution Pie */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <h3 className="text-xl font-black text-slate-900 mb-10 w-full flex items-center gap-3 uppercase tracking-tighter">
                 <PieChartIcon size={24} className="text-indigo-600"/> Fund Distribution
              </h3>
              <div className="flex-1 w-full min-h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                         data={stations.map(s => ({ name: s.name, value: getStationBalances(s.id).totalLifetime }))} 
                         cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value"
                       >
                          {stations.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <Tooltip />
                       <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {activeViewTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/30">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <HistoryIcon size={18} className="text-blue-600" /> Advance Utilization History
              </h3>
              <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F5F4F0] shadow-sm">
                 <Printer size={16}/> Print Ledger
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-[#F5F4F0]/50 border-b border-slate-100">
                    <tr className="t-label">
                       <th className="px-8 py-5">Date & Station</th>
                       <th className="px-8 py-5">Audit Mapping</th>
                       <th className="px-8 py-5">Transaction Details</th>
                       <th className="px-8 py-5">UTR / Reference</th>
                       <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {paginatedAdvances.map(adv => {
                      const station = stations.find(s=>s.id===adv.stationId);
                      const truck = trucks.find(t=>t.id===adv.truckId);
                      const order = orders.find(o=>o.id===adv.orderId);
                      return (
                        <tr key={adv.id} className="hover:bg-[#F5F4F0]/30 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Factory size={20}/>
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900">{station?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{adv.date}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="space-y-1.5">
                                 <p className="text-xs font-black text-slate-700 flex items-center gap-2"><TruckIcon size={12} className="text-slate-400"/> {truck?.truckNumber}</p>
                                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><Briefcase size={10}/> {order?.clientName}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-base font-black text-slate-900 tracking-tighter">₹{(adv.amount || 0).toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase">
                                 {adv.paymentMode} • Order: {adv.orderId}
                                 {adv.quantity && adv.rate ? ` • ${adv.quantity} MT × ₹${adv.rate}` : ''}
                              </p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-xs font-bold text-slate-600 font-mono tracking-tighter">{adv.referenceNo}</p>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => {
                                     setEditingAdvance(adv);
                                     setAdvForm({
                                       orderId: adv.orderId,
                                       truckId: adv.truckId,
                                       stationId: adv.stationId,
                                       amount: Number(adv.amount) || 0,
                                       date: adv.date,
                                       paymentMode: adv.paymentMode,
                                       referenceNo: adv.referenceNo,
                                       status: adv.status,
                                       isPriority: adv.isPriority || false,
                                       notes: adv.notes || '',
                                       quantity: adv.quantity != null ? Number(adv.quantity) : undefined,
                                       rate: adv.rate != null ? Number(adv.rate) : undefined,
                                     });
                                     setIsAdvanceModalOpen(true);
                                   }} 
                                   className="p-2 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"
                                 >
                                   <Edit size={16}/>
                                 </button>
                                 <button onClick={() => onDeleteAdvance(adv.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"><Trash2 size={16}/></button>
                                 <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${adv.status === 'UTILIZED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    {adv.status}
                                 </span>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
           <div className="flex items-center justify-between px-8 py-4 bg-[#F5F4F0]/30 border-t border-slate-100">
              <p className="t-label">Page {ledgerPage} of {totalLedgerPages || 1}</p>
              <div className="flex gap-2">
                 <button 
                   disabled={ledgerPage === 1}
                   onClick={() => setLedgerPage(ledgerPage - 1)}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   disabled={ledgerPage >= totalLedgerPages}
                   onClick={() => setLedgerPage(ledgerPage + 1)}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm"
                 >
                   <ChevronRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeViewTab === 'USAGE' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           {/* Top-Level Summary Cards for USAGE section */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Total Quantity Utilized Card */}
              <div id="usage-qty-card" className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                 <div className="space-y-2 z-10">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Quantity Utilized</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-slate-900 tracking-tight">
                          {totalQuantityUtilized.toLocaleString()}
                       </span>
                       <span className="text-sm font-extrabold text-blue-600 uppercase tracking-widest">MT</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">Accumulated fly ash weight from active filtered utilization records</p>
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-100 z-10">
                    <Package size={28} />
                 </div>
                 <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-50/20 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>

              {/* Total Utilized Payment Card */}
              <div id="usage-amt-card" className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                 <div className="space-y-2 z-10">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Utilized Payment</span>
                    <div className="flex items-baseline gap-1">
                       <span className="text-sm font-extrabold text-emerald-600">₹</span>
                       <span className="text-4xl font-black text-slate-900 tracking-tight">
                          {totalAmountUtilized.toLocaleString()}
                       </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">Total funds disbursed to power stations for the filtered transactions</p>
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-100 z-10">
                    <IndianRupee size={28} />
                 </div>
                 <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-50/20 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>
           </div>

           {/* Station Advance Utilization Detail Table */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#F5F4F0]/30">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                       <TruckIcon size={18} className="text-blue-600" /> Station Advance Utilization Detail
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">Utilized advances by station following active filters</p>
                 </div>
                 
                 {/* Applied Filters visualization */}
                 <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Applied Filter:</span>
                       {activeFiltersList.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 font-mono">
                             None (All Records)
                          </span>
                       ) : (
                          <>
                             {activeFiltersList.map((f, idx) => (
                                <div 
                                   key={idx} 
                                   className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 pl-2.5 pr-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide shadow-sm"
                                >
                                   <span>{f.label}:</span>
                                   <span className="text-slate-900 font-bold font-mono normal-case">{f.value}</span>
                                   <button 
                                      type="button"
                                      onClick={f.onClear} 
                                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200 text-blue-600 transition-colors ml-1"
                                   >
                                      <X size={10} />
                                   </button>
                                </div>
                             ))}
                             <button 
                                type="button"
                                onClick={() => {
                                   setFilters({stationId: 'ALL', employeeName: 'ALL', truckId: 'ALL', clientId: 'ALL', orderId: 'ALL', paymentMode: 'ALL', startDate: '', endDate: ''});
                                   setSearchQuery('');
                                }} 
                                className="text-[10px] font-black text-red-600 hover:text-red-800 bg-red-50 border border-red-100 hover:bg-red-100 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors shadow-sm ml-1"
                             >
                                Clear All
                             </button>
                          </>
                       )}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                       {filteredAdvances.length} Records
                    </span>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[#F5F4F0]/50 border-b border-slate-100">
                       <tr className="t-label">
                          <th className="px-8 py-5">Date</th>
                          <th className="px-8 py-5">Stations</th>
                          <th className="px-8 py-5">Truck</th>
                          <th className="px-8 py-5">Order ID</th>
                          <th className="px-8 py-5">Quantity (MT)</th>
                          <th className="px-8 py-5">Rate per MT (₹)</th>
                          <th className="px-8 py-5 text-right">Amount (₹)</th>
                          <th className="px-8 py-5">Description</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredAdvances.length === 0 ? (
                          <tr>
                             <td colSpan={8} className="px-8 py-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider bg-[#F5F4F0]/10">
                                No utilized advance records match the active filter criteria
                             </td>
                          </tr>
                       ) : (
                          paginatedUsageAdvances.map(adv => {
                             const truckObj = trucks.find(t => t.id === adv.truckId);
                             const stationObj = stations.find(s => s.id === adv.stationId);
                             return (
                                <tr key={adv.id} className="hover:bg-[#F5F4F0]/30 transition-colors group">
                                   <td className="px-8 py-5 font-mono text-xs text-slate-500">{adv.date}</td>
                                   <td className="px-8 py-5 font-bold text-slate-700 text-xs">{stationObj?.name || adv.stationId}</td>
                                   <td className="px-8 py-5">
                                      <span className="font-black text-slate-900 text-xs tracking-tight bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                         {truckObj?.truckNumber || adv.truckId}
                                      </span>
                                   </td>
                                   <td className="px-8 py-5">
                                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100">
                                         {adv.orderId}
                                      </span>
                                   </td>
                                   <td className="px-8 py-5 font-bold text-slate-700 text-xs">
                                      {adv.quantity !== undefined ? `${adv.quantity.toLocaleString()} MT` : '—'}
                                   </td>
                                   <td className="px-8 py-5">
                                      {adv.rate !== undefined ? (
                                         <span className="text-xs font-bold text-emerald-600">
                                            ₹{adv.rate.toLocaleString()}
                                         </span>
                                      ) : '—'}
                                   </td>
                                   <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
                                      ₹{adv.amount.toLocaleString()}
                                   </td>
                                   <td className="px-8 py-5 text-xs text-slate-500 font-bold max-w-xs truncate" title={adv.notes || ''}>
                                      {adv.notes || '—'}
                                   </td>
                                </tr>
                             );
                          })
                       )}
                    </tbody>
                 </table>
              </div>

              <div className="flex items-center justify-between px-8 py-4 bg-[#F5F4F0]/30 border-t border-slate-100">
                 <p className="t-label">Page {usagePage} of {totalUsagePages || 1}</p>
                 <div className="flex gap-2">
                    <button 
                      type="button"
                      disabled={usagePage === 1}
                      onClick={() => setUsagePage(usagePage - 1)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      type="button"
                      disabled={usagePage >= totalUsagePages}
                      onClick={() => setUsagePage(usagePage + 1)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                 </div>
              </div>
           </div>

           {/* Charts Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartBox 
                 title="Station-wise Advance Usage" 
                 icon={MapPin}
                 metrics={[
                    { label: 'Total Quantity', value: `${totalQuantityUtilized.toLocaleString()} MT`, colorClass: 'text-blue-600' },
                    { label: 'Total Utilized Payment', value: `₹${totalAmountUtilized.toLocaleString()}`, colorClass: 'text-emerald-600' }
                 ]}
              >
                 <BarChart data={stations.map(s => ({n: s.name, v: getStationBalances(s.id).totalUtilized}))}>
                    <XAxis dataKey="n" hide/>
                    <YAxis fontSize={10}/>
                    <Tooltip/>
                    <Bar dataKey="v" fill="#2563eb" radius={[10,10,0,0]}/>
                 </BarChart>
              </ChartBox>

              <ChartBox 
                 title="Order-wise Advance Mapping" 
                 icon={Hash}
                 metrics={[
                    { label: 'Total Quantity', value: `${totalQuantityUtilized.toLocaleString()} MT`, colorClass: 'text-blue-600' },
                    { label: 'Total Utilized Payment', value: `₹${totalAmountUtilized.toLocaleString()}`, colorClass: 'text-emerald-600' }
                 ]}
              >
                 <BarChart data={orders.map(o => ({n: o.id, v: advances.filter(a=>a.orderId===o.id).reduce((sum,x)=>sum+x.amount,0)}))}>
                    <XAxis dataKey="n" hide/>
                    <YAxis fontSize={10}/>
                    <Tooltip/>
                    <Bar dataKey="v" fill="#f59e0b" radius={[10,10,0,0]}/>
                 </BarChart>
              </ChartBox>
           </div>
        </div>
      )}

      {activeViewTab === 'POOL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                 <h3 className="text-xl font-black tracking-tight">Lifetime Advance Ledger (Credits)</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Master Account Deposits per TPS</p>
              </div>
              <HistoryIcon size={24} className="text-blue-400 opacity-50" />
           </div>
           <div className="px-8 py-6 bg-[#F5F4F0] border-b border-slate-100 flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[250px]">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search Pool ID, UTR, Station, Staff, Description..."
                   value={searchQuery}
                   onChange={(e)=>setSearchQuery(e.target.value)}
                   className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                 />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Station</label>
                    <select 
                      className="bg-white border border-[#E7E5E0] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                      value={filters.stationId}
                      onChange={(e) => setFilters({...filters, stationId: e.target.value})}
                    >
                      <option value="ALL">All Stations</option>
                      {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <select 
                      className="bg-white border border-[#E7E5E0] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                      value={filters.paymentMode}
                      onChange={(e) => setFilters({...filters, paymentMode: e.target.value})}
                    >
                      <option value="ALL">All Methods</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">UPI / Digital</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                    <div className="flex items-center gap-2">
                      <input type="date" className="bg-white border border-[#E7E5E0] rounded-xl px-3 py-2 text-[10px] font-bold outline-none shadow-sm" value={filters.startDate} onChange={e=>setFilters({...filters, startDate: e.target.value})} />
                      <span className="text-slate-400 font-bold text-xs">-</span>
                      <input type="date" className="bg-white border border-[#E7E5E0] rounded-xl px-3 py-2 text-[10px] font-bold outline-none shadow-sm" value={filters.endDate} onChange={e=>setFilters({...filters, endDate: e.target.value})} />
                    </div>
                 </div>
                 <button onClick={() => setFilters({...filters, stationId: 'ALL', paymentMode: 'ALL', startDate: '', endDate: ''})} className="p-3 mt-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Clear Pooled Filters"><FilterX size={18}/></button>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-[#F5F4F0]/50 border-b border-slate-100">
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-6 py-5">Pool ID</th>
                       <th className="px-6 py-5">Txn Type</th>
                       <th className="px-6 py-5">Payment Method</th>
                       <th className="px-6 py-5">Bank Account</th>
                       <th className="px-6 py-5">Station (Entity)</th>
                       <th className="px-6 py-5 text-right">Amount (₹)</th>
                       <th className="px-6 py-5">Date</th>
                       <th className="px-6 py-5">Transaction ID / UTR</th>
                       <th className="px-6 py-5">Staff</th>
                       <th className="px-6 py-5">Description</th>
                       <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {paginatedPool.map(entry => {
                       const station = stations.find(s=>s.id===entry.stationId);
                       const bank = banks.find(b=>b.id===entry.bankId);
                       return (
                        <tr key={entry.id} className="hover:bg-[#F5F4F0]/50 transition-colors group">
                          <td className="px-6 py-6">
                             <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 inline-block font-mono">{entry.id}</p>
                          </td>
                          <td className="px-6 py-6">
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${entry.transactionType === 'PAID' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                 {entry.transactionType === 'PAID' ? 'DEPOSIT' : 'REFUND'}
                              </span>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{(entry.paymentMethod || "").replace('_', ' ')}</p>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-[9px] font-bold text-slate-600 truncate max-w-[120px]">{bank ? `${bank.bankName} - ${bank.accountNumber}` : 'N/A'}</p>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                 <div className="p-1 px-2 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 font-mono">TPS</div>
                                 <p className="text-xs font-black text-slate-900">{station?.name}</p>
                              </div>
                           </td>
                           <td className="px-6 py-6 text-right">
                              <p className={`text-sm font-black ${entry.transactionType === 'PAID' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                 {entry.transactionType === 'PAID' ? '+' : '-'} ₹{(entry.amount || 0).toLocaleString()}
                              </p>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-xs font-black text-slate-900">{entry.date}</p>
                           </td>
                           <td className="px-6 py-6">
                              <p className="text-[10px] font-mono font-bold text-slate-500 bg-[#F5F4F0] px-2 py-1 rounded-lg border border-slate-100 inline-block">{entry.referenceNo}</p>
                           </td>
                           <td className="px-6 py-6 font-black text-blue-500 text-[10px] uppercase">
                              {entry.employeeName || 'Admin'}
                           </td>
                           <td className="px-6 py-6 max-w-[150px]">
                              <p className="text-[10px] text-slate-400 font-medium line-clamp-2 italic leading-relaxed">{entry.notes || '-'}</p>
                           </td>
                           <td className="px-6 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                   onClick={() => {
                                     setEditingPoolEntry(entry);
                                     setPoolForm({
                                       stationId: entry.stationId,
                                       employeeId: entry.employeeId,
                                       employeeName: entry.employeeName,
                                       amount: Number(entry.amount) || 0,
                                       date: entry.date,
                                       referenceNo: entry.referenceNo,
                                       notes: entry.notes || '',
                                       transactionType: entry.transactionType,
                                       paymentMethod: entry.paymentMethod,
                                       bankId: entry.bankId
                                     });
                                     setIsPoolModalOpen(true);
                                   }} 
                                   className="p-2 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"
                                 >
                                   <Edit size={14}/>
                                 </button>
                                 <button onClick={() => onDeletePoolEntry(entry.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"><Trash2 size={14}/></button>
                              </div>
                           </td>
                        </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           <div className="flex items-center justify-between px-8 py-4 bg-[#F5F4F0]/30 border-t border-slate-100">
              <p className="t-label">Page {poolPage} of {totalPoolPages || 1}</p>
              <div className="flex gap-2">
                 <button 
                   disabled={poolPage === 1}
                   onClick={() => setPoolPage(poolPage - 1)}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   disabled={poolPage >= totalPoolPages}
                   onClick={() => setPoolPage(poolPage + 1)}
                   className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-[#F5F4F0] transition-all shadow-sm"
                 >
                   <ChevronRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeViewTab === 'RATE' && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
               <div>
                  <h3 className="text-xl font-black tracking-tight">TPS Purchase Rates (Buy price)</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">Configured purchase price per MT for Thermal Power Stations</p>
               </div>
               <Tag size={24} className="text-emerald-400 opacity-50" />
            </div>
            <div className="px-8 py-6 bg-[#F5F4F0] border-b border-slate-100 flex flex-wrap gap-4 items-center">
               <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Station, description..."
                    value={searchQuery}
                    onChange={(e)=>setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  />
               </div>
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Station</label>
                     <select 
                       className="bg-white border border-[#E7E5E0] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                       value={filters.stationId}
                       onChange={(e) => setFilters({...filters, stationId: e.target.value})}
                     >
                       <option value="ALL">All Stations</option>
                       {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                  </div>
                  <button onClick={() => setFilters({...filters, stationId: 'ALL'})} className="p-3 mt-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Clear Filters"><FilterX size={18}/></button>
                  <button 
                     onClick={() => {
                       setEditingRate(null);
                       setRateForm({ stationId: '', rate: undefined, notes: '' });
                       setIsRateModalOpen(true);
                     }}
                     className="px-6 py-3.5 mt-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center gap-2"
                  >
                     <Plus size={14} /> Add Rate Entry
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-[#F5F4F0]/50 border-b border-slate-100">
                     <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">TPS Station</th>
                        <th className="px-8 py-5">Buy Rate per MT</th>
                        <th className="px-8 py-5">Config Date</th>
                        <th className="px-8 py-5">Notes / Context</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stationRates.filter(rate => {
                       const station = stations.find(s => s.id === rate.stationId);
                       const matchesStation = filters.stationId === 'ALL' || rate.stationId === filters.stationId;
                       const matchesSearch = !searchQuery || 
                          (station?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (rate.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
                       return matchesStation && matchesSearch;
                    }).length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-8 py-16 text-center">
                             <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                                <div className="p-4 bg-[#F5F4F0] rounded-full text-slate-400">
                                   <Tag size={28} />
                                </div>
                                <h4 className="text-base font-black text-slate-700">No Purchase Rates Configured</h4>
                                <p className="text-xs text-slate-400 font-bold max-w-xs text-center leading-relaxed">Add purchase prices to enable rapid auto-costing validations when dispensing TPS advances.</p>
                                <button 
                                   type="button"
                                   onClick={() => {
                                      setEditingRate(null);
                                      setRateForm({ stationId: '', rate: undefined, notes: '' });
                                      setIsRateModalOpen(true);
                                   }}
                                   className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all"
                                >
                                   Create First Rate
                                </button>
                             </div>
                          </td>
                       </tr>
                    ) : (
                       stationRates.filter(rate => {
                          const station = stations.find(s => s.id === rate.stationId);
                          const matchesStation = filters.stationId === 'ALL' || rate.stationId === filters.stationId;
                          const matchesSearch = !searchQuery || 
                             (station?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (rate.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
                          return matchesStation && matchesSearch;
                       }).map(rate => {
                          const station = stations.find(s => s.id === rate.stationId);
                          return (
                            <tr key={rate.id} className="hover:bg-[#F5F4F0]/50 transition-colors">
                               <td className="px-8 py-6">
                                  <p className="text-sm font-black text-slate-900 tracking-tight">{station?.name || 'Unknown Station'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{station?.location || 'No Location'}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-1.5">
                                     <span className="text-lg font-black text-emerald-600">₹{(rate.rate || 0).toLocaleString()}</span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">per MT</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-xs font-bold text-slate-600 font-mono">{rate.dateAdded}</p>
                               </td>
                               <td className="px-8 py-6 max-w-xs">
                                  <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed">{rate.notes || '—'}</p>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex gap-2 justify-end">
                                     <button 
                                       type="button"
                                       onClick={() => {
                                         setEditingRate(rate);
                                         setRateForm({
                                           stationId: rate.stationId,
                                           rate: rate.rate != null ? Number(rate.rate) : undefined,
                                           notes: rate.notes
                                         });
                                         setIsRateModalOpen(true);
                                       }} 
                                       className="p-2 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"
                                       title="Edit Rate"
                                     >
                                       <Edit size={14}/>
                                     </button>
                                     <button 
                                       type="button"
                                       onClick={() => onDeleteStationRate(rate.id)} 
                                       className="p-2 text-slate-400 hover:text-red-600 transition-all border border-slate-100 rounded-lg hover:bg-white shadow-sm"
                                       title="Delete Rate"
                                     >
                                       <Trash2 size={14}/>
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          );
                       })
                    )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* ADD POOL MODAL */}
      {isPoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                 <div>
                    <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingPoolEntry ? 'Edit' : 'Add'} Lifetime Advance</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">TPS Account Deposit • Master Credit</p>
                 </div>
                 <button onClick={() => { setIsPoolModalOpen(false); setEditingPoolEntry(null); setPoolForm({ stationId: '', employeeId: '', employeeName: '', amount: 0, date: new Date().toISOString().split('T')[0], referenceNo: '', notes: '', transactionType: 'PAID', paymentMethod: 'BANK_TRANSFER', bankId: '' }); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20}/></button>
              </div>
              <form onSubmit={handlePoolSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[75vh] no-scrollbar">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="t-label px-1">Transaction Type</label>
                       <select 
                         className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                         value={poolForm.transactionType}
                         onChange={e => setPoolForm({...poolForm, transactionType: e.target.value as any})}
                       >
                         <option value="PAID">Paid (Deposit)</option>
                         <option value="RECEIVED">Received (Refund)</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="t-label px-1">Payment Method</label>
                       <select 
                         className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                         value={poolForm.paymentMethod}
                         onChange={e => setPoolForm({...poolForm, paymentMethod: e.target.value as any})}
                       >
                         <option value="BANK_TRANSFER">Bank Transfer</option>
                         <option value="UPI">UPI / Digital</option>
                         <option value="CASH">Cash</option>
                         <option value="CHEQUE">Cheque</option>
                       </select>
                    </div>
                 </div>

                 <SearchableSelect 
                    label={poolForm.paymentMethod === 'CASH' ? 'Select Cash Mode' : 'Select Bank Account'}
                    value={poolForm.bankId || ''}
                    placeholder={poolForm.paymentMethod === 'CASH' ? 'Select where cash came from/went...' : 'Select Bank...'}
                    options={banks.map(b => ({ value: b.id, label: b.bankName, sub: b.accountNumber }))}
                    onChange={v => setPoolForm({...poolForm, bankId: v})}
                 />

                 <SearchableSelect
                    label="Source Account / Entity (TPS Station)*"
                    value={poolForm.stationId || ''}
                    placeholder="Select TPS Station..."
                    options={stations.map(s => ({ value: s.id, label: s.name, sub: s.location }))}
                    onCreateNew={name => setQuickAdd({ type: 'site', initialName: name })}
                    createNewLabel="Add TPS Station"
                    onChange={v => setPoolForm({...poolForm, stationId: v})}
                 />
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="t-label px-1">Deposit Amount (₹)*</label>
                       <input type="number" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black text-xl text-green-600" value={poolForm.amount} onChange={e=>setPoolForm({...poolForm, amount: Number(e.target.value)})} placeholder="0.00" />
                    </div>
                    <div className="space-y-3">
                       <label className="t-label px-1">Deposit Date*</label>
                       <input type="date" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={poolForm.date} onChange={e=>setPoolForm({...poolForm, date: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="t-label px-1">Transaction ID / UTR*</label>
                    <input type="text" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={poolForm.referenceNo} onChange={e=>setPoolForm({...poolForm, referenceNo: e.target.value})} placeholder="Reference ID..." />
                 </div>

                 <SearchableSelect 
                    label="Responsible Staff (Optional)"
                    value={poolForm.employeeId || ''}
                    placeholder="Select Staff..."
                    options={employees.map(emp => ({ value: emp.id, label: emp.fullName, sub: emp.designation }))}
                    onChange={v => {
                       const emp = employees.find(emp => emp.id === v);
                       setPoolForm({...poolForm, employeeId: v, employeeName: emp?.fullName});
                    }}
                 />

                 <div className="space-y-3">
                    <label className="t-label px-1">Description</label>
                    <textarea className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs" value={poolForm.notes} onChange={e=>setPoolForm({...poolForm, notes: e.target.value})} placeholder="Add description..." rows={2} />
                 </div>

                 <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> {editingPoolEntry ? 'Update' : 'Authorize'} Account Credit
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* CREATE TPS ADVANCE MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
               <div>
                  <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingAdvance ? 'Edit' : 'Create New'} TPS Advance</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Operation Linkage • Balanced Utilization</p>
               </div>
               <button onClick={() => { setIsAdvanceModalOpen(false); setEditingAdvance(null); setAdvForm({ orderId: '', truckId: '', stationId: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentMode: 'RTGS', referenceNo: '', status: 'PENDING', isPriority: false, notes: '', quantity: undefined, rate: undefined }); }} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAdvanceSubmit} className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1">
               <SearchableSelect
                  label="Source Thermal Power Station*"
                  value={advForm.stationId || ''}
                  placeholder="Select loading point..."
                  options={stations.map(s => ({ value: s.id, label: s.name, sub: s.location }))}
                  onCreateNew={name => setQuickAdd({ type: 'site', initialName: name })}
                  createNewLabel="Add TPS Station"
                  onChange={v => {
                    const presetRate = stationRates.find(r => r.stationId === v)?.rate;
                    const qty = advForm.quantity || 0;
                    setAdvForm({
                      ...advForm,
                      stationId: v,
                      rate: presetRate || advForm.rate,
                      amount: qty && (presetRate || advForm.rate) ? Math.round(qty * (presetRate || advForm.rate || 0)) : advForm.amount
                    });
                  }}
               />

               {advForm.stationId && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                     <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase">Station Account Balance</p>
                        <p className="text-2xl font-black text-blue-900">₹{(getStationBalances(advForm.stationId).remaining || 0).toLocaleString()}</p>
                     </div>
                     <Coins size={32} className="text-blue-400 opacity-40"/>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SearchableSelect 
                     label="Target Order (Booking)*"
                     value={advForm.orderId || ''}
                     placeholder="Link to Trip ID..."
                     options={orders.map(o => ({ value: o.id, label: o.id, sub: o.clientName }))}
                     onChange={v => {
                        const selectedOrder = orders.find(o => o.id === v);
                        if (selectedOrder) {
                          const qty = selectedOrder.quantity || 0;
                          const currentRate = advForm.rate || 0;
                          setAdvForm({
                            ...advForm,
                            orderId: v,
                            truckId: selectedOrder.assignedTruckId || advForm.truckId || '',
                            quantity: qty || undefined,
                            amount: qty && currentRate ? Math.round(qty * currentRate) : advForm.amount
                          });
                        } else {
                          setAdvForm({...advForm, orderId: v});
                        }
                     }}
                  />
                  <SearchableSelect
                     label="Assigned Asset (Truck)*"
                     value={advForm.truckId || ''}
                     placeholder="Map Truck..."
                     options={trucks.map(t => ({ value: t.id, label: t.truckNumber, sub: t.driverName }))}
                     onCreateNew={name => setQuickAdd({ type: 'truck', initialName: name })}
                     createNewLabel="Add Truck"
                     onChange={v => setAdvForm({...advForm, truckId: v})}
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="t-label px-1">Quantity (MT)</label>
                     <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. 25.5"
                        className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" 
                        value={advForm.quantity ?? ''} 
                        onChange={e => {
                          const qty = Number(e.target.value);
                          const rate = advForm.rate || 0;
                          setAdvForm({
                            ...advForm,
                            quantity: qty || undefined,
                            amount: Math.round(qty * rate)
                          });
                        }}
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="t-label px-1">Rate per MT (₹)</label>
                     <input 
                        type="number" 
                        step="any"
                        placeholder="e.g. 450"
                        className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" 
                        value={advForm.rate ?? ''} 
                        onChange={e => {
                          const rate = Number(e.target.value);
                          const qty = advForm.quantity || 0;
                          setAdvForm({
                            ...advForm,
                            rate: rate || undefined,
                            amount: Math.round(qty * rate)
                          });
                        }}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="t-label px-1">Advance Amount (₹)*</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                        <input 
                           type="number" 
                           required 
                           className={`w-full pl-10 pr-6 py-4 bg-[#F5F4F0] border rounded-2xl font-black text-xl ${advForm.stationId && (advForm.amount || 0) > getStationBalances(advForm.stationId).remaining ? 'border-red-300 text-red-600' : 'border-slate-200 text-blue-600'}`} 
                           value={advForm.amount || ''} 
                           onChange={e => setAdvForm({...advForm, amount: Number(e.target.value)})} 
                        />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="t-label px-1">Transaction Ref / UTR*</label>
                     <input type="text" required className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={advForm.referenceNo} onChange={e => setAdvForm({...advForm, referenceNo: e.target.value})} placeholder="e.g. UTR-90123-XXXX" />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="t-label px-1">Description</label>
                  <textarea className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs" value={advForm.notes} onChange={e=>setAdvForm({...advForm, notes: e.target.value})} placeholder="Utilization reason..." rows={2} />
               </div>

               <button 
                  type="submit" 
                  disabled={!advForm.stationId || (advForm.amount || 0) <= 0 || (advForm.amount || 0) > (pool.filter(p => p.stationId === advForm.stationId).reduce((a, b) => a + b.amount, 0) - advances.filter(a => a.stationId === advForm.stationId && (!editingAdvance || a.id !== editingAdvance.id)).reduce((a, b) => a + b.amount, 0))} 
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
               >
                  <CheckCircle2 size={18} /> {editingAdvance ? 'Update' : 'Confirm & Dispatch'} Payment
               </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STATION RATE MODAL */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                 <div>
                    <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingRate ? 'Edit' : 'Create'} Station Rate</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Set thermal power station buy price</p>
                 </div>
                 <button 
                    type="button"
                    onClick={() => { 
                       setIsRateModalOpen(false); 
                       setEditingRate(null); 
                       setRateForm({ stationId: '', rate: undefined, notes: '' }); 
                    }} 
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all font-bold text-slate-500"
                 >
                    <X size={20}/>
                 </button>
              </div>
              <form onSubmit={handleRateSubmit} className="p-10 space-y-6 overflow-y-auto max-h-[75vh] no-scrollbar">
                 <SearchableSelect 
                    label="Thermal Power Station*"
                    placeholder="Select Station..."
                    value={rateForm.stationId || ''}
                    options={stations.map(s => ({ value: s.id, label: s.name, sub: s.location }))}
                    onChange={v => setRateForm({...rateForm, stationId: v})}
                 />

                 <div className="space-y-3">
                    <label className="t-label px-1">Rate per MT (₹)*</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                       <input 
                          type="number" 
                          required 
                          placeholder="e.g. 450"
                          className="w-full pl-10 pr-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black text-xl text-emerald-600 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                          value={rateForm.rate ?? ''} 
                          onChange={e => setRateForm({...rateForm, rate: Number(e.target.value) || undefined})} 
                       />
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold px-1 mt-1">This is the default buy price per metric ton from this station.</p>
                 </div>

                 <div className="space-y-3">
                    <label className="t-label px-1">Description / Notes</label>
                    <textarea 
                       className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                       value={rateForm.notes || ''} 
                       onChange={e => setRateForm({...rateForm, notes: e.target.value})} 
                       placeholder="e.g. Contract active until Dec 2026..." 
                       rows={2} 
                    />
                 </div>

                 <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <CheckCircle2 size={18}/> {editingRate ? 'Update' : 'Save'} Station Rate
                 </button>
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
            if (quickAdd.type === 'truck' && onAddTruck) onAddTruck(entity);
            else if (quickAdd.type === 'site' && onAddSite) onAddSite(entity);
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
};

const FilterGroup: React.FC<{ label: string, value: string, options: string[], labels?: string[], onChange: (v: string) => void, icon?: any }> = ({ label, value, options, labels, onChange, icon }) => (
  <SearchableSelect 
    label={label}
    value={value}
    onChange={onChange}
    variant="slate"
    icon={icon}
    options={options.map((opt, i) => ({ 
      value: opt, 
      label: labels && labels[i] ? labels[i] : opt.replace(/_/g, ' ')
    }))}
  />
);

const ChartBox: React.FC<{ 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  metrics?: { label: string; value: string | number; colorClass?: string }[];
}> = ({ title, icon: Icon, children, metrics }) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col h-[420px]">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
       <div className="flex items-center gap-3">
          <Icon size={20} className="text-blue-600" />
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h4>
       </div>
       {metrics && (
          <div className="flex flex-wrap items-center gap-4 bg-[#F5F4F0] border border-slate-150 px-4 py-2.5 rounded-2xl shadow-sm">
             {metrics.map((m, idx) => (
                <div key={idx} className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{m.label}</span>
                      <span className={`text-xs font-black tracking-tight leading-none ${m.colorClass || 'text-slate-900'}`}>{m.value}</span>
                   </div>
                   {idx < metrics.length - 1 && <div className="h-4 w-[1px] bg-slate-200" />}
                </div>
             ))}
          </div>
       )}
    </div>
    <div className="flex-1 w-full min-h-0">
       <ResponsiveContainer width="100%" height="100%">
         {children as React.ReactElement}
       </ResponsiveContainer>
    </div>
  </div>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: any, color: string, sub: string }> = ({ label, value, icon: Icon, color, sub }) => {
  const colors: Record<string, string> = { 
    blue: 'bg-blue-50 text-blue-600', 
    green: 'bg-green-50 text-green-600', 
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };
  return (
    <div className="card card-pad-lg group hover:shadow-xl transition-all">
       <div className="flex items-center justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${colors[color]}`}>
             <Icon size={24} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub}</span>
       </div>
       <p className="t-label">{label}</p>
       <p className="text-2xl font-black text-[#1C1917] tracking-tight mt-1 tracking-tighter">{value}</p>
    </div>
  );
};

export default PlantHubView;
