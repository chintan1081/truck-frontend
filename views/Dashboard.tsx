
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart, Line, Legend
} from 'recharts';
import { 
  Truck, IndianRupee, Clock, Sparkles, TrendingUp, TrendingDown,
  Wallet, AlertTriangle, ShieldAlert, CheckCircle2, Package,
  Activity, Zap, Building2, Hammer, Gauge, UserCheck, 
  FileWarning, ShieldCheck, Calculator, Wrench, ChevronRight
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
  orders, expenses, fleet, emis, maintenance, invoices, salaries, setActiveTab 
}) => {
  const [aiInsights, setAiInsights] = useState<string>('Analyzing your operations...');
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const totals = useMemo(() => {
    const validOrders = (orders || []).filter(o => o && typeof o.quantity === 'number' && typeof o.ratePerMT === 'number');
    const validExpenses = (expenses || []).filter(e => e && typeof e.amount === 'number');
    
    const rev = validOrders.reduce((acc, o) => acc + (o.quantity * o.ratePerMT), 0);
    const exp = validExpenses.reduce((acc, e) => acc + e.amount, 0);
    const payload = validOrders.reduce((acc, o) => acc + o.quantity, 0);
    const profit = rev - exp;
    return { rev, exp, profit, payload };
  }, [orders, expenses]);

  const activeTripsCount = (orders || []).filter(o => o && [TripStatus.ASSIGNED, TripStatus.PICKED].includes(o.status)).length;
  
  const compliance = useMemo(() => {
    const today = new Date();
    const alertList = (fleet || []).flatMap(t => {
      const docs = [
        { type: 'Insurance', date: t.insuranceExpiry ? new Date(t.insuranceExpiry) : null },
        { type: 'Fitness', date: t.fitnessExpiry ? new Date(t.fitnessExpiry) : null },
        { type: 'Pollution', date: t.pollutionExpiry ? new Date(t.pollutionExpiry) : null },
        { type: 'Permit', date: t.permitExpiry ? new Date(t.permitExpiry) : null }
      ];
      return docs.map(d => ({
        truck: t.truckNumber || 'N/A',
        doc: d.type,
        days: d.date && !isNaN(d.date.getTime()) 
          ? Math.ceil((d.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }));
    });

    const expired = alertList.filter(a => a.days < 0);
    const critical = alertList.filter(a => a.days >= 0 && a.days <= 15);
    
    // Predictive maintenance: service due in < 500km
    const serviceDue = (fleet || []).filter(t => {
      if (!t.odometerAtLastService || !t.serviceIntervalKm) return false;
      const lastService = typeof t.odometerAtLastService === 'string' ? parseFloat(t.odometerAtLastService) : t.odometerAtLastService;
      const kmToService = (lastService + t.serviceIntervalKm) - t.currentOdometer;
      return kmToService > 0 && kmToService < 500;
    }).map(t => ({
      truck: t.truckNumber || 'N/A',
      doc: 'SERVICE DUE',
      days: 0,
      isService: true
    }));

    return {
      expired,
      critical: [...critical, ...serviceDue]
    };
  }, [fleet]);

  const debt = useMemo(() => {
    const totalLoan = (emis || []).reduce((a, b) => a + (b?.totalLoanAmount || 0), 0);
    const monthlyEmi = (emis || []).reduce((a, b) => a + (b?.amount || 0), 0);
    return { totalLoan, monthlyEmi };
  }, [emis]);

  useEffect(() => {
    const fetchInsights = async () => {
      const insightKey = `${totals.rev}_${totals.exp}_${fleet.length}_${activeTripsCount}`;
      const sessionKey = `dash_ai_${insightKey}`;
      
      let cached = safeStorage.sessionGet(sessionKey);
      
      if (cached) {
        setAiInsights(cached);
        setLoadingInsights(false);
        if (cached.includes("quota reached") || cached.includes("cooldown")) setIsQuotaExceeded(true);
        return;
      }
      
      try {
        const insight = await getFinancialInsights({
          rev: totals.rev,
          exp: totals.exp,
          fleetSize: fleet.length,
          active: activeTripsCount,
          alerts: compliance.expired.length
        });
        
        if (insight?.includes("quota reached") || insight?.includes("cooldown")) setIsQuotaExceeded(true);
        else setIsQuotaExceeded(false);
 
        setAiInsights(insight || 'Intelligence module standby.');
        safeStorage.sessionSet(sessionKey, insight || '');
      } catch (e) {
        setAiInsights("AI calibration required.");
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [totals.rev, totals.exp, fleet.length, activeTripsCount, compliance.expired.length]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Net Revenue (Est)" value={`₹${(totals.rev || 0).toLocaleString()}`} icon={IndianRupee} color="blue" trend="+12.4%" />
        <KPICard label="Operational Outflow" value={`₹${(totals.exp || 0).toLocaleString()}`} icon={TrendingDown} color="red" trend="-2.1%" />
        <KPICard label="Net Profit (Calculated)" value={`₹${(totals.profit || 0).toLocaleString()}`} icon={TrendingUp} color="green" trend="+5.8%" />
        <KPICard label="Total Payload Handled" value={`${(totals.payload || 0).toLocaleString()} MT`} icon={Package} color="indigo" trend="+18% Vol" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-600" /> Compliance Radar
            </h3>
            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase border border-red-100 animate-pulse">Alert Active</span>
          </div>
          <div className="space-y-4 flex-1">
            {compliance.expired.length === 0 && compliance.critical.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <ShieldCheck size={48} className="text-green-500 mb-2" />
                <p className="text-xs font-black uppercase">Fleet Fully Compliant</p>
              </div>
            ) : (
              <>
                {compliance.expired.slice(0, 3).map((a, i) => (
                  <AlertItem key={`exp-${i}`} truck={a.truck} doc={a.doc} days={a.days} variant="expired" />
                ))}
                {compliance.critical.slice(0, 2).map((a, i) => (
                  <AlertItem key={`crit-${i}`} truck={a.truck} doc={a.doc} days={a.days} variant="critical" />
                ))}
                {(compliance.expired.length + compliance.critical.length > 5) && (
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase py-2">+{compliance.expired.length + compliance.critical.length - 5} More Alerts</p>
                )}
              </>
            )}
          </div>
          <button 
            onClick={() => setActiveTab('alerts')}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            Manage Alert Hub <ChevronRight size={14} />
          </button>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
               <Activity size={20} className="text-blue-600" /> Growth & Burn Rate
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase border border-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Revenue
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" /> Expenses
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={[
                { name: 'Jan', rev: totals.rev * 0.7, exp: totals.exp * 0.8 },
                { name: 'Feb', rev: totals.rev * 0.85, exp: totals.exp * 0.75 },
                { name: 'Mar', rev: totals.rev, exp: totals.exp },
              ]}>
                <defs>
                   <linearGradient id="colRevDash" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="rev" fill="url(#colRevDash)" stroke="#2563eb" strokeWidth={4} name="Revenue Flow" />
                <Line type="monotone" dataKey="exp" stroke="#ef4444" strokeWidth={3} dot={{ r: 6, fill: '#ef4444' }} name="Expense Outflow" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
             <Truck size={20} className="text-indigo-600" /> Fleet Uptime
           </h3>
           <div className="h-60">
              <ResponsiveContainer width="100%" height={240}>
                 <PieChart>
                    <Pie data={[
                      { name: 'Available', value: fleet.filter(t=>t.status === 'AVAILABLE').length },
                      { name: 'On Trip', value: fleet.filter(t=>t.status === 'ON_TRIP').length },
                      { name: 'Repair', value: fleet.filter(t=>t.status === 'MAINTENANCE').length }
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-[9px] font-black text-blue-600 uppercase">Avg Idleness</p><p className="text-lg font-black text-blue-900">8.4h</p></div>
              <div className="p-3 bg-green-50 rounded-xl text-center"><p className="text-[9px] font-black text-green-600 uppercase">Fleet Health</p><p className="text-lg font-black text-green-900">82%</p></div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
             <Calculator size={20} className="text-amber-500" /> Capital Leverage
           </h3>
           <div className="space-y-6 flex-1">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Loan Exposure</p>
                 <p className="text-2xl font-black text-slate-900">₹{(debt.totalLoan || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly EMI Committed</p>
                 <div className="flex items-end justify-between">
                    <p className="text-xl font-black text-amber-600">₹{(debt.monthlyEmi || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-500">{emis.length} ACTIVE LOANS</p>
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Repayment Progress</p>
                 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[35%]" />
                 </div>
              </div>
           </div>
           <button onClick={() => setActiveTab('fleet-finance')} className="mt-8 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-200">View Amortization</button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
             <Hammer size={20} className="text-red-500" /> Asset CAPEX
           </h3>
           <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar max-h-[250px]">
              {maintenance.slice(0, 4).map((m, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><Wrench size={16}/></div>
                    <div>
                       <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{m.description}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{m.date}</p>
                    </div>
                    <p className="ml-auto text-xs font-black text-slate-900">₹{(m.amount || 0).toLocaleString()}</p>
                 </div>
              ))}
              {maintenance.length === 0 && <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase">No Recent Repairs</p>}
           </div>
           <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">MTBF (Days)</span>
              <span className="text-sm font-black text-slate-900">42 Days</span>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
             <Building2 size={20} className="text-blue-500" /> Site ROI
           </h3>
           <div className="h-60">
              <ResponsiveContainer width="100%" height={240}>
                 <BarChart data={(() => {
                    const map = new Map();
                     (orders || []).forEach(o => {
                        if (o && o.projectSite) {
                           map.set(o.projectSite, (map.get(o.projectSite)||0) + (o.quantity || 0));
                        }
                     });
                    return Array.from(map.entries()).map(([n, v]) => ({ n, v }));
                 })()}>
                    <XAxis dataKey="n" hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="v" fill="#2563eb" radius={[6, 6, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase text-center mt-4 tracking-widest">Tonnage Throughput Per Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
              <UserCheck size={20} className="text-green-600" /> Workforce Performance Board
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
               {[...(fleet || [])].sort((a,b)=>(b.driverScore || 0) - (a.driverScore || 0)).slice(0, 6).map((truck, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-green-200 transition-all cursor-default group">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm font-black text-xs text-slate-400 group-hover:bg-green-600 group-hover:text-white transition-all">{i+1}</div>
                        <div>
                           <p className="text-sm font-black text-slate-900">{truck.driverName || 'No Name'}</p>
                           <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{truck.truckNumber || 'N/A'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-black text-green-600">{truck.driverScore || 0}%</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">EFFICIENCY</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Zap size={240}/></div>
            <h3 className="text-xl font-black mb-8 relative z-10">Receivables Matrix</h3>
            <div className="space-y-8 flex-1 relative z-10">
               <div>
                  <div className="flex justify-between mb-2">
                     <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Collection Rate</span>
                     <span className="text-[11px] font-black text-green-400">74% Target Met</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                     <div className="h-full bg-green-500 w-[74%] shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                  </div>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-4">Awaiting Payment</p>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-3xl font-black">₹{(( (invoices || []).filter(i => i && i.status !== InvoiceStatus.CANCELLED).reduce((a,b)=>a+(b.totalAmount || 0),0) - (invoices || []).filter(i => i && i.status !== InvoiceStatus.CANCELLED).reduce((a,b)=>a+(b.paidAmount || 0),0)) || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Across {(invoices || []).filter(i=>i && i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED).length} Open Vouchers</p>
                     </div>
                     <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50"><Clock size={24}/></div>
                  </div>
               </div>
               <button onClick={() => setActiveTab('invoices')} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Launch Billing Hub</button>
            </div>
         </div>

      </div>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string; icon: any; color: string; trend: string }> = ({ label, value, icon: Icon, color, trend }) => {
  const colors: Record<string, string> = { 
    blue: 'bg-blue-50 text-blue-600', 
    red: 'bg-red-50 text-red-600', 
    green: 'bg-green-50 text-green-600', 
    indigo: 'bg-indigo-50 text-indigo-600' 
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase border ${color === 'green' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</h3>
      <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</p>
    </div>
  );
};

const AlertItem: React.FC<{ truck: string; doc: string; days: number; variant: 'expired' | 'critical' }> = ({ truck, doc, days, variant }) => (
  <div className={`p-4 rounded-2xl border flex items-center justify-between hover:translate-x-2 transition-transform ${variant === 'expired' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
    <div className="flex items-center gap-3">
       <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${variant === 'expired' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
          <FileWarning size={14}/>
       </div>
       <div>
          <p className="text-xs font-black uppercase">{truck}</p>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{doc}</p>
       </div>
    </div>
    <span className="text-[10px] font-black uppercase">{variant === 'expired' ? 'EXPIRED' : `IN ${days}D`}</span>
  </div>
);

export default Dashboard;
