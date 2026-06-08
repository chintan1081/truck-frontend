
import React, { useState, useMemo } from 'react';
import { 
  Truck as TruckIcon, 
  MapPin, 
  Navigation, 
  Fuel, 
  Clock, 
  Bell, 
  ChevronRight, 
  ChevronDown,
  CheckCircle2, 
  Check,
  AlertCircle,
  Wrench,
  Search,
  Filter,
  X,
  Info,
  User,
  ArrowRight,
  Loader2,
  MessageCircle,
  TrendingUp,
  History,
  AlertTriangle,
  Zap,
  Activity,
  ShieldCheck,
  FileText,
  Files,
  Upload,
  Calendar,
  Gauge,
  Battery,
  // Added HeartPulse for health score
  HeartPulse,
  // Added missing FileCheck icon
  FileCheck,
  Tractor,
  Maximize2,
  MoreVertical,
  Settings,
  CircleDot,
  Plus,
  Download,
  Eye,
  Cpu,
  Shield,
  Droplets,
  Waves,
  CircleSlash as Brakes,
  Database,
  Star
} from 'lucide-react';
import { 
  Truck, 
  Order, 
  TripStatus, 
  Route, 
  Expense, 
  ExpenseCategory, 
  MaintenanceExpense,
  PerformanceMetric,
  TruckDocument,
  Driver,
  PlantAdvancePoolEntry,
  PlantAdvance,
  Site,
  Client
} from '../types';
import { sendDriverWhatsAppNotification, sendAppNotification } from '../services/notificationService';
import { calculateHealthScore } from '../lib/healthUtils';

interface FleetViewProps {
  fleet: Truck[];
  orders: Order[];
  expenses: Expense[];
  maintenance: MaintenanceExpense[];
  routes: Route[];
  performance: PerformanceMetric[];
  onUpdateOrder: (order: Order) => void;
  onUpdateTruck: (truck: Truck) => void;
  drivers?: Driver[];
  plantAdvancePool?: PlantAdvancePoolEntry[];
  plantAdvances?: PlantAdvance[];
  sites?: Site[];
  clients?: Client[];
}

const FleetView: React.FC<FleetViewProps> = ({ 
  fleet, 
  orders, 
  expenses, 
  maintenance, 
  routes, 
  performance, 
  onUpdateOrder, 
  onUpdateTruck, 
  drivers = [],
  plantAdvancePool = [],
  plantAdvances = [],
  sites = [],
  clients = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE'>('ALL');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const [assignData, setAssignData] = useState({ truckId: '', orderId: '', routeId: '' });
  const [maintenanceData, setMaintenanceData] = useState({ reason: '', nextServiceDate: '' });

  // States for searchable list dropdown toggles
  const [truckSelectorOpen, setTruckSelectorOpen] = useState(false);
  const [orderSelectorOpen, setOrderSelectorOpen] = useState(false);
  const [routeSelectorOpen, setRouteSelectorOpen] = useState(false);

  // States for search inputs
  const [truckSelectorSearch, setTruckSelectorSearch] = useState('');
  const [orderSelectorSearch, setOrderSelectorSearch] = useState('');
  const [routeSelectorSearch, setRouteSelectorSearch] = useState('');

  // Auto-reset search states when design modal opens/closes
  React.useEffect(() => {
    if (!isAssignModalOpen) {
      setTruckSelectorOpen(false);
      setOrderSelectorOpen(false);
      setRouteSelectorOpen(false);
      setTruckSelectorSearch('');
      setOrderSelectorSearch('');
      setRouteSelectorSearch('');
    }
  }, [isAssignModalOpen]);

  // Filtered available and busy trucks based on search
  const filteredTruckOptions = useMemo(() => {
    const query = truckSelectorSearch.toLowerCase();
    const available = fleet.filter(t => t.status === 'AVAILABLE');
    const busy = fleet.filter(t => t.status === 'ON_TRIP');
    const mnt = fleet.filter(t => t.status === 'MAINTENANCE');
    
    const combined = [
      ...available.map(t => ({ id: t.id, truckNumber: t.truckNumber, driverName: t.driverName, status: t.status, disabled: false })),
      ...busy.map(t => ({ id: t.id, truckNumber: t.truckNumber, driverName: t.driverName, status: 'BUSY (ON TRIP)', disabled: true })),
      ...mnt.map(t => ({ id: t.id, truckNumber: t.truckNumber, driverName: t.driverName, status: 'MAINTENANCE', disabled: true }))
    ];

    if (!query) return combined;
    return combined.filter(opt => 
      opt.truckNumber.toLowerCase().includes(query) || 
      opt.driverName.toLowerCase().includes(query)
    );
  }, [fleet, truckSelectorSearch]);

  // Filtered orders based on search
  const filteredOrderOptions = useMemo(() => {
    const query = orderSelectorSearch.toLowerCase();
    const unassignedOrders = orders.filter(o => !o.assignedTruckId);
    
    if (!query) return unassignedOrders;
    return unassignedOrders.filter(o => 
      o.id.toLowerCase().includes(query) || 
      o.projectSite.toLowerCase().includes(query)
    );
  }, [orders, orderSelectorSearch]);

  // Filtered routes based on search
  const filteredRouteOptions = useMemo(() => {
    const query = routeSelectorSearch.toLowerCase();
    
    if (!query) return routes;
    return routes.filter(r => 
      r.id.toLowerCase().includes(query) ||
      r.source.toLowerCase().includes(query) || 
      r.destination.toLowerCase().includes(query)
    );
  }, [routes, routeSelectorSearch]);

  const filteredFleet = useMemo(() => {
    return fleet.filter(truck => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (truck.truckNumber || "").toLowerCase().includes(query) ||
        (truck.driverName || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || truck.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fleet, searchQuery, statusFilter]);

  const stats = {
    total: fleet.length,
    available: fleet.filter(t => t.status === 'AVAILABLE').length,
    onTrip: fleet.filter(t => t.status === 'ON_TRIP').length,
    maintenance: fleet.filter(t => t.status === 'MAINTENANCE').length,
    criticalDocs: fleet.filter(t => {
        const today = new Date();
        const check = (d?: string) => {
            if (!d) return false;
            const date = new Date(d);
            if (isNaN(date.getTime())) return false;
            return date < today || (date.getTime() - today.getTime()) < 86400000 * 30;
        };
        return check(t.pollutionExpiry) || check(t.insuranceExpiry) || check(t.fitnessExpiry) || check(t.permitExpiry) || check(t.rcExpiry);
    }).length
  };

  const calculateFuelEfficiency = (truckId: string, orderId?: string) => {
    if (!orderId) return null;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.estimatedDiesel) return null;

    const actualDiesel = expenses
      .filter(e => e.truckId === truckId && e.orderId === orderId && e.category === ExpenseCategory.DIESEL)
      .reduce((sum, e) => sum + (e.liters || 0), 0);

    if (actualDiesel === 0) return { diff: 0, status: 'no_data' };
    const diff = actualDiesel - order.estimatedDiesel;
    return { diff, status: diff > 0 ? 'bad' : 'good', actual: actualDiesel, est: order.estimatedDiesel };
  };

  // Selected route and assigning order for Pool Balance & Client Outstanding
  const selectedRouteObj = useMemo(() => {
    return routes.find(r => r.id === assignData.routeId);
  }, [routes, assignData.routeId]);

  const assigningOrderObj = useMemo(() => {
    return orders.find(o => o.id === assignData.orderId);
  }, [orders, assignData.orderId]);

  const modalStationBalance = useMemo(() => {
    if (!selectedRouteObj) return 0;
    const tps = sites.find(s => s.name === selectedRouteObj.source && s.type === 'TPS');
    if (!tps) return 0;
    
    const lifetime = plantAdvancePool.filter(p => p.stationId === tps.id).reduce((sum, p) => sum + p.amount, 0);
    const utilized = plantAdvances.filter(a => a.stationId === tps.id).reduce((sum, a) => sum + a.amount, 0);
    return lifetime - utilized;
  }, [selectedRouteObj, plantAdvancePool, plantAdvances, sites]);

  const handleMaintenanceToggle = (truck: Truck) => {
    if (truck.status === 'MAINTENANCE') {
      const note = window.prompt("Maintenance Completion Note:");
      if (note !== null) {
        onUpdateTruck({
          ...truck,
          status: 'AVAILABLE',
          lastServiceDate: new Date().toISOString().split('T')[0],
          maintenanceReason: undefined,
          nextServiceDate: undefined
        });
        alert("Truck returned to Available fleet.");
      }
    } else {
      setSelectedTruck(truck);
      setMaintenanceData({ reason: '', nextServiceDate: '' });
      setIsMaintenanceModalOpen(true);
    }
  };

  const submitMaintenance = () => {
    if (!selectedTruck) return;
    onUpdateTruck({
      ...selectedTruck,
      status: 'MAINTENANCE',
      maintenanceReason: maintenanceData.reason,
      nextServiceDate: maintenanceData.nextServiceDate
    });
    setIsMaintenanceModalOpen(false);
    alert("Truck marked for Maintenance.");
  };

  const confirmAssignment = async () => {
    const truckToAssign = fleet.find(t => t.id === assignData.truckId) || selectedTruck;
    if (!truckToAssign || !assignData.orderId || !assignData.routeId) return;
    const order = orders.find(o => o.id === assignData.orderId);
    const route = routes.find(r => r.id === assignData.routeId);
    if (!order || !route) return;

    setIsDispatching(true);
    const estimatedDiesel = Number((route.distanceKm / truckToAssign.mileage).toFixed(2));

    const updatedOrder: Order = {
      ...order,
      assignedTruckId: truckToAssign.id,
      assignedRouteId: assignData.routeId,
      estimatedDiesel: estimatedDiesel,
      status: TripStatus.ASSIGNED
    };
    onUpdateOrder(updatedOrder);

    // Sync Truck Status to ON_TRIP
    // Now handled in App.tsx handleUpdateOrder detect loop

    try {
      await sendDriverWhatsAppNotification(truckToAssign, updatedOrder, route);
      sendAppNotification("Trip Assigned", `Truck ${truckToAssign.truckNumber} dispatched.`);
    } catch (e) { console.error(e); }

    setIsDispatching(false);
    setIsAssignModalOpen(false);
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusString = (s: any): string => {
    if (typeof s === 'string') return s;
    return s?.status || 'GOOD';
  };

  return (
    <div className="page-stack-lg">
      {/* Header with Compliance Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Fleet Command</h2>
          <p className="text-slate-500 font-medium">Strategic intelligence for asset health and operational efficiency.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatMini label="Active Fleet" value={stats.onTrip} color="blue" />
          <StatMini label="Available Assets" value={stats.available} color={stats.available < 3 ? "rose" : "emerald"} />
          <StatMini label="Document Alerts" value={stats.criticalDocs} color="red" />
          <StatMini label="Fleet Yield" value="92.4%" color="emerald" />
        </div>
      </div>

      {stats.available < 3 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
           <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center border border-amber-200">
              <AlertTriangle size={20} />
           </div>
           <div>
              <p className="text-sm font-black text-amber-900">Low Fleet Availability</p>
              <p className="text-xs text-amber-700 font-medium whitespace-nowrap">Only {stats.available} trucks are currently ready for assignment. Consider prioritizing orders.</p>
           </div>
        </div>
      )}



      {/* Search & Bulk Tools */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search fleet by truck #, driver, or expiring docs..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none shadow-sm transition-all font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
          {(['ALL', 'AVAILABLE', 'ON_TRIP', 'MAINTENANCE'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${
                statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'
              }`}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {filteredFleet.map((truck) => {
          const activeOrder = orders.find(o => o.assignedTruckId === truck.id && o.status !== TripStatus.PAID);
          const fuelPerf = calculateFuelEfficiency(truck.id, activeOrder?.id);
          const getVaultDate = (type: string) => {
            const doc = (truck.documents || []).find(d => d.type === type);
            if (doc?.expiryDate) return doc.expiryDate;
            const flatKeys: Record<string, string> = {
              'RC': 'rcExpiry',
              'INSURANCE': 'insuranceExpiry',
              'FITNESS': 'fitnessExpiry',
              'PUC': 'pollutionExpiry',
              'STATE_PERMIT': 'permitExpiry'
            };
            return (truck as any)[flatKeys[type]] || 'N/A';
          };

          const rcDate = getVaultDate('RC');
          const insDate = getVaultDate('INSURANCE');
          const fitDate = getVaultDate('FITNESS');
          const pucDate = getVaultDate('PUC');
          const permitDate = getVaultDate('STATE_PERMIT');

          const driverObj = (drivers || []).find(d => d.id === truck.assignedDriverId || d.name === truck.driverName);
          const dlDoc = (truck.documents || []).find(d => d.type === 'DRIVER_LICENCE');
          const dlDate = dlDoc?.expiryDate || driverObj?.licenseExpiry || 'N/A';

          const daysToRC = rcDate !== 'N/A' ? getDaysUntil(rcDate) : 999;
          const daysToInsurance = insDate !== 'N/A' ? getDaysUntil(insDate) : 999;
          const daysToFitness = fitDate !== 'N/A' ? getDaysUntil(fitDate) : 999;
          const daysToPollution = pucDate !== 'N/A' ? getDaysUntil(pucDate) : 999;
          const daysToPermit = permitDate !== 'N/A' ? getDaysUntil(permitDate) : 999;
          const daysToDL = dlDate !== 'N/A' ? getDaysUntil(dlDate) : 999;

          const hasCriticalDocs = daysToPollution <= 30 || daysToInsurance <= 30 || daysToFitness <= 30 || daysToRC <= 30 || daysToPermit <= 30 || daysToDL <= 30;
          const hasExpiredDocs = daysToPollution < 0 || daysToInsurance < 0 || daysToFitness < 0 || daysToRC < 0 || daysToPermit < 0 || daysToDL < 0;

          return (
            <div key={truck.id} className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative overflow-hidden ${
                hasExpiredDocs ? 'border-red-500 shadow-red-100 ring-4 ring-red-50' : 
                hasCriticalDocs ? 'border-amber-400 shadow-amber-50' : 'border-slate-100'
            }`}>
              {/* Asset Header */}
              {hasExpiredDocs && (
                <div className="absolute top-0 right-0 left-0 bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.2em] py-1 text-center animate-pulse z-10">
                   Compliance Breach: Expired Documents
                </div>
              )}
              <div className="p-8 space-y-6 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${
                      truck.isMaintenanceMode ? 'bg-rose-500 text-white animate-pulse' :
                      truck.status === 'AVAILABLE' ? 'bg-green-100 text-green-600' :
                      truck.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {truck.isMaintenanceMode ? <Wrench size={28} /> : <TruckIcon size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-slate-900 leading-none">{truck.truckNumber || 'NO #'}</h4>
                        {truck.isMaintenanceMode && (
                          <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.2em] border border-rose-200">
                            Maint
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1.5 uppercase tracking-tighter">
                        <User size={12}/> {truck.driverName || 'No Driver'} • {truck.modelNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Health Score</p>
                       <div className={`text-xl font-black leading-none ${
                          calculateHealthScore(truck) > 80 ? 'text-emerald-500' : 
                          calculateHealthScore(truck) > 50 ? 'text-amber-500' : 'text-red-500'
                       }`}>
                          {calculateHealthScore(truck)}%
                       </div>
                    </div>
                    <button onClick={() => { setSelectedTruck(truck); setIsDossierOpen(true); }} className="p-2 text-slate-400 hover:bg-[#F5F4F0] rounded-xl transition-colors">
                      <Maximize2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Compliance Pulse - Live Vault Sync */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Pulse</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50/50 text-blue-600 rounded-full border border-blue-100/50">
                         <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                         <span className="text-[7px] font-black uppercase tracking-widest text-blue-700">Live Vault Sync</span>
                      </div>
                   </div>
                    <div className="flex flex-wrap gap-2">
                       <ComplianceBadge label="RC" days={daysToRC} date={rcDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                       <ComplianceBadge label="INS" days={daysToInsurance} date={insDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                       <ComplianceBadge label="FIT" days={daysToFitness} date={fitDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                       <ComplianceBadge label="PUC" days={daysToPollution} date={pucDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                       <ComplianceBadge label="PERMIT" days={daysToPermit} date={permitDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                       <ComplianceBadge label="DL" days={daysToDL} date={dlDate} onClick={() => { setSelectedTruck(truck); setIsVaultOpen(true); }} />
                    </div>
                </div>

                {/* Quick Diagnostics Grid (Synchronized from Workforce) */}
                {(() => {
                   const driverPerf = performance.filter(p => p.entityId === truck.assignedDriverId || p.entityId === truck.driverName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                   return (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-1 group/score hover:border-blue-200 transition-colors">
                           <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                              Workforce Rating {driverPerf && <Star size={10} className="fill-amber-400 text-amber-400" />}
                           </p>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-slate-800">{driverPerf?.efficiencyScore || truck.driverScore || 85}%</span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${driverPerf?.efficiencyScore || truck.driverScore || 85}%` }} />
                              </div>
                           </div>
                        </div>
                        <div className="p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase">Engine Hours</p>
                           <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                              <Clock size={14} className="text-slate-400"/> {(truck.engineHours || 0).toLocaleString()}h
                           </div>
                        </div>
                     </div>
                   );
                })()}

                {/* Health Status Components */}
                <div className="grid grid-cols-3 gap-2">
                  <HealthIndicator label="Battery" status={getStatusString(truck.healthStatus?.battery)} />
                  <HealthIndicator label="Engine" status={getStatusString(truck.healthStatus?.engine)} />
                  <HealthIndicator label="Tyres" status={getStatusString(truck.healthStatus?.tyres)} />
                </div>

                {/* Live Trip Efficiency Component */}
                {truck.status === 'ON_TRIP' && activeOrder ? (
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                            <CircleDot size={10} className="text-blue-600 animate-pulse" /> Live Trip: {activeOrder.projectSite} (TPS) ➔ {activeOrder.clientName} (Client)
                        </span>
                        {fuelPerf && fuelPerf.status !== 'no_data' && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${fuelPerf.status === 'good' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {fuelPerf.status === 'good' ? 'Efficient' : 'Waste'}
                          </span>
                        )}
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase text-blue-400">
                           <span>Progress</span>
                           <span>{activeOrder.id}</span>
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden border border-blue-100">
                           <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '65%' }}></div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="p-5 bg-[#F5F4F0]/50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="t-label flex items-center gap-1.5">
                           <History size={10} /> Recent Activity
                        </p>
                        <span className="text-[9px] font-black text-slate-400">{truck.idleTimeHours}h Idle</span>
                     </div>
                     {orders.filter(o => o.assignedTruckId === truck.id).slice(0, 1).map(o => (
                        <div key={o.id} className="flex items-center justify-between">
                           <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{o.projectSite}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase">{o.deliveryDate}</span>
                        </div>
                     ))}
                     {orders.filter(o => o.assignedTruckId === truck.id).length === 0 && (
                        <p className="text-[10px] text-slate-300 italic">No recent trips logged</p>
                     )}
                  </div>
                )}

                {/* Tech Health Monitor - Integrated Performance Lifecycle */}
                <div className="space-y-4 pt-2">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <Activity size={12} className="text-blue-500 animate-pulse" /> Technical Health Monitor
                      </span>
                      <div className="flex items-center gap-1.5">
                         <Gauge size={12} className="text-slate-400" />
                         <span className="text-[10px] font-black text-slate-800">{truck.mileage} KM/L</span>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-4 gap-x-4 gap-y-3 p-4 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100">
                      <HealthUnit label="Battery" status={getStatusString(truck.healthStatus?.battery)} icon={Battery} id="battery" />
                      <HealthUnit label="Engine" status={getStatusString(truck.healthStatus?.engine)} icon={Cpu} id="engine" />
                      <HealthUnit label="Tyres" status={getStatusString(truck.healthStatus?.tyres)} icon={CircleDot} id="tyres" />
                      <HealthUnit label="Electrical" status={getStatusString(truck.healthStatus?.electrical)} icon={Zap} id="electrical" />
                      <HealthUnit label="Body" status={getStatusString(truck.healthStatus?.body)} icon={Shield} id="body" />
                      <HealthUnit label="Oil" status={getStatusString(truck.healthStatus?.oil)} icon={Droplets} id="oil" />
                      <HealthUnit label="Water" status={getStatusString(truck.healthStatus?.water)} icon={Waves} id="water" />
                      <HealthUnit label="Brakes" status={getStatusString(truck.healthStatus?.brakes)} icon={Brakes} id="brakes" />
                   </div>

                   {/* Synchronized Driver Performance from Workforce */}
                   {(() => {
                      const driverPerf = performance.filter(p => p.entityId === truck.assignedDriverId || p.entityId === truck.driverName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                      return (
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <User size={12} className="text-indigo-500" /> Driver Performance Sync
                               </span>
                               {driverPerf && (
                                  <div className="flex gap-0.5">
                                     {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={10} className={s <= (driverPerf.serviceRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                     ))}
                                  </div>
                               )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                               <div className="p-2.5 bg-blue-50/30 rounded-xl border border-blue-100/50">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ops Efficiency</p>
                                  <div className="flex items-center justify-between">
                                     <span className="text-xs font-black text-blue-600">{driverPerf?.operationalEfficiency || truck.driverScore || 85}%</span>
                                     <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${driverPerf?.operationalEfficiency || truck.driverScore || 85}%` }} />
                                     </div>
                                  </div>
                               </div>
                               <div className="p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Safety Index</p>
                                  <div className="flex items-center justify-between">
                                     <span className="text-xs font-black text-emerald-600">{driverPerf?.safetyCompliance || 100}%</span>
                                     <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${driverPerf?.safetyCompliance || 100}%` }} />
                                     </div>
                                  </div>
                               </div>
                               <div className="p-2.5 bg-amber-50/30 rounded-xl border border-amber-100/50">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cycle Timing</p>
                                  <div className="flex items-center justify-between">
                                     <span className="text-xs font-black text-amber-600">{driverPerf?.loadCycleTiming || 90}%</span>
                                     <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${driverPerf?.loadCycleTiming || 90}%` }} />
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      );
                   })()}

                   {maintenance.filter(m => m.truckId === truck.id).length > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold bg-[#F5F4F0] px-3 py-2 rounded-xl border border-slate-100">
                         <span className="flex items-center gap-1.5"><Wrench size={12} className="text-slate-400" /> Last Maint:</span>
                         <span className="text-slate-900">{[...maintenance].filter(m => m.truckId === truck.id).sort((a,b) => b.date.localeCompare(a.date))[0].date}</span>
                      </div>
                   )}
                </div>
              </div>

              {/* Action Ribbon */}
              <div className="px-8 py-5 bg-[#F5F4F0]/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                   <button 
                     onClick={() => {
                        const newMode = !truck.isMaintenanceMode;
                        onUpdateTruck({
                          ...truck,
                          isMaintenanceMode: newMode,
                          status: newMode ? 'MAINTENANCE' : (truck.status === 'MAINTENANCE' ? 'AVAILABLE' : truck.status)
                        });
                     }} 
                     className={`${truck.isMaintenanceMode ? 'text-rose-600' : 'text-slate-400 hover:text-amber-600'} transition-colors`} 
                     title="Toggle Maintenance Mode"
                   >
                      <Wrench size={18} className={truck.isMaintenanceMode ? 'animate-spin' : ''} />
                   </button>
                   <button onClick={() => { setSelectedTruck(truck); setIsDossierOpen(true); }} className="text-slate-400 hover:text-red-600 transition-colors" title="Detailed Health Status">
                      <Activity size={18} />
                   </button>
                   <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Locate on Map">
                      <MapPin size={18} />
                   </button>
                </div>
                {truck.status === 'AVAILABLE' ? (
                  <button 
                    onClick={() => { setSelectedTruck(truck); setAssignData({ truckId: truck.id, orderId: '', routeId: '' }); setIsAssignModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    Assign <ChevronRight size={14} />
                  </button>
                ) : truck.status === 'ON_TRIP' ? (
                  <button 
                    onClick={() => {
                        const activeOrder = orders.find(o => o.assignedTruckId === truck.id && o.status !== TripStatus.DELIVERED);
                        if (activeOrder) {
                            onUpdateOrder({ ...activeOrder, status: TripStatus.DELIVERED });
                            sendAppNotification("Trip Completed", `Truck ${truck.truckNumber} has completed delivery for ${activeOrder.projectSite}.`);
                        } else {
                            onUpdateTruck({ ...truck, status: 'AVAILABLE' });
                        }
                    }}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all animate-pulse"
                  >
                    Complete Trip <Check size={14} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-600">
                    <Wrench size={14} /> In Maintenance
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Dossier Modal (20+ Feature Modal) */}
      {isDossierOpen && selectedTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
             <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                      <TruckIcon size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{selectedTruck.truckNumber}</h3>
                      <div className="flex items-center gap-3 mt-1">
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Full Dossier • Fleet Asset #{selectedTruck.id.slice(-4)}</p>
                         <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Live Vault Sync</span>
                         </div>
                      </div>
                   </div>
                </div>
                <button onClick={() => setIsDossierOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24}/></button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-12">
                {/* Dashboard Stats in Modal */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                   <DossierStat 
                     label="Health Score" 
                     value={`${calculateHealthScore(selectedTruck)}%`} 
                     icon={HeartPulse} 
                     color={calculateHealthScore(selectedTruck) > 80 ? 'green' : calculateHealthScore(selectedTruck) > 50 ? 'amber' : 'red'} 
                   />
                   <DossierStat label="Fuel Eff." value={`${selectedTruck.mileage || 0}km/l`} icon={Gauge} color="blue" />
                   <DossierStat label="Driver Score" value={`${selectedTruck.driverScore || 0}%`} icon={User} color="indigo" />
                   <DossierStat label="Battery" value={getStatusString(selectedTruck.healthStatus?.battery)} icon={Battery} color="green" />
                   <DossierStat label="Lifetime MT" value={`${selectedTruck.totalMtHandled || 0}t`} icon={Zap} color="amber" />
                </div>

                {/* Documents Module */}
                <div className="page-stack pb-10">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldCheck size={20} className="text-blue-600" /> Statutory Compliance & Documents
                      </h4>
                      <button 
                        onClick={() => setIsVaultOpen(true)}
                        className="text-[10px] font-black text-blue-600 hover:text-white uppercase tracking-widest flex items-center gap-2 bg-blue-50 hover:bg-blue-600 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-blue-200 active:scale-95"
                      >
                         Open Digital Vault <FileCheck size={14} className="group-hover:scale-110 transition-transform" />
                      </button>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['RC', 'INSURANCE', 'FITNESS', 'STATE_PERMIT', 'PUC'].map(type => {
                         const doc = (selectedTruck.documents || []).find(d => d.type === type);
                         const labels: Record<string, string> = {
                            'RC': 'Registration (RC)',
                            'INSURANCE': 'Insurance Policy',
                            'FITNESS': 'Fitness Certificate',
                            'STATE_PERMIT': 'State Permit',
                            'PUC': 'PUC / Emission'
                         };
                         const categories: Record<string, string> = {
                            'RC': 'RTO',
                            'INSURANCE': 'Legal',
                            'FITNESS': 'RTO',
                            'STATE_PERMIT': 'Logistics',
                            'PUC': 'Environmental'
                         };
                         const flatKey = type.toLowerCase() === 'state_permit' ? 'permitExpiry' : `${type.toLowerCase()}Expiry`;
                         return (
                            <DocCard 
                               key={type}
                               label={labels[type]} 
                               expiry={doc?.expiryDate || (selectedTruck as any)[flatKey] || 'N/A'} 
                               type={categories[type]} 
                               onOpen={() => setIsVaultOpen(true)} 
                            />
                         );
                      })}
                   </div>
                </div>

                {/* Health & Tires Module */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="page-stack pb-10">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={20} className="text-red-600" /> Technical Health Monitor
                      </h4>
                      <div className="p-8 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-6">
                         <HealthRow label="Engine Performance" status={getStatusString(selectedTruck.healthStatus?.engine)} />
                         <HealthRow label="Braking System" status="HEALTHY" />
                         <HealthRow label="Tyre Tread Depth" status={getStatusString(selectedTruck.healthStatus?.tyres)} />
                         <HealthRow label="Coolant Levels" status="HEALTHY" />
                      </div>
                   </div>
                   <div className="page-stack pb-10">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <History size={20} className="text-indigo-600" /> Recent Trip Activity
                      </h4>
                      <div className="space-y-3">
                         {orders.filter(o => o.assignedTruckId === selectedTruck.id).slice(0, 3).map(o => (
                            <div key={o.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:translate-x-2 transition-transform cursor-pointer">
                               <div>
                                  <p className="text-xs font-black text-slate-900">{o.id}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{o.deliveryDate}</p>
                               </div>
                               <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{o.status}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-10 border-t border-slate-100 bg-[#F5F4F0]/50 flex gap-4">
                <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                   <Settings size={18} /> Update Technical Log
                </button>
                <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                   <FileText size={18} /> Generate Full Report
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Vault Modal */}
      {isVaultOpen && selectedTruck && (
         <VaultModal 
           truck={selectedTruck} 
           onClose={() => setIsVaultOpen(false)} 
           onUpdateTruck={onUpdateTruck}
         />
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50 flex-shrink-0">
                <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">Dispatch Truck</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full"><X size={20}/></button>
             </div>
             <div className="p-8 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#F5F4F0] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 pb-10">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select Truck (Available Only)</label>
                    <div className="relative">
                      <div 
                        className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                        onClick={() => {
                          setTruckSelectorOpen(!truckSelectorOpen);
                          setOrderSelectorOpen(false);
                          setRouteSelectorOpen(false);
                        }}
                      >
                        <span className={assignData.truckId ? "text-slate-905" : "text-slate-400"}>
                          {assignData.truckId ? (() => {
                            const selected = fleet.find(t => t.id === assignData.truckId);
                            return selected ? `${selected.truckNumber} — ${selected.driverName}` : 'Select Truck...';
                          })() : 'Select Truck (Available Only)...'}
                        </span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${truckSelectorOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {truckSelectorOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setTruckSelectorOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E7E5E0] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-slate-100 bg-[#F5F4F0]/50 relative">
                              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="Search by truck number or driver..."
                                value={truckSelectorSearch}
                                onChange={(e) => setTruckSelectorSearch(e.target.value)}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1">
                              {filteredTruckOptions.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400 font-bold">No trucks found</div>
                              ) : (
                                filteredTruckOptions.map(t => (
                                  <div 
                                    key={t.id}
                                    onClick={() => {
                                      if (t.disabled) return;
                                      setAssignData({ ...assignData, truckId: t.id });
                                      setTruckSelectorOpen(false);
                                    }}
                                    className={`px-5 py-3 text-xs font-bold transition-all flex items-center justify-between border-l-4 ${
                                      t.disabled 
                                        ? 'opacity-50 cursor-not-allowed bg-[#F5F4F0] text-slate-400 border-transparent' 
                                        : 'cursor-pointer hover:bg-[#F5F4F0] ' + (assignData.truckId === t.id ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-slate-700 border-transparent')
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-extrabold">{t.truckNumber}</span>
                                      <span className="text-[10px] text-slate-400">{t.driverName}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                                      t.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 font-semibold'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Active Order</label>
                    <div className="relative">
                      <div 
                        className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold text-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                        onClick={() => {
                          setOrderSelectorOpen(!orderSelectorOpen);
                          setTruckSelectorOpen(false);
                          setRouteSelectorOpen(false);
                        }}
                      >
                        <span className={assignData.orderId ? "text-slate-900" : "text-slate-400"}>
                          {assignData.orderId ? (() => {
                            const selected = orders.find(o => o.id === assignData.orderId);
                            return selected ? `${selected.id} — ${selected.projectSite}` : 'Select Order...';
                          })() : 'Select Order...'}
                        </span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${orderSelectorOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {orderSelectorOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOrderSelectorOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E7E5E0] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-slate-100 bg-[#F5F4F0]/50 relative">
                              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="Search by order ID or site..."
                                value={orderSelectorSearch}
                                onChange={(e) => setOrderSelectorSearch(e.target.value)}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1">
                              {filteredOrderOptions.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400 font-bold">No pending orders found</div>
                              ) : (
                                filteredOrderOptions.map(o => (
                                  <div 
                                    key={o.id}
                                    onClick={() => {
                                      setAssignData({ ...assignData, orderId: o.id, routeId: '' });
                                      setOrderSelectorOpen(false);
                                    }}
                                    className={`px-5 py-3 text-xs font-bold cursor-pointer transition-all flex flex-col justify-center border-l-4 hover:bg-[#F5F4F0] ${
                                      assignData.orderId === o.id ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-slate-700 border-transparent'
                                    }`}
                                  >
                                    <span className="font-extrabold">{o.id}</span>
                                    <span className="text-[10px] text-slate-400">{o.projectSite}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 text-blue-600 flex justify-between items-center">
                      <span>Route Assignment (TPS → Client)</span>
                      <span className="text-[10px] text-slate-300">from Master Data</span>
                    </label>
                    <div className="relative">
                      <div 
                        className={`w-full px-5 py-4 border rounded-2xl font-bold flex justify-between items-center transition-all ${
                          !assignData.orderId 
                            ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200' 
                            : 'cursor-pointer hover:bg-[#F5F4F0] border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm'
                        }`}
                        onClick={() => {
                          if (!assignData.orderId) return;
                          setRouteSelectorOpen(!routeSelectorOpen);
                          setTruckSelectorOpen(false);
                          setOrderSelectorOpen(false);
                        }}
                      >
                        <span className={assignData.routeId ? "text-slate-900" : "text-slate-400"}>
                          {assignData.routeId ? (() => {
                            const selected = routes.find(r => r.id === assignData.routeId);
                            return selected ? `${selected.source} (TPS) ➔ ${selected.destination} (Client) — ${selected.distanceKm} KM` : 'Choose trip route...';
                          })() : 'Choose trip route...'}
                        </span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${routeSelectorOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {routeSelectorOpen && assignData.orderId && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setRouteSelectorOpen(false)} />
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E7E5E0] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-slate-100 bg-[#F5F4F0]/50 relative">
                              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                placeholder="Search route source or destination..."
                                value={routeSelectorSearch}
                                onChange={(e) => setRouteSelectorSearch(e.target.value)}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto py-1">
                              {filteredRouteOptions.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400 font-bold">No routes found</div>
                              ) : (
                                filteredRouteOptions.map(r => (
                                  <div 
                                    key={r.id}
                                    onClick={() => {
                                      setAssignData({ ...assignData, routeId: r.id });
                                      setRouteSelectorOpen(false);
                                    }}
                                    className={`px-5 py-3 text-xs font-bold cursor-pointer transition-all flex flex-col justify-center border-l-4 hover:bg-[#F5F4F0] ${
                                      assignData.routeId === r.id ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-slate-700 border-transparent'
                                    }`}
                                  >
                                    <span className="font-extrabold">{r.source} (TPS) ➔ {r.destination} (Client)</span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{r.distanceKm} KM total distance</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pool Balance & Client Outstanding */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {selectedRouteObj ? (
                      <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-colors ${modalStationBalance < 10000 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                        <Info size={16} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest leading-none">Pool Balance: {selectedRouteObj.source}</p>
                          <p className="text-sm font-black mt-1">₹{modalStationBalance.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl flex items-center gap-3 border bg-[#F5F4F0] border-slate-100 text-slate-400">
                        <Info size={16} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest leading-none">Pool Balance</p>
                          <p className="text-xs font-bold mt-1">Select Route to View</p>
                        </div>
                      </div>
                    )}
                    
                    {assigningOrderObj ? (() => {
                      const client = clients.find(c => c.name === assigningOrderObj.clientName);
                      const balance = client?.outstandingBalance ?? 0;
                      return (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-colors ${balance > 50000 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-[#F5F4F0] border-slate-100 text-slate-700'}`}>
                          <User size={16} />
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Outstanding: {assigningOrderObj.clientName || 'N/A'}</p>
                            <p className="text-sm font-black mt-1">₹{balance.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-4 rounded-2xl flex items-center gap-3 border bg-[#F5F4F0] border-slate-100 text-slate-400">
                        <User size={16} />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest leading-none">Client Outstanding</p>
                          <p className="text-xs font-bold mt-1">Select Order to View</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={confirmAssignment} disabled={!assignData.truckId || !assignData.orderId || !assignData.routeId} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  {isDispatching ? <Loader2 className="animate-spin"/> : <MessageCircle size={20}/>} Confirm & Dispatch Driver
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Maintenance Input Modal */}
      {isMaintenanceModalOpen && selectedTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">Maintenance Log</h3>
                <button onClick={() => setIsMaintenanceModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full"><X size={20}/></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Reason for Maintenance</label>
                    <textarea 
                      className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 min-h-[100px]" 
                      placeholder="Describe the issue..."
                      value={maintenanceData.reason}
                      onChange={e => setMaintenanceData({...maintenanceData, reason: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Next Service Date</label>
                    <input 
                      type="date"
                      className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900" 
                      value={maintenanceData.nextServiceDate}
                      onChange={e => setMaintenanceData({...maintenanceData, nextServiceDate: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={submitMaintenance} 
                  disabled={!maintenanceData.reason || !maintenanceData.nextServiceDate}
                  className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                >
                  <Wrench size={20}/> Log Maintenance
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatMini: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => {
  const colors: Record<string, string> = { 
      blue: 'text-blue-600', 
      red: 'text-red-600', 
      indigo: 'text-indigo-600', 
      green: 'text-green-600' 
  };
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center sm:items-start">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xl font-black mt-1 ${colors[color]}`}>{value}</span>
    </div>
  );
};

const ComplianceBadge: React.FC<{ label: string, days: number, date?: string, onClick?: () => void }> = ({ label, days, date, onClick }) => {
    const isCritical = days <= 30;
    const isOverdue = days < 0;
    const isVerified = date && date !== 'N/A';

    return (
        <button 
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          className={`px-3 py-2 rounded-2xl text-[8px] font-black uppercase border flex flex-col items-start gap-1 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden ${
            isOverdue ? 'bg-red-50 text-red-600 border-red-100 shadow-lg shadow-red-100/30' :
            isCritical ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#F5F4F0]/50 text-slate-800 border-slate-200 shadow-sm'
        }`}>
            <div className="flex items-center gap-2 relative z-10">
                <div className="flex items-center gap-1 relative">
                   {isOverdue ? (
                     <AlertTriangle size={10} className="text-red-500 animate-bounce" />
                   ) : (
                     <Database size={10} className={`${isCritical ? 'text-amber-400' : 'text-blue-500'} group-hover:rotate-12 transition-transform`} />
                   )}
                   {isVerified && !isOverdue && (
                     <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse absolute -top-1 -right-1 border border-white" />
                   )}
                </div>
                <span className="tracking-tight">{label}: {isOverdue ? 'EXPIRED' : `${days}d`}</span>
                {isVerified && <CheckCircle2 size={8} className="text-emerald-500 ml-auto" />}
            </div>
            {isVerified && (
                <div className="flex items-center gap-1.5 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Calendar size={8} className="text-slate-400" />
                    <span className="text-[7px] text-slate-500 font-bold">
                        {new Date(date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            )}
            
            {/* Visual scanline effect for "Real-Time Sync" feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
        </button>
    );
};

const DossierStat: React.FC<{ label: string, value: string, icon: any, color: string }> = ({ label, value, icon: Icon, color }) => {
    const colors: Record<string, string> = { 
        blue: 'bg-blue-50 text-blue-600', 
        indigo: 'bg-indigo-50 text-indigo-600', 
        green: 'bg-green-50 text-green-600', 
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600'
    };
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
              <Icon size={20} />
           </div>
           <div>
              <p className="t-label">{label}</p>
              <p className="text-lg font-black text-slate-900">{value}</p>
           </div>
        </div>
    );
};

const DocCard: React.FC<{ label: string, expiry: string, type: string, onOpen?: () => void }> = ({ label, expiry, type, onOpen }) => (
    <div className="p-5 bg-[#F5F4F0] rounded-2xl border border-slate-100 flex items-center justify-between">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
             <ShieldCheck size={20} />
          </div>
          <div>
             <p className="text-xs font-black text-slate-900">{label}</p>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{type} • Exp: {expiry}</p>
          </div>
       </div>
       <button onClick={onOpen} className="text-blue-600 hover:scale-110 transition-transform"><Maximize2 size={16} /></button>
    </div>
);

const VaultModal: React.FC<{ truck: Truck, onClose: () => void, onUpdateTruck: (t: Truck) => void }> = ({ truck, onClose, onUpdateTruck }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<TruckDocument | null>(null);
    const [previewDoc, setPreviewDoc] = useState<TruckDocument | null>(null);

    const handleDownload = (doc: TruckDocument) => {
       const link = document.createElement('a');
       link.href = doc.fileUrl;
       link.download = doc.fileName || 'document.pdf';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
    };

    const handleSave = (type: string, number: string, expiry: string, attachments: { name: string, url: string }[], title: string, publishDate: string) => {
       const docs = [...(truck.documents || [])];
       
       const mainFile = attachments[0] || { name: 'attachment.pdf', url: '#' };

       if (selectedDoc) {
          const idx = docs.findIndex(d => d.id === selectedDoc.id);
          if (idx !== -1) {
             docs[idx] = {
                ...selectedDoc,
                type: type as any,
                documentNumber: number,
                expiryDate: expiry,
                fileName: mainFile.name,
                fileUrl: mainFile.url,
                title: title,
                issueDate: publishDate
             };
          }
       } else {
          const doc: TruckDocument = {
             id: `DOC-${Date.now()}`,
             type: type as any,
             fileName: mainFile.name,
             fileUrl: mainFile.url,
             expiryDate: expiry,
             uploadDate: new Date().toISOString().split('T')[0],
             documentNumber: number,
             title: title,
             issueDate: publishDate
          };
          docs.unshift(doc);
       }

       onUpdateTruck({
          ...truck,
          documents: docs,
          // Sync legacy flat fields
          rcExpiry: type === 'RC' ? expiry : truck.rcExpiry,
          insuranceExpiry: type === 'INSURANCE' ? expiry : truck.insuranceExpiry,
          fitnessExpiry: type === 'FITNESS' ? expiry : truck.fitnessExpiry,
          pollutionExpiry: type === 'PUC' ? expiry : truck.pollutionExpiry,
          permitExpiry: type === 'STATE_PERMIT' ? expiry : (truck as any).permitExpiry
       });
       setIsAddOpen(false);
       setSelectedDoc(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-md shadow-blue-500/20">
                           <ShieldCheck size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Compliance Operations Vault</h3>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{truck.truckNumber}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Active Sync</span>
                           </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-[#F5F4F0] hover:text-slate-900 transition-all shadow-sm"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                   {isAddOpen ? (
                      <div className="page-stack-lg">
                         <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{selectedDoc ? 'Edit Digital Asset' : 'Register New Asset'}</h4>
                            <button onClick={() => { setIsAddOpen(false); setSelectedDoc(null); }} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600">Back to Vault</button>
                         </div>
                         <DocumentAdditionForm 
                            initialDoc={selectedDoc || undefined} 
                            truckNumber={truck.truckNumber}
                            onSave={handleSave}
                         />
                      </div>
                   ) : (
                      <>
                        <div className="flex items-center justify-between">
                           <div>
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Registered Documents</h4>
                             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{truck.documents?.length || 0} Records in Container</p>
                           </div>
                           <button 
                             onClick={() => { setIsAddOpen(true); setSelectedDoc(null); }}
                             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 group"
                           >
                              <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Document
                           </button>
                        </div>

                        <div className="space-y-3">
                           {(truck.documents || []).map(doc => (
                              <div key={doc.id} className="p-4 bg-[#F5F4F0] border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-colors">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-blue-500 transition-colors">
                                       <FileText size={20} />
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">{doc.type}</span>
                                          <p className="text-xs font-black text-slate-900">{doc.title || doc.documentNumber || doc.fileName}</p>
                                       </div>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Expires: {doc.expiryDate || 'N/A'} • Ref: {doc.documentNumber || 'N/A'}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-1">
                                    <button 
                                       onClick={() => setPreviewDoc(doc)}
                                       className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                       title="Preview Document"
                                    >
                                       <Eye size={14} />
                                    </button>
                                    <button 
                                       onClick={() => { setSelectedDoc(doc); setIsAddOpen(true); }}
                                       className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all"
                                       title="Edit Document"
                                    >
                                       <Settings size={14} />
                                    </button>
                                    <button 
                                       onClick={() => handleDownload(doc)}
                                       className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                                       title="Download Document"
                                    >
                                       <Download size={14} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                           {(!truck.documents || truck.documents.length === 0) && (
                              <div className="py-20 text-center space-y-4">
                                 <div className="w-16 h-16 bg-[#F5F4F0] rounded-full flex items-center justify-center mx-auto text-slate-300">
                                    <FileText size={32} />
                                 </div>
                                 <p className="text-sm font-bold text-slate-400">Vault is empty. Upload compliance documents.</p>
                              </div>
                           )}
                        </div>
                      </>
                   )}
                </div>
            </div>

            {/* Document Preview Overlay */}
            {previewDoc && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">{previewDoc.title || previewDoc.fileName}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Digital Vault Preview • {truck.truckNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleDownload(previewDoc)}
                                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                                >
                                    <Download size={14} /> Download PDF
                                </button>
                                <button onClick={() => setPreviewDoc(null)} className="w-12 h-12 flex items-center justify-center bg-[#F5F4F0] text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 overflow-hidden relative">
                            {previewDoc.fileUrl.startsWith('data:image') ? (
                                <div className="w-full h-full p-10 flex items-center justify-center overflow-auto">
                                    <img src={previewDoc.fileUrl} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-xl shadow-slate-900/10" />
                                </div>
                            ) : previewDoc.fileUrl.startsWith('http') || previewDoc.fileUrl.startsWith('/') || previewDoc.fileUrl === '#' ? (
                                <iframe 
                                    src={previewDoc.fileUrl === '#' ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : previewDoc.fileUrl} 
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                    <FileText size={64} className="mb-4 opacity-20" />
                                    <p className="font-black text-xs uppercase tracking-widest">No visual preview available for this file type</p>
                                    <button 
                                        onClick={() => handleDownload(previewDoc)}
                                        className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                    >
                                        Download to View
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocumentAdditionForm: React.FC<{
    initialDoc?: TruckDocument;
    truckNumber: string;
    onSave: (type: string, number: string, expiry: string, attachments: { name: string, url: string }[], title: string, publishDate: string) => void;
}> = ({ onSave, initialDoc, truckNumber }) => {
    const [type, setType] = useState(initialDoc?.type || 'INSURANCE');
    const [title, setTitle] = useState(initialDoc?.title || '');
    const [number, setNumber] = useState(initialDoc?.documentNumber || '');
    const [expiry, setExpiry] = useState(initialDoc?.expiryDate || '');
    const [publishDate, setPublishDate] = useState(initialDoc?.issueDate || '');
    const [files, setFiles] = useState<{ name: string, url: string }[]>(
        initialDoc ? [{ name: initialDoc.fileName, url: initialDoc.fileUrl }] : []
    );
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        Array.from(selectedFiles).forEach((file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => [...prev, { name: file.name, url: reader.result as string }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="page-stack-lg">
            <div className="grid grid-cols-1 gap-4">
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Document Title</label>
                    <input 
                        className="w-full bg-[#F5F4F0] border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Commercial Fitness Certificate 2024"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Document Category</label>
                    <select 
                        className="w-full bg-[#F5F4F0] border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                        value={type}
                        onChange={e => setType(e.target.value as any)}
                    >
                        {['RC', 'INSURANCE', 'PUC', 'STATE_PERMIT', 'NATIONAL_PERMIT', 'FITNESS', 'ROAD_TAX', 'AUTHORIZATION', 'FASTAG', 'HAZMAT', 'TAX_INVOICE', 'DRIVER_LICENCE', 'EMI_DOCS', 'WARRANTY_CARD', 'WEIGHBRIDGE_RECEIPT', 'LOCAL_PERMIT', 'MAINTENANCE_LOG', 'OTHER'].map(t => (
                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Certificate/Policy ID</label>
                    <input 
                        className="w-full bg-[#F5F4F0] border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder="AA-100293-XP"
                        value={number}
                        onChange={e => setNumber(e.target.value)}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Date of Publishing</label>
                    <input 
                        type="date"
                        className="w-full bg-[#F5F4F0] border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                        value={publishDate}
                        onChange={e => setPublishDate(e.target.value)}
                    />
                </div>
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Expiry Date</label>
                    <input 
                        type="date"
                        className="w-full bg-[#F5F4F0] border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="t-label block">Attachments</label>
                
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,image/*"
                />

                <div className="grid grid-cols-2 gap-4">
                    {files.map((file, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl border-2 border-slate-100 overflow-hidden bg-[#F5F4F0] group hover:border-blue-200 transition-all shadow-sm">
                            {file.url.startsWith('data:image') ? (
                                <img src={file.url} alt="preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 mb-3 group-hover:text-blue-500 transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 truncate w-full text-center px-4">{file.name}</p>
                                </div>
                            )}
                            <button 
                                onClick={() => removeFile(idx)}
                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video border-3 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-[#F5F4F0] hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-3">
                            <Upload size={24} />
                        </div>
                        <p className="t-label group-hover:text-blue-600 relative z-10">Add Files</p>
                    </button>
                </div>
            </div>

            <button 
                disabled={files.length === 0}
                onClick={() => onSave(type, number, expiry, files, title, publishDate)}
                className="w-full bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 group mt-8"
            >
                <FileCheck size={20} className="group-hover:scale-110 transition-transform" />
                {initialDoc ? 'Confirm Security Update' : `Register ${files.length} Digital Asset${files.length !== 1 ? 's' : ''}`}
            </button>
        </div>
    );
};

const HealthRow: React.FC<{ label: string, status: string }> = ({ label, status }) => (
    <div className="flex items-center justify-between">
       <span className="text-xs font-bold text-slate-600">{label}</span>
       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
          status === 'GOOD' || status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
          status === 'CHECK' || status === 'WORN' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
       }`}>{status}</span>
    </div>
);

const HealthIndicator: React.FC<{ label: string, status: string }> = ({ label, status }) => {
    const getColors = () => {
        if (status === 'GOOD' || status === 'HEALTHY' || status === 'EXCELLENT') return 'bg-green-500';
        if (status === 'CHECK' || status === 'WORN' || status === 'WARNING') return 'bg-amber-500';
        return 'bg-red-500';
    };
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full ${getColors()}`} />
            <span className="text-[8px] font-black text-slate-400 uppercase">{label}</span>
        </div>
    );
};

const HealthUnit: React.FC<{ label: string, status: string, icon: any, id: string }> = ({ label, status, icon: Icon, id }) => {
    const scoreMap: Record<string, number> = {
        'EXCELLENT': 100,
        'GOOD': 85,
        'HEALTHY': 85,
        'WARNING': 60,
        'CHECK': 60,
        'WORN': 60,
        'CRITICAL': 30,
        'BREAKDOWN': 10
    };
    const score = scoreMap[status] ?? 85;
    const color = score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = score > 80 ? 'text-emerald-500' : score > 50 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="flex flex-col gap-1.5" id={`health-unit-${id}`}>
            <div className="flex items-center justify-between">
               <Icon size={10} className={textColor} />
               <span className="text-[7px] font-black text-slate-400 uppercase truncate ml-1">{label}</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
};

export default FleetView;
