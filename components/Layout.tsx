
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, FileText, TrendingUp, Users, Fuel,
  LogOut, Menu, Bell, Navigation, Settings, Database, ReceiptText,
  Coins, BellRing, ShieldCheck, Factory, FileSpreadsheet,
  Headphones, HeartPulse, Store, ChevronDown, ChevronRight,
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
  color: string;
}

const topItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
];

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    icon: FileSpreadsheet,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    color: 'text-orange-500',
    items: [
      { id: 'transport-orders', label: 'Transport Orders', icon: FileText,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'orders',           label: 'Orders & Clients', icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'alerts',           label: 'Alert Hub',        icon: BellRing,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT], badge: true },
      { id: 'plant-hub',        label: 'Plant Hub',        icon: Factory,         roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    ],
  },
  {
    label: 'Fleet',
    icon: Truck,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER],
    color: 'text-blue-500',
    items: [
      { id: 'fleet',           label: 'Fleet Command',   icon: Truck,       roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'gps-tracking',    label: 'GPS Tracking',    icon: Navigation,  roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER] },
      { id: 'truck-health',    label: 'Truck Health',    icon: HeartPulse,  roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
      { id: 'fuel-management', label: 'Fuel Management', icon: Fuel,        roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
    ],
  },
  {
    label: 'Finance',
    icon: ReceiptText,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    color: 'text-green-500',
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
    color: 'text-purple-500',
    items: [
      { id: 'driver-portal', label: 'Driver Portal', icon: Users, roles: [UserRole.DRIVER, UserRole.ADMIN] },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    roles: [UserRole.ADMIN],
    color: 'text-cyan-500',
    items: [
      { id: 'reports',   label: 'Intelligence', icon: TrendingUp, roles: [UserRole.ADMIN] },
      { id: 'resources', label: 'Master Data',  icon: Database,   roles: [UserRole.ADMIN] },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.DRIVER],
    color: 'text-slate-500',
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

  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(navGroups.map(g => g.label))
  );

  const visibleTopItems = topItems.filter(i => i.roles.includes(activeRole));

  const visibleGroups = navGroups
    .filter(g => g.roles.includes(activeRole))
    .map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(activeRole)) }))
    .filter(g => g.items.length > 0);

  const activeLabel = [
    ...topItems,
    ...navGroups.flatMap(g => g.items),
  ].find(i => i.id === activeTab)?.label ?? activeTab.replace(/-/g, ' ');

  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const initials = (userName || userEmail)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F4F0]">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`
        ${collapsed ? 'w-[68px]' : 'w-[264px]'}
        h-screen flex flex-col shrink-0
        bg-white border-r border-[#E8E6E1]
        transition-all duration-300 ease-in-out
        shadow-[2px_0_16px_rgba(0,0,0,0.06)]
        z-20
      `}>

        {/* ── Logo ── */}
        <div className="h-[68px] flex items-center px-4 border-b border-[#F0EEE9] shrink-0">
          <div className="flex items-center gap-3 min-w-0 w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-blue-500/30">
              FA
            </div>
            {!collapsed && (
              <div className="leading-none min-w-0 flex-1">
                <p className="text-[15px] font-black text-[#1C1917] tracking-tight truncate">FlyAsh Pro</p>
                <p className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-widest mt-0.5">Logistics</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-3 py-4 space-y-1">

          {/* Standalone items */}
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

          {visibleTopItems.length > 0 && (
            <div className="my-2 h-px bg-[#F0EEE9]" />
          )}

          {/* Grouped items */}
          {visibleGroups.map((group, idx) => {
            const isGroupActive = group.items.some(i => i.id === activeTab);
            const isOpen = openGroups.has(group.label);

            return (
              <div key={group.label} className={idx > 0 ? 'pt-0.5' : ''}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  title={collapsed ? group.label : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-150 group
                    ${isGroupActive
                      ? 'text-blue-700 bg-blue-50/80'
                      : 'text-[#44403C] hover:bg-[#F5F4F0] hover:text-[#1C1917]'
                    }
                  `}
                >
                  <group.icon
                    size={18}
                    strokeWidth={isGroupActive ? 2.5 : 2}
                    className={`shrink-0 ${isGroupActive ? 'text-blue-600' : group.color}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-[13.5px] font-bold tracking-tight truncate">
                        {group.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-[#A8A29E] transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!collapsed && isOpen && (
                  <div className="mt-1 ml-4 pl-3.5 border-l-2 border-[#EEECE8] space-y-0.5 pb-1.5">
                    {group.items.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate('/' + item.id)}
                          className={`
                            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                            transition-all duration-150 relative
                            ${isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                              : 'text-[#57534E] hover:bg-[#F0EEE9] hover:text-[#1C1917]'
                            }
                          `}
                        >
                          <item.icon
                            size={15}
                            strokeWidth={isActive ? 2.5 : 2}
                            className="shrink-0"
                          />
                          <span className="text-[13px] font-semibold tracking-tight truncate flex-1 text-left">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`
                              w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center
                              ${isActive
                                ? 'bg-white text-blue-600'
                                : 'bg-red-500 text-white'
                              }
                            `}>
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

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#F0EEE9] p-3 space-y-2">
          {!collapsed && (
            <>
              {/* User card */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FAFAF8] border border-[#EEECE8]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[#1C1917] truncate leading-tight">
                    {userName || 'User'}
                  </p>
                  <p className="text-[11px] text-[#A8A29E] truncate leading-tight mt-0.5">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Role switcher */}
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as UserRole)}
                className="w-full bg-white border border-[#E7E5E0] rounded-lg px-3 py-2 text-[12.5px] font-semibold text-[#44403C] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer transition-all"
              >
                <option value={UserRole.ADMIN}>Owner / Admin</option>
                <option value={UserRole.DRIVER}>Driver</option>
                <option value={UserRole.ACCOUNTANT}>Accountant</option>
              </select>
            </>
          )}

          {/* Sign out */}
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#78716C] text-[13px] font-semibold hover:bg-red-50 hover:text-red-500 transition-all duration-150 group"
          >
            <LogOut size={16} strokeWidth={2} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-[68px] shrink-0 bg-white border-b border-[#E8E6E1] flex items-center justify-between px-6 z-10 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-2 rounded-lg text-[#A8A29E] hover:bg-[#F5F4F0] hover:text-[#1C1917] transition-all active:scale-90"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 rounded-full bg-blue-600" />
              <h2 className="text-[17px] font-black text-[#1C1917] capitalize tracking-tight">{activeLabel}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2.5 rounded-xl text-[#A8A29E] hover:bg-[#F5F4F0] hover:text-[#1C1917] transition-all"
            >
              <Bell size={18} strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </button>

            <div className="w-px h-8 bg-[#E7E5E0] mx-1" />

            {/* User info */}
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                {activeRole === UserRole.ADMIN ? 'Admin' : activeRole === UserRole.DRIVER ? 'Driver' : 'Accountant'}
              </p>
              <p className="text-[13px] font-black text-[#1C1917] leading-tight mt-0.5">
                {userName?.split(' ')[0] ?? 'User'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#E7E5E0] hover:ring-blue-400 transition-all cursor-pointer">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Profile"
                className="w-full h-full object-cover bg-blue-50"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#F5F4F0]">
          {children}
        </div>
      </main>
    </div>
  );
};

/* ── NavBtn ─────────────────────────────────────────────────────── */
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
      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
      transition-all duration-150
      ${isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
        : 'text-[#44403C] hover:bg-[#F5F4F0] hover:text-[#1C1917]'
      }
    `}
  >
    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
    {!collapsed && (
      <span className="text-[13.5px] font-bold tracking-tight truncate">{label}</span>
    )}
  </button>
);

export default Layout;
