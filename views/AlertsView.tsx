
import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Search, 
  Plus, 
  X, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Truck, 
  ShieldAlert, 
  Wrench, 
  Calendar,
  Zap,
  Info,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  BellPlus,
  ShieldCheck,
  FileWarning
} from 'lucide-react';
import { Truck as TruckType, CustomAlert, AlertCategory, AlertUrgency } from '../types';
import { SearchableSelect } from '../components/SearchableSelect';

interface AlertsViewProps {
  fleet: TruckType[];
  customAlerts: CustomAlert[];
  onAddAlert: (alert: CustomAlert) => void;
  onUpdateAlert: (alert: CustomAlert) => void;
  onDeleteAlert: (id: string) => void;
  onUpdateFleet: (fleet: TruckType[]) => void;
}

const URGENCY_CONFIG: Record<AlertUrgency, { color: string, bg: string, icon: any }> = {
  [AlertUrgency.CRITICAL]: { color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: AlertTriangle },
  [AlertUrgency.WARNING]: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: Clock },
  [AlertUrgency.INFO]: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Info },
};

const CATEGORY_ICONS: Record<AlertCategory, any> = {
  [AlertCategory.COMPLIANCE]: ShieldAlert,
  [AlertCategory.MAINTENANCE]: Wrench,
  [AlertCategory.FINANCIAL]: Zap,
  [AlertCategory.CUSTOM]: BellRing,
};

const AlertsView: React.FC<AlertsViewProps> = ({ fleet, customAlerts, onAddAlert, onUpdateAlert, onDeleteAlert, onUpdateFleet }) => {
  const [activeTab, setActiveTab] = useState<'AUTO' | 'CUSTOM'>('AUTO');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTruckId, setSelectedTruckId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 10;

  const [formData, setFormData] = useState<Partial<CustomAlert>>({
    title: '',
    description: '',
    category: AlertCategory.CUSTOM,
    urgency: AlertUrgency.WARNING,
    date: new Date().toISOString().split('T')[0],
    truckId: '',
    isResolved: false
  });

  const autoAlerts = useMemo(() => {
    const today = new Date();
    const alerts: any[] = [];

    fleet.forEach(truck => {
      const docs = [
        { type: 'RC', key: 'rcExpiry', date: new Date(truck.rcExpiry), cat: AlertCategory.COMPLIANCE },
        { type: 'Insurance', key: 'insuranceExpiry', date: new Date(truck.insuranceExpiry), cat: AlertCategory.COMPLIANCE },
        { type: 'Fitness', key: 'fitnessExpiry', date: new Date(truck.fitnessExpiry), cat: AlertCategory.COMPLIANCE },
        { type: 'Pollution', key: 'pollutionExpiry', date: new Date(truck.pollutionExpiry), cat: AlertCategory.COMPLIANCE },
        { type: 'Permit', key: 'permitExpiry', date: new Date(truck.permitExpiry), cat: AlertCategory.COMPLIANCE }
      ];

      // Also check the documents array for specific types
      const vaultDocs = (truck.documents || []).filter(d => 
        ['RC', 'INSURANCE', 'PUC', 'STATE_PERMIT', 'NATIONAL_PERMIT', 'FITNESS'].includes(d.type) && d.expiryDate
      ).map(d => ({
        type: (d.type || "").replace('_', ' '),
        key: `vault-${d.id}`,
        date: new Date(d.expiryDate!),
        cat: AlertCategory.COMPLIANCE
      }));

      [...docs, ...vaultDocs].forEach(d => {
        if (!d.date || isNaN(d.date.getTime())) return;
        const diffDays = Math.ceil((d.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          alerts.push({
            id: `AUTO-${truck.id}-${d.type}`,
            title: `${d.type} Alert: ${truck.truckNumber}`,
            description: diffDays < 0 ? `Document expired ${Math.abs(diffDays)} days ago.` : `Expires in ${diffDays} days on ${d.date.toLocaleDateString()}.`,
            urgency: diffDays < 0 ? AlertUrgency.CRITICAL : AlertUrgency.WARNING,
            category: d.cat,
            subCategory: d.type,
            date: d.date.toISOString().split('T')[0],
            truckId: truck.id,
            truckNum: truck.truckNumber,
            docType: d.type,
            docKey: d.key,
            isResolved: false,
            isAuto: true
          });
        }
      });

      const lastSvc = new Date(truck.lastServiceDate);
      const monthsSinceSvc = (today.getTime() - lastSvc.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSinceSvc > 5) {
         alerts.push({
            id: `AUTO-${truck.id}-MAINT`,
            title: `Service Schedule: ${truck.truckNumber}`,
            description: `Last general maintenance was ${Math.floor(monthsSinceSvc)} months ago. Technical inspection recommended.`,
            urgency: AlertUrgency.WARNING,
            category: AlertCategory.MAINTENANCE,
            subCategory: 'Service',
            date: truck.lastServiceDate,
            truckId: truck.id,
            truckNum: truck.truckNumber,
            isResolved: false,
            isAuto: true
         });
      }
    });

    return alerts.filter(a => 
      (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.truckNum?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory === 'ALL' || a.category === selectedCategory || a.subCategory === selectedCategory) &&
      (selectedTruckId === 'ALL' || a.truckId === selectedTruckId) &&
      !dismissedAlertIds.has(a.id)
    );
  }, [fleet, searchQuery, dismissedAlertIds, selectedCategory, selectedTruckId]);

  const filteredCustom = useMemo(() => {
    return customAlerts.filter(a => 
      (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedCategory === 'ALL' || a.category === selectedCategory) &&
      (selectedTruckId === 'ALL' || a.truckId === selectedTruckId) &&
      !dismissedAlertIds.has(a.id)
    );
  }, [customAlerts, searchQuery, dismissedAlertIds, selectedCategory, selectedTruckId]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    
    // Add main categories
    Object.values(AlertCategory).forEach(c => cats.add(c));
    
    // Extract specific document types from active alerts and possible documents
    fleet.forEach(truck => {
      const basicDocs = ['RC', 'Insurance', 'Fitness', 'Pollution', 'Permit'];
      basicDocs.forEach(d => cats.add(d));
      
      (truck.documents || []).forEach(d => {
        cats.add((d.type || "").replace('_', ' '));
      });
    });

    return Array.from(cats).sort();
  }, [fleet, customAlerts]);

  // Paginate alerts based on active tab
  const currentAlerts = useMemo(() => {
    const list = activeTab === 'AUTO' ? autoAlerts : filteredCustom;
    return list.sort((a, b) => 
      (b.urgency === AlertUrgency.CRITICAL ? 1 : 0) - (a.urgency === AlertUrgency.CRITICAL ? 1 : 0)
    );
  }, [activeTab, autoAlerts, filteredCustom]);

  const totalPages = Math.ceil(currentAlerts.length / cardsPerPage);
  const paginatedAlerts = currentAlerts.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateAlert({ ...formData, id: editingId } as CustomAlert);
    } else {
      onAddAlert({ ...formData, id: `ALT-${Date.now()}`, isResolved: false } as CustomAlert);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (alertItem: CustomAlert) => {
    setEditingId(alertItem.id);
    setFormData(alertItem);
    setIsModalOpen(true);
  };

  const handleResolveAuto = (alertItem: any) => {
    setDismissedAlertIds(prev => new Set([...prev, alertItem.id]));
    if (alertItem.category === AlertCategory.COMPLIANCE) {
      const newDate = window.prompt(`Enter new expiry date for ${alertItem.docType} (YYYY-MM-DD):`, 
        new Date(Date.now() + 31536000000).toISOString().split('T')[0]);
      
      if (newDate) {
        const updatedFleet = fleet.map(t => {
          if (t.id === alertItem.truckId) {
            return { ...t, [alertItem.docKey]: newDate };
          }
          return t;
        });
        onUpdateFleet(updatedFleet);
        window.alert(`Record updated for ${alertItem.truckNum}. Document is now compliant.`);
      }
    } else if (alertItem.category === AlertCategory.MAINTENANCE) {
      const updatedFleet = fleet.map(t => {
        if (t.id === alertItem.truckId) {
          return { ...t, lastServiceDate: new Date().toISOString().split('T')[0] };
        }
        return t;
      });
      onUpdateFleet(updatedFleet);
      window.alert(`Service log updated for ${alertItem.truckNum}. Schedule reset.`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Nerve Center</h2>
          <p className="text-slate-500 font-medium">Compliance radar and user-defined operational alerts.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('AUTO')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'AUTO' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShieldCheck size={14}/> Critical Radar ({autoAlerts.length})
          </button>
          <button 
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'CUSTOM' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BellPlus size={14}/> Custom Tasks ({customAlerts.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Filter alerts by asset number or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold"
          />
        </div>
        
        <SearchableSelect 
          className="lg:w-64"
          placeholder="All Assets"
          value={selectedTruckId}
          onChange={(v) => {
            setSelectedTruckId(v);
            setCurrentPage(1);
          }}
          options={[
            { value: 'ALL', label: 'All Assets' },
            ...fleet.map(t => ({ value: t.id, label: t.truckNumber, sub: t.vehicleType }))
          ]}
          icon={Truck}
        />

        <SearchableSelect 
          className="lg:w-64"
          placeholder="All Categories"
          value={selectedCategory}
          onChange={(v) => {
            setSelectedCategory(v);
            setCurrentPage(1);
          }}
          options={[
            { value: 'ALL', label: 'All Categories' },
            ...Object.values(AlertCategory).map(cat => ({ value: cat, label: cat })),
            ...availableCategories
              .filter(cat => !Object.values(AlertCategory).includes(cat as any))
              .map(cat => ({ value: cat, label: cat, sub: 'Vault' }))
          ]}
          icon={Filter}
        />

        <button 
          onClick={() => { setEditingId(null); setFormData({ ...formData, title: '', description: '', truckId: '' }); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={20} /> Create Task
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Urgency</th>
                <th className="px-8 py-5">Asset #</th>
                <th className="px-8 py-5">Alert Detail</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5 text-right w-32">Scheduled</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedAlerts.map((alertItem: any) => {
                const UrgencyIcon = URGENCY_CONFIG[alertItem.urgency as AlertUrgency].icon;
                const CategoryIcon = CATEGORY_ICONS[alertItem.category as AlertCategory];
                const truck = fleet.find(t => t.id === alertItem.truckId);

                return (
                  <tr key={alertItem.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${URGENCY_CONFIG[alertItem.urgency as AlertUrgency].bg}`}>
                        <UrgencyIcon size={14} className={URGENCY_CONFIG[alertItem.urgency as AlertUrgency].color} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${URGENCY_CONFIG[alertItem.urgency as AlertUrgency].color}`}>
                          {alertItem.urgency}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {truck ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Truck size={14} />
                          </div>
                          <span className="text-xs font-black text-slate-900">{truck.truckNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System</span>
                      )}
                    </td>
                    <td className="px-8 py-5 max-w-md">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                          {alertItem.title}
                        </p>
                        <p className="text-xs font-medium text-slate-500 line-clamp-1 italic">
                          {alertItem.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl w-fit shadow-sm">
                        <CategoryIcon size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{alertItem.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-900 tracking-tighter">{alertItem.date}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Target Date</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {alertItem.isAuto ? (
                          <button 
                            onClick={() => handleResolveAuto(alertItem)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 size={12}/> Resolve
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => {
                                setDismissedAlertIds(prev => new Set([...prev, alertItem.id]));
                                onDeleteAlert(alertItem.id);
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2"
                             >
                               <CheckCircle2 size={12}/> Resolve
                             </button>
                             <div className="h-4 w-px bg-slate-100 mx-2" />
                             <button onClick={() => handleEdit(alertItem)} className="p-2 bg-white text-slate-400 border border-slate-100 rounded-lg hover:text-blue-600 transition-all" title="Edit Task"><Edit size={14}/></button>
                             <button onClick={() => onDeleteAlert(alertItem.id)} className="p-2 bg-white text-slate-400 border border-slate-100 rounded-lg hover:text-red-600 transition-all" title="Delete Task"><Trash2 size={14}/></button>
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

        {((activeTab === 'AUTO' && autoAlerts.length === 0) || (activeTab === 'CUSTOM' && filteredCustom.length === 0)) && (
          <div className="py-32 text-center">
             <ShieldCheck size={64} className="mx-auto text-slate-200 mb-4" />
             <h4 className="text-xl font-black text-slate-900">Operational Integrity Maintained</h4>
             <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">No active alerts found for this filter.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-12 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all animate-in slide-in-from-bottom-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing page {currentPage} of {totalPages} ({currentAlerts.length} total alerts)
           </p>
           <div className="flex gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all font-mono"
              >
                 Prev
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all font-mono shadow-lg shadow-slate-200"
              >
                 Next
              </button>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">{editingId ? 'Modify Task' : 'New Manual Task'}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Protocol • Manual Entry</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Task Title*</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Schedule RC Renewal" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black" 
                    value={formData.title ?? ''} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-6">
                  <SearchableSelect 
                    label="Category"
                    variant="slate"
                    value={formData.category ?? AlertCategory.CUSTOM} 
                    onChange={v => setFormData({...formData, category: v as AlertCategory})}
                    options={Object.values(AlertCategory).map(c => ({ value: c, label: c }))}
                  />
                  <SearchableSelect 
                    label="Priority"
                    variant="slate"
                    value={formData.urgency ?? AlertUrgency.WARNING} 
                    onChange={v => setFormData({...formData, urgency: v as AlertUrgency})}
                    options={Object.values(AlertUrgency).map(u => ({ value: u, label: u }))}
                  />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <SearchableSelect 
                    label="Asset Map"
                    variant="slate"
                    placeholder="No specific asset"
                    value={formData.truckId ?? ''}
                    onChange={v => setFormData({...formData, truckId: v})}
                    options={[
                      { value: '', label: 'No specific asset' },
                      ...fleet.map(t => ({ value: t.id, label: t.truckNumber, sub: t.vehicleType }))
                    ]}
                  />
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reminder Date</label>
                     <input 
                        type="date" 
                        required 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                        value={formData.date ?? ''} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
                  <textarea 
                    rows={2} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" 
                    value={formData.description ?? ''} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Detailed instructions..." 
                  />
               </div>

               <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">Deploy Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsView;
