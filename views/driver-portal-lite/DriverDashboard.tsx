import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  FileText,
  Fuel,
  Hammer,
  HeartPulse,
  History,
  IndianRupee,
  Info,
  LayoutGrid,
  Loader2,
  LogOut,
  Map as MapIcon,
  Maximize,
  Menu,
  MessageCircle,
  Moon,
  Navigation,
  Phone,
  QrCode,
  RotateCcw,
  Scan,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Truck as TruckIcon,
  Upload,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useDriverAuth } from '@/services/driverAuth/DriverAuthContext';
import {
  fetchMyOrders,
  acceptOrder,
  rejectOrder,
  pickupOrder,
  deliverOrder,
  fetchMyTruck,
  fetchMyEarnings,
  DriverApiError,
  type DriverTruck,
  type DriverSalary,
} from '@/services/driverApi';
import type { Order } from '@/types';
import { parseDieselBill } from '@/services/geminiService';
import { useToast } from '@/components/Toast';

type Tab = 'home' | 'routes' | 'dispatch' | 'wallet' | 'health' | 'additional' | 'support';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function complianceColor(days: number) {
  if (days < 0) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', label: 'EXPIRED', icon: AlertTriangle };
  if (days <= 30) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: `Exp in ${days}d`, icon: AlertTriangle };
  return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-emerald-600', label: 'Valid', icon: ShieldCheck };
}

// ─── sub-components ──────────────────────────────────────────────────────────

const NavBtn: React.FC<{ active: boolean; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; onClick: () => void; night?: boolean }> = ({ active, icon: Icon, label, onClick, night }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-full transition-all ${
      active
        ? night ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
        : night ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 3 : 2} />
    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

const MenuLink: React.FC<{ icon: React.ComponentType<{ size?: number }>; label: string; active: boolean; onClick: () => void; night: boolean }> = ({ icon: Icon, label, active, onClick, night }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
      active
        ? night ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-blue-600 text-white shadow-xl shadow-blue-100'
        : night ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-[#F5F4F0]'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const StatusPill: React.FC<{ label: string; value: string | number; unit: string; color: 'blue' | 'green' | 'amber' }> = ({ label, value, unit, color }) => {
  const colors = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500' };
  return (
    <div className="text-center p-3 rounded-2xl bg-[#F5F4F0]/50 border border-slate-100/10">
      <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{label}</p>
      <p className={`text-xl font-black tracking-tighter ${colors[color]}`}>{value}</p>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{unit}</p>
    </div>
  );
};

const HealthItem: React.FC<{ label: string; status: 'OPTIMAL' | 'GOOD' | 'WARNING' | 'CRITICAL'; value: string; icon: React.ComponentType<{ size?: number }>; night: boolean }> = ({ label, status, value, icon: Icon, night }) => {
  const colors = { OPTIMAL: 'text-emerald-500 bg-emerald-50', GOOD: 'text-blue-500 bg-blue-50', WARNING: 'text-amber-500 bg-amber-50', CRITICAL: 'text-red-500 bg-red-50' };
  return (
    <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${night ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${night ? 'bg-slate-900 text-slate-400' : colors[status]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-black">{label}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest ${night ? 'text-slate-500' : 'opacity-70'}`}>{status}</p>
        </div>
      </div>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
};

const DocLink: React.FC<{ icon: React.ComponentType<{ size?: number }>; label: string; status: string; statusClass: string }> = ({ icon: Icon, label, status, statusClass }) => (
  <div className="flex items-center justify-between p-4 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-3">
      <Icon size={18} className={statusClass} />
      <span className="text-xs font-black">{label}</span>
    </div>
    <span className={`text-[10px] font-black uppercase ${statusClass}`}>{status}</span>
  </div>
);

// ─── main component ───────────────────────────────────────────────────────────

const DriverDashboard: React.FC = () => {
  const { driver, logout } = useDriverAuth();
  const { toast, confirm: showConfirm } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [night, setNight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);

  // orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  // truck
  const [truck, setTruck] = useState<DriverTruck | null>(null);

  // earnings
  const [salaries, setSalaries] = useState<DriverSalary[]>([]);
  const [deliveredCount, setDeliveredCount] = useState(0);

  // attendance
  const [attendanceStatus, setAttendanceStatus] = useState<'NONE' | 'IN'>('NONE');
  const [punchingIn, setPunchingIn] = useState(false);
  const [punchTime, setPunchTime] = useState<string>('');

  // diesel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [dieselForm, setDieselForm] = useState({ pumpName: '', liters: 0, rate: 0, amount: 0 });
  const [dieselSubmitting, setDieselSubmitting] = useState(false);

  // ── derived ──
  const currentTrip = useMemo(
    () => orders.find(o => o.status === 'PICKED') || orders.find(o => o.status === 'ASSIGNED' && o.driverAcceptanceStatus === 'ACCEPTED'),
    [orders],
  );
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'ASSIGNED' && o.driverAcceptanceStatus === 'PENDING'), [orders]);
  const queuedTrips = useMemo(
    () => orders.filter(o => o.status === 'ASSIGNED' && o.driverAcceptanceStatus === 'ACCEPTED' && o.id !== currentTrip?.id),
    [orders, currentTrip],
  );
  const completedTrips = useMemo(() => orders.filter(o => ['DELIVERED', 'INVOICED', 'PAID'].includes(o.status)), [orders]);
  const totalEarned = useMemo(() => salaries.reduce((s, e) => s + (Number((e as any).netPayable) || Number(e.baseRate) + Number(e.bonus) - Number(e.deductions) - Number(e.advanceAdjusted)), 0), [salaries]);
  const isLimitExceeded = useMemo(() => currentTrip?.estimatedDiesel ? dieselForm.liters > currentTrip.estimatedDiesel : false, [dieselForm.liters, currentTrip]);

  // ── data loaders ──
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      setOrders(await fetchMyOrders());
    } catch (err) {
      setOrdersError(err instanceof DriverApiError ? err.message : 'Failed to load routes.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadTruck = useCallback(async () => {
    try { setTruck(await fetchMyTruck()); } catch { /* truck info is optional */ }
  }, []);

  const loadEarnings = useCallback(async () => {
    try {
      const data = await fetchMyEarnings();
      setSalaries(data.salaries);
      setDeliveredCount(data.deliveredCount);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadOrders(); loadTruck(); loadEarnings(); }, [loadOrders, loadTruck, loadEarnings]);

  // ── order actions ──
  const handleAccept = async (id: string) => {
    setActingOnId(id);
    try {
      const updated = await acceptOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    } catch (err) {
      setOrdersError(err instanceof DriverApiError ? err.message : 'Failed to accept route.');
    } finally { setActingOnId(null); }
  };

  const handleReject = async (id: string) => {
    setActingOnId(id);
    try {
      await rejectOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setOrdersError(err instanceof DriverApiError ? err.message : 'Failed to reject route.');
    } finally { setActingOnId(null); }
  };

  const handlePickup = async () => {
    if (!currentTrip) return;
    setActingOnId(currentTrip.id);
    try {
      const updated = await pickupOrder(currentTrip.id);
      setOrders(prev => prev.map(o => o.id === currentTrip.id ? updated : o));
    } catch (err) {
      setOrdersError(err instanceof DriverApiError ? err.message : 'Failed to update pickup status.');
    } finally { setActingOnId(null); }
  };

  const handleDeliver = async () => {
    if (!currentTrip) return;
    setActingOnId(currentTrip.id);
    try {
      const updated = await deliverOrder(currentTrip.id);
      setOrders(prev => prev.map(o => o.id === currentTrip.id ? updated : o));
      setShowPodModal(false);
      await loadTruck();
      await loadEarnings();
    } catch (err) {
      setOrdersError(err instanceof DriverApiError ? err.message : 'Failed to record delivery.');
    } finally { setActingOnId(null); }
  };

  // ── SOS ──
  const handleSOS = async () => {
    const ok = await showConfirm({ title: 'Emergency', message: 'SEND EMERGENCY ALERT TO CONTROL TOWER? GPS Coordinates will be sent immediately.', confirmLabel: 'Send SOS', danger: true });
    if (ok) toast('SOS SENT. Dispatcher notified. Help is on the way.', 'error');
  };

  // ── diesel bill scan ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const data = await parseDieselBill(base64);
          if (data) {
            setDieselForm({
              pumpName: data['Petrol Pump Name'] || '',
              liters: parseFloat(data['Liters']) || 0,
              rate: parseFloat(data['Rate per Liter']) || 0,
              amount: parseFloat(data['Total Amount']) || 0,
            });
          } else {
            setScanError('Could not read the bill. Please enter details manually.');
          }
        } catch { setScanError('Could not read the bill. Please enter details manually.'); }
        setScanning(false);
      };
      reader.onerror = () => { setScanError('Could not open file.'); setScanning(false); };
      reader.readAsDataURL(file);
    } catch { setScanError('Could not open file.'); setScanning(false); }
  };

  const handleDieselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDieselSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setDieselSubmitting(false);
    setDieselForm({ pumpName: '', liters: 0, rate: 0, amount: 0 });
    toast('Fuel record submitted. Awaiting admin verification.', 'success');
    setActiveTab('home');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const bg = night ? 'bg-slate-950 text-slate-100' : 'bg-[#F5F4F0] text-slate-900';
  const card = night ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${bg}`}>
      <div className="max-w-md mx-auto pb-32">

        {/* ── TOP BAR ── */}
        <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md border-b transition-all ${night ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className={`p-2 rounded-xl transition-all ${night ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-[#F5F4F0] text-slate-500'}`}>
              <Menu size={24} />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">FA</div>
            <div>
              <h2 className="font-black text-sm tracking-tight">{driver?.name || 'Driver Portal'}</h2>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em]">Operational Console</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setNight(!night)} className={`p-2 rounded-xl border transition-all ${night ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}`}>
              {night ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleSOS} className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 animate-pulse">
              <AlertOctagon size={18} />
            </button>
          </div>
        </div>

        {/* ── PENDING ORDERS BANNER ── */}
        {pendingOrders.length > 0 && (
          <div className={`mx-6 mt-4 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 flex items-center justify-between ${night ? 'bg-blue-900/20 border-blue-800' : ''}`}>
            <div>
              <p className="text-xs font-black text-blue-800">New Route Assignment!</p>
              <p className="text-[10px] font-bold text-blue-600">{pendingOrders.length} trip{pendingOrders.length > 1 ? 's' : ''} awaiting your response</p>
            </div>
            <button onClick={() => setActiveTab('routes')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase">
              View
            </button>
          </div>
        )}

        {/* ── TAB CONTENT ── */}
        <div className="p-6 space-y-6">

          {/* ══ HOME ══ */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Identity Card */}
              <div className={`p-6 rounded-2xl border-2 shadow-xl relative overflow-hidden transition-all ${card}`}>
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><TruckIcon size={120} /></div>
                <div className="relative z-10 flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 border-2 border-blue-500 p-0.5 shadow-xl">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver?.name || 'driver'}`}
                      className="w-full h-full rounded-[1.2rem] object-cover"
                      alt={driver?.name}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{driver?.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest ${night ? 'text-blue-400' : 'text-blue-600'}`}>{driver?.phoneNumber}</p>
                    {truck && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{truck.plateNumber}</p>}
                  </div>
                  <div className="ml-auto">
                    {attendanceStatus === 'NONE' ? (
                      <button
                        onClick={() => {
                          setPunchingIn(true);
                          setTimeout(() => {
                            setAttendanceStatus('IN');
                            setPunchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                            setPunchingIn(false);
                          }, 1500);
                        }}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                          {punchingIn ? <RotateCcw size={20} className="animate-spin" /> : <Zap size={20} />}
                        </div>
                        <span className="text-[9px] font-black uppercase">Punch In</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle2 size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase text-green-500">{punchTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <StatusPill label="Trips Done" value={deliveredCount} unit="trips" color="blue" />
                  <StatusPill label="Driver Score" value={truck ? truck.driverScore : '—'} unit="pts" color="green" />
                  <StatusPill label="Mileage" value={truck ? `${truck.mileage}` : '—'} unit="km/l" color="amber" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${card}`}>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Active Since</p>
                  <p className="text-xl font-black">{attendanceStatus === 'IN' ? punchTime : '—'}</p>
                </div>
                <div className={`p-5 rounded-2xl border flex flex-col gap-2 shadow-sm ${card}`}>
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><IndianRupee size={20} /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total Earned</p>
                  <p className="text-xl font-black">₹{totalEarned.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Active Trip Summary */}
              {currentTrip ? (
                <div className={`p-5 rounded-2xl border-2 border-blue-100 flex items-center gap-4 ${night ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50'}`}>
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                    <Navigation size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-blue-800">Active Trip — Order #{currentTrip.orderNumber ?? '—'}</p>
                    <p className="text-[10px] font-bold text-blue-600 truncate">{currentTrip.projectSite}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[8px] font-black rounded-full uppercase ${currentTrip.status === 'PICKED' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {currentTrip.status}
                    </span>
                  </div>
                  <button onClick={() => setActiveTab('routes')} className="shrink-0 p-2 bg-blue-600 text-white rounded-xl">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <div className={`p-5 rounded-2xl border-2 border-dashed flex items-center gap-4 ${night ? 'border-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="w-12 h-12 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center shrink-0">
                    <TruckIcon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">No active trip</p>
                    <p className="text-[10px] font-bold text-slate-300">Check Routes for new assignments</p>
                  </div>
                </div>
              )}

              {/* Truck maintenance alert */}
              {truck && truck.odometerAtLastService && truck.serviceIntervalKm && (
                (() => {
                  const kmDriven = truck.currentOdometer - truck.odometerAtLastService;
                  const remaining = truck.serviceIntervalKm - kmDriven;
                  if (remaining < 1000) return (
                    <div className={`p-5 rounded-2xl border-2 border-amber-100 bg-amber-50/30 flex items-center gap-4 ${night ? 'border-amber-900/30 bg-amber-900/10' : ''}`}>
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-900">Maintenance Alert</p>
                        <p className="text-[10px] font-bold text-amber-700 leading-tight">Service due in {remaining.toLocaleString()} km. Please schedule.</p>
                      </div>
                    </div>
                  );
                  return null;
                })()
              )}

              <button onClick={() => setActiveTab('routes')} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                View My Routes <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ══ ROUTES ══ */}
          {activeTab === 'routes' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {ordersError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600">{ordersError}</div>
              )}

              {/* Pending acceptance */}
              {pendingOrders.length > 0 && (
                <div className="space-y-4">
                  <h3 className={`text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 px-2 ${night ? 'text-blue-400' : 'text-blue-600'}`}>
                    <Zap size={16} /> New Assignments ({pendingOrders.length})
                  </h3>
                  {pendingOrders.map(order => (
                    <div key={order.id} className={`rounded-2xl border-2 overflow-hidden shadow-xl ${night ? 'bg-slate-900 border-blue-900' : 'bg-white border-blue-100'}`}>
                      <div className="p-5 bg-blue-600 text-white">
                        <p className="text-[9px] font-black uppercase opacity-70">New Assignment — Order #{order.orderNumber ?? '—'}</p>
                        <h4 className="text-lg font-black mt-1">{order.projectSite}</h4>
                        <p className="text-[10px] opacity-70 mt-0.5">{order.clientName} · {order.quantity} MT</p>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><p className="text-[9px] text-slate-400 uppercase font-black">Pickup</p><p className="font-black mt-0.5">{order.pickupDate}</p></div>
                          <div><p className="text-[9px] text-slate-400 uppercase font-black">Delivery</p><p className="font-black mt-0.5">{order.deliveryDate}</p></div>
                          {order.estimatedDiesel && <div><p className="text-[9px] text-slate-400 uppercase font-black">Diesel Cap</p><p className="font-black mt-0.5">{order.estimatedDiesel} L</p></div>}
                          {order.totalKm && <div><p className="text-[9px] text-slate-400 uppercase font-black">Distance</p><p className="font-black mt-0.5">{order.totalKm} km</p></div>}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={actingOnId === order.id}
                            className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {actingOnId === order.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
                          </button>
                          <button
                            onClick={() => handleAccept(order.id)}
                            disabled={actingOnId === order.id}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {actingOnId === order.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Current active trip */}
              <div className="space-y-4">
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 px-2 ${night ? 'text-blue-400' : 'text-blue-600'}`}>
                  <Navigation size={16} /> On Going Route
                  {currentTrip && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded uppercase animate-pulse ml-auto">Live</span>}
                </h3>
                {currentTrip ? (
                  <div className={`rounded-2xl border-2 overflow-hidden shadow-xl ${night ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'}`}>
                    <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-70">Current Trip</p>
                        <h4 className="text-xl font-black">Order #{currentTrip.orderNumber ?? '—'}</h4>
                        <p className="text-[10px] opacity-70 mt-0.5">{currentTrip.clientName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.open(`tel:${currentTrip.driverPhone || ''}`)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><Phone size={18} /></button>
                        <button onClick={() => setShowQr(true)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"><QrCode size={18} /></button>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Route timeline */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <div className={`w-3 h-3 rounded-full border-2 ${currentTrip.status === 'ASSIGNED' ? 'border-blue-600 bg-white' : 'bg-blue-600'}`} />
                          <div className={`w-0.5 flex-1 ${currentTrip.status === 'PICKED' ? 'bg-blue-600' : 'bg-slate-200'} rounded-full my-1`} />
                          <div className={`w-3 h-3 rounded-full border-2 ${currentTrip.status === 'PICKED' ? 'border-blue-600 bg-white' : 'bg-slate-200'}`} />
                        </div>
                        <div className="flex-1 space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Pickup</p>
                              <p className="text-sm font-black leading-tight">Plant / Loading Point</p>
                            </div>
                            {currentTrip.status !== 'ASSIGNED' && <CheckCircle2 size={16} className="text-green-500" />}
                          </div>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-400">Drop-off</p>
                              <p className="text-sm font-black leading-tight">{currentTrip.projectSite}</p>
                            </div>
                            <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(currentTrip.projectSite)}`)} className="text-blue-600">
                              <Navigation size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Trip details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-xl border ${night ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F4F0] border-slate-100'}`}>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Load</p>
                          <p className="text-sm font-black">{currentTrip.quantity} MT</p>
                        </div>
                        {currentTrip.estimatedDiesel && (
                          <div className={`p-3 rounded-xl border ${night ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F4F0] border-slate-100'}`}>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Diesel Cap</p>
                            <p className="text-sm font-black">{currentTrip.estimatedDiesel} L</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handlePickup}
                          disabled={currentTrip.status !== 'ASSIGNED' || actingOnId === currentTrip.id}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${currentTrip.status === 'ASSIGNED' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {actingOnId === currentTrip.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Pick Up
                        </button>
                        <button
                          onClick={() => setShowPodModal(true)}
                          disabled={currentTrip.status !== 'PICKED'}
                          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${currentTrip.status === 'PICKED' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <ShieldCheck size={14} /> Deliver
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => toast('Hazard reported to control tower.', 'warning')} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase border border-red-100">
                          Report Hazard
                        </button>
                        <button onClick={handleSOS} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">
                          SOS Emergency
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-2xl border-2 border-dashed ${night ? 'border-slate-800' : 'border-slate-200 bg-[#F5F4F0]'}`}>
                    {ordersLoading ? (
                      <Loader2 size={24} className="text-blue-600 animate-spin mx-auto" />
                    ) : (
                      <p className="text-xs font-bold text-slate-400 uppercase">No active route</p>
                    )}
                  </div>
                )}
              </div>

              {/* Queued accepted trips */}
              {queuedTrips.length > 0 && (
                <div className="space-y-4">
                  <h3 className={`text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 px-2 ${night ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    <Briefcase size={16} /> Queued Trips ({queuedTrips.length})
                  </h3>
                  {queuedTrips.map(trip => (
                    <div key={trip.id} className={`p-5 rounded-2xl border-2 shadow-lg ${night ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-50'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded uppercase mr-2">Accepted</span>
                          <p className="text-sm font-black mt-1">{trip.projectSite}</p>
                          <p className="text-[10px] text-slate-400">{trip.clientName}</p>
                        </div>
                        <p className="text-sm font-black">{trip.quantity} MT</p>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>Pickup: {trip.pickupDate}</span>
                        {trip.totalKm && <span>{trip.totalKm} km</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed trips history */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-2">
                  <History size={16} /> Completed Routes
                </h3>
                {completedTrips.length > 0 ? (
                  <div className="space-y-3">
                    {completedTrips.slice(0, 5).map(trip => (
                      <div key={trip.id} className={`p-5 rounded-2xl border flex items-center justify-between ${night ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black">{trip.projectSite}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{trip.deliveryDate} · {trip.quantity} MT</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${trip.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {trip.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center rounded-2xl border ${night ? 'border-slate-800' : 'border-slate-100 bg-[#F5F4F0]'}`}>
                    <p className="text-xs font-bold text-slate-400 uppercase">No history yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ DISPATCH / DIESEL ══ */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className={`p-8 rounded-2xl border-2 shadow-xl ${card}`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black">Diesel Management</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${night ? 'text-blue-400' : 'text-blue-500'}`}>Smart Log & AI Extraction</p>
                  </div>
                  {currentTrip?.estimatedDiesel && (
                    <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 text-[10px] font-black uppercase">
                      Cap: {currentTrip.estimatedDiesel}L
                    </div>
                  )}
                </div>

                <form onSubmit={handleDieselSubmit} className="space-y-6">
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                    className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${scanning ? 'bg-slate-100' : 'bg-blue-50/20 border-blue-200 hover:bg-blue-50'}`}
                  >
                    {scanning ? (
                      <>
                        <Loader2 size={40} className="text-blue-600 animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">AI Scanning...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600">
                          <Sparkles size={32} />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-black block">Scan Fuel Bill</span>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ${night ? 'text-blue-400' : 'text-blue-500'}`}>AI Auto-Fill Active</span>
                        </div>
                      </>
                    )}
                  </button>

                  {scanError && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">{scanError}</div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Petrol Pump / Vendor</label>
                      <input
                        type="text"
                        className={`w-full px-6 py-4 rounded-2xl font-bold outline-none transition-all border ${night ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F5F4F0] border-slate-200 focus:border-blue-500'}`}
                        placeholder="e.g. Indian Oil Corporation"
                        value={dieselForm.pumpName}
                        onChange={e => setDieselForm({ ...dieselForm, pumpName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Liters</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            className={`w-full px-6 py-4 rounded-2xl font-black outline-none border ${isLimitExceeded ? 'bg-red-50 border-red-300 text-red-600' : night ? 'bg-slate-950 border-slate-800 text-white' : 'bg-[#F5F4F0] border-slate-200'}`}
                            value={dieselForm.liters || ''}
                            onChange={e => setDieselForm({ ...dieselForm, liters: Number(e.target.value) })}
                            required
                          />
                          {isLimitExceeded && <AlertTriangle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total ₹</label>
                        <input
                          type="number"
                          className={`w-full px-6 py-4 rounded-2xl font-black outline-none border ${night ? 'bg-slate-950 border-slate-800 text-white text-blue-400' : 'bg-[#F5F4F0] border-slate-200 text-blue-600'}`}
                          value={dieselForm.amount || ''}
                          onChange={e => setDieselForm({ ...dieselForm, amount: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {isLimitExceeded && (
                    <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="text-red-600 shrink-0" size={20} />
                      <div>
                        <p className="text-xs font-black text-red-900 uppercase">Limit Flagged</p>
                        <p className="text-[10px] font-bold text-red-700 leading-tight mt-1">
                          Exceeds {currentTrip?.estimatedDiesel}L cap. Admin will be notified.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={dieselSubmitting}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {dieselSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    Submit Fuel Record
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══ WALLET ══ */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className="p-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><IndianRupee size={160} /></div>
                <div className="relative z-10 space-y-10">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Total Earnings</p>
                    <h4 className="text-5xl font-black tracking-tighter">₹{totalEarned.toLocaleString('en-IN')}</h4>
                    <p className="text-[10px] font-bold mt-1 text-blue-200">{deliveredCount} trips completed</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all">Withdraw</button>
                    <button className="flex-1 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md">Ledger</button>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-2xl border-2 transition-all ${card}`}>
                <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${night ? '' : 'text-slate-800'}`}>
                  <History size={18} className="text-blue-500" /> Salary Records
                </h3>
                {salaries.length > 0 ? (
                  <div className="space-y-4">
                    {salaries.map(sal => {
                      const net = Number((sal as any).netPayable) || (Number(sal.baseRate) + Number(sal.bonus) - Number(sal.deductions) - Number(sal.advanceAdjusted));
                      return (
                        <div key={sal.id} className={`flex items-center justify-between p-4 rounded-2xl border ${night ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F4F0] border-slate-100'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                              <IndianRupee size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black">{sal.month}</p>
                              <p className="text-[10px] font-bold text-slate-400">{sal.salaryType}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-green-600">+₹{net.toLocaleString('en-IN')}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">No salary records yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TRUCK HEALTH ══ */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {truck ? (
                <>
                  {/* Truck Identity */}
                  <div className={`p-8 rounded-2xl border-2 shadow-xl relative overflow-hidden ${card}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><TruckIcon size={120} /></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                          <TruckIcon size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black">{truck.plateNumber}</h3>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${night ? 'text-blue-400' : 'text-blue-500'}`}>{truck.name}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</p>
                          <div className={`text-2xl font-black ${truck.driverScore >= 80 ? 'text-emerald-500' : truck.driverScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {truck.driverScore}<span className="text-xs">/100</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-2xl border ${night ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F4F0] border-slate-100'}`}>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Current ODO</p>
                          <p className="text-sm font-black">{truck.currentOdometer.toLocaleString()} KM</p>
                        </div>
                        {truck.odometerAtLastService && truck.serviceIntervalKm && (
                          <div className={`p-4 rounded-2xl border ${night ? 'bg-slate-800 border-slate-700' : 'bg-[#F5F4F0] border-slate-100'}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Next Service</p>
                            <p className={`text-sm font-black ${(truck.currentOdometer - truck.odometerAtLastService) > truck.serviceIntervalKm * 0.9 ? 'text-amber-500' : ''}`}>
                              {Math.max(0, truck.serviceIntervalKm - (truck.currentOdometer - truck.odometerAtLastService)).toLocaleString()} KM
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System checks */}
                  <div className={`p-8 rounded-2xl border-2 ${card}`}>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Zap size={18} className="text-blue-500" /> System Integrity
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <HealthItem label="Engine Performance" status="OPTIMAL" value="88%" icon={Zap} night={night} />
                      <HealthItem label="Braking System" status="GOOD" value="92%" icon={CircleDashed} night={night} />
                      <HealthItem label="Transmission" status="OPTIMAL" value="95%" icon={RotateCcw} night={night} />
                      <HealthItem label="Fuel Efficiency" status={truck.mileage >= 4 ? 'GOOD' : 'WARNING'} value={`${truck.mileage} km/L`} icon={Fuel} night={night} />
                    </div>
                  </div>

                  {/* Compliance vault */}
                  <div className={`p-8 rounded-2xl border-2 ${card}`}>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <FileText size={18} className="text-blue-500" /> Compliance Vault
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Insurance Policy', expiry: truck.insuranceExpiry },
                        { label: 'Fitness Certificate', expiry: truck.fitnessExpiry },
                        { label: 'Permit', expiry: truck.permitExpiry },
                        { label: 'PUC / Pollution', expiry: truck.pollutionExpiry },
                        { label: 'RC Renewal', expiry: truck.rcExpiry },
                      ].map(({ label, expiry }) => {
                        const { bg, border, text, label: statusLabel, icon: StatusIcon } = complianceColor(daysUntil(expiry));
                        return (
                          <div key={label} className={`flex items-center justify-between p-4 rounded-2xl border ${bg} ${border}`}>
                            <div className="flex items-center gap-3">
                              <StatusIcon size={18} className={text} />
                              <div>
                                <span className="text-xs font-black">{label}</span>
                                {expiry && <p className="text-[9px] text-slate-400 font-bold">{expiry}</p>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase ${text}`}>{statusLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`p-12 rounded-2xl border-2 border-dashed text-center ${night ? 'border-slate-800' : 'border-slate-200'}`}>
                  <TruckIcon size={40} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase">No truck assigned to active trip</p>
                  <p className="text-[10px] text-slate-300 mt-1">Accept a route to see truck health data</p>
                </div>
              )}
            </div>
          )}

          {/* ══ ADDITIONAL ══ */}
          {activeTab === 'additional' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className={`p-8 rounded-2xl border-2 ${card}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Additional Services</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${night ? 'text-indigo-400' : 'text-indigo-500'}`}>Extended Driver Tools</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: ScrollText, label: 'Training Modules', sub: 'Safety & Compliance', color: 'bg-amber-100 text-amber-600' },
                    { icon: ShieldCheck, label: 'Insurance Claims', sub: 'Self-Service Portal', color: 'bg-emerald-100 text-emerald-600' },
                    { icon: History, label: 'Attendance Logs', sub: 'Monthly Summary', color: 'bg-blue-100 text-blue-600' },
                    { icon: FileText, label: 'Trip Reports', sub: 'Download PDF', color: 'bg-purple-100 text-purple-600' },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <button
                      key={label}
                      onClick={() => toast(`${label} — Coming soon.`, 'info')}
                      className={`p-6 rounded-2xl border flex items-center gap-4 text-left transition-all hover:shadow-md ${night ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-[#F5F4F0] border-slate-100 hover:bg-white'}`}
                    >
                      <div className={`w-12 h-12 ${color} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black">{label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-8 rounded-2xl border-2 ${card}`}>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6">Announcements</h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border ${night ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50/30 border-blue-100/20'}`}>
                    <p className="text-xs font-black text-blue-600 mb-1">Performance Bonus Plan</p>
                    <p className="text-[10px] font-bold text-slate-500 leading-tight">Top 10 drivers get ₹5,000 monthly bonus. Check your rank on the Home screen.</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${night ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50/30 border-amber-100/20'}`}>
                    <p className="text-xs font-black text-amber-600 mb-1">Fuel Log Submission</p>
                    <p className="text-[10px] font-bold text-slate-500 leading-tight">All fuel bills must be submitted within 24h of refuelling using the Diesel tab.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SUPPORT ══ */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className={`p-10 rounded-2xl border-2 text-center ${card}`}>
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Phone size={40} />
                </div>
                <h3 className="text-2xl font-black">Emergency Help Desk</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">24/7 line to FlyAsh Logistics Command Center for road-side assistance, tyre changes, or medical emergencies.</p>
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button onClick={() => window.open('tel:1800123456')} className="py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
                    <Phone size={18} /> Call Support
                  </button>
                  <button onClick={() => window.open('https://wa.me/919876543210')} className="py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> WhatsApp
                  </button>
                </div>
              </div>

              {truck && (
                <div className={`p-8 rounded-2xl border-2 ${card}`}>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">Asset Documents</h3>
                  <div className="space-y-3">
                    <DocLink icon={FileText} label="Truck Registration (RC)" status={daysUntil(truck.rcExpiry) < 0 ? 'EXPIRED' : 'Valid'} statusClass={daysUntil(truck.rcExpiry) < 30 ? 'text-amber-500' : 'text-emerald-500'} />
                    <DocLink icon={ShieldCheck} label="Insurance Policy" status={`Exp: ${truck.insuranceExpiry}`} statusClass={daysUntil(truck.insuranceExpiry) < 30 ? 'text-amber-500' : 'text-emerald-500'} />
                    <DocLink icon={Hammer} label="Fitness Certificate" status={`Exp: ${truck.fitnessExpiry}`} statusClass={daysUntil(truck.fitnessExpiry) < 30 ? 'text-amber-500' : 'text-emerald-500'} />
                  </div>
                </div>
              )}

              <div className={`p-8 rounded-2xl border-2 ${card}`}>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button onClick={handleSOS} className="w-full flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-left hover:bg-red-100 transition-all">
                    <AlertOctagon size={20} className="text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-red-700">SOS Emergency Alert</p>
                      <p className="text-[10px] font-bold text-red-500">Notify control tower with GPS location</p>
                    </div>
                  </button>
                  <button onClick={() => toast('Breakdown reported. A mechanic will be dispatched shortly.', 'warning')} className="w-full flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-all">
                    <Hammer size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-700">Report Breakdown</p>
                      <p className="text-[10px] font-bold text-amber-500">Mechanical help & tow service</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM NAV ── */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t z-50 flex items-center justify-center backdrop-blur-xl ${night ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
          <div className={`flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl ${night ? 'bg-slate-900 border border-slate-800' : 'bg-[#F5F4F0]'}`}>
            <NavBtn active={activeTab === 'home'} icon={Maximize} label="Home" onClick={() => setActiveTab('home')} night={night} />
            <NavBtn active={activeTab === 'routes'} icon={Navigation} label="Routes" onClick={() => setActiveTab('routes')} night={night} />
            <NavBtn active={activeTab === 'dispatch'} icon={Fuel} label="Diesel" onClick={() => setActiveTab('dispatch')} night={night} />
            <NavBtn active={activeTab === 'wallet'} icon={Wallet} label="Earn" onClick={() => setActiveTab('wallet')} night={night} />
            <NavBtn active={activeTab === 'health'} icon={HeartPulse} label="Health" onClick={() => setActiveTab('health')} night={night} />
          </div>
        </div>

        {/* ── QR MODAL ── */}
        {showQr && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Gate Pass QR</h3>
                <button onClick={() => setShowQr(false)} className="p-2 hover:bg-[#F5F4F0] rounded-full transition-all"><X size={24} /></button>
              </div>
              <div className="p-6 bg-[#F5F4F0] rounded-2xl flex items-center justify-center">
                <QrCode size={200} className="text-slate-900 opacity-80" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-blue-600">Scan at Entry Gate</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Order #{currentTrip?.orderNumber ?? '—'} · {currentTrip?.projectSite}</p>
              </div>
              <button onClick={() => setShowQr(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Done</button>
            </div>
          </div>
        )}

        {/* ── POD DELIVERY MODAL ── */}
        {showPodModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[4rem] p-10 text-center space-y-8 animate-in slide-in-from-bottom-10 duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black">Electronic POD</h3>
                <p className="text-slate-500 text-sm mt-2">Confirm delivery of Order #{currentTrip?.orderNumber ?? '—'} to {currentTrip?.projectSite}.</p>
              </div>
              <div className="space-y-4">
                <button className="w-full py-5 bg-[#F5F4F0] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 group hover:bg-blue-50 transition-all">
                  <Camera size={24} className="text-slate-400 group-hover:text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capture Signed Challan</span>
                </button>
                <div className="h-24 bg-[#F5F4F0] rounded-2xl border-2 border-slate-100 flex items-center justify-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Signature Area</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPodModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliver}
                  disabled={actingOnId === currentTrip?.id}
                  className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {actingOnId === currentTrip?.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SIDE MENU DRAWER ── */}
        {menuOpen && (
          <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
            <div onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className={`relative w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 ${night ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
              <div className="p-8 pb-6 border-b border-slate-100/10 mb-6 mt-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">FA</div>
                  <button onClick={() => setMenuOpen(false)} className={`p-2 rounded-xl transition-all ${night ? 'bg-slate-800 text-slate-400' : 'bg-[#F5F4F0] text-slate-400'}`}><X size={20} /></button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-500 p-0.5 shadow-xl">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver?.name || 'driver'}`} className="w-full h-full rounded-[1.2rem] object-cover" alt={driver?.name} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">{driver?.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${night ? 'text-blue-400' : 'text-blue-500'}`}>{driver?.phoneNumber}</p>
                    {truck && <p className="text-[9px] text-slate-400 font-bold mt-0.5">{truck.plateNumber}</p>}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-2 overflow-y-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Main Menu</p>
                <MenuLink icon={Maximize} label="Dashboard" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={Navigation} label="Route Map" active={activeTab === 'routes'} onClick={() => { setActiveTab('routes'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={Fuel} label="Fleet & Diesel" active={activeTab === 'dispatch'} onClick={() => { setActiveTab('dispatch'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={Wallet} label="Earnings" active={activeTab === 'wallet'} onClick={() => { setActiveTab('wallet'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={HeartPulse} label="Truck Health" active={activeTab === 'health'} onClick={() => { setActiveTab('health'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={LayoutGrid} label="More Services" active={activeTab === 'additional'} onClick={() => { setActiveTab('additional'); setMenuOpen(false); }} night={night} />
                <MenuLink icon={Info} label="Emergency Support" active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setMenuOpen(false); }} night={night} />

                <div className="pt-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">System</p>
                  <MenuLink icon={Settings} label="App Settings" active={false} onClick={() => { toast('Settings coming soon.', 'info'); setMenuOpen(false); }} night={night} />
                  <MenuLink icon={LogOut} label="Log Out" active={false} onClick={async () => { const ok = await showConfirm({ message: 'Log out of Driver Portal?', confirmLabel: 'Log Out' }); if (ok) logout(); }} night={night} />
                </div>
              </div>

              <div className="p-8 border-t border-slate-100/10">
                <div className={`p-4 rounded-2xl flex items-center gap-3 ${night ? 'bg-slate-900' : 'bg-[#F5F4F0]'}`}>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase">Verified Identity</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Terminal Pass Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
