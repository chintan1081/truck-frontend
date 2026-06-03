
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  IndianRupee, 
  Calendar, 
  Wrench, 
  TrendingUp, 
  PieChart, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Filter,
  Banknote, 
  Trash2, 
  Edit, 
  ChevronRight, 
  ChevronLeft,
  Truck as TruckIcon, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  CreditCard,
  Building2,
  Hammer,
  Gauge,
  History,
  Info,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { Truck, TruckEMI, MaintenanceExpense, Expense, Invoice, Order, Employee, AppSettings } from '../types';
import { SearchableSelect } from '../components/SearchableSelect';
import { jsPDF } from 'jspdf';

interface FleetFinanceViewProps {
  fleet: Truck[];
  emis: TruckEMI[];
  maintenance: MaintenanceExpense[];
  expenses: Expense[];
  invoices: Invoice[];
  orders: Order[];
  employees: Employee[];
  settings?: AppSettings;
  onUpdateEmis: (emis: TruckEMI[]) => void;
  onUpdateMaintenance: (maint: MaintenanceExpense[]) => void;
}

const getLoanCompletionDate = (startDateStr: string, tenureMonths: number): string => {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  // Add tenure months to startDate
  date.setMonth(date.getMonth() + Number(tenureMonths));
  return date.toISOString().split('T')[0];
};

const FleetFinanceView: React.FC<FleetFinanceViewProps> = ({ 
  fleet, emis, maintenance, expenses, invoices, orders, employees, settings, onUpdateEmis, onUpdateMaintenance 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emis' | 'maintenance'>('dashboard');
  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);
  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  const [deleteEmiTarget, setDeleteEmiTarget] = useState<string | null>(null);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintPage, setMaintPage] = useState(1);
  const [dashboardPage, setDashboardPage] = useState(1);
  const rowsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [dbFilters, setDbFilters] = useState({
    truckId: '',
    bankName: '',
    completionStart: '',
    completionEnd: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [maintFilters, setMaintFilters] = useState({
    status: 'ALL',
    employeeId: '',
    startDate: '',
    endDate: '',
    serviceStartDate: '',
    serviceEndDate: '',
    dueStartDate: '',
    dueEndDate: '',
    paidStartDate: '',
    paidEndDate: ''
  });

  // Form States
  const [emiForm, setEmiForm] = useState<Partial<TruckEMI>>({
    truckId: '', 
    bankName: '', 
    amount: 0, 
    dueDate: 5, 
    startDate: new Date().toISOString().split('T')[0], 
    tenureMonths: 48, 
    paidInstallments: 0, 
    totalLoanAmount: 0, 
    status: 'ACTIVE',
    loanType: 'FIXED'
  });
  
  const [maintForm, setMaintForm] = useState<Partial<MaintenanceExpense>>({
    truckId: '', 
    employeeId: '',
    date: new Date().toISOString().split('T')[0], 
    serviceDate: new Date().toISOString().split('T')[0],
    category: 'ROUTINE', 
    description: '', 
    amount: 0, 
    workshopName: '', 
    odometerReading: 0, 
    partsReplaced: [],
    status: 'UNPAID',
    paidDate: '',
    dueDate: ''
  });

  const filteredEmis = useMemo(() => emis.filter(e => {
    const truck = (fleet || []).find(t => t.id === e.truckId);
    return (
      (truck?.truckNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.bankName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }), [emis, searchQuery, fleet]);

  const filteredMaint = useMemo(() => maintenance.filter(m => {
    const truck = (fleet || []).find(t => t.id === m.truckId);
    const employee = (employees || []).find(e => e.id === m.employeeId);
    
    // Search matches
    const matchesSearch = !searchQuery || [
        truck?.truckNumber,
        m.workshopName,
        m.description,
        employee?.fullName
    ].some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Advanced Filters
    if (maintFilters.status !== 'ALL' && m.status !== maintFilters.status) return false;
    if (maintFilters.employeeId && m.employeeId !== maintFilters.employeeId) return false;
    
    // Date Range Helpers
    const dateInRange = (dateStr: string, start: string, end: string) => {
        if (!dateStr) return false;
        if (start && dateStr < start) return false;
        if (end && dateStr > end) return false;
        return true;
    };

    if (!dateInRange(m.date, maintFilters.startDate, maintFilters.endDate)) return false;
    if (!dateInRange(m.serviceDate, maintFilters.serviceStartDate, maintFilters.serviceEndDate)) return false;
    
    if (m.status === 'UNPAID' && maintFilters.dueStartDate || maintFilters.dueEndDate) {
        if (!dateInRange(m.dueDate || '', maintFilters.dueStartDate, maintFilters.dueEndDate)) return false;
    }
    
    if (m.status === 'PAID' && maintFilters.paidStartDate || maintFilters.paidEndDate) {
        if (!dateInRange(m.paidDate || '', maintFilters.paidStartDate, maintFilters.paidEndDate)) return false;
    }

    return true;
  }), [maintenance, searchQuery, fleet, employees, maintFilters]);

  useEffect(() => { setMaintPage(1); }, [maintFilters, searchQuery]);
  useEffect(() => { setDashboardPage(1); }, [dbFilters]);

  const uniqueFinanciers = useMemo(() => {
    return Array.from(new Set(emis.map(e => e.bankName).filter(Boolean)));
  }, [emis]);

  const filteredDbEmis = useMemo(() => {
    return emis.filter(e => {
      if (dbFilters.truckId && e.truckId !== dbFilters.truckId) return false;
      if (dbFilters.bankName && e.bankName !== dbFilters.bankName) return false;
      
      const completionDate = getLoanCompletionDate(e.startDate, e.tenureMonths);
      if (dbFilters.completionStart && completionDate < dbFilters.completionStart) return false;
      if (dbFilters.completionEnd && completionDate > dbFilters.completionEnd) return false;

      return true;
    });
  }, [emis, dbFilters]);

  const totalDashboardPages = Math.ceil(filteredDbEmis.length / rowsPerPage);

  const isFiltered = !!(dbFilters.truckId || dbFilters.bankName || dbFilters.completionStart || dbFilters.completionEnd);

  const filteredStatsLeft = useMemo(() => {
    const hasDateFilter = !!(dbFilters.completionStart || dbFilters.completionEnd);
    const filteredActiveEmis = filteredDbEmis.filter(e => e.status === 'ACTIVE');
    const filteredClosedEmis = filteredDbEmis.filter(e => e.status === 'CLOSED');

    const totalLoanPrincipalLeft = filteredDbEmis.reduce((sum, e) => {
      if (e.status === 'CLOSED') return sum;
      const remainingMonths = e.tenureMonths - e.paidInstallments;
      return sum + (e.totalLoanAmount * (remainingMonths / e.tenureMonths));
    }, 0);

    const completedLoansList = hasDateFilter ? filteredDbEmis : filteredClosedEmis;
    const totalFleetsLoanCompleted = completedLoansList.length;
    const completedAmountValue = completedLoansList.reduce((sum, e) => sum + e.totalLoanAmount, 0);

    const totalFleetsLoanLeft = filteredActiveEmis.length;

    return {
      totalLoanPrincipalLeft,
      totalFleetsLoanCompleted,
      completedAmountValue,
      totalFleetsLoanLeft
    };
  }, [filteredDbEmis, dbFilters.completionStart, dbFilters.completionEnd]);

  const paginatedDbEmis = useMemo(() => {
    return filteredDbEmis.slice((dashboardPage - 1) * rowsPerPage, dashboardPage * rowsPerPage);
  }, [filteredDbEmis, dashboardPage]);

  const paginatedMaint = useMemo(() => {
    return filteredMaint.slice((maintPage - 1) * rowsPerPage, maintPage * rowsPerPage);
  }, [filteredMaint, maintPage]);

  const totalMaintPages = Math.ceil(filteredMaint.length / rowsPerPage);

  const maintStats = useMemo(() => {
    const paid = maintenance.filter(m => m.status === 'PAID');
    const unpaid = maintenance.filter(m => m.status === 'UNPAID');
    
    return {
        paidCount: paid.length,
        paidTotal: paid.reduce((sum, m) => sum + m.amount, 0),
        unpaidCount: unpaid.length,
        unpaidTotal: unpaid.reduce((sum, m) => sum + m.amount, 0)
    };
  }, [maintenance]);

  const stats = useMemo(() => {
    const activeEmis = emis.filter(e => e.status === 'ACTIVE');
    const closedEmis = emis.filter(e => e.status === 'CLOSED');
    const totalEmiCommitment = activeEmis.reduce((sum, e) => sum + e.amount, 0);
    const totalMaintCost = maintenance.reduce((sum, m) => sum + m.amount, 0);
    const totalMaintPaid = maintenance.filter(m => m.status === 'PAID').reduce((sum, m) => sum + m.amount, 0);
    const totalMaintUnpaid = maintenance.filter(m => m.status === 'UNPAID').reduce((sum, m) => sum + m.amount, 0);
    const totalDebtRemaining = emis.reduce((sum, e) => {
      const remainingMonths = e.tenureMonths - e.paidInstallments;
      return sum + (remainingMonths * e.amount);
    }, 0);
    
    const totalFleetInvestment = emis.reduce((sum, e) => sum + e.totalLoanAmount, 0) + totalMaintCost;

    // Total Loan Principal left
    const totalLoanPrincipalLeft = emis.reduce((sum, e) => {
      if (e.status === 'CLOSED') return sum;
      const remainingMonths = e.tenureMonths - e.paidInstallments;
      return sum + (e.totalLoanAmount * (remainingMonths / e.tenureMonths));
    }, 0);

    // Total Monthly Installment (₹) left
    const totalMonthlyInstallmentLeft = activeEmis.reduce((sum, e) => sum + e.amount, 0);

    // Total Tenure (Mos) left
    const totalTenureLeft = activeEmis.reduce((sum, e) => {
      return sum + (e.tenureMonths - e.paidInstallments);
    }, 0);

    // Total Fleets Loan Completed
    const totalFleetsLoanCompleted = closedEmis.length;
    const completedAmountValue = closedEmis.reduce((sum, e) => sum + e.totalLoanAmount, 0);

    // Total Fleets Loan left
    const totalFleetsLoanLeft = activeEmis.length;
    
    return { 
      totalEmiCommitment, 
      totalMaintCost, 
      totalMaintPaid, 
      totalMaintUnpaid, 
      totalDebtRemaining, 
      totalFleetInvestment,
      totalLoanPrincipalLeft,
      totalMonthlyInstallmentLeft,
      totalTenureLeft,
      totalFleetsLoanCompleted,
      completedAmountValue,
      totalFleetsLoanLeft
    };
  }, [emis, maintenance]);

  const getTruckProfitability = (truckId: string) => {
    const revenue = orders.filter(o => o.assignedTruckId === truckId).reduce((sum, o) => sum + (o.quantity * o.ratePerMT), 0);
    const truckExpenses = expenses.filter(e => e.truckId === truckId).reduce((sum, e) => sum + e.amount, 0);
    const truckEmiPaid = emis.filter(e => e.truckId === truckId).reduce((sum, e) => sum + (e.paidInstallments * e.amount), 0);
    const truckMaint = maintenance.filter(m => m.truckId === truckId).reduce((sum, m) => sum + m.amount, 0);
    return revenue - truckExpenses - truckEmiPaid - truckMaint;
  };

  const handleEmiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmiId) {
      const updated = emis.map(item => item.id === editingEmiId ? { ...item, ...emiForm } as TruckEMI : item);
      onUpdateEmis(updated);
    } else {
      const newEmi = { ...emiForm, id: `EMI-${Date.now()}` } as TruckEMI;
      onUpdateEmis([...emis, newEmi]);
    }
    setIsEmiModalOpen(false);
    setEditingEmiId(null);
    setEmiForm({
      truckId: '', bankName: '', amount: 0, dueDate: 5, startDate: new Date().toISOString().split('T')[0], tenureMonths: 48, paidInstallments: 0, totalLoanAmount: 0, status: 'ACTIVE', loanType: 'FIXED'
    });
  };

  const handleEditEmi = (emi: TruckEMI) => {
    setEmiForm(emi);
    setEditingEmiId(emi.id);
    setIsEmiModalOpen(true);
  };

  const handleDeleteEmi = (id: string) => {
    setDeleteEmiTarget(id);
  };

  const confirmDeleteEmi = () => {
    if (deleteEmiTarget) {
      onUpdateEmis(emis.filter(e => e.id !== deleteEmiTarget));
      setDeleteEmiTarget(null);
    }
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const companyName = settings?.companyName || "FLYASH LOGISTICS PRO";
    const logo = settings?.companyLogo;
    const email = settings?.companyEmail || '';
    const phone = settings?.companyPhone || '';
    const address = settings?.companyAddress || '';

    // Split filtered Db EMIs into chunks of 10
    const chunks: TruckEMI[][] = [];
    for (let i = 0; i < filteredDbEmis.length; i += 10) {
      chunks.push(filteredDbEmis.slice(i, i + 10));
    }

    const totalPages = Math.max(chunks.length, 1);

    const drawFallbackHeader = (doc: any, cName: string, yStart: number) => {
      doc.setFillColor(15, 23, 42); // slate-900 background for a sleek header card
      doc.rect(15, yStart, 180, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(cName.toUpperCase(), 22, yStart + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("FLEET ASSET FINANCE • FINANCIAL AUDIT REGISTER", 22, yStart + 17);

      if (email || phone) {
        doc.setFontSize(7);
        doc.text(`${email ? 'Email: ' + email : ''} ${phone ? '  |  Ph: ' + phone : ''}`, 190, yStart + 14, { align: 'right' });
      }

      return yStart + 24;
    };

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        doc.addPage();
      }

      let y = 15;

      // Draw Logo & Brand Header
      if (logo) {
        try {
          const imgType = logo.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(logo, imgType, 15, y, 20, 20);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(companyName, 39, y + 8);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text("Fleet Asset Finance - Security Audit Register", 39, y + 14);

          if (email || phone || address) {
            doc.setFontSize(7.5);
            const addressLine = address ? `${address.substring(0, 45)}${address.length > 45 ? '...' : ''}` : '';
            doc.text(`${addressLine} ${phone ? ' • Phone: ' + phone : ''} ${email ? ' • ' + email : ''}`, 39, y + 19);
          }
          y += 24;
        } catch (err) {
          console.error("Error rendering logo:", err);
          y = drawFallbackHeader(doc, companyName, y);
        }
      } else {
        y = drawFallbackHeader(doc, companyName, y);
      }

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 8;

      // Report Title Banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); 
      doc.text(`OFFLINE FINANCIAL AUDIT REPORT`, 15, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${pageIdx + 1} of ${totalPages}`, 195, y, { align: 'right' });
      
      const formatTimestamp = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(7.5);
      doc.text(`Generated: ${formatTimestamp}`, 15, y + 5.5);
      y += 12;

      // First Page Specific Cards and applied Filters
      if (pageIdx === 0) {
        // Filter info box
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.setLineWidth(0.3);
        doc.rect(15, y, 180, 15, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text("APPLIED FILTERS", 18, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const activeTruck = dbFilters.truckId || "ALL ASSETS";
        const activeBank = dbFilters.bankName || "ALL BANKS";
        const activeStart = dbFilters.completionStart ? `From ${dbFilters.completionStart}` : "ANY DATE";
        const activeEnd = dbFilters.completionEnd ? `To ${dbFilters.completionEnd}` : "ANY DATE";

        doc.text(`Asset / Truck: ${activeTruck}   |   Bank / Lender: ${activeBank}`, 18, y + 10.5);
        doc.text(`Loan Completion Timeline: ${activeStart} — ${activeEnd}`, 115, y + 10.5);
        y += 22;

        // Core Financial Cards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("CORE PORTFOLIO METRICS SUMMARY", 15, y);
        y += 4;

        // 8 Metric Cards 
        const metrics = [
          { label: "Total Fleets", val: `${(fleet || []).length} Trucks` },
          { label: "Monthly EMI commitments", val: `INR ${(stats.totalEmiCommitment || 0).toLocaleString()}` },
          { label: "Total Debt Exposure", val: `INR ${(stats.totalDebtRemaining || 0).toLocaleString()}` },
          { label: "Loan Principal Left", val: `INR ${Math.round((isFiltered ? filteredStatsLeft.totalLoanPrincipalLeft : stats.totalLoanPrincipalLeft) || 0).toLocaleString()}` },
          { label: "Total Installment Left", val: `INR ${Math.round(stats.totalMonthlyInstallmentLeft || 0).toLocaleString()}` },
          { label: "Total Tenure (Mos) Left", val: `${stats.totalTenureLeft || 0} Months` },
          { label: "Fleets Loan Completed", val: `${isFiltered ? filteredStatsLeft.totalFleetsLoanCompleted : stats.totalFleetsLoanCompleted || 0} Assets` },
          { label: "Fleets Loan Left", val: `${isFiltered ? filteredStatsLeft.totalFleetsLoanLeft : stats.totalFleetsLoanLeft || 0} Loans` }
        ];

        const cardW = 43.5;
        const cardH = 13;
        const spacing = 1.5;

        for (let i = 0; i < metrics.length; i++) {
          const rowNum = Math.floor(i / 4);
          const colNum = i % 4;
          const cx = 15 + colNum * (cardW + spacing);
          const cy = y + rowNum * (cardH + spacing);

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.rect(cx, cy, cardW, cardH, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184); // light gray
          doc.text(metrics[i].label.toUpperCase(), cx + 2.5, cy + 4);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(metrics[i].val, cx + 2.5, cy + 9.5);
        }

        y += (cardH * 2) + spacing + 10;
      }

      // table headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`ASSET LOAN ENTRIES (${pageIdx * 10 + 1} - ${Math.min((pageIdx + 1) * 10, filteredDbEmis.length)} OF ${filteredDbEmis.length})`, 15, y);
      y += 4;

      doc.setFillColor(15, 23, 42);
      doc.rect(15, y, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);

      doc.text("ASSET ID", 18, y + 5.5);
      doc.text("LENDER BANK", 43, y + 5.5);
      doc.text("LOAN AMOUNT", 85, y + 5.5, { align: 'right' });
      doc.text("EMI AMT", 108, y + 5.5, { align: 'right' });
      doc.text("PAID / TENURE", 131, y + 5.5, { align: 'center' });
      doc.text("COMPL. DATE", 154, y + 5.5, { align: 'center' });
      doc.text("STATUS", 185, y + 5.5, { align: 'center' });
      y += 8;

      const currentRows = chunks[pageIdx] || [];
      if (currentRows.length === 0) {
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(15, y, 195, y);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("No records listed for current view/filters", 105, y + 10, { align: 'center' });
      } else {
        currentRows.forEach((row, rIdx) => {
          if (rIdx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(15, y, 180, 9, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(row.truckId, 18, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          const truncatedBank = row.bankName.length > 22 ? row.bankName.substring(0, 20) + ".." : row.bankName;
          doc.text(truncatedBank, 43, y + 6);

          doc.setFont('helvetica', 'bold');
          doc.text(`INR ${Math.round(row.totalLoanAmount).toLocaleString()}`, 85, y + 6, { align: 'right' });
          doc.text(`INR ${Math.round(row.amount).toLocaleString()}`, 108, y + 6, { align: 'right' });

          doc.setFont('helvetica', 'normal');
          doc.text(`${row.paidInstallments} / ${row.tenureMonths}`, 131, y + 6, { align: 'center' });

          const compDate = getLoanCompletionDate(row.startDate, row.tenureMonths);
          const compLabel = compDate ? new Date(compDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
          doc.text(compLabel, 154, y + 6, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          if (row.status === 'ACTIVE') {
            doc.setTextColor(16, 185, 129);
            doc.text("ACTIVE", 185, y + 6, { align: 'center' });
          } else {
            doc.setTextColor(100, 116, 139);
            doc.text("CLOSED", 185, y + 6, { align: 'center' });
          }

          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(15, y + 9, 195, y + 9);
          y += 9;
        });
      }

      // Footer
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CONFIDENTIAL - OFFICIAL FLEET FINANCE REPORT FOR AUDITING", 15, 287);
      doc.text(`PAGE ${pageIdx + 1} OF ${totalPages}`, 195, 287, { align: 'right' });
    }

    doc.save(`fleet_loan_audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (maintForm.id) {
      onUpdateMaintenance(maintenance.map(m => m.id === maintForm.id ? { ...m, ...maintForm } as MaintenanceExpense : m));
    } else {
      const newMaint = { ...maintForm, id: `MAINT-${Date.now()}` } as MaintenanceExpense;
      onUpdateMaintenance([...maintenance, newMaint]);
    }
    setIsMaintModalOpen(false);
  };

  const markEmiPaid = (emiId: string) => {
    const updated = emis.map(e => {
      if (e.id === emiId) {
        const nextPaid = e.paidInstallments + 1;
        const isClosed = nextPaid >= e.tenureMonths;
        return { 
          ...e, 
          paidInstallments: Math.min(nextPaid, e.tenureMonths),
          status: isClosed ? 'CLOSED' : 'ACTIVE'
        };
      }
      return e;
    });
    onUpdateEmis(updated as TruckEMI[]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Asset Finance</h2>
          <p className="text-slate-500 text-sm font-medium italic">Comprehensive TCO, ROI & Debt Management.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {(['dashboard', 'emis', 'maintenance'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab === 'emis' ? 'Loan & EMIs' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Fleets" value={`${(fleet || []).length} Assets`} icon={TruckIcon} color="blue" />
            <StatCard label="Monthly EMI Liability" value={`₹${(stats.totalEmiCommitment || 0).toLocaleString()}`} icon={Banknote} color="indigo" />
            <StatCard label="Total Debt Exposure" value={`₹${(stats.totalDebtRemaining || 0).toLocaleString()}`} icon={DollarSign} color="red" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              label="Total Loan Principal Left" 
              value={`₹${Math.round((isFiltered ? filteredStatsLeft.totalLoanPrincipalLeft : stats.totalLoanPrincipalLeft) || 0).toLocaleString()}`} 
              icon={CreditCard} 
              color="blue" 
              highlighted={isFiltered}
            />
            <StatCard label="Total Monthly Installment (₹) left" value={`₹${Math.round(stats.totalMonthlyInstallmentLeft || 0).toLocaleString()}`} icon={Banknote} color="indigo" />
            <StatCard label="Total Tenure (Mos) Left" value={`${stats.totalTenureLeft || 0} Mos`} icon={Calendar} color="amber" />
            <StatCard 
              label="Total Fleets Loan Completed" 
              value={`${isFiltered ? filteredStatsLeft.totalFleetsLoanCompleted : stats.totalFleetsLoanCompleted || 0} Assets (₹${Math.round(isFiltered ? (filteredStatsLeft.completedAmountValue || 0) : (stats.completedAmountValue || 0)).toLocaleString()})`} 
              icon={CheckCircle2} 
              color="green" 
              highlighted={isFiltered}
            />
            <StatCard 
               label="Total Fleets Loan Left" 
               value={`${isFiltered ? filteredStatsLeft.totalFleetsLoanLeft : stats.totalFleetsLoanLeft || 0} Loans`} 
               icon={Clock} 
               color="red" 
               highlighted={isFiltered}
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="p-8 border-b border-slate-100 bg-slate-50/55 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Asset Loan Portfolio</h3>
                <p className="text-xs text-slate-500 font-medium italic mt-1">Register of acquisitions, current liabilities, and forecasted completions.</p>
              </div>
              <div className="flex items-center gap-3">
                {(dbFilters.truckId || dbFilters.bankName || dbFilters.completionStart || dbFilters.completionEnd) && (
                  <button 
                    onClick={() => setDbFilters({ truckId: '', bankName: '', completionStart: '', completionEnd: '' })}
                    className="px-5 py-2.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 hover:text-red-700 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm animate-in fade-in zoom-in-95 duration-200"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={handleExportToPDF}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  <Download size={12} />
                  Export PDF Audit Report
                </button>
              </div>
            </div>

            {/* Table Filters */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 relative z-[110]">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Filter by Truck</label>
                  <SearchableSelect
                    value={dbFilters.truckId}
                    options={[
                      { value: '', label: 'All Trucks', sub: 'Reset Filter' },
                      ...fleet.map(t => ({
                        value: t.id,
                        label: t.truckNumber || 'Unknown Asset',
                        sub: t.modelNumber || t.id
                      }))
                    ]}
                    onChange={val => setDbFilters({ ...dbFilters, truckId: val })}
                    placeholder="All Trucks..."
                    icon={TruckIcon}
                    variant="slate"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lending Financier</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-[56px] focus:outline-none transition-all uppercase text-xs tracking-wider"
                    value={dbFilters.bankName}
                    onChange={e => setDbFilters({ ...dbFilters, bankName: e.target.value })}
                  >
                    <option value="">All Financiers</option>
                    {uniqueFinanciers.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Installment Completed (From)</label>
                  <input
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-[56px] focus:outline-none"
                    value={dbFilters.completionStart}
                    onChange={e => setDbFilters({ ...dbFilters, completionStart: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Installment Completed (To)</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm h-[56px] focus:outline-none"
                      value={dbFilters.completionEnd}
                      onChange={e => setDbFilters({ ...dbFilters, completionEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Start Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Completed Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Truck</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lending Financier</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Loan Principal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Monthly Installment (₹)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Tenure (Mos)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-black">Interest Rate</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Interest</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paid Installments</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Loan Principal left</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center font-black">Total Tenure (Mos) left</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Due Date (Day)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDbEmis.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-16 text-center text-slate-400 italic text-sm font-medium">
                        No asset loan records matched those filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedDbEmis.map(emi => {
                      const truck = (fleet || []).find(t => t.id === emi.truckId);
                      const remainingMonths = emi.tenureMonths - emi.paidInstallments;
                      
                      const totalLifetimeInterest = emi.interestRate !== undefined && emi.interestRate > 0
                        ? emi.totalLoanAmount * (emi.interestRate / 100)
                        : Math.max(0, (emi.amount * emi.tenureMonths) - emi.totalLoanAmount);
                      
                      const principalLeft = emi.status === 'CLOSED' ? 0 : emi.totalLoanAmount * (remainingMonths / emi.tenureMonths);
                      const instLeftValue = emi.status === 'CLOSED' ? 0 : emi.amount * remainingMonths;
                      
                      return (
                        <tr key={emi.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-900">
                            {emi.startDate ? new Date(emi.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-900">
                            {getLoanCompletionDate(emi.startDate, emi.tenureMonths) ? new Date(getLoanCompletionDate(emi.startDate, emi.tenureMonths)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-900 block">{truck?.truckNumber || 'N/A'}</span>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{truck?.modelNumber || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700">
                            {emi.bankName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">
                            ₹{(emi.totalLoanAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-blue-600 text-right">
                            ₹{(emi.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 text-center">
                            {emi.tenureMonths} Mos
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-emerald-600 text-center">
                            {emi.interestRate !== undefined && emi.interestRate > 0 ? `${emi.interestRate}%` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">
                            ₹{totalLifetimeInterest.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">
                            {emi.paidInstallments}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-950 text-right">
                            ₹{Math.round(principalLeft).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">
                            {remainingMonths}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900 text-center">
                            {emi.dueDate}th
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider inline-block border ${emi.status === 'CLOSED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {emi.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            {totalDashboardPages > 1 && (
              <div className="flex items-center justify-between px-8 py-5 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing entries {(dashboardPage - 1) * rowsPerPage + 1} - {Math.min(dashboardPage * rowsPerPage, filteredDbEmis.length)} of {filteredDbEmis.length}
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={dashboardPage === 1}
                    onClick={() => setDashboardPage(prev => Math.max(prev - 1, 1))}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button 
                    disabled={dashboardPage >= totalDashboardPages}
                    onClick={() => setDashboardPage(prev => Math.min(prev + 1, totalDashboardPages))}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm cursor-pointer"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'emis' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Filter by Financier or Asset #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
              />
            </div>
            <button onClick={() => { setEditingEmiId(null); setEmiForm({ truckId: '', bankName: '', amount: 0, dueDate: 5, startDate: new Date().toISOString().split('T')[0], tenureMonths: 48, paidInstallments: 0, totalLoanAmount: 0, status: 'ACTIVE', loanType: 'FIXED' }); setIsEmiModalOpen(true); }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">
              <Plus size={20} /> Register Loan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredEmis.map(emi => {
               const truck = (fleet || []).find(t => t.id === emi.truckId);
               const progress = (emi.paidInstallments / emi.tenureMonths) * 100;
               const isClosed = emi.status === 'CLOSED';
               
               return (
                <div key={emi.id} className={`bg-white rounded-[2.5rem] border-2 p-8 shadow-sm group hover:shadow-xl transition-all flex flex-col ${isClosed ? 'border-green-100 opacity-80' : 'border-slate-100'}`}>
                   <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all ${isClosed ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                           <Building2 size={24} />
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-slate-900 leading-none">{truck?.truckNumber}</h4>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5">{emi.bankName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${isClosed ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {emi.status}
                         </span>
                         <p className="text-xl font-black text-slate-900 mt-1">₹{(emi.amount || 0).toLocaleString()}</p>
                      </div>
                   </div>

                   <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <span>Maturity Timeline</span>
                         <span className={isClosed ? 'text-green-600' : 'text-slate-900'}>{progress.toFixed(0)}% Repaid</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-700 ${isClosed ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-slate-900 uppercase">
                         <span>{emi.paidInstallments} Paid</span>
                         <span>{emi.tenureMonths - emi.paidInstallments} Remaining</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-2 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Principal</p>
                        <p className="text-xs font-black text-slate-900">₹{(emi.totalLoanAmount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Loan Type</p>
                        <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-tight leading-none mt-1">
                          {emi.loanType === 'REDUCING' ? 'Reducing' : 'Fixed-Rate'}
                        </p>
                        {emi.interestRate !== undefined && emi.interestRate > 0 && (
                          <p className="text-[9px] font-extrabold text-emerald-600 mt-0.5 leading-none">
                            {emi.interestRate}% Int.
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Next Due</p>
                        <p className="text-xs font-black text-slate-900">{emi.dueDate}th</p>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditEmi(emi)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-all shadow-sm"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteEmi(emi.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-600 transition-all shadow-sm"><Trash2 size={16}/></button>
                      </div>
                      {!isClosed && (
                        <button 
                          onClick={() => markEmiPaid(emi.id)} 
                          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-black transition-all flex items-center gap-2"
                        >
                          <RefreshCw size={12} /> Pay Monthly EMI
                        </button>
                      )}
                      {isClosed && (
                        <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase">
                          <CheckCircle2 size={16} /> Asset Fully Owned
                        </div>
                      )}
                   </div>
                </div>
               );
             })}
             {filteredEmis.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                   <DollarSign size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-medium uppercase tracking-widest text-xs italic">No financing records detected for this search.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           {/* Maintenance Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 group hover:border-green-200 transition-all">
                 <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                    <CheckCircle size={32} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Payment Paid</p>
                    <div className="flex items-baseline gap-2">
                       <h4 className="text-3xl font-black text-slate-900 leading-none">₹{(maintStats.paidTotal || 0).toLocaleString()}</h4>
                       <span className="text-xs font-bold text-green-500">({maintStats.paidCount} Bills)</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 group hover:border-red-200 transition-all">
                 <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                    <AlertCircle size={32} className="animate-pulse" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Payment Unpaid</p>
                    <div className="flex items-baseline gap-2">
                       <h4 className="text-3xl font-black text-slate-900 leading-none">₹{(maintStats.unpaidTotal || 0).toLocaleString()}</h4>
                       <span className="text-xs font-bold text-red-500">({maintStats.unpaidCount} Pending)</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by Truck No, Workshop, or Employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
              />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black transition-all ${showFilters ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <Filter size={18} /> Filters
                </button>
                <button onClick={() => { setMaintForm({ truckId: '', employeeId: '', date: new Date().toISOString().split('T')[0], serviceDate: new Date().toISOString().split('T')[0], category: 'ROUTINE', description: '', amount: 0, workshopName: '', odometerReading: 0, partsReplaced: [], status: 'UNPAID', paidDate: '', dueDate: '' }); setIsMaintModalOpen(true); }} className="flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl hover:bg-amber-700 transition-all">
                    <Plus size={20} /> Log Maintenance
                </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Status</label>
                        <select 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                            value={maintFilters.status}
                            onChange={e => setMaintFilters({...maintFilters, status: e.target.value})}
                        >
                            <option value="ALL">All Payments</option>
                            <option value="PAID">Paid Only</option>
                            <option value="UNPAID">Unpaid Only</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Responsible Employee</label>
                        <select 
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                            value={maintFilters.employeeId}
                            onChange={e => setMaintFilters({...maintFilters, employeeId: e.target.value})}
                        >
                            <option value="">All Employees</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Log Date Range</label>
                        <div className="flex gap-2">
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.startDate} onChange={e => setMaintFilters({...maintFilters, startDate: e.target.value})} />
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.endDate} onChange={e => setMaintFilters({...maintFilters, endDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Service Date Range</label>
                        <div className="flex gap-2">
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.serviceStartDate} onChange={e => setMaintFilters({...maintFilters, serviceStartDate: e.target.value})} />
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.serviceEndDate} onChange={e => setMaintFilters({...maintFilters, serviceEndDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Due Date Range</label>
                        <div className="flex gap-2">
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.dueStartDate} onChange={e => setMaintFilters({...maintFilters, dueStartDate: e.target.value})} />
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.dueEndDate} onChange={e => setMaintFilters({...maintFilters, dueEndDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date Paid Range</label>
                        <div className="flex gap-2">
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.paidStartDate} onChange={e => setMaintFilters({...maintFilters, paidStartDate: e.target.value})} />
                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.paidEndDate} onChange={e => setMaintFilters({...maintFilters, paidEndDate: e.target.value})} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex items-end">
                        <button 
                            onClick={() => setMaintFilters({
                                status: 'ALL',
                                employeeId: '',
                                startDate: '',
                                endDate: '',
                                serviceStartDate: '',
                                serviceEndDate: '',
                                dueStartDate: '',
                                dueEndDate: '',
                                paidStartDate: '',
                                paidEndDate: ''
                            })}
                            className="bg-white border border-slate-200 text-slate-500 px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-100 transition-all uppercase tracking-widest"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Dates</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Repair Summary</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                         <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {paginatedMaint.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6">
                              <p className="text-sm font-black text-slate-900">{(fleet || []).find(t => t.id === m.truckId)?.truckNumber || 'N/A'}</p>
                              <div className="flex flex-col mt-1">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase">Log: {m.date || 'N/A'}</span>
                                 <span className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Service: {m.serviceDate || 'N/A'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                m.category === 'BREAKDOWN' ? 'bg-red-50 text-red-600 border-red-200' :
                                m.category === 'TYRE' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                 {m.category}
                              </span>
                              <div className="mt-1 flex flex-col">
                                 <p className="text-[9px] text-slate-400 font-bold uppercase">{m.workshopName}</p>
                                 <span className="text-[8px] text-indigo-500 font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">Assigned: {(employees || []).find(e => e.id === m.employeeId)?.fullName || 'System'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-sm font-bold text-slate-800">{m.description}</p>
                              <div className="flex gap-1 mt-1.5 overflow-hidden">
                                 {m.partsReplaced.map((p, i) => (
                                    <span key={i} className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">{p}</span>
                                 ))}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center border ${m.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200 animate-pulse'}`}>
                                    {m.status}
                                 </span>
                                 {m.status === 'PAID' ? (
                                    <span className="text-[9px] font-bold text-slate-500 italic">Paid on {m.paidDate}</span>
                                 ) : (
                                    <span className="text-[9px] font-bold text-red-400 italic">Due {m.dueDate}</span>
                                 )}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-base font-black text-slate-900">₹{(m.amount || 0).toLocaleString()}</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{(m.odometerReading || 0).toLocaleString()} KM</p>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button onClick={() => { setMaintForm(m); setIsMaintModalOpen(true); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit size={18}/></button>
                                 <button onClick={() => onUpdateMaintenance(maintenance.filter(x => x.id !== m.id))} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                      {filteredMaint.length === 0 && (
                        <tr>
                           <td colSpan={6} className="px-8 py-20 text-center">
                              <Wrench size={48} className="text-slate-200 mx-auto mb-4" />
                              <p className="text-slate-400 font-medium italic">No maintenance records found for the current filter.</p>
                           </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
             <div className="flex items-center justify-between px-8 py-4 bg-slate-50/30 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {maintPage} of {totalMaintPages || 1}</p>
                <div className="flex gap-2">
                   <button 
                     disabled={maintPage === 1}
                     onClick={() => setMaintPage(maintPage - 1)}
                     className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                   >
                     <ChevronLeft size={16} />
                   </button>
                   <button 
                     disabled={maintPage >= totalMaintPages}
                     onClick={() => setMaintPage(maintPage + 1)}
                     className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                   >
                     <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* EMI Modal */}
      {isEmiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">{editingEmiId ? 'Update Loan Profile' : 'Enroll Asset Loan'}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Capital Expenditure & Liability Mapping</p>
               </div>
               <button onClick={() => setIsEmiModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleEmiSubmit} className="p-10 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2 relative z-[120]">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Truck*</label>
                     <SearchableSelect
                        value={emiForm.truckId || ''}
                        options={fleet.map(t => ({
                           value: t.id,
                           label: t.truckNumber || 'Unknown Asset',
                           sub: t.modelNumber || t.id
                        }))}
                        onChange={val => setEmiForm({ ...emiForm, truckId: val })}
                        placeholder="Choose Asset..."
                        icon={TruckIcon}
                        variant="slate"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lending Financier*</label>
                     <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={emiForm.bankName} onChange={e => setEmiForm({...emiForm, bankName: e.target.value})} placeholder="e.g. HDFC Bank, Tata Capital" />
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total Loan Principal (₹)*</label>
                     <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={emiForm.totalLoanAmount} onChange={e => setEmiForm({...emiForm, totalLoanAmount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Monthly Installment (₹)*</label>
                     <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-blue-600" value={emiForm.amount} onChange={e => setEmiForm({...emiForm, amount: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Interest Rate (% p.a.)*</label>
                     <input type="number" step="0.01" min="0" max="100" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg text-emerald-600" value={emiForm.interestRate !== undefined ? emiForm.interestRate : ''} onChange={e => setEmiForm({...emiForm, interestRate: Number(e.target.value)})} placeholder="e.g. 10.5" />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Due Date (Day)*</label>
                     <input type="number" min="1" max="31" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={emiForm.dueDate} onChange={e => setEmiForm({...emiForm, dueDate: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Total Tenure (Mos)*</label>
                     <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={emiForm.tenureMonths} onChange={e => setEmiForm({...emiForm, tenureMonths: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paid Installments</label>
                     <input type="number" min="0" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={emiForm.paidInstallments} onChange={e => setEmiForm({...emiForm, paidInstallments: Number(e.target.value)})} />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Loan Start Date</label>
                     <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={emiForm.startDate} onChange={e => setEmiForm({...emiForm, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Loan Type*</label>
                     <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={emiForm.loanType || "FIXED"} onChange={e => setEmiForm({...emiForm, loanType: e.target.value as any})}>
                        <option value="FIXED">Fixed-rate loan</option>
                        <option value="REDUCING">Reducing balance loan</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Status</label>
                     <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={emiForm.status} onChange={e => setEmiForm({...emiForm, status: e.target.value as any})}>
                        <option value="ACTIVE">Active (Collection Ongoing)</option>
                        <option value="CLOSED">Closed (Repaid)</option>
                     </select>
                  </div>
               </div>

               <div className="pt-4">
                  <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                     <CheckCircle2 size={18} /> {editingEmiId ? 'Commit Changes' : 'Authorize Loan Enrollment'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteEmiTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner overflow-hidden">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Delete Asset Loan?</h3>
                <p className="text-xs text-slate-500 font-medium tracking-tight mt-2">
                  Are you absolutely sure you want to permanently remove this loan record? This action cannot be undone and will immediately affect all balance calculations.
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setDeleteEmiTarget(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
              >
                No, Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteEmi}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-red-700 transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isMaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">Maintenance Job Card</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Expense & Asset Upkeep</p>
               </div>
               <button onClick={() => setIsMaintModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleMaintSubmit} className="p-10 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Log Date*</label>
                     <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={maintForm.date} onChange={e => setMaintForm({...maintForm, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Service Date*</label>
                     <input type="date" required className="w-full px-5 py-4 bg-blue-50 border border-blue-200 rounded-2xl font-bold text-blue-900" value={maintForm.serviceDate} onChange={e => setMaintForm({...maintForm, serviceDate: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Responsible Employee*</label>
                     <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={maintForm.employeeId} onChange={e => setMaintForm({...maintForm, employeeId: e.target.value})}>
                        <option value="">Select Staff...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Truck*</label>
                     <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={maintForm.truckId} onChange={e => setMaintForm({...maintForm, truckId: e.target.value})}>
                        <option value="">Asset ID...</option>
                        {fleet.map(t => <option key={t.id} value={t.id}>{t.truckNumber}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category*</label>
                     <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={maintForm.category} onChange={e => setMaintForm({...maintForm, category: e.target.value as any})}>
                        <option value="ROUTINE">Routine Service</option>
                        <option value="ENGINE">Engine / Transmission</option>
                        <option value="TYRE">Tyre Replacement</option>
                        <option value="ELECTRICAL">Electrical Work</option>
                        <option value="BODY">Body / Chassis</option>
                        <option value="BREAKDOWN">Emergency Breakdown</option>
                     </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Workshop / Vendor Name*</label>
                     <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={maintForm.workshopName} onChange={e => setMaintForm({...maintForm, workshopName: e.target.value})} placeholder="e.g. Service Center" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Odometer (KM)*</label>
                     <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" value={maintForm.odometerReading} onChange={e => setMaintForm({...maintForm, odometerReading: Number(e.target.value)})} />
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bill Amount (₹)*</label>
                        <input type="number" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black text-lg" value={maintForm.amount} onChange={e => setMaintForm({...maintForm, amount: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Status*</label>
                        <select required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-black" value={maintForm.status} onChange={e => setMaintForm({...maintForm, status: e.target.value as any})}>
                           <option value="PAID">Paid</option>
                           <option value="UNPAID">Unpaid</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     {maintForm.status === 'PAID' ? (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-green-600 uppercase tracking-widest px-1">Date Paid*</label>
                           <input type="date" required className="w-full px-5 py-4 bg-green-50 border border-green-200 rounded-2xl font-bold" value={maintForm.paidDate} onChange={e => setMaintForm({...maintForm, paidDate: e.target.value})} />
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-red-600 uppercase tracking-widest px-1">Payment Due Date*</label>
                           <input type="date" required className="w-full px-5 py-4 bg-red-50 border border-red-200 rounded-2xl font-bold" value={maintForm.dueDate} onChange={e => setMaintForm({...maintForm, dueDate: e.target.value})} />
                        </div>
                     )}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Repair Description*</label>
                  <textarea rows={2} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})} placeholder="Detailed summary of work done..." />
               </div>
               <button type="submit" className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black shadow-2xl hover:bg-amber-700 transition-all uppercase tracking-widest text-xs">Post Repair Ledger</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ 
  label: string; 
  value: string; 
  icon: any; 
  color: string;
  highlighted?: boolean;
}> = ({ label, value, icon: Icon, color, highlighted }) => {
  const colors: Record<string, string> = { 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    amber: 'bg-amber-50 text-amber-600 border-amber-100', 
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };
  return (
    <div className={`p-6 bg-white rounded-[2.5rem] border-2 shadow-sm ${colors[color]} flex flex-col gap-4 group hover:-translate-y-1 transition-all cursor-default relative overflow-hidden ${highlighted ? 'ring-4 ring-amber-400/40 border-amber-400 scale-[1.03]' : ''}`}>
       <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${colors[color]}`}>
             <Icon size={20} />
          </div>
       </div>
       <div>
          <div className="flex items-center gap-1.5">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
             {highlighted && (
                <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse scale-90">
                   Filtered
                </span>
             )}
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
             {highlighted ? (
                <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded-xl border border-yellow-200 outline-dashed outline-1 outline-yellow-400/40 inline-block font-black shadow-inner">
                   {value}
                </span>
             ) : (
                value
             )}
          </p>
       </div>
    </div>
  );
};

export default FleetFinanceView;
