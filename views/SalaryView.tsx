
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Users, 
  IndianRupee, 
  Calendar, 
  CreditCard,
  Banknote,
  ArrowUpRight,
  UserCheck,
  Zap,
  CheckCircle2,
  Edit,
  MinusCircle,
  Briefcase,
  History,
  Info,
  Printer,
  Download,
  Share2,
  FileText,
  ExternalLink,
  Phone,
  MessageCircle,
  ShieldCheck,
  // Added missing Clock import from lucide-react
  Clock
} from 'lucide-react';
import { Driver, DriverSalary, AppSettings, Bank } from '../types';
import html2pdf from 'html2pdf.js';
import { sendSalarySlipWhatsApp } from '../services/notificationService';

interface SalaryViewProps {
  drivers: Driver[];
  salaries: DriverSalary[];
  settings: AppSettings;
  banks?: Bank[];
  onAddSalary: (salary: DriverSalary) => void;
  onUpdateSalary: (salary: DriverSalary) => void;
  onDeleteSalary: (id: string) => void;
}

const SalaryView: React.FC<SalaryViewProps> = ({ drivers, salaries, settings, banks = [], onAddSalary, onUpdateSalary, onDeleteSalary }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<DriverSalary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const slipRef = useRef<HTMLDivElement>(null);

  const combinedBanks = useMemo(() => {
    const list: { id: string; bankName: string; accountNumber?: string }[] = [];
    (banks || []).forEach(b => {
      list.push({ id: b.id, bankName: b.bankName, accountNumber: b.accountNumber });
    });
    const settingsBanks = settings?.bankDetails || [];
    settingsBanks.forEach(sb => {
      if (!list.some(item => item.id === sb.id)) {
        list.push({ id: sb.id || `settings-${sb.accountNo}`, bankName: sb.bankName, accountNumber: sb.accountNo });
      }
    });
    return list;
  }, [banks, settings]);

  const initialForm: Partial<DriverSalary> = {
    driverId: '',
    driverName: '',
    month: 'February 2026',
    salaryType: 'PER_MONTH',
    baseRate: 15000,
    presentDays: 30,
    bonus: 0,
    deductions: 0,
    advanceAdjusted: 0,
    totalAmount: 15000,
    dateGiven: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI',
    referenceNo: '',
    notes: '',
    bankId: '',
    bankName: ''
  };

  const [formData, setFormData] = useState<Partial<DriverSalary>>(initialForm);

  useEffect(() => {
    let base = 0;
    if (formData.salaryType === 'PER_DAY') {
      base = (formData.baseRate || 0) * (formData.presentDays || 0);
    } else {
      base = (formData.baseRate || 0);
    }
    const total = base + (formData.bonus || 0) - (formData.deductions || 0) - (formData.advanceAdjusted || 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.salaryType, formData.baseRate, formData.presentDays, formData.bonus, formData.deductions, formData.advanceAdjusted]);

  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
                           s.driverName.toLowerCase().includes(q) || 
                           (s.referenceNo || "").toLowerCase().includes(q);
      const matchesMonth = monthFilter === 'ALL' || s.month === monthFilter;
      
      const date = s.dateGiven ? new Date(s.dateGiven) : null;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      
      const matchesDate = (!start || (date && date >= start)) && (!end || (date && date <= end));
      
      return matchesSearch && matchesMonth && matchesDate;
    });
  }, [salaries, searchQuery, monthFilter, startDate, endDate]);

  const uniqueMonths = useMemo(() => {
    const months = salaries.map(s => s.month);
    return ['ALL', ...Array.from(new Set(months))];
  }, [salaries]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (salary: DriverSalary) => {
    setEditingId(salary.id);
    setFormData(salary);
    setIsModalOpen(true);
  };

  const handleOpenSlip = (salary: DriverSalary) => {
    setSelectedSlip(salary);
    setIsSlipOpen(true);
  };

  const handleDriverChange = (driverId: string) => {
    const driver = (drivers || []).find(d => d.id === driverId);
    if (driver) {
      setFormData(prev => ({ ...prev, driverId, driverName: driver.name }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!slipRef.current) return;
    
    const element = slipRef.current;
    const opt = {
      margin: 1,
      filename: `Salary_Slip_${selectedSlip?.driverName || 'Driver'}_${selectedSlip?.month || 'Month'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleWhatsAppShare = (salary: DriverSalary) => {
    const driver = drivers.find(d => d.id === salary.driverId);
    const phone = driver?.whatsappNumber || driver?.phoneNumber || '';
    
    if (!phone) {
      alert("No contact number found for this driver.");
      return;
    }

    const message = `Hello ${salary.driverName},\n\nYour salary voucher for ${salary.month} has been generated.\n\nTotal Amount: ₹${salary.totalAmount.toLocaleString()}\nRef No: ${salary.referenceNo}\nDate: ${salary.dateGiven}\n\nPlease check your bank account or contact office for details.\n\nRegards,\n${settings.companyName || 'Management'}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${(phone || "").replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId) {
      alert("Please select a driver.");
      return;
    }

    if (editingId) {
      onUpdateSalary({ ...formData, id: editingId } as DriverSalary);
    } else {
      const newSalary: DriverSalary = {
        ...formData as DriverSalary,
        id: `SAL-${Date.now()}`,
        referenceNo: formData.referenceNo || `REF-${Math.floor(Math.random() * 100000)}`
      };
      onAddSalary(newSalary);
    }
    
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  return (
    <div className="page-stack pb-10">
      {/* Print styles specifically for the slip */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-slip, #printable-slip * { visibility: visible; }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Driver Payroll</h2>
          <p className="text-slate-500 text-sm font-medium">Manage monthly disbursements and digital vouchers.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={20} />
          New Disbursement
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Driver Name, Ref No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E7E5E0] rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all font-bold"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="t-label px-1">Period (Month)</label>
              <select 
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              >
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="t-label px-1">From Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="t-label px-1">To Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E5E0] rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E7E5E0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F4F0]/50 border-b border-slate-100 whitespace-nowrap">
                <th className="px-6 py-4 t-label">Driver</th>
                <th className="px-6 py-4 t-label">Salary Type</th>
                <th className="px-6 py-4 t-label">Salary (Monthly/Daily)</th>
                <th className="px-6 py-4 t-label">Monthly Base/Daily Rate</th>
                <th className="px-6 py-4 t-label">Date Given</th>
                <th className="px-6 py-4 t-label text-center">Bonus</th>
                <th className="px-6 py-4 t-label text-center">Deductions</th>
                <th className="px-6 py-4 t-label text-center">Advance Adj.</th>
                <th className="px-6 py-4 t-label text-center">Payment Mode</th>
                <th className="px-6 py-4 t-label">Ref No</th>
                <th className="px-6 py-4 t-label text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSalaries.map((s) => (
                <tr key={s.id} className="hover:bg-[#F5F4F0]/50 transition-colors group whitespace-nowrap">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                        {s.driverName.charAt(0)}
                      </div>
                      <p className="text-sm font-black text-slate-900">{s.driverName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${s.salaryType === 'PER_DAY' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {s.salaryType === 'PER_DAY' ? 'Daily Wage' : 'Monthly'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{s.month}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-slate-900">
                      ₹{s.baseRate?.toLocaleString()}
                      {s.salaryType === 'PER_DAY' && <span className="text-[10px] text-slate-400 font-bold ml-1">× {s.presentDays}d</span>}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">{s.dateGiven}</td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-xs font-black text-emerald-600">₹{s.bonus?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-xs font-black text-rose-600">₹{s.deductions?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-xs font-black text-amber-600">₹{s.advanceAdjusted?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">{s.paymentMode}</span>
                  </td>
                  <td className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-tighter">{s.referenceNo}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenSlip(s)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Slip">
                        <FileText size={18}/>
                      </button>
                      <button onClick={() => handleOpenEdit(s)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                        <Edit size={18}/>
                      </button>
                      <button onClick={() => onDeleteSalary(s.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip / Voucher Modal */}
      {isSlipOpen && selectedSlip && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50 no-print">
               <div>
                  <h3 className="text-xl font-black text-slate-900">Salary Voucher</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Ref: {selectedSlip.referenceNo}</p>
               </div>
               <button onClick={() => setIsSlipOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-[#F5F4F0] no-print">
                <div id="printable-slip" ref={slipRef} className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 mx-auto max-w-md print:shadow-none print:border-none print:p-0">
                  <div className="flex items-center justify-between mb-8">
                     {settings.companyLogo ? (
                       <img src={settings.companyLogo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100 rotate-3">FA</div>
                     )}
                     <div className="text-right">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{settings.companyName || 'FlyAsh Pro'}</h4>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{settings.companyServices?.[0] || 'Logistics Solutions'}</p>
                     </div>
                  </div>

                  <div className="border-b border-slate-100 pb-6 mb-6">
                     <p className="t-label mb-2">Salary Disbursement For</p>
                     <h2 className="text-2xl font-black text-[#1C1917] tracking-tight">{selectedSlip.month}</h2>
                     <div className="flex items-center gap-2 mt-2">
                        <UserCheck size={14} className="text-slate-400" />
                        <span className="text-sm font-black text-slate-700">{selectedSlip.driverName}</span>
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Base Pay ({selectedSlip.salaryType === 'PER_DAY' ? `${selectedSlip.presentDays} Days` : 'Monthly'})</span>
                        <span className="text-slate-900 font-black">₹{selectedSlip.salaryType === 'PER_DAY' ? ((selectedSlip.baseRate * selectedSlip.presentDays) || 0).toLocaleString() : (selectedSlip.baseRate || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 font-bold">Performance Bonus</span>
                        <span className="text-green-600 font-black">+ ₹{(selectedSlip.bonus || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-red-500 font-bold">Deductions / Fines</span>
                        <span className="text-red-500 font-black">- ₹{(selectedSlip.deductions || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-amber-600 font-bold">Advance Adjusted</span>
                        <span className="text-amber-600 font-black">- ₹{(selectedSlip.advanceAdjusted || 0).toLocaleString()}</span>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-xl mb-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><IndianRupee size={60}/></div>
                     <div className="relative z-10">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                        <p className="text-2xl font-black mt-1">₹{(selectedSlip.totalAmount || 0).toLocaleString()}</p>
                     </div>
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative z-10">
                        <CheckCircle2 size={24} className="text-green-400" />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                     <div>
                        <p>Date: {selectedSlip.dateGiven}</p>
                        <p>Ref: {selectedSlip.referenceNo}</p>
                     </div>
                     <div className="text-right">
                        <p>Mode: {selectedSlip.paymentMode}</p>
                        <p>Status: Success</p>
                     </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                     <ShieldCheck size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">System Verified Disbursement</span>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 grid grid-cols-3 gap-4 no-print">
               <button onClick={handlePrint} className="flex flex-col items-center gap-2 p-4 bg-[#F5F4F0] border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500 group-hover:text-blue-600 transition-colors"><Printer size={20}/></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Print Slip</span>
               </button>
               <button onClick={handleDownload} className="flex flex-col items-center gap-2 p-4 bg-[#F5F4F0] border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all group">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500 group-hover:text-blue-600 transition-colors"><Download size={20}/></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Download</span>
               </button>
               <button 
                  onClick={() => handleWhatsAppShare(selectedSlip)}
                  disabled={isSharing}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 transition-all group"
               >
                  <div className="p-3 bg-white rounded-xl shadow-sm text-green-600 group-hover:scale-110 transition-transform">
                    {isSharing ? <Clock size={20} className="animate-pulse"/> : <MessageCircle size={20}/>}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Send WhatsApp</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add/Edit Disbursement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <div>
                <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingId ? 'Edit Disbursement' : 'New Disbursement'}</h3>
                <p className="text-sm text-slate-500 font-medium italic">Configure mapping and calculations.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select Driver*</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900" 
                    value={formData.driverId ?? ""} 
                    onChange={e => handleDriverChange(e.target.value)}
                    required
                  >
                    <option value="">Choose driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Salary Type*</label>
                  <select className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold"
                    value={formData.salaryType ?? "PER_MONTH"} onChange={e => setFormData({...formData, salaryType: e.target.value as any})} required>
                    <option value="PER_MONTH">Monthly Salary</option>
                    <option value="PER_DAY">Daily Wage (Attendance)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Salary Month*</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold"
                    value={formData.month ?? ""} onChange={e => setFormData({...formData, month: e.target.value})} placeholder="e.g. February 2026" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Date Given*</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold"
                    value={formData.dateGiven ?? ""} onChange={e => setFormData({...formData, dateGiven: e.target.value})} required />
                </div>
              </div>

              <div className="p-6 bg-[#F5F4F0] rounded-2xl border border-slate-100 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                      {(formData.salaryType || "PER_MONTH") === 'PER_DAY' ? 'Daily Rate (₹)' : 'Monthly Base (₹)'}
                    </label>
                    <input type="number" className="w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none font-black text-slate-900" 
                      value={formData.baseRate ?? 0} onChange={e => setFormData({...formData, baseRate: Number(e.target.value)})} />
                  </div>
                  {(formData.salaryType || "PER_MONTH") === 'PER_DAY' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Present Days</label>
                      <input type="number" className="w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl outline-none font-black text-slate-900" 
                        value={formData.presentDays ?? 0} onChange={e => setFormData({...formData, presentDays: Number(e.target.value)})} />
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-green-600 uppercase tracking-widest px-1">Bonus</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-green-100 rounded-xl outline-none font-bold" 
                    value={formData.bonus ?? 0} onChange={e => setFormData({...formData, bonus: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-red-600 uppercase tracking-widest px-1">Deductions</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-red-100 rounded-xl outline-none font-bold" 
                    value={formData.deductions ?? 0} onChange={e => setFormData({...formData, deductions: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1">Advance Adj.</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-amber-100 rounded-xl outline-none font-bold" 
                    value={formData.advanceAdjusted ?? 0} onChange={e => setFormData({...formData, advanceAdjusted: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Payment Mode*</label>
                  <select className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                    value={formData.paymentMode ?? "UPI"} 
                    onChange={e => setFormData({...formData, paymentMode: e.target.value})}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank(NEFT,RTGS,Instant)</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Ref No</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                    value={formData.referenceNo ?? ""} onChange={e => setFormData({...formData, referenceNo: e.target.value})} placeholder="Txn ID" />
                </div>
              </div>

              {formData.paymentMode !== 'CASH' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select Bank*</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl outline-none font-bold text-slate-900"
                    value={formData.bankId ?? ""}
                    onChange={e => {
                      const selectedBank = combinedBanks.find(b => b.id === e.target.value);
                      setFormData({
                        ...formData,
                        bankId: e.target.value,
                        bankName: selectedBank ? selectedBank.bankName : ""
                      });
                    }}
                    required
                  >
                    <option value="">Choose Bank...</option>
                    {combinedBanks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} {b.accountNumber ? `(${b.accountNumber.slice(-4)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-xl">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Amount</p>
                    <h4 className="text-2xl font-black mt-1">₹{(formData.totalAmount || 0).toLocaleString()}</h4>
                 </div>
                 <CheckCircle2 size={32} className="text-green-400" />
              </div>

              <div className="pt-6 flex gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-[#F5F4F0] transition-all">Discard</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <ArrowUpRight size={20} /> {editingId ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryView;
