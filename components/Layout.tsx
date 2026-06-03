
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Fuel,
  LogOut,
  ChevronRight,
  Menu,
  Bell,
  Wallet,
  Navigation,
  Settings,
  Database,
  Banknote,
  ReceiptText,
  Calculator,
  Coins,
  BellRing,
  ShieldCheck,
  Factory,
  FileSpreadsheet,
  Headphones,
  HeartPulse,
  Store
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  userName: string | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  userEmail,
  userName,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'alerts', label: 'Alert Hub', icon: BellRing, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'plant-hub', label: 'Plant Hub', icon: Factory, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'transport-orders', label: 'Transport Orders', icon: FileText, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'orders', label: 'Orders & Clients', icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'resources', label: 'Master Data', icon: Database, roles: [UserRole.ADMIN] },
    { id: 'workforce', label: 'Workforce Hub', icon: Users, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'fleet', label: 'Fleet Command', icon: Truck, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'gps-tracking', label: 'GPS Tracking', icon: Navigation, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
    { id: 'truck-health', label: 'Truck Health', icon: HeartPulse, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'fuel-management', label: 'Fuel Management', icon: Fuel, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'fleet-finance', label: 'Fleet Finance', icon: Coins, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'invoices', label: 'Billing Hub', icon: ReceiptText, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'accountability', label: 'Accountability', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    { id: 'driver-portal', label: 'Driver Portal', icon: Users, roles: [UserRole.DRIVER, UserRole.ADMIN] },
    { id: 'reports', label: 'Intelligence', icon: TrendingUp, roles: [UserRole.ADMIN] },
    { id: 'marketplace', label: 'Marketplace Store', icon: Store, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
    { id: 'support', label: 'Support System', icon: Headphones, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(activeRole));

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-xl shadow-slate-200/50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 rotate-3 group hover:rotate-0 transition-transform cursor-pointer">FA</div>
          {isSidebarOpen && <h1 className="text-xl font-black text-slate-900 tracking-tighter">FlyAsh Pro</h1>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              {item.id === 'alerts' && isSidebarOpen && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black text-white">!</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {isSidebarOpen && (
            <div className="flex flex-col gap-0.5 px-1">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Signed in as</span>
              <span className="text-xs font-black text-slate-700 truncate" title={userEmail}>
                {userName || userEmail}
              </span>
              {userName && <span className="text-[11px] font-bold text-slate-400 truncate">{userEmail}</span>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Current Session Role</label>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all"
            >
              <option value={UserRole.ADMIN}>Owner / Admin</option>
              <option value={UserRole.DRIVER}>Driver Mode</option>
              <option value={UserRole.ACCOUNTANT}>Accountant</option>
            </select>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 mt-4 text-slate-400 font-bold text-sm hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 p-2.5 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm active:scale-90">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Admin</span>
              <span className="text-sm font-black text-slate-900 leading-none">Operations Hub</span>
            </div>
            <button 
              onClick={() => setActiveTab('alerts')}
              className="text-slate-400 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 shadow-sm relative group"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="h-10 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-0.5 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full rounded-[14px] bg-white object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
