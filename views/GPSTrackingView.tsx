
import React, { useState } from 'react';
import {
  MapPin, Navigation, Search, Filter, Download, Share2,
  Route, LayoutGrid, X, Clock, Play, Maximize2, Tent,
  User, AlertTriangle, Truck as TruckIcon, Info,
} from 'lucide-react';
import { Truck } from '../types';

interface GPSTrackingViewProps {
  fleet: Truck[];
}

const GPSTrackingView: React.FC<GPSTrackingViewProps> = ({ fleet }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [rightTab, setRightTab] = useState<'All' | 'On Trip'>('All');

  const filters = [
    { id: 'All',       count: 52, color: '#1C1917' },
    { id: 'Moving',    count: 10, color: '#10B981' },
    { id: 'Stopped',   count: 33, color: '#EF4444' },
    { id: 'Idling',    count: 1,  color: '#F59E0B' },
    { id: 'Offline',   count: 8,  color: '#9CA3AF' },
    { id: 'Breakdown', count: 0,  color: '#DC2626' },
    { id: 'Faulty',    count: 5,  color: '#84CC16' },
    { id: 'Geofence',  count: 0,  color: '#3B82F6' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] -m-6 flex flex-col bg-[#ECEBE6] overflow-hidden relative">

      {/* Alert Banner */}
      <div className="bg-white border-b border-[#E7E5E0] px-5 py-2 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100">
            <Info size={13} strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold text-[#57534E]">
            <span className="font-black text-[#1C1917]">4 vehicles expiring soon.</span>
            <span className="ml-2 text-[#A8A29E]">Renew your Fleet Edge subscription to avoid disruption.</span>
          </p>
        </div>
        <button className="btn btn-danger btn-sm">Renew Now</button>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">

        {/* Map */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074"
              className="w-full h-full object-cover opacity-20 grayscale"
              alt="Map"
            />
            <div className="absolute inset-0 bg-blue-500/5" />
          </div>

          {/* Live / Playback */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button className="flex items-center gap-2 bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
            </button>
            <button className="flex items-center gap-2 bg-white text-blue-600 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md border border-[#E7E5E0]">
              <Play size={13} /> Playback
            </button>
          </div>

          {/* India Map */}
          <div className="relative w-full h-full flex items-center justify-center p-20 pointer-events-none">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/e/e0/India_location_map.svg"
              className="h-full w-auto object-contain opacity-15"
              alt="India Map"
            />
            {[
              { top: '60%', left: '35%', count: 41, large: true },
              { top: '65%', left: '40%', count: 3,  large: false },
              { top: '61%', left: '42%', count: 8,  large: true },
            ].map(({ top, left, count, large }) => (
              <div key={`${top}-${left}`} className="absolute pointer-events-auto" style={{ top, left }}>
                <div className="relative group cursor-pointer">
                  <div className={`${large ? 'w-10 h-10' : 'w-8 h-8'} bg-[#1C1917]/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-[#1C1917]/30 shadow-xl group-hover:scale-110 transition-transform`}>
                    {count}
                  </div>
                  {large && <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />}
                </div>
              </div>
            ))}
          </div>

          {/* Right map controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {[Maximize2, Tent, Navigation].map((Icon, i) => (
              <button key={i} className="w-9 h-9 bg-white border border-[#E7E5E0] text-[#57534E] rounded-xl flex items-center justify-center hover:bg-[#FAFAF8] transition-all shadow-sm active:scale-95">
                <Icon size={17} strokeWidth={1.8} />
              </button>
            ))}
          </div>

          {/* Map layer toggle */}
          <div className="absolute bottom-4 left-4 flex bg-white rounded-xl shadow-md border border-[#E7E5E0] overflow-hidden z-10">
            <button className="px-4 py-2 bg-[#F5F4F0] text-[11px] font-black text-[#1C1917] uppercase tracking-wider">Map</button>
            <button className="px-4 py-2 text-[11px] font-black text-[#A8A29E] uppercase tracking-wider hover:text-[#1C1917] transition-colors">Satellite</button>
          </div>

          {/* Vehicle Popup */}
          {selectedTruck && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-20 border border-[#E7E5E0] animate-dropdown">
              <div className="bg-blue-50 p-5 flex items-start gap-4 border-b border-blue-100 relative">
                <button onClick={() => setSelectedTruck(null)} className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#1C1917] transition-colors">
                  <X size={18} />
                </button>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <TruckIcon size={26} className="text-blue-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-black text-[#1C1917] text-lg leading-tight">{selectedTruck.truckNumber}</h3>
                  <p className="t-label text-blue-600 mt-0.5">{selectedTruck.modelNumber}</p>
                </div>
                <span className="ml-auto mt-1 badge badge-blue shrink-0">15h 5m</span>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <User size={15} className="text-[#A8A29E] mt-0.5 shrink-0" />
                    <div>
                      <p className="t-label">Driver</p>
                      <p className="text-sm font-bold text-[#1C1917]">{selectedTruck.driverName || 'NA'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-[#A8A29E] mt-0.5 shrink-0" />
                    <div>
                      <p className="t-label">Location</p>
                      <p className="text-xs font-medium text-[#57534E] leading-snug">Great Eastern Hwy, Surat, Gujarat</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-[#F0EEE9] pt-4">
                  {[
                    { label: 'Speed',     val: '0 km/h' },
                    { label: 'Odometer', val: `${selectedTruck.currentOdometer.toLocaleString()} km` },
                    { label: 'Fuel',     val: '28%' },
                    { label: 'DEF',      val: '79%' },
                    { label: 'Battery',  val: 'N/A' },
                    { label: 'Engine Hrs', val: '1863.6' },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="t-label">{label}</p>
                      <p className="text-sm font-black text-[#1C1917] mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3 bg-[#FAFAF8] border-t border-[#F0EEE9] flex gap-2">
                {['Nearby', 'Track Route', 'Playback', 'Detail'].map(label => (
                  <button key={label} className="flex-1 py-2 text-[10px] font-black text-blue-600 uppercase tracking-wide bg-white border border-[#E7E5E0] rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter bar (floating, top-center of map) */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-lg z-10 border border-white/60">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex flex-col items-center px-3.5 py-2 rounded-xl transition-all ${activeFilter === f.id ? 'bg-[#1C1917] shadow-md' : 'hover:bg-[#F5F4F0]'}`}
            >
              <div className="w-8 h-0.5 rounded-full mb-1.5" style={{ background: activeFilter === f.id ? f.color : '#D6D3CE' }} />
              <span className={`text-base font-black leading-none ${activeFilter === f.id ? 'text-white' : 'text-[#1C1917]'}`}>{f.count}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${activeFilter === f.id ? 'text-white/50' : 'text-[#A8A29E]'}`}>{f.id}</span>
            </button>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-[#E7E5E0] flex flex-col z-10">

          {/* Tab toggle */}
          <div className="p-3 border-b border-[#F0EEE9]">
            <div className="tab-list">
              <button onClick={() => setRightTab('All')}     className={`tab-item flex-1 ${rightTab === 'All'     ? 'active' : ''}`}>All</button>
              <button onClick={() => setRightTab('On Trip')} className={`tab-item flex-1 ${rightTab === 'On Trip' ? 'active' : ''}`}>On Trip</button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-3 py-2.5 grid grid-cols-4 gap-1.5 border-b border-[#F0EEE9]">
            {[{ Icon: Search, label: 'Search' }, { Icon: Filter, label: 'Filter' }, { Icon: Download, label: 'Export' }, { Icon: Share2, label: 'Share' }].map(({ Icon, label }) => (
              <button key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F5F4F0] transition-all group">
                <Icon size={17} className="text-blue-600" strokeWidth={1.8} />
                <span className="text-[9px] font-bold text-[#A8A29E] uppercase">{label}</span>
              </button>
            ))}
          </div>

          {/* Vehicle list */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
            {fleet.map(truck => (
              <div
                key={truck.id}
                onClick={() => setSelectedTruck(truck)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer group ${
                  selectedTruck?.id === truck.id
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-[#F0EEE9] hover:border-[#E7E5E0] bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F4F0] rounded-xl flex items-center justify-center text-[#A8A29E] group-hover:scale-105 transition-transform shrink-0">
                      <TruckIcon size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1C1917] leading-tight">{truck.truckNumber}</p>
                      <p className="t-label mt-0.5">{truck.modelNumber}</p>
                    </div>
                  </div>
                  {truck.isMaintenanceMode && (
                    <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                      <AlertTriangle size={11} /> Warn
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-3 text-[10px] text-[#A8A29E] font-medium">
                  <Clock size={11} />
                  <span>Updated <span className="text-[#57534E] font-semibold">8:13 PM, 10 May</span></span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-[#F5F4F0]">
                  {[{ Icon: Navigation, label: 'Geofence' }, { Icon: Route, label: 'Trip' }, { Icon: LayoutGrid, label: 'Cluster' }, { Icon: Share2, label: 'Share' }].map(({ Icon, label }) => (
                    <button key={label} className="flex flex-col items-center gap-1 group/btn">
                      <div className="w-9 h-9 rounded-xl bg-[#F5F4F0] text-blue-600 flex items-center justify-center border border-transparent group-hover/btn:bg-blue-600 group-hover/btn:text-white group-hover/btn:shadow-md transition-all">
                        <Icon size={15} strokeWidth={1.8} />
                      </div>
                      <span className="text-[8px] font-bold text-[#A8A29E] uppercase group-hover/btn:text-blue-600">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSTrackingView;
