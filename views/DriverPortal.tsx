
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Upload, 
  Fuel, 
  CheckCircle2, 
  CircleDashed,
  IndianRupee,
  Navigation,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  QrCode,
  ShieldCheck,
  History,
  Wallet,
  Phone,
  MessageCircle,
  AlertOctagon,
  Clock,
  Zap,
  RotateCcw,
  FileText,
  User,
  Settings,
  MoreVertical,
  ChevronRight,
  Map as MapIcon,
  Sun,
  Moon,
  Volume2,
  Maximize,
  Briefcase,
  Scan,
  HeartPulse,
  Hammer,
  X,
  Menu,
  LayoutGrid,
  ScrollText,
  LogOut,
  // Fixed: Imported Truck from lucide-react as TruckIcon to avoid collision with the Truck type
  Truck as TruckIcon
} from 'lucide-react';
import { Order, Expense, ExpenseCategory, ExpenseStatus, AppSettings, TripStatus, Truck, Route } from '../types';
import { MOCK_TRUCKS, MOCK_SITES } from '../constants';
import { parseDieselBill } from '../services/geminiService';

interface DriverPortalProps {
  orders: Order[];
  routes: Route[];
  settings: AppSettings;
  onAddExpense: (exp: Expense) => void;
  onUpdateOrder?: (order: Order) => void;
}

const DriverPortal: React.FC<DriverPortalProps> = ({ orders, routes, settings, onAddExpense, onUpdateOrder }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'routes' | 'dispatch' | 'wallet' | 'support' | 'additional' | 'health'>('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showPodModal, setShowPodModal] = useState(false);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'NONE' | 'IN'>('NONE');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Simulated driver context
  const myTruck = MOCK_TRUCKS[0]; // GJ-01-AX-1234
  
  const myAssignedOrders = useMemo(() => 
    orders.filter(o => o.assignedTruckId === myTruck.id), 
  [orders, myTruck.id]);

  const currentTrip = useMemo(() => 
    myAssignedOrders.find(o => o.status === TripStatus.PICKED) || 
    myAssignedOrders.find(o => o.status === TripStatus.ASSIGNED), 
  [myAssignedOrders]);

  const upcomingAssignedTrips = useMemo(() => 
    myAssignedOrders.filter(o => o.id !== currentTrip?.id && o.status === TripStatus.ASSIGNED),
  [myAssignedOrders, currentTrip]);

  const completedTrips = useMemo(() => 
    myAssignedOrders.filter(o => o.status === TripStatus.DELIVERED || o.status === TripStatus.INVOICED || o.status === TripStatus.PAID), 
  [myAssignedOrders]);

  const availableLoads = useMemo(() => orders.filter(o => !o.assignedTruckId && o.status === TripStatus.CREATED), [orders]);

  // Self-Dispatch Simulation States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    siteId: '',
    truckId: myTruck.id,
    routeId: ''
  });

  const selectedRoute = useMemo(() => routes.find(r => r.id === dispatchForm.routeId), [dispatchForm.routeId, routes]);
  const calculatedDiesel = useMemo(() => {
    if (selectedRoute && myTruck) return (selectedRoute.distanceKm / myTruck.mileage).toFixed(2);
    return 0;
  }, [selectedRoute, myTruck]);

  // Expenses State
  const [dieselForm, setDieselForm] = useState({ pumpName: '', liters: 0, rate: 0, amount: 0 });

  const isLimitExceeded = useMemo(() => {
    if (!currentTrip?.estimatedDiesel) return false;
    return dieselForm.liters > currentTrip.estimatedDiesel;
  }, [dieselForm.liters, currentTrip]);

  // Feature: SOS Function
  const handleSOS = () => {
    if (confirm("SEND EMERGENCY ALERT TO CONTROL TOWER? GPS Coordinates will be sent immediately.")) {
      alert("SOS SENT. Dispatcher and Police notified. Help is on the way.");
    }
  };

  const handleDispatch = () => {
    if (!dispatchForm.siteId || !dispatchForm.routeId) return;
    const site = MOCK_SITES.find(s => s.id === dispatchForm.siteId);
    
    const newOrder: Order = {
      id: `DRV-SELF-${Date.now().toString().slice(-4)}`,
      clientName: 'Self Assigned',
      projectSite: site?.name || 'Assigned Site',
      quantity: 35,
      ratePerMT: 450,
      pickupDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      hasGST: true,
      paymentTerms: 'COD',
      status: TripStatus.ASSIGNED,
      assignedTruckId: myTruck.id,
      assignedRouteId: dispatchForm.routeId,
      totalKm: selectedRoute?.distanceKm,
      estimatedDiesel: Number(calculatedDiesel)
    };
    
    if (onUpdateOrder) {
      // In a real app, this would be onAddOrder, but we use what we have
      alert("New trip self-assigned and route locked!");
      setIsDispatchModalOpen(false);
    }
  };

  const handlePickUp = () => {
    if (!currentTrip || !onUpdateOrder) return;
    const updatedOrder: Order = {
      ...currentTrip,
      status: TripStatus.PICKED
    };
    onUpdateOrder(updatedOrder);
    alert("Fly Ash Picked Up! Trip status updated to PICKED.");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError(null);
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const data = await parseDieselBill(base64String);
          if (data) {
            setDieselForm({
              pumpName: data["Petrol Pump Name"] || '',
              liters: parseFloat(data["Liters"]) || 0,
              rate: parseFloat(data["Rate per Liter"]) || 0,
              amount: parseFloat(data["Total Amount"]) || 0,
            });
          } else {
            setScanError('Could not read the bill. Please enter the details manually.');
          }
        } catch {
          setScanError('Could not read the bill. Please enter the details manually.');
        }
        setIsScanning(false);
      };
      reader.onerror = () => {
        setScanError('Could not open the file. Please try a different image.');
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setScanError('Could not open the file. Please try a different image.');
      setIsScanning(false);
    }
  };

  return (
    <div className={`min-h-screen -m-8 transition-colors duration-500 ${isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F5F4F0] text-slate-900'}`}>
      <div className="max-w-md mx-auto pb-32">
        
        {/* TOP STATUS BAR */}
        <div className={`p-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md border-b transition-all ${isNightMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className={`p-2 rounded-xl transition-all ${isNightMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-[#F5F4F0] text-slate-500'}`}
              >
                <Menu size={24} />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">FA</div>
              <div>
                 <h2 className="font-black text-sm tracking-tight">Driver Portal</h2>
                 <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em]">Operational Console</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={() => setIsNightMode(!isNightMode)} className={`p-2 rounded-xl border transition-all ${isNightMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}`}>
                 {isNightMode ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <button onClick={handleSOS} className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 animate-pulse">
                 <AlertOctagon size={18}/>
              </button>
           </div>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 space-y-6">
                      {activeTab === 'home' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Driver Identity Card */}
                <div className={`p-6 rounded-2xl border-2 shadow-xl relative overflow-hidden transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><TruckIcon size={120}/></div>
                   <div className="relative z-10 flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 rounded-xl bg-blue-50 border-2 border-blue-500 p-0.5 shadow-xl">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" className="w-full h-full rounded-[1.2rem] object-cover" alt="Me" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black">Rajesh Kumar</h3>
                         <p className={`text-xs font-bold uppercase tracking-widest ${isNightMode ? 'text-blue-400' : 'text-blue-600'}`}>GJ-01-AX-1234</p>
                      </div>
                      <div className="ml-auto">
                        {attendanceStatus === 'NONE' ? (
                          <button onClick={() => { setIsPunchingIn(true); setTimeout(() => { setAttendanceStatus('IN'); setIsPunchingIn(false); }, 1500); }} className="flex flex-col items-center gap-1 group">
                             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-all shadow-lg shadow-green-100">
                                {isPunchingIn ? <RotateCcw size={20} className="animate-spin"/> : <Zap size={20}/>}
                             </div>
                             <span className="text-[9px] font-black uppercase">Punch In</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                             <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                                <CheckCircle2 size={24}/>
                             </div>
                             <span className="text-[9px] font-black uppercase text-green-500">Active</span>
                          </div>
                        )}
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <StatusPill label="FUEL EFF." value="4.2" unit="km/l" color="blue" />
                      <StatusPill label="SAFETY" value="92" unit="pts" color="green" />
                      <StatusPill label="RANK" value="#4" unit="global" color="amber" />
                   </div>
                </div>

                {/* QUICK STATS / DASHBOARD FEATURES */}
                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Clock size={20}/></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Duty Hours</p>
                      <p className="text-xl font-black">08:45 <span className="text-[10px] text-slate-400">h</span></p>
                   </div>
                   <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><IndianRupee size={20}/></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Today's Earn</p>
                      <p className="text-xl font-black">₹1,250</p>
                   </div>
                </div>

                {/* NOTIFICATIONS / ALERTS */}
                <div className={`p-6 rounded-2xl border-2 border-amber-100 bg-amber-50/30 flex items-center gap-4 ${isNightMode ? 'border-amber-900/30 bg-amber-900/10' : ''}`}>
                   <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <AlertTriangle size={24} />
                   </div>
                   <div>
                      <p className="text-xs font-black text-amber-900">Maintenance Alert</p>
                      <p className="text-[10px] font-bold text-amber-700 leading-tight">Truck service due in 450km. Please schedule soon.</p>
                   </div>
                </div>

                <button onClick={() => setActiveTab('routes')} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                   View My Routes <ChevronRight size={18} />
                </button>
             </div>
           )}

           {activeTab === 'routes' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                {/* SECTION: ON GOING ROUTE */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                         <Navigation size={16} /> On Going Route
                      </h3>
                      {currentTrip && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded uppercase animate-pulse">Live</span>}
                   </div>
                   
                   {currentTrip ? (
                     <div className={`rounded-2xl border-2 overflow-hidden shadow-xl transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-100'}`}>
                        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                           <div>
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Current Trip ID</p>
                              <h4 className="text-xl font-black">{currentTrip.id}</h4>
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => window.open(`tel:919876543210`)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"><Phone size={18}/></button>
                              <button onClick={() => setShowQr(true)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"><QrCode size={18}/></button>
                           </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                           {/* Route Progress Feature 1: Status Timeline */}
                           <div className="flex gap-4">
                              <div className="flex flex-col items-center gap-1 pt-1">
                                 <div className={`w-3 h-3 rounded-full border-2 ${currentTrip.status === TripStatus.ASSIGNED ? 'border-blue-600 bg-white' : 'bg-blue-600'}`}></div>
                                 <div className={`w-0.5 flex-1 ${currentTrip.status === TripStatus.PICKED ? 'bg-blue-600' : 'bg-slate-200'} rounded-full my-1`}></div>
                                 <div className={`w-3 h-3 rounded-full border-2 ${currentTrip.status === TripStatus.PICKED ? 'border-blue-600 bg-white' : 'bg-slate-200'}`}></div>
                              </div>
                              <div className="flex-1 space-y-6">
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-slate-400">Pickup</p>
                                       <p className="text-sm font-black leading-tight">Wanakbori TPS</p>
                                    </div>
                                    {currentTrip.status !== TripStatus.ASSIGNED && <CheckCircle2 size={16} className="text-green-500" />}
                                 </div>
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-slate-400">Drop-off</p>
                                       <p className="text-sm font-black leading-tight">{currentTrip.projectSite}</p>
                                    </div>
                                    <button onClick={() => window.open(`https://maps.google.com/?q=${currentTrip.projectSite}`)} className="text-blue-600"><Navigation size={16}/></button>
                                 </div>
                              </div>
                           </div>

                           {/* Feature 2: Live ETA & Speed (Simulated) */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase">Est. Arrival</p>
                                 <p className="text-sm font-black text-slate-900">14:30 <span className="text-[10px] text-blue-500">(+15m)</span></p>
                              </div>
                              <div className="p-4 bg-[#F5F4F0] rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase">Current Speed</p>
                                 <p className="text-sm font-black text-slate-900">42 <span className="text-[10px] text-slate-400">km/h</span></p>
                              </div>
                           </div>

                           {/* Feature 3: Action Buttons */}
                           <div className="grid grid-cols-2 gap-3">
                              <button onClick={handlePickUp} disabled={currentTrip.status !== TripStatus.ASSIGNED} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentTrip.status === TripStatus.ASSIGNED ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                 <Zap size={14} /> Pick Up
                              </button>
                              <button onClick={() => setShowPodModal(true)} disabled={currentTrip.status !== TripStatus.PICKED} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentTrip.status === TripStatus.PICKED ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                 <ShieldCheck size={14} /> Deliver
                              </button>
                           </div>

                           {/* Feature 4: Hazard & SOS */}
                           <div className="flex gap-2">
                              <button onClick={() => alert("Hazard Reported")} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase border border-red-100">Report Hazard</button>
                              <button onClick={handleSOS} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">SOS Emergency</button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="p-8 text-center bg-[#F5F4F0] rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase">No active route found</p>
                     </div>
                   )}
                </div>

                {/* SECTION: UPCOMING ASSIGNED ROUTES (Queued by Admin) */}
                 {upcomingAssignedTrips.length > 0 && (
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2 px-2">
                        <Briefcase size={16} /> Queued Trips ({upcomingAssignedTrips.length})
                     </h3>
                     <div className="space-y-4">
                        {upcomingAssignedTrips.map(trip => (
                          <div key={trip.id} className={`p-6 rounded-2xl border-2 shadow-lg transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-50 hover:border-indigo-200'}`}>
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded uppercase">Assigned</span>
                                      <p className="t-label leading-none">ID: {trip.id}</p>
                                   </div>
                                   <h4 className="text-lg font-black">{trip.projectSite}</h4>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-slate-400 uppercase">Load</p>
                                   <p className="text-sm font-black text-slate-900">{trip.quantity} MT</p>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-3 p-3 bg-[#F5F4F0] rounded-xl border border-slate-100 mb-4">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm"><MapIcon size={16}/></div>
                                <div className="flex-1">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Route Info</p>
                                   <p className="text-[11px] font-bold">Wanakbori ➔ {trip.projectSite}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Pickup Date</p>
                                   <p className="text-[11px] font-bold">{trip.pickupDate}</p>
                                </div>
                             </div>

                             <button onClick={() => alert("This trip is scheduled after your active route.")} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View Schedule</button>
                          </div>
                        ))}
                     </div>
                  </div>
                 )}

                 {/* SECTION: AVAILABLE LOAD BOARD (Open Market) */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                      <Scan size={16} /> Open Load Board
                   </h3>
                   
                   {availableLoads.length > 0 ? (
                     <div className="space-y-4">
                        {availableLoads.slice(0, 2).map(trip => (
                          <div key={trip.id} className={`p-6 rounded-2xl border-2 shadow-lg transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-50'}`}>
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                   <p className="t-label leading-none">Market Pool</p>
                                   <h4 className="text-lg font-black">{trip.projectSite}</h4>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-slate-400 uppercase">Est. Pay</p>
                                   <p className="text-sm font-black text-green-600">₹{trip.quantity * 12}</p>
                                </div>
                             </div>
                             
                             {/* Feature 5: Route Preview */}
                             <div className="flex items-center gap-3 p-3 bg-[#F5F4F0] rounded-xl border border-slate-100 mb-4">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm"><MapIcon size={16}/></div>
                                <div className="flex-1">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Route Info</p>
                                   <p className="text-[11px] font-bold">Wanakbori ➔ {trip.projectSite}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[9px] font-black text-slate-400 uppercase">Distance</p>
                                   <p className="text-[11px] font-bold">145 KM</p>
                                </div>
                             </div>

                             {/* Feature 6: Accept/Reject */}
                             <div className="flex gap-3">
                                <button onClick={() => alert("Trip Requested from Pool")} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Request Load</button>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="p-8 text-center bg-[#F5F4F0] rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase">No upcoming routes</p>
                        <button onClick={() => setIsDispatchModalOpen(true)} className="mt-4 text-[10px] font-black text-blue-600 uppercase underline">Request New Load</button>
                     </div>
                   )}
                </div>

                {/* SECTION: COMPLETED ROUTES */}
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-2">
                      <History size={16} /> Completed Routes
                   </h3>
                   
                   <div className="space-y-3">
                      {completedTrips.length > 0 ? completedTrips.slice(0, 3).map(trip => (
                        <div key={trip.id} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                                 <CheckCircle2 size={20} />
                              </div>
                              <div>
                                 <p className="text-xs font-black">{trip.projectSite}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">{trip.deliveryDate} • {trip.quantity} MT</p>
                              </div>
                           </div>
                           <div className="text-right">
                              {/* Feature 7: Performance Rating */}
                              <div className="flex gap-0.5 mb-1">
                                 {[1,2,3,4,5].map(s => <Sparkles key={s} size={8} className={s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />)}
                              </div>
                              <p className="text-[10px] font-black text-green-600">+₹{trip.quantity * 10}</p>
                           </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center bg-[#F5F4F0] rounded-2xl border border-slate-100">
                           <p className="text-xs font-bold text-slate-400 uppercase">No history yet</p>
                        </div>
                      )}
                   </div>
                   
                   {completedTrips.length > 0 && (
                     <button className="w-full py-3 t-label hover:text-blue-600 transition-colors">
                        View Full History
                     </button>
                   )}
                </div>
             </div>
           )}

           {activeTab === 'dispatch' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                {/* DIESEL WORKFLOW (Module 3) */}
                <div className={`p-8 rounded-2xl border-2 shadow-xl ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="flex items-center justify-between mb-8">
                      <div>
                         <h3 className="text-xl font-black">Diesel Management</h3>
                         <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">Smart Log & AI Extraction</p>
                      </div>
                      {currentTrip?.estimatedDiesel && (
                        <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 text-[10px] font-black uppercase">
                           Trip Cap: {currentTrip.estimatedDiesel}L
                        </div>
                      )}
                   </div>

                   <form onSubmit={(e) => { e.preventDefault(); alert("Diesel logged. Waiting for Admin verification."); setActiveTab('home'); }} className="page-stack pb-10">
                      <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden ${isScanning ? 'bg-slate-100' : 'bg-blue-50/20 border-blue-200 hover:bg-blue-50'}`}
                      >
                         {isScanning ? (
                            <>
                               <Loader2 size={40} className="text-blue-600 animate-spin" />
                               <span className="text-xs font-black uppercase tracking-widest">AI Audit in Progress...</span>
                            </>
                         ) : (
                            <>
                               <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600">
                                  <Sparkles size={32} />
                               </div>
                               <div className="text-center">
                                  <span className="text-base font-black block">Scan Fuel Bill</span>
                                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-2">Computer Vision Active</span>
                               </div>
                            </>
                         )}
                      </button>

                      {scanError && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                          {scanError}
                        </div>
                      )}

                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <label className="t-label px-1">Petrol Pump / Vendor</label>
                            <input type="text" className={`w-full px-6 py-4 rounded-2xl font-bold outline-none transition-all ${isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#F5F4F0] border-slate-200 focus:border-blue-500'}`} placeholder="e.g. Indian Oil Corporation" value={dieselForm.pumpName} onChange={e => setDieselForm({...dieselForm, pumpName: e.target.value})} required />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                               <label className="t-label px-1">Liters</label>
                               <div className="relative">
                                  <input type="number" step="0.01" className={`w-full px-6 py-4 rounded-2xl font-black outline-none ${isLimitExceeded ? 'bg-red-50 border-red-300 text-red-600' : isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#F5F4F0] border-slate-200'}`} value={dieselForm.liters || ''} onChange={e => setDieselForm({...dieselForm, liters: Number(e.target.value)})} required />
                                  {isLimitExceeded && <AlertTriangle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" />}
                               </div>
                            </div>
                            <div className="space-y-1.5">
                               <label className="t-label px-1">Total ₹</label>
                               <input type="number" className={`w-full px-6 py-4 rounded-2xl font-black text-blue-600 outline-none ${isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#F5F4F0] border-slate-200'}`} value={dieselForm.amount || ''} onChange={e => setDieselForm({...dieselForm, amount: Number(e.target.value)})} required />
                            </div>
                         </div>
                      </div>

                      {isLimitExceeded && (
                         <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="text-red-600 shrink-0" size={20} />
                            <div>
                               <p className="text-xs font-black text-red-900 uppercase">Limit Flagged</p>
                               <p className="text-[10px] font-bold text-red-700 leading-tight mt-1">This request exceeds the {currentTrip?.estimatedDiesel}L cap. Please state reason for extra consumption.</p>
                            </div>
                         </div>
                      )}

                      <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                         Submit Fuel Record
                      </button>
                   </form>
                </div>
             </div>
           )}

           {activeTab === 'wallet' && (
             <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="p-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><IndianRupee size={160}/></div>
                   <div className="relative z-10 space-y-10">
                      <div>
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Live Balance</p>
                         <h4 className="text-5xl font-black tracking-tighter">₹12,450</h4>
                         <p className="text-[10px] font-bold mt-1 text-blue-200">Current Trip Commission Hub</p>
                      </div>
                      <div className="flex gap-4">
                         <button className="flex-1 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all">Withdraw</button>
                         <button className="flex-1 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md">Ledger</button>
                      </div>
                   </div>
                </div>

                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                      <History size={18} className="text-blue-500" /> Recent Payouts
                   </h3>
                   <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-[#F5F4F0]/30 rounded-2xl border border-slate-100/10">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Zap size={20}/></div>
                              <div>
                                 <p className="text-xs font-black">Commission #SAL-{i}04</p>
                                 <p className="text-[10px] font-bold text-slate-400">Feb {10 + i}, 2026</p>
                              </div>
                           </div>
                           <p className="text-sm font-black text-green-600">+₹{1500 + (i * 200)}</p>
                        </div>
                      ))}
                   </div>
                </div>
           </div>
        )}

        {activeTab === 'health' && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                {/* Truck Identity Health Card */}
                <div className={`p-8 rounded-2xl border-2 shadow-xl relative overflow-hidden transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><TruckIcon size={120}/></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <TruckIcon size={28} />
                         </div>
                         <div>
                            <h3 className="text-xl font-black">{myTruck.plateNumber}</h3>
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">Vehicle Health Status</p>
                         </div>
                         <div className="ml-auto text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</p>
                            <div className="text-2xl font-black text-emerald-500">94<span className="text-xs">/100</span></div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <span>Diagnostics Sync</span>
                               <span>Optimal</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 w-[94%] transition-all duration-1000" />
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <div className={`p-4 rounded-2xl border transition-all ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100'}`}>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Current ODO</p>
                               <p className="text-sm font-black">{myTruck.currentOdometer.toLocaleString()} KM</p>
                            </div>
                            <div className={`p-4 rounded-2xl border transition-all ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100'}`}>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Maint. Due</p>
                               <p className="text-sm font-black text-amber-500">450 KM</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Component System Checks */}
                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Zap size={18} className="text-blue-500" /> System Integrity
                   </h3>
                   <div className="grid grid-cols-1 gap-4">
                      <HealthComponent label="Engine Performance" status="OPTIMAL" value="88%" icon={Zap} night={isNightMode} />
                      <HealthComponent label="Braking System" status="GOOD" value="92%" icon={CircleDashed} night={isNightMode} />
                      <HealthComponent label="Transmission" status="OPTIMAL" value="95%" icon={RotateCcw} night={isNightMode} />
                      <HealthComponent label="Electrical / Battery" status="WARNING" value="12.2V" icon={Fuel} night={isNightMode} />
                   </div>
                </div>

                {/* Tyre Health Visualizer */}
                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                       <CircleDashed size={18} className="text-blue-500" /> Tyre Condition
                   </h3>
                   <div className="flex flex-col items-center">
                       <div className="w-16 h-32 border-4 border-slate-200 rounded-xl relative mb-4">
                          <div className="absolute -left-6 top-2 w-4 h-8 bg-emerald-500 rounded-lg shadow-lg border-2 border-white" />
                          <div className="absolute -right-6 top-2 w-4 h-8 bg-emerald-500 rounded-lg shadow-lg border-2 border-white" />
                          <div className="absolute -left-6 bottom-2 w-4 h-8 bg-amber-500 rounded-lg shadow-lg border-2 border-white" />
                          <div className="absolute -right-6 bottom-2 w-4 h-8 bg-emerald-500 rounded-lg shadow-lg border-2 border-white" />
                       </div>
                       <p className="t-label">Axle Distribution Map</p>
                       
                       <div className="w-full mt-6 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-500">Front Left</span>
                             <span className="font-black text-emerald-600">8.5mm (New)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-500">Front Right</span>
                             <span className="font-black text-emerald-600">8.2mm (New)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-500">Rear Left</span>
                             <span className="font-black text-amber-600">4.5mm (Wear)</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-500">Rear Right</span>
                             <span className="font-black text-emerald-600">7.8mm (Good)</span>
                          </div>
                       </div>
                   </div>
                </div>

                {/* Important Documents Expiry */}
                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                       <FileText size={18} className="text-blue-500" /> Compliance Vault
                   </h3>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className="text-emerald-500" />
                            <span className="text-xs font-black">Insurance Policy</span>
                         </div>
                         <span className="text-[10px] font-black text-emerald-600 uppercase">Valid</span>
                      </div>
                      <div className={`flex items-center justify-between p-4 rounded-2xl border ${isNightMode ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
                         <div className="flex items-center gap-3">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <span className="text-xs font-black">PUC Renewal</span>
                         </div>
                         <span className="text-[10px] font-black text-amber-600 uppercase">Exp in 12 Days</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <span className="text-xs font-black">Fitness Cert.</span>
                         </div>
                         <span className="text-[10px] font-black text-emerald-600 uppercase">Valid</span>
                      </div>
                   </div>
                </div>
             </div>
        )}

        {activeTab === 'support' && (
             <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className={`p-10 rounded-2xl border-2 text-center transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Phone size={40} />
                   </div>
                   <h3 className="text-2xl font-black">Emergency Help Desk</h3>
                   <p className="text-slate-500 text-sm mt-2 leading-relaxed">Direct 24/7 line to FlyAsh Logistics Command Center for road-side assistance, tyre changes, or medical needs.</p>
                   <div className="grid grid-cols-2 gap-4 mt-10">
                      <button onClick={() => window.open('tel:1800123456')} className="py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
                         <Phone size={18}/> Call Support
                      </button>
                      <button onClick={() => window.open('https://wa.me/919876543210')} className="py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2">
                         <MessageCircle size={18}/> WhatsApp
                      </button>
                   </div>
                </div>

                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6">Asset Documents</h3>
                   <div className="space-y-3">
                      <DocLink icon={FileText} label="Truck Registration (RC)" date="Exp: 2027" />
                      <DocLink icon={ShieldCheck} label="Insurance Policy" date="Exp: 2026" />
                      <DocLink icon={Hammer} label="Fitness Certificate" date="Exp: 2026" />
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'additional' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                         <LayoutGrid size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black">Additional Services</h3>
                         <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Extended Driver Tools</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      <div className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100'}`}>
                         <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
                            <ScrollText size={20} />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black">Training Modules</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety & Compliance</p>
                         </div>
                         <ChevronRight size={16} className="text-slate-300" />
                      </div>

                      <div className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100'}`}>
                         <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black">Insurance Claims</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Service Portal</p>
                         </div>
                         <ChevronRight size={16} className="text-slate-300" />
                      </div>

                      <div className={`p-6 rounded-2xl border transition-all flex items-center gap-4 ${isNightMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100'}`}>
                         <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-[1.2rem] flex items-center justify-center shrink-0">
                            <History size={20} />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black">Attendance Logs</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Summary</p>
                         </div>
                         <ChevronRight size={16} className="text-slate-300" />
                      </div>
                   </div>
                </div>

                <div className={`p-8 rounded-2xl border-2 transition-all ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6">Announcements</h3>
                   <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-blue-50/30 border border-blue-100/20">
                         <p className="text-xs font-black text-blue-600 mb-1">New Performance Bonus Plan</p>
                         <p className="text-[10px] font-bold text-slate-500 leading-tight">Effective from next month, top 10 driers will get additional ₹5,000 monthly bonus.</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/20">
                         <p className="text-xs font-black text-amber-600 mb-1">Road Closure: NH-48</p>
                         <p className="text-[10px] font-bold text-slate-500 leading-tight">Construction near Surat. Use SH-12 detour for next 3 days.</p>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* BOTTOM NAV BAR */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t z-50 flex items-center justify-center backdrop-blur-xl transition-all ${isNightMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
           <div className={`flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl ${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-[#F5F4F0]'}`}>
              <NavBtn active={activeTab === 'home'} icon={Maximize} label="Home" onClick={() => setActiveTab('home')} night={isNightMode} />
              <NavBtn active={activeTab === 'routes'} icon={Navigation} label="Routes" onClick={() => setActiveTab('routes')} night={isNightMode} />
              <NavBtn active={activeTab === 'health'} icon={HeartPulse} label="Health" onClick={() => setActiveTab('health')} night={isNightMode} />
              <NavBtn active={activeTab === 'wallet'} icon={Wallet} label="Earn" onClick={() => setActiveTab('wallet')} night={isNightMode} />
              <NavBtn active={activeTab === 'support'} icon={Info} label="Help" onClick={() => setActiveTab('support')} night={isNightMode} />
           </div>
        </div>

        {/* QR MODAL */}
        {showQr && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-sm rounded-[4rem] p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-900">Gate Pass QR</h3>
                   <button onClick={() => setShowQr(false)} className="p-2 hover:bg-[#F5F4F0] rounded-full transition-all"><X size={24}/></button>
                </div>
                <div className="p-6 bg-[#F5F4F0] rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center">
                   <QrCode size={200} className="text-slate-900 opacity-80" />
                </div>
                <div className="space-y-2">
                   <p className="text-xs font-black uppercase text-blue-600">Scan at Entry Gate</p>
                   <p className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-tighter">Validated for Wanakbori TPS Terminal</p>
                </div>
                <button onClick={() => setShowQr(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Done</button>
             </div>
          </div>
        )}

        {/* SELF DISPATCH MODAL (Route Planning Features) */}
        {isDispatchModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
                   <div>
                      <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">Self-Dispatch Trip</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Route Planning & Simulation</p>
                   </div>
                   <button onClick={() => setIsDispatchModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={24}/></button>
                </div>
                
                <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
                   <div className="space-y-3">
                      <label className="t-label px-1">Define Route*</label>
                      <select className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black text-sm" value={dispatchForm.routeId} onChange={e => setDispatchForm({...dispatchForm, routeId: e.target.value})}>
                         <option value="">Select Pickup ➔ Destination</option>
                         {routes.map(r => <option key={r.id} value={r.id}>{r.source} ➔ {r.destination}</option>)}
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="t-label px-1">Delivery Site*</label>
                         <select className="w-full px-6 py-4 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black text-sm" value={dispatchForm.siteId} onChange={e => setDispatchForm({...dispatchForm, siteId: e.target.value})}>
                            <option value="">Choose Hub...</option>
                            {MOCK_SITES.filter(s => s.type === 'CLIENT_SITE').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="t-label px-1">Asset Assigned</label>
                         <div className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-black text-sm text-slate-500">
                            {myTruck.truckNumber}
                         </div>
                      </div>
                   </div>

                   {selectedRoute && (
                     <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-2xl space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl"><MapIcon size={24}/></div>
                              <div>
                                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Calculated Distance</p>
                                 <p className="text-xl font-black text-blue-900">{selectedRoute.distanceKm} KM</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Est. Consumption</p>
                              <p className="text-xl font-black text-blue-900">{calculatedDiesel} Liters</p>
                           </div>
                        </div>
                        <div className="h-1.5 w-full bg-blue-200/50 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-600 w-full animate-progress" />
                        </div>
                        <p className="text-[10px] font-bold text-blue-800 text-center uppercase tracking-tighter opacity-70">Logistics logic based on Fleet Avg: {myTruck.mileage} KM/L</p>
                     </div>
                   )}

                   <button onClick={handleDispatch} disabled={!selectedRoute || !dispatchForm.siteId} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs disabled:bg-slate-200 disabled:shadow-none">
                      Lock Route & Start Trip
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* POD MODAL */}
        {showPodModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-sm rounded-[4rem] p-10 text-center space-y-8 animate-in slide-in-from-bottom-10 duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><ShieldCheck size={48}/></div>
                <div>
                   <h3 className="text-2xl font-black">Electronic POD</h3>
                   <p className="text-slate-500 text-sm mt-2">Please upload a photo of the signed delivery challan and ask the site manager to sign on the screen.</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <button className="py-5 bg-[#F5F4F0] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 group hover:bg-blue-50 transition-all">
                      <Camera size={24} className="text-slate-400 group-hover:text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capture Challan</span>
                   </button>
                   <div className="h-32 bg-[#F5F4F0] rounded-2xl border-2 border-slate-100 flex items-center justify-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sign Area (Digital)</p>
                   </div>
                </div>
                <button onClick={() => {
                  if (!currentTrip || !onUpdateOrder) return;
                  const updatedOrder: Order = {
                    ...currentTrip,
                    status: TripStatus.DELIVERED
                  };
                  onUpdateOrder(updatedOrder);
                  setShowPodModal(false);
                  alert("Trip status updated to DELIVERED. Digital records archived.");
                }} className="w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all">Submit Delivery Packet</button>
             </div>
          </div>
        )}

        {/* SIDE MENU DRAWER */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
             <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <div className={`relative w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 ${isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
                <div className="p-8 pb-6 border-b border-slate-100/10 mb-6 mt-4">
                   <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg">FA</div>
                      <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-xl transition-all ${isNightMode ? 'bg-slate-800 text-slate-400' : 'bg-[#F5F4F0] text-slate-400'}`}><X size={20}/></button>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-500 p-0.5 shadow-xl">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" className="w-full h-full rounded-[1.2rem] object-cover" alt="Me" />
                      </div>
                      <div>
                         <h3 className="text-lg font-black leading-tight">Rajesh Kumar</h3>
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">GJ-01-AX-1234</p>
                      </div>
                   </div>
                </div>

                <div className="flex-1 p-6 space-y-2 overflow-y-auto">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Main Menu</p>
                   <MenuLink icon={Maximize} label="Dashboard" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={Navigation} label="Route Map" active={activeTab === 'routes'} onClick={() => { setActiveTab('routes'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={Fuel} label="Fleet & Diesel" active={activeTab === 'dispatch'} onClick={() => { setActiveTab('dispatch'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={Wallet} label="Earnings" active={activeTab === 'wallet'} onClick={() => { setActiveTab('wallet'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={HeartPulse} label="Truck Health" active={activeTab === 'health'} onClick={() => { setActiveTab('health'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={LayoutGrid} label="Additional Page" active={activeTab === 'additional'} onClick={() => { setActiveTab('additional'); setIsMenuOpen(false); }} night={isNightMode} />
                   <MenuLink icon={Info} label="Emergency Support" active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setIsMenuOpen(false); }} night={isNightMode} />
                   
                   <div className="pt-8 mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">System</p>
                      <MenuLink icon={Settings} label="App Settings" active={false} onClick={() => { alert("Settings loaded"); setIsMenuOpen(false); }} night={isNightMode} />
                      <MenuLink icon={LogOut} label="Log Out" active={false} onClick={() => confirm("Log out of Driver Portal?")} night={isNightMode} />
                   </div>
                </div>

                <div className="p-8 border-t border-slate-100/10">
                   <div className={`p-4 rounded-2xl flex items-center gap-3 ${isNightMode ? 'bg-slate-900' : 'bg-[#F5F4F0]'}`}>
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><ShieldCheck size={16}/></div>
                      <div>
                         <p className="text-[10px] font-black uppercase transition-all">Verified Identity</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter transition-all">Terminal Pass Active</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const HealthComponent: React.FC<{ label: string, status: 'OPTIMAL' | 'GOOD' | 'WARNING' | 'CRITICAL', value: string, icon: any, night: boolean }> = ({ label, status, value, icon: Icon, night }) => {
   const colors = {
      OPTIMAL: 'text-emerald-500 bg-emerald-50',
      GOOD: 'text-blue-500 bg-blue-50',
      WARNING: 'text-amber-500 bg-amber-50',
      CRITICAL: 'text-red-500 bg-red-50'
   };
   
   return (
      <div className={`p-5 rounded-2xl border flex items-center justify-between group transition-all ${night ? 'bg-slate-950/50 border-slate-800' : 'bg-[#F5F4F0]/50 border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50'}`}>
         <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${night ? 'bg-slate-900 text-slate-400' : colors[status]}`}>
               <Icon size={18} />
            </div>
            <div>
               <p className="text-xs font-black">{label}</p>
               <p className={`text-[9px] font-black uppercase tracking-widest ${night ? 'text-slate-500' : 'opacity-70'}`}>{status}</p>
            </div>
         </div>
         <p className="text-sm font-black text-slate-900">{value}</p>
      </div>
   );
};

const MenuLink: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void, night: boolean }> = ({ icon: Icon, label, active, onClick, night }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
      active 
        ? (night ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-blue-600 text-white shadow-xl shadow-blue-100') 
        : (night ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-[#F5F4F0]')
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const StatusPill: React.FC<{ label: string, value: string, unit: string, color: 'blue' | 'green' | 'amber' }> = ({ label, value, unit, color }) => {
   const colors = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      amber: 'text-amber-500'
   };
   return (
      <div className="text-center p-3 rounded-2xl bg-[#F5F4F0]/50 border border-slate-100/10">
         <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{label}</p>
         <p className={`text-xl font-black tracking-tighter ${colors[color]}`}>{value}</p>
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{unit}</p>
      </div>
   );
};

const ActionButton: React.FC<{ icon: any, label: string, onClick: () => void, color: 'blue' | 'slate' | 'amber' | 'red' }> = ({ icon: Icon, label, onClick, color }) => {
   const variants = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
      slate: 'bg-[#F5F4F0] text-slate-600 border-slate-200 hover:bg-slate-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
      red: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
   };
   return (
      <button onClick={onClick} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all active:scale-95 group ${variants[color]}`}>
         <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
            <Icon size={24} strokeWidth={2.5} />
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
      </button>
   );
};

const NavBtn: React.FC<{ active: boolean, icon: any, label: string, onClick: () => void, night?: boolean }> = ({ active, icon: Icon, label, onClick, night }) => (
   <button onClick={onClick} className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-full transition-all ${
      active 
        ? (night ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105') 
        : (night ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
   }`}>
      <Icon size={20} strokeWidth={active ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
   </button>
);

const DocLink: React.FC<{ icon: any, label: string, date: string }> = ({ icon: Icon, label, date }) => (
   <div className="flex items-center justify-between p-4 bg-[#F5F4F0]/50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all group">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Icon size={20}/></div>
         <div>
            <p className="text-xs font-black text-slate-900">{label}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{date}</p>
         </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
   </div>
);

export default DriverPortal;
