import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OwnedEntity } from "./base.entity";

@Entity("clients")
export class ClientEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  gstNumber!: string;

  @Column("varchar")
  address!: string;

  @Column("varchar")
  city!: string;

  @Column("varchar")
  state!: string;

  @Column("varchar")
  country!: string;

  @Column("varchar")
  pincode!: string;

  @Column("varchar")
  contactPerson!: string;

  @Column("varchar")
  email!: string;

  @Column("varchar")
  phone!: string;

  @Column("numeric", { default: 0 })
  outstandingBalance!: number;
}

@Entity("sites")
export class SiteEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  location!: string;

  @Column("varchar")
  city!: string;

  @Column("varchar")
  state!: string;

  @Column("varchar")
  country!: string;

  @Column("varchar")
  pincode!: string;

  @Column("varchar")
  type!: string;

  @Column({ type: "varchar", nullable: true })
  contactPerson?: string;

  @Column({ type: "varchar", nullable: true })
  contactPhone?: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column({ type: "varchar", nullable: true })
  gstNumber?: string;

  @Column("numeric", { default: 0 })
  outstandingBalance!: number;
}

@Entity("routes")
export class RouteEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  source!: string;

  @Column("varchar")
  destination!: string;

  @Column("numeric")
  distanceKm!: number;

  @Column({ type: "varchar", nullable: true })
  mapUrl?: string;

  @Column({ type: "varchar", nullable: true })
  sourceMapUrl?: string;

  @Column({ type: "varchar", nullable: true })
  destinationMapUrl?: string;
}

@Entity("brokers")
export class BrokerEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  email!: string;

  @Column("varchar")
  phone!: string;

  @Column("varchar")
  whatsappNumber!: string;

  @Column("varchar")
  address!: string;

  @Column("varchar")
  upiId!: string;

  @Column("simple-json")
  bankDetails!: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
}

@Entity("item_products")
export class ItemProductEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  hsnCode!: string;

  @Column("numeric")
  gstRate!: number;

  @Column("numeric")
  defaultRate!: number;

  @Column("varchar")
  description!: string;

  @Column({ type: "varchar", nullable: true })
  itemCode?: string;
}

@Entity("orders")
export class OrderEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  clientName!: string;

  @Column("varchar")
  projectSite!: string;

  @Column("numeric")
  quantity!: number;

  @Column("numeric")
  ratePerMT!: number;

  @Column("varchar")
  pickupDate!: string;

  @Column("varchar")
  deliveryDate!: string;

  @Column({ type: "boolean", default: true })
  hasGST!: boolean;

  @Column("varchar")
  paymentTerms!: string;

  @Column("varchar")
  status!: string;

  @Column("numeric", { nullable: true })
  totalKm?: number;

  @Column({ type: "varchar", nullable: true })
  assignedTruckId?: string;

  @Column({ type: "varchar", nullable: true })
  assignedRouteId?: string;

  @Column("numeric", { nullable: true })
  estimatedDiesel?: number;

  @Column({ type: "varchar", nullable: true })
  materialName?: string;

  @Column({ type: "varchar", nullable: true })
  hsnSacCode?: string;

  @Column("numeric", { nullable: true })
  gstRate?: number;

  @Column({ type: "varchar", nullable: true })
  itemCode?: string;

  @Column("simple-json", { nullable: true })
  services?: string[];

  @Column({ type: "varchar", nullable: true })
  dcNo?: string;

  @Column({ type: "varchar", nullable: true })
  soNo?: string;

  @Column({ type: "varchar", nullable: true })
  remarks?: string;

  @Column({ type: "varchar", nullable: true })
  brokerId?: string;

  @Column({ type: "varchar", nullable: true })
  brokerName?: string;

  @Column("numeric", { nullable: true })
  brokerCommissionPerMT?: number;

  @Column("numeric", { nullable: true })
  totalBrokerCommission?: number;

  @Column("numeric", { nullable: true })
  actualQuantity?: number;

  @Column({ type: "varchar", nullable: true })
  podImageUrl?: string;

  @Column({ type: "varchar", nullable: true })
  loadingSlipUrl?: string;

  @Column({ type: "varchar", nullable: true })
  hazardNote?: string;

  @Column("numeric", { nullable: true })
  dieselRatePerLiter?: number;

  @Column({ type: "varchar", nullable: true })
  assignedTruckNumber?: string;

  @Column({ type: "varchar", nullable: true })
  driverName?: string;

  @Column({ type: "varchar", nullable: true })
  driverPhone?: string;
}

@Entity("expenses")
export class ExpenseEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  category!: string;

  @Column("varchar")
  date!: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  paymentMode!: string;

  @Column("varchar")
  referenceNo!: string;

  @Column({ type: "varchar", nullable: true })
  orderId?: string;

  @Column({ type: "varchar", nullable: true })
  truckId?: string;

  @Column("varchar")
  vendorName!: string;

  @Column("varchar")
  description!: string;

  @Column({ type: "varchar", nullable: true })
  receiptUrl?: string;

  @Column("varchar")
  status!: string;

  @Column({ type: "boolean", default: false })
  isAuto!: boolean;

  @Column("simple-json", { nullable: true })
  history!: any[];

  @Column("numeric", { nullable: true })
  liters?: number;

  @Column("numeric", { nullable: true })
  rate?: number;

  @Column({ type: "boolean", nullable: true })
  isLimitExceeded?: boolean;

  @Column({ type: "varchar", nullable: true })
  responsibleStaff?: string;

  @Column("varchar")
  paymentStatus!: string;

  @Column({ type: "varchar", nullable: true })
  dueDate?: string;

  @Column({ type: "varchar", nullable: true })
  paidDate?: string;

  @Column({ type: "boolean", nullable: true })
  isMaintenance?: boolean;

  @Column({ type: "varchar", nullable: true })
  poolId?: string;

  @Column({ type: "varchar", nullable: true })
  bankId?: string;

  @Column({ type: "varchar", nullable: true })
  bankName?: string;
}
