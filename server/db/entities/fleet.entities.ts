import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OwnedEntity } from "./base.entity";

@Entity("trucks")
export class TruckEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  description!: string;

  @Column("varchar")
  modelNumber!: string;

  @Column("varchar")
  plateNumber!: string;

  @Column("varchar")
  truckNumber!: string;

  @Column("varchar")
  driverName!: string;

  @Column("varchar")
  ownerName!: string;

  @Column("varchar")
  ownerContact!: string;

  @Column("numeric")
  mileage!: number;

  @Column("numeric")
  dieselLimit!: number;

  @Column("varchar")
  status!: string;

  @Column({ type: "boolean", default: false })
  isMaintenanceMode!: boolean;

  @Column({ type: "varchar", nullable: true })
  assignedDriverId?: string;

  @Column("varchar")
  insuranceExpiry!: string;

  @Column("varchar")
  fitnessExpiry!: string;

  @Column("varchar")
  permitExpiry!: string;

  @Column("varchar")
  pollutionExpiry!: string;

  @Column("varchar")
  rcExpiry!: string;

  @Column("varchar")
  lastServiceDate!: string;

  @Column("numeric")
  totalMtHandled!: number;

  @Column("numeric")
  driverScore!: number;

  @Column("numeric")
  idleTimeHours!: number;

  @Column("numeric")
  engineHours!: number;

  @Column("numeric")
  currentOdometer!: number;

  @Column("numeric", { nullable: true })
  odometerAtLastService?: number;

  @Column("numeric", { nullable: true })
  serviceIntervalKm?: number;

  @Column({ type: "integer", nullable: true })
  wheelConfiguration?: number;

  @Column({ type: "varchar", nullable: true })
  defaultRouteId?: string;

  @Column({ type: "varchar", nullable: true })
  maintenanceReason?: string;

  @Column({ type: "varchar", nullable: true })
  nextServiceDate?: string;

  @Column({ type: "varchar", nullable: true })
  engineNumber?: string;

  @Column({ type: "varchar", nullable: true })
  fuelType?: string;

  @Column("numeric", { nullable: true })
  fuelLevel?: number;

  @Column("numeric", { nullable: true })
  currentFuelLiters?: number;

  @Column({ type: "varchar", nullable: true })
  branch?: string;

  @Column({ type: "varchar", nullable: true })
  registrationDate?: string;

  @Column({ type: "varchar", nullable: true })
  vehicleApplication?: string;

  @Column({ type: "varchar", nullable: true })
  vehicleCode?: string;

  @Column({ type: "varchar", nullable: true })
  vehicleType?: string;

  @Column({ type: "varchar", nullable: true })
  ladenWeight?: string;

  @Column({ type: "varchar", nullable: true })
  unladenWeight?: string;

  @Column({ type: "varchar", nullable: true })
  tonnage?: string;

  @Column({ type: "varchar", nullable: true })
  makeYear?: string;

  @Column({ type: "varchar", nullable: true })
  registrationAddress?: string;

  @Column({ type: "varchar", nullable: true })
  ownedOutside?: string;

  @Column({ type: "varchar", nullable: true })
  specification?: string;

  @Column("simple-json", { nullable: true })
  healthStatus!: any;

  @Column("simple-json", { nullable: true })
  tyreDetails?: any[];

  @Column("simple-json", { nullable: true })
  breakdownHistory?: any[];

  @Column("simple-json", { nullable: true })
  serviceHistory?: any[];

  @Column("simple-json", { nullable: true })
  inspectionLogs?: any[];

  @Column("simple-json", { nullable: true })
  odometerHistory?: any[];

  @Column("simple-json", { nullable: true })
  documents!: any[];

  @Column("simple-json", { nullable: true })
  tyreRotationHistory?: any[];
}

@Entity("drivers")
export class DriverEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  name!: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column("varchar")
  address!: string;

  @Column("varchar")
  upiId!: string;

  @Column("varchar")
  bankDetails!: string;

  @Column({ type: "varchar", nullable: true })
  bankName?: string;

  @Column({ type: "varchar", nullable: true })
  accountNumber?: string;

  @Column({ type: "varchar", nullable: true })
  ifscCode?: string;

  @Column("varchar")
  phoneNumber!: string;

  @Column("varchar")
  whatsappNumber!: string;

  @Column("varchar")
  licenseExpiry!: string;

  @Column({ type: "varchar", nullable: true })
  joinDate?: string;

  @Column({ type: "varchar", nullable: true })
  exitDate?: string;

  @Column("numeric", { nullable: true })
  experienceYears?: number;

  @Column({ type: "boolean", default: false })
  isOnline!: boolean;

  @Column({ type: "varchar", nullable: true })
  lastLogin?: string;

  @Column("simple-json", { nullable: true })
  documents?: any[];
}

@Entity("truck_emis")
export class TruckEMIEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  truckId!: string;

  @Column("varchar")
  bankName!: string;

  @Column("numeric")
  amount!: number;

  @Column("integer")
  dueDate!: number;

  @Column("varchar")
  startDate!: string;

  @Column("integer")
  tenureMonths!: number;

  @Column("integer")
  paidInstallments!: number;

  @Column("numeric")
  totalLoanAmount!: number;

  @Column("varchar")
  status!: string;

  @Column({ type: "varchar", nullable: true })
  loanType?: string;

  @Column("numeric", { nullable: true })
  interestRate?: number;
}

@Entity("maintenance_expenses")
export class MaintenanceExpenseEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  truckId!: string;

  @Column({ type: "varchar", nullable: true })
  employeeId?: string;

  @Column("varchar")
  date!: string;

  @Column("varchar")
  serviceDate!: string;

  @Column("varchar")
  category!: string;

  @Column("varchar")
  description!: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  workshopName!: string;

  @Column("numeric")
  odometerReading!: number;

  @Column("simple-json", { nullable: true })
  partsReplaced!: string[];

  @Column("numeric", { nullable: true })
  nextServiceDueKm?: number;

  @Column({ type: "varchar", nullable: true })
  nextServiceDueDate?: string;

  @Column("varchar")
  status!: string;

  @Column({ type: "varchar", nullable: true })
  paidDate?: string;

  @Column({ type: "varchar", nullable: true })
  dueDate?: string;

  @Column({ type: "varchar", nullable: true })
  paymentMode?: string;

  @Column({ type: "varchar", nullable: true })
  orderId?: string;

  @Column({ type: "varchar", nullable: true })
  responsibleStaff?: string;
}

@Entity("fuel_sites")
export class FuelSiteEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  companyName!: string;

  @Column("varchar")
  ownerName!: string;

  @Column("varchar")
  phoneNumber!: string;

  @Column("varchar")
  contactEmail!: string;

  @Column("varchar")
  whatsappNumber!: string;

  @Column("varchar")
  gstNumber!: string;

  @Column("varchar")
  address!: string;

  @Column({ type: "varchar", nullable: true })
  googleMapLink?: string;

  @Column("varchar")
  accountNumber!: string;

  @Column("varchar")
  ifscCode!: string;

  @Column("varchar")
  bankName!: string;

  @Column("varchar")
  upiId!: string;
}

@Entity("fuel_transactions")
export class FuelTransactionEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  siteId!: string;

  @Column("varchar")
  siteName!: string;

  @Column("varchar")
  truckId!: string;

  @Column("varchar")
  truckNumber!: string;

  @Column("varchar")
  driverId!: string;

  @Column("varchar")
  driverName!: string;

  @Column("numeric")
  quantity!: number;

  @Column("numeric")
  rate!: number;

  @Column("numeric")
  totalAmount!: number;

  @Column("varchar")
  date!: string;

  @Column("varchar")
  time!: string;

  @Column("numeric")
  odometerReading!: number;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column("varchar")
  paymentStatus!: string;

  @Column({ type: "varchar", nullable: true })
  paymentDate?: string;

  @Column({ type: "varchar", nullable: true })
  paymentMode?: string;

  @Column({ type: "varchar", nullable: true })
  referenceNo?: string;
}
