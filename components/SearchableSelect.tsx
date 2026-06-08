import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, Plus } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sub?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ElementType;
  variant?: 'outline' | 'ghost' | 'slate';
  onCreateNew?: (searchTerm: string) => void;
  createNewLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
  icon: Icon,
  variant = 'outline',
  onCreateNew,
  createNewLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() =>
    options.filter(opt =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sub ?? '').toLowerCase().includes(search.toLowerCase())
    ),
    [options, search]
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else setSearch('');
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew?.(search);
    setIsOpen(false);
  };

  const showCreateNew = !!onCreateNew && (search.trim().length > 0 || filteredOptions.length === 0);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''} ${label ? 'space-y-1.5' : ''}`}>
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`
          w-full px-4 py-3 text-left flex items-center justify-between gap-2
          border rounded-2xl transition-all duration-150 outline-none
          shadow-sm
          ${variant === 'slate'
            ? 'bg-slate-50 border-slate-100'
            : 'bg-white border-slate-200'
          }
          ${isOpen
            ? 'ring-4 ring-blue-500/10 border-blue-400'
            : 'hover:border-slate-300'
          }
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
          <span className={`text-[11px] font-black uppercase tracking-wider truncate ${
            selectedOption ? 'text-slate-800' : 'text-slate-400'
          }`}>
            {selectedOption ? selectedOption.label.replace(/_/g, ' ') : (placeholder ?? 'Select...')}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-1.5 z-200
          bg-white border border-slate-200/80
          rounded-2xl shadow-2xl overflow-hidden animate-dropdown
        ">
          {/* Search */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                className="
                  w-full pl-8 pr-3 py-2
                  bg-slate-50 border border-slate-200
                  rounded-xl text-[11px] font-semibold text-slate-700
                  placeholder:text-slate-400
                  outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  transition-all
                "
                placeholder="Search options..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filteredOptions.length === 1) handleSelect(filteredOptions[0].value);
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
            {filteredOptions.length === 0 && !showCreateNew ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Search size={14} className="text-slate-300" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matches</p>
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`
                      w-full text-left px-4 py-2.5 flex items-center justify-between gap-3
                      transition-all duration-100
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className="min-w-0">
                      <p className={`text-[11px] font-black uppercase tracking-tight leading-tight ${
                        isSelected ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {opt.label.replace(/_/g, ' ')}
                        {opt.disabled && <span className="ml-1.5 text-[9px] font-bold text-slate-400 normal-case tracking-normal">disabled</span>}
                      </p>
                      {opt.sub && (
                        <p className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${
                          isSelected ? 'text-blue-400' : 'text-slate-400'
                        }`}>{opt.sub}</p>
                      )}
                    </div>
                    {isSelected && <Check size={12} className="shrink-0 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new */}
          {showCreateNew && (
            <div className="p-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCreateNew}
                className="
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                  bg-amber-50 border border-amber-200
                  text-amber-700 hover:bg-amber-100
                  transition-all group
                "
              >
                <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Plus size={11} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wide">
                  {createNewLabel ?? 'Create new'}
                  {search.trim() && (
                    <span className="ml-1 font-bold normal-case tracking-normal text-amber-600">
                      "{search.trim()}"
                    </span>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
