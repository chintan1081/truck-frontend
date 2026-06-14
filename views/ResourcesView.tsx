
import React, { useState, useMemo } from 'react';
import { useFormErrors } from '../hooks/useFormErrors';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Truck as TruckIcon, 
  Users, 
  User,
  Phone, 
  MessageCircle,
  MapPin, 
  UserCheck,
  Building2,
  Mail,
  Building,
  Factory,
  Globe,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Wrench,
  Activity,
  Fuel,
  Info,
  CheckCircle2,
  Landmark,
  CreditCard,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  Navigation,
  ChevronDown,
  Percent,
  Cog
} from 'lucide-react';
import { Truck, Driver, Client, Site, Order, Broker, Route, Bank, Employee, ItemProduct, FuelSite } from '../types';

interface ResourcesViewProps {
  trucks: Truck[];
  drivers: Driver[];
  employees: Employee[];
  clients: Client[];
  sites: Site[];
  brokers: Broker[];
  routes: Route[];
  banks: Bank[];
  itemProducts: ItemProduct[];
  fuelSites: FuelSite[];
  orders: Order[];
  onUpdateTrucks: (trucks: Truck[]) => void;
  onUpdateDrivers: (drivers: Driver[]) => void;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateClients: (clients: Client[]) => void;
  onUpdateSites: (sites: Site[]) => void;
  onUpdateBrokers: (brokers: Broker[]) => void;
  onUpdateRoutes: (routes: Route[]) => void;
  onUpdateBanks: (banks: Bank[]) => void;
  onUpdateItemProducts: (items: ItemProduct[]) => void;
  onUpdateFuelSites: (sites: FuelSite[]) => void;
}

const ResourcesView: React.FC<ResourcesViewProps> = ({ 
  trucks, 
  drivers, 
  employees,
  clients, 
  sites, 
  brokers,
  routes,
  banks,
  itemProducts,
  fuelSites,
  orders, 
  onUpdateTrucks, 
  onUpdateDrivers, 
  onUpdateEmployees,
  onUpdateClients, 
  onUpdateSites,
  onUpdateBrokers,
  onUpdateRoutes,
  onUpdateBanks,
  onUpdateItemProducts,
  onUpdateFuelSites
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trucks' | 'drivers' | 'employees'| 'clients' | 'sites' | 'brokers' | 'routes' | 'banks' | 'item-products' | 'fuel-sites'>('trucks');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'NAME' | 'ID' | 'CONTACT' | 'LOCATION'>('ALL');
  
  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isItemProductModalOpen, setIsItemProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Initial States
  const initialTruckForm: Partial<Truck> = { 
    trackingId: '',
    name: '', 
    description: '', 
    modelNumber: '', 
    plateNumber: '', 
    ownerName: '', 
    ownerContact: '', 
    mileage: 4, 
    dieselLimit: 150, 
    insuranceExpiry: '', 
    fitnessExpiry: '', 
    permitExpiry: '',
    pollutionExpiry: '',
    lastServiceDate: '', 
    totalMtHandled: 0,
    driverScore: 80,
    idleTimeHours: 0,
    engineHours: 0,
    currentOdometer: 0,
    serviceIntervalKm: 10000,
    engineNumber: '',
    fuelType: 'DIESEL',
    branch: 'Default',
    registrationDate: '',
    vehicleApplication: '',
    vehicleCode: '',
    vehicleType: 'TRUCK',
    ladenWeight: '',
    unladenWeight: '',
    tonnage: '0',
    makeYear: '',
    registrationAddress: '',
    ownedOutside: '',
    specification: '',
    status: 'AVAILABLE',
    healthStatus: {
      battery: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      engine: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      tyres: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      electrical: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      body: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      oil: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      water: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
      brakes: { status: 'GOOD', lastChecked: new Date().toISOString().split('T')[0], notes: 'Initial registration' },
    },
    breakdownHistory: [],
    documents: []
  };
  
  const initialDriverForm: Partial<Driver> = { 
    trackingId: '',
    name: '', 
    email: '',
    phoneNumber: '', 
    whatsappNumber: '', 
    address: '', 
    upiId: '', 
    bankDetails: '', 
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    licenseExpiry: '',
    joinDate: '',
    exitDate: '',
    experienceYears: 0
  };
  
  const initialClientForm: Partial<Client> = { 
    trackingId: '',
    name: '', 
    gstNumber: '', 
    address: '', 
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactPerson: '', 
    email: '', 
    phone: '' 
  };
  
  const initialSiteForm: Partial<Site> = { 
    trackingId: '',
    name: '', 
    location: '', 
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    type: 'TPS', 
    contactPerson: '', 
    contactPhone: '',
    email: '',
    gstNumber: ''
  };

  const initialBrokerForm: Partial<Broker> = {
    trackingId: '',
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    upiId: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    }
  };

  const initialRouteForm: Partial<Route> = {
    trackingId: '',
    source: '',
    destination: '',
    distanceKm: 0,
    mapUrl: '',
    sourceMapUrl: '',
    destinationMapUrl: ''
  };

  const initialBankForm: Partial<Bank> = {
    trackingId: '',
    bankName: '',
    bankAddress: '',
    accountNumber: '',
    checkNumber: '',
    description: '',
    ifscCode: '',
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    managerWhatsapp: ''
  };

  const initialEmployeeForm: Partial<Employee> = {
    trackingId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    address: '',
    joinDate: '',
    exitDate: '',
    bankAccountDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      upiId: ''
    }
  };

  const initialItemProductForm: Partial<ItemProduct> = {
    trackingId: '',
    productName: '',
    productColour: '',
    hsnSacCode: '',
    gstRate: 0,
    services: []
  };

  const initialFuelSiteForm: Partial<FuelSite> = {
    trackingId: '',
    companyName: '',
    ownerName: '',
    phoneNumber: '',
    contactEmail: '',
    whatsappNumber: '',
    gstNumber: '',
    address: '',
    googleMapLink: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  };

  const [truckForm, setTruckForm] = useState<Partial<Truck>>(initialTruckForm);
  const [driverForm, setDriverForm] = useState<Partial<Driver>>(initialDriverForm);
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>(initialEmployeeForm);
  const [itemProductForm, setItemProductForm] = useState<Partial<ItemProduct>>(initialItemProductForm);
  const [clientForm, setClientForm] = useState<Partial<Client>>(initialClientForm);
  const [siteForm, setSiteForm] = useState<Partial<Site>>(initialSiteForm);
  const [brokerForm, setBrokerForm] = useState<Partial<Broker>>(initialBrokerForm);
  const [routeForm, setRouteForm] = useState<Partial<Route>>(initialRouteForm);
  const [bankForm, setBankForm] = useState<Partial<Bank>>(initialBankForm);
  const [fuelSiteForm, setFuelSiteForm] = useState<Partial<FuelSite>>(initialFuelSiteForm);
  const [newService, setNewService] = useState('');

  const [isFuelSiteModalOpen, setIsFuelSiteModalOpen] = useState(false);

  const { errors: fe, validate, validateField, isValid, clearField, clearAll } = useFormErrors();

  // Returns red-highlighted input className when field has an error
  const fieldCls = (base: string, field: string) =>
    fe[field] ? base.replace('border-slate-200', 'border-red-300').replace('bg-[#F5F4F0]', 'bg-red-50').replace('bg-white', 'bg-red-50') : base;

  // Renders the error message tag below a field
  const fieldErr = (field: string) =>
    fe[field] ? <p className="text-xs font-bold text-red-500 mt-1 px-1">{fe[field]}</p> : null;

  // ── Validation rule sets (one per entity form) ──────────────────────────────
  // Each is derived from current form state so the same definition powers live
  // per-field checks, submit-button enablement, and the final submit-time check.
  const employeeRules = (f = employeeForm) => ({
    fullName: { value: f.fullName, label: 'Full Name', type: 'text' as const },
    phoneNumber: { value: f.phoneNumber, label: 'Phone Number', type: 'phone' as const },
    whatsappNumber: { value: f.whatsappNumber, label: 'WhatsApp Number', type: 'phone' as const },
    address: { value: f.address, label: 'Address', type: 'text' as const },
    joinDate: { value: f.joinDate, label: 'Join Date' },
    email: { value: f.email, label: 'Email', type: 'email' as const, optional: true },
    empBankName: { value: f.bankAccountDetails?.bankName, label: 'Bank Name', type: 'text' as const },
    empAccountNumber: { value: f.bankAccountDetails?.accountNumber, label: 'Account Number', type: 'accountNumber' as const },
    empIfscCode: { value: f.bankAccountDetails?.ifscCode, label: 'IFSC Code', type: 'ifsc' as const },
    empUpiId: { value: f.bankAccountDetails?.upiId, label: 'UPI ID', type: 'upi' as const },
  });
  const clientRules = (f = clientForm) => ({
    name: { value: f.name, label: 'Business Name', type: 'text' as const },
    gstNumber: { value: f.gstNumber, label: 'GST Number', type: 'gst' as const },
    address: { value: f.address, label: 'Billing Address', type: 'text' as const },
    city: { value: f.city, label: 'City', type: 'text' as const },
    state: { value: f.state, label: 'State', type: 'text' as const },
    pincode: { value: f.pincode, label: 'Pincode', type: 'pincode' as const },
    email: { value: f.email, label: 'Contact Email', type: 'email' as const },
    phone: { value: f.phone, label: 'Contact Phone', type: 'phone' as const },
  });
  const siteRules = (f = siteForm) => ({
    name: { value: f.name, label: 'Site Name', type: 'text' as const },
    location: { value: f.location, label: 'Location Address', type: 'text' as const },
    city: { value: f.city, label: 'City', type: 'text' as const },
    state: { value: f.state, label: 'State', type: 'text' as const },
    pincode: { value: f.pincode, label: 'Pincode', type: 'pincode' as const },
    gstNumber: { value: f.gstNumber, label: 'GST Number', type: 'gst' as const, optional: true },
    contactPhone: { value: f.contactPhone, label: 'Contact Phone', type: 'phone' as const, optional: true },
    siteEmail: { value: f.email, label: 'Contact Email', type: 'email' as const, optional: true },
  });
  const brokerRules = (f = brokerForm) => ({
    name: { value: f.name, label: 'Broker Name', type: 'text' as const },
    email: { value: f.email, label: 'Email Address', type: 'email' as const },
    phone: { value: f.phone, label: 'Phone Number', type: 'phone' as const },
    whatsappNumber: { value: f.whatsappNumber, label: 'WhatsApp Number', type: 'phone' as const },
    address: { value: f.address, label: 'Address', type: 'text' as const },
    brkUpiId: { value: f.upiId, label: 'UPI ID', type: 'upi' as const, optional: true },
    brkIfscCode: { value: f.bankDetails?.ifscCode, label: 'IFSC Code', type: 'ifsc' as const, optional: true },
    brkAccountNumber: { value: f.bankDetails?.accountNumber, label: 'Account Number', type: 'accountNumber' as const, optional: true },
  });
  const routeRules = (f = routeForm) => ({
    source: { value: f.source, label: 'Loading Station' },
    destination: { value: f.destination, label: 'Destination' },
    distanceKm: { value: f.distanceKm, label: 'Distance (km)', type: 'positiveNumber' as const },
  });
  const bankRules = (f = bankForm) => ({
    bankName: { value: f.bankName, label: 'Bank Name', type: 'text' as const },
    accountNumber: { value: f.accountNumber, label: 'Account Number', type: 'accountNumber' as const },
    ifscCode: { value: f.ifscCode, label: 'IFSC Code', type: 'ifsc' as const },
    managerEmail: { value: f.managerEmail, label: 'Manager Email', type: 'email' as const, optional: true },
    managerPhone: { value: f.managerPhone, label: 'Manager Phone', type: 'phone' as const, optional: true },
    managerWhatsapp: { value: f.managerWhatsapp, label: 'Manager WhatsApp', type: 'phone' as const, optional: true },
  });
  const itemProductRules = (f = itemProductForm) => ({
    productName: { value: f.productName, label: 'Product Name', type: 'text' as const },
    hsnSacCode: { value: f.hsnSacCode, label: 'HSN/SAC Code', type: 'text' as const },
    gstRate: { value: f.gstRate, label: 'GST Rate', type: 'number' as const, min: 0, max: 100, optional: true },
  });
  const fuelSiteRules = (f = fuelSiteForm) => ({
    companyName: { value: f.companyName, label: 'Company Name', type: 'text' as const },
    ownerName: { value: f.ownerName, label: 'Owner Name', type: 'text' as const },
    phoneNumber: { value: f.phoneNumber, label: 'Phone Number', type: 'phone' as const },
    address: { value: f.address, label: 'Address', type: 'text' as const },
    bankName: { value: f.bankName, label: 'Bank Name', type: 'text' as const },
    accountNumber: { value: f.accountNumber, label: 'Account Number', type: 'accountNumber' as const },
    ifscCode: { value: f.ifscCode, label: 'IFSC Code', type: 'ifsc' as const },
    fsWhatsapp: { value: f.whatsappNumber, label: 'WhatsApp Number', type: 'phone' as const, optional: true },
    contactEmail: { value: f.contactEmail, label: 'Contact Email', type: 'email' as const, optional: true },
    gstNumber: { value: f.gstNumber, label: 'GST Number', type: 'gst' as const, optional: true },
    upiId: { value: f.upiId, label: 'UPI ID', type: 'upi' as const, optional: true },
    googleMapLink: { value: f.googleMapLink, label: 'Google Map Link', type: 'url' as const, optional: true },
  });
  const driverRules = (f = driverForm) => ({
    name: { value: f.name, label: 'Full Name', type: 'text' as const },
    phoneNumber: { value: f.phoneNumber, label: 'Phone Number', type: 'phone' as const },
    whatsappNumber: { value: f.whatsappNumber, label: 'WhatsApp Number', type: 'phone' as const },
    licenseExpiry: { value: f.licenseExpiry, label: 'License Expiry' },
    address: { value: f.address, label: 'Address', type: 'text' as const },
    bankName: { value: f.bankName, label: 'Bank Name', type: 'text' as const },
    upiId: { value: f.upiId, label: 'UPI ID', type: 'upi' as const },
    drvEmail: { value: f.email, label: 'Email', type: 'email' as const, optional: true },
    drvIfscCode: { value: f.ifscCode, label: 'IFSC Code', type: 'ifsc' as const, optional: true },
    drvAccountNumber: { value: f.accountNumber, label: 'Account Number', type: 'accountNumber' as const, optional: true },
    experienceYears: { value: f.experienceYears, label: 'Experience (Years)', type: 'number' as const, min: 0, max: 60, optional: true },
  });
  const truckRules = (f = truckForm) => ({
    name: { value: f.name, label: 'Truck Name', type: 'text' as const },
    truckNumber: { value: f.truckNumber || f.plateNumber, label: 'Truck Number', type: 'text' as const },
    ownerName: { value: f.ownerName, label: 'Owner Name', type: 'text' as const },
    ownerContact: { value: f.ownerContact, label: 'Owner Contact', type: 'phone' as const },
    mileage: { value: f.mileage, label: 'Mileage (KM/L)', type: 'positiveNumber' as const, optional: true },
    dieselLimit: { value: f.dieselLimit, label: 'Diesel Limit (L)', type: 'positiveNumber' as const, optional: true },
    currentOdometer: { value: f.currentOdometer, label: 'Odometer (KM)', type: 'number' as const, min: 0, optional: true },
    driverScore: { value: f.driverScore, label: 'Driver Score', type: 'number' as const, min: 0, max: 100, optional: true },
  });

  const handleOpenModal = (type: typeof activeSubTab, item?: any) => {
    setEditingItem(item || null);
    if (type === 'trucks') { 
      setTruckForm(item || initialTruckForm); 
      const currentDriver = item?.assignedDriverId ? drivers.find(d => d.id === item.assignedDriverId) : null;
      setDriverSearchQuery(currentDriver ? currentDriver.name : ''); 
      const currentRoute = item?.defaultRouteId ? routes.find(r => r.id === item.defaultRouteId) : null;
      setRouteSearchQuery(currentRoute ? `${currentRoute.source} → ${currentRoute.destination}` : '');
      setIsDriverDropdownOpen(false);
      setIsRouteDropdownOpen(false);
      setIsTruckModalOpen(true); 
    }
    if (type === 'drivers') { setDriverForm(item || initialDriverForm); setIsDriverModalOpen(true); }
    if (type === 'employees') { setEmployeeForm(item || initialEmployeeForm); setIsEmployeeModalOpen(true); }
    if (type === 'clients') { setClientForm(item || initialClientForm); setIsClientModalOpen(true); }
    if (type === 'sites') { setSiteForm(item || initialSiteForm); setIsSiteModalOpen(true); }
    if (type === 'brokers') { setBrokerForm(item || initialBrokerForm); setIsBrokerModalOpen(true); }
    if (type === 'routes') { setRouteForm(item || initialRouteForm); setIsRouteModalOpen(true); }
    if (type === 'banks') { setBankForm(item || initialBankForm); setIsBankModalOpen(true); }
    if (type === 'item-products') { setItemProductForm(item || initialItemProductForm); setIsItemProductModalOpen(true); }
    if (type === 'fuel-sites') { setFuelSiteForm(item || initialFuelSiteForm); setIsFuelSiteModalOpen(true); }
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(employeeRules());
    if (!ok) return;
    const finalTrackingId = employeeForm.trackingId || `EMP-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateEmployees(employees.map(emp => emp.id === editingItem.id ? { ...emp, ...employeeForm, trackingId: finalTrackingId } as Employee : emp));
    } else {
      onUpdateEmployees([...employees, { ...employeeForm, trackingId: finalTrackingId, id: `EMP-${Date.now()}` } as Employee]);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(clientRules());
    if (!ok) return;
    const finalTrackingId = clientForm.trackingId || `CLNT-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateClients(clients.map(c => c.id === editingItem.id ? { ...c, ...clientForm, trackingId: finalTrackingId } as Client : c));
    } else {
      onUpdateClients([...clients, { ...clientForm, trackingId: finalTrackingId, id: `C-${Date.now()}` } as Client]);
    }
    setIsClientModalOpen(false);
  };

  const handleSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(siteRules());
    if (!ok) return;
    const finalTrackingId = siteForm.trackingId || `SITE-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateSites(sites.map(s => s.id === editingItem.id ? { ...s, ...siteForm, trackingId: finalTrackingId } as Site : s));
    } else {
      onUpdateSites([...sites, { ...siteForm, trackingId: finalTrackingId, id: `S-${Date.now()}` } as Site]);
    }
    setIsSiteModalOpen(false);
  };

  const handleBrokerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(brokerRules());
    if (!ok) return;
    const finalTrackingId = brokerForm.trackingId || `BKR-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateBrokers(brokers.map(b => b.id === editingItem.id ? { ...b, ...brokerForm, trackingId: finalTrackingId } as Broker : b));
    } else {
      onUpdateBrokers([...brokers, { ...brokerForm, trackingId: finalTrackingId, id: `B-${Date.now()}` } as Broker]);
    }
    setIsBrokerModalOpen(false);
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(routeRules());
    if (!ok) return;
    const finalTrackingId = routeForm.trackingId || `RT-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateRoutes(routes.map(r => r.id === editingItem.id ? { ...r, ...routeForm, trackingId: finalTrackingId } as Route : r));
    } else {
      onUpdateRoutes([...routes, { ...routeForm, trackingId: finalTrackingId, id: `R-${Date.now()}` } as Route]);
    }
    setIsRouteModalOpen(false);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(bankRules());
    if (!ok) return;
    const finalTrackingId = bankForm.trackingId || `BANK-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateBanks(banks.map(b => b.id === editingItem.id ? { ...b, ...bankForm, trackingId: finalTrackingId } as Bank : b));
    } else {
      onUpdateBanks([...banks, { ...bankForm, trackingId: finalTrackingId, id: `B-${Date.now()}` } as Bank]);
    }
    setIsBankModalOpen(false);
  };

  const handleItemProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(itemProductRules());
    if (!ok) return;
    const finalTrackingId = itemProductForm.trackingId || `PROD-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateItemProducts(itemProducts.map(p => p.id === editingItem.id ? { ...p, ...itemProductForm, trackingId: finalTrackingId } as ItemProduct : p));
    } else {
      onUpdateItemProducts([...itemProducts, { ...itemProductForm, trackingId: finalTrackingId, id: `PROD-${Date.now()}` } as ItemProduct]);
    }
    setIsItemProductModalOpen(false);
  };

  const handleAddService = () => {
    if (newService.trim()) {
      setItemProductForm({
        ...itemProductForm,
        services: [...(itemProductForm.services || []), newService.trim()]
      });
      setNewService('');
    }
  };

  const handleRemoveService = (index: number) => {
    setItemProductForm({
      ...itemProductForm,
      services: itemProductForm.services?.filter((_, i) => i !== index)
    });
  };

  const handleFuelSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate(fuelSiteRules());
    if (!ok) return;
    const finalTrackingId = fuelSiteForm.trackingId || `FUEL-${Date.now().toString().slice(-6)}`;
    if (editingItem) {
      onUpdateFuelSites(fuelSites.map(s => s.id === editingItem.id ? { ...s, ...fuelSiteForm, trackingId: finalTrackingId } as FuelSite : s));
    } else {
      onUpdateFuelSites([...fuelSites, { ...fuelSiteForm, trackingId: finalTrackingId, id: `FUEL-${Date.now()}` } as FuelSite]);
    }
    setIsFuelSiteModalOpen(false);
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate({
      name: { value: driverForm.name, label: 'Full Name', type: 'text' },
      phoneNumber: { value: driverForm.phoneNumber, label: 'Phone Number', type: 'phone' },
      whatsappNumber: { value: driverForm.whatsappNumber, label: 'WhatsApp Number', type: 'phone' },
      licenseExpiry: { value: driverForm.licenseExpiry, label: 'License Expiry' },
      address: { value: driverForm.address, label: 'Address', type: 'text' },
      bankName: { value: driverForm.bankName, label: 'Bank Name', type: 'text' },
      upiId: { value: driverForm.upiId, label: 'UPI ID', type: 'upi' },
      drvEmail: { value: driverForm.email, label: 'Email', type: 'email', optional: true },
      drvIfscCode: { value: driverForm.ifscCode, label: 'IFSC Code', type: 'ifsc', optional: true },
      drvAccountNumber: { value: driverForm.accountNumber, label: 'Account Number', type: 'accountNumber', optional: true },
      experienceYears: { value: driverForm.experienceYears, label: 'Experience (Years)', type: 'number', min: 0, max: 60, optional: true },
    });
    if (!ok) return;
    const finalTrackingId = driverForm.trackingId || `DRV-${Date.now().toString().slice(-6)}`;
    
    // Combine bank fields into bankDetails string for backward compatibility
    const combinedBankDetails = driverForm.bankName && driverForm.accountNumber 
      ? `${driverForm.bankName} A/c ${driverForm.accountNumber}`
      : driverForm.bankDetails || '';
      
    const updatedForm = {
      ...driverForm,
      bankDetails: combinedBankDetails,
      trackingId: finalTrackingId
    };

    if (editingItem) {
      onUpdateDrivers(drivers.map(d => d.id === editingItem.id ? { ...d, ...updatedForm } as Driver : d));
    } else {
      onUpdateDrivers([...drivers, { ...updatedForm, id: `D-${Date.now()}` } as Driver]);
    }
    setIsDriverModalOpen(false);
  };

  const handleTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate({
      name: { value: truckForm.name, label: 'Truck Name', type: 'text' },
      truckNumber: { value: truckForm.truckNumber || truckForm.plateNumber, label: 'Truck Number', type: 'text' },
      ownerName: { value: truckForm.ownerName, label: 'Owner Name', type: 'text' },
      ownerContact: { value: truckForm.ownerContact, label: 'Owner Contact', type: 'phone' },
      mileage: { value: truckForm.mileage, label: 'Mileage (KM/L)', type: 'positiveNumber', optional: true },
      dieselLimit: { value: truckForm.dieselLimit, label: 'Diesel Limit (L)', type: 'positiveNumber', optional: true },
      currentOdometer: { value: truckForm.currentOdometer, label: 'Odometer (KM)', type: 'number', min: 0, optional: true },
      driverScore: { value: truckForm.driverScore, label: 'Driver Score', type: 'number', min: 0, max: 100, optional: true },
    });
    if (!ok) return;
    const assignedDriver = drivers.find(d => d.id === truckForm.assignedDriverId);
    const finalTrackingId = truckForm.trackingId || `TRK-${Date.now().toString().slice(-6)}`;
    const finalData = { 
      ...initialTruckForm,
      ...truckForm, 
      trackingId: finalTrackingId,
      truckNumber: truckForm.truckNumber || truckForm.plateNumber, 
      driverName: assignedDriver ? assignedDriver.name : 'Unassigned' 
    };
    if (editingItem) { 
      onUpdateTrucks(trucks.map(t => t.id === editingItem.id ? { ...t, ...finalData } as Truck : t)); 
    } else { 
      onUpdateTrucks([...trucks, { ...finalData, id: `T-${Date.now()}` } as Truck]); 
    }
    setIsTruckModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    
    const matches = (val: string | undefined | null) => (val || "").toLowerCase().includes(q);

    if (activeSubTab === 'trucks') {
      return trucks.filter(t => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(t.truckNumber) || matches(t.name) || matches(t.ownerName) || matches(t.trackingId);
        if (searchCategory === 'NAME') return matches(t.name) || matches(t.ownerName);
        if (searchCategory === 'ID') return matches(t.truckNumber) || matches(t.plateNumber) || matches(t.trackingId);
        if (searchCategory === 'CONTACT') return matches(t.ownerContact);
        return false;
      });
    }
    if (activeSubTab === 'drivers') {
      return drivers.filter(d => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(d.name) || matches(d.phoneNumber) || matches(d.trackingId);
        if (searchCategory === 'NAME') return matches(d.name);
        if (searchCategory === 'ID') return matches(d.trackingId);
        if (searchCategory === 'CONTACT') return matches(d.phoneNumber) || matches(d.whatsappNumber);
        return false;
      });
    }
    if (activeSubTab === 'employees') {
      return employees.filter(e => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(e.fullName) || matches(e.phoneNumber) || matches(e.trackingId);
        if (searchCategory === 'NAME') return matches(e.fullName);
        if (searchCategory === 'ID') return matches(e.trackingId);
        if (searchCategory === 'CONTACT') return matches(e.phoneNumber) || matches(e.whatsappNumber);
        return false;
      });
    }
    if (activeSubTab === 'clients') {
      return clients.filter(c => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(c.name) || matches(c.gstNumber) || matches(c.contactPerson) || matches(c.trackingId);
        if (searchCategory === 'NAME') return matches(c.name) || matches(c.contactPerson);
        if (searchCategory === 'ID') return matches(c.gstNumber) || matches(c.trackingId);
        if (searchCategory === 'CONTACT') return matches(c.email) || matches(c.phone);
        if (searchCategory === 'LOCATION') return matches(c.address);
        return false;
      });
    }
    if (activeSubTab === 'sites') {
      return sites.filter(s => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(s.name) || matches(s.location) || matches(s.trackingId);
        if (searchCategory === 'NAME') return matches(s.name);
        if (searchCategory === 'ID') return matches(s.trackingId);
        if (searchCategory === 'LOCATION') return matches(s.location);
        return false;
      });
    }
    if (activeSubTab === 'brokers') {
      return brokers.filter(b => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(b.name) || matches(b.phone) || matches(b.email) || matches(b.trackingId);
        if (searchCategory === 'NAME') return matches(b.name);
        if (searchCategory === 'ID') return matches(b.trackingId);
        if (searchCategory === 'CONTACT') return matches(b.phone) || matches(b.email) || matches(b.whatsappNumber);
        if (searchCategory === 'LOCATION') return matches(b.address);
        return false;
      });
    }
    if (activeSubTab === 'routes') {
      return routes.filter(r => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(r.source) || matches(r.destination) || matches(r.trackingId);
        if (searchCategory === 'ID') return matches(r.trackingId);
        if (searchCategory === 'LOCATION') return matches(r.source) || matches(r.destination);
        return false;
      });
    }
    if (activeSubTab === 'banks') {
      return banks.filter(b => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(b.bankName) || matches(b.accountNumber) || matches(b.trackingId);
        if (searchCategory === 'NAME') return matches(b.bankName);
        if (searchCategory === 'ID') return matches(b.accountNumber) || matches(b.trackingId);
        return false;
      });
    }
    if (activeSubTab === 'item-products') {
      return itemProducts.filter(p => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(p.productName) || matches(p.productColour) || matches(p.trackingId);
        if (searchCategory === 'NAME') return matches(p.productName);
        if (searchCategory === 'ID') return matches(p.trackingId);
        return false;
      });
    }
    if (activeSubTab === 'fuel-sites') {
      return fuelSites.filter(s => {
        if (!q) return true;
        if (searchCategory === 'ALL') return matches(s.companyName) || matches(s.ownerName) || matches(s.gstNumber) || matches(s.trackingId);
        if (searchCategory === 'NAME') return matches(s.companyName) || matches(s.ownerName);
        if (searchCategory === 'ID') return matches(s.gstNumber) || matches(s.trackingId);
        if (searchCategory === 'CONTACT') return matches(s.phoneNumber) || matches(s.contactEmail);
        if (searchCategory === 'LOCATION') return matches(s.address);
        return false;
      });
    }
    return [];
  }, [activeSubTab, searchQuery, searchCategory, trucks, drivers, employees, clients, sites, brokers, routes, banks, itemProducts, fuelSites]);

  return (
    <div className="page-stack pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight tracking-tight">Master Database</h2>
          <p className="text-slate-500 text-sm font-medium">Manage fleet, staff, clients, and logistics points.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {(['trucks', 'drivers', 'employees', 'clients', 'sites', 'brokers', 'routes', 'banks', 'item-products', 'fuel-sites'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all capitalize whitespace-nowrap ${activeSubTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-[#F5F4F0]'}`}
            >
              {tab === 'sites' ? 'Stations & Sites' : tab === 'item-products' ? 'Items Products' : tab === 'fuel-sites' ? 'Fuels&Site' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative flex items-center bg-white border border-[#E7E5E0] rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-sm">
          <div className="relative flex items-center border-r border-slate-100">
            <select 
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value as any)}
              className="pl-4 pr-10 py-3.5 bg-transparent border-none font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer hover:bg-[#F5F4F0] transition-all appearance-none"
            >
              <option value="ALL">All Search</option>
              <option value="NAME">By Name</option>
              <option value="ID">By ID/Reg</option>
              <option value="CONTACT">By Contact</option>
              <option value="LOCATION">By Location</option>
            </select>
            <div className="absolute right-3 pointer-events-none text-slate-400">
              <ChevronDown size={12} />
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={
                searchCategory === 'ALL' ? `Search ${activeSubTab}...` : 
                `Search ${activeSubTab} by ${searchCategory.toLowerCase()}...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-transparent border-none outline-none font-bold text-sm"
            />
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal(activeSubTab)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} /> Add {activeSubTab.slice(0, -1)}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {activeSubTab === 'trucks' && (filteredItems as Truck[]).map((truck: Truck) => (
          <div key={truck.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <TruckIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{truck.truckNumber}</h3>
                      {truck.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200">ID: {truck.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5">{truck.name}</p>
                  </div>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal('trucks', truck)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16}/></button>
                  <button onClick={() => onUpdateTrucks(trucks.filter(t => t.id !== truck.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-[#F5F4F0] p-2.5 rounded-xl border border-slate-100 mb-2">
                <UserCheck size={14} className="text-blue-500" />
                <span>Driver: <span className="text-slate-900 font-black">{truck.driverName}</span></span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 bg-[#F5F4F0] rounded-xl border border-slate-100 text-[10px]">
                <span className="block font-black text-slate-400 uppercase tracking-tight">Handled</span>
                <span className="font-black text-slate-900">{truck.totalMtHandled} MT</span>
              </div>
              <div className="p-2 bg-[#F5F4F0] rounded-xl border border-slate-100 text-[10px]">
                <span className="block font-black text-slate-400 uppercase tracking-tight">Mileage</span>
                <span className="font-black text-slate-900">{truck.mileage} KM/L</span>
              </div>
            </div>
          </div>
        ))}

        {activeSubTab === 'drivers' && (filteredItems as Driver[]).map((driver: Driver) => (
          <div key={driver.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{driver.name}</h3>
                      {driver.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {driver.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1.5">{driver.phoneNumber}</p>
                    {driver.email && <p className="text-[10px] font-bold text-slate-500 mt-1 lowercase truncate max-w-[160px]" title={driver.email}>{driver.email}</p>}
                  </div>
               </div>
               <div className="flex gap-1">
                  <a href={`tel:${driver.phoneNumber}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>
                  <a href={`https://wa.me/${(driver.whatsappNumber || "").replace(/\D/g, '')}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><MessageCircle size={16}/></a>
                  <button onClick={() => handleOpenModal('drivers', driver)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"><Edit size={16}/></button>
                  <button onClick={() => onUpdateDrivers(drivers.filter(d => d.id !== driver.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">License Expiry</p>
                  <p className="text-xs font-black text-slate-900">{driver.licenseExpiry || 'N/A'}</p>
              </div>
              <div className="p-3 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Join Date</p>
                  <p className="text-xs font-black text-slate-900">{driver.joinDate || 'N/A'}</p>
              </div>
            </div>

            {(driver.bankName || driver.accountNumber || driver.ifscCode || driver.upiId) && (
              <div className="mt-3 p-3 bg-indigo-50/30 rounded-2xl border border-indigo-50 space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-black text-indigo-400 uppercase">
                  <span>Bank Details</span>
                  <Landmark size={12} className="text-indigo-500" />
                </div>
                <p className="text-[10px] font-black text-slate-900 truncate">
                  {driver.bankName || 'N/A'} {driver.accountNumber ? `• ${driver.accountNumber}` : ''}
                </p>
                <p className="text-[10px] font-bold text-slate-500 truncate">
                  {driver.ifscCode ? `IFSC: ${driver.ifscCode}` : ''} {driver.ifscCode && driver.upiId ? ' • ' : ''} {driver.upiId ? `UPI: ${driver.upiId}` : ''}
                </p>
              </div>
            )}

            {driver.exitDate && (
              <div className="mt-2 p-3 bg-red-50 rounded-2xl border border-red-100 space-y-1">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-tight">Exit Date</p>
                  <p className="text-xs font-black text-red-600">{driver.exitDate}</p>
              </div>
            )}
          </div>
        ))}

        {activeSubTab === 'employees' && (filteredItems as Employee[]).map((emp: Employee) => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-purple-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{emp.fullName}</h3>
                      {emp.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {emp.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-1.5">{emp.phoneNumber}</p>
                    {emp.email && <p className="text-[10px] font-bold text-slate-500 mt-1 lowercase truncate max-w-[160px]" title={emp.email}>{emp.email}</p>}
                  </div>
               </div>
               <div className="flex gap-1">
                  <a href={`tel:${emp.phoneNumber}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>
                  <a href={`https://wa.me/${(emp.whatsappNumber || "").replace(/\D/g, '')}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><MessageCircle size={16}/></a>
                  <button onClick={() => handleOpenModal('employees', emp)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"><Edit size={16}/></button>
                  <button onClick={() => onUpdateEmployees(employees.filter(e => e.id !== emp.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 bg-[#F5F4F0] rounded-xl border border-slate-100">
                     <span className="block font-black text-slate-400 uppercase tracking-tight">Joined</span>
                     <span className="font-black text-slate-900">{emp.joinDate}</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F4F0] rounded-xl border border-slate-100">
                     <span className="block font-black text-slate-400 uppercase tracking-tight">Status</span>
                     <span className={`font-black uppercase ${emp.exitDate ? 'text-red-500' : 'text-green-500'}`}>{emp.exitDate ? 'Resigned' : 'Active'}</span>
                  </div>
               </div>
               <div className="p-3 bg-[#F5F4F0] rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                     <span>Bank Account</span>
                     <Landmark size={12} />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 truncate">{emp.bankAccountDetails.bankName} • {emp.bankAccountDetails.accountNumber}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{emp.bankAccountDetails.ifscCode} • {emp.bankAccountDetails.upiId}</p>
               </div>
               <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <MapPin size={14} className="text-slate-300" />
                  <span className="truncate">{emp.address}</span>
               </div>
            </div>
          </div>
        ))}

        {activeSubTab === 'clients' && (filteredItems as Client[]).map((client: Client) => (
          <div key={client.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-green-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none truncate max-w-[150px]">{client.name}</h3>
                      {client.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0 uppercase">ID: {client.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1.5">{client.gstNumber}</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  <a href={`tel:${client.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>
                  <a href={`https://wa.me/${(client.phone || "").replace(/\D/g, '')}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><MessageCircle size={16}/></a>
                  <button onClick={() => handleOpenModal('clients', client)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateClients(clients.filter(c => c.id !== client.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Mail size={14} className="text-slate-300" />
                  <span className="truncate">{client.email}</span>
               </div>
               <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Primary Contact</span>
                  <span className="text-[10px] font-black text-slate-900">{client.contactPerson}</span>
               </div>
            </div>
          </div>
        ))}

        {activeSubTab === 'sites' && (filteredItems as Site[]).map((site: Site) => (
          <div key={site.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 ${site.type === 'TPS' ? 'border-l-amber-500' : 'border-l-purple-500'}`}>
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${site.type === 'TPS' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                    {site.type === 'TPS' ? <Factory size={24} /> : <Building size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{site.name}</h3>
                      {site.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {site.trackingId}</span>}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${site.type === 'TPS' ? 'text-amber-600' : 'text-purple-600'}`}>{site.type === 'TPS' ? 'Source / Loading' : 'Delivery / Client'}</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  {site.contactPhone && <a href={`tel:${site.contactPhone}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>}
                  <button onClick={() => handleOpenModal('sites', site)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateSites(sites.filter(s => s.id !== site.id))} className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-[#F5F4F0] p-3 rounded-2xl border border-slate-100">
               <MapPin size={16} className="text-slate-300 shrink-0" />
               <span className="truncate">{site.location}</span>
            </div>
          </div>
        ))}

        {activeSubTab === 'brokers' && (filteredItems as Broker[]).map((broker: Broker) => (
          <div key={broker.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Briefcase size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none truncate max-w-[150px]">{broker.name}</h3>
                      {broker.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0 uppercase">ID: {broker.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5">{broker.phone}</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  <a href={`tel:${broker.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>
                  <a href={`https://wa.me/${(broker.whatsappNumber || "").replace(/\D/g, '')}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><MessageCircle size={16}/></a>
                  <button onClick={() => handleOpenModal('brokers', broker)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateBrokers(brokers.filter(b => b.id !== broker.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Mail size={14} className="text-slate-300" />
                  <span className="truncate">{broker.email}</span>
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <MapPin size={14} className="text-slate-300" />
                  <span className="truncate">{broker.address}</span>
               </div>
               <div className="mt-4 pt-3 border-t border-slate-50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UPI ID</span>
                    <span className="text-[10px] font-black text-slate-900">{broker.upiId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank</span>
                    <span className="text-[10px] font-black text-slate-900">{broker.bankDetails.bankName}</span>
                  </div>
               </div>
            </div>
          </div>
        ))}

        {activeSubTab === 'routes' && (filteredItems as Route[]).map((route: Route) => {
          const sourceSite = sites.find(s => s.name === route.source);
          const destSite = sites.find(s => s.name === route.destination);
          
          // Construct the map link using custom URLs if available, otherwise fallback to site locations/names
          const originVal = route.sourceMapUrl || sourceSite?.location || route.source;
          const destVal = route.destinationMapUrl || destSite?.location || route.destination;
          const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originVal)}&destination=${encodeURIComponent(destVal)}&travelmode=driving`;

          return (
            <div key={route.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-orange-500">
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                      <MapPin size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-lg leading-none truncate max-w-[150px]">{route.source} → {route.destination}</h3>
                        {route.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 shrink-0 uppercase">ID: {route.trackingId}</span>}
                      </div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1.5">{route.distanceKm} KM</p>
                    </div>
                 </div>
                 <div className="flex gap-1">
                    <a 
                      href={mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 px-3"
                      title="Open Directions in Google Maps"
                    >
                      <Navigation size={14} />
                      <span className="text-[10px] font-black uppercase tracking-tight">Directions</span>
                    </a>
                    <button onClick={() => handleOpenModal('routes', route)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                    <button onClick={() => onUpdateRoutes(routes.filter(r => r.id !== route.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                 </div>
              </div>
              <div className="space-y-2">
                 <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-[#F5F4F0] p-3 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400 flex items-center gap-1">
                        Source
                        {route.sourceMapUrl && (
                          <a href={route.sourceMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <Globe size={10} />
                          </a>
                        )}
                      </span>
                      <span className="text-slate-900">{route.source}</span>
                    </div>
                    <div className="h-px flex-1 bg-slate-200 mx-4 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[8px] font-black text-slate-400">{route.distanceKm} KM</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase text-slate-400 flex items-center gap-1">
                        {route.destinationMapUrl && (
                          <a href={route.destinationMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <Globe size={10} />
                          </a>
                        )}
                        Destination
                      </span>
                      <span className="text-slate-900">{route.destination}</span>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}

        {activeSubTab === 'banks' && (filteredItems as Bank[]).map((bank: Bank) => (
          <div key={bank.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm bg-blue-50 text-blue-600">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{bank.bankName}</h3>
                      {bank.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {bank.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-slate-400">Bank Account</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  <button onClick={() => handleOpenModal('banks', bank)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateBanks(banks.filter(b => b.id !== bank.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600 bg-[#F5F4F0] p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-slate-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-slate-400">Account No</span>
                      <span className="text-slate-900 font-black">{bank.accountNumber}</span>
                    </div>
                  </div>
                  {bank.ifscCode && (
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] uppercase text-indigo-400 tracking-wider">IFSC Code</span>
                      <span className="text-slate-900 font-black uppercase text-[11px]">{bank.ifscCode}</span>
                    </div>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-[#F5F4F0] rounded-xl border border-slate-100 text-[10px]">
                    <span className="block font-black text-slate-400 uppercase tracking-tight">Check No</span>
                    <span className="font-black text-slate-900">{bank.checkNumber || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-[#F5F4F0] rounded-xl border border-slate-100 text-[10px]">
                    <span className="block font-black text-slate-400 uppercase tracking-tight">Address</span>
                    <span className="font-black text-slate-900 truncate block">{bank.bankAddress}</span>
                  </div>
               </div>

               {(bank.managerName || bank.managerPhone || bank.managerEmail || bank.managerWhatsapp) && (
                 <div className="p-3 bg-indigo-50/20 rounded-2xl border border-indigo-50/50 space-y-1.5 text-[10px]">
                   <div className="flex justify-between items-center text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                     <span>Contact Manager</span>
                     <User size={10} className="text-indigo-400" />
                   </div>
                   {bank.managerName && <p className="font-black text-slate-800">{bank.managerName}</p>}
                   <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 font-bold">
                     {bank.managerPhone && (
                       <span className="flex items-center gap-1">
                         <Phone size={10} className="text-slate-300" /> {bank.managerPhone}
                       </span>
                     )}
                     {bank.managerWhatsapp && (
                       <span className="flex items-center gap-1">
                         <MessageCircle size={10} className="text-emerald-400 shrink-0" /> {bank.managerWhatsapp}
                       </span>
                     )}
                     {bank.managerEmail && (
                       <span className="flex items-center gap-1">
                         <Mail size={10} className="text-slate-300" /> {bank.managerEmail}
                       </span>
                     )}
                   </div>
                 </div>
               )}

               <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic px-1">{bank.description}</p>
            </div>
          </div>
        ))}

        {activeSubTab === 'item-products' && (filteredItems as ItemProduct[]).map((prod: ItemProduct) => (
          <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-cyan-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm bg-cyan-50 text-cyan-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{prod.productName}</h3>
                      {prod.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {prod.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-slate-400">Inventory Item {prod.hsnSacCode && `• HSN: ${prod.hsnSacCode}`}</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  <button onClick={() => handleOpenModal('item-products', prod)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateItemProducts(itemProducts.filter(p => p.id !== prod.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-[#F5F4F0] p-3 rounded-2xl border border-slate-100 flex-1">
                     <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: (prod.productColour || "").toLowerCase().replace(/[^a-z0-9#]/g, '') }}></div>
                     <div className="flex flex-col min-w-0">
                       <span className="text-[9px] uppercase text-slate-400">Colour</span>
                       <span className="text-slate-900 font-black truncate">{prod.productColour}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-[#F5F4F0] p-3 rounded-2xl border border-slate-100 flex-1">
                     <Percent size={14} className="text-cyan-600 shrink-0" />
                     <div className="flex flex-col min-w-0">
                       <span className="text-[9px] uppercase text-slate-400">GST</span>
                       <span className="text-slate-900 font-black truncate">{prod.gstRate || 0}%</span>
                     </div>
                  </div>
               </div>

               {prod.services && prod.services.length > 0 && (
                 <div className="p-3 bg-[#F5F4F0] rounded-2xl border border-slate-100">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Linked Services</span>
                   <div className="flex flex-wrap gap-1.5">
                     {prod.services.map((s, idx) => (
                       <span key={idx} className="text-[9px] font-black px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600 uppercase italic">
                         {s}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        ))}

        {activeSubTab === 'fuel-sites' && (filteredItems as FuelSite[]).map((fs: FuelSite) => (
          <div key={fs.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 group border-l-4 border-l-rose-500">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                    <Fuel size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 text-lg leading-none">{fs.companyName}</h3>
                      {fs.trackingId && <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded-md border border-slate-200 uppercase">ID: {fs.trackingId}</span>}
                    </div>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1.5">{fs.ownerName}</p>
                  </div>
               </div>
               <div className="flex gap-1">
                  <a href={`tel:${fs.phoneNumber}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={16}/></a>
                  {fs.googleMapLink && <a href={fs.googleMapLink} target="_blank" className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Globe size={16}/></a>}
                  <button onClick={() => handleOpenModal('fuel-sites', fs)} className="p-2 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit size={16}/></button>
                  <button onClick={() => onUpdateFuelSites(fuelSites.filter(s => s.id !== fs.id))} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
               </div>
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 bg-[#F5F4F0] rounded-xl border border-slate-100">
                     <span className="block font-black text-slate-400 uppercase tracking-tight">WhatsApp</span>
                     <span className="font-black text-slate-900">{fs.whatsappNumber}</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F4F0] rounded-xl border border-slate-100 flex flex-col justify-center">
                     <span className="block font-black text-slate-400 uppercase tracking-tight">GST</span>
                     <span className="font-black text-slate-900 truncate">{fs.gstNumber}</span>
                  </div>
               </div>
               <div className="p-3 bg-rose-50/20 rounded-2xl border border-rose-100/50 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black text-rose-500 uppercase tracking-widest">
                     <span>Bank Account Details</span>
                     <Landmark size={12} className="text-rose-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 truncate">
                    {fs.bankName || 'N/A'} {fs.accountNumber ? `• ${fs.accountNumber}` : ''}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">
                    {fs.ifscCode ? `IFSC: ${fs.ifscCode}` : ''} {fs.ifscCode && fs.upiId ? ' • ' : ''} {fs.upiId ? `UPI: ${fs.upiId}` : ''}
                  </p>
               </div>
               <div className="flex items-start gap-2 text-[10px] text-slate-500 font-medium">
                  <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{fs.address}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bank Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Bank Record' : 'Add Bank Record'}</h3>
              <button onClick={() => { setIsBankModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleBankSubmit} onBlur={() => validate(bankRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={bankForm.trackingId ?? ''} onChange={e => setBankForm({...bankForm, trackingId: e.target.value})} placeholder="e.g. BANK-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bank Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'bankName')} value={bankForm.bankName ?? ''} onChange={e => { setBankForm({...bankForm, bankName: e.target.value}); clearField('bankName'); }} placeholder="e.g. HDFC Bank" />
                  {fieldErr('bankName')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Account Number*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'accountNumber')} value={bankForm.accountNumber ?? ''} onChange={e => { setBankForm({...bankForm, accountNumber: e.target.value}); clearField('accountNumber'); }} placeholder="9–18 digit account number" />
                  {fieldErr('accountNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">IFSC Code*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase", 'ifscCode')} value={bankForm.ifscCode ?? ''} onChange={e => { setBankForm({...bankForm, ifscCode: e.target.value.toUpperCase()}); clearField('ifscCode'); }} placeholder="e.g. HDFC0001234" />
                  {fieldErr('ifscCode')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Check Number</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={bankForm.checkNumber ?? ''} onChange={e => setBankForm({...bankForm, checkNumber: e.target.value})} placeholder="e.g. 001234" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bank Address</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={bankForm.bankAddress ?? ''} onChange={e => setBankForm({...bankForm, bankAddress: e.target.value})} placeholder="Branch location..." />
                </div>
               </div>

               <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-200/60 space-y-4">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                   <User size={14} className="text-indigo-600" /> Bank Manager Details
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Manager Name</label>
                     <input 
                       type="text" 
                       className="w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                       value={bankForm.managerName ?? ''} 
                       onChange={e => setBankForm({...bankForm, managerName: e.target.value})} 
                       placeholder="e.g. John Doe" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                     <input
                       type="email"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'managerEmail')}
                       value={bankForm.managerEmail ?? ''}
                       onChange={e => { setBankForm({...bankForm, managerEmail: e.target.value}); clearField('managerEmail'); }}
                       placeholder="e.g. manager@bank.com"
                     />
                     {fieldErr('managerEmail')}
                   </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                     <input
                       type="tel"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'managerPhone')}
                       value={bankForm.managerPhone ?? ''}
                       onChange={e => { setBankForm({...bankForm, managerPhone: e.target.value}); clearField('managerPhone'); }}
                       placeholder="e.g. +91 XXXXX XXXXX"
                     />
                     {fieldErr('managerPhone')}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp Number</label>
                     <input
                       type="tel"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'managerWhatsapp')}
                       value={bankForm.managerWhatsapp ?? ''}
                       onChange={e => { setBankForm({...bankForm, managerWhatsapp: e.target.value}); clearField('managerWhatsapp'); }}
                       placeholder="e.g. +91 XXXXX XXXXX"
                     />
                     {fieldErr('managerWhatsapp')}
                   </div>
                 </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <textarea className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" rows={2} value={bankForm.description ?? ''} onChange={e => setBankForm({...bankForm, description: e.target.value})} placeholder="Transaction notes..." />
               </div>
               <button type="submit" disabled={!isValid(bankRules())} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Bank Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => { setIsEmployeeModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleEmployeeSubmit} onBlur={() => validate(employeeRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={employeeForm.trackingId ?? ''} onChange={e => setEmployeeForm({...employeeForm, trackingId: e.target.value})} placeholder="e.g. EMP-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'fullName')} value={employeeForm.fullName ?? ''} onChange={e => { setEmployeeForm({...employeeForm, fullName: e.target.value}); clearField('fullName'); }} placeholder="e.g. John Doe" />
                  {fieldErr('fullName')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Phone Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'phoneNumber')} value={employeeForm.phoneNumber ?? ''} onChange={e => { setEmployeeForm({...employeeForm, phoneNumber: e.target.value}); clearField('phoneNumber'); }} placeholder="98XXXXXXXX" />
                  {fieldErr('phoneNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                  <input type="email" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'email')} value={employeeForm.email ?? ''} onChange={e => { setEmployeeForm({...employeeForm, email: e.target.value}); clearField('email'); }} placeholder="e.g. employee@company.com" />
                  {fieldErr('email')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'whatsappNumber')} value={employeeForm.whatsappNumber ?? ''} onChange={e => { setEmployeeForm({...employeeForm, whatsappNumber: e.target.value}); clearField('whatsappNumber'); }} placeholder="98XXXXXXXX" />
                  {fieldErr('whatsappNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Address*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'address')} value={employeeForm.address ?? ''} onChange={e => { setEmployeeForm({...employeeForm, address: e.target.value}); clearField('address'); }} placeholder="Full address..." />
                  {fieldErr('address')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Join Date*</label>
                  <input type="date" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'joinDate')} value={employeeForm.joinDate ?? ''} onChange={e => { setEmployeeForm({...employeeForm, joinDate: e.target.value}); clearField('joinDate'); }} />
                  {fieldErr('joinDate')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Exit Date (Optional)</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={employeeForm.exitDate ?? ''} onChange={e => setEmployeeForm({...employeeForm, exitDate: e.target.value})} />
                </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Landmark size={14} className="text-blue-600" /> Bank Account Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="t-label px-1">Account Number*</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'empAccountNumber')} value={employeeForm.bankAccountDetails?.accountNumber ?? ''} onChange={e => { setEmployeeForm({...employeeForm, bankAccountDetails: {...employeeForm.bankAccountDetails!, accountNumber: e.target.value}}); clearField('empAccountNumber'); }} placeholder="9–18 digit account number" />
                      {fieldErr('empAccountNumber')}
                    </div>
                    <div className="space-y-2">
                      <label className="t-label px-1">Bank Name*</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'empBankName')} value={employeeForm.bankAccountDetails?.bankName ?? ''} onChange={e => { setEmployeeForm({...employeeForm, bankAccountDetails: {...employeeForm.bankAccountDetails!, bankName: e.target.value}}); clearField('empBankName'); }} placeholder="e.g. HDFC Bank" />
                      {fieldErr('empBankName')}
                    </div>
                    <div className="space-y-2">
                      <label className="t-label px-1">IFSC Code*</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase", 'empIfscCode')} value={employeeForm.bankAccountDetails?.ifscCode ?? ''} onChange={e => { setEmployeeForm({...employeeForm, bankAccountDetails: {...employeeForm.bankAccountDetails!, ifscCode: e.target.value.toUpperCase()}}); clearField('empIfscCode'); }} placeholder="e.g. HDFC0001234" />
                      {fieldErr('empIfscCode')}
                    </div>
                    <div className="space-y-2">
                      <label className="t-label px-1">UPI ID*</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'empUpiId')} value={employeeForm.bankAccountDetails?.upiId ?? ''} onChange={e => { setEmployeeForm({...employeeForm, bankAccountDetails: {...employeeForm.bankAccountDetails!, upiId: e.target.value}}); clearField('empUpiId'); }} placeholder="user@upi" />
                      {fieldErr('empUpiId')}
                    </div>
                  </div>
               </div>
               
               <button type="submit" disabled={!isValid(employeeRules())} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Employee Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button onClick={() => { setIsDriverModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleDriverSubmit} onBlur={() => validate(driverRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={driverForm.trackingId ?? ''} onChange={e => setDriverForm({...driverForm, trackingId: e.target.value})} placeholder="e.g. DRV-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'name')} value={driverForm.name ?? ''} onChange={e => { setDriverForm({...driverForm, name: e.target.value}); clearField('name'); }} placeholder="e.g. Rahul Sharma" />
                  {fieldErr('name')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Phone Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'phoneNumber')} value={driverForm.phoneNumber ?? ''} onChange={e => { setDriverForm({...driverForm, phoneNumber: e.target.value}); clearField('phoneNumber'); }} placeholder="+91 XXXXX XXXXX" />
                  {fieldErr('phoneNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                  <input type="email" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'drvEmail')} value={driverForm.email ?? ''} onChange={e => { setDriverForm({...driverForm, email: e.target.value}); clearField('drvEmail'); }} placeholder="e.g. driver@company.com" />
                  {fieldErr('drvEmail')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'whatsappNumber')} value={driverForm.whatsappNumber ?? ''} onChange={e => { setDriverForm({...driverForm, whatsappNumber: e.target.value}); clearField('whatsappNumber'); }} placeholder="+91 XXXXX XXXXX" />
                  {fieldErr('whatsappNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">License Expiry*</label>
                  <input type="date" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'licenseExpiry')} value={driverForm.licenseExpiry ?? ''} onChange={e => { setDriverForm({...driverForm, licenseExpiry: e.target.value}); clearField('licenseExpiry'); }} />
                  {fieldErr('licenseExpiry')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Joining Date*</label>
                  <input type="date" required className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={driverForm.joinDate ?? ''} onChange={e => setDriverForm({...driverForm, joinDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Exit Date (Optional)</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={driverForm.exitDate ?? ''} onChange={e => setDriverForm({...driverForm, exitDate: e.target.value})} />
                </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Driver Address*</label>
                  <textarea className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'address')} rows={2} value={driverForm.address ?? ''} onChange={e => { setDriverForm({...driverForm, address: e.target.value}); clearField('address'); }} placeholder="Permanent address..." />
                  {fieldErr('address')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Experience (Years)</label>
                  <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={driverForm.experienceYears ?? 0} onChange={e => setDriverForm({...driverForm, experienceYears: parseInt(e.target.value)})} placeholder="e.g. 5" />
               </div>
               <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-200/60 space-y-4 col-span-full">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Landmark size={14} className="text-indigo-600" /> Bank Account Details
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bank Name*</label>
                     <input
                       type="text"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'bankName')}
                       value={driverForm.bankName ?? ''}
                       onChange={e => { setDriverForm({...driverForm, bankName: e.target.value}); clearField('bankName'); }}
                       placeholder="e.g. State Bank of India"
                     />
                     {fieldErr('bankName')}
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Account Number</label>
                      <input
                        type="text"
                        className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'drvAccountNumber')}
                        value={driverForm.accountNumber ?? ''}
                        onChange={e => { setDriverForm({...driverForm, accountNumber: e.target.value}); clearField('drvAccountNumber'); }}
                        placeholder="9–18 digit account number"
                      />
                      {fieldErr('drvAccountNumber')}
                   </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">IFSC Code</label>
                      <input
                        type="text"
                        className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold uppercase focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'drvIfscCode')}
                        value={driverForm.ifscCode ?? ''}
                        onChange={e => { setDriverForm({...driverForm, ifscCode: e.target.value.toUpperCase()}); clearField('drvIfscCode'); }}
                        placeholder="e.g. SBIN0001234"
                      />
                      {fieldErr('drvIfscCode')}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">UPI ID*</label>
                     <input
                       type="text"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none", 'upiId')}
                       value={driverForm.upiId ?? ''}
                       onChange={e => { setDriverForm({...driverForm, upiId: e.target.value}); clearField('upiId'); }}
                       placeholder="e.g. user@upi"
                     />
                     {fieldErr('upiId')}
                   </div>
                 </div>
               </div>
               <button type="submit" disabled={!isValid(driverRules())} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Driver Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Client Profile' : 'Register Client'}</h3>
              <button onClick={() => { setIsClientModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleClientSubmit} onBlur={() => validate(clientRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={clientForm.trackingId ?? ''} onChange={e => setClientForm({...clientForm, trackingId: e.target.value})} placeholder="e.g. CLNT-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Business Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'name')} value={clientForm.name ?? ''} onChange={e => { setClientForm({...clientForm, name: e.target.value}); clearField('name'); }} />
                  {fieldErr('name')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">GST Number*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase", 'gstNumber')} value={clientForm.gstNumber ?? ''} onChange={e => { setClientForm({...clientForm, gstNumber: e.target.value.toUpperCase()}); clearField('gstNumber'); }} placeholder="22AAAAA0000A1Z5" />
                  {fieldErr('gstNumber')}
                </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Billing Address*</label>
                  <textarea rows={2} className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'address')} value={clientForm.address ?? ''} onChange={e => { setClientForm({...clientForm, address: e.target.value}); clearField('address'); }} />
                  {fieldErr('address')}
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">City*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'city')} value={clientForm.city ?? ''} onChange={e => { setClientForm({...clientForm, city: e.target.value}); clearField('city'); }} />
                   {fieldErr('city')}
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">State*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'state')} value={clientForm.state ?? ''} onChange={e => { setClientForm({...clientForm, state: e.target.value}); clearField('state'); }} />
                   {fieldErr('state')}
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Country</label>
                   <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={clientForm.country ?? ''} onChange={e => setClientForm({...clientForm, country: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Pincode*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'pincode')} value={clientForm.pincode ?? ''} onChange={e => { setClientForm({...clientForm, pincode: e.target.value}); clearField('pincode'); }} />
                   {fieldErr('pincode')}
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Email*</label>
                  <input type="email" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'email')} value={clientForm.email ?? ''} onChange={e => { setClientForm({...clientForm, email: e.target.value}); clearField('email'); }} />
                  {fieldErr('email')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Phone*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'phone')} value={clientForm.phone ?? ''} onChange={e => { setClientForm({...clientForm, phone: e.target.value}); clearField('phone'); }} />
                  {fieldErr('phone')}
                </div>
               </div>
               <button type="submit" disabled={!isValid(clientRules())} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Client Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Site Modal */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Site/Station' : 'Add Station/Site'}</h3>
              <button onClick={() => { setIsSiteModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSiteSubmit} onBlur={() => validate(siteRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={siteForm.trackingId ?? ''} onChange={e => setSiteForm({...siteForm, trackingId: e.target.value})} placeholder="e.g. STN-001" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Site/Station Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'name')} value={siteForm.name ?? ''} onChange={e => { setSiteForm({...siteForm, name: e.target.value}); clearField('name'); }} placeholder="e.g. Wanakbori TPS" />
                  {fieldErr('name')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Site Type*</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setSiteForm({...siteForm, type: 'TPS'})} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all flex flex-col items-center gap-2 ${siteForm.type === 'TPS' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-100 text-slate-400 bg-[#F5F4F0] hover:bg-white'}`}>
                      <Factory size={24} /> Loading Point (TPS)
                    </button>
                    <button type="button" onClick={() => setSiteForm({...siteForm, type: 'CLIENT_SITE'})} className={`p-4 rounded-2xl font-black text-sm border-2 transition-all flex flex-col items-center gap-2 ${siteForm.type === 'CLIENT_SITE' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-slate-100 text-slate-400 bg-[#F5F4F0] hover:bg-white'}`}>
                      <Building size={24} /> Delivery Point (Site)
                    </button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">GST Number</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase" value={siteForm.gstNumber ?? ''} onChange={e => setSiteForm({...siteForm, gstNumber: e.target.value})} placeholder="GSTIN (Optional)" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Location Address*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'location')} value={siteForm.location ?? ''} onChange={e => { setSiteForm({...siteForm, location: e.target.value}); clearField('location'); }} placeholder="e.g. Kheda, Gujarat" />
                  {fieldErr('location')}
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">City*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'city')} value={siteForm.city ?? ''} onChange={e => { setSiteForm({...siteForm, city: e.target.value}); clearField('city'); }} />
                   {fieldErr('city')}
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">State*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'state')} value={siteForm.state ?? ''} onChange={e => { setSiteForm({...siteForm, state: e.target.value}); clearField('state'); }} />
                   {fieldErr('state')}
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Country</label>
                   <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={siteForm.country ?? ''} onChange={e => setSiteForm({...siteForm, country: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Pincode*</label>
                   <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'pincode')} value={siteForm.pincode ?? ''} onChange={e => { setSiteForm({...siteForm, pincode: e.target.value}); clearField('pincode'); }} />
                   {fieldErr('pincode')}
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Phone</label>
                   <input type="tel" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={siteForm.contactPhone ?? ''} onChange={e => setSiteForm({...siteForm, contactPhone: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Email</label>
                   <input type="email" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={siteForm.email ?? ''} onChange={e => setSiteForm({...siteForm, email: e.target.value})} />
                 </div>
               </div>
               <button type="submit" disabled={!isValid(siteRules())} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all">Confirm Site Details</button>
            </form>
          </div>
        </div>
      )}

      {/* Broker Modal */}
      {isBrokerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Broker' : 'Add New Broker'}</h3>
              <button onClick={() => { setIsBrokerModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleBrokerSubmit} onBlur={() => validate(brokerRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={brokerForm.trackingId ?? ''} onChange={e => setBrokerForm({...brokerForm, trackingId: e.target.value})} placeholder="e.g. BKR-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Broker Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'name')} value={brokerForm.name ?? ''} onChange={e => { setBrokerForm({...brokerForm, name: e.target.value}); clearField('name'); }} placeholder="e.g. Shree Logistics" />
                  {fieldErr('name')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address*</label>
                  <input type="email" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'email')} value={brokerForm.email ?? ''} onChange={e => { setBrokerForm({...brokerForm, email: e.target.value}); clearField('email'); }} placeholder="broker@example.com" />
                  {fieldErr('email')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Phone Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'phone')} value={brokerForm.phone ?? ''} onChange={e => { setBrokerForm({...brokerForm, phone: e.target.value}); clearField('phone'); }} placeholder="+91 XXXXX XXXXX" />
                  {fieldErr('phone')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'whatsappNumber')} value={brokerForm.whatsappNumber ?? ''} onChange={e => { setBrokerForm({...brokerForm, whatsappNumber: e.target.value}); clearField('whatsappNumber'); }} placeholder="+91 XXXXX XXXXX" />
                  {fieldErr('whatsappNumber')}
                </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Address*</label>
                  <textarea className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'address')} rows={2} value={brokerForm.address ?? ''} onChange={e => { setBrokerForm({...brokerForm, address: e.target.value}); clearField('address'); }} placeholder="Broker office address..." />
                  {fieldErr('address')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">UPI ID</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'brkUpiId')} value={brokerForm.upiId ?? ''} onChange={e => { setBrokerForm({...brokerForm, upiId: e.target.value}); clearField('brkUpiId'); }} placeholder="broker@upi" />
                  {fieldErr('brkUpiId')}
               </div>
               <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Bank Account Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="t-label px-1">Account Number</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'brkAccountNumber')} value={brokerForm.bankDetails?.accountNumber ?? ''} onChange={e => { setBrokerForm({...brokerForm, bankDetails: {...brokerForm.bankDetails!, accountNumber: e.target.value}}); clearField('brkAccountNumber'); }} placeholder="9–18 digit account number" />
                      {fieldErr('brkAccountNumber')}
                    </div>
                    <div className="space-y-2">
                      <label className="t-label px-1">Bank Name</label>
                      <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={brokerForm.bankDetails?.bankName ?? ''} onChange={e => setBrokerForm({...brokerForm, bankDetails: {...brokerForm.bankDetails!, bankName: e.target.value}})} placeholder="e.g. HDFC Bank" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="t-label px-1">IFSC Code</label>
                      <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase", 'brkIfscCode')} value={brokerForm.bankDetails?.ifscCode ?? ''} onChange={e => { setBrokerForm({...brokerForm, bankDetails: {...brokerForm.bankDetails!, ifscCode: e.target.value.toUpperCase()}}); clearField('brkIfscCode'); }} placeholder="e.g. HDFC0001234" />
                      {fieldErr('brkIfscCode')}
                    </div>
                  </div>
               </div>
               <button type="submit" disabled={!isValid(brokerRules())} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Broker Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Route' : 'Create New Route'}</h3>
              <button onClick={() => { setIsRouteModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleRouteSubmit} onBlur={() => validate(routeRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={routeForm.trackingId ?? ''} onChange={e => setRouteForm({...routeForm, trackingId: e.target.value})} placeholder="e.g. RT-001" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select Loading Station (Source)*</label>
                  <select
                    className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'source')}
                    value={sites.find(s => s.name === routeForm.source)?.id || ''}
                    onChange={e => {
                        const site = sites.find(s => s.id === e.target.value);
                        if (site) { setRouteForm({...routeForm, source: site.name}); clearField('source'); }
                    }}
                  >
                    <option value="">Choose Station...</option>
                    {sites.filter(s => s.type === 'TPS').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                    ))}
                  </select>
                  {fieldErr('source')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Select Client / Site (Destination)*</label>
                  <select
                    className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'destination')}
                    value={clients.find(c => c.name === routeForm.destination)?.id || sites.find(s => s.name === routeForm.destination)?.id || ''}
                    onChange={e => {
                        const client = clients.find(c => c.id === e.target.value);
                        if (client) {
                            setRouteForm({...routeForm, destination: client.name}); clearField('destination');
                        } else {
                            const site = sites.find(s => s.id === e.target.value);
                            if (site) { setRouteForm({...routeForm, destination: site.name}); clearField('destination'); }
                        }
                    }}
                  >
                    <option value="">Choose Destination...</option>
                    {/* Combine Clients and Sites for destination selection */}
                    <optgroup label="Clients">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                    <optgroup label="Sites">
                      {sites.filter(s => s.type === 'CLIENT_SITE').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  {fieldErr('destination')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kilometre Between (Distance)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'distanceKm')}
                      value={routeForm.distanceKm ?? 0}
                      onChange={e => { setRouteForm({...routeForm, distanceKm: Number(e.target.value)}); clearField('distanceKm'); }}
                      placeholder="e.g. 120"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs uppercase">KM</span>
                  </div>
                  {fieldErr('distanceKm')}
               </div>
               <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe size={12} />
                      How to get Map Details?
                    </h4>
                    <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                      For best results, use <strong>Place Names</strong> (e.g. "Mundra Port") or <strong>Coordinates</strong> (e.g. "22.84, 70.01"). 
                      <br/>Avoid pasting long URLs directly into these fields if you want the "Directions" button to work.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="t-label px-1">Loading Station (Source) Location*</label>
                       <input 
                         type="text" 
                         required
                         className="w-full px-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-sm" 
                         value={routeForm.sourceMapUrl ?? ''} 
                         onChange={e => setRouteForm({...routeForm, sourceMapUrl: e.target.value})} 
                         placeholder="e.g. Mundra Port or 22.84,70.01" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="t-label px-1">Client / Site (Destination) Location*</label>
                       <input 
                         type="text" 
                         required
                         className="w-full px-4 py-3 bg-[#F5F4F0] border border-slate-200 rounded-xl font-bold text-sm" 
                         value={routeForm.destinationMapUrl ?? ''} 
                         onChange={e => setRouteForm({...routeForm, destinationMapUrl: e.target.value})} 
                         placeholder="e.g. Adani Power Plant or 22.12,71.34" 
                       />
                    </div>
                  </div>
               </div>

               <button type="submit" disabled={!isValid(routeRules())} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Route Configuration</button>
            </form>
          </div>
        </div>
      )}

      {/* Truck Modal */}
      {isTruckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <TruckIcon size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Asset Profile' : 'Register New Truck'}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Asset Inventory & Fleet Command</p>
                </div>
              </div>
              <button onClick={() => { setIsTruckModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTruckSubmit} onBlur={() => validate(truckRules())} noValidate className="p-8 space-y-8 overflow-y-auto">
              {/* Section: Asset Identity */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">
                  <Info size={14} /> Asset Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="t-label px-1">Tracking ID</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.trackingId ?? ''} onChange={e => setTruckForm({...truckForm, trackingId: e.target.value})} placeholder="e.g. TRK-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Truck Number / Plate No.*</label>
                    <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black uppercase", 'truckNumber')} value={truckForm.plateNumber ?? ''} onChange={e => { setTruckForm({...truckForm, plateNumber: e.target.value}); clearField('truckNumber'); }} placeholder="GJ-XX-XXXX" />
                    {fieldErr('truckNumber')}
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Internal Nickname*</label>
                    <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'name')} value={truckForm.name ?? ''} onChange={e => { setTruckForm({...truckForm, name: e.target.value}); clearField('name'); }} placeholder="e.g. Ash King 1" />
                    {fieldErr('name')}
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Chassis / Truck Number</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.truckNumber ?? ''} onChange={e => setTruckForm({...truckForm, truckNumber: e.target.value})} placeholder="e.g. TATA-712-XXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Model / Manufacturer</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.modelNumber ?? ''} onChange={e => setTruckForm({...truckForm, modelNumber: e.target.value})} placeholder="e.g. BharatBenz 3523R" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Brief Description</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.description ?? ''} onChange={e => setTruckForm({...truckForm, description: e.target.value})} placeholder="e.g. Heavy-duty Fly Ash carrier" />
                  </div>
                </div>
              </div>

              {/* Section: Ownership & Staffing */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">
                  <Building size={14} /> Ownership & Mapping
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="t-label px-1">Owner Name*</label>
                    <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'ownerName')} value={truckForm.ownerName ?? ''} onChange={e => { setTruckForm({...truckForm, ownerName: e.target.value}); clearField('ownerName'); }} placeholder="Registered Owner" />
                    {fieldErr('ownerName')}
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Owner Contact Info*</label>
                    <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'ownerContact')} value={truckForm.ownerContact ?? ''} onChange={e => { setTruckForm({...truckForm, ownerContact: e.target.value}); clearField('ownerContact'); }} placeholder="+91 XXXXX XXXXX" />
                    {fieldErr('ownerContact')}
                  </div>
                  <div className="space-y-2 md:col-span-2 relative">
                    <label className="t-label px-1">Assigned Default Driver</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                        <Search size={16} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Type to search and select driver..."
                        value={driverSearchQuery}
                        onChange={e => {
                          setDriverSearchQuery(e.target.value);
                          setIsDriverDropdownOpen(true);
                          if (!e.target.value) setTruckForm({...truckForm, assignedDriverId: ''});
                        }}
                        onFocus={() => setIsDriverDropdownOpen(true)}
                        className="w-full pl-12 pr-10 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsDriverDropdownOpen(!isDriverDropdownOpen)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isDriverDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isDriverDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-[#E7E5E0] rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-2 border-b border-slate-50 bg-[#F5F4F0]/50 flex justify-between items-center sticky top-0 bg-white z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">Available Drivers</p>
                            <button 
                              type="button"
                              onClick={() => setIsDriverDropdownOpen(false)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTruckForm({...truckForm, assignedDriverId: ''});
                                setDriverSearchQuery('');
                                setIsDriverDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 transition-colors rounded-xl flex items-center gap-2 mb-1"
                            >
                              <X size={14} />
                              <span className="text-xs font-black uppercase tracking-tight">Clear Selection</span>
                            </button>
                            
                            {drivers.filter(d => 
                              d.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) || 
                              d.phoneNumber.includes(driverSearchQuery)
                            ).length === 0 ? (
                              <div className="px-4 py-8 text-center text-slate-400">
                                 <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
                                 <p className="text-xs font-bold uppercase tracking-tight">No drivers found</p>
                              </div>
                            ) : (
                              drivers.filter(d => 
                                d.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) || 
                                d.phoneNumber.includes(driverSearchQuery)
                              ).map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    setTruckForm({...truckForm, assignedDriverId: d.id, driverName: d.name});
                                    setDriverSearchQuery(d.name);
                                    setIsDriverDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-[#F5F4F0] transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between rounded-xl ${truckForm.assignedDriverId === d.id ? 'bg-blue-50' : ''}`}
                                >
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{d.name}</p>
                                    <p className="text-[10px] font-bold text-slate-500 tracking-tight">{d.phoneNumber}</p>
                                  </div>
                                  {truckForm.assignedDriverId === d.id && <CheckCircle2 size={16} className="text-green-500" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2 relative">
                    <label className="t-label px-1">Default Operational Route</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                        <Navigation size={16} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search and select default route..."
                        value={routeSearchQuery}
                        onChange={e => {
                          setRouteSearchQuery(e.target.value);
                          setIsRouteDropdownOpen(true);
                          if (!e.target.value) setTruckForm({...truckForm, defaultRouteId: ''});
                        }}
                        onFocus={() => setIsRouteDropdownOpen(true)}
                        className="w-full pl-12 pr-10 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isRouteDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isRouteDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-[#E7E5E0] rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-2 border-b border-slate-50 bg-[#F5F4F0]/50 flex justify-between items-center sticky top-0 bg-white z-10">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">Operational Routes</p>
                            <button 
                              type="button"
                              onClick={() => setIsRouteDropdownOpen(false)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTruckForm({...truckForm, defaultRouteId: ''});
                                setRouteSearchQuery('');
                                setIsRouteDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 transition-colors rounded-xl flex items-center gap-2 mb-1"
                            >
                              <X size={14} />
                              <span className="text-xs font-black uppercase tracking-tight">None / General</span>
                            </button>
                            
                            {routes.filter(r => 
                              r.source.toLowerCase().includes(routeSearchQuery.toLowerCase()) || 
                              r.destination.toLowerCase().includes(routeSearchQuery.toLowerCase())
                            ).length === 0 ? (
                              <div className="px-4 py-8 text-center text-slate-400">
                                 <AlertCircle size={20} className="mx-auto mb-2 opacity-50" />
                                 <p className="text-xs font-bold uppercase tracking-tight">No routes found</p>
                              </div>
                            ) : (
                              routes.filter(r => 
                                r.source.toLowerCase().includes(routeSearchQuery.toLowerCase()) || 
                                r.destination.toLowerCase().includes(routeSearchQuery.toLowerCase())
                              ).map(r => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => {
                                    setTruckForm({...truckForm, defaultRouteId: r.id});
                                    setRouteSearchQuery(`${r.source} → ${r.destination}`);
                                    setIsRouteDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-[#F5F4F0] transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between rounded-xl ${truckForm.defaultRouteId === r.id ? 'bg-blue-50' : ''}`}
                                >
                                  <div>
                                    <p className="text-sm font-black text-slate-900">{r.source} → {r.destination}</p>
                                    <p className="text-[10px] font-bold text-slate-500 tracking-tight">{r.distanceKm} KM</p>
                                  </div>
                                  {truckForm.defaultRouteId === r.id && <CheckCircle2 size={16} className="text-blue-500" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Technical Specifications */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-widest border-b border-purple-50 pb-2">
                  <Cog size={14} /> Technical Specifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="t-label px-1">Engine Number</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.engineNumber ?? ''} onChange={e => setTruckForm({...truckForm, engineNumber: e.target.value})} placeholder="e.g. B6.7B6A..." />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Fuel Type</label>
                    <select className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.fuelType ?? 'DIESEL'} onChange={e => setTruckForm({...truckForm, fuelType: e.target.value})}>
                      <option value="DIESEL">DIESEL</option>
                      <option value="PETROL">PETROL</option>
                      <option value="CNG">CNG</option>
                      <option value="ELECTRIC">ELECTRIC</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Branch / Location</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.branch ?? ''} onChange={e => setTruckForm({...truckForm, branch: e.target.value})} placeholder="e.g. Mumbai HQ" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Registration Date</label>
                    <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.registrationDate ?? ''} onChange={e => setTruckForm({...truckForm, registrationDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Vehicle Application</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.vehicleApplication ?? ''} onChange={e => setTruckForm({...truckForm, vehicleApplication: e.target.value})} placeholder="e.g. Cement, Fly Ash" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Vehicle Code</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.vehicleCode ?? ''} onChange={e => setTruckForm({...truckForm, vehicleCode: e.target.value})} placeholder="e.g. V-712" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Vehicle Type</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.vehicleType ?? ''} onChange={e => setTruckForm({...truckForm, vehicleType: e.target.value})} placeholder="e.g. Tipper, Trailer" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Laden Weight (KG)</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.ladenWeight ?? ''} onChange={e => setTruckForm({...truckForm, ladenWeight: e.target.value})} placeholder="Full Weight" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Unladen Weight (KG)</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.unladenWeight ?? ''} onChange={e => setTruckForm({...truckForm, unladenWeight: e.target.value})} placeholder="Empty Weight" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Tonnage</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.tonnage ?? ''} onChange={e => setTruckForm({...truckForm, tonnage: e.target.value})} placeholder="e.g. 25 MT" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Make / Year</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.makeYear ?? ''} onChange={e => setTruckForm({...truckForm, makeYear: e.target.value})} placeholder="e.g. 2023 | Jan" />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Owned Outside</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.ownedOutside ?? ''} onChange={e => setTruckForm({...truckForm, ownedOutside: e.target.value})} placeholder="Yes / No" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="t-label px-1">Registration Address</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.registrationAddress ?? ''} onChange={e => setTruckForm({...truckForm, registrationAddress: e.target.value})} placeholder="Full Registered Address" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label className="t-label px-1">Technical Specification</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.specification ?? ''} onChange={e => setTruckForm({...truckForm, specification: e.target.value})} placeholder="e.g. BS-VI, Turbo" />
                  </div>
                </div>
              </div>

              {/* Section: Performance & Logistics */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest border-b border-amber-50 pb-2">
                  <Fuel size={14} /> Logistics & Metrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="t-label px-1">Avg Mileage (KM/L)*</label>
                    <input type="number" step="0.1" required className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.mileage ?? 0} onChange={e => setTruckForm({...truckForm, mileage: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Diesel Trip Limit (L)*</label>
                    <input type="number" required className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.dieselLimit ?? 0} onChange={e => setTruckForm({...truckForm, dieselLimit: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Current Odometer (KM)*</label>
                    <input type="number" required className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.currentOdometer ?? 0} onChange={e => setTruckForm({...truckForm, currentOdometer: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Total MT Handled</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.totalMtHandled ?? 0} onChange={e => setTruckForm({...truckForm, totalMtHandled: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Driver Performance Score</label>
                    <input type="number" min="0" max="100" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.driverScore ?? 80} onChange={e => setTruckForm({...truckForm, driverScore: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Idle Time (Hours)</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.idleTimeHours ?? 0} onChange={e => setTruckForm({...truckForm, idleTimeHours: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Engine Run Hours</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.engineHours ?? 0} onChange={e => setTruckForm({...truckForm, engineHours: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Service Interval (KM)</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-black" value={truckForm.serviceIntervalKm ?? 10000} onChange={e => setTruckForm({...truckForm, serviceIntervalKm: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              {/* Section: Compliance & Maintenance */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-green-600 uppercase tracking-widest border-b border-green-50 pb-2">
                  <ShieldCheck size={14} /> Compliance & Maintenance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="t-label px-1">Insurance Expiry</label>
                    <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.insuranceExpiry ?? ''} onChange={e => setTruckForm({...truckForm, insuranceExpiry: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Fitness Expiry</label>
                    <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.fitnessExpiry ?? ''} onChange={e => setTruckForm({...truckForm, fitnessExpiry: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="t-label px-1">Last Service Date</label>
                    <input type="date" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={truckForm.lastServiceDate ?? ''} onChange={e => setTruckForm({...truckForm, lastServiceDate: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsTruckModalOpen(false)} className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-[#F5F4F0] transition-all">Discard</button>
                <button type="submit" disabled={!isValid(truckRules())} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} />
                  {editingItem ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Product Modal */}
      {isItemProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-[#F5F4F0]/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => { setIsItemProductModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleItemProductSubmit} onBlur={() => validate(itemProductRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                    <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={itemProductForm.trackingId ?? ''} onChange={e => setItemProductForm({...itemProductForm, trackingId: e.target.value})} placeholder="e.g. PRD-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Product Name*</label>
                    <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'productName')} value={itemProductForm.productName ?? ''} onChange={e => { setItemProductForm({...itemProductForm, productName: e.target.value}); clearField('productName'); }} placeholder="e.g. Fly Ash, Cement" />
                    {fieldErr('productName')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">HSN & SAC Code*</label>
                    <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'hsnSacCode')} value={itemProductForm.hsnSacCode ?? ''} onChange={e => { setItemProductForm({...itemProductForm, hsnSacCode: e.target.value}); clearField('hsnSacCode'); }} placeholder="e.g. 26219000" />
                    {fieldErr('hsnSacCode')}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">GST Rate (%)</label>
                    <input type="number" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={itemProductForm.gstRate ?? 0} onChange={e => setItemProductForm({...itemProductForm, gstRate: Number(e.target.value)})} placeholder="e.g. 18" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Product Colour*</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={itemProductForm.productColour ?? ''} onChange={e => setItemProductForm({...itemProductForm, productColour: e.target.value})} placeholder="e.g. Grey, White, #808080" />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Services (Operations)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" 
                      value={newService} 
                      onChange={e => setNewService(e.target.value)} 
                      placeholder="e.g. Transportation, Loading, etc." 
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddService}
                      className="px-6 bg-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all"
                    >
                      Add
                    </button>
                  </div>
                  
                  {itemProductForm.services && itemProductForm.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {itemProductForm.services.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100">
                          <span className="text-xs font-black uppercase tracking-tight">{service}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveService(index)}
                            className="text-blue-400 hover:text-blue-700 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={!isValid(itemProductRules())} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Fuel Site Modal */}
      {isFuelSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-2xl font-black text-[#1C1917] tracking-tight">{editingItem ? 'Edit Fuel Site' : 'Add Fuel Site Details'}</h3>
              <button onClick={() => { setIsFuelSiteModalOpen(false); clearAll(); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleFuelSiteSubmit} onBlur={() => validate(fuelSiteRules())} noValidate className="p-8 space-y-6 overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tracking ID</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold" value={fuelSiteForm.trackingId ?? ''} onChange={e => setFuelSiteForm({...fuelSiteForm, trackingId: e.target.value})} placeholder="e.g. FUEL-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Company Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'companyName')} value={fuelSiteForm.companyName ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, companyName: e.target.value}); clearField('companyName'); }} placeholder="Company Ltd." />
                  {fieldErr('companyName')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Owner Name*</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'ownerName')} value={fuelSiteForm.ownerName ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, ownerName: e.target.value}); clearField('ownerName'); }} placeholder="Owner Name" />
                  {fieldErr('ownerName')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Phone Number*</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'phoneNumber')} value={fuelSiteForm.phoneNumber ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, phoneNumber: e.target.value}); clearField('phoneNumber'); }} placeholder="98XXXXXXXX" />
                  {fieldErr('phoneNumber')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp Number</label>
                  <input type="tel" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'fsWhatsapp')} value={fuelSiteForm.whatsappNumber ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, whatsappNumber: e.target.value}); clearField('fsWhatsapp'); }} placeholder="98XXXXXXXX" />
                  {fieldErr('fsWhatsapp')}
                </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Contact Email</label>
                  <input type="email" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'contactEmail')} value={fuelSiteForm.contactEmail ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, contactEmail: e.target.value}); clearField('contactEmail'); }} placeholder="email@company.com" />
                  {fieldErr('contactEmail')}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">GST Number</label>
                  <input type="text" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold uppercase", 'gstNumber')} value={fuelSiteForm.gstNumber ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, gstNumber: e.target.value.toUpperCase()}); clearField('gstNumber'); }} placeholder="22AAAAA0000A1Z5" />
                  {fieldErr('gstNumber')}
                </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Address*</label>
                  <textarea className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'address')} rows={2} value={fuelSiteForm.address ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, address: e.target.value}); clearField('address'); }} placeholder="Site location address..." />
                  {fieldErr('address')}
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Address Google Map Link</label>
                  <input type="url" className={fieldCls("w-full px-5 py-3.5 bg-[#F5F4F0] border border-slate-200 rounded-2xl font-bold", 'googleMapLink')} value={fuelSiteForm.googleMapLink ?? ''} onChange={e => { setFuelSiteForm({...fuelSiteForm, googleMapLink: e.target.value}); clearField('googleMapLink'); }} placeholder="https://maps.google.com/..." />
                  {fieldErr('googleMapLink')}
               </div>
               <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-slate-200/60 space-y-4">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Landmark size={14} className="text-rose-600" /> Bank Account Details
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Bank Name*</label>
                     <input
                       type="text"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none", 'bankName')}
                       value={fuelSiteForm.bankName ?? ''}
                       onChange={e => { setFuelSiteForm({...fuelSiteForm, bankName: e.target.value}); clearField('bankName'); }}
                       placeholder="e.g. State Bank of India"
                     />
                     {fieldErr('bankName')}
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Account Number*</label>
                      <input
                        type="text"
                        className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none", 'accountNumber')}
                        value={fuelSiteForm.accountNumber ?? ''}
                        onChange={e => { setFuelSiteForm({...fuelSiteForm, accountNumber: e.target.value}); clearField('accountNumber'); }}
                        placeholder="e.g. 1234567890"
                      />
                      {fieldErr('accountNumber')}
                   </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">IFSC Code*</label>
                      <input
                        type="text"
                        className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold uppercase focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none", 'ifscCode')}
                        value={fuelSiteForm.ifscCode ?? ''}
                        onChange={e => { setFuelSiteForm({...fuelSiteForm, ifscCode: e.target.value.toUpperCase()}); clearField('ifscCode'); }}
                        placeholder="e.g. SBIN0001234"
                      />
                      {fieldErr('ifscCode')}
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">UPI ID</label>
                     <input
                       type="text"
                       className={fieldCls("w-full px-5 py-3.5 bg-white border border-[#E7E5E0] rounded-xl font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none", 'upiId')}
                       value={fuelSiteForm.upiId ?? ''}
                       onChange={e => { setFuelSiteForm({...fuelSiteForm, upiId: e.target.value}); clearField('upiId'); }}
                       placeholder="e.g. user@upi"
                     />
                     {fieldErr('upiId')}
                   </div>
                 </div>
               </div>
               <button type="submit" disabled={!isValid(fuelSiteRules())} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Save Details</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesView;
