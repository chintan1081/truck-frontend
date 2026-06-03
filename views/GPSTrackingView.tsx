
import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Box, 
  Route, 
  LayoutGrid, 
  ChevronRight,
  X,
  Activity,
  Zap,
  Clock,
  Gauge,
  Battery,
  Fuel,
  Info,
  Maximize2,
  ChevronLeft,
  ChevronDown,
  Play,
  Layers,
  Map as MapIcon,
  Tent,
  User,
  AlertTriangle,
  FileX,
  Truck as TruckIcon
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
    { id: 'All', count: 52, color: 'bg-slate-900 border-indigo-600' },
    { id: 'Moving', count: 10, color: 'bg-green-500 border-green-500' },
    { id: 'Stopped', count: 33, color: 'bg-red-500 border-red-500' },
    { id: 'Idling', count: 1, color: 'bg-amber-500 border-amber-500' },
    { id: 'Offline', count: 8, color: 'bg-gray-500 border-gray-500' },
    { id: 'Breakdown', count: 0, color: 'bg-rose-600 border-rose-600' },
    { id: 'Faulty', count: 5, color: 'bg-lime-500 border-lime-500' },
    { id: 'Geofence', count: 0, color: 'bg-blue-500 border-blue-500' },
  ];

  return (
    <div className="h-[calc(100vh-140px)] -m-8 flex flex-col bg-slate-100 overflow-hidden relative">
      {/* Top Banner Alert */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <Info size={14} />
          </div>
          <p className="text-xs font-bold text-slate-700">
            <span className="font-black">Your fleet has : 4</span> Vehicles Expiring Soon
            <span className="ml-4 text-slate-400 font-medium">To continue using services renew your Fleet Edge subscription today</span>
          </p>
        </div>
        <button className="bg-rose-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-all">
          Renew
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-[#e5e7eb] flex items-center justify-center">
          {/* Mock Map Background */}
          <div className="absolute inset-0 bg-blue-50 overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074" 
               className="w-full h-full object-cover opacity-30 grayscale" 
               alt="Map Background" 
             />
             <div className="absolute inset-0 bg-blue-500/5 mix-blend-multiply" />
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live
            </button>
            <button className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg border border-blue-100">
              <Play size={14} /> Play Back
            </button>
          </div>

          {/* India Map Visualization (Simplified) */}
          <div className="relative w-full h-full flex items-center justify-center p-20 pointer-events-none">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/e/e0/India_location_map.svg" 
               className="h-full w-auto object-contain opacity-20" 
               alt="India Map"
             />
             
             {/* Mock Clusters */}
             <div className="absolute top-[60%] left-[35%] pointer-events-auto">
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 bg-slate-900/60 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-slate-700 shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    41
                  </div>
                  <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
                </div>
             </div>
             
             <div className="absolute top-[65%] left-[40%] pointer-events-auto">
                <div className="relative group cursor-pointer">
                  <div className="w-8 h-8 bg-slate-900/40 rounded-full flex items-center justify-center text-white font-black text-[10px] border-2 border-slate-700 shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    3
                  </div>
                </div>
             </div>

             <div className="absolute top-[61%] left-[42%] pointer-events-auto">
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 bg-slate-900/60 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-slate-700 shadow-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                    8
                  </div>
                </div>
             </div>
          </div>

          {/* Map Feature Controls (Right side of map) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            <MapControlIcon icon={Maximize2} />
            <MapControlIcon icon={Tent} />
            <MapControlIcon icon={Navigation} />
          </div>

          {/* Map Layer Controls (Bottom Left of map) */}
          <div className="absolute bottom-4 left-4 flex gap-0.5 bg-white p-1 rounded-xl shadow-2xl z-10 border border-slate-200">
            <button className="px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-900">Map</button>
            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors">Satellite</button>
          </div>

          {/* Vehicle Info Popup (Mockup) */}
          {selectedTruck && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden z-20 border border-slate-200 animate-in zoom-in-95 duration-300">
               <div className="bg-purple-100 p-6 flex items-start gap-4 border-b border-purple-200 relative">
                  <button onClick={() => setSelectedTruck(null)} className="absolute top-4 right-4 text-purple-400 hover:text-purple-600">
                    <X size={20} />
                  </button>
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <TruckIcon size={32} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-900">{selectedTruck.truckNumber}</h3>
                       <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-black">
                         15h 5m 48s
                       </div>
                    </div>
                    <p className="text-[10px] font-bold text-purple-600 mt-1 uppercase tracking-widest">{selectedTruck.modelNumber}</p>
                  </div>
               </div>
               
               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="text-slate-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Driver</p>
                        <p className="text-sm font-black text-slate-900">{selectedTruck.driverName || 'NA'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="text-slate-400 mt-0.5" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Current Location</p>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">
                          Great Eastern Highway, Surat District, Gujarat. 155 m from JK Lakshmi Cement Unit.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-black text-blue-600 uppercase tracking-widest italic underline decoration-2 underline-offset-4">Issues: 01</p>
                      <button className="text-[10px] font-black text-blue-500 uppercase">View All</button>
                    </div>
                    <div className="grid grid-cols-2 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                       <div className="p-4 border-r border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Fault Description</p>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">Engine Exhaust Back Pressure Regulator - Out of Calibration</p>
                       </div>
                       <div className="p-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Suggested Action</p>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">Sensor tampering - Visit nearest workshop in next 10 hours</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] italic">Live Vehicle Information</h4>
                    <div className="grid grid-cols-3 gap-6">
                       <InfoStat label="Speed" value="0 Km/Hr" />
                       <InfoStat label="Odometer Reading" value={`${selectedTruck.currentOdometer.toLocaleString()} Kms`} />
                       <InfoStat label="Fuel Level" value="28 %" />
                       <InfoStat label="DEF Level" value="79 %" />
                       <InfoStat label="Battery Voltage" value="NA" />
                       <InfoStat label="Engine Run Hrs" value="1863.6" />
                    </div>
                  </div>
               </div>

               <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button className="flex-1 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Nearby</button>
                  <button className="flex-1 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Track Route</button>
                  <button className="flex-1 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Play Back</button>
                  <button className="flex-1 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">Detail</button>
               </div>
            </div>
          )}
        </div>

        {/* Categories Bar (Inside Map area, top) */}
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 flex gap-0.5 bg-white/80 backdrop-blur-md p-1 rounded-2xl shadow-xl z-10 border border-white/50">
           {filters.map((f) => (
             <button 
               key={f.id}
               onClick={() => setActiveFilter(f.id)}
               className={`group flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${activeFilter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-100'}`}
             >
                <div className={`flex flex-col items-center justify-center`}>
                  <div className={`w-12 h-1 px-4 mb-2 rounded-full ${activeFilter === f.id ? f.color : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black ${activeFilter === f.id ? 'text-white' : 'text-slate-900'}`}>{f.count}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeFilter === f.id ? 'text-slate-400' : 'text-slate-500'}`}>{f.id}</span>
                  </div>
                </div>
             </button>
           ))}
        </div>

        {/* Right Sidebar */}
        <div className="w-[350px] bg-white border-l border-slate-200 flex flex-col z-10">
          {/* Sidebar Header Tabs */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex p-1 m-4 rounded-xl">
             <button 
               onClick={() => setRightTab('All')}
               className={`flex-1 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${rightTab === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               All
             </button>
             <button 
               onClick={() => setRightTab('On Trip')}
               className={`flex-1 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${rightTab === 'On Trip' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               On Trip
             </button>
          </div>

          {/* Sidebar Tools */}
          <div className="px-4 pb-4 grid grid-cols-4 gap-2 border-b border-slate-100">
             <SidebarTool icon={Search} label="Search" />
             <SidebarTool icon={Filter} label="Filter" />
             <SidebarTool icon={Download} label="Download" />
             <SidebarTool icon={Share2} label="Share" />
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
             {fleet.map((truck) => (
               <div 
                 key={truck.id} 
                 onClick={() => setSelectedTruck(truck)}
                 className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedTruck?.id === truck.id ? 'border-purple-600 bg-purple-50/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
               >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-105 transition-transform">
                         <TruckIcon size={24} />
                       </div>
                       <div>
                          <h5 className="font-black text-slate-900 text-sm leading-none">{truck.truckNumber}</h5>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{truck.id.slice(0, 12)}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase">{truck.modelNumber}</p>
                       </div>
                    </div>
                    {truck.isMaintenanceMode && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase italic">
                        <AlertTriangle size={12} /> Warning
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    <span>Last Update: <span className="text-slate-600">8:13PM, 10 May 2026</span></span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-50">
                    <VehicleAction icon={Navigation} label="Geofence" />
                    <VehicleAction icon={Route} label="Trip" />
                    <VehicleAction icon={LayoutGrid} label="Cluster" />
                    <VehicleAction icon={Share2} label="Share" />
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MapControlIcon: React.FC<{ icon: any }> = ({ icon: Icon }) => (
  <button className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-lg shadow-slate-200/20 active:scale-95">
    <Icon size={20} />
  </button>
);

const SidebarTool: React.FC<{ icon: any, label: string }> = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
     <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
       <Icon size={20} />
     </div>
     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);

const VehicleAction: React.FC<{ icon: any, label: string }> = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-1.5 group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-500 flex items-center justify-center border border-transparent group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg shadow-blue-200 transition-all">
      <Icon size={20} />
    </div>
    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600">{label}</span>
  </button>
);

const InfoStat: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</p>
    <p className="text-xs font-black text-slate-900">{value}</p>
  </div>
);

export default GPSTrackingView;
