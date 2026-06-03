import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OwnedEntity } from "./base.entity";

@Entity("banks")
export class BankEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  bankName!: string;

  @Column("varchar")
  bankAddress!: string;

  @Column("varchar")
  accountNumber!: string;

  @Column("varchar")
  checkNumber!: string;

  @Column("varchar")
  description!: string;

  @Column({ type: "varchar", nullable: true })
  ifscCode?: string;

  @Column({ type: "varchar", nullable: true })
  managerName?: string;

  @Column({ type: "varchar", nullable: true })
  managerEmail?: string;

  @Column({ type: "varchar", nullable: true })
  managerPhone?: string;

  @Column({ type: "varchar", nullable: true })
  managerWhatsapp?: string;
}

@Entity("invoices")
export class InvoiceEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  invoiceNumber!: string;

  @Column("varchar")
  clientId!: string;

  @Column("varchar")
  clientName!: string;

  @Column("varchar")
  clientGst!: string;

  @Column("varchar")
  date!: string;

  @Column("varchar")
  dueDate!: string;

  @Column("simple-json")
  orderIds!: string[];

  @Column({ type: "varchar", nullable: true })
  poNumber?: string;

  @Column({ type: "varchar", nullable: true })
  soNumber?: string;

  @Column({ type: "varchar", nullable: true })
  ewayBill?: string;

  @Column("varchar")
  sacCode!: string;

  @Column("varchar")
  placeOfSupply!: string;

  @Column("varchar")
  bankAccount!: string;

  @Column({ type: "varchar", nullable: true })
  selectedBankId?: string;

  @Column("numeric")
  subTotal!: number;

  @Column("numeric")
  gstRate!: number;

  @Column("varchar")
  gstType!: string;

  @Column("numeric")
  gstAmount!: number;

  @Column("numeric")
  tdsAmount!: number;

  @Column("numeric")
  discountAmount!: number;

  @Column("numeric")
  tcsRate!: number;

  @Column("numeric")
  tcsAmount!: number;

  @Column("numeric")
  roundOff!: number;

  @Column("numeric")
  autoRoundOff!: number;

  @Column("numeric")
  totalAmount!: number;

  @Column("numeric")
  paidAmount!: number;

  @Column("varchar")
  status!: string;

  @Column({ type: "varchar", nullable: true })
  previousStatus?: string;

  @Column("simple-json", { nullable: true })
  payments!: any[];

  @Column("simple-json", { nullable: true })
  history!: any[];

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column({ type: "varchar", nullable: true })
  terms?: string;

  @Column("numeric", { nullable: true })
  overdueCount?: number;
}

@Entity("plant_advances")
export class PlantAdvanceEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  orderId!: string;

  @Column("varchar")
  truckId!: string;

  @Column("varchar")
  stationId!: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  date!: string;

  @Column({ type: "varchar", nullable: true })
  utilizationDate?: string;

  @Column("varchar")
  paymentMode!: string;

  @Column("varchar")
  referenceNo!: string;

  @Column("varchar")
  status!: string;

  @Column({ type: "boolean", default: false })
  isPriority!: boolean;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column("numeric", { nullable: true })
  quantity?: number;

  @Column("numeric", { nullable: true })
  rate?: number;
}

@Entity("plant_advance_pool_entries")
export class PlantAdvancePoolEntryEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  stationId!: string;

  @Column({ type: "varchar", nullable: true })
  employeeId?: string;

  @Column({ type: "varchar", nullable: true })
  employeeName?: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  date!: string;

  @Column("varchar")
  referenceNo!: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column("varchar")
  transactionType!: string;

  @Column("varchar")
  paymentMethod!: string;

  @Column({ type: "varchar", nullable: true })
  bankId?: string;
}

@Entity("station_rates")
export class StationRateEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  stationId!: string;

  @Column("varchar")
  materialName!: string;

  @Column("numeric")
  loadingRate!: number;

  @Column("numeric")
  unloadingRate!: number;

  @Column({ type: "varchar", nullable: true })
  remarks?: string;

  @Column({ type: "varchar", nullable: true })
  stationName?: string;
}

@Entity("bank_transactions")
export class BankTransactionEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  bankId!: string;

  @Column("varchar")
  bankName!: string;

  @Column("varchar")
  type!: string;

  @Column({ type: "varchar", nullable: true })
  fromWhere?: string;

  @Column({ type: "varchar", nullable: true })
  toWhom?: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  date!: string;

  @Column({ type: "varchar", nullable: true })
  checkNo?: string;

  @Column({ type: "varchar", nullable: true })
  neftUpiId?: string;

  @Column("varchar")
  description!: string;
}

@Entity("payment_records")
export class PaymentRecordEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  type!: string;

  @Column("varchar")
  partyName!: string;

  @Column("varchar")
  method!: string;

  @Column("numeric")
  amount!: number;

  @Column("varchar")
  date!: string;

  @Column({ type: "varchar", nullable: true })
  bankId?: string;

  @Column({ type: "varchar", nullable: true })
  bankName?: string;

  @Column({ type: "varchar", nullable: true })
  transactionId?: string;

  @Column("varchar")
  description!: string;

  @Column({ type: "varchar", nullable: true })
  poolId?: string;
}
