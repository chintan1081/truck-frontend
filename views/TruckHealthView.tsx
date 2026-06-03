
import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Search, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Calendar,
  History,
  FileSearch,
  Battery,
  Zap,
  Activity,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  Eye,
  Download,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  ClipboardCheck,
  CircleGauge,
  Disc,
  ArrowRight,
  IndianRupee,
  Filter,
  Files,
  X,
  Edit,
  User,
  Settings,
  MoreHorizontal,
  CreditCard,
  BadgeCheck,
  Truck as TruckIcon,
  Flame,
  FileX,
  Droplet,
  Waves,
  Scale,
  CarFront,
  Coins,
  ClipboardList,
  Clock,
  Gauge,
  MapPin,
  Cog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { 
  Truck, 
  HealthStatus, 
  TruckDocument, 
  TruckHealthComponent, 
  TyreDetail, 
  InspectionLog, 
  ServiceRecord,
  OdometerReading,
  BreakdownLog,
  PressureLog,
  TyreRotationEvent,
  MaintenanceExpense,
  Employee,
  Route,
  Driver,
  Order
} from '../types';
import { calculateHealthScore, calculateKmToService } from '../lib/healthUtils';

interface TruckHealthViewProps {
  fleet: Truck[];
  onUpdateTruck: (truck: Truck) => void;
  maintenance: MaintenanceExpense[];
  employees: Employee[];
  drivers: Driver[];
  routes: Route[];
  orders: Order[];
  onUpdateMaintenance: (maint: MaintenanceExpense[]) => void;
}

const TruckHealthView: React.FC<TruckHealthViewProps> = ({ 
  fleet = [], 
  onUpdateTruck,
  maintenance = [],
  employees = [],
  drivers = [],
  routes = [],
  orders = [],
  onUpdateMaintenance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(fleet[0]?.id || null);

  React.useEffect(() => {
    if (!selectedTruckId && fleet.length > 0) {
      setSelectedTruckId(fleet[0].id);
    }
  }, [fleet, selectedTruckId]);

  const [activeDetailTab, setActiveDetailTab] = useState<'vehicle_details' | 'status' | 'inspection' | 'tyres' | 'service' | 'documents' | 'odometer' | 'breakdowns' | 'financial_maint'>('vehicle_details');
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [activeModal, setActiveModal] = useState<'service' | 'inspection' | 'tyre' | 'document' | 'breakdown' | 'odometer' | 'resolve_inspection' | 'maint_log' | 'rotation' | null>(null);
  const [editingDoc, setEditingDoc] = useState<TruckDocument | null>(null);
  const [editingOdo, setEditingOdo] = useState<OdometerReading | null>(null);
  const [editingInspection, setEditingInspection] = useState<InspectionLog | null>(null);
  const [editingBreakdown, setEditingBreakdown] = useState<BreakdownLog | null>(null);
  const [editingMaint, setEditingMaint] = useState<MaintenanceExpense | null>(null);
  const [editingRotation, setEditingRotation] = useState<TyreRotationEvent | null>(null);
  const [previewDoc, setPreviewDoc] = useState<TruckDocument | null>(null);
  const [selectedTyrePos, setSelectedTyrePos] = useState<TyreDetail['position'] | null>(null);
  const [selectedInspectionLogId, setSelectedInspectionLogId] = useState<string | null>(null);
  const [resNotes, setResNotes] = useState('');
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<TruckDocument['type'] | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [docExpiryFilter, setDocExpiryFilter] = useState<'all' | 'expired' | 'upcoming'>('all');
  const [docExactExpiryDate, setDocExactExpiryDate] = useState('');
  const [docExactUploadDate, setDocExactUploadDate] = useState('');
  const [docSortOrder, setDocSortOrder] = useState<'upload_new' | 'upload_old' | 'expiry_soon'>('upload_new');

  const [maintSearch, setMaintSearch] = useState('');
  const [showMaintFilters, setShowMaintFilters] = useState(false);
  const [maintFilters, setMaintFilters] = useState({
    status: 'ALL',
    employeeId: '',
    startDate: '',
    endDate: '',
    category: 'ALL'
  });
  const [selectedMaintIds, setSelectedMaintIds] = useState<string[]>([]);

  const [tyreInventoryPage, setTyreInventoryPage] = useState(1);
  const [rotationHistoryPage, setRotationHistoryPage] = useState(1);
  const [activeEditTruckSection, setActiveEditTruckSection] = useState<'identity' | 'technical' | 'ownership' | 'logistics' | null>(null);
  const [editTruckForm, setEditTruckForm] = useState<Partial<Truck>>({});
  const [inspectionPage, setInspectionPage] = useState(1);
  const [inspectionSearch, setInspectionSearch] = useState('');
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'ADVISORY'>('ALL');
  const [inspectionDateFilter, setInspectionDateFilter] = useState('');
  const [inspectionResDateFilter, setInspectionResDateFilter] = useState('');
  const [docPage, setDocPage] = useState(1);
  const [compliancePage, setCompliancePage] = useState(1);

  const selectedTruck = fleet.find(t => t.id === selectedTruckId);

  React.useEffect(() => {
    setTyreInventoryPage(1);
    setInspectionPage(1);
    setRotationHistoryPage(1);
    setDocPage(1);
    setCompliancePage(1);
  }, [selectedTruckId]);

  const handleSelectTruck = (id: string) => {
    setSelectedTruckId(id);
    setViewMode('detail');
    setSelectedMaintIds([]);
  };

  const handleBackToGrid = () => {
    setSelectedTruckId(null);
    setViewMode('grid');
  };

  const handleUpdateComponent = (component: keyof Truck['healthStatus'], status: HealthStatus, notes: string) => {
    if (!selectedTruck) return;
    const currentHealth = selectedTruck.healthStatus || {};
    const rawComp = currentHealth[component];
    const currentComp = typeof rawComp === 'string' 
      ? { status: rawComp as HealthStatus, lastChecked: 'Legacy', notes: 'System migrated' }
      : (rawComp as TruckHealthComponent) || { status: 'GOOD', lastChecked: '', notes: '' };

    const updatedTruck: Truck = {
      ...selectedTruck,
      healthStatus: {
        ...currentHealth,
        [component]: {
          ...currentComp,
          status,
          notes,
          lastChecked: new Date().toISOString().split('T')[0]
        }
      } as Truck['healthStatus']
    };
    onUpdateTruck(updatedTruck);
  };

  const handleLogBreakdown = (desc: string, location: string, cost: number, id?: string) => {
    if (!selectedTruck) return;
    const history = selectedTruck.breakdownHistory || [];
    
    let updatedHistory = [...history];
    if (id) {
      updatedHistory = updatedHistory.map(b => b.id === id ? { ...b, description: desc, location, cost } : b);
    } else {
      const newBreakdown = {
        id: `BD-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: desc,
        location,
        resolved: false,
        cost
      };
      updatedHistory = [newBreakdown, ...history];
    }

    const updatedTruck = {
      ...selectedTruck,
      status: id ? selectedTruck.status : ('MAINTENANCE' as Truck['status']),
      maintenanceReason: id ? selectedTruck.maintenanceReason : ('Breakdown reported: ' + desc),
      breakdownHistory: updatedHistory
    };
    onUpdateTruck(updatedTruck);
  };

  const handleDeleteBreakdown = (id: string) => {
    if (!selectedTruck) return;
    const history = (selectedTruck.breakdownHistory || []).filter(h => h.id !== id);
    onUpdateTruck({ ...selectedTruck, breakdownHistory: history });
  };

  const handleResolveInspection = (logId: string, notes: string, date: string) => {
    if (!selectedTruck) return;
    const logs = selectedTruck.inspectionLogs || [];
    const updatedLogs = logs.map(log => 
      log.id === logId ? { ...log, isResolved: true, resolutionNotes: notes, resolvedDate: date } : log
    );
    onUpdateTruck({ ...selectedTruck, inspectionLogs: updatedLogs });
    setActiveModal(null);
    setSelectedInspectionLogId(null);
    setResNotes('');
  };

  const handleResolveBreakdown = (breakdownId: string) => {
    if (!selectedTruck) return;
    const history = selectedTruck.breakdownHistory || [];
    const updatedHistory = history.map(bd => 
      bd.id === breakdownId ? { ...bd, resolved: true } : bd
    );
    
    // Check if any breakdown is still unresolved
    const hasUnresolved = updatedHistory.some(bd => !bd.resolved);
    
    const updatedTruck = {
      ...selectedTruck,
      status: hasUnresolved ? selectedTruck.status : ('AVAILABLE' as Truck['status']),
      maintenanceReason: hasUnresolved ? selectedTruck.maintenanceReason : '',
      breakdownHistory: updatedHistory
    };
    onUpdateTruck(updatedTruck);
  };

  const handleLogInspection = (title: string, inspector: string, status: 'PASS' | 'FAIL' | 'ADVISORY', notes: string, id?: string) => {
    if (!selectedTruck) return;
    
    let updatedLogs = [...(selectedTruck.inspectionLogs || [])];
    
    if (id) {
      updatedLogs = updatedLogs.map(log => log.id === id ? { ...log, title, inspectorName: inspector, overallStatus: status, notes } : log);
    } else {
      const newLog: InspectionLog = {
        id: `INSP-${Date.now()}`,
        title,
        date: new Date().toISOString().split('T')[0],
        inspectorName: inspector,
        overallStatus: status,
        odometerReading: selectedTruck.currentOdometer,
        notes
      };
      updatedLogs = [newLog, ...updatedLogs];
    }

    const updatedTruck = {
      ...selectedTruck,
      inspectionLogs: updatedLogs
    };
    onUpdateTruck(updatedTruck);
  };

  const handleDeleteInspection = (id: string) => {
    if (!selectedTruck) return;
    const updatedTruck = {
      ...selectedTruck,
      inspectionLogs: (selectedTruck.inspectionLogs || []).filter(log => log.id !== id)
    };
    onUpdateTruck(updatedTruck);
  };

  const handleMaintSubmit = (formData: Partial<MaintenanceExpense>) => {
    if (!selectedTruck) return;
    
    if (editingMaint) {
      const updated = maintenance.map(m => m.id === editingMaint.id ? { ...m, ...formData } as MaintenanceExpense : m);
      onUpdateMaintenance(updated);
    } else {
      const newMaint = { 
        ...formData, 
        id: `MAINT-${Date.now()}`,
        truckId: selectedTruck.id
      } as MaintenanceExpense;
      onUpdateMaintenance([...maintenance, newMaint]);
    }
    setActiveModal(null);
    setEditingMaint(null);
  };

  const handleDeleteMaint = (id: string) => {
    if (!window.confirm('Permanently remove this maintenance expense record?')) return;
    onUpdateMaintenance(maintenance.filter(m => m.id !== id));
  };

  const handleBulkDeleteMaint = () => {
    if (selectedMaintIds.length === 0) return;
    if (!window.confirm(`Permanently remove ${selectedMaintIds.length} maintenance records?`)) return;
    onUpdateMaintenance(maintenance.filter(m => !selectedMaintIds.includes(m.id)));
    setSelectedMaintIds([]);
  };

  const markMaintPaid = (id: string) => {
    const updated = maintenance.map(m => {
        if (m.id === id) {
            return {
                ...m,
                status: 'PAID' as const,
                paidDate: new Date().toISOString().split('T')[0]
            };
        }
        return m;
    });
    onUpdateMaintenance(updated);
  };

  const handleLogOdometer = (value: number, date: string, driver: string, notes?: string, id?: string) => {
    if (!selectedTruck) return;
    
    let updatedHistory = [...(selectedTruck.odometerHistory || [])];
    
    if (id) {
      updatedHistory = updatedHistory.map(h => h.id === id ? { ...h, date, value, recordedBy: driver, notes } : h);
    } else {
      const newReading: OdometerReading = {
        id: `ODO-${Date.now()}`,
        date,
        value,
        recordedBy: driver,
        notes
      };
      updatedHistory = [newReading, ...updatedHistory];
    }

    const updatedTruck: Truck = {
      ...selectedTruck,
      currentOdometer: Math.max(...updatedHistory.map(h => h.value), selectedTruck.currentOdometer),
      odometerHistory: updatedHistory
    };
    onUpdateTruck(updatedTruck);
  };

  const handleDeleteOdometer = (id: string) => {
    if (!selectedTruck) return;
    const updatedHistory = (selectedTruck.odometerHistory || []).filter(h => h.id !== id);
    const updatedTruck: Truck = {
      ...selectedTruck,
      currentOdometer: updatedHistory.length > 0 ? Math.max(...updatedHistory.map(h => h.value)) : selectedTruck.currentOdometer,
      odometerHistory: updatedHistory
    };
    onUpdateTruck(updatedTruck);
  };

  const handleUpdateTyre = (position: TyreDetail['position'], condition: HealthStatus, pressure: number, tread: number, lastChanged: string) => {
    if (!selectedTruck) return;
    const currentTyres = selectedTruck.tyreDetails || [];
    const existingIndex = currentTyres.findIndex(t => t.position === position);
    
    let updatedTyres = [...currentTyres];
    const now = new Date().toISOString().split('T')[0];
    
    if (existingIndex > -1) {
      const existing = currentTyres[existingIndex];
      const newPressureLog: PressureLog = {
        id: `PRES-${Date.now()}`,
        date: now,
        value: pressure
      };
      
      updatedTyres[existingIndex] = {
        ...existing,
        condition,
        pressure,
        treadDepth: tread,
        lastChangedDate: lastChanged,
        pressureHistory: [newPressureLog, ...(existing.pressureHistory || [])].slice(0, 20) // Keep last 20
      };
    } else {
      updatedTyres.push({ 
        position, 
        condition, 
        pressure, 
        treadDepth: tread, 
        lastChangedDate: lastChanged,
        pressureHistory: [{ id: `PRES-${Date.now()}`, date: now, value: pressure }]
      });
    }

    onUpdateTruck({ ...selectedTruck, tyreDetails: updatedTyres });
  };

  const handleRotateTyres = (from: string, to: string, odometer: number, notes?: string, id?: string) => {
    if (!selectedTruck) return;
    
    let updatedHistory = [...(selectedTruck.tyreRotationHistory || [])];
    
    if (id) {
      updatedHistory = updatedHistory.map(r => r.id === id ? { ...r, fromPosition: from, toPosition: to, odometerReading: odometer, notes } : r);
    } else {
      const newEvent: TyreRotationEvent = {
        id: `ROT-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        fromPosition: from,
        toPosition: to,
        odometerReading: odometer,
        notes
      };
      updatedHistory = [newEvent, ...updatedHistory];
    }

    const updatedTruck = {
      ...selectedTruck,
      tyreRotationHistory: updatedHistory
    };
    onUpdateTruck(updatedTruck);
  };

  const handleDeleteRotation = (id: string) => {
    if (!selectedTruck) return;
    if (!window.confirm('Remove this tyre rotation record?')) return;
    
    const history = (selectedTruck.tyreRotationHistory || []).filter(r => r.id !== id);
    const updatedTruck = {
      ...selectedTruck,
      tyreRotationHistory: history
    };
    
    const maxPage = Math.max(1, Math.ceil(history.length / 4));
    if (rotationHistoryPage > maxPage) setRotationHistoryPage(maxPage);
    
    onUpdateTruck(updatedTruck);
  };

  const handleAddDocument = (type: TruckDocument['type'], number: string, expiry: string, files: { name: string, url: string }[], title?: string, publishDate?: string) => {
    if (!selectedTruck) return;
    const docs = selectedTruck.documents || [];
    const newDocs = files.map(file => ({
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      fileName: file.name,
      title: title || file.name,
      fileUrl: file.url,
      uploadDate: new Date().toISOString().split('T')[0],
      documentNumber: number,
      expiryDate: expiry,
      issueDate: publishDate
    }));
    const updatedTruck = {
      ...selectedTruck,
      documents: [...newDocs, ...docs]
    };
    onUpdateTruck(updatedTruck);
  };

  const handleUpdateDocument = (docId: string, type: TruckDocument['type'], number: string, expiry: string, title: string, publishDate: string, file?: { name: string, url: string }) => {
    if (!selectedTruck) return;
    const docs = selectedTruck.documents || [];
    const updatedDocs = docs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          type,
          documentNumber: number,
          expiryDate: expiry,
          title,
          issueDate: publishDate,
          ...(file ? { fileName: file.name, fileUrl: file.url } : {})
        };
      }
      return d;
    });
    const updatedTruck = {
      ...selectedTruck,
      documents: updatedDocs
    };
    onUpdateTruck(updatedTruck);
  };
  
  const handleDownloadPDF = (doc: TruckDocument) => {
    const pdf = new jsPDF();
    const title = doc.title || doc.fileName;
    
    // Header
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("CERTIFIED DOCUMENT", 105, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`${title.toUpperCase()}`, 105, 30, { align: 'center' });
    
    // Document Details Box
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(10, 45, 190, 60, 'F');
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.rect(10, 45, 190, 60, 'D');
    
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(12);
    pdf.text("DOCUMENT METADATA", 15, 55);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text("Category:", 15, 65);
    pdf.text("Number:", 15, 75);
    pdf.text("Issued:", 15, 85);
    pdf.text("Expires:", 15, 95);
    
    pdf.setTextColor(15, 23, 42);
    pdf.text((doc.type || "").replace('_', ' '), 45, 65);
    pdf.text(doc.documentNumber, 45, 75);
    pdf.text(doc.issueDate || 'Not specified', 45, 85);
    pdf.text(doc.expiryDate || 'No expiry', 45, 95);
    
    // Dates Right Side
    pdf.setTextColor(100, 116, 139);
    pdf.text("Upload Date:", 130, 65);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.uploadDate, 160, 65);
    
    // Image Preview
    if (doc.fileUrl && typeof doc.fileUrl === 'string' && doc.fileUrl.startsWith('data:image')) {
      pdf.setFontSize(12);
      pdf.text("VISUAL VERIFICATION", 15, 115);
      
      try {
        // Simple heuristic to fit image
        const imgProps = pdf.getImageProperties(doc.fileUrl);
        const pdfWidth = 180;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // If it fits on first page
        if (pdfHeight < 150) {
          pdf.addImage(doc.fileUrl, 'JPEG', 15, 125, pdfWidth, pdfHeight);
        } else {
          // Add new page for large images
          pdf.addPage();
          pdf.text("FULL DOCUMENT SCAN", 15, 15);
          const largePdfWidth = 190;
          const largePdfHeight = (imgProps.height * largePdfWidth) / imgProps.width;
          pdf.addImage(doc.fileUrl, 'JPEG', 10, 25, largePdfWidth, Math.min(250, largePdfHeight));
        }
      } catch (err) {
        console.error("PDF image error:", err);
      }
    } else {
      pdf.setTextColor(150, 150, 150);
      pdf.text("Digital scan not available in PDF preview. Refer to Operations Vault.", 15, 120);
    }
    
    // Footer
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated by FlyAsh Logistics Pro Systems • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    pdf.save(`${title.replace(/\s+/g, '_')}_FlyAsh_Vault.pdf`);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!selectedTruck) return;
    const updatedTruck = {
      ...selectedTruck,
      documents: (selectedTruck.documents || []).filter(d => d.id !== docId)
    };
    onUpdateTruck(updatedTruck);
  };

  const filteredFleet = fleet.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (type: TruckDocument['type']) => {
    switch (type) {
      case 'RC': return TruckIcon;
      case 'INSURANCE': return ShieldCheck;
      case 'PUC': return Flame;
      case 'STATE_PERMIT': return BadgeCheck;
      case 'NATIONAL_PERMIT': return BadgeCheck;
      case 'FITNESS': return ClipboardCheck;
      case 'ROAD_TAX': return IndianRupee;
      case 'FASTAG': return CreditCard;
      case 'HAZMAT': return ShieldAlert;
      case 'TAX_INVOICE': return FileText;
      case 'DRIVER_LICENCE': return User;
      case 'AUTHORIZATION': return FileCheck;
      case 'WEIGHBRIDGE_RECEIPT': return Scale;
      case 'LOCAL_PERMIT': return BadgeCheck;
      case 'MAINTENANCE_LOG': return Wrench;
      case 'EMI_DOCS': return Coins;
      case 'WARRANTY_CARD': return ShieldCheck;
      default: return FileText;
    }
  };

  const getCategoryColor = (type: TruckDocument['type']) => {
    switch (type) {
      case 'RC': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'INSURANCE': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PUC': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'FITNESS': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'ROAD_TAX': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'STATE_PERMIT': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'NATIONAL_PERMIT': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DRIVER_LICENCE': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'HAZMAT': return 'bg-red-50 text-red-600 border-red-100';
      case 'FASTAG': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'TAX_INVOICE': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'EMI_DOCS': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Truck Health Center</h2>
          <p className="text-slate-500 font-bold">Comprehensive diagnostic monitoring and lifecycle management.</p>
        </div>
        {viewMode === 'grid' ? (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by plate or name..." 
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : (
          <button 
            onClick={handleBackToGrid}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all"
          >
            <ArrowRight size={20} className="rotate-180" /> Back to Fleet
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key="grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredFleet.map(truck => {
              const score = calculateHealthScore(truck);
              const statuses = (Object.values(truck.healthStatus || {}) as any[]).map(s => typeof s === 'string' ? s : s?.status || 'GOOD');
              const isCritical = statuses.includes('CRITICAL') || statuses.includes('BREAKDOWN');
              const isWarning = statuses.includes('WARNING');

              return (
                <div 
                  key={truck.id}
                  className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all p-6 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                        truck.isMaintenanceMode ? 'bg-rose-500 text-white animate-pulse' :
                        isCritical ? 'bg-red-50 text-red-600' : isWarning ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {truck.isMaintenanceMode ? <Wrench size={28} /> : <HeartPulse size={28} />}
                      </div>
                      <div className="text-right">
                        {truck.isMaintenanceMode && (
                          <div className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-2 inline-block">Maint Mode</div>
                        )}
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
                        <div className={`text-2xl font-black ${score > 80 ? 'text-emerald-500' : score > 50 ? 'text-orange-500' : 'text-red-500'}`}>
                          {score}<span className="text-xs">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2 truncate">{truck.name}</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{truck.plateNumber}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>System Integrity</span>
                          <span>{score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Odometer</p>
                          <p className="text-xs font-black text-slate-900">{truck.currentOdometer.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Next Service</p>
                          <p className={`text-xs font-black ${calculateKmToService(truck) && calculateKmToService(truck)! < 1000 ? 'text-red-500' : 'text-slate-900'}`}>
                            {calculateKmToService(truck) !== null ? `${calculateKmToService(truck)} KM` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectTruck(truck.id)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] hover:bg-black transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-slate-200"
                  >
                    Open Health Details
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            key="detail"
            className="space-y-8"
          >
            {!selectedTruck ? (
              <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">Please select a truck to view health details.</p>
                <button 
                  onClick={handleBackToGrid}
                  className="mt-4 text-blue-600 font-black uppercase tracking-widest text-xs"
                >
                  Return to Fleet List
                </button>
              </div>
            ) : (
              <>
              {/* Header Stats */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <HeartPulse size={40} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black tracking-tight">{selectedTruck.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black text-[10px] uppercase tracking-widest leading-none">Diagnostic Center</span>
                    
                    {/* Maintenance Mode Toggle */}
                    <button 
                      onClick={() => {
                        const newMode = !selectedTruck.isMaintenanceMode;
                        onUpdateTruck({
                          ...selectedTruck,
                          isMaintenanceMode: newMode,
                          status: newMode ? 'MAINTENANCE' : (selectedTruck.status === 'MAINTENANCE' ? 'AVAILABLE' : selectedTruck.status)
                        });
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border-2 ${
                        selectedTruck.isMaintenanceMode 
                          ? 'bg-rose-500 text-white border-rose-400' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Wrench size={12} className={selectedTruck.isMaintenanceMode ? 'animate-spin' : ''} />
                      {selectedTruck.isMaintenanceMode ? 'Maintenance: IN' : 'Maintenance: OUT'}
                    </button>
                  </div>
                  <p className="text-slate-400 font-bold">{selectedTruck.modelNumber} • {selectedTruck.plateNumber}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700 backdrop-blur-sm min-w-[120px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Health Score</p>
                  <p className={`text-2xl font-black ${calculateHealthScore(selectedTruck) > 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {calculateHealthScore(selectedTruck)}<span className="text-sm">/100</span>
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700 backdrop-blur-sm min-w-[120px]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Service Due</p>
                  <p className="text-2xl font-black text-blue-400">
                    {calculateKmToService(selectedTruck) !== null 
                      ? `${calculateKmToService(selectedTruck)} km`
                      : 'Not Set'
                    }
                  </p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700 backdrop-blur-sm min-w-[120px] hidden md:block">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Predictive Risk</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${calculateHealthScore(selectedTruck) > 80 ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                    <p className="text-xl font-black text-slate-200">
                      {calculateHealthScore(selectedTruck) > 80 ? 'LOW' : 'MODERATE'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-full lg:w-fit shadow-sm overflow-x-auto no-scrollbar">
            {[
              { id: 'vehicle_details', label: 'Vehicle Details', icon: CarFront },
              { id: 'status', label: 'Systems', icon: Activity },
              { id: 'tyres', label: 'Tyre Map', icon: Disc },
              { id: 'inspection', label: 'Inspections', icon: ClipboardCheck },
              { id: 'odometer', label: 'Odometer Log', icon: CircleGauge },
              { id: 'financial_maint', label: 'Maintenance Expense', icon: IndianRupee },
              { id: 'breakdowns', label: 'Breakdowns', icon: ShieldAlert },
              { id: 'documents', label: 'Vault', icon: FileCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                  activeDetailTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

              {/* Tab Content */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {activeDetailTab === 'vehicle_details' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      key="vehicle_details"
                      className="space-y-6"
                    >
                      {/* Top Summary Card */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 h-full relative group/top">
                        <button 
                          onClick={() => {
                            setActiveEditTruckSection('identity');
                            setEditTruckForm(selectedTruck);
                          }}
                          className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover/top:opacity-100 transition-all border border-slate-100"
                        >
                          <Edit size={16} />
                        </button>
                        <div className="flex items-center gap-6">
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedTruck.plateNumber}</h2>
                                 <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">BS 6</span>
                              </div>
                              <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-3">{selectedTruck.modelNumber || 'HCV Cargo'}</p>
                              <div className="mt-4 pt-4 border-t border-slate-50 flex gap-4 grayscale opacity-50">
                                 <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1 rounded-md uppercase tracking-widest">TATA</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8 flex-1 max-w-4xl">
                           <SummaryStat icon={CircleGauge} label="Overall Kms Run" value={selectedTruck.currentOdometer.toLocaleString()} />
                           <SummaryStat icon={Clock} label="Engine Run Hour" value={`${selectedTruck.engineHours || 0} Hrs`} />
                           <SummaryStat icon={Gauge} label="Overall Fuel Efficiency" value={`${selectedTruck.mileage || 0} Km/L`} />
                           <SummaryStat icon={Droplet} label="Total Fuel Consumed" value={`${(selectedTruck.currentOdometer / (selectedTruck.mileage || 1)).toFixed(1)} L`} />
                           <SummaryStat icon={MapPin} label="Total Completed and Ongoing Trips" value={`${selectedTruck.totalMtHandled || 0}`} />
                        </div>
                      </div>

                      {/* Asset Identity Section */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                              <TruckIcon size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">Asset Identity</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Core Vehicle Identification & Details</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveEditTruckSection('identity');
                              setEditTruckForm(selectedTruck);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-8">
                          <TechnicalDetail label="Asset Name" value={selectedTruck.name} />
                          <TechnicalDetail label="Plate Number" value={selectedTruck.plateNumber} />
                          <TechnicalDetail label="Truck Number" value={selectedTruck.truckNumber || 'N/A'} />
                          <TechnicalDetail label="Model Number" value={selectedTruck.modelNumber || 'N/A'} />
                          <TechnicalDetail label="Tracking ID" value={selectedTruck.trackingId || 'N/A'} />
                          <TechnicalDetail label="Description" value={selectedTruck.description || 'N/A'} />
                        </div>
                      </div>

                      {/* Technical Specifications Section */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                              <Cog size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">Technical Specifications</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engineering Data & Weights</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveEditTruckSection('technical');
                              setEditTruckForm(selectedTruck);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-purple-600 transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-8">
                          <TechnicalDetail label="Engine No" value={selectedTruck.engineNumber || 'N/A'} />
                          <TechnicalDetail label="Fuel Type" value={selectedTruck.fuelType || 'DIESEL'} />
                          <TechnicalDetail label="Branch" value={selectedTruck.branch || 'Default'} />
                          <TechnicalDetail label="Registration Date" value={selectedTruck.registrationDate || '-'} />
                          <TechnicalDetail label="Vehicle Application" value={selectedTruck.vehicleApplication || 'N/A'} />
                          <TechnicalDetail label="Vehicle Code" value={selectedTruck.vehicleCode || 'N/A'} />
                          <TechnicalDetail label="Vehicle Type" value={selectedTruck.vehicleType || 'N/A'} />
                          <TechnicalDetail label="Laden Weight" value={selectedTruck.ladenWeight || 'N/A'} />
                          <TechnicalDetail label="Unladen Weight" value={selectedTruck.unladenWeight || 'N/A'} />
                          <TechnicalDetail label="Tonnage" value={selectedTruck.tonnage || '0'} />
                          <TechnicalDetail label="Make / Year" value={selectedTruck.makeYear || 'N/A'} />
                          <TechnicalDetail label="Registration Address" value={selectedTruck.registrationAddress || 'N/A'} />
                          <TechnicalDetail label="Owned Outside" value={selectedTruck.ownedOutside || 'N/A'} />
                          <TechnicalDetail label="Specification" value={selectedTruck.specification || 'N/A'} />
                        </div>
                      </div>

                      {/* Ownership & Mapping Section */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                              <User size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">Ownership & Mapping</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stakeholder Responsibility & Routing</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveEditTruckSection('ownership');
                              setEditTruckForm(selectedTruck);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-8">
                          <TechnicalDetail label="Owner Name" value={selectedTruck.ownerName || 'N/A'} />
                          <TechnicalDetail label="Owner Contact" value={selectedTruck.ownerContact || 'N/A'} />
                          <TechnicalDetail label="Assigned Driver" value={selectedTruck.driverName || 'Multiple'} />
                          <TechnicalDetail 
                            label="Driver ID" 
                            value={(() => {
                              const driver = drivers.find(d => d.id === selectedTruck.assignedDriverId);
                              return driver?.trackingId || selectedTruck.assignedDriverId || 'N/A';
                            })()} 
                          />
                          <TechnicalDetail 
                            label="Default Route" 
                            value={(() => {
                              const route = routes.find(r => r.id === selectedTruck.defaultRouteId);
                              return route ? `${route.source} → ${route.destination}` : 'Not Assigned';
                            })()} 
                          />
                        </div>
                      </div>

                      {/* Logistics & Metrics Section */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                              <Activity size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">Logistics & Metrics</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance Data & Operational Limits</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveEditTruckSection('logistics');
                              setEditTruckForm(selectedTruck);
                            }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-amber-600 transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-8">
                          <TechnicalDetail label="Mileage" value={`${selectedTruck.mileage || 0} Km/L`} />
                          <TechnicalDetail label="Diesel Limit" value={`${selectedTruck.dieselLimit || 0} L/trip`} />
                          <TechnicalDetail label="MT Handled" value={selectedTruck.totalMtHandled?.toLocaleString() || '0'} />
                          <TechnicalDetail label="Driver Score" value={`${selectedTruck.driverScore || 0}/100`} />
                          <TechnicalDetail label="Idle Time" value={`${selectedTruck.idleTimeHours || 0} Hrs`} />
                          <TechnicalDetail label="Engine Hours" value={`${selectedTruck.engineHours || 0} Hrs`} />
                          <div className="group relative">
                            <TechnicalDetail label="Current Odometer" value={`${selectedTruck.currentOdometer.toLocaleString()} KM`} />
                            <button 
                              onClick={() => {
                                setEditingOdo(null);
                                setActiveModal('odometer');
                              }}
                              className="absolute -top-1 -right-2 p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-blue-100 cursor-pointer"
                              title="Log New Odometer Reading"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <TechnicalDetail label="Service Interval" value={`${selectedTruck.serviceIntervalKm || 'N/A'} KM`} />
                        </div>
                      </div>

                    </motion.div>
                  )}
                  {activeDetailTab === 'status' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      key="status"
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Maintenance Intelligence & Predictive Risk */}
                    <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                         <div className="absolute top-0 right-0 p-8">
                            <Activity size={40} className="text-white/10 group-hover:scale-110 transition-transform" />
                         </div>
                         <div className="relative z-10">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                               Predictive Maintenance Score
                               <span className="px-2 py-0.5 bg-blue-500 rounded-lg text-[8px] uppercase tracking-widest">Beta AI</span>
                            </h3>
                            <div className="flex items-center gap-8">
                               <div className="relative w-24 h-24">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - calculateHealthScore(selectedTruck) / 100)} className="text-blue-400" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-white">{calculateHealthScore(selectedTruck)}%</span>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <div>
                                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Operational Risk</p>
                                     <p className={`text-sm font-bold ${calculateHealthScore(selectedTruck) > 85 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                        {calculateHealthScore(selectedTruck) > 85 ? 'Optimized Environment' : 'Attention Required'}
                                     </p>
                                  </div>
                                  <div className="flex gap-4">
                                     <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                        <p className="text-[8px] text-white/30 font-black uppercase">Next Fail Prediction</p>
                                        <p className="text-xs text-white font-bold">~45 Days</p>
                                     </div>
                                     <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                        <p className="text-[8px] text-white/30 font-black uppercase">Complexity Index</p>
                                        <p className="text-xs text-white font-bold">Medium</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                  <BadgeCheck size={24} />
                               </div>
                               <div>
                                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Fleet Compliance Vault</h3>
                                  <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest mt-0.5">Real-time Document Monitor</p>
                               </div>
                            </div>
                            
                            {/* Pagination Toggle */}
                            {(selectedTruck.documents || []).length > 3 && (
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setCompliancePage(p => Math.max(1, p - 1))}
                                    disabled={compliancePage === 1}
                                    className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all"
                                  >
                                    <ChevronLeft size={16} />
                                  </button>
                                  <span className="text-[10px] font-black text-slate-400">{compliancePage} / {Math.ceil((selectedTruck.documents?.length || 0) / 3)}</span>
                                  <button 
                                    onClick={() => setCompliancePage(p => Math.min(Math.ceil((selectedTruck.documents?.length || 0) / 3), p + 1))}
                                    disabled={compliancePage >= Math.ceil((selectedTruck.documents?.length || 0) / 3)}
                                    className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all"
                                  >
                                    <ChevronRight size={16} />
                                  </button>
                               </div>
                            )}
                         </div>

                         <div className="space-y-4">
                            {(() => {
                               const docs = (selectedTruck.documents || []);
                               const paginatedDocs = docs.slice((compliancePage - 1) * 3, compliancePage * 3);
                               
                               return paginatedDocs.length > 0 ? paginatedDocs.map((doc) => {
                                 const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                                 const now = new Date();
                                 const isExpired = expiryDate && expiryDate < now;
                                 const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                 const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 10;
                                 
                                 return (
                                   <div key={doc.id} className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${isExpired ? 'bg-red-50/50 border-red-100' : isExpiringSoon ? 'bg-orange-50/50 border-orange-100 animate-pulse' : 'bg-slate-50 border-slate-100'}`}>
                                      <div className="flex items-center justify-between mb-3 relative z-10">
                                         <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${getCategoryColor(doc.type)}`}>
                                               <FileText size={18} />
                                            </div>
                                            <div>
                                               <h4 className="text-xs font-black text-slate-900 tracking-tight truncate max-w-[120px]">{doc.title || doc.fileName}</h4>
                                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{(doc.type || "").replace('_', ' ')}</p>
                                            </div>
                                         </div>
                                         <div className="flex flex-col items-end">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-emerald-500'}`}>
                                               {isExpired ? 'Expired' : isExpiringSoon ? `${daysUntilExpiry} Days Due` : 'Valid'}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400">{doc.expiryDate || 'No Expiry'}</span>
                                         </div>
                                      </div>
                                      
                                      {/* Real-time Indicator Bar */}
                                      <div className="h-1 w-full bg-white rounded-full overflow-hidden">
                                         <motion.div 
                                           initial={{ width: 0 }}
                                           animate={{ width: isExpired ? '100%' : isExpiringSoon ? '40%' : '100%' }}
                                           className={`h-full rounded-full ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                         />
                                      </div>
                                   </div>
                                 );
                               }) : (
                                 <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <FileX size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Documents Found</p>
                                 </div>
                               );
                            })()}
                         </div>
                      </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3">
                       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                             <div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Performance Lifecycle</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-[9px]">Uptime vs Maintenance Correlation</p>
                             </div>
                             <div className="flex gap-2">
                                <div className="flex items-center gap-1.5">
                                   <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Efficiency</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Cost Index</span>
                                </div>
                             </div>
                          </div>
                          <div className="h-[250px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                   { day: 'Mon', efficiency: 88, cost: 20 },
                                   { day: 'Tue', efficiency: 92, cost: 15 },
                                   { day: 'Wed', efficiency: 75, cost: 45 },
                                   { day: 'Thu', efficiency: 85, cost: 25 },
                                   { day: 'Fri', efficiency: 90, cost: 10 },
                                   { day: 'Sat', efficiency: 95, cost: 5 },
                                   { day: 'Sun', efficiency: 94, cost: 8 },
                                ]}>
                                   <defs>
                                      <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                   <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} dy={10} />
                                   <YAxis hide />
                                   <Tooltip 
                                     contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '12px' }}
                                   />
                                   <Area type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorEff)" />
                                   <Area type="monotone" dataKey="cost" stroke="#e2e8f0" strokeWidth={2} fill="transparent" />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                       </div>
                    </div>

                    <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(selectedTruck.healthStatus || {}).map(([key, value]) => {
                      const comp = (value && typeof value === 'object') 
                        ? value as TruckHealthComponent
                        : { status: (value as any) || 'GOOD', lastChecked: 'N/A', notes: 'Status information' } as TruckHealthComponent;
                      return (
                        <HealthComponentCard 
                          key={key}
                          name={key}
                          comp={comp}
                          onUpdate={(status, notes) => handleUpdateComponent(key as any, status, notes)}
                        />
                      );
                    })}
                    
                    {/* Emergency Trigger */}
                    <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 flex flex-col justify-between group overflow-hidden relative">
                      <AlertCircle size={80} className="absolute -bottom-4 -right-4 text-red-500/5 rotate-12 group-hover:rotate-0 transition-transform" />
                      <div>
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-red-200">
                          <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-black text-red-900 mb-2">Emergency Breakdown</h3>
                        <p className="text-red-600 font-bold text-sm leading-relaxed mb-6">Log active breakdown for roadside assistance and route diversion.</p>
                      </div>
                      <button 
                        onClick={() => setActiveModal('breakdown')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                      >
                        Log Breakdown Action
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              )}

              {activeDetailTab === 'tyres' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="tyres"
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row gap-12">
                    {/* Visual Map */}
                    <div className="flex-1 max-w-xl mx-auto lg:mx-0">
                      <div className="relative bg-slate-50 rounded-[3rem] border-4 border-slate-100 p-8 pt-16 pb-16">
                        {/* Cab Area */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-slate-200 rounded-b-[2rem] border-x-2 border-b-2 border-slate-300 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Front</p>
                            <p className="text-sm font-black text-slate-800 tracking-tighter">CABIN AREA</p>
                          </div>
                        </div>

                        {/* Truck Frame Outline */}
                        <div className="w-full border-x-4 border-dashed border-slate-200 flex flex-col items-center py-10 space-y-12 min-h-[600px]">
                          
                          {/* Axle 0 (Front Steering) */}
                          <div className="w-full">
                            <div className="flex justify-between w-full px-8">
                               <TyreWheel position="FL" detail={selectedTruck.tyreDetails?.find(t => t.position === 'FL')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                               <TyreWheel position="FR" detail={selectedTruck.tyreDetails?.find(t => t.position === 'FR')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                            </div>
                          </div>

                          {/* Dynamic Axles based on wheelConfiguration */}
                          {(!selectedTruck.wheelConfiguration || selectedTruck.wheelConfiguration >= 4) && (
                            <div className="w-full space-y-2">
                               <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Axle 01</p>
                               </div>
                               <div className="flex justify-between w-full px-8">
                                 {selectedTruck.wheelConfiguration === 4 || selectedTruck.wheelConfiguration === 12 || selectedTruck.wheelConfiguration === 16 || selectedTruck.wheelConfiguration === 20 ? (
                                   <>
                                     <TyreWheel position="ALO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ALO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                     <TyreWheel position="ARO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ARO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   </>
                                 ) : (
                                   <>
                                     <div className="flex gap-2">
                                       <TyreWheel position="ALO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ALO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                       <TyreWheel position="ALI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ALI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                     </div>
                                     <div className="flex gap-2">
                                       <TyreWheel position="ARI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ARI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                       <TyreWheel position="ARO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ARO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                     </div>
                                   </>
                                 )}
                               </div>
                            </div>
                          )}

                          {/* Axle 2 */}
                          {(selectedTruck.wheelConfiguration && selectedTruck.wheelConfiguration >= 10) && (
                            <div className="w-full space-y-2">
                               <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Axle 02</p>
                               </div>
                               <div className="flex justify-between w-full px-8">
                                 <div className="flex gap-2">
                                   <TyreWheel position="BLO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'BLO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="BLI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'BLI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                                 <div className="flex gap-2">
                                   <TyreWheel position="BRI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'BRI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="BRO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'BRO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                               </div>
                            </div>
                          )}

                          {/* Axle 3 */}
                          {(selectedTruck.wheelConfiguration && selectedTruck.wheelConfiguration >= 12) && (
                            <div className="w-full space-y-2">
                               <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Axle 03</p>
                               </div>
                               <div className="flex justify-between w-full px-8">
                                 <div className="flex gap-2">
                                   <TyreWheel position="CLO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'CLO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="CLI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'CLI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                                 <div className="flex gap-2">
                                   <TyreWheel position="CRI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'CRI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="CRO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'CRO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                               </div>
                            </div>
                          )}

                          {/* Axle 4 */}
                          {(selectedTruck.wheelConfiguration && selectedTruck.wheelConfiguration >= 16) && (
                            <div className="w-full space-y-2">
                               <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Axle 04</p>
                               </div>
                               <div className="flex justify-between w-full px-8">
                                 <div className="flex gap-2">
                                   <TyreWheel position="DLO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'DLO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="DLI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'DLI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                                 <div className="flex gap-2">
                                   <TyreWheel position="DRI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'DRI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="DRO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'DRO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                               </div>
                            </div>
                          )}

                          {/* Axle 5 */}
                          {(selectedTruck.wheelConfiguration && selectedTruck.wheelConfiguration >= 20) && (
                            <div className="w-full space-y-2">
                               <div className="text-center">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Axle 05</p>
                               </div>
                               <div className="flex justify-between w-full px-8">
                                 <div className="flex gap-2">
                                   <TyreWheel position="ELO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ELO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="ELI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ELI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                                 <div className="flex gap-2">
                                   <TyreWheel position="ERI" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ERI')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                   <TyreWheel position="ERO" detail={selectedTruck.tyreDetails?.find(t => t.position === 'ERO')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                                 </div>
                               </div>
                            </div>
                          )}

                          {/* Spares */}
                          <div className="w-full space-y-2 pt-10 border-t border-dashed border-slate-200">
                             <div className="text-center">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Spare Inventory</p>
                             </div>
                             <div className="flex justify-center gap-10">
                               <TyreWheel position="S1" detail={selectedTruck.tyreDetails?.find(t => t.position === 'S1')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                               <TyreWheel position="S2" detail={selectedTruck.tyreDetails?.find(t => t.position === 'S2')} onManage={(pos) => { setSelectedTyrePos(pos); setActiveModal('tyre'); }} />
                             </div>
                          </div>
                        </div>

                        {/* Rear Label */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-slate-100 rounded-t-2xl border-x-2 border-t-2 border-slate-200 flex items-center justify-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rear End</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Legend */}
                    <div className="flex-1 space-y-8">
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Tyre Fleet Map</h3>
                            <p className="text-slate-500 font-bold text-sm">Managing individual tyre lifecycle, rotation patterns, and pressure calibration.</p>
                          </div>
                          <button 
                            onClick={() => setActiveModal('rotation' as any)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                          >
                            <History size={14} /> Log Rotation
                          </button>
                        </div>

                        {/* Configuration Dropdown */}
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Truck Configuration</label>
                            <Settings size={14} className="text-slate-300" />
                          </div>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer"
                            value={selectedTruck.wheelConfiguration || 6}
                            onChange={(e) => onUpdateTruck({ ...selectedTruck, wheelConfiguration: parseInt(e.target.value) as any })}
                          >
                            <option value={4}>4 Wheel (2 Axles)</option>
                            <option value={6}>6 Wheel (2 Axles - Dual Rear)</option>
                            <option value={10}>10 Wheel (3 Axles - Dual Drive)</option>
                            <option value={12}>12 Wheel (4 Axles - Multi-steer)</option>
                            <option value={14}>14 Wheel (4 Axles - Tag/Pusher)</option>
                            <option value={16}>16 Wheel (5 Axles)</option>
                            <option value={18}>18 Wheel (5 Axles - Heavy)</option>
                            <option value={20}>20 Wheel (6 Axles - Multi-drive)</option>
                            <option value={22}>22 Wheel (Special Haulage)</option>
                          </select>
                          <p className="mt-3 text-[10px] font-bold text-slate-400 italic">Changing configuration will adjust the visual map and position options.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Optimal Pressure</p>
                          <p className="text-xl font-black text-emerald-700">120 PSI</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Avg Tread</p>
                          <p className="text-xl font-black text-blue-700">12 mm</p>
                        </div>
                      </div>

                      {/* Tyre Detailed Log Section */}
                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <ClipboardList size={20} />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tyre Health Inventory</h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                                <th className="pb-4 pl-4 font-black">Position</th>
                                <th className="pb-4 font-black">Condition</th>
                                <th className="pb-4 font-black">Pressure</th>
                                <th className="pb-4 font-black">Tread</th>
                                <th className="pb-4 pr-4 font-black">Last Change</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {([...(selectedTruck.tyreDetails || [])]
                                .sort((a,b) => a.position.localeCompare(b.position))
                                .slice((tyreInventoryPage - 1) * 5, tyreInventoryPage * 5)
                              ).map(tyre => (
                                <tr key={tyre.position} className="bg-slate-50 border border-slate-100 rounded-2xl group hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedTyrePos(tyre.position); setActiveModal('tyre'); }}>
                                  <td className="py-4 pl-4 rounded-l-2xl font-black text-slate-900">{tyre.position}</td>
                                  <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      tyre.condition === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-600' :
                                      tyre.condition === 'GOOD' ? 'bg-blue-50 text-blue-600' :
                                      tyre.condition === 'WARNING' ? 'bg-amber-50 text-amber-600' :
                                      'bg-rose-50 text-rose-600'
                                    }`}>
                                      {tyre.condition}
                                    </span>
                                  </td>
                                  <td className="py-4 font-bold text-slate-600">{tyre.pressure} PSI</td>
                                  <td className="py-4 font-bold text-slate-600">{tyre.treadDepth} mm</td>
                                  <td className="py-4 pr-4 rounded-r-2xl font-bold text-slate-400">{tyre.lastChangedDate || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        {selectedTruck.tyreDetails && selectedTruck.tyreDetails.length > 5 && (
                          <div className="flex items-center justify-between mt-6 px-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Showing {Math.min((tyreInventoryPage - 1) * 5 + 1, selectedTruck.tyreDetails.length)}-{Math.min(tyreInventoryPage * 5, selectedTruck.tyreDetails.length)} of {selectedTruck.tyreDetails.length}
                            </p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setTyreInventoryPage(p => Math.max(1, p - 1))}
                                disabled={tyreInventoryPage === 1}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button 
                                onClick={() => setTyreInventoryPage(p => Math.min(Math.ceil((selectedTruck.tyreDetails?.length || 0) / 5), p + 1))}
                                disabled={tyreInventoryPage >= Math.ceil((selectedTruck.tyreDetails?.length || 0) / 5)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Integrated Rotation History Section */}
                  <div className="mt-12 pt-12 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                          <History size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tyre Rotation History</h3>
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Lifecycle Swap Logs</p>
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      {(selectedTruck.tyreRotationHistory || []).length > 4 && (
                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                          <button 
                            disabled={rotationHistoryPage === 1}
                            onClick={() => setRotationHistoryPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:text-blue-600 transition-all shadow-sm"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {rotationHistoryPage} of {Math.ceil((selectedTruck.tyreRotationHistory?.length || 0) / 4)}
                          </span>
                          <button 
                            disabled={rotationHistoryPage >= Math.ceil((selectedTruck.tyreRotationHistory?.length || 0) / 4)}
                            onClick={() => setRotationHistoryPage(p => p + 1)}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:text-blue-600 transition-all shadow-sm"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedTruck.tyreRotationHistory || []).length > 0 ? (
                        (selectedTruck.tyreRotationHistory || [])
                          .slice((rotationHistoryPage - 1) * 4, rotationHistoryPage * 4)
                          .map(entry => (
                          <div key={entry.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-4 group hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                  <History size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-black text-slate-900">{entry.fromPosition}</span>
                                    <ArrowRight size={14} className="text-blue-500" />
                                    <span className="font-black text-slate-900">{entry.toPosition}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{entry.date}</span>
                                    <span>•</span>
                                    <span>{entry.odometerReading.toLocaleString()} KM</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingRotation(entry);
                                    setActiveModal('rotation');
                                  }}
                                  className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                  title="Edit Entry"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRotation(entry.id);
                                  }}
                                  className="p-2 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                  title="Delete Entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 ml-2">
                                   <CheckCircle2 size={16} />
                                </div>
                              </div>
                            </div>
                            
                            {entry.notes && (
                              <div className="p-3 bg-white/50 rounded-xl border border-slate-100">
                                <p className="text-[11px] text-slate-500 font-medium italic">"{entry.notes}"</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                           <History size={48} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No Rotation Records Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDetailTab === 'inspection' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="inspection"
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col gap-6 mb-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Daily Inspection Log (DVIR)</h3>
                          <p className="text-slate-500 font-bold text-sm">Legal compliance checks for daily fitness verification.</p>
                        </div>
                        <button 
                          onClick={() => setActiveModal('inspection')}
                          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                        >
                          <ClipboardCheck size={16} /> New Inspection
                        </button>
                      </div>

                      {/* Filters & Search UI */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem]">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Search Log</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text"
                              placeholder="Title or Inspector Name..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                              value={inspectionSearch}
                              onChange={e => { setInspectionSearch(e.target.value); setInspectionPage(1); }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 outline-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all"
                            value={inspectionStatusFilter}
                            onChange={e => { setInspectionStatusFilter(e.target.value as any); setInspectionPage(1); }}
                          >
                            <option value="ALL">All Status</option>
                            <option value="PASS">Pass</option>
                            <option value="FAIL">Fail</option>
                            <option value="ADVISORY">Advisory</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Insp. Date</label>
                          <input 
                            type="date"
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-3 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            value={inspectionDateFilter}
                            onChange={e => { setInspectionDateFilter(e.target.value); setInspectionPage(1); }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Res. Date</label>
                          <input 
                            type="date"
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-3 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            value={inspectionResDateFilter}
                            onChange={e => { setInspectionResDateFilter(e.target.value); setInspectionPage(1); }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(() => {
                        const filteredLogs = (selectedTruck.inspectionLogs || []).filter(log => {
                          const matchesSearch = 
                            (log.title || '').toLowerCase().includes(inspectionSearch.toLowerCase()) ||
                            log.inspectorName.toLowerCase().includes(inspectionSearch.toLowerCase());
                          const matchesStatus = inspectionStatusFilter === 'ALL' || log.overallStatus === inspectionStatusFilter;
                          const matchesDate = !inspectionDateFilter || log.date === inspectionDateFilter;
                          const matchesResDate = !inspectionResDateFilter || log.resolvedDate === inspectionResDateFilter;
                          return matchesSearch && matchesStatus && matchesDate && matchesResDate;
                        });

                        const totalPages = Math.ceil(filteredLogs.length / 10);
                        const paginatedLogs = filteredLogs
                          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice((inspectionPage - 1) * 10, inspectionPage * 10);

                        return (
                          <>
                            {filteredLogs.length === 0 ? (
                              <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                <Search className="mx-auto text-slate-300 mb-4" size={40} />
                                <p className="text-slate-500 font-bold mb-1">No inspection logs found.</p>
                                <p className="text-slate-400 text-xs font-medium">Try adjusting your filters or search terms.</p>
                              </div>
                            ) : (
                              paginatedLogs.map(log => (
                                <div key={log.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-4 group hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.overallStatus === 'PASS' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {log.overallStatus === 'PASS' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors uppercase tracking-tight">{log.title || 'Standard Inspection'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.inspectorName} • {log.date} • {log.odometerReading} km</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        log.overallStatus === 'PASS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        log.overallStatus === 'FAIL' ? 'bg-red-50 text-red-600 border-red-100' : 
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                      }`}>
                                        {log.overallStatus}
                                      </span>
                                      {log.isResolved ? (
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                                          <ShieldCheck size={12} /> Resolved
                                        </span>
                                      ) : log.overallStatus !== 'PASS' && (
                                        <button 
                                          onClick={() => { setSelectedInspectionLogId(log.id); setActiveModal('resolve_inspection'); }}
                                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                        >
                                          Mark as Resolved
                                        </button>
                                      )}
                                      <div className="flex items-center gap-2">
                                         <button 
                                           onClick={() => {
                                             setEditingInspection(log);
                                             setActiveModal('inspection');
                                           }}
                                           className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                           title="Edit Entry"
                                         >
                                           <Pencil size={14} />
                                         </button>
                                         <button 
                                           onClick={() => handleDeleteInspection(log.id)}
                                           className="p-2 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                           title="Delete Entry"
                                         >
                                           <Trash2 size={14} />
                                         </button>
                                      </div>
                                     </div>
                                   </div>
                                  
                                  <div className="pl-14">
                                    <p className="text-slate-600 text-sm font-medium italic">"{log.notes}"</p>
                                    {log.isResolved && (
                                      <div className="mt-3 p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Resolution Log - {log.resolvedDate}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold italic">"{log.resolutionNotes}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Inspection Pagination UI */}
                            {filteredLogs.length > 10 && (
                              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 px-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Showing {Math.min((inspectionPage - 1) * 10 + 1, filteredLogs.length)}-{Math.min(inspectionPage * 10, filteredLogs.length)} of {filteredLogs.length} Records
                                </p>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setInspectionPage(p => Math.max(1, p - 1))}
                                    disabled={inspectionPage === 1}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                  >
                                    <ChevronLeft size={16} /> Previous
                                  </button>
                                  <button 
                                    onClick={() => setInspectionPage(p => Math.min(totalPages, p + 1))}
                                    disabled={inspectionPage >= totalPages}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                  >
                                    Next <ChevronRight size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDetailTab === 'odometer' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="odometer"
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Odometer Reading History</h3>
                        <p className="text-slate-500 font-bold text-sm">Chronological log of vehicle distance metrics and driver reports.</p>
                      </div>
                      <button 
                        onClick={() => setActiveModal('odometer')}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                      >
                        <Plus size={16} /> Log Odometer
                      </button>
                    </div>

                    {/* Odometer Analytics Chart */}
                    {(selectedTruck.odometerHistory || []).length > 1 && (
                      <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center justify-between mb-6 px-2">
                          <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Mileage Progression</p>
                            <h4 className="text-sm font-black text-slate-900">Distance over Time Analytics</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Odometer</p>
                            <p className="text-lg font-black text-slate-900">{selectedTruck.currentOdometer.toLocaleString()} KM</p>
                          </div>
                        </div>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[...(selectedTruck.odometerHistory || [])].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorOdo" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                                tickFormatter={(val) => {
                                  const date = new Date(val);
                                  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                                }}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#ffffff', 
                                  border: 'none', 
                                  borderRadius: '16px', 
                                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                  padding: '12px'
                                }}
                                itemStyle={{ color: '#0f172a', fontWeight: 900, fontSize: '12px' }}
                                labelStyle={{ color: '#64748b', fontWeight: 700, fontSize: '10px', marginBottom: '4px' }}
                                formatter={(value: number) => [`${value.toLocaleString()} KM`, 'Odometer']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#2563eb" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorOdo)" 
                                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {(selectedTruck.odometerHistory || []).length > 0 ? (
                        (selectedTruck.odometerHistory || []).map(entry => (
                          <div key={entry.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                                <CircleGauge size={20} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm">{entry.value.toLocaleString()} KM</p>
                                <p className="text-[10px] font-bold text-slate-400">{entry.date} • Recorded by {entry.recordedBy}</p>
                              </div>
                            </div>
                            {entry.notes && (
                              <p className="text-slate-600 text-sm font-medium italic">"{entry.notes}"</p>
                            )}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingOdo(entry);
                                  setActiveModal('odometer');
                                }}
                                className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                title="Edit Entry"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteOdometer(entry.id)}
                                className="p-2 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                title="Delete Entry"
                              >
                                <Trash2 size={14} />
                              </button>
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm ml-2">
                                 <CheckCircle2 size={16} className="text-emerald-500" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                           <CircleGauge size={48} className="mx-auto text-slate-300 mb-4" />
                           <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No Odometer Entries</p>
                           <p className="text-slate-400 text-sm font-bold">Start logging to track vehicle wear and mileage efficiency.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeDetailTab === 'breakdowns' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="breakdowns"
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Breakdown History</h3>
                        <p className="text-slate-500 font-bold text-sm">Critical failure records and emergency assistance logs.</p>
                      </div>
                      <button 
                        onClick={() => setActiveModal('breakdown')}
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                      >
                        <AlertTriangle size={16} /> Report New Breakdown
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(selectedTruck.breakdownHistory || []).length > 0 ? (
                        (selectedTruck.breakdownHistory || []).map(entry => (
                          <div key={entry.id} className={`p-6 rounded-[2rem] border ${entry.resolved ? 'border-slate-100 bg-slate-50/50' : 'border-red-100 bg-red-50/30'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                            <div className="flex items-start gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${entry.resolved ? 'bg-white text-slate-400 border border-slate-100' : 'bg-red-600 text-white shadow-lg shadow-red-200'}`}>
                                <ShieldAlert size={28} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-black text-slate-900 text-lg">{entry.description}</h4>
                                  {entry.resolved ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-widest">Resolved</span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-widest animate-pulse">Critical Failure</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {entry.date}</span>
                                  <span className="flex items-center gap-1.5"><Zap size={14} /> {entry.location}</span>
                                  {entry.cost && <span className="flex items-center gap-1.5"><IndianRupee size={14} /> ₹{entry.cost.toLocaleString()}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {!entry.resolved && (
                                <button 
                                  onClick={() => handleResolveBreakdown(entry.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                  Mark as Resolved
                                </button>
                              )}
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingBreakdown(entry);
                                    setActiveModal('breakdown');
                                  }}
                                  className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                  title="Edit Entry"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteBreakdown(entry.id)}
                                  className="p-2 rounded-xl bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                  title="Delete Entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                           <ShieldAlert size={64} className="mx-auto text-slate-200 mb-6" />
                           <p className="text-slate-500 font-black uppercase text-xs tracking-[0.2em] mb-2">No Breakdown Reports</p>
                           <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto">This vehicle has maintained a flawless operational uptime record.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {(activeDetailTab as string) === 'service_removed' && false && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="service_removed"
                  className="space-y-6"
                >
                  {/* Service Overdue/Due Banner */}
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                    <Wrench size={140} className="absolute -left-10 -bottom-10 text-white/5 -rotate-12" />
                    <div className="relative z-10">
                      <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Predictive Maintenance</p>
                      <h3 className="text-3xl font-black text-white tracking-tight mb-4">Major Service Required In</h3>
                      <div className="flex items-end gap-2">
                        <span className="text-6xl font-black text-white leading-none">
                          {calculateKmToService(selectedTruck) || '---'}
                        </span>
                        <span className="text-2xl font-black text-slate-500 mb-1">KM</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md min-w-[300px]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Service Progress</span>
                        <span className="text-xs font-black text-white">82%</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }} />
                      </div>
                      <button 
                        onClick={() => { setActiveModal('service'); }}
                        className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl"
                      >
                        Record Full Service
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Maintenance Lifecycle</h3>
                    <div className="space-y-4">
                      {(selectedTruck.serviceHistory || []).map(record => (
                        <div key={record.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                              <Wrench size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-black text-slate-900">{record.type} Service</h4>
                                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">{record.id.split('-')[0]}</span>
                              </div>
                              <p className="text-slate-500 font-bold text-sm">{record.date} • {record.odometerReading} km</p>
                            </div>
                          </div>
                          
                          <div className="max-w-xs">
                             <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{record.description}"</p>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {record.partsReplaced.map(p => (
                                  <span key={p} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-wider">{p}</span>
                                ))}
                             </div>
                             {record.workshopName && (
                               <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Workshop: {record.workshopName}</p>
                             )}
                             {(record.nextServiceDueKm || record.nextServiceDueDate) && (
                               <div className="mt-2 flex items-center gap-3">
                                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Next Due:</p>
                                 <div className="flex items-center gap-2">
                                   {record.nextServiceDueKm && (
                                     <span className="text-[10px] font-bold text-slate-600">{record.nextServiceDueKm.toLocaleString()} KM</span>
                                   )}
                                   {record.nextServiceDueKm && record.nextServiceDueDate && (
                                     <span className="text-slate-300">|</span>
                                   )}
                                   {record.nextServiceDueDate && (
                                     <span className="text-[10px] font-bold text-slate-600">{record.nextServiceDueDate}</span>
                                   )}
                                 </div>
                               </div>
                             )}
                          </div>

                          <div className="text-right flex flex-col items-end gap-3">
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Value</p>
                               <p className="text-xl font-black text-slate-900">₹{(record.cost || 0).toLocaleString()}</p>
                             </div>
                             <div className="flex items-center gap-2">
                               <button 
                                 onClick={() => { setActiveModal('service'); }}
                                 className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all group"
                               >
                                 <Pencil size={14} className="group-hover:scale-110 transition-transform" />
                               </button>
                               <button 
                                 onClick={() => {}}
                                 className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all group"
                               >
                                 <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                               </button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeDetailTab === 'financial_maint' && selectedTruck && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="financial_maint"
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 group hover:border-green-200 transition-all">
                       <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={32} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Paid Maintenance</p>
                          <div className="flex items-baseline gap-2">
                             <h4 className="text-3xl font-black text-slate-900 leading-none">
                               ₹{(maintenance.filter(m => m.truckId === selectedTruck.id && m.status === 'PAID').reduce((sum, m) => sum + m.amount, 0) || 0).toLocaleString()}
                             </h4>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6 group hover:border-red-200 transition-all">
                       <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                          <AlertCircle size={32} className="animate-pulse" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Unpaid Liabilities</p>
                          <div className="flex items-baseline gap-2">
                             <h4 className="text-3xl font-black text-slate-900 leading-none">
                               ₹{(maintenance.filter(m => m.truckId === selectedTruck.id && m.status === 'UNPAID').reduce((sum, m) => sum + m.amount, 0) || 0).toLocaleString()}
                             </h4>
                             <span className="text-xs font-bold text-red-500">
                               ({maintenance.filter(m => m.truckId === selectedTruck.id && m.status === 'UNPAID').length} Records)
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search maintenance records..."
                        value={maintSearch}
                        onChange={(e) => setMaintSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
                      />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowMaintFilters(!showMaintFilters)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black transition-all ${showMaintFilters ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={18} /> Filters
                        </button>
                        <button 
                          onClick={() => { setEditingMaint(null); setActiveModal('maint_log'); }} 
                          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all"
                        >
                            <Plus size={20} /> Log Expense
                        </button>
                    </div>
                  </div>

                  {showMaintFilters && (
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Responsible Staff</label>
                                <select 
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                                    value={maintFilters.employeeId}
                                    onChange={e => setMaintFilters({...maintFilters, employeeId: e.target.value})}
                                >
                                    <option value="">All Staff</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date Range</label>
                                <div className="flex gap-2">
                                    <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.startDate} onChange={e => setMaintFilters({...maintFilters, startDate: e.target.value})} />
                                    <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={maintFilters.endDate} onChange={e => setMaintFilters({...maintFilters, endDate: e.target.value})} />
                                </div>
                            </div>

                            <div className="flex items-end">
                              <button 
                                  onClick={() => setMaintFilters({
                                      status: 'ALL',
                                      employeeId: '',
                                      startDate: '',
                                      endDate: '',
                                      category: 'ALL'
                                  })}
                                  className="w-full bg-white border border-slate-200 text-slate-500 px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-100 transition-all uppercase tracking-widest"
                              >
                                  Reset All
                              </button>
                            </div>
                        </div>
                    </div>
                  )}

                  {selectedMaintIds.length > 0 && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-in fade-in slide-in-from-left-4">
                      <p className="text-blue-600 font-bold text-sm">{selectedMaintIds.length} records selected</p>
                      <button 
                        onClick={handleBulkDeleteMaint}
                        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                      >
                        <Trash2 size={14} /> Bulk Delete
                      </button>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                 <th className="px-6 py-5 w-10">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded border-slate-300 focus:ring-blue-500"
                                      onChange={(e) => {
                                        const truckMaintIds = maintenance.filter(m => m.truckId === selectedTruck.id).map(m => m.id);
                                        if (e.target.checked) setSelectedMaintIds(truckMaintIds);
                                        else setSelectedMaintIds([]);
                                      }}
                                      checked={selectedMaintIds.length > 0 && selectedMaintIds.length === maintenance.filter(m => m.truckId === selectedTruck.id).length}
                                    />
                                 </th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parts Replaced</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payment Status</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Category</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workshop / Vendor</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Due</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</th>
                                 <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Responsible Staff</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {maintenance
                                .filter(m => {
                                  if (m.truckId !== selectedTruck.id) return false;
                                  if (maintSearch && !m.description.toLowerCase().includes(maintSearch.toLowerCase()) && !m.workshopName.toLowerCase().includes(maintSearch.toLowerCase())) return false;
                                  if (maintFilters.status !== 'ALL' && m.status !== maintFilters.status) return false;
                                  if (maintFilters.employeeId && m.employeeId !== maintFilters.employeeId) return false;
                                  if (maintFilters.startDate && m.date < maintFilters.startDate) return false;
                                  if (maintFilters.endDate && m.date > maintFilters.endDate) return false;
                                  return true;
                                })
                                .map(m => (
                                <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${selectedMaintIds.includes(m.id) ? 'bg-blue-50/30' : ''}`}>
                                   <td className="px-6 py-6">
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-300 focus:ring-blue-500"
                                        checked={selectedMaintIds.includes(m.id)}
                                        onChange={() => {
                                          if (selectedMaintIds.includes(m.id)) setSelectedMaintIds(selectedMaintIds.filter(id => id !== m.id));
                                          else setSelectedMaintIds([...selectedMaintIds, m.id]);
                                        }}
                                      />
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-sm font-black text-slate-900">{m.date}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                                         {m.partsReplaced && m.partsReplaced.length > 0 ? m.partsReplaced.map((p, i) => (
                                            <span key={`${m.id}-${p}-${i}`} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold rounded uppercase truncate">
                                               {p}
                                            </span>
                                         )) : <span className="text-[10px] text-slate-300 italic">None</span>}
                                      </div>
                                   </td>
                                   <td className="px-6 py-6">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                        m.category === 'BREAKDOWN' ? 'bg-red-50 text-red-600 border-red-200' :
                                        m.category === 'TYRE' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                        'bg-blue-50 text-blue-600 border-blue-200'
                                      }`}>
                                         {m.category}
                                      </span>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] text-slate-900 font-black uppercase">{m.workshopName}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{m.paymentMode?.replace('_', ' ') || 'CASH'}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-sm font-black text-slate-900">₹{m.amount.toLocaleString()}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] font-black text-slate-600 uppercase">{m.responsibleStaff || employees.find(e => e.id === m.employeeId)?.fullName || 'N/A'}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] text-slate-900 font-black">{m.odometerReading.toLocaleString()} KM</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] font-black text-blue-600">{m.nextServiceDueKm?.toLocaleString() || '-'}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] font-black text-slate-600">{m.nextServiceDueDate || '-'}</p>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{orders.find(o => o.id === m.orderId)?.id.substring(0, 8) || '-'}</p>
                                   </td>
                                   <td className="px-6 py-6 text-center">
                                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${m.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200 animate-pulse'}`}>
                                         {m.status}
                                      </span>
                                   </td>
                                   <td className="px-6 py-6">
                                      <p className={`text-[10px] font-black ${m.status === 'PAID' ? 'text-slate-600' : 'text-rose-600'}`}>
                                         {m.status === 'PAID' ? (m.paidDate || '-') : (m.dueDate || '-')}
                                      </p>
                                   </td>
                                   <td className="px-6 py-6 max-w-[150px]">
                                      <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{m.description}</p>
                                   </td>
                                   <td className="px-6 py-6 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         {m.status === 'UNPAID' && (
                                            <button onClick={() => markMaintPaid(m.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Mark as Paid"><CheckCircle2 size={18}/></button>
                                         )}
                                         <button onClick={() => { setEditingMaint(m); setActiveModal('maint_log'); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit size={18}/></button>
                                         <button onClick={() => handleDeleteMaint(m.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                                      </div>
                                    </td>
                                 </tr>
                              ))}
                              {maintenance.filter(m => m.truckId === selectedTruck.id).length === 0 && (
                                <tr>
                                   <td colSpan={16} className="px-8 py-20 text-center">
                                      <IndianRupee size={48} className="text-slate-200 mx-auto mb-4" />
                                      <p className="text-slate-400 font-medium italic">No financial maintenance records found for this truck.</p>
                                   </td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
                </motion.div>
              )}
              {activeDetailTab === 'documents' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="documents"
                  className="space-y-8"
                >
                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
                    <Files size={240} className="absolute -right-16 -bottom-16 text-white/5 rotate-12" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                           <ShieldCheck size={24} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Digital Asset Repository</span>
                      </div>
                      <h3 className="text-5xl font-black tracking-tight mb-4">Operations Vault</h3>
                      <p className="text-slate-400 font-bold max-w-lg text-lg leading-relaxed">Secure, encrypted repository for regulatory compliance, permits, and digital certifications for Vehicle <span className="text-white">{selectedTruck.plateNumber}</span>.</p>
                    </div>
                    <div className="flex flex-wrap gap-4 relative z-10">
                      {selectedDocCategory && (
                        <button 
                          onClick={() => setSelectedDocCategory(null)}
                          className="flex items-center gap-3 bg-white/5 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 backdrop-blur-sm group"
                        >
                          <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                          Back to Vault
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveModal('document')}
                        className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/40 transition-all group active:scale-95 border border-blue-400/30"
                      >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                        Add New Documentation
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {!selectedDocCategory ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="vault-grid"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      >
                        {['ALL', 'RC', 'INSURANCE', 'PUC', 'STATE_PERMIT', 'NATIONAL_PERMIT', 'FITNESS', 'ROAD_TAX', 'AUTHORIZATION', 'FASTAG', 'HAZMAT', 'TAX_INVOICE', 'DRIVER_LICENCE', 'EMI_DOCS', 'WARRANTY_CARD', 'WEIGHBRIDGE_RECEIPT', 'LOCAL_PERMIT', 'MAINTENANCE_LOG', 'OTHER'].map(docType => {
                          const docs = docType === 'ALL' 
                            ? (selectedTruck.documents || [])
                            : (selectedTruck.documents || []).filter(d => d.type === docType);
                          
                          const Icon = docType === 'ALL' ? Files : getCategoryIcon(docType as any);
                          const colorClass = docType === 'ALL' ? 'bg-blue-600 text-white border-blue-700' : getCategoryColor(docType as any);
                          const hasDocs = docs.length > 0;

                          return (
                            <button 
                              key={docType}
                              onClick={() => {
                                setSelectedDocCategory(docType as any);
                                setDocPage(1);
                              }}
                              className="group bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all text-left flex flex-col h-full transform hover:-translate-y-1"
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border-2 transition-transform group-hover:scale-110 ${colorClass}`}>
                                <Icon size={28} />
                              </div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">{docType === 'ALL' ? 'All Documents' : (docType || "").replace('_', ' ')}</h4>
                              <div className="mt-auto flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasDocs ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {hasDocs ? `${docs.length} Document${docs.length !== 1 ? 's' : ''}` : 'No Records'}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <ArrowRight size={16} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key="category-detail"
                        className="space-y-8"
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm gap-6">
                          <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 ${getCategoryColor(selectedDocCategory)}`}>
                              {React.createElement(getCategoryIcon(selectedDocCategory), { size: 40 })}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Category</span>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{(selectedDocCategory || "").replace('_', ' ')}</h3>
                              </div>
                              <p className="text-slate-500 font-medium">Digital repository for compliance records.</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Records</p>
                             <p className="text-4xl font-black text-slate-900">{(selectedTruck.documents || []).filter(d => d.type === selectedDocCategory).length}</p>
                          </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 items-end">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text"
                              placeholder="Search..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              value={docSearch}
                              onChange={e => setDocSearch(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Status</label>
                            <select 
                              className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                              value={docExpiryFilter}
                              onChange={e => setDocExpiryFilter(e.target.value as any)}
                            >
                              <option value="all">All Documents</option>
                              <option value="expired">Only Expired</option>
                              <option value="upcoming">Expiring Soon</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Upload Date</label>
                            <input 
                              type="date"
                              className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                              value={docExactUploadDate}
                              onChange={e => setDocExactUploadDate(e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Expiry Date</label>
                            <input 
                              type="date"
                              className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                              value={docExactExpiryDate}
                              onChange={e => setDocExactExpiryDate(e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Sort By</label>
                            <select 
                              className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                              value={docSortOrder}
                              onChange={e => setDocSortOrder(e.target.value as any)}
                            >
                              <option value="upload_new">Latest Upload</option>
                              <option value="upload_old">Oldest Upload</option>
                              <option value="expiry_soon">Soonest Expiry</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {(() => {
                            let filtered = (selectedTruck.documents || []);
                            if (selectedDocCategory && selectedDocCategory !== 'ALL' as any) {
                              filtered = filtered.filter(d => d.type === selectedDocCategory);
                            }
                            
                            // Search filter
                            if (docSearch) {
                              const term = docSearch.toLowerCase();
                              filtered = filtered.filter(d => 
                                (d.title || '').toLowerCase().includes(term) || 
                                d.fileName.toLowerCase().includes(term) ||
                                d.documentNumber?.toLowerCase().includes(term)
                              );
                            }

                            // Expiry filter
                            if (docExpiryFilter !== 'all') {
                              const now = new Date();
                              filtered = filtered.filter(d => {
                                if (!d.expiryDate) return false;
                                const exp = new Date(d.expiryDate);
                                if (docExpiryFilter === 'expired') return exp < now;
                                if (docExpiryFilter === 'upcoming') {
                                  const thirtyDays = new Date();
                                  thirtyDays.setDate(now.getDate() + 30);
                                  return exp >= now && exp <= thirtyDays;
                                }
                                return true;
                              });
                            }

                            // Exact Expiry Date filter
                            if (docExactExpiryDate) {
                              filtered = filtered.filter(d => d.expiryDate === docExactExpiryDate);
                            }

                            // Exact Upload Date filter
                            if (docExactUploadDate) {
                              filtered = filtered.filter(d => d.uploadDate === docExactUploadDate);
                            }

                            // Sort
                            filtered.sort((a, b) => {
                              if (docSortOrder === 'upload_new') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
                              if (docSortOrder === 'upload_old') return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
                              if (docSortOrder === 'expiry_soon') {
                                if (!a.expiryDate) return 1;
                                if (!b.expiryDate) return -1;
                                return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                              }
                              return 0;
                            });

                            const itemsPerPage = 4;
                            const totalPages = Math.ceil(filtered.length / itemsPerPage);
                            const paginated = filtered.slice((docPage - 1) * itemsPerPage, docPage * itemsPerPage);

                            return paginated.length > 0 ? (
                              <>
                              {paginated.map(doc => {
                                const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                                const now = new Date();
                                const isExpired = expiryDate && expiryDate < now;
                                const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 10;

                                return (
                                <div key={doc.id} className={`bg-white p-6 rounded-[2.5rem] border transition-all shadow-sm group relative overflow-hidden ${isExpired ? 'border-red-200 bg-red-50/10' : isExpiringSoon ? 'border-orange-200 bg-orange-50/10' : 'border-slate-200'}`}>
                                  {isExpiringSoon && !isExpired && (
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-orange-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl z-20 animate-pulse">
                                      Expires in {daysUntilExpiry} Days
                                    </div>
                                  )}
                                  {isExpired && (
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl z-20">
                                      Critical: Expired
                                    </div>
                                  )}

                                  <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1 overflow-hidden">
                                      <div className="flex items-center gap-2 mb-1">
                                         {selectedDocCategory === 'ALL' as any && (
                                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${getCategoryColor(doc.type)}`}>
                                              {(doc.type || "").replace('_', ' ')}
                                           </span>
                                         )}
                                         <h5 className="font-black text-slate-900 text-lg truncate">{doc.title || doc.fileName}</h5>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-bold text-slate-400">Uploaded: {doc.uploadDate}</span>
                                          {doc.issueDate && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                                              <span className="text-[10px] font-bold text-blue-500">Published: {doc.issueDate}</span>
                                            </>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[200px]">{doc.documentNumber}</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => setPreviewDoc(doc)}
                                        className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Preview Document"
                                      >
                                        <Eye size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDownloadPDF(doc)}
                                        className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                        title="Download as PDF"
                                      >
                                        <Download size={18} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingDoc(doc);
                                          setActiveModal('document');
                                        }}
                                        className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Edit document"
                                      >
                                        <Pencil size={18} />
                                      </button>
                                      <button 
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                        className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        title="Open in new window"
                                      >
                                        <ExternalLink size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="p-3 rounded-2xl bg-slate-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        title="Delete document"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                  </div>

                                  {doc.fileUrl && doc.fileUrl !== '#' && (
                                    <div className="aspect-[16/10] w-full rounded-3xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 mb-6 group-hover:shadow-lg transition-all relative">
                                      {(typeof doc.fileUrl === 'string' && doc.fileUrl.startsWith('data:image')) ? (
                                        <img src={doc.fileUrl} alt="Preview" className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-white">
                                          <FileText size={64} className="mb-4 opacity-10" />
                                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Digital Copy Secured</p>
                                        </div>
                                      )}
                                      
                                      {/* Real-time sync indicator */}
                                      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                         <span className="text-[8px] font-black text-white uppercase tracking-widest">Vault Sync Active</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-2.5 h-2.5 rounded-full ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {isExpired ? 'Expired Record' : isExpiringSoon ? 'Expiring Soon' : 'Valid Certificate'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Renew By Due Date</span>
                                      <span className={`text-xs font-black ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-slate-700'}`}>
                                        {doc.expiryDate || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )})}

                              {totalPages > 1 && (
                                <div className="col-span-full flex items-center justify-between mt-8 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => setDocPage(p => Math.max(1, p - 1))}
                                      disabled={docPage === 1}
                                      className="flex items-center gap-2 bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-100"
                                    >
                                      <ChevronLeft size={16} /> Previous
                                    </button>
                                    <div className="flex items-center gap-2">
                                      {[...Array(totalPages)].map((_, i) => (
                                        <button
                                          key={i}
                                          onClick={() => setDocPage(i + 1)}
                                          className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${docPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                          {i + 1}
                                        </button>
                                      ))}
                                    </div>
                                    <button 
                                      onClick={() => setDocPage(p => Math.min(totalPages, p + 1))}
                                      disabled={docPage === totalPages}
                                      className="flex items-center gap-2 bg-slate-50 text-slate-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-100"
                                    >
                                      Next <ChevronRight size={16} />
                                    </button>
                                  </div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Showing {paginated.length} of {filtered.length} Records
                                  </p>
                                </div>
                              )}
                              </>
                          ) : (
                            <div className="col-span-full py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3.5rem] flex flex-col items-center justify-center text-center">
                              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                                <Files size={48} />
                              </div>
                              <h4 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                                {docSearch || docExpiryFilter !== 'all' || docExactExpiryDate || docExactUploadDate ? 'No Results Matching Filters' : 'Empty Vault'}
                              </h4>
                              <p className="text-slate-500 font-bold max-w-sm">
                                {docSearch || docExpiryFilter !== 'all' || docExactExpiryDate || docExactUploadDate 
                                  ? 'Try adjusting your search terms or filter criteria.'
                                  : `No documentation records have been uploaded for ${(selectedDocCategory || "").replace('_', ' ')}.`}
                              </p>
                              <button 
                                onClick={() => {
                                  if (docSearch || docExpiryFilter !== 'all' || docExactExpiryDate || docExactUploadDate) {
                                    setDocSearch('');
                                    setDocExpiryFilter('all');
                                    setDocExactExpiryDate('');
                                    setDocExactUploadDate('');
                                  } else {
                                    setActiveModal('document');
                                  }
                                }}
                                className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                              >
                                {docSearch || docExpiryFilter !== 'all' || docExactExpiryDate || docExactUploadDate ? 'Clear All Filters' : 'Start Digital Enrollment'}
                              </button>
                            </div>
                          );
                        })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <Modal 
        isOpen={!!activeModal} 
        onClose={() => { setActiveModal(null); setSelectedTyrePos(null); setEditingDoc(null); setEditingOdo(null); setEditingInspection(null); setEditingBreakdown(null); setEditingRotation(null); }}
        title={
          activeModal === 'inspection' ? (editingInspection ? 'Edit Inspection Record' : 'New Inspection Record') :
          activeModal === 'tyre' ? `Tyre Maintenance [${selectedTyrePos}]` :
          activeModal === 'rotation' ? 'Log Tyre Rotation' :
          activeModal === 'document' ? 'Compliance Operations Vault' :
          activeModal === 'breakdown' ? (editingBreakdown ? 'Edit Breakdown Report' : 'Report Emergency Breakdown') :
          activeModal === 'odometer' ? (editingOdo ? 'Edit Odometer Reading' : 'Log Odometer Reading') : 
          activeModal === 'resolve_inspection' ? 'Resolve Inspection Findings' :
          activeModal === 'maint_log' ? (editingMaint ? 'Edit Maintenance Expense' : 'Log Maintenance Expense') : ''
        }
      >
        {activeModal === 'resolve_inspection' && selectedInspectionLogId && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Marking as Fixed</p>
              <p className="text-sm font-bold text-slate-900 italic">"Ensure all findings from this inspection have been rectified."</p>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Resolution Date</label>
              <input 
                type="date"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={resDate}
                onChange={e => setResDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Resolution Notes / Action Taken</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows={4}
                placeholder="Describe what was fixed, parts replaced, or adjustments made..."
                value={resNotes}
                onChange={e => setResNotes(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={() => handleResolveInspection(selectedInspectionLogId, resNotes, resDate)}
                disabled={!resNotes.trim()}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        )}
        {activeModal === 'maint_log' && selectedTruck && (
          <MaintenanceLogForm 
            initialData={editingMaint || undefined}
            employees={employees}
            orders={orders}
            onSave={(formData) => handleMaintSubmit(formData)}
            currentOdometer={selectedTruck.currentOdometer}
          />
        )}
        {activeModal === 'inspection' && selectedTruck && (
          <InspectionLogForm 
            initialData={editingInspection || undefined}
            onSave={(title, inspector, status, notes) => {
              handleLogInspection(title, inspector, status, notes, editingInspection?.id);
              setActiveModal(null);
              setEditingInspection(null);
            }} 
            currentOdometer={selectedTruck.currentOdometer}
          />
        )}
        {activeModal === 'odometer' && selectedTruck && (
          <OdometerLogForm 
            initialData={editingOdo || undefined}
            onSave={(value, date, driver, notes) => {
              handleLogOdometer(value, date, driver, notes, editingOdo?.id);
              setActiveModal(null);
              setEditingOdo(null);
            }}
            currentOdometer={selectedTruck.currentOdometer}
            driverName={selectedTruck.driverName}
          />
        )}
        {activeModal === 'tyre' && selectedTruck && selectedTyrePos && (
          <TyreUpdateForm 
            position={selectedTyrePos}
            currentDetail={selectedTruck.tyreDetails?.find(t => t.position === selectedTyrePos)}
            onSave={(status, pressure, tread, lastChanged) => {
              handleUpdateTyre(selectedTyrePos, status, pressure, tread, lastChanged);
              setActiveModal(null);
              setSelectedTyrePos(null);
            }}
          />
        )}
        {activeModal === 'rotation' && selectedTruck && (
          <TyreRotationForm 
            initialData={editingRotation || undefined}
            onSave={(from, to, odometer, notes) => {
              handleRotateTyres(from, to, odometer, notes, editingRotation?.id);
              setActiveModal(null);
              setEditingRotation(null);
            }}
            currentOdometer={selectedTruck.currentOdometer}
          />
        )}
        {activeModal === 'document' && (
          <DocumentForm 
            initialDoc={editingDoc || undefined}
            truckNumber={selectedTruck.plateNumber}
            onSave={(type, number, expiry, files, title, publishDate) => {
              if (editingDoc) {
                handleUpdateDocument(editingDoc.id, type, number, expiry, title, publishDate, files[0]);
              } else {
                handleAddDocument(type, number, expiry, files, title, publishDate);
              }
              setActiveModal(null);
              setEditingDoc(null);
            }}
          />
        )}
        {activeModal === 'breakdown' && (
          <BreakdownForm 
            initialData={editingBreakdown || undefined}
            onSave={(desc, loc, cost) => {
              handleLogBreakdown(desc, loc, cost, editingBreakdown?.id);
              setActiveModal(null);
              setEditingBreakdown(null);
            }}
          />
        )}
      </Modal>

      <Modal 
        isOpen={!!activeEditTruckSection} 
        onClose={() => setActiveEditTruckSection(null)}
        title={
          activeEditTruckSection === 'identity' ? 'Edit Asset Identity' :
          activeEditTruckSection === 'technical' ? 'Edit Technical Specifications' :
          activeEditTruckSection === 'ownership' ? 'Edit Ownership & Mapping' :
          activeEditTruckSection === 'logistics' ? 'Edit Logistics & Metrics' : ''
        }
      >
        {activeEditTruckSection && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedTruckId) {
                const updatedTruck = { ...selectedTruck, ...editTruckForm } as Truck;
                onUpdateTruck(updatedTruck);
                setActiveEditTruckSection(null);
              }
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeEditTruckSection === 'identity' && (
                <>
                  <EditField label="Asset Name" value={editTruckForm.name} onChange={v => setEditTruckForm({...editTruckForm, name: v})} />
                  <EditField label="Plate Number" value={editTruckForm.plateNumber} onChange={v => setEditTruckForm({...editTruckForm, plateNumber: v})} />
                  <EditField label="Truck Number" value={editTruckForm.truckNumber} onChange={v => setEditTruckForm({...editTruckForm, truckNumber: v})} />
                  <EditField label="Model Number" value={editTruckForm.modelNumber} onChange={v => setEditTruckForm({...editTruckForm, modelNumber: v})} />
                  <EditField label="Tracking ID" value={editTruckForm.trackingId} onChange={v => setEditTruckForm({...editTruckForm, trackingId: v})} />
                  <div className="md:col-span-2">
                    <EditField label="Description" value={editTruckForm.description} onChange={v => setEditTruckForm({...editTruckForm, description: v})} isTextArea />
                  </div>
                </>
              )}
              {activeEditTruckSection === 'technical' && (
                <>
                  <EditField label="Engine Number" value={editTruckForm.engineNumber} onChange={v => setEditTruckForm({...editTruckForm, engineNumber: v})} />
                  <EditField label="Fuel Type" value={editTruckForm.fuelType} onChange={v => setEditTruckForm({...editTruckForm, fuelType: v})} />
                  <EditField label="Branch" value={editTruckForm.branch} onChange={v => setEditTruckForm({...editTruckForm, branch: v})} />
                  <EditField label="Registration Date" value={editTruckForm.registrationDate} onChange={v => setEditTruckForm({...editTruckForm, registrationDate: v})} type="date" />
                  <EditField label="Vehicle Application" value={editTruckForm.vehicleApplication} onChange={v => setEditTruckForm({...editTruckForm, vehicleApplication: v})} />
                  <EditField label="Vehicle Code" value={editTruckForm.vehicleCode} onChange={v => setEditTruckForm({...editTruckForm, vehicleCode: v})} />
                  <EditField label="Vehicle Type" value={editTruckForm.vehicleType} onChange={v => setEditTruckForm({...editTruckForm, vehicleType: v})} />
                  <EditField label="Laden Weight" value={editTruckForm.ladenWeight} onChange={v => setEditTruckForm({...editTruckForm, ladenWeight: v})} />
                  <EditField label="Unladen Weight" value={editTruckForm.unladenWeight} onChange={v => setEditTruckForm({...editTruckForm, unladenWeight: v})} />
                  <EditField label="Tonnage" value={editTruckForm.tonnage} onChange={v => setEditTruckForm({...editTruckForm, tonnage: v})} />
                  <EditField label="Make / Year" value={editTruckForm.makeYear} onChange={v => setEditTruckForm({...editTruckForm, makeYear: v})} />
                  <div className="md:col-span-2">
                    <EditField label="Registration Address" value={editTruckForm.registrationAddress} onChange={v => setEditTruckForm({...editTruckForm, registrationAddress: v})} isTextArea />
                  </div>
                  <EditField label="Owned Outside" value={editTruckForm.ownedOutside} onChange={v => setEditTruckForm({...editTruckForm, ownedOutside: v})} />
                  <EditField label="Specification" value={editTruckForm.specification} onChange={v => setEditTruckForm({...editTruckForm, specification: v})} />
                </>
              )}
              {activeEditTruckSection === 'ownership' && (
                <>
                  <EditField label="Owner Name" value={editTruckForm.ownerName} onChange={v => setEditTruckForm({...editTruckForm, ownerName: v})} />
                  <EditField label="Owner Contact" value={editTruckForm.ownerContact} onChange={v => setEditTruckForm({...editTruckForm, ownerContact: v})} />
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Assigned Driver</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={editTruckForm.assignedDriverId || ''}
                      onChange={e => {
                        const driver = drivers.find(d => d.id === e.target.value);
                        setEditTruckForm({
                          ...editTruckForm, 
                          assignedDriverId: e.target.value,
                          driverName: driver ? driver.name : 'Unassigned'
                        });
                      }}
                    >
                      <option value="">Unassigned</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.trackingId})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Default Route</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={editTruckForm.defaultRouteId || ''}
                      onChange={e => setEditTruckForm({ ...editTruckForm, defaultRouteId: e.target.value })}
                    >
                      <option value="">No Route Assigned</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.source} → {r.destination}</option>)}
                    </select>
                  </div>
                </>
              )}
              {activeEditTruckSection === 'logistics' && (
                <>
                  <EditField label="Mileage (Km/L)" value={editTruckForm.mileage?.toString()} onChange={v => setEditTruckForm({...editTruckForm, mileage: parseFloat(v) || 0})} type="number" />
                  <EditField label="Diesel Limit (L/trip)" value={editTruckForm.dieselLimit?.toString()} onChange={v => setEditTruckForm({...editTruckForm, dieselLimit: parseFloat(v) || 0})} type="number" />
                  <EditField label="Service Interval (KM)" value={editTruckForm.serviceIntervalKm?.toString()} onChange={v => setEditTruckForm({...editTruckForm, serviceIntervalKm: parseInt(v) || 0})} type="number" />
                  <EditField label="Driver Score" value={editTruckForm.driverScore?.toString()} onChange={v => setEditTruckForm({...editTruckForm, driverScore: parseInt(v) || 0})} type="number" />
                  <EditField label="MT Handled" value={editTruckForm.totalMtHandled?.toString()} onChange={v => setEditTruckForm({...editTruckForm, totalMtHandled: parseInt(v) || 0})} type="number" />
                  <EditField label="Idle Time (Hrs)" value={editTruckForm.idleTimeHours?.toString()} onChange={v => setEditTruckForm({...editTruckForm, idleTimeHours: parseInt(v) || 0})} type="number" />
                  <EditField label="Engine Hours" value={editTruckForm.engineHours?.toString()} onChange={v => setEditTruckForm({...editTruckForm, engineHours: parseInt(v) || 0})} type="number" />
                  <EditField label="Current Odometer (KM)" value={editTruckForm.currentOdometer?.toString()} onChange={v => setEditTruckForm({...editTruckForm, currentOdometer: parseInt(v) || 0})} type="number" />
                </>
              )}
            </div>
            <div className="pt-6 border-t border-slate-100 italic text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Changes will be securely pushed to the cloud infrastructure on save.
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
            >
              Update Vehicle Information
            </button>
          </form>
        )}
      </Modal>

      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)} 
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${getCategoryColor(previewDoc.type)}`}>
                    {React.createElement(getCategoryIcon(previewDoc.type), { size: 24 })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{previewDoc.title || previewDoc.fileName}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{previewDoc.documentNumber}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid until: {previewDoc.expiryDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownloadPDF(previewDoc)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                  >
                    <Download size={18} /> Download PDF
                  </button>
                  <button 
                    onClick={() => setPreviewDoc(null)} 
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-12 bg-slate-100/50 flex items-center justify-center">
                {previewDoc.fileUrl && previewDoc.fileUrl.startsWith('data:image') ? (
                  <img 
                    src={previewDoc.fileUrl} 
                    alt="Document Preview" 
                    className="max-w-full h-auto shadow-2xl rounded-lg border border-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-xl text-center max-w-md">
                    <Files size={80} className="mx-auto text-slate-200 mb-8" />
                    <h4 className="text-2xl font-black text-slate-900 mb-4">Digital Container Only</h4>
                    <p className="text-slate-500 font-bold mb-8">This document is stored as a reference record. No visual scan is available for direct preview.</p>
                    <button 
                      onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Open Link Source
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-center gap-12">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upload Date</p>
                   <p className="text-sm font-black text-slate-900">{previewDoc.uploadDate}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                   <p className="text-sm font-black text-slate-900">{previewDoc.issueDate || 'N/A'}</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</p>
                   <p className="text-sm font-black text-slate-900">{previewDoc.expiryDate || 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface HealthCardProps {
  name: string;
  comp: TruckHealthComponent;
  onUpdate: (status: HealthStatus, notes: string) => void;
}

const HealthComponentCard: React.FC<HealthCardProps> = ({ name, comp, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localStatus, setLocalStatus] = useState(comp.status);
  const [localNotes, setLocalNotes] = useState(comp.notes || '');

  const getCompIcon = (n: string) => {
    switch (n) {
      case 'battery': return <Battery size={24} />;
      case 'engine': return <Zap size={24} />;
      case 'tyres': return <Activity size={24} />;
      case 'electrical': return <Zap size={24} />;
      case 'body': return <ShieldCheck size={24} />;
      case 'oil': return <Droplet size={24} />;
      case 'water': return <Waves size={24} />;
      case 'brakes': return <Disc size={24} />;
      default: return <Activity size={24} />;
    }
  };

  const getStatusColor = (s: HealthStatus) => {
    switch (s) {
      case 'EXCELLENT': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
      case 'GOOD': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
      case 'WARNING': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'CRITICAL': return 'text-red-500 border-red-500/20 bg-red-500/10';
      case 'BREAKDOWN': return 'text-slate-900 border-slate-900/20 bg-slate-900/10';
      default: return 'text-slate-400 border-slate-400/20 bg-slate-400/10';
    }
  };

  const getHealthPercentage = (s: HealthStatus) => {
    switch (s) {
      case 'EXCELLENT': return 100;
      case 'GOOD': return 80;
      case 'WARNING': return 40;
      case 'CRITICAL': return 15;
      case 'BREAKDOWN': return 0;
      default: return 50;
    }
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:shadow-slate-200 group relative overflow-hidden ${
      comp.status === 'CRITICAL' ? 'bg-red-50/30 border-red-100' : 
      comp.status === 'WARNING' ? 'bg-orange-50/30 border-orange-100' : 'bg-white border-slate-200'
    }`}>
      {/* Visual background pulse for attention */}
      {(comp.status === 'CRITICAL' || comp.status === 'WARNING') && (
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 animate-pulse ${
          comp.status === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'
        }`} />
      )}

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
          comp.status === 'CRITICAL' ? 'bg-red-500 text-white shadow-red-200' : 
          comp.status === 'WARNING' ? 'bg-orange-500 text-white shadow-orange-200' : 
          'bg-slate-50 text-slate-700 shadow-slate-100'
        }`}>
          {getCompIcon(name)}
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getStatusColor(comp.status)} flex items-center gap-1.5`}>
          {(comp.status === 'CRITICAL' || comp.status === 'WARNING') && (
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${comp.status === 'CRITICAL' ? 'bg-red-400' : 'bg-orange-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${comp.status === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
            </span>
          )}
          {comp.status}
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <h3 className="text-xl font-black text-slate-900 capitalize tracking-tight mb-1">{name} Unit</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Efficiency Level</p>
          <p className={`text-xs font-black ${
            getHealthPercentage(comp.status) > 70 ? 'text-emerald-500' : 
            getHealthPercentage(comp.status) > 30 ? 'text-orange-500' : 'text-red-500'
          }`}>
            {getHealthPercentage(comp.status)}%
          </p>
        </div>
        
        {/* Health Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${getHealthPercentage(comp.status)}%` }}
            className={`h-full rounded-full ${
              getHealthPercentage(comp.status) > 70 ? 'bg-emerald-500' : 
              getHealthPercentage(comp.status) > 30 ? 'bg-orange-500' : 'bg-red-500'
            }`}
          />
        </div>
        
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Last Checked: {comp.lastChecked}</p>
      </div>

      <div className="p-4 bg-slate-50/50 rounded-2xl mb-6 min-h-[60px] border border-slate-100 relative z-10">
        <p className="text-slate-600 text-sm italic font-medium leading-relaxed">"{comp.notes || 'No recent inspection notes recorded for this unit.'}"</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Integrated</span>
        <button 
          onClick={() => setIsEditing(true)}
          className="text-blue-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-all flex items-center gap-1"
        >
          Update Status <ChevronRight size={14} />
        </button>
      </div>

      {/* Edit Overlay */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm p-6 rounded-[2rem] z-20 flex flex-col justify-between border-2 border-blue-100 shadow-2xl"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-900 tracking-tight">Manual Diagnostic</h4>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-900 font-black text-sm">Cancel</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Set Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL', 'BREAKDOWN'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setLocalStatus(s as HealthStatus)}
                        className={`py-1 text-[10px] font-black rounded-lg border transition-all ${localStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Diagnostic Notes</label>
                  <textarea 
                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    rows={3}
                    placeholder="Describe unit condition..."
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                onUpdate(localStatus, localNotes);
                setIsEditing(false);
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              Verify & Save Check
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TyreWheelProps {
  position: TyreDetail['position'];
  detail?: TyreDetail;
  onManage: (pos: TyreDetail['position']) => void;
}

const TyreWheel: React.FC<TyreWheelProps> = ({ position, detail, onManage }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusColor = (s?: HealthStatus) => {
    switch (s) {
      case 'EXCELLENT': return 'bg-emerald-500 shadow-emerald-100';
      case 'GOOD': return 'bg-blue-500 shadow-blue-100';
      case 'WARNING': return 'bg-orange-500 shadow-orange-100';
      case 'CRITICAL': return 'bg-red-600 shadow-red-100';
      default: return 'bg-slate-300 shadow-slate-100';
    }
  };

  return (
    <div className="relative">
      <button 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onManage(position)}
        className={`w-10 h-16 rounded-lg transition-all border-2 border-slate-900/10 shadow-lg ${getStatusColor(detail?.condition)} flex items-center justify-center group overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-[8px] font-black text-white relative z-10">{position}</span>
        {/* Tyre Tread Pattern Simulation */}
        <div className="absolute inset-y-0 left-1 w-[2px] bg-white/20" />
        <div className="absolute inset-y-0 right-1 w-[2px] bg-white/20" />
      </button>

      {isHovered && detail && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white p-3 rounded-xl z-30 pointer-events-none">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1">{position} Detail</p>
          <div className="space-y-1">
             <p className="text-[9px] flex justify-between font-bold"><span className="text-slate-400">Pressure:</span> {detail.pressure} PSI</p>
             <p className="text-[9px] flex justify-between font-bold"><span className="text-slate-400">Tread:</span> {detail.treadDepth} mm</p>
             <p className="text-[9px] flex justify-between font-bold"><span className="text-slate-400">Status:</span> {detail.condition}</p>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const InspectionLogForm: React.FC<{
  onSave: (title: string, inspector: string, status: 'PASS' | 'FAIL' | 'ADVISORY', notes: string) => void;
  currentOdometer: number;
  initialData?: InspectionLog;
}> = ({ onSave, currentOdometer, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || 'Routine Safety Check');
  const [inspector, setInspector] = useState(initialData?.inspectorName || 'Safety Manager');
  const [status, setStatus] = useState<'PASS' | 'FAIL' | 'ADVISORY'>(initialData?.overallStatus || 'PASS');
  const [notes, setNotes] = useState(initialData?.notes || '');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {['PASS', 'FAIL', 'ADVISORY'].map(s => (
          <button 
            key={s}
            onClick={() => setStatus(s as any)}
            className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Inspection Title</label>
        <input 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="e.g. Morning Pre-trip, Weekly Brake Check..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Inspector Name</label>
        <input 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={inspector}
          onChange={e => setInspector(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Inspection Result Notes</label>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          rows={3}
          placeholder="Detail any findings..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <button 
        onClick={() => onSave(title, inspector, status, notes)}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
      >
        {initialData ? 'Update Inspection Record' : 'Log Daily Inspection'}
      </button>
    </div>
  );
};

const TyreUpdateForm: React.FC<{
  position: TyreDetail['position'];
  currentDetail?: TyreDetail;
  onSave: (status: HealthStatus, pressure: number, tread: number, lastChanged: string) => void;
}> = ({ position, currentDetail, onSave }) => {
  const [status, setStatus] = useState<HealthStatus>(currentDetail?.condition || 'GOOD');
  const [pressure, setPressure] = useState(currentDetail?.pressure.toString() || '120');
  const [tread, setTread] = useState(currentDetail?.treadDepth.toString() || '12');
  const [lastChanged, setLastChanged] = useState(currentDetail?.lastChangedDate || new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tyre Condition</label>
        <div className="grid grid-cols-2 gap-2">
          {['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'].map(s => (
            <button 
              key={s}
              onClick={() => setStatus(s as any)}
              className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pressure (PSI)</label>
          <input 
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={pressure}
            onChange={e => setPressure(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tread Depth (mm)</label>
          <input 
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={tread}
            onChange={e => setTread(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Last Changed Date</label>
        <input 
          type="date"
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={lastChanged}
          onChange={e => setLastChanged(e.target.value)}
        />
      </div>
      <button 
        onClick={() => onSave(status, parseFloat(pressure) || 0, parseFloat(tread) || 0, lastChanged)}
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
      >
        Update Tyre Specs
      </button>

      {currentDetail?.pressureHistory && currentDetail.pressureHistory.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-100">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Pressure Logs (PSI)</label>
           <div className="space-y-2">
             {currentDetail.pressureHistory.slice(0, 5).map(log => (
               <div key={log.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <span className="text-xs font-bold text-slate-500">{log.date}</span>
                 <span className="text-sm font-black text-slate-900">{log.value} PSI</span>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

const DocumentForm: React.FC<{
  initialDoc?: TruckDocument;
  truckNumber: string;
  onSave: (type: TruckDocument['type'], number: string, expiry: string, files: { name: string, url: string }[], title: string, publishDate: string) => void;
}> = ({ onSave, initialDoc, truckNumber }) => {
  const [type, setType] = useState<TruckDocument['type']>(initialDoc?.type || 'INSURANCE');
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
    <div className="space-y-8">
      {/* Vault Style Header inside pop */}
      <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden mb-2 border border-white/5">
          <Files size={140} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
          <div className="relative z-10 flex items-center gap-5">
             <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/30">
                <ShieldCheck size={28} />
             </div>
             <div>
                <h4 className="text-xl font-black tracking-tight">Compliance Operations Vault</h4>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{truckNumber}</span>
                   <span className="w-1 h-1 rounded-full bg-slate-700" />
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Registered Sync Active</span>
                   </div>
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="group">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Document Title</label>
          <input 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
            value={publishDate}
            onChange={e => setPublishDate(e.target.value)}
          />
        </div>
        <div className="group">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block group-focus-within:text-blue-600 transition-colors">Expiry Date</label>
          <input 
            type="date"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
            value={expiry}
            onChange={e => setExpiry(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Attachments</label>
        
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
            <div key={idx} className="relative aspect-video rounded-[2rem] border-2 border-slate-100 overflow-hidden bg-slate-50 group hover:border-blue-200 transition-all shadow-sm">
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
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">Active File</p>
              </div>
              <button 
                onClick={() => removeFile(idx)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video border-3 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-3">
               <Upload size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 relative z-10 font-black">Click or Drag Files</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1 relative z-10 group-hover:text-blue-400">PDF or Images accepted</p>
          </button>
        </div>
      </div>

      <button 
        disabled={files.length === 0}
        onClick={() => onSave(type, number, expiry, files, title, publishDate)}
        className="w-full bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 group mt-8"
      >
        <FileCheck size={20} className="group-hover:scale-110 transition-transform" />
        {initialDoc ? 'Confirm Security Update' : `Register ${files.length} Digital Asset${files.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

const BreakdownForm: React.FC<{
  onSave: (desc: string, location: string, cost: number) => void;
  initialData?: BreakdownLog;
}> = ({ onSave, initialData }) => {
  const [desc, setDesc] = useState(initialData?.description || '');
  const [loc, setLoc] = useState(initialData?.location || '');
  const [cost, setCost] = useState(initialData?.cost.toString() || '');

  return (
    <div className="space-y-6">
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
        <p className="text-red-600 text-xs font-black uppercase tracking-widest leading-relaxed">Alert: Logging a breakdown will mark this vehicle as inactive in fleet operations.</p>
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">System Failure Description</label>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
          rows={3}
          placeholder="E.g. Radiator leak, Transmission lock..."
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Isolation Location</label>
        <input 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
          placeholder="Current GPS or Landmark"
          value={loc}
          onChange={e => setLoc(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Initial Expense Recovery (₹)</label>
        <input 
          type="number"
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
          placeholder="Assumed repair cost"
          value={cost}
          onChange={e => setCost(e.target.value)}
        />
      </div>
      <button 
        onClick={() => onSave(desc, loc, parseFloat(cost) || 0)}
        className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
      >
        {initialData ? 'Update Breakdown Report' : 'Lock Vehicle & Deploy Assistance'}
      </button>
    </div>
  );
};

const OdometerLogForm: React.FC<{
  onSave: (value: number, date: string, driver: string, notes?: string) => void;
  currentOdometer: number;
  driverName: string;
  initialData?: OdometerReading;
}> = ({ onSave, currentOdometer, driverName, initialData }) => {
  const [value, setValue] = useState(initialData?.value.toString() || currentOdometer.toString());
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [driver, setDriver] = useState(initialData?.recordedBy || driverName);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const newValue = parseInt(value) || 0;
    if (newValue <= currentOdometer && !initialData) {
      setError(`New reading must be greater than current odometer (${currentOdometer.toLocaleString()} KM)`);
      return;
    }
    setError(null);
    onSave(newValue, date, driver, notes);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Current Registry</p>
          <p className="text-2xl font-black text-blue-900">{currentOdometer.toLocaleString()} KM</p>
        </div>
        <CircleGauge size={40} className="text-blue-200" />
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-pulse">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">New Reading (KM)</label>
          <input 
            type="number"
            className={`w-full bg-white border ${error ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-xl p-4 text-lg font-black text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm`}
            value={value}
            onChange={e => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observation Date</label>
          <input 
            type="date"
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Accountable Driver</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
            value={driver}
            onChange={e => setDriver(e.target.value)}
            placeholder="Identity of the driver..."
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Diagnostic Comments</label>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
          rows={3}
          placeholder="Briefly state trip context or vehicle behavior..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
      >
        {initialData ? 'Update Diagnostic Log' : 'Secure Diagnostic Log'}
      </button>
    </div>
  );
};

const TyreRotationForm: React.FC<{
  onSave: (from: string, to: string, odometer: number, notes: string) => void;
  currentOdometer: number;
  initialData?: TyreRotationEvent;
}> = ({ onSave, currentOdometer, initialData }) => {
  const [from, setFrom] = useState(initialData?.fromPosition || '');
  const [to, setTo] = useState(initialData?.toPosition || '');
  const [odometer, setOdometer] = useState(initialData?.odometerReading.toString() || currentOdometer.toString());
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const positions = ['FL', 'FR', 'ALI', 'ALO', 'ARI', 'ARO', 'BLI', 'BLO', 'BRI', 'BRO', 'CLI', 'CLO', 'CRI', 'CRO', 'S1', 'S2'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">From Position</label>
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={from}
            onChange={e => setFrom(e.target.value)}
          >
            <option value="">Select Position</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">To Position</label>
          <select 
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={to}
            onChange={e => setTo(e.target.value)}
          >
            <option value="">Select Position</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Odometer at Rotation (KM)</label>
        <input 
          type="number"
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={odometer}
          onChange={e => setOdometer(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Rotation Notes</label>
        <textarea 
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          rows={3}
          placeholder="Reason or additional work done..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
      <button 
        disabled={!from || !to}
        onClick={() => onSave(from, to, parseInt(odometer) || currentOdometer, notes)}
        className="w-full bg-blue-600 disabled:bg-slate-200 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
      >
        Record Rotation Event
      </button>
    </div>
  );
};

const MaintenanceLogForm: React.FC<{
  onSave: (data: Partial<MaintenanceExpense>) => void;
  currentOdometer: number;
  initialData?: MaintenanceExpense;
  employees: Employee[];
  orders: Order[];
}> = ({ onSave, currentOdometer, initialData, employees, orders }) => {
  const [formData, setFormData] = useState<Partial<MaintenanceExpense>>(initialData || {
    date: new Date().toISOString().split('T')[0],
    serviceDate: new Date().toISOString().split('T')[0],
    category: 'ROUTINE',
    workshopName: '',
    odometerReading: currentOdometer,
    amount: 0,
    status: 'UNPAID',
    description: '',
    employeeId: '',
    paidDate: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    partsReplaced: [],
    nextServiceDueKm: undefined,
    nextServiceDueDate: '',
    paymentMode: 'CASH',
    orderId: ''
  });

  const [serviceIntervalKm, setServiceIntervalKm] = useState(10000);
  const [serviceIntervalDays, setServiceIntervalDays] = useState(90);
  const [isAutoCalculating, setIsAutoCalculating] = useState(!initialData);

  const [partsInput, setPartsInput] = useState(initialData?.partsReplaced?.join(', ') || '');

  useEffect(() => {
    if (isAutoCalculating && !initialData) {
      const nextKm = (formData.odometerReading || 0) + serviceIntervalKm;
      const entryDate = formData.date ? new Date(formData.date) : new Date();
      const nextDate = new Date(entryDate);
      nextDate.setDate(entryDate.getDate() + serviceIntervalDays);

      setFormData(prev => ({
        ...prev,
        nextServiceDueKm: nextKm,
        nextServiceDueDate: nextDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.odometerReading, formData.date, serviceIntervalKm, serviceIntervalDays, isAutoCalculating, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      partsReplaced: partsInput.split(',').map(p => p.trim()).filter(p => p !== '')
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
        <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Service Intervals (Configurable)</label>
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="autoCalc"
                    checked={isAutoCalculating}
                    onChange={(e) => setIsAutoCalculating(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoCalc" className="text-[9px] font-black text-blue-400 uppercase cursor-pointer">Auto-Calculate Next Due</label>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Interval (KM)</label>
            <input 
              type="number"
              className="w-full bg-white border border-blue-100 rounded-xl p-2.5 text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={serviceIntervalKm}
              onChange={e => setServiceIntervalKm(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Interval (Days)</label>
            <input 
              type="number"
              className="w-full bg-white border border-blue-100 rounded-xl p-2.5 text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={serviceIntervalDays}
              onChange={e => setServiceIntervalDays(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Entry Date</label>
          <input 
            type="date"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Responsible Staff</label>
          <select 
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.employeeId}
            onChange={e => {
              const emp = employees.find(x => x.id === e.target.value);
              setFormData({...formData, employeeId: e.target.value, responsibleStaff: emp?.fullName});
            }}
          >
            <option value="">Select Staff</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
          <select 
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value as any})}
          >
            <option value="ROUTINE">Routine Service</option>
            <option value="ENGINE">Engine / Transmission</option>
            <option value="TYRE">Tyre Replacement</option>
            <option value="ELECTRICAL">Electrical Work</option>
            <option value="BODY">Body / Chassis</option>
            <option value="BREAKDOWN">Emergency Breakdown</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Workshop / Vendor</label>
          <input 
            type="text"
            required
            placeholder="e.g. Service Center"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.workshopName}
            onChange={e => setFormData({...formData, workshopName: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Odometer Reading (KM)</label>
          <input 
            type="number"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.odometerReading}
            onChange={e => setFormData({...formData, odometerReading: parseInt(e.target.value) || 0})}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
          <input 
            type="number"
            required
            className="w-full bg-white border-2 border-blue-100 rounded-xl p-3 text-lg font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Next Due (KM)</label>
          <input 
            type="number"
            placeholder="e.g. 105000"
            className="w-full bg-blue-50/30 border border-blue-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.nextServiceDueKm || ''}
            onChange={e => setFormData({...formData, nextServiceDueKm: parseInt(e.target.value) || undefined})}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Next Due (Date)</label>
          <input 
            type="date"
            className="w-full bg-blue-50/30 border border-blue-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.nextServiceDueDate || ''}
            onChange={e => setFormData({...formData, nextServiceDueDate: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Mode</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.paymentMode}
            onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Linked Trip ID</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.orderId}
            onChange={e => setFormData({...formData, orderId: e.target.value})}
          >
            <option value="">No Active Trip</option>
            {orders.slice(0, 50).map(o => <option key={o.id} value={o.id}>#{o.id.substring(0, 8)} - {o.clientName} → {o.projectSite}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Parts Replaced</label>
        <input 
          type="text"
          placeholder="e.g. Oil Filter, Brake Pads, Air Filter"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
          value={partsInput}
          onChange={e => setPartsInput(e.target.value)}
        />
        <p className="text-[9px] text-slate-400 mt-1 italic">Separate parts with commas</p>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="status"
              className="text-blue-600 focus:ring-blue-500"
              checked={formData.status === 'PAID'}
              onChange={() => setFormData({...formData, status: 'PAID', paidDate: new Date().toISOString().split('T')[0]})}
            />
            <span className="text-xs font-black uppercase tracking-widest">Paid</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="status"
              className="text-blue-600 focus:ring-blue-500"
              checked={formData.status === 'UNPAID'}
              onChange={() => setFormData({...formData, status: 'UNPAID', paidDate: ''})}
            />
            <span className="text-xs font-black uppercase tracking-widest">Unpaid</span>
          </label>
        </div>

        {formData.status === 'PAID' ? (
          <div>
            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 block">Date Paid</label>
            <input 
              type="date"
              required
              className="w-full bg-white border border-green-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={formData.paidDate}
              onChange={e => setFormData({...formData, paidDate: e.target.value})}
            />
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 block">Payment Due Date</label>
            <input 
              type="date"
              required
              className="w-full bg-white border border-rose-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              value={formData.dueDate}
              onChange={e => setFormData({...formData, dueDate: e.target.value})}
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description of Work</label>
        <textarea 
          required
          rows={3}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="What exactly was repaired or replaced?"
        />
      </div>

      <button 
        type="submit"
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95"
      >
        {initialData ? 'Update Maintenance Record' : 'Log Maintenance Record'}
      </button>
    </form>
  );
};

const EditField: React.FC<{
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  type?: string;
  isTextArea?: boolean;
}> = ({ label, value, onChange, type = 'text', isTextArea = false }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    {isTextArea ? (
      <textarea 
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <input 
        type={type}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    )}
  </div>
);

const SummaryStat: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xl font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed max-w-[100px]">{label}</p>
    </div>
  </div>
);

const TechnicalDetail: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">{label}</p>
    <p className="text-sm font-black text-slate-900 leading-tight">{value}</p>
  </div>
);

export default TruckHealthView;
