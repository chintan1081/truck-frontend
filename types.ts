
export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum TripStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  PICKED = 'PICKED',
  DELIVERED = 'DELIVERED',
  INVOICED = 'INVOICED',
  PAID = 'PAID'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum ExpenseCategory {
  DIESEL = 'DIESEL',
  PETROL = 'PETROL',
  CNG = 'CNG',
  EV = 'EV',
  DRIVER_ALLOWANCE = 'DRIVER_ALLOWANCE',
  TOLL_FASTAG = 'TOLL_FASTAG',
  MAINTENANCE = 'MAINTENANCE',
  TYRE_PARTS = 'TYRE_PARTS',
  OFFICE = 'OFFICE',
  MISC = 'MISC',
  PLANT_ADVANCE = 'PLANT_ADVANCE',
  DRIVER_SALARY = 'DRIVER_SALARY',
  EMPLOYEE_SALARY = 'EMPLOYEE_SALARY'
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AlertUrgency {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export enum AlertCategory {
  COMPLIANCE = 'COMPLIANCE',
  MAINTENANCE = 'MAINTENANCE',
  FINANCIAL = 'FINANCIAL',
  CUSTOM = 'CUSTOM'
}

export interface CustomAlert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  urgency: AlertUrgency;
  date: string;
  truckId?: string;
  isResolved: boolean;
}

export interface PlantAdvancePoolEntry {
  id: string;
  stationId: string; // Linked to a specific TPS
  employeeId?: string;
  employeeName?: string;
  amount: number;
  date: string;
  referenceNo: string;
  notes?: string;
  transactionType: 'PAID' | 'RECEIVED';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  bankId?: string; // Selection for bank or cash mode
}

export interface PlantAdvance {
  id: string;
  orderId: string;
  truckId: string;
  stationId: string; // Linked to a specific TPS
  amount: number;
  date: string;
  utilizationDate?: string;
  paymentMode: 'RTGS' | 'UPI' | 'CASH' | 'NEFT';
  referenceNo: string;
  status: 'PENDING' | 'UTILIZED' | 'REFUNDED';
  isPriority: boolean;
  notes?: string;
  quantity?: number;
  rate?: number;
}

export interface Route {
  id: string;
  trackingId?: string;
  source: string;
  destination: string;
  distanceKm: number;
  mapUrl?: string;
  sourceMapUrl?: string;
  destinationMapUrl?: string;
}

export interface HistoryEntry {
  action: 'CREATED' | 'APPROVED' | 'REJECTED' | 'EDITED' | 'SENT' | 'PAID' | 'CANCELLED' | 'REMINDER_SENT' | 'MAINTENANCE_LOGGED' | 'EMI_PAID' | 'PLANT_ADV_POOL_ADD' | 'PLANT_ADVANCE_ISSUED' | 'INVOICE_DOWNLOADED';
  user: string;
  timestamp: string;
  note?: string;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  mode: 'RTGS' | 'NEFT' | 'UPI' | 'CHEQUE';
  referenceNo: string;
  note?: string;
  bankId?: string;
  fromWhere?: string;
}

export interface TruckEMI {
  id: string;
  truckId: string;
  bankName: string;
  amount: number;
  dueDate: number; // Day of month
  startDate: string;
  tenureMonths: number;
  paidInstallments: number;
  totalLoanAmount: number;
  status: 'ACTIVE' | 'CLOSED';
  loanType?: 'FIXED' | 'REDUCING';
  interestRate?: number;
}

export interface MaintenanceExpense {
  id: string;
  truckId: string;
  employeeId?: string;
  date: string;
  serviceDate: string;
  category: 'ROUTINE' | 'ENGINE' | 'TYRE' | 'ELECTRICAL' | 'BODY' | 'BREAKDOWN';
  description: string;
  amount: number;
  workshopName: string;
  odometerReading: number;
  partsReplaced: string[];
  nextServiceDueKm?: number;
  nextServiceDueDate?: string;
  status: 'PAID' | 'UNPAID';
  paidDate?: string;
  dueDate?: string;
  paymentMode?: 'CASH' | 'BANK_TRANSFER' | 'UPI';
  orderId?: string;
  responsibleStaff?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientGst: string;
  date: string;
  dueDate: string;
  orderIds: string[];
  poNumber?: string;
  soNumber?: string;
  ewayBill?: string;
  sacCode: string;
  placeOfSupply: string;
  bankAccount: string;
  selectedBankId?: string;
  subTotal: number;
  gstRate: number;
  gstType: 'IGST' | 'CGST_SGST';
  gstAmount: number;
  tdsAmount: number;
  discountAmount: number;
  tcsRate: number;
  tcsAmount: number;
  roundOff: number;
  autoRoundOff: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  previousStatus?: InvoiceStatus;
  payments: PaymentEntry[];
  history: HistoryEntry[];
  notes?: string;
  terms?: string;
  overdueCount?: number;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  date: string;
  amount: number;
  paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE';
  referenceNo: string;
  orderId?: string;
  truckId?: string;
  vendorName: string;
  description: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  isAuto: boolean;
  history: HistoryEntry[];
  liters?: number;
  rate?: number;
  isLimitExceeded?: boolean;
  responsibleStaff?: string;
  paymentStatus: 'PAID' | 'UNPAID';
  dueDate?: string;
  paidDate?: string;
  isMaintenance?: boolean;
  poolId?: string;
  bankId?: string;
  bankName?: string;
}

export interface Client {
  id: string;
  trackingId?: string;
  name: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contactPerson: string;
  email: string;
  phone: string;
  outstandingBalance?: number;
}

export interface Broker {
  id: string;
  trackingId?: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  upiId: string;
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

export interface Site {
  id: string;
  trackingId?: string;
  name: string;
  location: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  type: 'TPS' | 'CLIENT_SITE';
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  gstNumber?: string;
  outstandingBalance?: number;
}

export interface Order {
  id: string;
  clientName: string;
  projectSite: string;
  quantity: number;
  ratePerMT: number;
  pickupDate: string;
  deliveryDate: string;
  hasGST: boolean;
  paymentTerms: string;
  status: TripStatus;
  totalKm?: number;
  assignedTruckId?: string;
  assignedRouteId?: string;
  estimatedDiesel?: number;
  materialName?: string;
  hsnSacCode?: string;
  gstRate?: number;
  itemCode?: string;
  services?: string[];
  dcNo?: string;
  soNo?: string;
  remarks?: string;
  // Broker fields
  brokerId?: string;
  brokerName?: string;
  brokerCommissionPerMT?: number;
  totalBrokerCommission?: number;
  // Advanced features fields
  actualQuantity?: number;
  podImageUrl?: string;
  loadingSlipUrl?: string;
  hazardNote?: string;
  dieselRatePerLiter?: number;
  assignedTruckNumber?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface Driver {
  id: string;
  trackingId?: string;
  name: string;
  email?: string;
  address: string;
  upiId: string;
  bankDetails: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  phoneNumber: string;
  whatsappNumber: string;
  licenseExpiry: string;
  joinDate?: string;
  exitDate?: string;
  experienceYears?: number;
  isOnline: boolean;
  lastLogin?: string;
  documents?: WorkforceDocument[];
}

export interface DriverSalary {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  salaryType: 'PER_DAY' | 'PER_MONTH';
  baseRate: number;
  presentDays: number; 
  bonus: number;
  deductions: number;
  advanceAdjusted: number;
  totalAmount: number;
  dateGiven: string;
  paymentMode: string;
  referenceNo: string;
  notes?: string;
  bankId?: string;
  bankName?: string;
}

export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | 'BREAKDOWN';

export interface TruckDocument {
  id: string;
  type: 'INSURANCE' | 'PUC' | 'STATE_PERMIT' | 'NATIONAL_PERMIT' | 'ROAD_TAX' | 'AUTHORIZATION' | 'FASTAG' | 'HAZMAT' | 'TAX_INVOICE' | 'DRIVER_LICENCE' | 'EMI_DOCS' | 'WARRANTY_CARD' | 'WEIGHBRIDGE_RECEIPT' | 'LOCAL_PERMIT' | 'MAINTENANCE_LOG' | 'FITNESS' | 'RC' | 'OTHER';
  fileName: string;
  title?: string;
  fileUrl: string;
  expiryDate?: string;
  uploadDate: string;
  issueDate?: string;
  documentNumber?: string;
}

export interface PressureLog {
  id: string;
  date: string;
  value: number;
}

export interface TyreDetail {
  position: 'FL' | 'FR' | 'ALI' | 'ALO' | 'ARI' | 'ARO' | 'BLI' | 'BLO' | 'BRI' | 'BRO' | 'CLI' | 'CLO' | 'CRI' | 'CRO' | 'DLI' | 'DLO' | 'DRI' | 'DRO' | 'ELI' | 'ELO' | 'ERI' | 'ERO' | 'S1' | 'S2' | 'S3' | 'S4'; 
  condition: HealthStatus;
  pressure: number;
  pressureHistory?: PressureLog[];
  treadDepth: number;
  lastChangedDate?: string;
}

export interface TruckHealthComponent {
  status: HealthStatus;
  lastChecked: string;
  notes?: string;
  nextCheckDue?: string;
}

export interface InspectionLog {
  id: string;
  title?: string;
  date: string;
  inspectorName: string;
  overallStatus: 'PASS' | 'FAIL' | 'ADVISORY';
  odometerReading: number;
  notes: string;
  isResolved?: boolean;
  resolvedDate?: string;
  resolutionNotes?: string;
}

export interface OdometerReading {
  id: string;
  date: string;
  value: number;
  recordedBy: string;
  notes?: string;
}

export interface BreakdownLog {
  id: string;
  date: string;
  description: string;
  location: string;
  resolved: boolean;
  cost?: number;
}

export interface ServiceRecord {
  id: string;
  date: string;
  type: 'ROUTINE' | 'MAJOR' | 'EMERGENCY';
  odometerReading: number;
  cost: number;
  description: string;
  partsReplaced: string[];
  nextServiceDueKm?: number;
  nextServiceDueDate?: string;
  workshopName?: string;
}

export interface TyreRotationEvent {
  id: string;
  date: string;
  odometerReading: number;
  fromPosition: string;
  toPosition: string;
  notes?: string;
}

export interface Truck {
  id: string;
  trackingId?: string;
  name: string;
  description: string;
  modelNumber: string;
  plateNumber: string;
  truckNumber: string;
  driverName: string;
  ownerName: string;
  ownerContact: string;
  mileage: number;
  dieselLimit: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE';
  isMaintenanceMode?: boolean;
  assignedDriverId?: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  rcExpiry: string;
  lastServiceDate: string;
  totalMtHandled: number;
  driverScore: number;
  idleTimeHours: number;
  engineHours: number;
  currentOdometer: number;
  odometerAtLastService?: number;
  serviceIntervalKm?: number;
  wheelConfiguration?: 4 | 6 | 10 | 12 | 14 | 16 | 18 | 20 | 22;
  defaultRouteId?: string;
  maintenanceReason?: string;
  nextServiceDate?: string;
  engineNumber?: string;
  fuelType?: string;
  fuelLevel?: number; // 0-100 percentage
  currentFuelLiters?: number;
  branch?: string;
  registrationDate?: string;
  vehicleApplication?: string;
  vehicleCode?: string;
  vehicleType?: string;
  ladenWeight?: string;
  unladenWeight?: string;
  tonnage?: string;
  makeYear?: string;
  registrationAddress?: string;
  ownedOutside?: string;
  specification?: string;
  healthStatus: {
    battery: TruckHealthComponent;
    engine: TruckHealthComponent;
    tyres: TruckHealthComponent;
    electrical: TruckHealthComponent;
    body: TruckHealthComponent;
    oil: TruckHealthComponent;
    water: TruckHealthComponent;
    brakes: TruckHealthComponent;
  };
  tyreDetails?: TyreDetail[];
  breakdownHistory?: BreakdownLog[];
  serviceHistory?: ServiceRecord[];
  inspectionLogs?: InspectionLog[];
  odometerHistory?: OdometerReading[];
  documents: TruckDocument[];
  tyreRotationHistory?: TyreRotationEvent[];
}

export interface Bank {
  id: string;
  trackingId?: string;
  bankName: string;
  bankAddress: string;
  accountNumber: string;
  checkNumber: string;
  description: string;
  ifscCode?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  managerWhatsapp?: string;
}

export interface BankTransaction {
  id: string;
  bankId: string;
  bankName: string;
  type: 'RECEIVE_MONEY' | 'PAID_MONEY';
  fromWhere?: string;
  toWhom?: string;
  amount: number;
  date: string;
  checkNo?: string;
  neftUpiId?: string;
  description: string;
}

export interface WorkforceDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  notes?: string;
  size?: number;
  mimeType?: string;
}

export interface Employee {
  id: string;
  trackingId?: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  designation?: string;
  joinDate: string;
  exitDate?: string;
  experienceYears?: number;
  isOnline?: boolean;
  bankAccountDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
  };
  documents?: WorkforceDocument[];
}

export enum EmployeeSalaryType {
  MONTHLY = 'MONTHLY',
  SIX_MONTHLY = 'SIX_MONTHLY',
  YEARLY = 'YEARLY'
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName: string;
  salaryType: EmployeeSalaryType;
  salaryMonth: string;
  dateGiven: string;
  baseAmount: number;
  bonus: number;
  deductions: number;
  advanceAdjusted: number;
  netAmount: number;
  paymentMode: string;
  referenceNo: string;
  notes?: string;
  bankId?: string;
  bankName?: string;
}

export interface ItemProduct {
  id: string;
  trackingId?: string;
  productName: string;
  productColour: string;
  hsnSacCode?: string;
  hsnCode?: string;
  gstRate?: number;
  services?: string[];
}

export interface FuelSite {
  id: string;
  trackingId?: string;
  companyName: string;
  ownerName: string;
  phoneNumber: string;
  contactEmail: string;
  whatsappNumber: string;
  gstNumber: string;
  address: string;
  googleMapLink: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  upiId?: string;
}

export interface FuelTransaction {
  id: string;
  siteId: string;
  siteName: string;
  truckId: string;
  truckNumber: string;
  driverId: string;
  driverName: string;
  quantity: number;
  rate?: number;
  totalAmount?: number;
  date: string;
  time: string;
  odometerReading?: number;
  fuelLevelBefore?: number;
  fuelLevelAfter?: number;
  slipUrl?: string;
  notes?: string;
  paymentStatus: 'PAID' | 'UNPAID';
  paymentDate?: string;
  paymentDueDate?: string;
  paymentMode?: string;
  referenceNo?: string;
  tripId?: string;
  responsibleStaff?: string;
  fuelCategory?: 'DIESEL' | 'PETROL' | 'CNG' | 'EV';
  bankId?: string;
  bankName?: string;
}

export interface PaymentRecord {
  id: string;
  type: 'RECEIVE' | 'PAY';
  partyName: string;
  method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  amount: number;
  date: string;
  bankId?: string;
  bankName?: string;
  transactionId?: string;
  chequeNo?: string;
  description: string;
  poolId?: string;
}

export interface BankDetail {
  id: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  accountHolderName: string;
  upiId?: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  HALF_DAY = 'HALF_DAY'
}

export interface AttendanceRecord {
  id: string;
  entityId: string; // employeeId or driverId
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  shift?: 'DAY' | 'NIGHT';
  isLate?: boolean;
  overtimeHours?: number;
  locationVerified?: boolean;
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LeaveRequest {
  id: string;
  entityId: string;
  startDate: string;
  endDate: string;
  type: 'CASUAL' | 'SICK' | 'PAID' | 'UNPAID' | 'EMERGENCY' | 'MARRIAGE';
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  hasDocuments?: boolean;
  isPartialDay?: boolean;
  partialSlot?: 'MORNING' | 'AFTERNOON';
  balanceAtTime?: number;
}

export interface PerformanceMetric {
  id: string;
  entityId: string;
  date: string;
  efficiencyScore: number; // 0-100 (Calculated or overall)
  tasksCompleted: number;
  rating: number; // 1-5
  feedback?: string;
  safetyIncidents?: number;
  fuelEfficiencyScore?: number;
  skills?: string[];
  kudosCount?: number;
  goalsProgress?: number; // 0-100
  // New operational metrics
  operationalEfficiency?: number; // 0-100
  safetyCompliance?: number; // 0-100
  loadCycleTiming?: number; // 0-100
  serviceRating?: number; // 1-5
}

export interface AppSettings {
  dieselApprovalRequired: boolean;
  limitStrictEnforcement: boolean;
  companyName?: string;
  companyEmail?: string;
  companyContact?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyAddress?: string;
  companyGst?: string;
  companyLogo?: string;
  companySignature?: string;
  companyServices?: string[];
  bankDetails?: BankDetail[];
}

export interface StationRate {
  id: string;
  stationId: string;
  rate: number;
  dateAdded: string;
  notes?: string;
}

