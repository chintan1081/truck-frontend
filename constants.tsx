
import { Order, TripStatus, Truck, Route, Driver, Client, Site, Broker, ItemProduct, Employee, LeaveRequest, LeaveStatus, FuelSite, FuelTransaction } from './types';

export const MOCK_FUEL_SITES: FuelSite[] = [
  {
    id: 'FS-1',
    companyName: 'Reliance Petrol Hub',
    ownerName: 'Rahul Mehra',
    phoneNumber: '+91 98989 11223',
    contactEmail: 'reliance@petrol.com',
    whatsappNumber: '+91 98989 11223',
    gstNumber: '24REL0000X1Z5',
    address: 'Highway Circle, Ahmedabad',
    googleMapLink: 'https://maps.google.com/?q=Reliance+Petrol',
    accountNumber: '998877665544',
    ifscCode: 'ICIC0005544',
    bankName: 'ICICI Bank',
    upiId: 'reliance@icici'
  },
  {
    id: 'FS-2',
    companyName: 'Indian Oil Depot',
    ownerName: 'Amit Singh',
    phoneNumber: '+91 98765 00998',
    contactEmail: 'iocl@depot.com',
    whatsappNumber: '+91 98765 00998',
    gstNumber: '24IOCL000Y1Z2',
    address: 'Transport Nagar, Gandhinagar',
    googleMapLink: 'https://maps.google.com/?q=IOCL+Depot',
    accountNumber: '112233445566',
    ifscCode: 'SBI0001234',
    bankName: 'State Bank of India',
    upiId: 'iocl@sbi'
  }
];

export const MOCK_FUEL_TRANSACTIONS: FuelTransaction[] = [
  {
    id: 'FT-1',
    siteId: 'FS-1',
    siteName: 'Reliance Petrol Hub',
    truckId: 'T-1',
    truckNumber: 'GJ-01-AX-1234',
    driverId: 'D-1',
    driverName: 'Rajesh Kumar',
    quantity: 120.5,
    rate: 94.50,
    totalAmount: 11387.25,
    date: '2024-05-10',
    time: '10:30 AM',
    odometerReading: 45200,
    notes: 'Full tank fill',
    paymentStatus: 'PAID',
    paymentDate: '2024-05-10',
    paymentMode: 'UPI',
    referenceNo: 'TXN12345678'
  },
  {
    id: 'FT-2',
    siteId: 'FS-2',
    siteName: 'Indian Oil Depot',
    truckId: 'T-2',
    truckNumber: 'GJ-06-BT-5678',
    driverId: 'D-2',
    driverName: 'Suresh Singh',
    quantity: 85.0,
    rate: 95.20,
    totalAmount: 8092.00,
    date: '2024-05-12',
    time: '02:15 PM',
    odometerReading: 88400,
    notes: 'Half tank fill',
    paymentStatus: 'UNPAID'
  },
  {
    id: 'FT-3',
    siteId: 'FS-1',
    siteName: 'Reliance Petrol Hub',
    truckId: 'T-3',
    truckNumber: 'GJ-12-CZ-9012',
    driverId: 'D-3',
    driverName: 'Amit Patel',
    quantity: 150.0,
    rate: 94.50,
    totalAmount: 14175.00,
    date: '2024-05-14',
    time: '08:45 AM',
    odometerReading: 112000,
    notes: 'Long route preparation',
    paymentStatus: 'PAID',
    paymentDate: '2024-05-14',
    paymentMode: 'BANK_TRANSFER',
    referenceNo: 'REF998877'
  }
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'LR-1',
    entityId: 'E-1',
    startDate: '2024-05-10',
    endDate: '2024-05-11',
    type: 'CASUAL',
    reason: 'Personal family work',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-05-08'
  },
  {
    id: 'LR-2',
    entityId: 'E-2',
    startDate: '2024-05-15',
    endDate: '2024-05-15',
    type: 'SICK',
    reason: 'Fever and cold',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-05-14'
  },
  {
    id: 'LR-3',
    entityId: 'D-1',
    startDate: '2024-05-18',
    endDate: '2024-05-20',
    type: 'EMERGENCY',
    reason: 'Family emergency at hometown',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-05-17'
  },
  {
    id: 'LR-4',
    entityId: 'D-2',
    startDate: '2024-06-01',
    endDate: '2024-06-10',
    type: 'MARRIAGE',
    reason: 'Own marriage ceremony',
    status: LeaveStatus.PENDING,
    appliedDate: '2024-05-10'
  },
  {
    id: 'LR-5',
    entityId: 'E-1',
    startDate: '2024-05-22',
    endDate: '2024-05-22',
    type: 'PAID',
    reason: 'Legal documentation work',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-05-20'
  },
  {
    id: 'LR-6',
    entityId: 'D-3',
    startDate: '2024-05-25',
    endDate: '2024-05-26',
    type: 'EMERGENCY',
    reason: 'Sudden home repair',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-05-24'
  },
  {
    id: 'LR-7',
    entityId: 'D-1',
    startDate: '2024-06-05',
    endDate: '2024-06-05',
    type: 'CASUAL',
    reason: 'Personal day off',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-06-01'
  },
  {
    id: 'LR-8',
    entityId: 'D-2',
    startDate: '2024-06-10',
    endDate: '2024-06-12',
    type: 'SICK',
    reason: 'Medical checkup',
    status: LeaveStatus.APPROVED,
    appliedDate: '2024-06-08'
  }
];

export const MOCK_ITEM_PRODUCTS: ItemProduct[] = [
  { id: 'IP-1', productName: 'Fly Ash (Fine)', productColour: '#808080', hsnSacCode: '26219000', gstRate: 5, services: ['Loading', 'Transport', 'Unloading'] },
  { id: 'IP-2', productName: 'Pond Ash', productColour: '#A9A9A9', hsnSacCode: '26219100', gstRate: 12, services: ['Excavation', 'Transport'] },
  { id: 'IP-3', productName: 'Consultancy Service', productColour: '#4169E1', hsnSacCode: '998339', gstRate: 18, services: ['Inspection', 'Report Generation'] },
];

export const ROUTES: Route[] = [
  { id: 'R-1', source: 'Wanakbori TPS', destination: 'Mundra Site A', distanceKm: 420 },
  { id: 'R-2', source: 'Ukai TPS', destination: 'Hazira Expansion', distanceKm: 85 },
  { id: 'R-3', source: 'Sikka TPS', destination: 'Mundra Site A', distanceKm: 150 },
  { id: 'R-4', source: 'Gandhinagar TPS', destination: 'Dahej Hub', distanceKm: 110 },
];

export const MOCK_BROKERS: Broker[] = [
  {
    id: 'B-1',
    name: 'Shree Logistics Broker',
    email: 'shree@logistics.com',
    phone: '+91 99887 76655',
    whatsappNumber: '+91 99887 76655',
    address: 'Transport Nagar, Ahmedabad',
    upiId: 'shree@upi',
    bankDetails: {
      accountNumber: '123456789012',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234'
    }
  }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'C-1', name: 'Adani Power Ltd', gstNumber: '24AAAAA0000A1Z5', address: 'Shantigram, Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', country: 'India', pincode: '382421', contactPerson: 'Mr. Saurabh Shah', email: 'billing@adanipower.com', phone: '079-1234567' },
  { id: 'C-2', name: 'Adani Infrastructure', gstNumber: '24BBBBB1111B1Z2', address: 'Navrangpura, Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', country: 'India', pincode: '380009', contactPerson: 'Mr. Rajesh Mehta', email: 'infra@adani.com', phone: '079-7654321' },
];

export const MOCK_SITES: Site[] = [
  { id: 'S-1', name: 'Wanakbori TPS', location: 'Kheda, Gujarat', city: 'Kheda', state: 'Gujarat', country: 'India', pincode: '388239', type: 'TPS', contactPerson: 'Station Manager', email: 'manager@wanakbori.tps', gstNumber: '24AAAAA1234A1Z1' },
  { id: 'S-2', name: 'Ukai TPS', location: 'Tapi, Gujarat', city: 'Ukai', state: 'Gujarat', country: 'India', pincode: '394680', type: 'TPS' },
  { id: 'S-3', name: 'Mundra Site A', location: 'Kutch, Gujarat', city: 'Mundra', state: 'Gujarat', country: 'India', pincode: '370421', type: 'CLIENT_SITE', contactPerson: 'Site In-charge' },
  { id: 'S-4', name: 'Hazira Expansion', location: 'Surat, Gujarat', city: 'Surat', state: 'Gujarat', country: 'India', pincode: '394270', type: 'CLIENT_SITE' },
];

export const MOCK_DRIVERS: Driver[] = [
  // Fixed: Added missing properties for Driver type
  { id: 'D-1', trackingId: 'DRV-101', name: 'Rajesh Kumar', address: '123 Truckers Colony, Ahmedabad', upiId: 'rajesh@upi', bankName: 'State Bank of India', accountNumber: '1234567890', ifscCode: 'SBIN0001234', bankDetails: 'State Bank of India A/c 1234567890', phoneNumber: '+91 98765 43210', whatsappNumber: '+91 98765 43210', licenseExpiry: '2024-06-15', joinDate: '2023-01-10', experienceYears: 8, isOnline: true },
  { id: 'D-2', trackingId: 'DRV-102', name: 'Suresh Singh', address: '45 Roadways Nagar, Vadodara', upiId: 'suresh@upi', bankName: 'HDFC Bank', accountNumber: '0987654321', ifscCode: 'HDFC0000001', bankDetails: 'HDFC Bank A/c 0987654321', phoneNumber: '+91 98765 43211', whatsappNumber: '+91 98765 43211', licenseExpiry: '2025-12-01', joinDate: '2023-03-22', experienceYears: 5, isOnline: true },
  { id: 'D-3', trackingId: 'DRV-103', name: 'Amit Patel', address: 'Sector 4, Gandhinagar', upiId: 'amit@upi', bankName: 'ICICI Bank', accountNumber: '5678901234', ifscCode: 'ICIC0000002', bankDetails: 'ICICI Bank A/c 5678901234', phoneNumber: '+91 98765 43212', whatsappNumber: '+91 98765 43212', licenseExpiry: '2024-11-20', joinDate: '2023-11-05', experienceYears: 3, isOnline: false },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: 'E-1', 
    trackingId: 'EMP-501', 
    fullName: 'Rahul Varma', 
    phoneNumber: '+91 99000 11223', 
    whatsappNumber: '+91 99000 11223', 
    address: 'Satellite, Ahmedabad', 
    designation: 'Operations Manager', 
    joinDate: '2022-05-15', 
    experienceYears: 12,
    isOnline: true,
    bankAccountDetails: { accountNumber: '1122334455', bankName: 'Axis Bank', ifscCode: 'AXIS0001', upiId: 'rahul@upi' }
  },
  { 
    id: 'E-2', 
    trackingId: 'EMP-502', 
    fullName: 'Priya Shah', 
    phoneNumber: '+91 99000 44556', 
    whatsappNumber: '+91 99000 44556', 
    address: 'Navrangpura, Ahmedabad', 
    designation: 'Accountant', 
    joinDate: '2023-02-10', 
    experienceYears: 4,
    isOnline: false,
    bankAccountDetails: { accountNumber: '5566778899', bankName: 'ICICI Bank', ifscCode: 'ICIC0002', upiId: 'priya@upi' }
  }
];

export const MOCK_TRUCKS: Truck[] = [
  { 
    id: 'T-1', 
    name: 'Ash King 1', 
    description: 'Heavy Duty Fly Ash Carrier', 
    modelNumber: 'BharatBenz 3523R', 
    plateNumber: 'GJ-01-AX-1234', 
    truckNumber: 'GJ-01-AX-1234',
    driverName: 'Rajesh Kumar',
    ownerName: 'Adani Logistics', 
    ownerContact: '+91 77777 88888', 
    mileage: 4, 
    dieselLimit: 150, 
    status: 'ON_TRIP', 
    assignedDriverId: 'D-1',
    insuranceExpiry: '2025-05-25',
    fitnessExpiry: '2025-09-10',
    permitExpiry: '2025-12-30',
    pollutionExpiry: '2025-03-15',
    rcExpiry: '2030-05-15',
    lastServiceDate: '2024-01-15',
    totalMtHandled: 1240,
    driverScore: 88,
    idleTimeHours: 14,
    engineHours: 1240,
    currentOdometer: 45200,
    defaultRouteId: 'R-1',
    healthStatus: {
      battery: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Voltage optimal' },
      engine: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Oil level good' },
      tyres: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Pressure 120psi' },
      electrical: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Wring intact' },
      body: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'No major dents' },
      oil: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Viscosity normal' },
      water: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Coolant level full' },
      brakes: { status: 'GOOD', lastChecked: '2024-04-10', notes: 'Pads 80% remaining' },
    },
    breakdownHistory: [],
    documents: []
  },
  { 
    id: 'T-2', 
    name: 'Mighty Hauler', 
    description: 'Semi-Trailer Tipper', 
    modelNumber: 'Tata Prima 4028.S', 
    plateNumber: 'GJ-06-BT-5678', 
    truckNumber: 'GJ-06-BT-5678',
    driverName: 'Suresh Singh',
    ownerName: 'Fleet Hub Pvt Ltd', 
    ownerContact: '+91 99999 00000', 
    mileage: 3.5, 
    dieselLimit: 200, 
    status: 'AVAILABLE', 
    assignedDriverId: 'D-2',
    insuranceExpiry: '2025-01-01',
    fitnessExpiry: '2025-12-15',
    permitExpiry: '2025-06-15',
    pollutionExpiry: '2024-05-15',
    rcExpiry: '2026-11-20',
    lastServiceDate: '2024-03-22',
    totalMtHandled: 850,
    driverScore: 72,
    idleTimeHours: 45,
    engineHours: 2100,
    currentOdometer: 88400,
    healthStatus: {
      battery: { status: 'WARNING', lastChecked: '2024-04-15', notes: 'Terminal corrosion detected' },
      engine: { status: 'GOOD', lastChecked: '2024-04-15', notes: 'Recent service done' },
      tyres: { status: 'WARNING', lastChecked: '2024-04-15', notes: 'Rear left tread thin' },
      electrical: { status: 'GOOD', lastChecked: '2024-04-15', notes: 'All lights working' },
      body: { status: 'GOOD', lastChecked: '2024-04-15', notes: 'Clean condition' },
      oil: { status: 'WARNING', lastChecked: '2024-04-15', notes: 'Minor leak near filter' },
      water: { status: 'GOOD', lastChecked: '2024-04-15', notes: 'Radiator flushed' },
      brakes: { status: 'GOOD', lastChecked: '2024-04-15', notes: 'Brake fluid topped up' },
    },
    breakdownHistory: [
      { id: 'BD-1', date: '2024-02-10', description: 'Engine overheating on ukai route', location: 'Ukai', resolved: true, cost: 4500 }
    ],
    documents: [
      { id: 'DOC-1', type: 'RC', fileName: 'RC_GJ06BT5678.pdf', fileUrl: '#', uploadDate: '2023-12-01', documentNumber: 'REG-5678' }
    ]
  },
  { 
    id: 'T-3', 
    name: 'Gujarat Express', 
    description: 'Flatbed Carrier', 
    modelNumber: 'Ashok Leyland 2823', 
    plateNumber: 'GJ-12-CZ-9012', 
    truckNumber: 'GJ-12-CZ-9012',
    driverName: 'Amit Patel',
    ownerName: 'Self Owned', 
    ownerContact: '+91 88888 11111', 
    mileage: 3.8, 
    dieselLimit: 180, 
    status: 'AVAILABLE', 
    assignedDriverId: 'D-3',
    insuranceExpiry: '2024-10-10',
    fitnessExpiry: '2025-05-15',
    permitExpiry: '2025-08-20',
    pollutionExpiry: '2025-01-10',
    rcExpiry: '2028-04-10',
    lastServiceDate: '2023-11-05',
    totalMtHandled: 2100,
    driverScore: 94,
    idleTimeHours: 8,
    engineHours: 3400,
    currentOdometer: 112000,
    healthStatus: {
      battery: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Recharged recently' },
      engine: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Vibration normal' },
      tyres: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Correct alignment' },
      electrical: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Fuse box checked' },
      body: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Painting new' },
      oil: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Fresh oil change' },
      water: { status: 'GOOD', lastChecked: '2024-04-20', notes: 'Level optimal' },
      brakes: { status: 'WARNING', lastChecked: '2024-04-20', notes: 'Air pressure build up slow' },
    },
    breakdownHistory: [],
    documents: []
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    clientName: 'Adani Power',
    projectSite: 'Mundra Site A',
    quantity: 200,
    ratePerMT: 450,
    pickupDate: '2024-05-20',
    deliveryDate: '2024-05-22',
    hasGST: true,
    paymentTerms: '30 Days Net',
    status: TripStatus.PICKED,
    materialName: 'Dry Fly Ash',
    assignedTruckId: 'T-1',
    assignedRouteId: 'R-1',
    estimatedDiesel: 105
  },
  {
    id: 'ORD-002',
    clientName: 'Adani Infrastructure',
    projectSite: 'Hazira Expansion',
    quantity: 500,
    ratePerMT: 420,
    pickupDate: '2024-05-25',
    deliveryDate: '2024-05-28',
    hasGST: true,
    paymentTerms: 'Advance',
    materialName: 'Conditioned Fly Ash',
    status: TripStatus.CREATED
  }
];
