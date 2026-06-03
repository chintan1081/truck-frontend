
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ArrowUpRight,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  Building2,
  Truck as TruckIcon,
  Trash2,
  Edit,
  X,
  FilterX,
  FileDown,
  Percent
} from 'lucide-react';
import { Order, Truck, TripStatus, AppSettings } from '../types';
import { SearchableSelect } from '../components/SearchableSelect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransportOrdersViewProps {
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  fleet: Truck[];
  settings: AppSettings;
}

const TransportOrdersView: React.FC<TransportOrdersViewProps> = ({ orders, onUpdateOrders, fleet, settings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'STATUS' | 'CLIENT' | 'BROKER' | 'TRUCK' | 'SITE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const [filters, setFilters] = useState({
    status: 'ALL',
    client: 'ALL',
    truck: 'ALL',
    broker: 'ALL',
    site: 'ALL',
    datePreset: 'ALL',
    startDate: '',
    endDate: ''
  });

  const clients = useMemo(() => Array.from(new Set(orders.map(o => o.clientName).filter(Boolean))), [orders]);
  const trucksList = useMemo(() => Array.from(new Set(orders.map(o => o.assignedTruckId).filter(Boolean))), [orders]);
  const brokers = useMemo(() => Array.from(new Set(orders.map(o => o.brokerName).filter(Boolean))), [orders]);
  const sites = useMemo(() => Array.from(new Set(orders.map(o => o.projectSite).filter(Boolean))), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = searchQuery.toLowerCase();
      const truck = (fleet || []).find(f => f.id === order.assignedTruckId);
      
      let matchesSearch = true;
      if (query) {
        if (searchCategory === 'ALL') {
          matchesSearch = 
            (order.id || "").toLowerCase().includes(query) ||
            (order.clientName || "").toLowerCase().includes(query) ||
            (order.projectSite || "").toLowerCase().includes(query) ||
            (order.brokerName || "").toLowerCase().includes(query) ||
            (truck?.truckNumber || "").toLowerCase().includes(query) ||
            (order.status || "").toLowerCase().includes(query);
        } else if (searchCategory === 'STATUS') {
          matchesSearch = (order.status || "").toLowerCase().includes(query);
        } else if (searchCategory === 'CLIENT') {
          matchesSearch = (order.clientName || "").toLowerCase().includes(query);
        } else if (searchCategory === 'BROKER') {
          matchesSearch = (order.brokerName || "").toLowerCase().includes(query);
        } else if (searchCategory === 'TRUCK') {
          matchesSearch = (truck?.truckNumber || "").toLowerCase().includes(query);
        } else if (searchCategory === 'SITE') {
          matchesSearch = (order.projectSite || "").toLowerCase().includes(query);
        }
      }
      
      const matchesStatus = filters.status === 'ALL' || order.status === filters.status;
      const matchesClient = filters.client === 'ALL' || order.clientName === filters.client;
      const matchesTruck = filters.truck === 'ALL' || order.assignedTruckId === filters.truck;
      const matchesBroker = filters.broker === 'ALL' || order.brokerName === filters.broker;
      const matchesSite = filters.site === 'ALL' || order.projectSite === filters.site;

      let matchesDates = true;
      const orderDate = new Date(order.pickupDate);
      const now = new Date();

      if (filters.datePreset !== 'ALL' && filters.datePreset !== 'CUSTOM') {
        const start = new Date();
        if (filters.datePreset === 'LAST_1_MONTH') start.setMonth(now.getMonth() - 1);
        else if (filters.datePreset === 'LAST_3_MONTHS') start.setMonth(now.getMonth() - 3);
        else if (filters.datePreset === 'LAST_6_MONTHS') start.setMonth(now.getMonth() - 6);
        else if (filters.datePreset === 'LAST_12_MONTHS') start.setMonth(now.getMonth() - 12);
        
        matchesDates = orderDate >= start && orderDate <= now;
      } else if (filters.datePreset === 'CUSTOM' || (filters.startDate || filters.endDate)) {
        const start = filters.startDate ? new Date(filters.startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = filters.endDate ? new Date(filters.endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        matchesDates = (!start || orderDate >= start) && (!end || orderDate <= end);
      }

      return matchesSearch && matchesStatus && matchesClient && matchesTruck && matchesBroker && matchesSite && matchesDates;
    });
  }, [orders, searchQuery, filters]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const allWeight = filteredOrders.reduce((sum, o) => sum + (o.actualQuantity || o.quantity || 0), 0);
    const completedItems = filteredOrders.filter(o => o.status === TripStatus.DELIVERED || o.status === TripStatus.PAID);
    const completedCount = completedItems.length;
    const activeOrders = filteredOrders.filter(o => o.status !== TripStatus.DELIVERED && o.status !== TripStatus.PAID).length;
    
    // Overall Metrics
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.quantity * o.ratePerMT), 0);
    const totalGST = filteredOrders.reduce((sum, o) => {
      if (o.hasGST && o.gstRate) {
        return sum + (o.quantity * o.ratePerMT * o.gstRate / 100);
      }
      return sum;
    }, 0);
    const totalBrokerage = filteredOrders.reduce((sum, o) => sum + (o.totalBrokerCommission || 0), 0);
    const netRevenue = totalRevenue - totalBrokerage - totalGST;

    // Completed Only Metrics
    const completedWeight = completedItems.reduce((sum, o) => sum + (o.actualQuantity || o.quantity || 0), 0);
    const completedRevenue = completedItems.reduce((sum, o) => sum + (o.quantity * o.ratePerMT), 0);
    const completedGST = completedItems.reduce((sum, o) => {
      if (o.hasGST && o.gstRate) {
        return sum + (o.quantity * o.ratePerMT * o.gstRate / 100);
      }
      return sum;
    }, 0);
    const completedBrokerage = completedItems.reduce((sum, o) => sum + (o.totalBrokerCommission || 0), 0);
    const completedNetRevenue = completedRevenue - completedBrokerage - completedGST;

    return { 
      totalOrders, 
      totalWeight: allWeight, 
      completedOrders: completedCount, 
      activeOrders, 
      totalRevenue, 
      totalGST, 
      totalBrokerage, 
      netRevenue,
      completedWeight,
      completedRevenue,
      completedGST,
      completedBrokerage,
      completedNetRevenue
    };
  }, [filteredOrders]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Page 1: Branding and Metrics ---
    // Branding
    let currentY = 50;
    if (settings.companyLogo) {
      try {
        doc.addImage(settings.companyLogo, 'PNG', 40, currentY - 10, 50, 50);
      } catch (e) {
        console.warn("Logo load failed", e);
      }
    }
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(settings.companyName || 'FlyAsh Logistics Pro', 100, currentY + 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(settings.companyEmail || '', 100, currentY + 18);
    doc.text(settings.companyContact || '', 100, currentY + 30);
    doc.text(settings.companyAddress || '', 100, currentY + 42);

    currentY += 80;
    doc.setDrawColor(226, 232, 240);
    doc.line(40, currentY, pageWidth - 40, currentY);
    
    currentY += 40;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('EXECUTIVE PERFORMANCE REPORT', 40, currentY);
    
    currentY += 20;
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, currentY);
    
    currentY += 30;

    // Summary Stats Helper
    const boxWidth = 120;
    const boxHeight = 60;
    const padding = 15;
    const startX = 40;

    const renderMetricGrid = (title: string, metrics: any[], startY: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(title, 40, startY);
      
      const gridY = startY + 15;
      metrics.forEach((stat, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = startX + (col * (boxWidth + padding));
        const y = gridY + (row * (boxHeight + padding));

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, boxWidth, boxHeight, 10, 10, 'FD');

        doc.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.setLineWidth(3);
        doc.line(x + 8, y + 15, x + 8, y + boxHeight - 15);

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(stat.label, x + 16, y + 22);

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(stat.value, x + 16, y + 45);
      });

      return gridY + (Math.ceil(metrics.length / 4) * (boxHeight + padding)) + 40;
    };

    const generalMetrics = [
      { label: 'TOTAL ORDERS', value: stats.totalOrders.toLocaleString(), color: [37, 99, 235] },
      { label: 'COMPLETED', value: stats.completedOrders.toLocaleString(), color: [22, 163, 74] },
      { label: 'ACTIVE ORDERS', value: stats.activeOrders.toLocaleString(), color: [245, 158, 11] },
      { label: 'TOTAL WEIGHT', value: `${stats.totalWeight.toLocaleString()} MT`, color: [107, 114, 128] },
    ];

    const financialMetrics = [
      { label: 'GROSS REVENUE', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, color: [79, 70, 229] },
      { label: 'TOTAL GST', value: `Rs. ${stats.totalGST.toLocaleString()}`, color: [245, 158, 11] },
      { label: 'TOTAL BROKERAGE', value: `Rs. ${stats.totalBrokerage.toLocaleString()}`, color: [220, 38, 38] },
      { label: 'EST. NET REV', value: `Rs. ${stats.netRevenue.toLocaleString()}`, color: [22, 163, 74] },
    ];

    const realizedMetrics = [
      { label: 'COMPLETED MT', value: `${stats.completedWeight.toLocaleString()} MT`, color: [22, 163, 74] },
      { label: 'REALIZED REVENUE', value: `Rs. ${stats.completedRevenue.toLocaleString()}`, color: [79, 70, 229] },
      { label: 'REALIZED GST', value: `Rs. ${stats.completedGST.toLocaleString()}`, color: [245, 158, 11] },
      { label: 'REALIZED BROK.', value: `Rs. ${stats.completedBrokerage.toLocaleString()}`, color: [220, 38, 38] },
      { label: 'REALIZED NET', value: `Rs. ${stats.completedNetRevenue.toLocaleString()}`, color: [37, 99, 235] },
    ];

    currentY = renderMetricGrid('GENERAL METRICS', generalMetrics, currentY);
    currentY = renderMetricGrid('FINANCIAL OVERVIEW (ALL ORDERS)', financialMetrics, currentY);
    currentY = renderMetricGrid('REALIZED PERFORMANCE (COMPLETED ORDERS)', realizedMetrics, currentY);

    // --- Page 2+: Entries Table ---
    const entriesPerPage = 10;
    const totalPagesEntries = Math.ceil(filteredOrders.length / entriesPerPage);

    for (let p = 0; p < totalPagesEntries; p++) {
      doc.addPage();
      
      // Page Header 2+
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('TRANSPORT ORDERS - DETAILED ENTRIES', 40, 50);
      
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p + 2} of ${totalPagesEntries + 1} | Continuous Log`, 40, 65);
      
      const pageOrders = filteredOrders.slice(p * entriesPerPage, (p + 1) * entriesPerPage);
      const tableData = pageOrders.map(order => {
        const totalValue = order.quantity * order.ratePerMT;
        const gstAmount = order.hasGST && order.gstRate ? (totalValue * order.gstRate / 100) : 0;
        const brokerage = order.totalBrokerCommission || 0;
        const netRevenue = totalValue - brokerage - gstAmount;
        const truckNum = fleet.find(f => f.id === order.assignedTruckId)?.truckNumber || 'N/A';
        
        return [
          order.id.slice(-6),
          order.pickupDate,
          order.clientName,
          order.projectSite,
          truckNum,
          `${order.quantity} MT`,
          totalValue.toLocaleString(),
          gstAmount.toLocaleString(),
          brokerage.toLocaleString(),
          netRevenue.toLocaleString(),
          order.status.replace('_', ' ')
        ];
      });

      autoTable(doc, {
        head: [['ID', 'Date', 'Client', 'Site', 'Truck', 'Qty', 'Value', 'GST', 'Brok.', 'Net', 'Status']],
        body: tableData,
        startY: 80,
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 41, 59], 
          fontSize: 8, 
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 8
        },
        styles: { 
          fontSize: 7, 
          cellPadding: 6,
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right' },
          10: { halign: 'center', fontStyle: 'bold' }
        }
      });
    }

    doc.save(`transport_orders_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <FileText size={32} className="text-blue-600" /> Transport Orders Command
          </h2>
          <p className="text-slate-500 font-medium">Global order management and logistical fulfillment tracking.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={exportToPDF}
             className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
           >
              <FileDown size={18} className="text-red-500" /> Export PDF
           </button>
           <button className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
              <Plus size={18} /> New Transport Order
           </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString()} icon={FileText} color="blue" />
          <StatCard label="Completed Orders" value={stats.completedOrders.toLocaleString()} icon={ShieldCheck} color="green" />
          <StatCard label="Active Orders" value={stats.activeOrders.toLocaleString()} icon={Clock} color="amber" />
          <StatCard label="Total Weight" value={`${stats.totalWeight.toLocaleString()} MT`} icon={Package} color="blue" />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Overview (All Orders)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Gross Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="indigo" />
            <StatCard label="Total GST" value={`₹${stats.totalGST.toLocaleString()}`} icon={Percent} color="indigo" />
            <StatCard label="Total Brokerage" value={`₹${stats.totalBrokerage.toLocaleString()}`} icon={Building2} color="red" />
            <StatCard label="Estimated Net" value={`₹${stats.netRevenue.toLocaleString()}`} icon={ArrowUpRight} color="green" />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Realized Performance (Completed Orders)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Completed Weight" value={`${stats.completedWeight.toLocaleString()} MT`} icon={Package} color="blue" />
            <StatCard label="Realized Gross" value={`₹${stats.completedRevenue.toLocaleString()}`} icon={TrendingUp} color="indigo" />
            <StatCard label="Realized GST" value={`₹${stats.completedGST.toLocaleString()}`} icon={Percent} color="indigo" />
            <StatCard label="Realized Net" value={`₹${stats.completedNetRevenue.toLocaleString()}`} icon={ArrowUpRight} color="green" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <StatCard label="Realized Brokerage" value={`₹${stats.completedBrokerage.toLocaleString()}`} icon={Building2} color="red" />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-2xl flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all">
                <div className="relative flex items-center border-r border-slate-200">
                  <select 
                    value={searchCategory}
                    onChange={e => setSearchCategory(e.target.value as any)}
                    className="pl-4 pr-10 py-3.5 bg-transparent border-none font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none"
                  >
                    <option value="ALL">All Search</option>
                    <option value="STATUS">By Status</option>
                    <option value="CLIENT">By Client</option>
                    <option value="BROKER">By Broker</option>
                    <option value="TRUCK">By Truck</option>
                    <option value="SITE">By Site</option>
                  </select>
                  <div className="absolute right-3 pointer-events-none text-slate-400">
                    <ChevronDown size={12} />
                  </div>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={
                      searchCategory === 'ALL' ? "Search everything..." : 
                      `Search for ${searchCategory.toLowerCase()} value...`
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-transparent border-none font-bold text-sm outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategory('ALL');
                  setFilters({
                    status: 'ALL', 
                    client: 'ALL', 
                    truck: 'ALL', 
                    broker: 'ALL', 
                    site: 'ALL', 
                    datePreset: 'ALL', 
                    startDate: '', 
                    endDate: ''
                  });
                }} 
                className="p-3 text-slate-400 hover:text-red-500 transition-colors" 
                title="Clear All Filters"
              >
                <FilterX size={20}/>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             <SearchableSelect 
               label="Status" 
               value={filters.status} 
               onChange={v => setFilters({...filters, status: v})} 
               options={[
                 { value: 'ALL', label: 'All Statuses' },
                 ...Object.values(TripStatus).map(s => ({ value: s, label: s }))
               ]} 
               variant="slate"
             />
             <SearchableSelect 
               label="Client" 
               value={filters.client} 
               onChange={v => setFilters({...filters, client: v})} 
               options={[
                 { value: 'ALL', label: 'All Clients' },
                 ...clients.map(c => ({ value: c, label: c }))
               ]} 
               variant="slate"
             />
             <SearchableSelect 
               label="Broker" 
               value={filters.broker} 
               onChange={v => setFilters({...filters, broker: v})} 
               options={[
                 { value: 'ALL', label: 'All Brokers' },
                 ...brokers.map(b => ({ value: b, label: b }))
               ]} 
               variant="slate"
             />
             <SearchableSelect 
               label="Truck" 
               value={filters.truck} 
               onChange={v => setFilters({...filters, truck: v})} 
               options={[
                 { value: 'ALL', label: 'All Trucks' },
                 ...trucksList.map(tid => {
                   const t = (fleet || []).find(f => f.id === tid);
                   return { value: tid, label: t?.truckNumber || tid, sub: t?.vehicleType };
                 })
               ]} 
               variant="slate"
             />
             <SearchableSelect 
               label="Site" 
               value={filters.site} 
               onChange={v => setFilters({...filters, site: v})} 
               options={[
                 { value: 'ALL', label: 'All Sites' },
                 ...sites.map(s => ({ value: s, label: s }))
               ]} 
               variant="slate"
             />
             <SearchableSelect 
               label="Date Range" 
               value={filters.datePreset} 
               onChange={v => setFilters({...filters, datePreset: v, startDate: '', endDate: ''})} 
               options={[
                 { value: 'ALL', label: 'All Time' },
                 { value: 'LAST_1_MONTH', label: 'Last Month' },
                 { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
                 { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
                 { value: 'LAST_12_MONTHS', label: 'Last Year' },
                 { value: 'CUSTOM', label: 'Custom Range' }
               ]} 
               variant="slate"
             />
          </div>

          {filters.datePreset === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">From Date</label>
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">To Date</label>
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup Date</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Est. Delivery</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Client & Site</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Asset Details</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Value (₹)</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">GST (₹)</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Broker Name</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Brokerage Paid</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Net Revenue</th>
                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-4 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedOrders.map(order => {
                const totalValue = order.quantity * order.ratePerMT;
                const gstAmount = order.hasGST && order.gstRate ? (totalValue * order.gstRate / 100) : 0;
                const brokerage = order.totalBrokerCommission || 0;
                const netRevenue = totalValue - brokerage - gstAmount;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group text-[11px]">
                    <td className="px-4 py-6">
                      <p className="font-black text-blue-600 font-mono tracking-tighter">#{order.id.slice(-6)}</p>
                    </td>
                    <td className="px-4 py-6 font-bold text-slate-600">
                      {order.pickupDate}
                    </td>
                    <td className="px-4 py-6 text-center font-bold text-slate-400">
                      {order.deliveryDate || 'TBD'}
                    </td>
                    <td className="px-4 py-6">
                      <p className="font-black text-slate-900">{order.clientName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1 truncate max-w-[120px]"><MapPin size={10}/> {order.projectSite}</p>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <TruckIcon size={14} className="text-slate-300 mb-1" />
                        <span className="font-black text-slate-700">{(fleet || []).find(t => t.id === order.assignedTruckId)?.truckNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-right">
                      <p className="font-black text-slate-900 tracking-tighter">₹{totalValue.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">({order.quantity} MT)</p>
                    </td>
                    <td className="px-4 py-6 text-right">
                      <p className="font-black text-amber-600 tracking-tighter">₹{gstAmount.toLocaleString()}</p>
                      {order.hasGST && <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{order.gstRate}% GST</p>}
                    </td>
                    <td className="px-4 py-6 text-center">
                      <p className="font-bold text-indigo-600 uppercase tracking-tighter">{order.brokerName || 'Direct'}</p>
                    </td>
                    <td className="px-4 py-6 text-right">
                      <p className="font-black text-red-500 tracking-tighter">₹{brokerage.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-6 text-right">
                      <p className="font-black text-green-600 tracking-tighter">₹{netRevenue.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-6 text-center">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-6 text-right">
                       <button className="p-2 text-slate-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"><ChevronRight size={18}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {paginatedOrders.length} of {filteredOrders.length} Orders</p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 py-3 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
               {Array.from({length: Math.min(5, totalPages)}, (_, i) => (
                 <button 
                   key={i} 
                   onClick={() => setCurrentPage(i + 1)}
                   className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-400'}`}
                 >
                   {i + 1}
                 </button>
               ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 py-3 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
  const colors: Record<string, string> = { 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100', 
    green: 'bg-green-50 text-green-600 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };
  return (
    <div className={`p-8 bg-white rounded-[2.5rem] border shadow-sm ${colors[color]} flex flex-col gap-6`}>
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${colors[color]}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</p>
       </div>
    </div>
  );
};

const getStatusStyles = (status: TripStatus) => {
  switch (status) {
    case TripStatus.PAID: return 'bg-green-50 text-green-600 border-green-200';
    case TripStatus.DELIVERED: return 'bg-blue-50 text-blue-600 border-blue-200';
    case TripStatus.INVOICED: return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    case TripStatus.PICKED: return 'bg-amber-50 text-amber-600 border-amber-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

export default TransportOrdersView;
