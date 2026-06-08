
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, FileText, TrendingUp, Users, Fuel,
  LogOut, Menu, Bell, Navigation, Settings, Database, ReceiptText,
  Coins, BellRing, ShieldCheck, Factory, FileSpreadsheet,
  Headphones, HeartPulse, Store, ChevronDown,
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeTab: string;
  userEmail: string;
  userName: string | null;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  items: NavItem[];
}

// Standalone top-level items (no group)
const topItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
];

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    icon: FileSpreadsheet,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    items: [
      { id: 'transport-orders', label: 'Transport Orders', icon: FileText,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'orders',           label: 'Orders & Clients', icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'alerts',           label: 'Alert Hub',         icon: BellRing,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT], badge: true },
      { id: 'plant-hub',        label: 'Plant Hub',         icon: Factory,         roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    ],
  },
  {
    label: 'Fleet',
    icon: Truck,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER],
    items: [
      { id: 'fleet',           label: 'Fleet Command',  icon: Truck,       roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'gps-tracking',    label: 'GPS Tracking',   icon: Navigation,  roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
      { id: 'truck-health',    label: 'Truck Health',   icon: HeartPulse,  roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'fuel-management', label: 'Fuel Management',icon: Fuel,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    ],
  },
  {
    label: 'Finance',
    icon: ReceiptText,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    items: [
      { id: 'invoices',       label: 'Billing Hub',    icon: ReceiptText, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'fleet-finance',  label: 'Fleet Finance',  icon: Coins,       roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'accountability', label: 'Accountability', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    ],
  },
  {
    label: 'Workforce',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER],
    items: [
      { id: 'workforce',     label: 'Workforce Hub', icon: Users, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'driver-portal', label: 'Driver Portal', icon: Users, roles: [UserRole.DRIVER, UserRole.ADMIN] },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    roles: [UserRole.ADMIN],
    items: [
      { id: 'reports',    label: 'Intelligence', icon: TrendingUp, roles: [UserRole.ADMIN] },
      { id: 'resources',  label: 'Master Data',  icon: Database,   roles: [UserRole.ADMIN] },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER],
    items: [
      { id: 'marketplace', label: 'Marketplace', icon: Store,      roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
      { id: 'support',     label: 'Support',     icon: Headphones, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
      { id: 'settings',    label: 'Settings',    icon: Settings,   roles: [UserRole.ADMIN] },
    ],
  },
];

const Layout: React.FC<LayoutProps> = ({
  children, activeRole, setActiveRole, activeTab, userEmail, userName, onLogout,
}) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Find which group contains the active tab so it starts open
  const defaultOpenGroup = navGroups.find(g => g.items.some(i => i.id === activeTab))?.label ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(defaultOpenGroup);

  const visibleTopItems = topItems.filter(i => i.roles.includes(activeRole));

  const visibleGroups = navGroups
    .filter(g => g.roles.includes(activeRole))
    .map(g => ({
      ...g,
      items: g.items.filter(i => i.roles.includes(activeRole)),
    }))
    .filter(g => g.items.length > 0);

  const activeLabel = [
    ...topItems,
    ...navGroups.flatMap(g => g.items),
  ].find(i => i.id === activeTab)?.label ?? activeTab.replace(/-/g, ' ');

  const toggleGroup = (label: string) => {
    if (collapsed) return; // when sidebar is icon-only, ignore toggle
    setOpenGroup(prev => (prev === label ? null : label));
  };

  return (
    // h-screen + overflow-hidden on the root: nothing can grow taller than viewport
    <div className="flex h-screen overflow-hidden bg-[#F5F4F0]">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      {/* h-screen + flex-col: sidebar is always exactly one screen tall */}
      <aside className={`
        ${collapsed ? 'w-17' : 'w-60'}
        h-screen flex flex-col shrink-0
        bg-white border-r border-[#E7E5E0]
        transition-all duration-250
        shadow-[2px_0_12px_rgba(0,0,0,0.04)]
        z-20
      `}>

        {/* Logo — fixed height, never shrinks */}
        <div className="h-16 flex items-center px-4 border-b border-[#F0EEE9] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-[13px] shrink-0 shadow-md shadow-blue-500/25">
              FA
            </div>
            {!collapsed && (
              <div className="leading-none min-w-0">
                <p className="text-[14px] font-black text-[#1C1917] tracking-tight truncate">FlyAsh Pro</p>
                <p className="text-[9px] font-semibold text-[#A8A29E] uppercase tracking-widest mt-0.5">Logistics</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav — flex-1 + overflow-y-auto: nav scrolls inside sidebar if needed */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-3 space-y-0.5">

          {/* Standalone top items */}
          {visibleTopItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <NavBtn
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                collapsed={collapsed}
                onClick={() => navigate('/' + item.id)}
              />
            );
          })}

          {/* Grouped items */}
          {visibleGroups.map(group => {
            const isGroupActive = group.items.some(i => i.id === activeTab);
            const isOpen = openGroup === group.label;

            return (
              <div key={group.label}>
                {/* Group header button */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  title={collapsed ? group.label : undefined}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl
                    transition-all duration-150
                    ${isGroupActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-[#57534E] hover:bg-[#F5F4F0] hover:text-[#1C1917]'
                    }
                  `}
                >
                  <group.icon
                    size={17}
                    strokeWidth={isGroupActive ? 2.5 : 1.8}
                    className="shrink-0"
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-[13px] font-semibold tracking-tight truncate">
                        {group.label}
                      </span>
                      <ChevronDown
                        size={13}
                        className={`shrink-0 text-[#A8A29E] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {/* Sub-items — only shown when open and not collapsed */}
                {!collapsed && isOpen && (
                  <div className="mt-0.5 ml-3.5 pl-3 border-l border-[#F0EEE9] space-y-0.5 mb-1">
                    {group.items.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate('/' + item.id)}
                          className={`
                            w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                            transition-all duration-150 relative
                            ${isActive
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'text-[#57534E] hover:bg-[#F5F4F0] hover:text-[#1C1917]'
                            }
                          `}
                        >
                          <item.icon
                            size={15}
                            strokeWidth={isActive ? 2.5 : 1.8}
                            className="shrink-0"
                          />
                          <span className="text-[12px] font-semibold tracking-tight truncate flex-1 text-left">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border ${isActive ? 'bg-white text-blue-600 border-blue-100' : 'bg-red-500 text-white border-red-500'}`}>
                              !
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer — fixed height, never shrinks */}
        <div className="shrink-0 border-t border-[#F0EEE9] p-2.5 space-y-1.5">
          {!collapsed && (
            <>
              <div className="px-2.5 py-2 rounded-xl bg-[#FAFAF8] border border-[#F0EEE9]">
                <p className="text-[9px] font-bold text-[#A8A29E] uppercase tracking-widest mb-0.5">Signed in as</p>
                <p className="text-[12px] font-bold text-[#1C1917] truncate">{userName || userEmail}</p>
                {userName && <p className="text-[10px] text-[#A8A29E] truncate">{userEmail}</p>}
              </div>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="w-full bg-white border border-[#E7E5E0] rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#57534E] outline-none focus:ring-2 focus:ring-blue-500/15 cursor-pointer"
              >
                <option value={UserRole.ADMIN}>Owner / Admin</option>
                <option value={UserRole.DRIVER}>Driver</option>
                <option value={UserRole.ACCOUNTANT}>Accountant</option>
              </select>
            </>
          )}
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#A8A29E] text-[12px] font-semibold hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={15} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      {/* h-screen + overflow-hidden on main: header is sticky, content scrolls */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">

        {/* Header — fixed height, never scrolls away */}
        <header className="h-16 shrink-0 bg-white border-b border-[#E7E5E0] flex items-center justify-between px-5 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-2 rounded-lg text-[#A8A29E] hover:bg-[#F5F4F0] hover:text-[#1C1917] transition-all active:scale-90"
            >
              <Menu size={19} strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-blue-600" />
              <h2 className="text-[15px] font-black text-[#1C1917] capitalize tracking-tight">{activeLabel}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 rounded-lg text-[#A8A29E] hover:bg-[#F5F4F0] hover:text-[#1C1917] transition-all"
            >
              <Bell size={17} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </button>

            <div className="w-px h-7 bg-[#E7E5E0] mx-1" />

            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Admin</p>
                <p className="text-[12px] font-black text-[#1C1917] leading-tight mt-0.5">{userName?.split(' ')[0] ?? 'User'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-[#E7E5E0] group-hover:ring-blue-400 transition-all">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="Profile"
                  className="w-full h-full object-cover bg-blue-50"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content — flex-1 + overflow-y-auto: ONLY this div scrolls */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#F5F4F0]">
          {children}
        </div>
      </main>
    </div>
  );
};

/* ── Shared nav button ──────────────────────────────────────────── */
const NavBtn: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, collapsed, onClick }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl
      transition-all duration-150
      ${isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
        : 'text-[#57534E] hover:bg-[#F5F4F0] hover:text-[#1C1917]'
      }
    `}
  >
    <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
    {!collapsed && (
      <span className="text-[13px] font-semibold tracking-tight truncate">{label}</span>
    )}
  </button>
);

export default Layout;
