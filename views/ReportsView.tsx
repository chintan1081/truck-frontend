
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend,
  ComposedChart, Scatter, ScatterChart, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar,
  Funnel, FunnelChart, LabelList
} from 'recharts';
import { 
  TrendingUp, Calendar, Filter, Download, 
  Truck as TruckIcon, IndianRupee, FileText, Banknote, Coins, 
  Package, ChevronDown, ArrowUpRight, Search, 
  ArrowDownRight, FileSpreadsheet, Activity,
  Wrench, ShieldCheck, MapPin, Gauge, User,
  Zap, AlertCircle, Briefcase, MousePointer2,
  ListFilter, SlidersHorizontal, Settings2,
  Clock, BarChart3, PieChart as PieChartIcon, 
  Target, ZapOff, Layers, Globe, Printer, CheckCircle2,
  FileDown, FileType, Mail
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Added Client to the imported types
import { Order, Expense, DriverSalary, Invoice, TruckEMI, MaintenanceExpense, TripStatus, ExpenseCategory, Truck, InvoiceStatus, Client, Broker, PlantAdvance, PlantAdvancePoolEntry, Site } from '../types';

interface ReportsViewProps {
  orders: Order[];
  expenses: Expense[];
  salaries: DriverSalary[];
  invoices: Invoice[];
  emis: TruckEMI[];
  maintenance: MaintenanceExpense[];
  fleet: Truck[];
  clients: Client[];
  brokers: Broker[];
  plantAdvances: PlantAdvance[];
  pool: PlantAdvancePoolEntry[];
  sites: Site[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ 
  orders, expenses, salaries, invoices, emis, maintenance, fleet, clients, brokers, plantAdvances, pool, sites
}) => {
  const [activeReport, setActiveReport] = useState<'trips' | 'revenue' | 'expenses' | 'payroll' | 'invoices' | 'fleet' | 'brokers' | 'planthub' | 'orders' | 'automated'>('trips');
  
  // 10 Filters per section
  const [filterState, setFilterState] = useState({
    trips: { start: '2024-01-01', end: '2025-12-31', status: 'ALL', site: 'ALL', truck: 'ALL', driver: 'ALL', weightMin: 0, weightMax: 1000, distanceMin: 0, source: 'ALL', search: '' },
    revenue: { start: '2024-01-01', end: '2025-12-31', client: 'ALL', gstType: 'ALL', amountMin: 0, amountMax: 10000000, project: 'ALL', quarter: 'ALL', payTerms: 'ALL', hasGST: 'ALL', search: '' },
    expenses: { start: '2024-01-01', end: '2025-12-31', category: 'ALL', status: 'ALL', mode: 'ALL', amtMin: 0, amtMax: 500000, vendor: 'ALL', truckId: 'ALL', isLimit: 'ALL', search: '' },
    payroll: { start: '2024-01-01', end: '2025-12-31', driver: 'ALL', type: 'ALL', status: 'ALL', bank: 'ALL', minAmt: 0, maxAmt: 100000, month: 'ALL', year: '2025', search: '' },
    invoices: { start: '2024-01-01', end: '2025-12-31', status: 'ALL', client: 'ALL', gstRate: 'ALL', overdue: 'ALL', minAmt: 0, maxAmt: 5000000, mode: 'ALL', overdueSince: 'ALL', search: '' },
    fleet: { start: '2024-01-01', end: '2025-12-31', truck: 'ALL', bank: 'ALL', loanStatus: 'ALL', maintCat: 'ALL', workshop: 'ALL', amtMin: 0, odoMin: 0, parts: 'ALL', vin: 'ALL', search: '' },
    brokers: { start: '2024-01-01', end: '2025-12-31', broker: 'ALL', minComm: 0, maxComm: 100000, search: '' },
    planthub: { start: '2024-01-01', end: '2025-12-31', station: 'ALL', search: '' },
    orders: { start: '2024-01-01', end: '2025-12-31', client: 'ALL', status: 'ALL', site: 'ALL', search: '' },
    automated: { type: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY', date: new Date().toISOString().split('T')[0] }
  });

  const updateFilter = (section: string, key: string, val: any) => {
    setFilterState(prev => ({
      ...prev,
      [section]: { ...(prev as any)[section], [key]: val }
    }));
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

  const tripIntelligence = useMemo(() => {
    // 1. Trips By Driver
    const driverMap: Record<string, number> = {};
    orders.forEach(o => {
      const truck = (fleet || []).find(t => t.id === o.assignedTruckId);
      const driver = truck?.driverName || 'Unassigned';
      driverMap[driver] = (driverMap[driver] || 0) + 1;
    });
    const tripsByDriver = Object.entries(driverMap).map(([name, trips]) => ({ name, trips })).sort((a,b) => b.trips - a.trips);

    // 2. Trips By Truck
    const truckMap: Record<string, number> = {};
    orders.forEach(o => {
      const truck = (fleet || []).find(t => t.id === o.assignedTruckId);
      const truckNum = truck?.truckNumber || 'Unknown';
      truckMap[truckNum] = (truckMap[truckNum] || 0) + 1;
    });
    const tripsByTruck = Object.entries(truckMap).map(([name, trips]) => ({ name, trips })).sort((a,b) => b.trips - a.trips);

    // 3. Source Distribution
    const sourceMap: Record<string, number> = {};
    orders.forEach(o => {
      const source = o.projectSite.split(' ')[0] || 'Other'; // Mocking source from site name or use a field if available
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    });
    const sourceDistribution = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

    // 4. Weight Distribution
    const weightRanges = [
      { name: '< 25 MT', count: orders.filter(o => o.quantity < 25).length },
      { name: '25-30 MT', count: orders.filter(o => o.quantity >= 25 && o.quantity <= 30).length },
      { name: '> 30 MT', count: orders.filter(o => o.quantity > 30).length }
    ];

    // 5. Day of Week Activity
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap: Record<string, number> = {};
    orders.forEach(o => {
      const day = days[new Date(o.pickupDate).getDay()];
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    const weeklyActivity = days.map(day => ({ day, trips: dayMap[day] || 0 }));

    return { tripsByDriver, tripsByTruck, sourceDistribution, weightRanges, weeklyActivity };
  }, [orders, fleet]);

  const brokerAnalytics = useMemo(() => {
    const brokerOrders = orders.filter(o => o.brokerId);
    
    // 1. Broker By Total Trips
    const tripsByBroker = brokers.map(b => ({
      name: b.name,
      trips: brokerOrders.filter(o => o.brokerId === b.id).length
    })).filter(d => d.trips > 0);

    // 2. Broker By Client (Commission)
    const clientByBroker = brokers.map(b => {
      const bOrders = brokerOrders.filter(o => o.brokerId === b.id);
      const clientsMap: Record<string, number> = {};
      bOrders.forEach(o => {
        clientsMap[o.clientName] = (clientsMap[o.clientName] || 0) + (o.totalBrokerCommission || 0);
      });
      return {
        name: b.name,
        ...clientsMap
      };
    }).filter(d => Object.keys(d).length > 1);

    // 3. Broker By Station & Sites (Volume)
    const stationByBroker = brokers.map(b => {
      const bOrders = brokerOrders.filter(o => o.brokerId === b.id);
      const sitesMap: Record<string, number> = {};
      bOrders.forEach(o => {
        sitesMap[o.projectSite] = (sitesMap[o.projectSite] || 0) + o.quantity;
      });
      return {
        name: b.name,
        ...sitesMap
      };
    }).filter(d => Object.keys(d).length > 1);

    return { tripsByBroker, clientByBroker, stationByBroker, brokerOrders };
  }, [orders, brokers]);

  const automatedIntelligence = useMemo(() => {
    const { type, date } = filterState.automated;
    const selectedDate = new Date(date);
    
    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (type === 'DAILY') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === 'WEEKLY') {
      const day = selectedDate.getDay();
      startDate.setDate(selectedDate.getDate() - day);
      endDate.setDate(startDate.getDate() + 6);
    } else if (type === 'MONTHLY') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    }

    const filteredOrders = orders.filter(o => {
      const oDate = new Date(o.pickupDate);
      return oDate >= startDate && oDate <= endDate;
    });

    const filteredExpenses = expenses.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= startDate && eDate <= endDate;
    });

    const totalTonnage = filteredOrders.reduce((acc, curr) => acc + (curr.actualQuantity || curr.quantity), 0);
    const totalTrips = filteredOrders.length;
    const deliveredTrips = filteredOrders.filter(o => o.status === TripStatus.DELIVERED || o.status === TripStatus.INVOICED || o.status === TripStatus.PAID).length;
    const deliveryRate = totalTrips > 0 ? (deliveredTrips / totalTrips) * 100 : 0;
    
    const fuelExpenses = filteredExpenses.filter(e => e.category === ExpenseCategory.DIESEL);
    const totalFuelLiters = fuelExpenses.reduce((acc, curr) => acc + (curr.liters || 0), 0);
    const totalFuelCost = fuelExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    const revenue = filteredOrders.reduce((acc, curr) => acc + (curr.actualQuantity || curr.quantity) * curr.ratePerMT, 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = revenue - totalExpenses;

    const truckPerformance = fleet.map(t => {
      const truckTrips = filteredOrders.filter(o => o.assignedTruckId === t.id);
      return {
        id: t.id,
        number: t.truckNumber,
        trips: truckTrips.length,
        tonnage: truckTrips.reduce((acc, curr) => acc + (curr.actualQuantity || curr.quantity), 0)
      };
    }).sort((a, b) => b.tonnage - a.tonnage).slice(0, 5);

    const driverPerfs = fleet.map(f => {
      const driverTrips = filteredOrders.filter(o => o.assignedTruckId === f.id);
      return {
        name: f.driverName,
        trips: driverTrips.length,
        score: f.driverScore || 0
      };
    }).filter(d => d.trips > 0).sort((a,b) => b.trips - a.trips).slice(0, 5);

    return { 
      filteredOrders, filteredExpenses, totalTonnage, totalTrips, 
      deliveryRate, totalFuelLiters, totalFuelCost, 
      revenue, totalExpenses, netProfit, 
      truckPerformance, driverPerfs,
      startDate, endDate
    };
  }, [orders, expenses, fleet, filterState.automated]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header], (key, value) => value === null ? '' : value)).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAutomatedPDF = () => {
    const { totalTonnage, totalTrips, deliveryRate, totalFuelLiters, revenue, totalExpenses, netProfit, truckPerformance, startDate, endDate } = automatedIntelligence;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Logistics Operations Intelligence Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Operational Summary', 14, 45);
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Tonnage Transported', `${totalTonnage.toLocaleString()} MT`],
      ['Total Trips Initiated', totalTrips.toString()],
      ['Delivery Completion Rate', `${deliveryRate.toFixed(2)}%`],
      ['Total Fuel Consumed', `${totalFuelLiters.toLocaleString()} Liters`],
      ['Total Revenue', `INR ${revenue.toLocaleString()}`],
      ['Total Operational Expenses', `INR ${totalExpenses.toLocaleString()}`],
      ['Net Performance Index (Profit/Loss)', `INR ${netProfit.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 50,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.text('Top Asset Performance', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const truckData = truckPerformance.map(t => [t.number, t.trips, `${t.tonnage} MT`]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Truck Number', 'Trips', 'Tonnage']],
      body: truckData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Performance_Report_${filterState.automated.type}_${filterState.automated.date}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             <TrendingUp size={36} className="text-blue-600" /> Control Tower Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">Multi-dimensional operational intelligence and compliance auditing.</p>
        </div>
        <div className="flex bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 shadow-xl overflow-x-auto no-scrollbar">
          {(['trips', 'revenue', 'expenses', 'payroll', 'invoices', 'fleet', 'brokers', 'planthub', 'orders', 'automated'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveReport(tab)}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeReport === tab ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/80'}`}
            >
              {activeReport === tab && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              {tab === 'fleet' ? 'Fleet Finance' : tab === 'brokers' ? 'Brokerage' : tab === 'planthub' ? 'Plant Hub' : tab === 'orders' ? 'Orders' : tab === 'automated' ? 'Auto Reports' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Analytical Hub Container */}
      <div className="bg-white rounded-[4rem] border-2 border-slate-100 shadow-md overflow-hidden flex flex-col min-h-[90vh]">
        
        {/* Advanced 10-Filter Panel */}
        <div className="px-12 py-10 bg-[#F5F4F0]/50 border-b border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <SlidersHorizontal size={20} className="text-blue-600" />
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.25em]">Parametric Filter Matrix (10 Criteria)</h3>
              </div>
              <button className="flex items-center gap-2 t-label hover:text-blue-600 transition-colors">
                 <Zap size={14} /> Clear All Filters
              </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-4">
              {/* Universal Dates */}
              <FilterInput label="Date Start" type="date" value={(filterState as any)[activeReport].start} onChange={v => updateFilter(activeReport, 'start', v)} />
              <FilterInput label="Date End" type="date" value={(filterState as any)[activeReport].end} onChange={v => updateFilter(activeReport, 'end', v)} />
              
              {activeReport === 'trips' && (
                <>
                  <FilterSelect label="Status" options={['ALL', ...Object.values(TripStatus)]} value={filterState.trips.status} onChange={v => updateFilter('trips', 'status', v)} />
                  <FilterSelect label="Project Site" options={['ALL', ...new Set(orders.map(o=>o.projectSite))]} value={filterState.trips.site} onChange={v => updateFilter('trips', 'site', v)} />
                  <FilterSelect label="Fleet Asset" options={['ALL', ...new Set(fleet.map(t=>t.truckNumber))]} value={filterState.trips.truck} onChange={v => updateFilter('trips', 'truck', v)} />
                  <FilterSelect label="Driver" options={['ALL', ...new Set(fleet.map(f=>f.driverName))]} value={filterState.trips.driver} onChange={v => updateFilter('trips', 'driver', v)} />
                  <FilterInput label="Min MT" type="number" value={filterState.trips.weightMin} onChange={v => updateFilter('trips', 'weightMin', Number(v))} />
                  <FilterInput label="Max MT" type="number" value={filterState.trips.weightMax} onChange={v => updateFilter('trips', 'weightMax', Number(v))} />
                  <FilterSelect label="Source" options={['ALL', 'Wanakbori', 'Ukai', 'Sikka']} value={filterState.trips.source} onChange={v => updateFilter('trips', 'source', v)} />
                  <FilterInput label="Search ID" type="text" value={filterState.trips.search} onChange={v => updateFilter('trips', 'search', v)} />
                </>
              )}

              {activeReport === 'revenue' && (
                <>
                  <FilterSelect label="Client" options={['ALL', 'Adani Power', 'Adani Infra', 'GSECL']} value={filterState.revenue.client} onChange={v => updateFilter('revenue', 'client', v)} />
                  <FilterSelect label="GST Config" options={['ALL', 'IGST', 'CGST_SGST']} value={filterState.revenue.gstType} onChange={v => updateFilter('revenue', 'gstType', v)} />
                  <FilterInput label="Min Rev ₹" type="number" value={filterState.revenue.amountMin} onChange={v => updateFilter('revenue', 'amountMin', Number(v))} />
                  <FilterInput label="Max Rev ₹" type="number" value={filterState.revenue.amountMax} onChange={v => updateFilter('revenue', 'amountMax', Number(v))} />
                  <FilterSelect label="Quarter" options={['ALL', 'Q1', 'Q2', 'Q3', 'Q4']} value={filterState.revenue.quarter} onChange={v => updateFilter('revenue', 'quarter', v)} />
                  <FilterSelect label="Net Terms" options={['ALL', 'Advance', 'Net 15', 'Net 30']} value={filterState.revenue.payTerms} onChange={v => updateFilter('revenue', 'payTerms', v)} />
                  <FilterSelect label="GST Status" options={['ALL', 'Yes', 'No']} value={filterState.revenue.hasGST} onChange={v => updateFilter('revenue', 'hasGST', v)} />
                  <FilterSelect label="Project Hub" options={['ALL', 'Mundra', 'Hazira', 'Sikka']} value={filterState.revenue.project} onChange={v => updateFilter('revenue', 'project', v)} />
                </>
              )}

              {activeReport === 'expenses' && (
                <>
                  <FilterSelect label="Category" options={['ALL', ...Object.values(ExpenseCategory)]} value={filterState.expenses.category} onChange={v => updateFilter('expenses', 'category', v)} />
                  <FilterSelect label="Approval" options={['ALL', 'PENDING', 'APPROVED', 'REJECTED']} value={filterState.expenses.status} onChange={v => updateFilter('expenses', 'status', v)} />
                  <FilterSelect label="Pay Mode" options={['ALL', 'CASH', 'BANK', 'UPI']} value={filterState.expenses.mode} onChange={v => updateFilter('expenses', 'mode', v)} />
                  <FilterInput label="Min Amt ₹" type="number" value={filterState.expenses.amtMin} onChange={v => updateFilter('expenses', 'amtMin', Number(v))} />
                  <FilterInput label="Max Amt ₹" type="number" value={filterState.expenses.amtMax} onChange={v => updateFilter('expenses', 'amtMax', Number(v))} />
                  <FilterSelect label="Major Vendor" options={['ALL', 'Indian Oil', 'Reliance', 'Garage']} value={filterState.expenses.vendor} onChange={v => updateFilter('expenses', 'vendor', v)} />
                  <FilterSelect label="Truck ID" options={['ALL', ...new Set(fleet.map(t=>t.truckNumber))]} value={filterState.expenses.truckId} onChange={v => updateFilter('expenses', 'truckId', v)} />
                  <FilterSelect label="Limit Alert" options={['ALL', 'Yes', 'No']} value={filterState.expenses.isLimit} onChange={v => updateFilter('expenses', 'isLimit', v)} />
                </>
              )}

              {activeReport === 'payroll' && (
                <>
                  <FilterSelect label="Driver Name" options={['ALL', ...new Set(fleet.map(f=>f.driverName))]} value={filterState.payroll.driver} onChange={v => updateFilter('payroll', 'driver', v)} />
                  <FilterSelect label="Pay Scale" options={['ALL', 'PER_DAY', 'PER_MONTH']} value={filterState.payroll.type} onChange={v => updateFilter('payroll', 'type', v)} />
                  <FilterSelect label="Bank Profile" options={['ALL', 'SBI', 'HDFC', 'ICICI']} value={filterState.payroll.bank} onChange={v => updateFilter('payroll', 'bank', v)} />
                  <FilterInput label="Min Disb." type="number" value={filterState.payroll.minAmt} onChange={v => updateFilter('payroll', 'minAmt', Number(v))} />
                  <FilterInput label="Max Disb." type="number" value={filterState.payroll.maxAmt} onChange={v => updateFilter('payroll', 'maxAmt', Number(v))} />
                  <FilterSelect label="Disb. Month" options={['ALL', 'Feb', 'Jan', 'Dec']} value={filterState.payroll.month} onChange={v => updateFilter('payroll', 'month', v)} />
                  <FilterSelect label="Year" options={['2024', '2025', '2026']} value={filterState.payroll.year} onChange={v => updateFilter('payroll', 'year', v)} />
                  <FilterInput label="Search Txn" type="text" value={filterState.payroll.search} onChange={v => updateFilter('payroll', 'search', v)} />
                </>
              )}

              {activeReport === 'invoices' && (
                <>
                  <FilterSelect label="Inv Status" options={['ALL', ...Object.values(InvoiceStatus)]} value={filterState.invoices.status} onChange={v => updateFilter('invoices', 'status', v)} />
                  <FilterSelect label="Partner" options={['ALL', 'Adani Power', 'GSECL']} value={filterState.invoices.client} onChange={v => updateFilter('invoices', 'client', v)} />
                  <FilterSelect label="GST Rate" options={['ALL', '5', '12', '18']} value={filterState.invoices.gstRate} onChange={v => updateFilter('invoices', 'gstRate', v)} />
                  <FilterSelect label="Overdue" options={['ALL', '>15 Days', '>30 Days', '>60 Days']} value={filterState.invoices.overdue} onChange={v => updateFilter('invoices', 'overdue', v)} />
                  <FilterInput label="Min Val ₹" type="number" value={filterState.invoices.minAmt} onChange={v => updateFilter('invoices', 'minAmt', Number(v))} />
                  <FilterInput label="Max Val ₹" type="number" value={filterState.invoices.maxAmt} onChange={v => updateFilter('invoices', 'maxAmt', Number(v))} />
                  <FilterSelect label="Pay Mode" options={['ALL', 'RTGS', 'UPI', 'NEFT']} value={filterState.invoices.mode} onChange={v => updateFilter('invoices', 'mode', v)} />
                  <FilterInput label="Search Ref" type="text" value={filterState.invoices.search} onChange={v => updateFilter('invoices', 'search', v)} />
                </>
              )}

              {activeReport === 'fleet' && (
                <>
                  <FilterSelect label="Asset #" options={['ALL', ...new Set(fleet.map(t=>t.truckNumber))]} value={filterState.fleet.truck} onChange={v => updateFilter('fleet', 'truck', v)} />
                  <FilterSelect label="Financier" options={['ALL', 'HDFC', 'Tata Capital', 'ICICI']} value={filterState.fleet.bank} onChange={v => updateFilter('fleet', 'bank', v)} />
                  <FilterSelect label="Loan Status" options={['ALL', 'ACTIVE', 'CLOSED']} value={filterState.fleet.loanStatus} onChange={v => updateFilter('fleet', 'loanStatus', v)} />
                  <FilterSelect label="Repair Cat" options={['ALL', 'ROUTINE', 'ENGINE', 'TYRE']} value={filterState.fleet.maintCat} onChange={v => updateFilter('fleet', 'maintCat', v)} />
                  <FilterInput label="Min KM" type="number" value={filterState.fleet.odoMin} onChange={v => updateFilter('fleet', 'odoMin', Number(v))} />
                  <FilterSelect label="Workshop" options={['ALL', 'Authorized', 'Local']} value={filterState.fleet.workshop} onChange={v => updateFilter('fleet', 'workshop', v)} />
                  <FilterInput label="Search VIN" type="text" value={filterState.fleet.search} onChange={v => updateFilter('fleet', 'search', v)} />
                  <FilterSelect label="Major Part" options={['ALL', 'Battery', 'Engine', 'Tires']} value={filterState.fleet.parts} onChange={v => updateFilter('fleet', 'parts', v)} />
                </>
              )}

              {activeReport === 'brokers' && (
                <>
                  <FilterSelect label="Broker Name" options={['ALL', ...brokers.map(b=>b.name)]} value={filterState.brokers.broker} onChange={v => updateFilter('brokers', 'broker', v)} />
                  <FilterInput label="Min Comm ₹" type="number" value={filterState.brokers.minComm} onChange={v => updateFilter('brokers', 'minComm', Number(v))} />
                  <FilterInput label="Max Comm ₹" type="number" value={filterState.brokers.maxComm} onChange={v => updateFilter('brokers', 'maxComm', Number(v))} />
                  <FilterInput label="Search Broker" type="text" value={filterState.brokers.search} onChange={v => updateFilter('brokers', 'search', v)} />
                </>
              )}

              {activeReport === 'planthub' && (
                <>
                  <FilterSelect label="TPS Station" options={['ALL', ...sites.filter(s=>s.type==='TPS').map(s=>s.name)]} value={filterState.planthub.station} onChange={v => updateFilter('planthub', 'station', v)} />
                  <FilterInput label="Search Ref" type="text" value={filterState.planthub.search} onChange={v => updateFilter('planthub', 'search', v)} />
                </>
              )}

              {activeReport === 'orders' && (
                <>
                  <FilterSelect label="Partner" options={['ALL', ...new Set(orders.map(o=>o.clientName))]} value={filterState.orders.client} onChange={v => updateFilter('orders', 'client', v)} />
                  <FilterSelect label="Status" options={['ALL', ...Object.values(TripStatus)]} value={filterState.orders.status} onChange={v => updateFilter('orders', 'status', v)} />
                  <FilterSelect label="Site" options={['ALL', ...new Set(orders.map(o=>o.projectSite))]} value={filterState.orders.site} onChange={v => updateFilter('orders', 'site', v)} />
                  <FilterInput label="Search Order" type="text" value={filterState.orders.search} onChange={v => updateFilter('orders', 'search', v)} />
                </>
              )}

              {activeReport === 'automated' && (
                <>
                  <FilterSelect label="Frequency" options={['DAILY', 'WEEKLY', 'MONTHLY']} value={filterState.automated.type} onChange={v => updateFilter('automated', 'type', v)} />
                  <FilterInput label="Base Date" type="date" value={filterState.automated.date} onChange={v => updateFilter('automated', 'date', v)} />
                  <div className="flex flex-col gap-1.5 col-span-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Actions</label>
                     <div className="flex gap-2">
                        <button 
                          onClick={exportAutomatedPDF}
                          className="flex-1 bg-blue-600 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                           <FileDown size={14} /> PDF 
                        </button>
                        <button 
                          onClick={() => exportToCSV(automatedIntelligence.filteredOrders, `Report_${filterState.automated.type}_${filterState.automated.date}`)}
                          className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                           <FileSpreadsheet size={14} /> CSV
                        </button>
                     </div>
                  </div>
                </>
              )}
           </div>
        </div>

        {/* 10-Chart Dynamic Visualization Deck */}
        <div className="flex-1 p-12 overflow-y-auto no-scrollbar space-y-16">
           
           {/* SECTION: TRIPS INTELLIGENCE */}
           {activeReport === 'trips' && (
             <div className="space-y-16 animate-in zoom-in-95 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="1. Payload Tonnage Flow (MT)" icon={Zap}><AreaChart data={orders.map(o=>({n: o.pickupDate, v: o.quantity}))}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="n" hide/><YAxis fontSize={10}/><Tooltip/><Area type="monotone" dataKey="v" fill="#2563eb33" stroke="#2563eb" strokeWidth={3}/></AreaChart></ChartBox>
                   <ChartBox title="2. Station-wise Throughput" icon={MapPin}><BarChart data={orders.map(o=>({n: o.projectSite, v: o.quantity}))}><XAxis dataKey="n" fontSize={8}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="v" fill="#6366f1" radius={[8,8,0,0]}/></BarChart></ChartBox>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <ChartBox title="3. Status Funnel" icon={Layers}><FunnelChart><Tooltip/><Funnel data={[{v: 100, n: 'Assigned'}, {v: 80, n: 'Picked'}, {v: 60, n: 'Delivered'}]} dataKey="v"><LabelList position="right" fill="#888" dataKey="n" /></Funnel></FunnelChart></ChartBox>
                   <ChartBox title="4. Asset Efficiency Index" icon={Activity}><RadarChart cx="50%" cy="50%" outerRadius="80%" data={[{s: 'Fuel', a: 80}, {s: 'KM', a: 60}, {s: 'MT', a: 90}]}><PolarGrid/><PolarAngleAxis dataKey="s" fontSize={10}/><Radar dataKey="a" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3}/></RadarChart></ChartBox>
                   <ChartBox title="5. Trip Velocity (%)" icon={Gauge}><RadialBarChart innerRadius="10%" outerRadius="80%" barSize={10} data={[{name: 'Target', uv: 100, fill: '#8884d8'}, {name: 'Actual', uv: 75, fill: '#83a6ed'}]}><RadialBar background dataKey="uv" /></RadialBarChart></ChartBox>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="6. Distance vs Quantity Correlation" icon={Target}><ScatterChart><XAxis dataKey="x" unit="MT"/><YAxis dataKey="y" unit="KM"/><Tooltip/><Scatter data={orders.map(o=>({x: o.quantity, y: o.totalKm || 0}))} fill="#10b981"/></ScatterChart></ChartBox>
                   <ChartBox title="7. Monthly Trip Frequency" icon={BarChart3}><ComposedChart data={orders.map(o=>({n: o.pickupDate, v: 1}))}><XAxis dataKey="n" hide/><YAxis/><Tooltip/><Bar dataKey="v" fill="#f59e0b"/><Line type="monotone" dataKey="v" stroke="#ef4444"/></ComposedChart></ChartBox>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <ChartBox title="8. Driver Load Distribution" icon={User}><BarChart data={tripIntelligence.tripsByDriver}><XAxis dataKey="name" fontSize={8}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="trips" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart></ChartBox>
                   <ChartBox title="9. Fleet Utilization Matrix" icon={TruckIcon}><BarChart data={tripIntelligence.tripsByTruck}><XAxis dataKey="name" fontSize={8}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="trips" fill="#06b6d4" radius={[4,4,0,0]}/></BarChart></ChartBox>
                   <ChartBox title="10. Source Distribution" icon={Globe}><PieChart><Pie data={tripIntelligence.sourceDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/><Legend/></PieChart></ChartBox>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="11. Weight Category Analysis" icon={Layers}><BarChart data={tripIntelligence.weightRanges}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="count" fill="#ec4899" radius={[8,8,0,0]}/></BarChart></ChartBox>
                   <ChartBox title="12. Weekly Load Pattern" icon={Calendar}><LineChart data={tripIntelligence.weeklyActivity}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Line type="monotone" dataKey="trips" stroke="#f97316" strokeWidth={4}/></LineChart></ChartBox>
                </div>
             </div>
           )}

           {/* SECTION: REVENUE AUDIT */}
           {activeReport === 'revenue' && (
             <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <ReportStat label="Cumulative Revenue" value={`₹${(orders.reduce((a,b)=>a+(b.quantity*b.ratePerMT),0) || 0).toLocaleString()}`} icon={IndianRupee} color="blue" />
                   <ReportStat label="GST Liability (Est)" value={`₹${((orders.reduce((a,b)=>a+(b.quantity*b.ratePerMT),0)*0.18) || 0).toLocaleString()}`} icon={ShieldCheck} color="green" />
                   <ReportStat label="Active Contracts" value={clients.length} icon={Briefcase} color="indigo" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="13. Billing Trend (Daily)" icon={TrendingUp}><LineChart data={orders.map(o=>({n: o.deliveryDate, v: o.quantity*o.ratePerMT}))}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="n" hide/><YAxis fontSize={10}/><Tooltip/><Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={4} dot={false}/></LineChart></ChartBox>
                   <ChartBox title="14. Client Revenue Concentration" icon={PieChartIcon}><PieChart><Pie data={clients.map(c=>({name: c.name, value: 100}))} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/><Legend/></PieChart></ChartBox>
                </div>
             </div>
           )}

           {/* SECTION: EXPENSE TRACKER */}
           {activeReport === 'expenses' && (
             <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <ChartBox title="15. Operational Burn Rate" icon={TrendingDownIcon}><AreaChart data={expenses.map(e=>({n: e.date, v: e.amount}))}><XAxis dataKey="n" hide/><YAxis fontSize={10}/><Tooltip/><Area type="monotone" dataKey="v" fill="#ef444433" stroke="#ef4444" strokeWidth={3}/></AreaChart></ChartBox>
                   <ChartBox title="16. Expense Segmentation" icon={Layers}><PieChart><Pie data={[{name: 'Diesel', v: 60}, {name: 'Toll', v: 20}, {name: 'Maint', v: 20}]} dataKey="v"><Cell fill="#2563eb"/><Cell fill="#f59e0b"/><Cell fill="#10b981"/></Pie><Tooltip/></PieChart></ChartBox>
                   <ChartBox title="17. Limit Violations Map" icon={AlertCircle}><ScatterChart><XAxis dataKey="x"/><YAxis dataKey="y"/><Tooltip/><Scatter data={expenses.filter(e=>e.isLimitExceeded).map(e=>({x: e.amount, y: 1}))} fill="#ef4444"/></ScatterChart></ChartBox>
                </div>
             </div>
           )}

           {/* SECTION: PLANT HUB ANALYTICS */}
           {activeReport === 'planthub' && (
             <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <ReportStat 
                      label="Total Lifetime Advance" 
                      value={`₹${(pool.reduce((a,b)=>a+b.amount, 0) || 0).toLocaleString()}`} 
                      icon={Banknote} 
                      color="blue" 
                   />
                   <ReportStat 
                      label="Total Utilized" 
                      value={`₹${(plantAdvances.filter(a=>a.status === 'UTILIZED').reduce((a,b)=>a+b.amount, 0) || 0).toLocaleString()}`} 
                      icon={Zap} 
                      color="amber" 
                   />
                   <ReportStat 
                      label="Remaining Advance Balance" 
                      value={`₹${((pool.reduce((a,b)=>a+b.amount, 0) - plantAdvances.filter(a=>a.status === 'UTILIZED').reduce((a,b)=>a+b.amount, 0)) || 0).toLocaleString()}`} 
                      icon={ShieldCheck} 
                      color="green" 
                   />
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                   <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-[#F5F4F0]/30">
                      <div className="flex items-center gap-3">
                         <FileText size={20} className="text-blue-600" />
                         <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Lifetime Advance Ledger (Credits)</h4>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                               type="text" 
                               placeholder="Search Credits..." 
                               value={filterState.planthub.search}
                               onChange={e => updateFilter('planthub', 'search', e.target.value)}
                               className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64" 
                            />
                         </div>
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-[#F5F4F0]/50">
                               <th className="px-10 py-5 t-label">Date</th>
                               <th className="px-10 py-5 t-label">Source Station</th>
                               <th className="px-10 py-5 t-label">Responsible Employee</th>
                               <th className="px-10 py-5 t-label">Reference No</th>
                               <th className="px-10 py-5 t-label text-right">Credit Amount</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {pool.filter(p => !filterState.planthub.search || p.referenceNo.toLowerCase().includes(filterState.planthub.search.toLowerCase())).map((p) => {
                               const station = sites.find(s => s.id === p.stationId);
                               return (
                                  <tr key={p.id} className="hover:bg-[#F5F4F0]/80 transition-colors group">
                                     <td className="px-10 py-5 text-[11px] font-bold text-slate-600">{p.date}</td>
                                     <td className="px-10 py-5 text-[11px] font-black text-slate-900">{station?.name || 'Unknown'}</td>
                                     <td className="px-10 py-5 text-[11px] font-bold text-slate-600">{p.employeeName || 'N/A'}</td>
                                     <td className="px-10 py-5 text-[11px] font-bold text-blue-600">#{p.referenceNo}</td>
                                     <td className="px-10 py-5 text-right font-black text-slate-900">₹{(p.amount || 0).toLocaleString()}</td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="Station-wise Advance Pool" icon={MapPin}>
                      <BarChart data={sites.filter(s=>s.type==='TPS').map(s=>({ name: s.name, value: pool.filter(p=>p.stationId===s.id).reduce((a,b)=>a+b.amount,0) })).filter(d=>d.value>0)}>
                         <XAxis dataKey="name" fontSize={10}/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Bar dataKey="value" fill="#2563eb" radius={[8,8,0,0]}/>
                      </BarChart>
                   </ChartBox>
                   <ChartBox title="Advance Utilization Mix" icon={PieChartIcon}>
                      <PieChart>
                         <Pie 
                            data={[
                               { name: 'Utilized', value: plantAdvances.filter(a=>a.status==='UTILIZED').length },
                               { name: 'Pending', value: plantAdvances.filter(a=>a.status==='PENDING').length }
                            ]} 
                            innerRadius={60} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                         >
                            <Cell fill="#10b981"/><Cell fill="#f59e0b"/>
                         </Pie>
                         <Tooltip/><Legend/>
                      </PieChart>
                   </ChartBox>
                </div>
             </div>
           )}

           {/* SECTION: TRANSPORT ORDERS ANALYTICS */}
           {activeReport === 'orders' && (
             <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <ReportStat 
                      label="Total Transport Orders" 
                      value={orders.length} 
                      icon={FileText} 
                      color="blue" 
                   />
                   <ReportStat 
                      label="Total Weight (MT)" 
                      value={`${(orders.reduce((a,b)=>a+b.quantity, 0) || 0).toLocaleString()} MT`} 
                      icon={Package} 
                      color="green" 
                   />
                   <ReportStat 
                      label="Average Rate / MT" 
                      value={`₹${(orders.length > 0 ? orders.reduce((a,b)=>a+b.ratePerMT, 0)/orders.length : 0).toFixed(2)}`} 
                      icon={Activity} 
                      color="indigo" 
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                   <ReportStat 
                      label="Delivered Trips" 
                      value={orders.filter(o=>o.status === TripStatus.DELIVERED || o.status === TripStatus.INVOICED || o.status === TripStatus.PAID).length} 
                      icon={ShieldCheck} 
                      color="green" 
                   />
                   <ReportStat 
                      label="In Transit" 
                      value={orders.filter(o=>o.status === TripStatus.PICKED).length} 
                      icon={TruckIcon} 
                      color="blue" 
                   />
                   <ReportStat 
                      label="Pending Assignment" 
                      value={orders.filter(o=>o.status === TripStatus.CREATED).length} 
                      icon={Clock} 
                      color="amber" 
                   />
                   <ReportStat 
                      label="Revenue Potential" 
                      value={`₹${(orders.reduce((a,b)=>a+(b.quantity * b.ratePerMT), 0) || 0).toLocaleString()}`} 
                      icon={IndianRupee} 
                      color="indigo" 
                   />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="Order Volume Trend (MT)" icon={TrendingUp}>
                      <AreaChart data={orders.sort((a,b)=>new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()).map(o=>({n: o.pickupDate, v: o.quantity}))}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                         <XAxis dataKey="n" hide/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Area type="monotone" dataKey="v" fill="#2563eb33" stroke="#2563eb" strokeWidth={3}/>
                      </AreaChart>
                   </ChartBox>
                   <ChartBox title="Client Order Concentration" icon={PieChartIcon}>
                      <PieChart>
                         <Pie 
                            data={Array.from(new Set(orders.map(o=>o.clientName))).map(client => ({
                               name: client,
                               value: orders.filter(o=>o.clientName === client).length
                            }))} 
                            innerRadius={60} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                         >
                            {COLORS.map((c,i)=><Cell key={i} fill={c}/>)}
                         </Pie>
                         <Tooltip/><Legend/>
                      </PieChart>
                   </ChartBox>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <ChartBox title="Status Distribution" icon={ShieldCheck}>
                      <BarChart data={Object.values(TripStatus).map(s=>({ name: s, value: orders.filter(o=>o.status === s).length }))}>
                         <XAxis dataKey="name" fontSize={8}/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]}/>
                      </BarChart>
                   </ChartBox>
                   <ChartBox title="Site Utilization Volume" icon={MapPin}>
                      <BarChart data={Array.from(new Set(orders.map(o=>o.projectSite))).slice(0, 5).map((site: any) => ({
                         name: String(site || '').split(' ').slice(0, 2).join(' '),
                         value: orders.filter(o=>o.projectSite === site).reduce((a,b)=>a+b.quantity, 0)
                      }))}>
                         <XAxis dataKey="name" fontSize={8}/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]}/>
                      </BarChart>
                   </ChartBox>
                   <ChartBox title="Weekly Order Velocity" icon={Calendar}>
                      <LineChart data={tripIntelligence.weeklyActivity}>
                         <CartesianGrid strokeDasharray="3 3"/>
                         <XAxis dataKey="day" fontSize={10}/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Line type="monotone" dataKey="trips" stroke="#8b5cf6" strokeWidth={4}/>
                      </LineChart>
                   </ChartBox>
                </div>
             </div>
           )}

           {/* SECTION: AUTOMATED PERFORMANCE RECAP */}
           {activeReport === 'automated' && (
             <div className="space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center justify-between">
                   <div>
                      <h3 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tighter">Automated Performance Recap</h3>
                      <p className="text-slate-500 font-medium">Consolidated view of {filterState.automated.type.toLowerCase()} metrics from {automatedIntelligence.startDate.toLocaleDateString()} to {automatedIntelligence.endDate.toLocaleDateString()}</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="px-6 py-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                         <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Audit Ready Dataset</span>
                      </div>
                   </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                   <ReportStat label="Tonnage Handled" value={`${automatedIntelligence.totalTonnage.toLocaleString()} MT`} icon={Package} color="blue" />
                   <ReportStat label="Trip Success Rate" value={`${automatedIntelligence.deliveryRate.toFixed(1)}%`} icon={CheckCircle2} color="green" />
                   <ReportStat label="Fuel Burn (L)" value={`${automatedIntelligence.totalFuelLiters.toLocaleString()} L`} icon={Zap} color="amber" />
                   <ReportStat label="Net Profit (Est)" value={`₹${automatedIntelligence.netProfit.toLocaleString()}`} icon={IndianRupee} color="indigo" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ChartBox title="Operational Efficiency Trend" icon={TrendingUp}>
                      <ComposedChart data={automatedIntelligence.filteredOrders.map(o=>({ n: o.pickupDate, v: o.quantity }))}>
                         <XAxis dataKey="n" hide/>
                         <YAxis fontSize={10}/>
                         <Tooltip/>
                         <Area type="monotone" dataKey="v" fill="#2563eb33" stroke="#2563eb" strokeWidth={3}/>
                         <Bar dataKey="v" barSize={20} fill="#6366f133" />
                      </ComposedChart>
                   </ChartBox>
                   <ChartBox title="Financial Summary Mix" icon={PieChartIcon}>
                      <PieChart>
                         <Pie 
                            data={[
                               { name: 'Revenue', value: automatedIntelligence.revenue },
                               { name: 'Expenses', value: automatedIntelligence.totalExpenses }
                            ]} 
                            innerRadius={60} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                         >
                            <Cell fill="#10b981"/><Cell fill="#ef4444"/>
                         </Pie>
                         <Tooltip/><Legend/>
                      </PieChart>
                   </ChartBox>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[500px]">
                      <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-[#F5F4F0]/30">
                         <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <TruckIcon size={18} className="text-blue-600"/> Top Asset Utilization
                         </h4>
                         <span className="text-[10px] font-bold text-slate-400">By MT Handled</span>
                      </div>
                      <div className="flex-1 overflow-y-auto no-scrollbar">
                         <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#F5F4F0] z-10">
                               <tr>
                                  <th className="px-10 py-4 t-label">Truck Number</th>
                                  <th className="px-10 py-4 t-label">Trips</th>
                                  <th className="px-10 py-4 t-label text-right">Tonnage (MT)</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {automatedIntelligence.truckPerformance.map(t => (
                                  <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                                     <td className="px-10 py-5 text-[11px] font-black text-slate-900">{t.number}</td>
                                     <td className="px-10 py-5 text-[11px] font-bold text-slate-600">{t.trips} Trips</td>
                                     <td className="px-10 py-5 text-[11px] font-black text-slate-900 text-right">{t.tonnage.toLocaleString()} MT</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-10 h-[500px]">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                            <User size={20}/>
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Top Performance</h4>
                            <p className="text-[10px] font-bold text-slate-400">Driver Matrix</p>
                         </div>
                      </div>
                      <div className="space-y-6 flex-1">
                         {automatedIntelligence.driverPerfs.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="text-xs font-black text-slate-300">#0{i+1}</div>
                                  <div>
                                     <div className="text-xs font-black text-slate-900">{d.name}</div>
                                     <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.trips} Trips Completed</div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="text-xs font-black text-blue-600">{d.score}</div>
                                  <TrendingUp size={12} className="text-blue-500" />
                                </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:rotate-45 transition-transform duration-1000"><ShieldCheck size={300}/></div>
                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="flex-1">
                         <h4 className="text-4xl font-black tracking-tighter mb-4">Export Performance Intelligence</h4>
                         <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">Generate a cryptographically timestamped PDF audit trail of all logistics operations, including fuel burn and tonnage summaries for the selected period.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                         <button 
                          onClick={exportAutomatedPDF}
                          className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                         >
                            <FileDown size={20} /> Generate PDF Audit
                         </button>
                         <button 
                          onClick={() => exportToCSV(automatedIntelligence.filteredOrders, `Full_Dataset_${filterState.automated.type}`)}
                          className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                         >
                            <FileSpreadsheet size={20} /> Export Raw CSV
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* SECTION: BROKERAGE INTELLIGENCE */}
           {activeReport === 'brokers' && (
             <div className="space-y-16 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <ReportStat label="Total Commission Paid" value={`₹${(orders.reduce((a,b)=>a+(b.totalBrokerCommission || 0), 0) || 0).toLocaleString()}`} icon={IndianRupee} color="amber" />
                  <ReportStat label="Active Brokers" value={brokers.length} icon={User} color="blue" />
                  <ReportStat label="Avg Comm / MT" value={`₹${(orders.length > 0 ? orders.reduce((a,b)=>a+(b.brokerCommissionPerMT || 0), 0) / orders.length : 0).toFixed(2)}`} icon={Activity} color="indigo" />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <ChartBox title="18. Commission Payout Trend" icon={TrendingUp}><AreaChart data={orders.filter(o => o.totalBrokerCommission).map(o=>({n: o.pickupDate, v: o.totalBrokerCommission}))}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="n" hide/><YAxis fontSize={10}/><Tooltip/><Area type="monotone" dataKey="v" fill="#f59e0b33" stroke="#f59e0b" strokeWidth={3}/></AreaChart></ChartBox>
                  <ChartBox title="19. Broker Market Share" icon={PieChartIcon}><PieChart><Pie data={brokers.map(b => ({ name: b.name, value: orders.filter(o => o.brokerId === b.id).reduce((acc, curr) => acc + (curr.totalBrokerCommission || 0), 0) })).filter(d => d.value > 0)} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{COLORS.map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip/><Legend/></PieChart></ChartBox>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <ChartBox title="20. Broker By Total Trips" icon={TruckIcon}><BarChart data={brokerAnalytics.tripsByBroker}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="trips" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ChartBox>
                  <ChartBox title="21. Broker By Client (Comm)" icon={Briefcase}><BarChart data={brokerAnalytics.clientByBroker}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="Adani Power" stackId="a" fill="#2563eb"/><Bar dataKey="GSECL" stackId="a" fill="#10b981"/><Bar dataKey="Adani Infra" stackId="a" fill="#f59e0b"/></BarChart></ChartBox>
                  <ChartBox title="22. Broker By Station (MT)" icon={MapPin}><BarChart data={brokerAnalytics.stationByBroker} layout="vertical"><XAxis type="number" fontSize={10}/><YAxis dataKey="name" type="category" fontSize={10} width={80}/><Tooltip/><Bar dataKey="Mundra" stackId="b" fill="#8b5cf6"/><Bar dataKey="Hazira" stackId="b" fill="#ec4899"/><Bar dataKey="Sikka" stackId="b" fill="#06b6d4"/></BarChart></ChartBox>
               </div>
               <div className="grid grid-cols-1 gap-10">
                  <ChartBox title="23. Broker Volume Analysis (MT)" icon={BarChart3}><BarChart data={brokers.map(b => ({ name: b.name, volume: orders.filter(o => o.brokerId === b.id).reduce((acc, curr) => acc + curr.quantity, 0) })).filter(d => d.volume > 0)}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="volume" fill="#2563eb" radius={[8,8,0,0]}/></BarChart></ChartBox>
               </div>

               {/* Broker Transaction Ledger */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-[#F5F4F0]/30">
                     <div className="flex items-center gap-3">
                        <FileText size={20} className="text-blue-600" />
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Brokerage Transaction Ledger</h4>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                           <input type="text" placeholder="Search Ledger..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20 w-64" />
                        </div>
                        <button className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-colors shadow-sm"><Download size={14}/></button>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-[#F5F4F0]/50">
                              <th className="px-10 py-5 t-label">Date</th>
                              <th className="px-10 py-5 t-label">Broker</th>
                              <th className="px-10 py-5 t-label">Client / Site</th>
                              <th className="px-10 py-5 t-label">Weight (MT)</th>
                              <th className="px-10 py-5 t-label text-right">Comm/MT</th>
                              <th className="px-10 py-5 t-label text-right">Total Comm</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {brokerAnalytics.brokerOrders.slice(0, 10).map((order) => (
                              <tr key={order.id} className="hover:bg-[#F5F4F0]/80 transition-colors group">
                                 <td className="px-10 py-5 text-[11px] font-bold text-slate-600">{order.pickupDate}</td>
                                 <td className="px-10 py-5">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-black">
                                          {order.brokerName?.charAt(0)}
                                       </div>
                                       <span className="text-[11px] font-black text-slate-900">{order.brokerName}</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-5">
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black text-slate-900">{order.clientName}</span>
                                       <span className="text-[9px] font-bold text-slate-400">{order.projectSite}</span>
                                    </div>
                                 </td>
                                 <td className="px-10 py-5 text-[11px] font-black text-slate-900">{order.quantity} MT</td>
                                 <td className="px-10 py-5 text-[11px] font-black text-slate-900 text-right">₹{order.brokerCommissionPerMT}</td>
                                 <td className="px-10 py-5 text-right">
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black">
                                       ₹{(order.totalBrokerCommission || 0).toLocaleString()}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="px-10 py-6 bg-[#F5F4F0]/30 border-t border-slate-50 flex items-center justify-between">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing last 10 transactions</p>
                     <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Full Ledger</button>
                  </div>
               </div>
             </div>
           )}

           {/* Additional sections for Payroll, Invoices, Fleet would follow similar patterns with unique charts */}
           <div className="bg-slate-900 rounded-2xl p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Globe size={240}/></div>
              <div className="relative z-10 max-w-xl">
                 <h4 className="text-3xl font-black tracking-tighter mb-4">Export Strategic Dataset</h4>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed">Consolidate all filtered data points into an audit-ready format. Includes CSV, PDF, and Raw JSON options for ERP integration.</p>
              </div>
              <div className="relative z-10 flex gap-4">
                 <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-widest text-xs">
                    <FileSpreadsheet size={20} /> Download CSV
                 </button>
                 <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-500 transition-all flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Printer size={20} /> Print Report
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const FilterInput: React.FC<{ label: string, type: string, value: any, onChange: (v: string) => void }> = ({ label, type, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#E7E5E0] rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all shadow-sm"
    />
  </div>
);

const FilterSelect: React.FC<{ label: string, options: string[], value: string, onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-[#E7E5E0] rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all shadow-sm"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
    </select>
  </div>
);

const ChartBox: React.FC<{ title: string, icon: any, children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-50 shadow-sm flex flex-col group hover:shadow-xl hover:border-blue-100 transition-all duration-500 h-[450px]">
    <div className="flex items-center justify-between mb-8">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F4F0] text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
             <Icon size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h4>
       </div>
       <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><MousePointer2 size={18}/></button>
    </div>
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  </div>
);

const ReportStat: React.FC<{ label: string, value: string | number, icon: any, color: string }> = ({ label, value, icon: Icon, color }) => {
   const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      green: 'bg-green-50 text-green-600',
      amber: 'bg-amber-50 text-amber-600',
      red: 'bg-red-50 text-red-600'
   };
   return (
      <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6 group hover:-translate-y-2 transition-all cursor-default">
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${colors[color]}`}>
            <Icon size={28} />
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</p>
            <p className="text-2xl font-black text-[#1C1917] tracking-tight mt-1 tracking-tighter">{value}</p>
         </div>
      </div>
   );
};

const TrendingDownIcon = ({ size, className }: { size?: number, className?: string }) => <div className={className}><Activity size={size} /></div>;

export default ReportsView;
