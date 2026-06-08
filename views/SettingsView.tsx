
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Zap, 
  Truck, 
  IndianRupee, 
  Settings as SettingsIcon,
  ChevronRight,
  BellRing,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Camera,
  Globe,
  CreditCard,
  QrCode,
  User,
  Banknote,
  PlusCircle,
  Edit2,
  FileSignature
} from 'lucide-react';
import { AppSettings, BankDetail } from '../types';
import { useFormErrors } from '../hooks/useFormErrors';
import { uploadProfilePhoto } from '../services/api/auth';
import { useAuth } from '../services/auth/AuthContext';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  currentUser?: { id: string; email: string; role: string; name: string | null; profilePhoto: string | null } | null;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, currentUser }) => {
  const { errors: fe, validate, clearField, clearAll } = useFormErrors();
  const { refreshUser } = useAuth();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [newService, setNewService] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [newBank, setNewBank] = useState<Partial<BankDetail>>({
    bankName: '',
    accountNo: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: ''
  });

  const toggleDieselApproval = () => {
    onUpdateSettings({ ...settings, dieselApprovalRequired: !settings.dieselApprovalRequired });
  };

  const toggleEnforcement = () => {
    onUpdateSettings({ ...settings, limitStrictEnforcement: !settings.limitStrictEnforcement });
  };

  const handleUpdateCompany = (field: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'companyLogo' | 'companySignature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateSettings({ ...settings, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addService = () => {
    if (!newService.trim()) return;
    const currentServices = settings.companyServices || [];
    onUpdateSettings({ ...settings, companyServices: [...currentServices, newService.trim()] });
    setNewService('');
  };

  const removeService = (index: number) => {
    const currentServices = settings.companyServices || [];
    onUpdateSettings({ ...settings, companyServices: currentServices.filter((_, i) => i !== index) });
  };

  const handleAddBank = () => {
    const ok = validate({
      bankName: { value: newBank.bankName, label: 'Bank Name' },
      accountHolderName: { value: newBank.accountHolderName, label: 'Account Holder Name' },
      accountNo: { value: newBank.accountNo, label: 'Account Number' },
      ifscCode: { value: newBank.ifscCode, label: 'IFSC Code' },
    });
    if (!ok) return;
    
    const currentBanks = settings.bankDetails || [];
    
    if (editingBankId) {
      // Update existing bank
      const updatedBanks = currentBanks.map(b => 
        b.id === editingBankId 
          ? { 
              ...b, 
              bankName: newBank.bankName!, 
              accountNo: newBank.accountNo!, 
              ifscCode: newBank.ifscCode!, 
              accountHolderName: newBank.accountHolderName!, 
              upiId: newBank.upiId 
            } 
          : b
      );
      onUpdateSettings({ ...settings, bankDetails: updatedBanks });
    } else {
      // Add new bank
      const bankToAdd: BankDetail = {
        id: Date.now().toString(),
        bankName: newBank.bankName!,
        accountNo: newBank.accountNo!,
        ifscCode: newBank.ifscCode!,
        accountHolderName: newBank.accountHolderName!,
        upiId: newBank.upiId
      };
      onUpdateSettings({ ...settings, bankDetails: [...currentBanks, bankToAdd] });
    }

    setNewBank({ bankName: '', accountNo: '', ifscCode: '', accountHolderName: '', upiId: '' });
    clearAll();
    setIsAddingBank(false);
    setEditingBankId(null);
  };

  const handleEditBank = (bank: BankDetail) => {
    setNewBank({
      bankName: bank.bankName,
      accountNo: bank.accountNo,
      ifscCode: bank.ifscCode,
      accountHolderName: bank.accountHolderName,
      upiId: bank.upiId
    });
    setEditingBankId(bank.id);
    setIsAddingBank(true);
  };

  const removeBank = (id: string) => {
    const currentBanks = settings.bankDetails || [];
    onUpdateSettings({ ...settings, bankDetails: currentBanks.filter(b => b.id !== id) });
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size should be less than 2MB');
      return;
    }
    setPhotoUploading(true);
    try {
      await uploadProfilePhoto(file);
      await refreshUser();
    } catch {
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl pb-20 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Application Settings</h2>
          <p className="text-slate-500 font-medium mt-1">Configure your company identity and system guardrails.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 animate-pulse">
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">System Secured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - System Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-[#F5F4F0]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm shadow-amber-50">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">System Controls</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Workflow Enforcement</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between group">
                <div className="space-y-1 pr-6">
                  <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">Owner Approval</h4>
                  <p className="text-[11px] text-slate-500 font-bold leading-tight">Verification required for diesel bills</p>
                </div>
                <button 
                  onClick={toggleDieselApproval}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative shrink-0 ${settings.dieselApprovalRequired ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${settings.dieselApprovalRequired ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between group">
                <div className="space-y-1 pr-6">
                  <h4 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">Strict Limit</h4>
                  <p className="text-[11px] text-slate-500 font-bold leading-tight">Flag excessive fuel consumption</p>
                </div>
                <button 
                  onClick={toggleEnforcement}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 relative shrink-0 ${settings.limitStrictEnforcement ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${settings.limitStrictEnforcement ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <SettingsIcon size={20} className="text-blue-500" /> General Prefs
            </h3>
            <div className="space-y-4">
              <SettingsItem icon={BellRing} label="Notifications" description="Assignment alerts" active />
              <SettingsItem icon={IndianRupee} label="GST Auto" description="18% Default tax" active />
              <SettingsItem icon={Truck} label="GPS Refresh" description="5min update rate" />
            </div>
          </div>
        </div>

        {/* Right Column - Company Profile */}
        <div className="lg:col-span-7 space-y-8">

          {/* Profile Photo Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-[#F5F4F0]/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shadow-sm shadow-violet-50">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Profile Photo</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Account Avatar</p>
              </div>
            </div>
            <div className="p-8 flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 bg-[#F5F4F0] flex items-center justify-center overflow-hidden shrink-0">
                {currentUser?.profilePhoto ? (
                  <img src={currentUser.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-black text-slate-900">{currentUser?.name || currentUser?.email || 'Your Account'}</h4>
                <p className="text-[10px] text-slate-500 font-bold leading-tight">
                  Upload a profile photo. Max 2MB, JPG/PNG/WEBP.
                </p>
                <label className={`inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all shadow-lg ${photoUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-100'}`}>
                  <Camera size={14} />
                  {photoUploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={photoUploading}
                    onChange={handleProfilePhotoUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-[#F5F4F0]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-50">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">FlyAsh Pro Company</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Corporate Identity</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Logo Upload Simulation */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-[#F5F4F0] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 group hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer relative overflow-hidden">
                  {settings.companyLogo ? (
                    <img src={settings.companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera size={24} />
                      <span className="text-[10px] font-black mt-2 uppercase tracking-tight">Logo</span>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black text-slate-900">Company Logo</h4>
                  <p className="text-[10px] text-slate-500 font-bold leading-tight">Recommended size: 512x512px. Transparent background preferred.</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Camera size={14} /> Upload Logo
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'companyLogo')}
                    />
                  </label>
                  <input 
                    type="text" 
                    placeholder="Or enter logo URL..."
                    value={settings.companyLogo || ''}
                    onChange={e => handleUpdateCompany('companyLogo', e.target.value)}
                    className="w-full px-4 py-2 mt-2 bg-[#F5F4F0] border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                  />
                </div>
              </div>

              {/* Owner Signature Upload */}
              <div className="flex items-center gap-6 p-6 bg-[#F5F4F0]/50 border border-slate-100 rounded-2xl">
                <div className="w-24 h-24 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 group hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer relative overflow-hidden">
                  {settings.companySignature ? (
                    <img src={settings.companySignature} alt="Owner Signature" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <FileSignature size={24} />
                      <span className="text-[10px] font-black mt-2 uppercase tracking-tight">Sign</span>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-black text-slate-900">Owner Signature</h4>
                  <p className="text-[10px] text-slate-500 font-bold leading-tight">Upload a clear signature on white background (PNG/JPG).</p>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                      <FileSignature size={14} /> Upload Signature
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'companySignature')}
                      />
                    </label>
                    {settings.companySignature && (
                      <button 
                        onClick={() => handleUpdateCompany('companySignature', undefined)}
                        className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="t-label px-1">Company Full Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={settings.companyName || ''}
                      onChange={e => handleUpdateCompany('companyName', e.target.value)}
                      placeholder="e.g. FlyAsh Logistics Pro Ltd."
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="t-label px-1">GST Number (Optional)</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={settings.companyGst || ''}
                      onChange={e => handleUpdateCompany('companyGst', e.target.value)}
                      placeholder="27AAAAA0000A1Z5"
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="t-label px-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email"
                      value={settings.companyEmail || ''}
                      onChange={e => handleUpdateCompany('companyEmail', e.target.value)}
                      placeholder="contact@flyashpro.com"
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="t-label px-1">Contact Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel"
                      value={settings.companyContact || ''}
                      onChange={e => handleUpdateCompany('companyContact', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="t-label px-1">WhatsApp Business Number</label>
                  <div className="relative">
                    <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                    <input 
                      type="tel"
                      value={settings.companyWhatsapp || ''}
                      onChange={e => handleUpdateCompany('companyWhatsapp', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="t-label px-1">Full Business Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-4 text-slate-400" />
                    <textarea 
                      value={settings.companyAddress || ''}
                      onChange={e => handleUpdateCompany('companyAddress', e.target.value)}
                      placeholder="123 Logistics Park, FlyAsh Hub, Industrial Area, State - Zip"
                      rows={3}
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="space-y-4">
                <label className="t-label px-1">Our Services</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={newService}
                      onChange={e => setNewService(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addService()}
                      placeholder="Add a service (e.g. Industrial FlyAsh Transport)"
                      className="w-full pl-11 pr-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <button 
                    onClick={addService}
                    className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(settings.companyServices || ['FlyAsh Logistics', 'Bulk Transportation', 'Fleet Management']).map((service, index) => (
                    <div key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 flex items-center gap-2 group animate-in zoom-in-95 duration-200">
                      <span className="text-xs font-black uppercase tracking-tight">{service}</span>
                      <button 
                        onClick={() => removeService(index)}
                        className="text-blue-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="p-8 border-b border-slate-50 bg-[#F5F4F0]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-50">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Settlement Banks</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Payment Recipients</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (isAddingBank) {
                    setIsAddingBank(false);
                    setEditingBankId(null);
                    setNewBank({ bankName: '', accountNo: '', ifscCode: '', accountHolderName: '', upiId: '' });
                  } else {
                    setIsAddingBank(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${isAddingBank ? 'bg-slate-900 text-white shadow-slate-100' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
              >
                {isAddingBank ? 'Cancel' : <><Plus size={16} /> Add Bank</>}
              </button>
            </div>

            <div className="p-8">
              {isAddingBank && (
                <div className="mb-8 p-6 bg-[#F5F4F0] rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Bank Name*</label>
                      <div className="relative">
                        <Banknote size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={newBank.bankName || ''}
                          onChange={e => { setNewBank({ ...newBank, bankName: e.target.value }); clearField('bankName'); }}
                          placeholder="e.g. HDFC Bank"
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none border ${fe['bankName'] ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                      {fe['bankName'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['bankName']}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Account Holder Name*</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={newBank.accountHolderName || ''}
                          onChange={e => { setNewBank({ ...newBank, accountHolderName: e.target.value }); clearField('accountHolderName'); }}
                          placeholder="Name as per Passbook"
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none border ${fe['accountHolderName'] ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                      {fe['accountHolderName'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['accountHolderName']}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Account Number*</label>
                      <div className="relative">
                        <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={newBank.accountNo || ''}
                          onChange={e => { setNewBank({ ...newBank, accountNo: e.target.value }); clearField('accountNo'); }}
                          placeholder="0000 0000 0000"
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono border ${fe['accountNo'] ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                      {fe['accountNo'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['accountNo']}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">IFSC Code*</label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={newBank.ifscCode || ''}
                          onChange={e => { setNewBank({ ...newBank, ifscCode: e.target.value }); clearField('ifscCode'); }}
                          placeholder="HDFC0000123"
                          className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono border ${fe['ifscCode'] ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                      {fe['ifscCode'] && <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe['ifscCode']}</p>}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">UPI ID (Optional)</label>
                      <div className="relative">
                        <QrCode size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                        <input 
                          type="text"
                          value={newBank.upiId || ''}
                          onChange={e => setNewBank({ ...newBank, upiId: e.target.value })}
                          placeholder="username@okaxis"
                          className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E7E5E0] rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleAddBank}
                    className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={18} /> {editingBankId ? 'Update Bank Account' : 'Save Bank Account'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(!settings.bankDetails || settings.bankDetails.length === 0) && !isAddingBank && (
                  <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-[#F5F4F0]/50">
                    <IndianRupee size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No settlement banks added yet</p>
                  </div>
                )}
                {settings.bankDetails?.map((bank) => (
                  <div key={bank.id} className="relative p-6 bg-[#F5F4F0] rounded-2xl border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleEditBank(bank)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all bg-white shadow-sm border border-slate-100"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => removeBank(bank.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all bg-white shadow-sm border border-slate-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                          <Banknote size={16} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate pr-8">{bank.bankName}</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Number</p>
                          <p className="text-xs font-bold text-slate-900 mt-0.5 font-mono select-all tracking-wider">{bank.accountNo}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">IFSC</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono select-all">{bank.ifscCode}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">UPI ID</p>
                            <p className="text-[10px] font-bold text-indigo-600 mt-0.5 truncate">{bank.upiId || '—'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Holder</p>
                          <p className="text-[11px] font-black text-slate-800 mt-1 uppercase tracking-tight">{bank.accountHolderName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsItem: React.FC<{ icon: any, label: string, description: string, active?: boolean }> = ({ icon: Icon, label, description, active }) => (
  <div className="flex items-center justify-between p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-white transition-all cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{label}</p>
        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{description}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-all" />
  </div>
);

export default SettingsView;
