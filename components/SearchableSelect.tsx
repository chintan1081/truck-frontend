import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: any;
  variant?: 'outline' | 'ghost' | 'slate';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder, 
  className, 
  icon: Icon, 
  variant = 'outline' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = useMemo(() => options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    (opt.sub || '').toLowerCase().includes(search.toLowerCase())
  ), [options, search]);
  
  const selectedOption = options.find(opt => opt.value === value);

  const variantStyles = {
    outline: 'bg-white border-slate-200 rounded-[1.5rem] shadow-sm',
    ghost: 'bg-white border-slate-200 rounded-[1.5rem] shadow-sm hover:bg-slate-50',
    slate: 'bg-slate-50 border-slate-100 rounded-xl'
  };

  return (
    <div className={`relative ${className} ${label ? 'space-y-1.5' : ''}`}>
      {label && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
      <div 
        className={`w-full px-4 py-2.5 border font-black text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-between transition-all ${variantStyles[variant]} ${isOpen ? 'ring-4 ring-blue-500/10 border-blue-400' : 'border-slate-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0" />}
          <span className={`truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label.replace(/_/g, ' ') : placeholder || 'Select...'}
          </span>
        </div>
        <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-50 bg-slate-50/50">
               <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Search options..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
               {filteredOptions.length === 0 ? (
                 <div className="p-6 text-center flex flex-col items-center gap-1">
                    <Search size={16} className="text-slate-200" />
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">No matches</p>
                 </div>
               ) : (
                 filteredOptions.map(opt => {
                   const isDisabled = (opt as any).disabled;
                   return (
                     <div 
                      key={opt.value}
                      className={`px-4 py-3 cursor-pointer transition-all flex flex-col gap-0.5 border-l-4 ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'} ${value === opt.value ? 'bg-blue-50 text-blue-700 border-blue-600' : 'text-slate-700 border-transparent'}`}
                      onClick={() => {
                        if (isDisabled) return;
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                     >
                       <span className="text-[10px] font-black uppercase tracking-tight">{opt.label.replace(/_/g, ' ')}</span>
                       {opt.sub && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{isDisabled ? `${opt.sub} — DISABLED` : opt.sub}</span>}
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
