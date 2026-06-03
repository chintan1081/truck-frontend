
import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  FileText, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Zap,
  BarChart3,
  CalendarDays,
  UserPlus,
  Briefcase,
  MapPin,
  Moon,
  Sun,
  Award,
  ShieldAlert,
  Target,
  Trophy,
  History,
  Timer,
  Fingerprint,
  Heart,
  ShieldCheck,
  Truck,
  PlaneTakeoff,
  CheckCircle,
  ChevronRight,
  Activity,
  Phone,
  MessageCircle,
  PlusCircle,
  Check,
  Settings2,
  CloudSun,
  Coffee,
  FileCheck,
  ShoppingBag
} from 'lucide-react';
import { 
  Employee, 
  Driver, 
  AttendanceRecord, 
  AttendanceStatus, 
  LeaveRequest, 
  LeaveStatus, 
  PerformanceMetric,
  WorkforceDocument 
} from '../types';
import { format, startOfDay, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, subDays, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import {
  Trash2,
  Eye,
  Edit3,
  UploadCloud,
  File,
  Download,
  AlertCircle as LucideAlertCircle
} from 'lucide-react';
import { useFormErrors } from '../hooks/useFormErrors';

interface EmployeeManagementViewProps {
  employees: Employee[];
  drivers: Driver[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  performance: PerformanceMetric[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onUpdateLeaves: (leaves: LeaveRequest[]) => void;
  onUpdatePerformance: (metrics: PerformanceMetric[]) => void;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateDrivers: (drivers: Driver[]) => void;
}

const INDIAN_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day", type: 'Celebration' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'Celebration' },
  { date: '2026-01-26', name: 'Republic Day', type: 'Compulsory' },
  { date: '2026-02-02', name: 'Vasant Panchami', type: 'Celebration' },
  { date: '2026-02-15', name: 'Maha Shivaratri', type: 'Celebration' },
  { date: '2026-02-19', name: 'Chhatrapati Shivaji Maharaj Jayanti', type: 'Celebration' },
  { date: '2026-03-03', name: 'Holi', type: 'Celebration' },
  { date: '2026-03-27', name: 'Ram Navami', type: 'Celebration' },
  { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'Celebration' },
  { date: '2026-04-03', name: 'Good Friday', type: 'Celebration' },
  { date: '2026-04-06', name: 'Hanuman Jayanti', type: 'Celebration' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti / Baisakhi', type: 'Compulsory' },
  { date: '2026-04-20', name: 'Eid-ul-Fitr', type: 'Celebration' },
  { date: '2026-05-01', name: 'Buddha Purnima / May Day', type: 'Celebration' },
  { date: '2026-05-10', name: "Mother's Day", type: 'Celebration' },
  { date: '2026-06-21', name: 'International Yoga Day', type: 'Celebration' },
  { date: '2026-06-27', name: 'Eid-ul-Adha (Bakrid)', type: 'Celebration' },
  { date: '2026-08-03', name: 'Raksha Bandhan', type: 'Celebration' },
  { date: '2026-08-15', name: 'Independence Day', type: 'Compulsory' },
  { date: '2026-08-16', name: 'Janmashtami', type: 'Celebration' },
  { date: '2026-09-05', name: "Teacher's Day", type: 'Celebration' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'Celebration' },
  { date: '2026-09-28', name: 'Eid-e-Milad', type: 'Celebration' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'Compulsory' },
  { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', type: 'Compulsory' },
  { date: '2026-10-31', name: 'Valmiki Jayanti', type: 'Celebration' },
  { date: '2026-11-01', name: 'Karwa Chauth', type: 'Celebration' },
  { date: '2026-11-08', name: 'Diwali (Deepavali)', type: 'Compulsory' },
  { date: '2026-11-10', name: 'Bhai Dooj', type: 'Celebration' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'Celebration' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'Celebration' }
];

interface WorkHistory {
  id: string;
  entityId: string;
  date: string;
  truckId: string;
  pickupSite: string;
  deliveryClient: string;
  hoursSpent: number;
  status: 'Completed' | 'In Progress' | 'Delayed';
}

const WORK_HISTORIES: WorkHistory[] = [
  { id: 'wh-1', entityId: 'E001', date: '2026-05-10', truckId: 'TRK-9021', pickupSite: 'Kolkata Depot A', deliveryClient: 'NHAI Project Site 4', hoursSpent: 8.5, status: 'Completed' },
  { id: 'wh-2', entityId: 'E001', date: '2026-05-11', truckId: 'TRK-9021', pickupSite: 'Haldia Port Terminal', deliveryClient: 'L&T Construction Hub', hoursSpent: 9.2, status: 'Completed' },
  { id: 'wh-3', entityId: 'E002', date: '2026-05-12', truckId: 'TRK-2022', pickupSite: 'Durgapur Steel Plant', deliveryClient: 'Tata Projects Zone B', hoursSpent: 10.0, status: 'Completed' },
  { id: 'wh-4', entityId: 'E003', date: '2026-05-13', truckId: 'TRK-5530', pickupSite: 'Asansol Loading Bay', deliveryClient: 'Adani Logistics Park', hoursSpent: 7.8, status: 'Completed' },
  { id: 'wh-5', entityId: 'E001', date: '2026-05-14', truckId: 'TRK-9021', pickupSite: 'Kolkata Depot B', deliveryClient: 'NHAI Project Site 2', hoursSpent: 4.5, status: 'In Progress' },
];

const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  drivers,
  attendance,
  leaves,
  performance,
  onUpdateAttendance,
  onUpdateLeaves,
  onUpdatePerformance,
  onUpdateEmployees,
  onUpdateDrivers
}) => {
  const { errors: fe, validate, clearField, clearAll } = useFormErrors();
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'leaves' | 'performance'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DRIVER' | 'EMPLOYEE'>('ALL');
  
  // New States for Dynamic Features
  const [selectedPersonnel, setSelectedPersonnel] = useState<any | null>(null);
  const [showRosterDetail, setShowRosterDetail] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [showPerformanceLogger, setShowPerformanceLogger] = useState(false);
  const [showMetricsDetail, setShowMetricsDetail] = useState(false);
  const [showPerformanceHistory, setShowPerformanceHistory] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [leaveMode, setLeaveMode] = useState<'LEAVE' | 'DUTY'>('LEAVE');
  
  // New States for Attendance History Details
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceHistoryPersonnelId, setAttendanceHistoryPersonnelId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Work History Filters
  const [workHistoryStartDate, setWorkHistoryStartDate] = useState<string>('');
  const [workHistoryEndDate, setWorkHistoryEndDate] = useState<string>('');

  // Helper for Calendar Days
  const getCalendarDays = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({
      start: subDays(start, start.getDay()),
      end: addDays(end, 6 - end.getDay())
    });
    return days;
  };

  // Leave Request Form States
  const [leaveCategory, setLeaveCategory] = useState('');
  const [leavePersonnelId, setLeavePersonnelId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [leaveQuotas, setLeaveQuotas] = useState<Record<string, number>>({
    PAID: 24,
    EMERGENCY: 10,
    MARRIAGE: 10,
    SICK: 10,
    CASUAL: 12,
    UNPAID: 365,
    OTHER: 10
  });
  const [isEditingQuota, setIsEditingQuota] = useState(false);
  const [personnelQuotas, setPersonnelQuotas] = useState<Record<string, Record<string, number>>>({});
  const [editingPersonnelQuota, setEditingPersonnelQuota] = useState<string | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState(false);

  // States for Performance Logger
  const [logEfficiency, setLogEfficiency] = useState(85);
  const [logSafety, setLogSafety] = useState(100);
  const [logTiming, setLogTiming] = useState(90);
  const [logRating, setLogRating] = useState(5);

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editedDocName, setEditedDocName] = useState('');

  const fullPersonnelList = [
    ...employees.map(e => ({ ...e, type: 'EMPLOYEE' as const })),
    ...drivers.map(d => ({ ...d, fullName: d.name, type: 'DRIVER' as const, designation: 'Fleet Driver' }))
  ];

  const allPersonnel = fullPersonnelList.filter(p => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.trackingId && p.trackingId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: allPersonnel.length,
    present: attendance.filter(a => a.date === format(new Date(), 'yyyy-MM-dd') && a.status === AttendanceStatus.PRESENT).length,
    onLeave: leaves.filter(l => {
      const today = startOfDay(new Date());
      const start = startOfDay(parseISO(l.startDate));
      const end = startOfDay(parseISO(l.endDate));
      return l.status === LeaveStatus.APPROVED && today >= start && today <= end;
    }).length,
    efficiency: performance.length > 0 
      ? Math.round(performance.reduce((acc, curr) => acc + curr.efficiencyScore, 0) / performance.length) 
      : 0,
    lateArrivals: attendance.filter(a => a.date === format(new Date(), 'yyyy-MM-dd') && a.isLate).length,
    totalOvertime: attendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0),
    kudosTotal: performance.reduce((acc, curr) => acc + (curr.kudosCount || 0), 0)
  };

  const handleMarkAttendance = (entityId: string, status: AttendanceStatus, options?: Partial<AttendanceRecord>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingIndex = attendance.findIndex(a => a.entityId === entityId && a.date === today);
    
    const recordData = {
      status,
      shift: options?.shift || 'DAY',
      isLate: options?.isLate || false,
      overtimeHours: options?.overtimeHours || 0,
      locationVerified: true,
      checkIn: options?.checkIn || format(new Date(), 'HH:mm'),
      ...options
    };

    if (existingIndex >= 0) {
      const newAttendance = [...attendance];
      newAttendance[existingIndex] = { ...newAttendance[existingIndex], ...recordData };
      onUpdateAttendance(newAttendance);
    } else {
      const newRecord: AttendanceRecord = {
        id: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityId,
        date: today,
        ...recordData
      } as AttendanceRecord;
      onUpdateAttendance([newRecord, ...attendance]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string = 'Other') => {
    if (!e.target.files || !selectedPersonnel) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newDoc: WorkforceDocument = {
          id: Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          type: category,
          fileUrl: base64,
          uploadDate: new Date().toISOString(),
          size: file.size,
          mimeType: file.type
        };

        const updatedDocs = [...(selectedPersonnel.documents || []), newDoc];
        updatePersonnelDocuments(selectedPersonnel.id, updatedDocs);
      };
      reader.readAsDataURL(file);
    });
  };

  const updatePersonnelDocuments = (id: string, docs: WorkforceDocument[]) => {
    if (selectedPersonnel?.type === 'EMPLOYEE') {
      const updated = employees.map(emp => emp.id === id ? { ...emp, documents: docs } : emp);
      onUpdateEmployees(updated);
      setSelectedPersonnel((prev: any) => ({ ...prev, documents: docs }));
    } else {
      const updated = drivers.map(d => d.id === id ? { ...d, documents: docs } : d);
      onUpdateDrivers(updated);
      setSelectedPersonnel((prev: any) => ({ ...prev, documents: docs }));
    }
  };

  const handleCommitPerformance = () => {
    if (!selectedPersonnel) return;

    const newMetric: PerformanceMetric = {
      id: `PERF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      entityId: selectedPersonnel.id,
      date: new Date().toISOString(),
      efficiencyScore: Math.round((logEfficiency + logSafety + logTiming) / 3),
      operationalEfficiency: logEfficiency,
      safetyCompliance: logSafety,
      loadCycleTiming: logTiming,
      serviceRating: logRating,
      tasksCompleted: Math.floor(Math.random() * 5) + 1,
      rating: logRating,
      safetyIncidents: logSafety < 80 ? 1 : 0,
      kudosCount: logEfficiency > 95 ? 1 : 0,
      goalsProgress: Math.round((logEfficiency + logSafety + logTiming) / 3),
      skills: selectedPersonnel.type === 'DRIVER' ? ['Defensive Driving', 'Route Opt'] : ['Ops Management', 'Reporting']
    };

    onUpdatePerformance([newMetric, ...performance]);
    setShowPerformanceLogger(false);
    
    // Reset states
    setLogEfficiency(85);
    setLogSafety(100);
    setLogTiming(90);
    setLogRating(5);
  };

  const handleUpdateLeaveStatus = (id: string, status: LeaveStatus) => {
    const updatedLeaves = leaves.map(l => l.id === id ? { ...l, status } : l);
    onUpdateLeaves(updatedLeaves);
  };

  const handleSubmitLeave = () => {
    const ok = validate({
      leaveCategory: { value: leaveCategory, label: 'Request Category' },
      leavePersonnelId: { value: leavePersonnelId, label: 'Personnel Reference' },
      leaveStartDate: { value: leaveStartDate, label: 'Start Date' },
      leaveEndDate: { value: leaveEndDate, label: 'End Date' },
      leaveReason: { value: leaveReason, label: 'Justification' },
    });
    if (!ok) return;

    const newRequest: LeaveRequest = {
      id: `LV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      entityId: leavePersonnelId,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      type: leaveCategory.split(' ')[0].toUpperCase() as any, // Simple mapping
      reason: leaveReason,
      status: LeaveStatus.PENDING,
      appliedDate: new Date().toISOString(),
      balanceAtTime: 12 // Placeholder
    };

    onUpdateLeaves([newRequest, ...leaves]);
    setShowLeaveRequestModal(false);
    clearAll();
    // Reset form
    setLeaveCategory('');
    setLeavePersonnelId('');
    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
  };

  const deleteDocument = (docId: string) => {
    if (!selectedPersonnel) return;
    if (window.confirm('Are you sure you want to delete this document?')) {
      const updatedDocs = (selectedPersonnel.documents || []).filter((d: WorkforceDocument) => d.id !== docId);
      updatePersonnelDocuments(selectedPersonnel.id, updatedDocs);
    }
  };

  const startEditingDoc = (doc: WorkforceDocument) => {
    setEditingDocId(doc.id);
    setEditedDocName(doc.fileName);
  };

  const saveDocName = () => {
    if (!selectedPersonnel || !editingDocId) return;
    const updatedDocs = (selectedPersonnel.documents || []).map((d: WorkforceDocument) => 
      d.id === editingDocId ? { ...d, fileName: editedDocName } : d
    );
    updatePersonnelDocuments(selectedPersonnel.id, updatedDocs);
    setEditingDocId(null);
  };

  const nextHoliday = INDIAN_HOLIDAYS.find(h => new Date(h.date) >= startOfDay(new Date()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Workforce', value: stats.total, icon: Users, color: 'blue' },
          { label: 'Present Today', value: stats.present, icon: UserCheck, color: 'emerald' },
          { label: 'On Leave', value: stats.onLeave, icon: Clock, color: 'amber' },
          { label: 'Avg Efficiency', value: `${stats.efficiency}%`, icon: Zap, color: 'indigo' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Internal Navigation */}
        <div className="px-8 pt-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
              {(['roster', 'attendance', 'leaves', 'performance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-hover:scale-110" size={18} />
                <input 
                  type="text" 
                  placeholder="Query personnel by name, tracking ID or designation..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[1.5rem] text-sm font-black text-slate-900 w-80 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:ring-[15px] focus:ring-blue-500/5 focus:w-96 focus:border-blue-400/50 outline-none transition-all duration-500 shadow-xl shadow-slate-100/50"
                />
              </div>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
              >
                <option value="ALL">All Categories</option>
                <option value="DRIVER">Drivers</option>
                <option value="EMPLOYEE">Employees</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8 flex-1">
          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPersonnel.map(person => {
                const metrics = performance.filter(m => m.entityId === person.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const latest = metrics[0];
                const avgScore = metrics.length > 0 
                  ? Math.round(metrics.reduce((acc, curr) => acc + curr.efficiencyScore, 0) / metrics.length)
                  : 0;

                const today = startOfDay(new Date());
                const isOnLeave = leaves.some(l => 
                   l.entityId === person.id && 
                   l.status === LeaveStatus.APPROVED && 
                   today >= startOfDay(parseISO(l.startDate)) && 
                   today <= startOfDay(parseISO(l.endDate))
                );

                return (
                  <div key={person.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                    {/* Feature 1: Tracking ID Badge (Master Data) */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg border border-slate-700">
                        ID: {person.trackingId || 'PENDING'}
                      </span>
                      {person.type === 'DRIVER' && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle size={8} />
                          <span className="text-[7px] font-black uppercase tracking-tighter">Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-slate-200">
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${person.fullName}`} 
                            alt={person.fullName}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                          {/* Feature 2: Attendance Status Pulse (Dynamic) */}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isOnLeave ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'}`}>
                            {isOnLeave ? <Moon size={10} className="text-white" fill="currentColor" /> : <Zap size={10} className="text-white" fill="currentColor" />}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-lg leading-tight">{person.fullName}</h4>
                          <div className="flex items-center gap-2">
                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${person.type === 'DRIVER' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {person.type}
                             </span>
                             {/* Feature 3: Designation Badge (Dynamic) */}
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{person.designation || 'Staff'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature 4: License Alert (Dynamic for Drivers) */}
                    {person.type === 'DRIVER' && person.licenseExpiry && (
                       <div className={`mb-4 px-3 py-2 rounded-2xl border flex items-center justify-between group/alert transition-all ${
                         new Date(person.licenseExpiry).getTime() < Date.now() + (30 * 24 * 60 * 60 * 1000)
                         ? 'bg-rose-50 border-rose-100 text-rose-600'
                         : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                       }`}>
                         <div className="flex items-center gap-2">
                           <ShieldAlert size={14} className={new Date(person.licenseExpiry).getTime() < Date.now() + (30 * 24 * 60 * 60 * 1000) ? 'animate-bounce' : ''} />
                           <span className="text-[10px] font-black uppercase tracking-tight">
                             License Exp: {format(new Date(person.licenseExpiry), 'dd MMM yyyy')}
                           </span>
                         </div>
                         <ChevronRight size={14} className="opacity-0 group-hover/alert:opacity-100 transition-opacity" />
                       </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      {/* Efficiency Metric */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Zap size={10} className="text-blue-500" /> Op. Efficiency
                        </p>
                        <div className="flex items-end gap-2">
                          <p className="text-lg font-black text-slate-900">{latest?.operationalEfficiency || avgScore || 85}%</p>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 rounded-full bg-blue-600"
                            style={{ width: `${latest?.operationalEfficiency || avgScore || 85}%` }}
                          />
                        </div>
                      </div>

                      {/* Safety Metric */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-colors">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <ShieldCheck size={10} className="text-emerald-500" /> Safety
                        </p>
                        <div className="flex items-end gap-2 text-slate-900">
                          <p className="text-lg font-black">{latest?.safetyCompliance || 100}%</p>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 rounded-full bg-emerald-500"
                            style={{ width: `${latest?.safetyCompliance || 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Timing Metric */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:border-amber-200 transition-colors">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Timer size={10} className="text-amber-500" /> Timing
                        </p>
                        <div className="flex items-end gap-2 text-slate-900">
                          <p className="text-lg font-black">{latest?.loadCycleTiming || 90}%</p>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000 rounded-full bg-amber-500"
                            style={{ width: `${latest?.loadCycleTiming || 90}%` }}
                          />
                        </div>
                      </div>

                      {/* Service Rating */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-colors">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Star size={10} className="text-indigo-500" /> Service Rating
                        </p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={12} 
                              className={s <= (latest?.serviceRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                            />
                          ))}
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                          {latest?.serviceRating || 5}.0 Stars
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between px-1">
                      {/* Feature 7 & 8: Joining Date & Documents (Master Data) */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <Calendar size={10} className="text-slate-500" />
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-500">
                            {person.joinDate ? format(new Date(person.joinDate), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-600 transition-colors">
                          <FileText size={12} />
                          <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {(person.documents || []).length} Vault Docs
                          </span>
                        </div>
                      </div>
                      
                      {/* Feature 9: Active Status (Dynamic Badge) */}
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${
                        isOnLeave 
                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnLeave ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{isOnLeave ? 'On Leave' : 'On Duty'}</span>
                      </div>
                    </div>

                    {/* Feature 10: Skills/Certifications (Dynamic Placeholder) */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {person.type === 'DRIVER' ? (
                        <>
                          <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md border border-blue-100">Hazmat Certified</span>
                          <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md">Long Haul</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md border border-indigo-100">Ops Expert</span>
                          <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md">CRM Certified</span>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedPersonnel(person);
                          setShowRosterDetail(true);
                        }}
                        className="flex-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-600 shadow-lg shadow-slate-200"
                      >
                        View Details
                      </button>
                      
                      {/* Feature 10: Action Menu Shortcuts */}
                      <button 
                        onClick={() => {
                          setSelectedPersonnel(person);
                          setShowPerformanceLogger(true);
                        }}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all bg-white shadow-sm"
                        title="Log Performance"
                      >
                        <TrendingUp size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedPersonnel(person);
                          setAttendanceHistoryPersonnelId(person.id);
                          setShowAttendanceHistory(true);
                        }}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all bg-white shadow-sm"
                        title="Attendance History"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedPersonnel(person);
                          setLeavePersonnelId(person.id);
                          setShowLeaveRequestModal(true);
                        }}
                        className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all bg-white shadow-sm"
                        title="Apply Leave"
                      >
                        <PlaneTakeoff size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Today's Attendance Roll Call</h3>
                    <p className="text-sm font-bold text-slate-400">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowAttendanceHistory(true)}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                    >
                      History Log
                    </button>
                    <button 
                      onClick={() => setShowCalendar(true)}
                      className="p-2.5 border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all"
                    >
                      <CalendarDays size={20} />
                    </button>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allPersonnel.map(person => {
                        const record = attendance.find(a => a.entityId === person.id && a.date === format(new Date(), 'yyyy-MM-dd'));
                        return (
                          <tr key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 uppercase tracking-tighter">
                                  {person.fullName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex flex-col">
                                   <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{person.fullName}</span>
                                   <div className="flex items-center gap-1">
                                      <Fingerprint size={10} className={record?.locationVerified ? 'text-emerald-500' : 'text-slate-300'} />
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">UID: {person.trackingId || person.id.split('-')[1]}</span>
                                   </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-col gap-1">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${person.type === 'DRIVER' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                    {person.type}
                                  </span>
                                  {record?.shift && (
                                     <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                                        {record.shift === 'DAY' ? <Sun size={10} className="text-amber-500" /> : <Moon size={10} className="text-indigo-400" />}
                                        {record.shift} SHIFT
                                     </div>
                                  )}
                               </div>
                            </td>
                            <td className="px-8 py-5">
                              {record ? (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    {record.status === AttendanceStatus.PRESENT && (
                                       <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                          <CheckCircle2 size={12} /> {record.checkIn}
                                       </span>
                                    )}
                                    {record.status === AttendanceStatus.ABSENT && <span className="flex items-center gap-1.5 text-red-600 font-black text-[10px] uppercase tracking-widest"><XCircle size={12} /> Absent</span>}
                                    {record.status === AttendanceStatus.LEAVE && <span className="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-widest"><Clock size={12} /> Leave</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                     {record.isLate && <span className="bg-orange-100 text-orange-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5"><Timer size={8} /> Late</span>}
                                     {record.overtimeHours && record.overtimeHours > 0 && <span className="bg-blue-100 text-blue-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase">+{record.overtimeHours}h OT</span>}
                                     {record.locationVerified && <span className="bg-emerald-100 text-emerald-700 text-[7px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5"><MapPin size={8} /> Verified</span>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Not Marked</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="flex bg-slate-100 rounded-lg p-0.5 mr-2">
                                   <button 
                                      onClick={() => handleMarkAttendance(person.id, AttendanceStatus.PRESENT, { shift: 'DAY' })}
                                      className={`p-1.5 rounded-md transition-all ${record?.shift === 'DAY' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                   >
                                      <Sun size={14} />
                                   </button>
                                   <button 
                                      onClick={() => handleMarkAttendance(person.id, AttendanceStatus.PRESENT, { shift: 'NIGHT' })}
                                      className={`p-1.5 rounded-md transition-all ${record?.shift === 'NIGHT' ? 'bg-white text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                   >
                                      <Moon size={14} />
                                   </button>
                                </div>
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setAttendanceHistoryPersonnelId(person.id);
                                      setShowAttendanceHistory(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="View Attendance History"
                                  >
                                    <History size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleMarkAttendance(person.id, AttendanceStatus.PRESENT)}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    title="Mark Present"
                                  >
                                    <UserCheck size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleMarkAttendance(person.id, AttendanceStatus.ABSENT)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                    title="Mark Absent"
                                  >
                                    <UserX size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleMarkAttendance(person.id, AttendanceStatus.PRESENT, { isLate: true })}
                                    className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                    title="Mark Late"
                                  >
                                    <Timer size={16} />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="space-y-8">
               {/* Advanced Leave Dashboard */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Pending Queue', value: leaves.filter(l => l.status === LeaveStatus.PENDING).length, icon: Clock, color: 'blue', detail: 'Requires Action' },
                    { 
                      label: 'Active Leaves', 
                      value: stats.onLeave, 
                      icon: Briefcase, 
                      color: 'emerald', 
                      detail: 'Current Staff Out',
                      pulse: stats.onLeave > 0
                    },
                    { label: 'Upcoming Holiday', value: nextHoliday ? format(new Date(nextHoliday.date), 'MMM d') : 'N/A', icon: Coffee, color: 'rose', detail: nextHoliday?.name || 'No upcoming holidays' },
                    { label: 'Staff Ready', value: stats.total - stats.onLeave, icon: UserCheck, color: 'indigo', detail: 'How many people are available today' }
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white p-6 rounded-[2.5rem] border transition-all group overflow-hidden relative ${
                      (stat as any).pulse 
                        ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.2)] scale-[1.02]' 
                        : 'border-slate-200 shadow-sm hover:border-blue-200'
                    }`}>
                       {(stat as any).pulse && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-[0.03] -mr-16 -mt-16 rounded-full animate-pulse" />
                       )}
                       <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4 group-hover:scale-110 transition-transform ${
                         (stat as any).pulse ? 'animate-bounce' : ''
                       }`}>
                          <stat.icon size={24} />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <div className="flex items-center gap-2">
                          <p className={`text-2xl font-black leading-none mb-1 ${(stat as any).pulse ? 'text-emerald-600' : 'text-slate-900'}`}>{stat.value}</p>
                          {(stat as any).pulse && (
                             <span className="flex h-2 w-2 relative">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                             </span>
                          )}
                       </div>
                       <p className={`text-[8px] font-bold text-${stat.color}-500 uppercase tracking-widest`}>{stat.detail}</p>
                    </div>
                  ))}
               </div>

               <div className="flex flex-col lg:flex-row gap-8">
                  {/* Requests list */}
                  <div className="flex-1 space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           <FileText size={18} className="text-blue-500" />
                           Leave Management Overview (Category, Ref, Timing, Justification)
                        </h4>
                        <div className="flex gap-2">
                           <button 
                              onClick={() => setShowFilterModal(true)}
                              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all"
                           >
                              <Filter size={18} />
                           </button>
                           <button 
                              onClick={() => setShowLeaveRequestModal(true)}
                              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200"
                           >
                              Submit Request
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {leaves.length === 0 ? (
                           <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-12 text-center">
                              <Briefcase size={40} className="mx-auto mb-4 text-slate-300" />
                              <h4 className="font-black text-slate-900 uppercase">Workforce Fully Deployed</h4>
                              <p className="text-[10px] font-bold text-slate-400">No pending leave applications currently.</p>
                           </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                   <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200">
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Request Category</th>
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Personnel Reference</th>
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none text-center">Start Date</th>
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none text-center">End Date</th>
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Operational Justification</th>
                                         <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none text-right">Actions</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                      {leaves.map(request => {
                                         const person = allPersonnel.find(p => p.id === request.entityId);
                                         return (
                                            <tr key={request.id} className="hover:bg-slate-50/50 transition-colors group">
                                               <td className="px-6 py-4">
                                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                     request.type === 'SICK' ? 'bg-red-50 text-red-600 border-red-100' :
                                                     request.type === 'CASUAL' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                     'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                  }`}>
                                                     {request.type}
                                                  </span>
                                               </td>
                                               <td className="px-6 py-4">
                                                  <div className="flex items-center gap-3">
                                                     <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                                                        <img 
                                                           src={`https://api.dicebear.com/7.x/initials/svg?seed=${person?.fullName}`} 
                                                           alt={person?.fullName}
                                                           className="w-full h-full object-cover"
                                                        />
                                                     </div>
                                                     <div>
                                                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight text-nowrap">{person?.fullName}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REF: {person?.trackingId || person?.id.split('-').pop()}</p>
                                                     </div>
                                                  </div>
                                               </td>
                                               <td className="px-6 py-4 text-center">
                                                  <span className="text-[10px] font-black text-nowrap text-slate-900">{format(new Date(request.startDate), 'MMM d, yyyy')}</span>
                                               </td>
                                               <td className="px-6 py-4 text-center">
                                                  <span className="text-[10px] font-black text-nowrap text-slate-900">{format(new Date(request.endDate), 'MMM d, yyyy')}</span>
                                               </td>
                                               <td className="px-6 py-4">
                                                  <p className="text-[10px] font-bold text-slate-500 max-w-[200px] line-clamp-2 italic" title={request.reason}>
                                                     "{request.reason}"
                                                  </p>
                                               </td>
                                               <td className="px-6 py-4 text-right">
                                                  <div className="flex items-center justify-end gap-2 text-nowrap">
                                                     {request.status === LeaveStatus.PENDING ? (
                                                        <>
                                                           <button 
                                                              onClick={() => handleUpdateLeaveStatus(request.id, LeaveStatus.APPROVED)}
                                                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                                              title="Approve Request"
                                                           >
                                                              <CheckCircle2 size={16} />
                                                           </button>
                                                           <button 
                                                              onClick={() => handleUpdateLeaveStatus(request.id, LeaveStatus.REJECTED)}
                                                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                                              title="Reject Request"
                                                           >
                                                              <XCircle size={16} />
                                                           </button>
                                                        </>
                                                     ) : (
                                                        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border ${
                                                           request.status === LeaveStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                                        }`}>
                                                           {request.status}
                                                        </div>
                                                     )}
                                                  </div>
                                               </td>
                                            </tr>
                                         );
                                      })}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Sidebar - Policy & Balance */}
                  <div className="w-full lg:w-80 space-y-6">
                     <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-inner overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-all" />
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                           <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                              <CalendarDays size={20} />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Holiday Calendar</h4>
                              <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">India Regional Observances</p>
                           </div>
                        </div>
                        
                        <div className="space-y-3 mb-6 relative z-10">
                           {INDIAN_HOLIDAYS
                              .filter(h => new Date(h.date) >= startOfDay(new Date()))
                              .slice(0, 3)
                              .map((holiday, idx) => (
                                 <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded-xl border border-white/80 backdrop-blur-sm">
                                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
                                       <span className="text-[8px] font-black leading-none">{format(new Date(holiday.date), 'MMM')}</span>
                                       <span className="text-xs font-black leading-none">{format(new Date(holiday.date), 'd')}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-[9px] font-black text-slate-900 uppercase truncate">{holiday.name}</p>
                                       <p className={`text-[7px] font-bold uppercase ${holiday.type === 'Compulsory' ? 'text-rose-500' : 'text-slate-400'}`}>
                                          {holiday.type}
                                       </p>
                                    </div>
                                 </div>
                              ))
                           }
                        </div>

                        <button 
                           onClick={() => setShowCalendar(true)}
                           className="w-full py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
                        >
                           View Full Holiday Calendar <ChevronRight size={10} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8">
               {/* Leaderboard & Highlights */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-3 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={140} className="text-white" />
                     </div>
                     <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-4">
                           <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-amber-500 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] animate-pulse flex items-center gap-1">
                                 <Trophy size={10} /> Elite Performers
                              </span>
                           </div>
                           <h3 className="text-3xl font-black text-white leading-tight">Fleet Efficiency Leaderboard</h3>
                           <div className="flex -space-x-3 overflow-hidden pt-2">
                              {allPersonnel.slice(0, 5).map((p, i) => (
                                 <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300 ring-2 ring-transparent group-hover:ring-amber-500/50 transition-all">
                                    {p.fullName[0]}
                                 </div>
                              ))}
                              <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">+12</div>
                           </div>
                           <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm">Top 3 performers this week have achieved <span className="text-white font-black underline decoration-emerald-500 decoration-2">98% route accuracy</span>.</p>
                           <div className="flex flex-wrap gap-3 pt-4">
                              <button 
                                onClick={() => setShowLeaderboardModal(true)}
                                className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Full Leaderboard</button>
                              <button 
                                onClick={() => setShowRewardsModal(true)}
                                className="bg-slate-800 text-white border border-slate-700 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-2">
                                 <Award size={14} className="text-amber-400" /> Reward Points
                              </button>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                           {[
                              { label: 'Safety Incidents', value: performance.reduce((acc, curr) => acc + (curr.safetyIncidents || 0), 0), icon: ShieldAlert, color: 'red' },
                              { label: 'Kudos Given', value: stats.kudosTotal, icon: Heart, color: 'rose' },
                              { label: 'Skill Points', value: '+420', icon: Zap, color: 'amber' }
                           ].map((item, i) => (
                              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm text-center">
                                 <item.icon size={18} className={`text-${item.color}-400 mx-auto mb-2`} />
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                 <p className="text-lg font-black text-white leading-none">{item.value}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <Zap size={18} className="text-blue-500" />
                       Workforce Performance Matrix
                    </h4>
                    <div className="flex items-center gap-3">
                       <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                          <History size={14} /> View History
                       </button>
                       <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                          <Plus size={14} /> Log Performance
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allPersonnel.map(person => {
                      const metrics = performance.filter(m => m.entityId === person.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      const latest = metrics[0];
                      const avg = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + curr.efficiencyScore, 0) / metrics.length : 0;
                      const safetyScore = latest?.safetyIncidents === 0 ? 100 : Math.max(0, 100 - (latest?.safetyIncidents || 0) * 20);

                      return (
                        <div key={person.id} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 flex flex-col gap-6 group hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 relative">
                           <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                       {person.fullName[0]}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-amber-500">
                                       <Award size={14} />
                                    </div>
                                 </div>
                                 <div>
                                    <h5 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors">{person.fullName}</h5>
                                    <div className="flex items-center gap-2">
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{person.type}</p>
                                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                       <div className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map(s => (
                                             <Star key={s} size={10} className={s <= (latest?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-2xl font-black text-slate-900 leading-none">{Math.round(avg)}%</div>
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Score</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-3 gap-3">
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert size={10} /> Safety</p>
                                 <p className={`text-sm font-black ${safetyScore > 80 ? 'text-emerald-600' : 'text-red-500'}`}>{safetyScore}%</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Heart size={10} /> Kudos</p>
                                 <p className="text-sm font-black text-rose-600">{latest?.kudosCount || 0}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={10} /> Tasks</p>
                                 <p className="text-sm font-black text-slate-900">{latest?.tasksCompleted || 0}</p>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                 {(latest?.skills || ['Defensive Driving', 'Logistics Planning', 'Safety Protocols']).map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-lg group-hover:bg-white transition-colors">
                                       {skill}
                                    </span>
                                 ))}
                                 <button className="w-5 h-5 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-all">
                                    <Plus size={10} />
                                 </button>
                               </div>
                               
                               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${avg > 80 ? 'bg-emerald-500' : avg > 60 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                    style={{ width: `${latest?.goalsProgress || avg}%` }} 
                                  />
                               </div>
                               <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                  <span>Goal Progress</span>
                                  <span className="text-slate-900">{latest?.goalsProgress || 75}%</span>
                               </div>
                           </div>

                           <div className="flex items-center gap-2 mt-2">
                              <button 
                                onClick={() => {
                                  setSelectedPersonnel(person);
                                  setShowMetricsDetail(true);
                                }}
                                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
                              >
                                View Core Metrics
                              </button>
                              <button 
                                 onClick={() => { setSelectedPersonnel(person); setShowPerformanceHistory(true); }}
                                 className="p-3 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                 title="History"
                              >
                                 <History size={18} />
                              </button>
                              <button 
                                 onClick={() => { setSelectedPersonnel(person); setShowPerformanceLogger(true); }}
                                 className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                 title="Log Data"
                              >
                                 <Zap size={18} />
                              </button>
                           </div>

                           {/* Dynamic Badge for Over-Performers */}
                           {avg > 90 && (
                              <div className="absolute top-4 right-4 animate-bounce">
                                 <div className="bg-amber-400 text-white p-2 rounded-full shadow-lg shadow-amber-200">
                                    <Zap size={16} fill="currentColor" />
                                 </div>
                              </div>
                           )}
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className="space-y-8 mt-12 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Overall Efficiency Curve */}
                     <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Efficiency Curve (Fleet Average)</h5>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-[8px] font-black uppercase text-slate-400">Yield %</span>
                           </div>
                        </div>
                        <div className="flex items-end gap-3 h-48 px-4">
                           {[65, 78, 72, 85, 92, 88, 95, 90, 85, 94, 98, 92].map((h, i) => (
                              <div key={i} className="flex-1 bg-slate-50 rounded-t-xl relative group">
                                 <div 
                                   className="absolute bottom-0 left-0 right-0 bg-blue-600/20 group-hover:bg-blue-600 transition-all duration-500 rounded-t-xl" 
                                   style={{ height: `${h}%` }}
                                 >
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-blue-600 opacity-0 group-hover:opacity-100 whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm">
                                       {h}%
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="flex justify-between mt-4 px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                           <span>Jan 2026</span>
                           <span>Dec 2026</span>
                        </div>
                     </div>

                     {/* Work History Timeline */}
                     <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-2">
                              <History size={16} className="text-blue-500" />
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Work Repository</h5>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                 type="date" 
                                 className="text-[8px] font-black border border-slate-200 rounded-lg px-2 py-1 uppercase outline-none focus:border-blue-300"
                                 value={workHistoryStartDate}
                                 onChange={(e) => setWorkHistoryStartDate(e.target.value)}
                              />
                              <span className="text-[8px] font-black text-slate-300">TO</span>
                              <input 
                                 type="date" 
                                 className="text-[8px] font-black border border-slate-200 rounded-lg px-2 py-1 uppercase outline-none focus:border-blue-300"
                                 value={workHistoryEndDate}
                                 onChange={(e) => setWorkHistoryEndDate(e.target.value)}
                              />
                           </div>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[14rem] pr-2 custom-scrollbar">
                           {WORK_HISTORIES.filter(wh => {
                              if (!workHistoryStartDate || !workHistoryEndDate) return true;
                              const d = new Date(wh.date);
                              return d >= new Date(workHistoryStartDate) && d <= new Date(workHistoryEndDate);
                           }).map(wh => (
                              <div key={wh.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                                 <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-white flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                          <span className="text-[6px] font-black leading-none">{format(new Date(wh.date), 'MMM')}</span>
                                          <span className="text-[10px] font-black leading-none">{format(new Date(wh.date), 'd')}</span>
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-black text-slate-900 uppercase leading-none mb-1">
                                             {wh.pickupSite} <span className="text-slate-300 mx-1">→</span> {wh.deliveryClient}
                                          </p>
                                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Truck: {wh.truckId} • {wh.hoursSpent}h</p>
                                       </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[6px] font-black uppercase ${
                                       wh.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 
                                       wh.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                       {wh.status}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>



      {/* Dynamic Modals Overlay Layer */}
      {(showRosterDetail || showAttendanceHistory || showLeaveRequestModal || showPerformanceLogger || showMetricsDetail || showPerformanceHistory || showCalendar || showFilterModal || showLeaderboardModal || showRewardsModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                     {showRosterDetail && "Personnel Dossier"}
                     {showAttendanceHistory && "Attendance Archive"}
                     {showLeaveRequestModal && "Submit Leave Request"}
                     {showPerformanceLogger && "Log Operational Metrics"}
                     {showMetricsDetail && "Core Performance Matrix"}
                     {showPerformanceHistory && "Efficiency Timeline"}
                     {showCalendar && "Workforce Calendar"}
                     {showFilterModal && "Advanced Intelligence Filter"}
                     {showLeaderboardModal && "Global Fleet Leaderboard"}
                     {showRewardsModal && "Reward Points & Benefits Vault"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">FlyAsh Logistics Workforce Management</p>
               </div>
               <button 
                  onClick={() => {
                    setShowRosterDetail(false);
                    setShowAttendanceHistory(false);
                    setShowLeaveRequestModal(false);
                    setShowPerformanceLogger(false);
                    setShowMetricsDetail(false);
                    setShowPerformanceHistory(false);
                    setShowCalendar(false);
                    setShowFilterModal(false);
                    setShowLeaderboardModal(false);
                    setShowRewardsModal(false);
                    setSelectedPersonnel(null);
                    setSelectedAttendanceRecord(null);
                    setAttendanceHistoryPersonnelId(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
               >
                  <XCircle size={24} />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
               {showLeaderboardModal && (
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* 1. Champion Status */}
                        <div className="bg-slate-950 p-5 rounded-[2.5rem] text-white flex flex-col justify-between overflow-hidden relative group">
                           <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
                           <Trophy className="text-amber-500 mb-4 animate-bounce" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Rank</p>
                              <p className="text-3xl font-black italic">#1</p>
                              <span className="text-[8px] font-bold text-emerald-400 uppercase">Top 1 percentile</span>
                           </div>
                        </div>

                        {/* 2. Consistency Streak */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-emerald-200 transition-all">
                           <Activity className="text-emerald-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Elite Streak</p>
                              <p className="text-2xl font-black text-slate-900">14 Days</p>
                              <div className="flex gap-1 mt-1">
                                 {[1,1,1,1,1].map((_, i) => <div key={i} className="w-1.5 h-1 bg-emerald-500 rounded-full" />)}
                              </div>
                           </div>
                        </div>

                        {/* 3. Peak Velocity */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-blue-200 transition-all">
                           <Zap className="text-blue-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Peak Score</p>
                              <p className="text-2xl font-black text-slate-900">99.2%</p>
                              <span className="text-[8px] font-bold text-blue-500 uppercase">Last Logged: May 12</span>
                           </div>
                        </div>

                        {/* 4. Reliability Index */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-indigo-200 transition-all">
                           <ShieldCheck className="text-indigo-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Trust Score</p>
                              <p className="text-2xl font-black text-slate-900">98.5</p>
                              <span className="text-[8px] font-bold text-indigo-400 uppercase">A+ Rating</span>
                           </div>
                        </div>

                        {/* 5. Regional Standing */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-orange-200 transition-all">
                           <MapPin className="text-orange-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Zone Rank</p>
                              <p className="text-2xl font-black text-slate-900">#4</p>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Eastern Hub</span>
                           </div>
                        </div>

                        {/* 6. Improvement Curve */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-pink-200 transition-all">
                           <TrendingUp className="text-pink-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Growth MoM</p>
                              <p className="text-2xl font-black text-slate-900">+12%</p>
                              <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                 <div className="h-full bg-pink-500 w-[60%]" />
                              </div>
                           </div>
                        </div>

                        {/* 7. Fuel Efficiency Bonus */}
                        <div className="bg-emerald-50 p-5 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-between group">
                           <Truck className="text-emerald-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Eco-Driver</p>
                              <p className="text-2xl font-black text-emerald-900">Tier 1</p>
                              <span className="text-[8px] font-black text-emerald-600 uppercase">Bonus Eligible</span>
                           </div>
                        </div>

                        {/* 8. Safety Violation Clock */}
                        <div className="bg-blue-50 p-5 rounded-[2.5rem] border border-blue-100 flex flex-col justify-between group">
                           <ShieldAlert className="text-blue-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 mb-1">Clean Record</p>
                              <p className="text-2xl font-black text-blue-900">320D</p>
                              <span className="text-[8px] font-black text-blue-600 uppercase">Incident Free</span>
                           </div>
                        </div>

                        {/* 9. Feedback Sentiment */}
                        <div className="bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between group">
                           <MessageCircle className="text-indigo-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60 mb-1">Client View</p>
                              <p className="text-2xl font-black text-indigo-900">4.9/5</p>
                              <span className="text-[8px] font-black text-indigo-600 uppercase">High Praise</span>
                           </div>
                        </div>

                        {/* 10. Community Standing */}
                        <div className="bg-amber-50 p-5 rounded-[2.5rem] border border-amber-100 flex flex-col justify-between group">
                           <Heart className="text-amber-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/60 mb-1">Kudos Rank</p>
                              <p className="text-2xl font-black text-amber-900">Top 5</p>
                              <span className="text-[8px] font-black text-amber-600 uppercase">Peers' Choice</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs border-l-4 border-blue-600 pl-4">Detailed Rankings (Week 19)</h4>
                           <select className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                              <option>May 2026</option>
                              <option>April 2026</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           {allPersonnel.slice(0, 10).map((p, i) => (
                              <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all shadow-sm">
                                 <div className="flex items-center gap-6">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border ${i < 3 ? 'bg-amber-100 text-amber-600 border-amber-200 scale-110 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                       {i + 1}
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100">
                                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.fullName}`} alt="" className="w-full h-full object-cover" />
                                       </div>
                                       <div>
                                          <h6 className="font-black text-slate-900 uppercase tracking-tight text-xs leading-none mb-1">{p.fullName}</h6>
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.type} • {p.designation}</p>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-8">
                                    <div className="text-right">
                                       <p className="text-lg font-black text-slate-900 leading-none">9{9-i}.{8-i}%</p>
                                       <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Efficiency</p>
                                    </div>
                                    <div className="w-16 flex flex-col items-end">
                                       <TrendingUp size={14} className={i < 5 ? 'text-emerald-500' : 'text-rose-500'} />
                                       <span className={`text-[8px] font-black uppercase ${i < 5 ? 'text-emerald-500' : 'text-rose-500'}`}>{i < 5 ? '+2.4%' : '-1.1%'}</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {showRewardsModal && (
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* 1. Points Balance */}
                        <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 blur-2xl group-hover:bg-white/30 transition-all" />
                           <Award className="mb-4" size={32} />
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/60 mb-1">Available Balance</p>
                              <p className="text-4xl font-black leading-none">4,280</p>
                              <span className="text-[8px] font-black text-blue-100 uppercase mt-2 block tracking-widest">PTS VALUATION: ₹856.00</span>
                           </div>
                        </div>

                        {/* 2. Monthly Earnings Velocity */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-blue-200 transition-all">
                           <TrendingUp className="text-blue-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Yield</p>
                              <p className="text-2xl font-black text-slate-900">+820 pts</p>
                              <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                                 <Zap size={10} fill="currentColor" /> Outpacing Avg by 15%
                              </div>
                           </div>
                        </div>

                        {/* 3. Tier Status */}
                        <div className="bg-slate-950 p-5 rounded-[2.5rem] text-white flex flex-col justify-between relative group">
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Star className="text-indigo-400 mb-4 fill-indigo-400" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Membership</p>
                              <p className="text-2xl font-black text-indigo-400">GOLD Tier</p>
                              <span className="text-[8px] font-black text-slate-500 uppercase">Next: Platinum (720 pts target)</span>
                           </div>
                        </div>

                        {/* 4. Redemption Power */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-amber-200 transition-all">
                           <Truck className="text-amber-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Unlock Status</p>
                              <p className="text-2xl font-black text-slate-900">4 Rewards</p>
                              <span className="text-[8px] font-black text-amber-500 uppercase">Ready to Redeem</span>
                           </div>
                        </div>

                        {/* 5. Points Expiry Integrity */}
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between group hover:border-rose-200 transition-all">
                           <Timer className="text-rose-500 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Vault Aging</p>
                              <p className="text-2xl font-black text-slate-900">342 Days</p>
                              <span className="text-[8px] font-black text-rose-400 uppercase">Until Earliest Expiry</span>
                           </div>
                        </div>

                        {/* 6. Multiplier Status */}
                        <div className="bg-blue-50 p-5 rounded-[2.5rem] border border-blue-100 flex flex-col justify-between group">
                           <Zap className="text-blue-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 mb-1">Earning Power</p>
                              <p className="text-2xl font-black text-blue-900">1.5x</p>
                              <span className="text-[8px] font-black text-blue-500 uppercase">Perfect Attendance Bonus</span>
                           </div>
                        </div>

                        {/* 7. Lifetime Contribution */}
                        <div className="bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group">
                           <Trophy className="text-slate-400 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime Yield</p>
                              <p className="text-2xl font-black text-slate-900">22.4K</p>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Points Earned</span>
                           </div>
                        </div>

                        {/* 8. Impact Peer Index */}
                        <div className="bg-emerald-50 p-5 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-between group">
                           <Users className="text-emerald-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Peer Percentile</p>
                              <p className="text-2xl font-black text-emerald-900">Top 5%</p>
                              <span className="text-[8px] font-black text-emerald-600 uppercase">System Contribution Rank</span>
                           </div>
                        </div>

                        {/* 9. Safety Bonus Guard */}
                        <div className="bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between group">
                           <ShieldCheck className="text-indigo-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600/60 mb-1">Safety Credits</p>
                              <p className="text-2xl font-black text-indigo-900">+450</p>
                              <span className="text-[8px] font-black text-indigo-600 uppercase">Zero Incident Premium</span>
                           </div>
                        </div>

                        {/* 10. Digital Badges */}
                        <div className="bg-orange-50 p-5 rounded-[2.5rem] border border-orange-100 flex flex-col justify-between group">
                           <CheckCircle className="text-orange-600 mb-4" size={24} />
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-orange-600/60 mb-1">Milestones</p>
                              <p className="text-2xl font-black text-orange-900">12 Badges</p>
                              <span className="text-[8px] font-black text-orange-600 uppercase">Unlocked Achievements</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Points History */}
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                           <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8 border-l-4 border-blue-600 pl-4">Transaction Intelligence Ledger</h4>
                           <div className="space-y-4">
                              {[
                                 { label: 'Weekly Performance Bonus', pts: '+250', type: 'Credit', icon: Zap, color: 'blue' },
                                 { label: 'Safety Record Premium', pts: '+100', type: 'Credit', icon: ShieldCheck, color: 'emerald' },
                                 { label: 'Fuel Savings Multiplier', pts: '+75', type: 'Credit', icon: Truck, color: 'amber' },
                                 { label: 'Amazon Voucher Redemption', pts: '-2000', type: 'Debit', icon: ShoppingBag, color: 'rose' },
                                 { label: 'Peer Kudos Received', pts: '+50', type: 'Credit', icon: Heart, color: 'indigo' }
                              ].map((item, i) => {
                                 const Icon = (item as any).icon || Activity;
                                 return (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:shadow-lg transition-all border border-transparent hover:border-slate-100">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-xl bg-${(item as any).color}-100 flex items-center justify-center text-${(item as any).color}-600 group-hover:scale-110 transition-transform`}>
                                             <Icon size={20} />
                                          </div>
                                          <div>
                                             <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{item.label}</p>
                                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">May {14 - i}, 2026 • {item.type}</p>
                                          </div>
                                       </div>
                                       <p className={`font-black text-sm ${item.pts.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{item.pts}</p>
                                    </div>
                                 );
                              })}
                           </div>
                           <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 transition-all active:scale-95">Load Historical Archive</button>
                        </div>

                        {/* Redemption Catalog */}
                        <div className="bg-slate-950 p-8 rounded-[3rem] text-white overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-8 opacity-10">
                              <ShoppingBag size={120} />
                           </div>
                           <h4 className="font-black uppercase tracking-widest text-xs mb-8 border-l-4 border-amber-500 pl-4 relative z-10">Exclusive Redeemption Vault</h4>
                           <div className="grid grid-cols-2 gap-4 relative z-10">
                              {[
                                 { label: 'Family Health Checkup', pts: '2,500', icon: Heart, color: 'rose' },
                                 { label: 'Premium PPE Gear Set', pts: '1,800', icon: ShieldCheck, color: 'blue' },
                                 { label: 'Holiday Stay Voucher', pts: '5,000', icon: Moon, color: 'indigo' },
                                 { label: 'Fuel Allowance Topup', pts: '3,000', icon: Zap, color: 'amber' }
                              ].map((reward, i) => (
                                 <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer active:scale-95">
                                    <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-${(reward as any).color}-400 group-hover:scale-110 transition-transform`}>
                                       <reward.icon size={20} />
                                    </div>
                                    <p className="text-xs font-black uppercase mb-1">{reward.label}</p>
                                    <div className="flex items-center justify-between">
                                       <p className="text-lg font-black text-amber-400">{reward.pts} <span className="text-[10px] text-white/40 uppercase">PTS</span></p>
                                       <button className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white text-slate-900 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                                          <Plus size={14} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <p className="mt-8 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] text-center">Elite access granted based on current status</p>
                        </div>
                     </div>
                  </div>
               )}

               {showRosterDetail && selectedPersonnel && (
                  <div className="space-y-8">
                     <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="w-24 h-24 rounded-3xl bg-white p-1 border-2 border-slate-100 shadow-sm overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedPersonnel.fullName}`} className="w-full h-full rounded-2xl object-cover" alt="" />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedPersonnel.fullName}</h4>
                           <p className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                              <span>{selectedPersonnel.type}</span>
                              <span className="w-1.5 h-1.5 bg-blue-200 rounded-full" />
                              <span className="bg-blue-900 text-white px-2 py-0.5 rounded text-[10px] shadow-sm">
                                 {selectedPersonnel.trackingId || selectedPersonnel.id}
                              </span>
                           </p>
                           <div className="flex gap-2 mt-3">
                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600">Active Duty</span>
                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600">Verified</span>
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-blue-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Join Date</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{selectedPersonnel.joinDate ? format(new Date(selectedPersonnel.joinDate), 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <Briefcase size={14} className="text-blue-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Designation</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate">{selectedPersonnel.designation || 'Field Specialist'}</p>
                        </div>
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-emerald-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <Star size={14} className="text-orange-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Experience</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {selectedPersonnel.experienceYears ? `${selectedPersonnel.experienceYears}Y+` : 'Exp. Pending'}
                           </p>
                        </div>
                        <div className={`p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm transition-all group ${selectedPersonnel.type === 'DRIVER' ? 'hover:border-rose-200' : 'opacity-40 grayscale pointer-events-none'}`}>
                           <div className="flex items-center gap-2">
                              <ShieldAlert size={14} className="text-rose-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">License Expiry</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-rose-600 transition-colors">
                              {selectedPersonnel.licenseExpiry ? format(new Date(selectedPersonnel.licenseExpiry), 'MMM dd, yyyy') : 'N/A'}
                           </p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-blue-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <Phone size={14} className="text-blue-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Phone Connection</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{selectedPersonnel.phoneNumber || 'N/A'}</p>
                        </div>
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-emerald-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <MessageCircle size={14} className="text-emerald-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">WhatsApp Network</p>
                           </div>
                           <p className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors uppercase">{selectedPersonnel.whatsappNumber || 'N/A'}</p>
                        </div>
                        <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl space-y-2 shadow-sm hover:border-indigo-200 transition-all group">
                           <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-indigo-500" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Permanent Residence</p>
                           </div>
                           <p className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{selectedPersonnel.address || 'N/A'}</p>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between" id="vault-header">
                           <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3 italic">Vault Intelligence Matrix</h5>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encryption Enabled</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           {[
                              { label: 'Driving License', icon: Zap, color: 'blue' },
                              { label: 'Id Card', icon: Fingerprint, color: 'emerald' },
                              { label: 'Life Insurance', icon: Heart, color: 'rose' },
                              { label: 'Other', icon: FileText, color: 'slate' }
                           ].map((cat, i) => (
                              <label key={i} className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl group hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer text-center active:scale-95">
                                 <cat.icon size={20} className={`text-${cat.color}-500 mb-2 group-hover:scale-110 transition-transform`} />
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{cat.label}</span>
                                 <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, cat.label)} 
                                    accept="image/*,application/pdf" 
                                 />
                                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={12} />
                                 </div>
                              </label>
                           ))}
                        </div>
                        
                        <div className="space-y-3">
                           <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Stored Artifacts</h6>
                           {selectedPersonnel.documents && selectedPersonnel.documents.length > 0 ? (
                              selectedPersonnel.documents.map((doc: WorkforceDocument) => (
                                 <div key={doc.id} className="flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl group hover:border-blue-200 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4 flex-1">
                                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.mimeType?.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                          <File size={20} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          {editingDocId === doc.id ? (
                                             <div className="flex items-center gap-2">
                                                <input 
                                                   type="text" 
                                                   value={editedDocName} 
                                                   onChange={(e) => setEditedDocName(e.target.value)}
                                                   className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                                   autoFocus
                                                />
                                                <button onClick={saveDocName} className="text-emerald-500 font-black text-[10px] uppercase">Save</button>
                                                <button onClick={() => setEditingDocId(null)} className="text-slate-400 font-black text-[10px] uppercase">Cancel</button>
                                             </div>
                                          ) : (
                                             <>
                                                <div className="flex items-center gap-2">
                                                   <p className="text-sm font-black text-slate-900 uppercase truncate pr-2">{doc.fileName}</p>
                                                   <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase">{doc.type}</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Uploaded {format(new Date(doc.uploadDate), 'MMM dd, yyyy')} • {(doc.size ? (doc.size / 1024).toFixed(1) : 0)} KB</p>
                                             </>
                                          )}
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <a 
                                          href={doc.fileUrl} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
                                          title="View/Open"
                                       >
                                          <Eye size={14} />
                                       </a>
                                       <a 
                                          href={doc.fileUrl} 
                                          download={doc.fileName}
                                          className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
                                          title="Download"
                                          id={`download-${doc.id}`}
                                       >
                                          <Download size={14} />
                                       </a>
                                       <button 
                                          onClick={() => startEditingDoc(doc)}
                                          className="p-2 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
                                          title="Edit Name"
                                       >
                                          <Edit3 size={14} />
                                       </button>
                                       <button 
                                          onClick={() => deleteDocument(doc.id)}
                                          className="p-2 bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
                                          title="Delete"
                                       >
                                          <Trash2 size={14} />
                                       </button>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-slate-50/50">
                                 <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No documents found in vault</p>
                                 <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Upload ID proofs, licenses, or medical records</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {showAttendanceHistory && (
                  <div className="space-y-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                           <h4 className="text-xs font-black text-slate-900 uppercase">
                              {attendanceHistoryPersonnelId 
                                 ? `Attendance Archive: ${fullPersonnelList.find(p => p.id === attendanceHistoryPersonnelId)?.fullName}`
                                 : "Workforce Attendance Archive"}
                           </h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {attendanceHistoryPersonnelId ? "Historical logs for specific driver" : "Comprehensive lifecycle logs for all fleet personnel"}
                           </p>
                        </div>
                        <div className="flex items-center gap-2">
                           {!attendanceHistoryPersonnelId && (
                              <select 
                                 className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                 onChange={(e) => setAttendanceHistoryPersonnelId(e.target.value || null)}
                              >
                                 <option value="">All Drivers</option>
                                 {fullPersonnelList.filter(p => p.type === 'DRIVER').map(d => (
                                    <option key={d.id} value={d.id}>{d.fullName}</option>
                                 ))}
                              </select>
                           )}
                           <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Export Detailed Log</button>
                        </div>
                     </div>

                     {selectedAttendanceRecord ? (
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
                           <div className="flex items-center justify-between">
                              <button 
                                 onClick={() => setSelectedAttendanceRecord(null)}
                                 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors"
                              >
                                 <ChevronRight className="rotate-180" size={14} /> Back to Archive
                              </button>
                              <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                                 System Integrity Verified
                              </div>
                           </div>

                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                 <Fingerprint size={32} className="text-blue-600" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Detailed Log Entry</p>
                                 <h5 className="text-2xl font-black text-slate-900 leading-none">
                                    {format(new Date(selectedAttendanceRecord.date), 'EEEE, MMMM do, yyyy')}
                                 </h5>
                              </div>
                           </div>                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {/* 1. Shift Duration Analytics */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Clock size={40} />
                                 </div>
                                 <Clock size={16} className="text-blue-500 mb-3 group-hover:animate-spin-slow" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Shift Analytics</p>
                                 <p className="text-base font-black text-slate-900">08h 42m</p>
                                 <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp size={10} className="text-emerald-500" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">+5% vs Daily Goal</span>
                                 </div>
                              </div>

                              {/* 2. Geolocation Verification */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-rose-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <MapPin size={40} />
                                 </div>
                                 <MapPin size={16} className="text-rose-500 mb-3 group-hover:animate-bounce" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Geofence Verif.</p>
                                 <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <p className="text-base font-black text-slate-900">Secured</p>
                                 </div>
                                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter font-mono">SITE_ID: HQ-NORTH-01</span>
                              </div>

                              {/* 3. Weather Context */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-amber-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <CloudSun size={40} />
                                 </div>
                                 <CloudSun size={16} className="text-amber-500 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Environmental</p>
                                 <p className="text-base font-black text-slate-900">32°C / 89°F</p>
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Humid • Visibility: 10km</p>
                              </div>

                              {/* 4. Vault Integrity */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <ShieldCheck size={40} />
                                 </div>
                                 <Fingerprint size={16} className="text-indigo-500 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data Custody</p>
                                 <p className="text-base font-black text-slate-900">Immutable</p>
                                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">SHA-256 Verified Log</span>
                              </div>

                              {/* 5. Fatigue Risk Score (AI) */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-orange-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Activity size={40} />
                                 </div>
                                 <Activity size={16} className="text-orange-500 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fatigue Index</p>
                                 <div className="flex items-center gap-2">
                                    <p className="text-base font-black text-slate-900">Low Risk</p>
                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500 w-[12%]" />
                                    </div>
                                 </div>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Based on sleeping patterns</span>
                              </div>

                              {/* 6. Biometric Sync */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <ShieldCheck size={40} />
                                 </div>
                                 <UserCheck size={16} className="text-blue-600 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Biometric Auth</p>
                                 <p className="text-base font-black text-slate-900">Success</p>
                                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter text-nowrap">Face-ID Match: 99.8%</span>
                              </div>

                              {/* 7. Fleet Telematics */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-slate-800 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Truck size={40} />
                                 </div>
                                 <Truck size={16} className="text-slate-900 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Associated Unit</p>
                                 <p className="text-base font-black text-slate-900">TRK-2022</p>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Odometer: 14,290 KM</span>
                              </div>

                              {/* 8. Compliance Status */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Briefcase size={40} />
                                 </div>
                                 <FileCheck size={16} className="text-emerald-500 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Standard Ops</p>
                                 <p className="text-base font-black text-slate-900">Compliant</p>
                                 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">All PPE Verified</span>
                              </div>

                              {/* 9. Health & Safety */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-rose-200 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Star size={40} />
                                 </div>
                                 <Heart size={16} className="text-rose-500 mb-3" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Physical Health</p>
                                 <p className="text-base font-black text-slate-900">OPTIMAL</p>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Next Review in 12D</span>
                              </div>

                              {/* 10. System Health */}
                              <div className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-blue-900 hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Zap size={40} />
                                 </div>
                                 <Zap size={16} className="text-blue-900 mb-3 animate-pulse" />
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Node</p>
                                 <p className="text-base font-black text-slate-900">NODE-A8</p>
                                 <span className="text-[8px] font-black text-blue-900 uppercase tracking-tighter">Latency: 14ms</span>
                              </div>
                           </div>

                           <div className="p-6 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-lg border border-blue-800">
                                    <Activity size={24} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Cycle Intelligence</p>
                                    <h6 className="text-sm font-black text-slate-900 uppercase">Autonomous Work Breakdown Structure</h6>
                                 </div>
                              </div>
                              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200">Adjust Hours</button>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {/* Calendar Controls */}
                           <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                              <div className="flex items-center gap-4">
                                 <button 
                                    onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                                 >
                                    <ChevronRight className="rotate-180" size={20} />
                                 </button>
                                 <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest min-w-[150px] text-center">
                                    {format(calendarDate, 'MMMM yyyy')}
                                 </h5>
                                 <button 
                                    onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"
                                 >
                                    <ChevronRight size={20} />
                                 </button>
                              </div>
                              <div className="flex gap-3">
                                 {[
                                    { label: 'Present', color: 'bg-emerald-500' },
                                    { label: 'Late', color: 'bg-amber-500' },
                                    { label: 'Absent', color: 'bg-rose-500' },
                                    { label: 'Leave', color: 'bg-indigo-500' }
                                 ].map(legend => (
                                    <div key={legend.label} className="flex items-center gap-1.5">
                                       <div className={`w-2 h-2 rounded-full ${legend.color}`} />
                                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{legend.label}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           {/* Calendar Grid */}
                           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
                              <div className="grid grid-cols-7 gap-2">
                                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                                 ))}
                                 {getCalendarDays(calendarDate).map((day, idx) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dayAttendance = attendance.find(a => 
                                       isSameDay(new Date(a.date), day) && 
                                       (!attendanceHistoryPersonnelId || a.entityId === attendanceHistoryPersonnelId)
                                    );
                                    const dayLeave = leaves.find(l => 
                                       isWithinInterval(day, { start: startOfDay(new Date(l.startDate)), end: startOfDay(new Date(l.endDate)) }) &&
                                       l.status === LeaveStatus.APPROVED &&
                                       (!attendanceHistoryPersonnelId || l.entityId === attendanceHistoryPersonnelId)
                                    );

                                    let statusColor = 'bg-slate-50 text-slate-300';
                                    if (dayLeave) statusColor = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
                                    else if (dayAttendance?.status === AttendanceStatus.PRESENT) {
                                       statusColor = dayAttendance.isLate ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                                    } else if (dayAttendance?.status === AttendanceStatus.ABSENT) {
                                       statusColor = 'bg-rose-50 text-rose-600 border border-rose-100';
                                    }

                                    const isCurrentMonth = isSameMonth(day, calendarDate);

                                    return (
                                       <button 
                                          key={idx}
                                          disabled={!isCurrentMonth}
                                          onClick={() => dayAttendance && setSelectedAttendanceRecord(dayAttendance)}
                                          className={`relative h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${statusColor} ${!isCurrentMonth ? 'opacity-20 cursor-default' : 'hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm'}`}
                                       >
                                          <span className="text-xs font-black">{format(day, 'd')}</span>
                                          {dayLeave && <p className="text-[7px] font-bold uppercase mt-1">Leave</p>}
                                          {dayAttendance?.isLate && <p className="text-[7px] font-bold uppercase mt-1">Late</p>}
                                          {dayAttendance && (
                                             <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                          )}
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>

                           {/* Daily Context Summary */}
                           {!attendanceHistoryPersonnelId && (
                              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-center">
                                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Global Health Monitor</p>
                                 <p className="text-xs font-black text-blue-900 uppercase">Archive contains logs across {fullPersonnelList.filter(p => p.type === 'DRIVER').length} authorized fleet units</p>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )}

                {showLeaveRequestModal && (
                   <div className="space-y-6">
                      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm w-full">
                         <button 
                            onClick={() => setLeaveMode('LEAVE')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${leaveMode === 'LEAVE' ? 'bg-amber-600 text-white shadow-lg shadow-amber-200' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            <PlaneTakeoff size={14} /> Leave Application
                         </button>
                         <button 
                            onClick={() => setLeaveMode('DUTY')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${leaveMode === 'DUTY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            <Zap size={14} /> On-Duty Assignment
                         </button>
                      </div>

                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <h5 className="text-xs font-black text-slate-900 uppercase">
                                  {leaveMode === 'LEAVE' ? 'Personal Leave Balance Monitor' : 'Operational Deployment Monitor'}
                               </h5>
                               {leaveMode === 'LEAVE' && leavePersonnelId && (
                                  <button 
                                     onClick={() => setIsEditingBalance(!isEditingBalance)}
                                     className={`p-1.5 rounded-lg transition-all ${isEditingBalance ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600'}`}
                                     title="Edit Balances"
                                  >
                                     <Settings2 size={12} />
                                  </button>
                               )}
                            </div>
                            <div className="flex items-center gap-3">
                               {leaveMode === 'LEAVE' && leavePersonnelId && (
                                  <button 
                                     onClick={() => {
                                        if (window.confirm('Reset leave balances to company defaults for this year?')) {
                                           setPersonnelQuotas(prev => {
                                              const next = { ...prev };
                                              delete next[leavePersonnelId];
                                              return next;
                                           });
                                        }
                                     }}
                                     className="text-[9px] font-black text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-widest"
                                  >
                                     <History size={10} /> Refresh per year
                                  </button>
                               )}
                               <span className="text-[10px] font-black text-blue-600 flex items-center gap-1">
                                  <AlertCircle size={12} /> {leaveMode === 'LEAVE' ? 'Yearly Quota' : 'Real-time Deployment'}
                               </span>
                            </div>
                         </div>
                         {leaveMode === 'LEAVE' ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                               {[
                                  { label: 'Paid', type: 'PAID', icon: Award, color: 'emerald' },
                                  { label: 'Emergency', type: 'EMERGENCY', icon: ShieldAlert, color: 'rose' },
                                  { label: 'Marriage', type: 'MARRIAGE', icon: Heart, color: 'pink' },
                                  { label: 'Sick', type: 'SICK', icon: Activity, color: 'blue' },
                                  { label: 'Casual', type: 'CASUAL', icon: Coffee, color: 'amber' },
                                  { label: 'Unpaid', type: 'UNPAID', icon: Moon, color: 'indigo' },
                                  { label: 'Other', type: 'OTHER', icon: PlusCircle, color: 'slate' }
                               ].map((b, i) => {
                                  const pQuotas = leavePersonnelId ? (personnelQuotas[leavePersonnelId] || leaveQuotas) : leaveQuotas;
                                  const limit = pQuotas[b.type] || leaveQuotas[b.type] || 0;
                                  
                                  const taken = leavePersonnelId ? leaves
                                     .filter(l => l.entityId === leavePersonnelId && l.type === b.type && l.status === LeaveStatus.APPROVED)
                                     .reduce((acc, curr) => {
                                        const start = new Date(curr.startDate);
                                        const end = new Date(curr.endDate);
                                        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                        return acc + diff;
                                     }, 0) : 0;
                                  
                                  const remaining = b.type === 'UNPAID' ? '∞' : Math.max(0, limit - taken);

                                  const Icon = (b as any).icon;
                                  return (
                                     <div key={i} className={`bg-white p-4 rounded-3xl border transition-all ${leavePersonnelId ? 'border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02]' : 'opacity-40 grayscale blur-[1px]'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                           <div className={`w-6 h-6 rounded-lg bg-${(b as any).color}-50 flex items-center justify-center text-${(b as any).color}-600`}>
                                              <Icon size={12} />
                                           </div>
                                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{b.label}</p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                           {isEditingBalance && leavePersonnelId ? (
                                              <div className="relative">
                                                 <input 
                                                    type="number"
                                                    value={limit}
                                                    onChange={(e) => {
                                                       const val = parseInt(e.target.value);
                                                       setPersonnelQuotas(prev => ({
                                                          ...prev,
                                                          [leavePersonnelId]: {
                                                             ...(prev[leavePersonnelId] || leaveQuotas),
                                                             [b.type]: isNaN(val) ? 0 : val
                                                          }
                                                       }));
                                                    }}
                                                    className="w-full bg-slate-50 border-2 border-amber-100 rounded-xl text-center font-mono font-black text-xs p-1.5 text-amber-600 outline-none focus:border-amber-400"
                                                 />
                                                 <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[6px] font-black px-1 rounded-full">EDIT</span>
                                              </div>
                                           ) : (
                                              <div className="flex items-baseline justify-center gap-1">
                                                 <p className="text-xl font-mono font-black text-slate-900 leading-none tracking-tighter">
                                                    {remaining}
                                                 </p>
                                                 {b.type !== 'UNPAID' && (
                                                    <p className="text-[10px] text-slate-300 font-bold tracking-tight">/{limit}D</p>
                                                 )}
                                              </div>
                                           )}
                                           {taken > 0 && (
                                              <div className="flex items-center justify-center gap-1 mt-1 bg-slate-50 py-0.5 rounded-lg border border-slate-100">
                                                 <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                 <span className="text-[7px] font-black text-amber-600 uppercase tracking-tighter">Spent: {taken}D</span>
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         ) : (
                            <div className="grid grid-cols-3 gap-4">
                               {[
                                  { label: 'Active Fleet', val: '92%', limit: '90%' },
                                  { label: 'Standby', val: '8', limit: '10' },
                                  { label: 'Relief', val: '4', limit: '5' }
                               ].map((b, i) => (
                                  <div key={i} className="bg-white p-3 rounded-2xl shadow-sm text-center">
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{b.label}</p>
                                     <p className="text-lg font-black text-slate-900 leading-none">{b.val}<span className="text-[10px] text-slate-300 font-bold">/{b.limit}</span></p>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Request Category*</label>
                            <select
                               value={leaveCategory}
                               onChange={(e) => { setLeaveCategory(e.target.value); clearField('leaveCategory'); }}
                               className={`w-full px-5 py-3 border-2 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-tight ${fe['leaveCategory'] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                            >
                               <option value="">{leaveMode === 'LEAVE' ? 'Select Leave Category' : 'Select Duty Type'}</option>
                               {(leaveMode === 'LEAVE' 
                                  ? ['Paid Leave', 'Emergency Leave', 'Marriage Leave', 'Sick Leave', 'Casual Leave', 'Unpaid Leave', 'Other Leave'] 
                                  : ['Field Assignment', 'Client Delivery', 'Vehicle Maintenance', 'Secondary Ops']
                               ).map((o, j) => <option key={j}>{o}</option>)}
                            </select>
                            {fe['leaveCategory'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['leaveCategory']}</p>}
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Reference*</label>
                            <div className="space-y-3">
                               <div className="relative">
                                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input
                                     id="personnel-search-input"
                                     type="text"
                                     placeholder="Search by Name, Role or Tracking ID..."
                                     value={personnelSearch}
                                     onChange={(e) => setPersonnelSearch(e.target.value)}
                                     className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none border-dashed"
                                  />
                               </div>
                               <select
                                  id="personnel-select"
                                  value={leavePersonnelId}
                                  onChange={(e) => { setLeavePersonnelId(e.target.value); clearField('leavePersonnelId'); }}
                                  className={`w-full px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer border ${fe['leavePersonnelId'] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                               >
                              <option value="">{personnelSearch ? `Search Results (${fullPersonnelList.filter(p => 
                                 p.fullName.toLowerCase().includes(personnelSearch.toLowerCase()) || 
                                 (p as any).designation?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
                                 p.id.toLowerCase().includes(personnelSearch.toLowerCase()) ||
                                 ((p as any).trackingId && (p as any).trackingId.toLowerCase().includes(personnelSearch.toLowerCase()))
                              ).length})` : 'Select Personnel Reference'}</option>
                              {fullPersonnelList
                                .filter(p => !personnelSearch || 
                                   p.fullName.toLowerCase().includes(personnelSearch.toLowerCase()) || 
                                   (p as any).designation?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
                                   p.id.toLowerCase().includes(personnelSearch.toLowerCase()) ||
                                   ((p as any).trackingId && (p as any).trackingId.toLowerCase().includes(personnelSearch.toLowerCase()))
                                )
                                .map(p => (
                                   <option key={p.id} value={p.id}>
                                      {p.fullName} — {(p as any).designation} {(p as any).trackingId ? `(ID: ${(p as any).trackingId})` : `[${p.id}]`}
                                   </option>
                                ))}
                               </select>
                               {fe['leavePersonnelId'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['leavePersonnelId']}</p>}
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date*</label>
                               <input
                                  type="date"
                                  value={leaveStartDate}
                                  onChange={(e) => { setLeaveStartDate(e.target.value); clearField('leaveStartDate'); }}
                                  className={`w-full px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all border ${fe['leaveStartDate'] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                               />
                               {fe['leaveStartDate'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['leaveStartDate']}</p>}
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date*</label>
                               <input
                                  type="date"
                                  value={leaveEndDate}
                                  onChange={(e) => { setLeaveEndDate(e.target.value); clearField('leaveEndDate'); }}
                                  className={`w-full px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all border ${fe['leaveEndDate'] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                               />
                               {fe['leaveEndDate'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['leaveEndDate']}</p>}
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Justification*</label>
                            <textarea
                               value={leaveReason}
                               onChange={(e) => { setLeaveReason(e.target.value); clearField('leaveReason'); }}
                               className={`w-full px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all h-24 resize-none border ${fe['leaveReason'] ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}
                               placeholder={leaveMode === 'LEAVE' ? 'Reason for absence...' : 'Objective of the assignment...'}
                            />
                            {fe['leaveReason'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['leaveReason']}</p>}
                         </div>
                         <button 
                            onClick={handleSubmitLeave}
                            className={`w-full py-4 mt-4 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${leaveMode === 'LEAVE' ? 'bg-amber-600 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}
                         >
                            {leaveMode === 'LEAVE' ? 'Submit Leave Request' : 'Commit Duty Allocation'}
                         </button>
                      </div>


                   </div>
                )}

               {showPerformanceLogger && (() => {
                  const latest = performance.filter(m => m.entityId === selectedPersonnel?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                  return (
                  <div className="space-y-8 text-center py-4">
                     <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 mx-auto mb-2 animate-bounce">
                        <Trophy size={40} />
                     </div>
                     <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Log Productivity Milestone</h4>
                     <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">Update workforce operational scores based on real-time field data and client feedback cycles.</p>
                     
                     <div className="space-y-8 pt-4">
                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <div className="flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Operational Efficiency</span>
                                 {latest?.operationalEfficiency !== undefined && (
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prev: {latest.operationalEfficiency}%</span>
                                 )}
                              </div>
                              <span className="text-2xl font-black text-blue-600">{logEfficiency}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0"
                              max="100"
                              value={logEfficiency}
                              onChange={(e) => setLogEfficiency(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                           />
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <div className="flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Safety Compliance</span>
                                 {latest?.safetyCompliance !== undefined && (
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prev: {latest.safetyCompliance}%</span>
                                 )}
                              </div>
                              <span className="text-2xl font-black text-emerald-600">{logSafety}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0"
                              max="100"
                              value={logSafety}
                              onChange={(e) => setLogSafety(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                           />
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <div className="flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Load Cycle Timing</span>
                                 {latest?.loadCycleTiming !== undefined && (
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prev: {latest.loadCycleTiming}%</span>
                                 )}
                              </div>
                              <span className="text-2xl font-black text-amber-600">{logTiming}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0"
                              max="100"
                              value={logTiming}
                              onChange={(e) => setLogTiming(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600" 
                           />
                        </div>

                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <div className="flex flex-col items-start">
                                 <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Service Rating</span>
                                 {latest?.serviceRating !== undefined && (
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prev: {latest.serviceRating} Stars</span>
                                 )}
                              </div>
                              <div className="flex gap-2">
                                 {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                       key={star}
                                       onClick={() => setLogRating(star)}
                                       className="transition-all active:scale-90"
                                    >
                                       <Star size={24} className={star <= logRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-4 mt-4">
                        <button 
                           onClick={() => {
                              setLogEfficiency(Math.min(100, Math.round((latest?.operationalEfficiency || 85) + 5)));
                              setLogSafety(Math.min(100, Math.round((latest?.safetyCompliance || 95) + 2)));
                              setLogTiming(Math.min(100, Math.round((latest?.loadCycleTiming || 90) + 3)));
                              setLogRating(5);
                              alert('Metrics optimized from previous session benchmarks');
                           }}
                           className="flex-1 py-3 px-4 border-2 border-emerald-100 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
                        >
                           <Zap size={14} className="fill-emerald-500" />
                           Optimize AI
                        </button>
                        <button 
                           onClick={handleCommitPerformance}
                           className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all"
                        >
                           Commit Updates
                        </button>
                     </div>
                  </div>
                  );
               })()}

               {showMetricsDetail && selectedPersonnel && (() => {
                  const metrics = performance.filter(m => m.entityId === selectedPersonnel.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const latest = metrics[0];
                  return (
                  <div className="space-y-8">
                     <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-[2rem] text-white">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black">
                           {selectedPersonnel.fullName[0]}
                        </div>
                        <div>
                           <h4 className="text-xl font-black uppercase tracking-tight">{selectedPersonnel.fullName}</h4>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-xs font-black text-blue-400 uppercase tracking-widest">{selectedPersonnel.type === 'DRIVER' ? 'Fleet Driver' : selectedPersonnel.designation}</p>
                               <span className="w-1 h-1 bg-white/20 rounded-full" />
                               <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tracking ID: {selectedPersonnel.trackingId || selectedPersonnel.id.split('-').pop()}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-white/60">
                               <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                  <Phone size={12} className="text-blue-500" /> {selectedPersonnel.phoneNumber || 'N/A'}
                               </div>
                               <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                  <MessageCircle size={12} className="text-emerald-500" /> {selectedPersonnel.whatsappNumber || 'N/A'}
                               </div>
                               <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                  <MapPin size={12} className="text-orange-500" /> {selectedPersonnel.address || 'N/A'}
                               </div>
                            </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {[
                           { label: 'Operational Efficiency', val: `${latest?.operationalEfficiency || '85'}%`, prev: metrics[1]?.operationalEfficiency, icon: Zap, color: 'blue' },
                           { label: 'Safety Compliance', val: `${latest?.safetyCompliance || '100'}%`, prev: metrics[1]?.safetyCompliance, icon: ShieldAlert, color: 'emerald' },
                           { label: 'Load Cycle Timing', val: `${latest?.loadCycleTiming || '90'}%`, prev: metrics[1]?.loadCycleTiming, icon: Timer, color: 'amber' },
                           { label: 'Service Rating', val: `${latest?.serviceRating || '5.0'}/5`, prev: metrics[1]?.serviceRating, icon: Star, color: 'indigo' }
                        ].map((m, i) => (
                           <div key={i} className="p-6 border-2 border-slate-100 rounded-3xl group hover:border-blue-200 transition-all flex flex-col justify-between">
                              <div>
                                 <div className={`w-10 h-10 rounded-xl bg-${m.color}-50 flex items-center justify-center text-${m.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                                    <m.icon size={24} />
                                 </div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                                 <p className="text-2xl font-black text-slate-900 leading-none">{m.val}</p>
                              </div>
                              {m.prev !== undefined && (
                                 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Prev Record:</span>
                                    <span className="text-[10px] font-black text-slate-500">{m.prev}{m.label.includes('Rating') ? '' : '%'}</span>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Historical Efficiency Curve</h5>
                        <div className="flex items-end gap-2 h-32">
                           {[40, 60, 55, 80, 95, 85, 90].map((h, i) => (
                              <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group overflow-hidden">
                                 <div className="absolute bottom-0 left-0 right-0 bg-blue-600 transition-all duration-1000 group-hover:bg-blue-500" style={{ height: `${h}%` }}>
                                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{h}%</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                           <span>Mon</span>
                           <span>Sun</span>
                        </div>
                     </div>

                     {/* Historical Work Activity Logs */}
                     <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-2">
                              <History size={18} className="text-blue-600" />
                              <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Historical Work Repository</h5>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-blue-300 transition-colors">
                                 <Calendar size={12} className="text-slate-400" />
                                 <input 
                                    type="date" 
                                    value={workHistoryStartDate}
                                    onChange={(e) => setWorkHistoryStartDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[8px] font-black uppercase text-slate-900 w-24" 
                                 />
                                 <span className="text-[8px] font-black text-slate-400">TO</span>
                                 <input 
                                    type="date" 
                                    value={workHistoryEndDate}
                                    onChange={(e) => setWorkHistoryEndDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[8px] font-black uppercase text-slate-900 w-24" 
                                 />
                              </div>
                              <button 
                                 onClick={() => { setWorkHistoryStartDate(''); setWorkHistoryEndDate(''); }}
                                 className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                 title="Clear Filters"
                              >
                                 <XCircle size={16} />
                              </button>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {WORK_HISTORIES
                              .filter(vh => vh.entityId === selectedPersonnel.id)
                              .filter(vh => {
                                 if (!workHistoryStartDate || !workHistoryEndDate) return true;
                                 const itemDate = new Date(vh.date);
                                 return itemDate >= new Date(workHistoryStartDate) && itemDate <= new Date(workHistoryEndDate);
                              })
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map((vh, idx) => (
                                 <div key={vh.id} className="relative pl-8 before:absolute before:left-[11px] before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:hidden">
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${vh.status === 'Completed' ? 'bg-emerald-500' : vh.status === 'In Progress' ? 'bg-blue-500' : 'bg-rose-500'}`}>
                                       {vh.status === 'Completed' ? <CheckCircle size={10} className="text-white" /> : vh.status === 'In Progress' ? <Clock size={10} className="text-white" /> : <ShieldAlert size={10} className="text-white" />}
                                    </div>
                                    <div className="bg-white border-2 border-slate-50 p-5 rounded-[2rem] hover:border-blue-200 hover:shadow-xl transition-all group">
                                       <div className="flex items-center justify-between mb-4">
                                          <div>
                                             <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.15em] mb-1">{format(new Date(vh.date), 'EEEE, MMM dd, yyyy')}</p>
                                             <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 bg-slate-900 text-white rounded text-[7px] font-black uppercase tracking-widest">{vh.truckId}</div>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span className={`text-[7px] font-black uppercase tracking-widest ${vh.status === 'Completed' ? 'text-emerald-500' : 'text-blue-500'}`}>{vh.status}</span>
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-sm font-black text-slate-900 leading-none">{vh.hoursSpent}h</p>
                                             <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Duration</p>
                                          </div>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-100 transition-all">
                                             <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                   <MapPin size={10} />
                                                </div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Origin Site</p>
                                             </div>
                                             <p className="text-[9px] font-black text-slate-900 uppercase truncate">{vh.pickupSite}</p>
                                          </div>
                                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all">
                                             <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                   <UserCheck size={10} />
                                                </div>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Consignee/End User</p>
                                             </div>
                                             <p className="text-[9px] font-black text-slate-900 uppercase truncate">{vh.deliveryClient}</p>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           }
                           {WORK_HISTORIES.filter(vh => vh.entityId === selectedPersonnel.id).length === 0 && (
                              <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center bg-slate-50/50">
                                 <History size={40} className="mx-auto text-slate-200 mb-4 opacity-30" />
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No historical work logged for this agent</p>
                                 <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 italic">Activity archives will populate upon duty completion</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                 );
               })()}

               {showPerformanceHistory && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase">Organizational Performance Timeline</h4>
                        <div className="flex gap-2">
                           <button className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase">Weekly</button>
                           <button className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase">Monthly</button>
                        </div>
                     </div>
                     <div className="space-y-4">
                        {[
                           { event: 'Safety Benchmark Surpassed', personnel: 'All Personnel', date: 'Yesterday' },
                           { event: 'Top Efficiency Score Logged', personnel: 'John Smith', date: '2 days ago' },
                           { event: 'New Skill Certification', personnel: 'Robert Driver', date: 'May 08' },
                           { event: 'Route Optimization Peak', personnel: 'Logistics Team', date: 'May 05' }
                        ].map((item, i) => (
                           <div key={i} className="flex gap-4 items-start border-l-2 border-blue-100 pl-6 pb-6 relative last:pb-0">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.date}</p>
                                 <p className="text-sm font-black text-slate-900">{item.event}</p>
                                 <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase italic opacity-70">Impact: High • {item.personnel}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {showFilterModal && (
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Metric Thresholds</h5>
                           {[
                              { label: 'Minimum Efficiency', val: 70 },
                              { label: 'Maximum Incidents', val: 2 },
                              { label: 'Min Service Years', val: 1 }
                           ].map((f, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between text-[9px] font-black uppercase tracking-tight">
                                    <span>{f.label}</span>
                                    <span>{f.val}</span>
                                 </div>
                                 <input type="range" className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900" />
                              </div>
                           ))}
                        </div>
                        <div className="space-y-4">
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Attribute Tags</h5>
                           <div className="flex flex-wrap gap-2">
                              {['Top Rated', 'Verified', 'Compliance Ready', 'Night Shift', 'Overtime Eligibility', 'Elite Status', 'CDL Certified'].map((tag, i) => (
                                 <button key={i} className="px-3 py-1.5 border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white transition-all">
                                    {tag}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Apply Intelligence Filter</button>
                        <button className="px-6 py-3 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50">Reset</button>
                     </div>
                  </div>
               )}

               {showCalendar && (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4">
                           <button 
                              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                           >
                              <ChevronRight className="rotate-180" size={18} />
                           </button>
                           <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight min-w-[200px] text-center">
                              {format(calendarDate, 'MMMM yyyy')}
                           </h4>
                           <button 
                              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                           >
                              <ChevronRight size={18} />
                           </button>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compulsory</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Celebration</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-7 gap-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                           <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">{d}</div>
                        ))}
                        {getCalendarDays(calendarDate).map((day, idx) => {
                           const isCurrentMonth = isSameMonth(day, calendarDate);
                           const holiday = INDIAN_HOLIDAYS.find(h => isSameDay(new Date(h.date), day));
                           const isToday = isSameDay(day, new Date());
                           
                           return (
                              <div 
                                 key={idx} 
                                 className={`min-h-[100px] border-2 rounded-[1.5rem] p-3 flex flex-col transition-all relative group ${
                                    !isCurrentMonth ? 'bg-slate-50/20 border-transparent opacity-20' : 
                                    isToday ? 'border-blue-500 bg-blue-50/30' : 
                                    holiday ? (holiday.type === 'Compulsory' ? 'border-rose-100 bg-rose-50/30' : 'border-blue-100 bg-blue-50/30') :
                                    'border-slate-50 bg-white shadow-sm'
                                 }`}
                              >
                                 <span className={`text-xs font-black mb-2 ${
                                    isToday ? 'text-blue-600' : 
                                    holiday ? (holiday.type === 'Compulsory' ? 'text-rose-600' : 'text-blue-600') : 
                                    'text-slate-400'
                                 }`}>
                                    {format(day, 'd')}
                                 </span>
                                 
                                 {holiday && (
                                    <div className={`mt-auto p-1.5 rounded-lg border flex flex-col gap-0.5 ${
                                       holiday.type === 'Compulsory' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                                    }`}>
                                       <p className="text-[7px] font-black uppercase leading-tight line-clamp-2">
                                          {holiday.name}
                                       </p>
                                       <p className="text-[6px] font-bold uppercase opacity-60 tracking-tighter">
                                          {holiday.type}
                                       </p>
                                    </div>
                                 )}

                                 {isToday && (
                                    <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                 )}
                              </div>
                           );
                        })}
                     </div>

                     <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-6 opacity-10">
                           <ShieldCheck size={80} />
                        </div>
                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Calendar Protocol</h5>
                        <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-2xl">
                           This calendar highlights all national, religious, and gazetted holidays observed across the Indian subcontinent. Compulsory holidays are subject to mandatory operational downtime for the fleet.
                        </p>
                     </div>
                  </div>
               )}
            </div>
            
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  <ShieldAlert size={12} className="text-blue-600" /> Advanced Workforce Intelligence System Interface
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagementView;
