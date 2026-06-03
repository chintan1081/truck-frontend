import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { 
  UserRole, Order, Expense, Truck, Driver, AppSettings, DriverSalary, 
  Client, Site, Route, Invoice, TruckEMI, MaintenanceExpense, CustomAlert, 
  PlantAdvance, PlantAdvancePoolEntry, StationRate, FuelSite, FuelTransaction, 
  AttendanceRecord, LeaveRequest, PerformanceMetric, Bank, BankTransaction, 
  PaymentRecord, ItemProduct, Broker, Employee, EmployeeSalary
} from './types';
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './services/auth/AuthContext';
import { apiRequest, ApiError } from './services/api/client';
import Dashboard from './views/Dashboard';
import AlertsView from './views/AlertsView';
import PlantHubView from './views/PlantHubView';
import TransportOrdersView from './views/TransportOrdersView';
import OrdersView from './views/OrdersView';
import ResourcesView from './views/ResourcesView';
import FleetView from './views/FleetView';
import EmployeeManagementView from './views/EmployeeManagementView';
import TruckHealthView from './views/TruckHealthView';
import FuelManagementView from './views/FuelManagementView';
import GPSTrackingView from './views/GPSTrackingView';
import FleetFinanceView from './views/FleetFinanceView';
import InvoicesView from './views/InvoicesView';
import AccountabilityView from './views/AccountabilityView';
import DriverPortal from './views/DriverPortal';
import ReportsView from './views/ReportsView';
import MarketplaceView from './views/MarketplaceView';
import SupportView from './views/SupportView';
import SettingsView from './views/SettingsView';

const App: React.FC = () => {
  const { status, user, logout } = useAuth();
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.ADMIN);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  // Core collections synced real-time with TypeORM multi-tenant database
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fleet, setFleet] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [itemProducts, setItemProducts] = useState<ItemProduct[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salaries, setSalaries] = useState<DriverSalary[]>([]);
  const [employeeSalaries, setEmployeeSalaries] = useState<EmployeeSalary[]>([]);
  const [emis, setEmis] = useState<TruckEMI[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceExpense[]>([]);
  const [customAlerts, setCustomAlerts] = useState<CustomAlert[]>([]);
  const [plantAdvances, setPlantAdvances] = useState<PlantAdvance[]>([]);
  const [plantAdvancePool, setPlantAdvancePool] = useState<PlantAdvancePoolEntry[]>([]);
  const [stationRates, setStationRates] = useState<StationRate[]>([]);
  const [fuelSites, setFuelSites] = useState<FuelSite[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    dieselApprovalRequired: true,
    limitStrictEnforcement: true,
    companyName: 'FlyAsh Logistics Pro',
    companyEmail: 'admin@flyashpro.com',
    companyContact: '+91 98765 43210',
    companyWhatsapp: '+91 98765 43210',
    companyAddress: 'Industrial Hub, Sector 5, Greater Noida',
    companyServices: ['FlyAsh Logistics', 'Bulk Transportation', 'Fleet Management']
  });

  // Base API caller. Identity is carried by the bearer token (attached centrally
  // by the API client) — never by a client-supplied header. A 401 anywhere is
  // intercepted by the client and drops the session back to the login screen.
  const apiCall = (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) =>
    apiRequest(endpoint, { method, body });

  function getErrMsg(err: unknown): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return 'An unexpected error occurred. Please try again.';
  }

  const reloadData = async () => {
    try {
      const data = await apiCall("all-data");
      setDataLoadError(null);
      setSettings(data.settings);
      setOrders(data.orders || []);
      setExpenses(data.expenses || []);
      setFleet(data.fleet || []);
      setDrivers(data.drivers || []);
      setClients(data.clients || []);
      setSites(data.sites || []);
      setRoutes(data.routes || []);
      setBrokers(data.brokers || []);
      setEmployees(data.employees || []);
      setBanks(data.banks || []);
      setItemProducts(data.itemProducts || []);
      setBankTransactions(data.bankTransactions || []);
      setPaymentRecords(data.paymentRecords || []);
      setInvoices(data.invoices || []);
      setSalaries(data.salaries || []);
      setEmployeeSalaries(data.employeeSalaries || []);
      setEmis(data.emis || []);
      setMaintenance(data.maintenance || []);
      setCustomAlerts(data.customAlerts || []);
      setPlantAdvances(data.plantAdvances || []);
      setPlantAdvancePool(data.plantAdvancePool || []);
      setStationRates(data.stationRates || []);
      setFuelSites(data.fuelSites || []);
      setAttendance(data.attendance || []);
      setLeaves(data.leaves || []);
      setPerformance(data.performance || []);
      setFuelTransactions(data.fuelTransactions || []);
    } catch (err) {
      console.error("Critical: Operational reload failed.", err);
      setDataLoadError(getErrMsg(err));
    }
  };

  // Load this user's data once authenticated (and again if the user changes).
  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    reloadData().finally(() => setLoading(false));
  }, [status, user?.id]);

  // Default the active view-role to the signed-in user's actual role.
  useEffect(() => {
    if (user?.role) setActiveRole(user.role as UserRole);
  }, [user?.id]);

  // Universal state sync generator (Performs smart delta update analysis)
  const makeListSyncSetter = <T extends { id: string }>(
    endpoint: string,
    currentList: T[],
    idPrefix: string
  ) => {
    return async (val: T[] | ((prev: T[]) => T[])) => {
      const newList = typeof val === 'function' ? val(currentList) : val;

      const added = newList.filter(n => !currentList.some(c => c.id === n.id));
      const deleted = currentList.filter(c => !newList.some(n => n.id === c.id));
      const changed = newList.filter(n => {
        const existing = currentList.find(c => c.id === n.id);
        return existing && JSON.stringify(existing) !== JSON.stringify(n);
      });

      try {
        // Never mint ids client-side: the server generates UUIDs and strips any
        // client-sent id/userId. New rows are POSTed and the real id arrives via
        // the subsequent reloadData().
        for (const item of added) {
          await apiCall(endpoint, "POST", item);
        }
        for (const item of changed) {
          await apiCall(`${endpoint}/${item.id}`, "PUT", item);
        }
        for (const item of deleted) {
          await apiCall(`${endpoint}/${item.id}`, "DELETE");
        }
        await reloadData();
      } catch (err) {
        console.error(`Dynamic synchronizer error on ${endpoint}:`, err);
        setOpError(getErrMsg(err));
      }
    };
  };

  // Sync wrappers dynamically bound to lists
  const handleUpdateTrucks = makeListSyncSetter<Truck>("fleet", fleet, "T");
  const handleUpdateSingleTruck = async (truck: Truck) => {
    try {
      await apiCall(`fleet/${truck.id}`, "PUT", truck);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };
  const handleUpdateDrivers = makeListSyncSetter<Driver>("drivers", drivers, "D");
  const handleUpdateEmployees = makeListSyncSetter<Employee>("employees", employees, "E");
  const handleUpdateClients = makeListSyncSetter<Client>("clients", clients, "C");
  const handleUpdateSites = makeListSyncSetter<Site>("sites", sites, "S");
  const handleUpdateRoutes = makeListSyncSetter<Route>("routes", routes, "R");
  const handleUpdateBrokers = makeListSyncSetter<Broker>("brokers", brokers, "B");
  const handleUpdateBanks = makeListSyncSetter<Bank>("banks", banks, "BANK");
  const handleUpdateItemProducts = makeListSyncSetter<ItemProduct>("item-products", itemProducts, "IP");
  const handleUpdateFuelSites = makeListSyncSetter<FuelSite>("fuel-sites", fuelSites, "FS");
  const handleUpdateFuelTransactions = makeListSyncSetter<FuelTransaction>("fuel-transactions", fuelTransactions, "FT");
  const handleUpdateExpenses = makeListSyncSetter<Expense>("expenses", expenses, "EXP");
  const handleUpdateInvoices = makeListSyncSetter<Invoice>("invoices", invoices, "INV");
  const handleUpdateEmis = makeListSyncSetter<TruckEMI>("emis", emis, "EMI");
  const handleUpdateMaintenance = makeListSyncSetter<MaintenanceExpense>("maintenance", maintenance, "MNT");
  const handleUpdateAlerts = makeListSyncSetter<CustomAlert>("alerts", customAlerts, "ALR");
  const handleUpdatePlantAdvances = makeListSyncSetter<PlantAdvance>("plant-advances", plantAdvances, "ADV");
  const handleUpdateStationRates = makeListSyncSetter<StationRate>("station-rates", stationRates, "STR");
  const handleUpdateAttendance = makeListSyncSetter<AttendanceRecord>("attendance", attendance, "ATT");
  const handleUpdateLeaves = makeListSyncSetter<LeaveRequest>("leaves", leaves, "LR");
  const handleUpdatePerformance = makeListSyncSetter<PerformanceMetric>("performance", performance, "PF");
  const handleUpdatePaymentRecords = makeListSyncSetter<PaymentRecord>("payment-records", paymentRecords, "PAY");
  const handleUpdateBankTransactions = makeListSyncSetter<BankTransaction>("bank-transactions", bankTransactions, "BT");
  const handleUpdateOrders = makeListSyncSetter<Order>("orders", orders, "ORD");

  // Custom multi-action overrides mapped directly to custom Express controllers
  const handleAddOrder = async (newOrder: Order) => {
    try {
      await apiCall("orders", "POST", newOrder);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      await apiCall(`orders/${updatedOrder.id}`, "PUT", updatedOrder);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await apiCall(`orders/${id}`, "DELETE");
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleAddPoolEntry = async (entry: PlantAdvancePoolEntry) => {
    try {
      await apiCall("plant-pool", "POST", entry);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleUpdatePoolEntry = async (entry: PlantAdvancePoolEntry) => {
    try {
      await apiCall(`plant-pool/${entry.id}`, "PUT", entry);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleDeletePoolEntry = async (id: string) => {
    try {
      await apiCall(`plant-pool/${id}`, "DELETE");
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleAddSalary = async (s: DriverSalary) => {
    try {
      await apiCall("salaries", "POST", s);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleUpdateSalary = async (s: DriverSalary) => {
    try {
      await apiCall(`salaries/${s.id}`, "PUT", s);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleDeleteSalary = async (id: string) => {
    try {
      await apiCall(`salaries/${id}`, "DELETE");
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleAddEmployeeSalary = async (s: EmployeeSalary) => {
    try {
      await apiCall("employee-salaries", "POST", s);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleUpdateEmployeeSalary = async (s: EmployeeSalary) => {
    try {
      await apiCall(`employee-salaries/${s.id}`, "PUT", s);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleDeleteEmployeeSalary = async (id: string) => {
    try {
      await apiCall(`employee-salaries/${id}`, "DELETE");
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const handleUpdateSettings = async (s: AppSettings) => {
    try {
      await apiCall("settings", "PUT", s);
      await reloadData();
    } catch (err) {
      setOpError(getErrMsg(err));
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-sm text-slate-500 tracking-tight">Loading your workspace{user?.email ? ` for ${user.email}` : ''}...</span>
        </div>
      );
    }

    if (dataLoadError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
          <div className="max-w-sm w-full bg-white border border-red-100 rounded-3xl p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <h3 className="text-base font-black text-slate-800 mb-2 tracking-tight">Failed to load workspace</h3>
            <p className="text-xs font-bold text-slate-500 mb-6">{dataLoadError}</p>
            <button
              onClick={() => { setDataLoadError(null); setLoading(true); reloadData().finally(() => setLoading(false)); }}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} expenses={expenses} fleet={fleet} emis={emis} maintenance={maintenance} invoices={invoices} salaries={salaries} setActiveTab={setActiveTab} />;
      case 'alerts':
        return <AlertsView fleet={fleet} customAlerts={customAlerts} onAddAlert={a => handleUpdateAlerts(prev => [a, ...prev])} onUpdateAlert={a => handleUpdateAlerts(prev => prev.map(x => x.id === a.id ? a : x))} onDeleteAlert={id => handleUpdateAlerts(prev => prev.filter(x => x.id !== id))} onUpdateFleet={handleUpdateTrucks} />;
      case 'plant-hub':
        return <PlantHubView advances={plantAdvances} pool={plantAdvancePool} sites={sites} orders={orders} trucks={fleet} employees={employees} banks={banks} onAddAdvance={a => handleUpdatePlantAdvances(prev => [a, ...prev])} onUpdateAdvance={a => handleUpdatePlantAdvances(prev => prev.map(x => x.id === a.id ? a : x))} onDeleteAdvance={id => handleUpdatePlantAdvances(prev => prev.filter(x => x.id !== id))} onAddPoolEntry={handleAddPoolEntry} onUpdatePoolEntry={handleUpdatePoolEntry} onDeletePoolEntry={handleDeletePoolEntry} stationRates={stationRates} onAddStationRate={r => handleUpdateStationRates(prev => [r, ...prev])} onUpdateStationRate={r => handleUpdateStationRates(prev => prev.map(x => x.id === r.id ? r : x))} onDeleteStationRate={id => handleUpdateStationRates(prev => prev.filter(x => x.id !== id))} />;
      case 'transport-orders':
        return <TransportOrdersView orders={orders} onUpdateOrders={handleUpdateOrders} fleet={fleet} settings={settings} />;
      case 'orders':
        return <OrdersView 
          orders={orders} 
          brokers={brokers} 
          routes={routes} 
          itemProducts={itemProducts} 
          settings={settings} 
          trucks={fleet} 
          drivers={drivers} 
          clients={clients} 
          sites={sites} 
          plantAdvances={plantAdvances}
          plantAdvancePool={plantAdvancePool}
          onAddOrder={handleAddOrder} 
          onUpdateOrder={handleUpdateOrder} 
          onDeleteOrder={handleDeleteOrder} 
          onUpdateTruck={handleUpdateSingleTruck} 
        />;
      case 'resources':
        return <ResourcesView trucks={fleet} drivers={drivers} employees={employees} clients={clients} sites={sites} brokers={brokers} routes={routes} banks={banks} itemProducts={itemProducts} fuelSites={fuelSites} orders={orders} onUpdateTrucks={handleUpdateTrucks} onUpdateDrivers={handleUpdateDrivers} onUpdateEmployees={handleUpdateEmployees} onUpdateClients={handleUpdateClients} onUpdateSites={handleUpdateSites} onUpdateBrokers={handleUpdateBrokers} onUpdateRoutes={handleUpdateRoutes} onUpdateBanks={handleUpdateBanks} onUpdateItemProducts={handleUpdateItemProducts} onUpdateFuelSites={handleUpdateFuelSites} />;
      case 'fleet':
        return <FleetView 
          fleet={fleet} 
          orders={orders} 
          expenses={expenses} 
          maintenance={maintenance} 
          routes={routes} 
          performance={performance}
          onUpdateOrder={handleUpdateOrder} 
          onUpdateTruck={handleUpdateSingleTruck} 
          drivers={drivers}
          plantAdvancePool={plantAdvancePool}
          plantAdvances={plantAdvances}
          sites={sites}
          clients={clients}
        />;
      case 'workforce':
        return <EmployeeManagementView 
          employees={employees} 
          drivers={drivers} 
          attendance={attendance} 
          leaves={leaves} 
          performance={performance} 
          onUpdateAttendance={handleUpdateAttendance} 
          onUpdateLeaves={handleUpdateLeaves} 
          onUpdatePerformance={handleUpdatePerformance} 
          onUpdateEmployees={handleUpdateEmployees}
          onUpdateDrivers={handleUpdateDrivers}
        />;
      case 'truck-health':
        return <TruckHealthView 
          fleet={fleet} 
          maintenance={maintenance}
          employees={employees}
          drivers={drivers}
          routes={routes}
          orders={orders}
          onUpdateTruck={handleUpdateSingleTruck} 
          onUpdateMaintenance={handleUpdateMaintenance}
        />;
      case 'fuel-management':
        return <FuelManagementView fuelSites={fuelSites} fuelTransactions={fuelTransactions} trucks={fleet} drivers={drivers} orders={orders} clients={clients} sites={sites} banks={banks} onUpdateFuelTransactions={handleUpdateFuelTransactions} onAddExpense={(exp) => handleUpdateExpenses(prev => [...prev, exp])} />;
      case 'gps-tracking':
        return <GPSTrackingView fleet={fleet} />;
      case 'fleet-finance':
        return <FleetFinanceView fleet={fleet} emis={emis} maintenance={maintenance} expenses={expenses} invoices={invoices} orders={orders} employees={employees} settings={settings} onUpdateEmis={handleUpdateEmis} onUpdateMaintenance={handleUpdateMaintenance} />;
      case 'invoices':
        return <InvoicesView invoices={invoices} clients={clients} orders={orders} sites={sites} itemProducts={itemProducts} trucks={fleet} drivers={drivers} banks={banks} settings={settings} onAddInvoice={(i) => handleUpdateInvoices(prev => [i, ...prev])} onUpdateInvoice={(i) => handleUpdateInvoices(prev => prev.map(x => x.id === i.id ? i : x))} onDeleteInvoice={(id) => handleUpdateInvoices(prev => prev.filter(i => i.id !== id))} onUpdateOrder={handleUpdateOrder} onUpdateSite={(s) => handleUpdateSites(prev => prev.map(x => x.id === s.id ? s : x))} onUpdateClient={(c) => handleUpdateClients(prev => prev.map(x => x.id === c.id ? c : x))} />;
      case 'accountability':
        return <AccountabilityView
          maintenance={maintenance}
          invoices={invoices}
          expenses={expenses}
          trucks={fleet}
          salaries={salaries}
          employeeSalaries={employeeSalaries}
          plantAdvances={plantAdvances}
          plantPool={plantAdvancePool}
          sites={sites}
          drivers={drivers}
          employees={employees}
          orders={orders}
          banks={banks}
          bankTransactions={bankTransactions}
          paymentRecords={paymentRecords}
          activeRole={activeRole}
          settings={settings}
          onAddExpense={(e) => handleUpdateExpenses(prev => [e, ...prev])}
          onUpdateExpense={(e) => handleUpdateExpenses(prev => prev.map(x => x.id === e.id ? e : x))}
          onDeleteExpense={(id) => handleUpdateExpenses(prev => prev.filter(e => e.id !== id))}
          onAddSalary={handleAddSalary}
          onUpdateSalary={handleUpdateSalary}
          onDeleteSalary={handleDeleteSalary}
          onAddEmployeeSalary={handleAddEmployeeSalary}
          onUpdateEmployeeSalary={handleUpdateEmployeeSalary}
          onDeleteEmployeeSalary={handleDeleteEmployeeSalary}
          onAddBankTransaction={(t) => handleUpdateBankTransactions(prev => [t, ...prev])}
          onUpdateBankTransaction={(t) => handleUpdateBankTransactions(prev => prev.map(x => x.id === t.id ? t : x))}
          onDeleteBankTransaction={(id) => handleUpdateBankTransactions(prev => prev.filter(t => t.id !== id))}
          onAddPaymentRecord={(r) => handleUpdatePaymentRecords(prev => [r, ...prev])}
          onUpdatePaymentRecord={(r) => handleUpdatePaymentRecords(prev => prev.map(x => x.id === r.id ? r : x))}
          onDeletePaymentRecord={(id) => handleUpdatePaymentRecords(prev => prev.filter(r => r.id !== id))}
          onUpdateInvoice={(i) => handleUpdateInvoices(prev => prev.map(x => x.id === i.id ? i : x))}
        />;
      case 'driver-portal':
        return <DriverPortal orders={orders} routes={routes} settings={settings} onAddExpense={(e) => handleUpdateExpenses(prev => [e, ...prev])} onUpdateOrder={handleUpdateOrder} />;
      case 'reports':
        return <ReportsView orders={orders} expenses={expenses} salaries={salaries} invoices={invoices} emis={emis} maintenance={maintenance} fleet={fleet} clients={clients} brokers={brokers} plantAdvances={plantAdvances} pool={plantAdvancePool} sites={sites} />;
      case 'marketplace':
        return <MarketplaceView 
          fleet={fleet}
          expenses={expenses}
          invoices={invoices}
          drivers={drivers}
          employees={employees}
          maintenance={maintenance}
          onAddInvoice={(i) => handleUpdateInvoices(prev => [i, ...prev])}
        />;
      case 'support':
        return <SupportView />;
      case 'settings':
        return <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} currentUser={user} />;
      default:
        return <Dashboard orders={orders} expenses={expenses} fleet={fleet} emis={emis} maintenance={maintenance} invoices={invoices} salaries={salaries} setActiveTab={setActiveTab} />;
    }
  };

  // --- Auth gate: nothing below renders until the user is signed in. ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-bold text-sm text-slate-500 tracking-tight">Restoring your session...</span>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <LoginScreen />;
  }

  return (
    <Router>
      <Layout
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={user?.email ?? ''}
        userName={user?.name ?? null}
        onLogout={logout}
      >
        {renderContent()}
      </Layout>

      {opError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-xs font-bold rounded-2xl px-5 py-3.5 shadow-2xl shadow-red-200 max-w-sm w-full mx-4">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <span className="flex-1">{opError}</span>
          <button onClick={() => setOpError(null)} className="shrink-0 hover:opacity-70 transition-opacity" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </Router>
  );
};

export default App;
