
import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line,
} from 'recharts';
import {
  Truck, IndianRupee, TrendingUp, TrendingDown, Package,
  Activity, Zap, Building2, Hammer, UserCheck,
  FileWarning, ShieldCheck, ShieldAlert, Calculator, Wrench, ChevronRight, Clock,
} from 'lucide-react';
import { getFinancialInsights } from '../services/geminiService';
import { Order, Expense, TripStatus, Truck as TruckType, TruckEMI, MaintenanceExpense, Invoice, DriverSalary, InvoiceStatus } from '../types';
import { safeStorage } from '@/lib/storage';

interface DashboardProps {
  orders: Order[];
  expenses: Expense[];
  fleet: TruckType[];
  emis: TruckEMI[];
  maintenance: MaintenanceExpense[];
  invoices: Invoice[];
  salaries: DriverSalary[];
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  orders, expenses, fleet, emis, maintenance, invoices, salaries, setActiveTab,
}) => {
  const [aiInsights, setAiInsights] = useState<string>('Analyzing your operations...');
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const totals = useMemo(() => {
    const validOrders = (orders || []).filter(o => o && typeof o.quantity === 'number' && typeof o.ratePerMT === 'number');
    const validExpenses = (expenses || []).filter(e => e && typeof e.amount === 'number');
    const rev = validOrders.reduce((acc, o) => acc + o.quantity * o.ratePerMT, 0);
    const exp = validExpenses.reduce((acc, e) => acc + e.amount, 0);
    const payload = validOrders.reduce((acc, o) => acc + o.quantity, 0);
    return { rev, exp, profit: rev - exp, payload };
  }, [orders, expenses]);

  const activeTripsCount = (orders || []).filter(o => o && [TripStatus.ASSIGNED, TripStatus.PICKED].includes(o.status)).length;

  const compliance = useMemo(() => {
    const today = new Date();
    const alertList = (fleet || []).flatMap(t => {
      const docs = [
        { type: 'Insurance', date: t.insuranceExpiry ? new Date(t.insuranceExpiry) : null },
        { type: 'Fitness',   date: t.fitnessExpiry   ? new Date(t.fitnessExpiry)   : null },
        { type: 'Pollution', date: t.pollutionExpiry  ? new Date(t.pollutionExpiry) : null },
        { type: 'Permit',    date: t.permitExpiry     ? new Date(t.permitExpiry)    : null },
      ];
      return docs.map(d => ({
        truck: t.truckNumber || 'N/A',
        doc: d.type,
        days: d.date && !isNaN(d.date.getTime())
          ? Math.ceil((d.date.getTime() - today.getTime()) / 86400000)
          : 0,
      }));
    });
    const expired  = alertList.filter(a => a.days < 0);
    const critical = alertList.filter(a => a.days >= 0 && a.days <= 15);
    const serviceDue = (fleet || []).filter(t => {
      if (!t.odometerAtLastService || !t.serviceIntervalKm) return false;
      const last = typeof t.odometerAtLastService === 'string' ? parseFloat(t.odometerAtLastService) : t.odometerAtLastService;
      return (last + t.serviceIntervalKm) - t.currentOdometer < 500 && (last + t.serviceIntervalKm) - t.currentOdometer > 0;
    }).map(t => ({ truck: t.truckNumber || 'N/A', doc: 'SERVICE DUE', days: 0 }));
    return { expired, critical: [...critical, ...serviceDue] };
  }, [fleet]);

  const debt = useMemo(() => ({
    totalLoan:  (emis || []).reduce((a, b) => a + (b?.totalLoanAmount || 0), 0),
    monthlyEmi: (emis || []).reduce((a, b) => a + (b?.amount || 0), 0),
  }), [emis]);

  useEffect(() => {
    const fetchInsights = async () => {
      const key = `dash_ai_${totals.rev}_${totals.exp}_${fleet.length}_${activeTripsCount}`;
      const cached = safeStorage.sessionGet(key);
      if (cached) {
        setAiInsights(cached);
        setLoadingInsights(false);
        if (cached.includes('quota reached') || cached.includes('cooldown')) setIsQuotaExceeded(true);
        return;
      }
      try {
        const insight = await getFinancialInsights({ rev: totals.rev, exp: totals.exp, fleetSize: fleet.length, active: activeTripsCount, alerts: compliance.expired.length });
        if (insight?.includes('quota reached') || insight?.includes('cooldown')) setIsQuotaExceeded(true);
        else setIsQuotaExceeded(false);
        setAiInsights(insight || 'Intelligence module standby.');
        safeStorage.sessionSet(key, insight || '');
      } catch {
        setAiInsights('AI calibration required.');
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [totals.rev, totals.exp, fleet.length, activeTripsCount, compliance.expired.length]);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const openReceivables = (invoices || [])
    .filter(i => i && i.status !== InvoiceStatus.CANCELLED)
    .reduce((a, b) => a + (b.totalAmount || 0) - (b.paidAmount || 0), 0);
  const openInvoiceCount = (invoices || []).filter(i => i && i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED).length;

  const siteData = (() => {
    const map = new Map<string, number>();
    (orders || []).forEach(o => { if (o?.projectSite) map.set(o.projectSite, (map.get(o.projectSite) || 0) + (o.quantity || 0)); });
    return Array.from(map.entries()).map(([n, v]) => ({ n, v }));
  })();

  return (
    <div className="page-root page-stack-lg animate-fade-up">

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Net Revenue" value={`₹${totals.rev.toLocaleString()}`}     icon={IndianRupee} accent="blue"   trend="+12.4%" up />
        <KPI label="Total Outflow" value={`₹${totals.exp.toLocaleString()}`}   icon={TrendingDown} accent="red"   trend="−2.1%"  up={false} />
        <KPI label="Net Profit"   value={`₹${totals.profit.toLocaleString()}`} icon={TrendingUp}   accent="green" trend="+5.8%" up />
        <KPI label="Payload Handled" value={`${totals.payload.toLocaleString()} MT`} icon={Package} accent="indigo" trend="+18% vol" up />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Compliance Radar */}
        <div className="card card-pad flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={17} className="text-red-500" strokeWidth={2} />
              <span className="section-title">Compliance Radar</span>
            </div>
            {(compliance.expired.length > 0 || compliance.critical.length > 0) && (
              <span className="badge badge-red animate-pulse">{compliance.expired.length + compliance.critical.length} Issues</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {compliance.expired.length === 0 && compliance.critical.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={32} className="text-green-500" />
                <p className="empty-state-title">Fleet Fully Compliant</p>
              </div>
            ) : (
              <>
                {compliance.expired.slice(0, 3).map((a, i) => (
                  <AlertRow key={`exp-${i}`} truck={a.truck} doc={a.doc} days={a.days} variant="expired" />
                ))}
                {compliance.critical.slice(0, 2).map((a, i) => (
                  <AlertRow key={`crit-${i}`} truck={a.truck} doc={a.doc} days={a.days} variant="critical" />
                ))}
                {compliance.expired.length + compliance.critical.length > 5 && (
                  <p className="t-caption text-center py-1">+{compliance.expired.length + compliance.critical.length - 5} more alerts</p>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setActiveTab('alerts')}
            className="btn btn-primary w-full"
          >
            Manage Alert Hub <ChevronRight size={14} />
          </button>
        </div>

        {/* Growth Chart */}
        <div className="lg:col-span-2 card card-pad">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-blue-600" strokeWidth={2} />
              <span className="section-title">Revenue vs Expenses</span>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-blue">Revenue</span>
              <span className="badge badge-red">Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={[
              { name: 'Jan', rev: totals.rev * 0.7,  exp: totals.exp * 0.8  },
              { name: 'Feb', rev: totals.rev * 0.85, exp: totals.exp * 0.75 },
              { name: 'Mar', rev: totals.rev,        exp: totals.exp         },
            ]}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEE9" />
              <XAxis dataKey="name" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E' }} />
              <YAxis fontSize={11} fontWeight={600} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E' }} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E7E5E0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Outfit' }} />
              <Area type="monotone" dataKey="rev" fill="url(#revGrad)" stroke="#2563EB" strokeWidth={2.5} name="Revenue" />
              <Line type="monotone" dataKey="exp" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }} name="Expenses" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Fleet Uptime */}
        <div className="card card-pad flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={17} className="text-indigo-500" strokeWidth={2} />
            <span className="section-title">Fleet Uptime</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Available', value: fleet.filter(t => t.status === 'AVAILABLE').length },
                  { name: 'On Trip',   value: fleet.filter(t => t.status === 'ON_TRIP').length },
                  { name: 'Repair',    value: fleet.filter(t => t.status === 'MAINTENANCE').length },
                ]}
                cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={4} dataKey="value"
              >
                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: 'Outfit', borderRadius: '10px', border: '1px solid #E7E5E0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-center">
              <p className="t-label" style={{ color: '#1D4ED8' }}>Idle Avg</p>
              <p className="text-lg font-black text-blue-900">8.4h</p>
            </div>
            <div className="p-2.5 bg-green-50 rounded-xl text-center">
              <p className="t-label" style={{ color: '#065F46' }}>Health</p>
              <p className="text-lg font-black text-green-900">82%</p>
            </div>
          </div>
        </div>

        {/* Capital Leverage */}
        <div className="card card-pad flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={17} className="text-amber-500" strokeWidth={2} />
            <span className="section-title">Capital Leverage</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="t-label mb-1">Total Loan Exposure</p>
              <p className="text-2xl font-black text-[#1C1917] tracking-tight">₹{debt.totalLoan.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E7E5E0]">
              <p className="t-label mb-1">Monthly EMI</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-black text-amber-600">₹{debt.monthlyEmi.toLocaleString()}</p>
                <span className="badge badge-amber">{emis.length} loans</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <p className="t-label">Repayment Progress</p>
                <p className="t-caption font-bold text-amber-600">35%</p>
              </div>
              <div className="h-2 bg-[#F0EEE9] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[35%] rounded-full" />
              </div>
            </div>
          </div>
          <button onClick={() => setActiveTab('fleet-finance')} className="btn btn-secondary w-full mt-4">
            View Amortization
          </button>
        </div>

        {/* Asset CAPEX */}
        <div className="card card-pad flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={17} className="text-red-500" strokeWidth={2} />
            <span className="section-title">Asset CAPEX</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar max-h-55">
            {maintenance.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-[#FAFAF8] rounded-xl border border-[#F0EEE9]">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <Wrench size={14} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1C1917] truncate">{m.description}</p>
                  <p className="t-caption">{m.date}</p>
                </div>
                <p className="text-xs font-black text-[#1C1917] shrink-0">₹{(m.amount || 0).toLocaleString()}</p>
              </div>
            ))}
            {maintenance.length === 0 && (
              <div className="empty-state">
                <p className="empty-state-title">No recent repairs</p>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0EEE9] flex items-center justify-between">
            <span className="t-label">MTBF (Days)</span>
            <span className="text-sm font-black text-[#1C1917]">42 Days</span>
          </div>
        </div>

        {/* Site ROI */}
        <div className="card card-pad flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={17} className="text-blue-500" strokeWidth={2} />
            <span className="section-title">Site Throughput</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={siteData}>
              <XAxis dataKey="n" hide />
              <Tooltip cursor={{ fill: '#F5F4F0' }} contentStyle={{ fontFamily: 'Outfit', borderRadius: '10px', border: '1px solid #E7E5E0' }} />
              <Bar dataKey="v" fill="#2563EB" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="t-label text-center mt-3">Tonnage Per Hub (MT)</p>
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Workforce Board */}
        <div className="lg:col-span-2 card card-pad">
          <div className="flex items-center gap-2 mb-5">
            <UserCheck size={17} className="text-green-600" strokeWidth={2} />
            <span className="section-title">Workforce Performance</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...fleet].sort((a, b) => (b.driverScore || 0) - (a.driverScore || 0)).slice(0, 6).map((truck, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-xl border border-[#F0EEE9] hover:border-green-200 transition-all group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-xs text-[#A8A29E] group-hover:bg-green-600 group-hover:text-white transition-all">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1917]">{truck.driverName || 'No Name'}</p>
                    <p className="t-caption font-semibold text-blue-600">{truck.truckNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-600">{truck.driverScore || 0}%</p>
                  <p className="t-label">efficiency</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receivables */}
        <div className="bg-[#1C1917] rounded-2xl p-6 text-white flex flex-col gap-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 opacity-[0.04] translate-x-6 -translate-y-4">
            <Zap size={180} />
          </div>
          <div className="relative z-10">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Receivables Matrix</p>
            <p className="text-3xl font-black tracking-tight">₹{openReceivables.toLocaleString()}</p>
            <p className="text-white/40 text-xs font-medium mt-1">{openInvoiceCount} open vouchers</p>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-xs font-semibold">Collection Rate</span>
              <span className="text-green-400 text-xs font-bold">74%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[74%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
            </div>
          </div>

          <div className="relative z-10 p-3.5 bg-white/6 border border-white/10 rounded-xl">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Active Trips</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-black">{activeTripsCount}</p>
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Clock size={18} />
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('invoices')}
            className="relative z-10 w-full py-3 bg-white text-[#1C1917] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#F5F4F0] active:scale-[0.98] transition-all shadow-lg"
          >
            Launch Billing Hub
          </button>
        </div>

      </div>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────── */

const KPI: React.FC<{
  label: string; value: string; icon: React.ElementType;
  accent: 'blue' | 'red' | 'green' | 'indigo'; trend: string; up: boolean;
}> = ({ label, value, icon: Icon, accent, trend, up }) => {
  const accents = {
    blue:   'bg-blue-50 text-blue-600',
    red:    'bg-red-50 text-red-600',
    green:  'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  const trendCls = up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50';
  return (
    <div className="card card-pad hover:shadow-md transition-all group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]} group-hover:scale-105 transition-transform`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${trendCls}`}>{trend}</span>
      </div>
      <p className="t-label mb-1">{label}</p>
      <p className="text-xl font-black text-[#1C1917] tracking-tight leading-none">{value}</p>
    </div>
  );
};

const AlertRow: React.FC<{ truck: string; doc: string; days: number; variant: 'expired' | 'critical' }> = ({ truck, doc, days, variant }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${variant === 'expired' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${variant === 'expired' ? 'bg-red-500' : 'bg-amber-500'}`}>
      <FileWarning size={13} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-bold truncate ${variant === 'expired' ? 'text-red-900' : 'text-amber-900'}`}>{truck}</p>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${variant === 'expired' ? 'text-red-500' : 'text-amber-600'}`}>{doc}</p>
    </div>
    <span className={`text-[10px] font-black uppercase shrink-0 ${variant === 'expired' ? 'text-red-600' : 'text-amber-700'}`}>
      {variant === 'expired' ? 'Expired' : `${days}d`}
    </span>
  </div>
);

export default Dashboard;
