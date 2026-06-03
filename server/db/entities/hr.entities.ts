import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OwnedEntity } from "./base.entity";

@Entity("employees")
export class EmployeeEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", nullable: true })
  trackingId?: string;

  @Column("varchar")
  fullName!: string;

  @Column({ type: "varchar", nullable: true })
  email?: string;

  @Column("varchar")
  phoneNumber!: string;

  @Column("varchar")
  whatsappNumber!: string;

  @Column("varchar")
  address!: string;

  @Column({ type: "varchar", nullable: true })
  designation?: string;

  @Column("varchar")
  joinDate!: string;

  @Column({ type: "varchar", nullable: true })
  exitDate?: string;

  @Column("numeric", { nullable: true })
  experienceYears?: number;

  @Column({ type: "boolean", default: false })
  isOnline!: boolean;

  @Column("simple-json")
  bankAccountDetails!: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
  };

  @Column("simple-json", { nullable: true })
  documents?: any[];
}

@Entity("driver_salaries")
export class DriverSalaryEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  driverId!: string;

  @Column("varchar")
  driverName!: string;

  @Column("varchar")
  month!: string;

  @Column("varchar")
  salaryType!: string;

  @Column("numeric")
  baseRate!: number;

  @Column("numeric")
  presentDays!: number;

  @Column("numeric")
  bonus!: number;

  @Column("numeric")
  deductions!: number;

  @Column("numeric")
  advanceAdjusted!: number;

  @Column("numeric")
  totalAmount!: number;

  @Column("varchar")
  dateGiven!: string;

  @Column("varchar")
  paymentMode!: string;

  @Column("varchar")
  referenceNo!: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column({ type: "varchar", nullable: true })
  bankId?: string;

  @Column({ type: "varchar", nullable: true })
  bankName?: string;
}

@Entity("employee_salaries")
export class EmployeeSalaryEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  employeeId!: string;

  @Column("varchar")
  employeeName!: string;

  @Column("varchar")
  salaryType!: string;

  @Column("varchar")
  salaryMonth!: string;

  @Column("varchar")
  dateGiven!: string;

  @Column("numeric")
  baseAmount!: number;

  @Column("numeric")
  bonus!: number;

  @Column("numeric")
  deductions!: number;

  @Column("numeric")
  advanceAdjusted!: number;

  @Column("numeric")
  netAmount!: number;

  @Column("varchar")
  paymentMode!: string;

  @Column("varchar")
  referenceNo!: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column({ type: "varchar", nullable: true })
  bankId?: string;

  @Column({ type: "varchar", nullable: true })
  bankName?: string;
}

@Entity("attendance_records")
export class AttendanceRecordEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  entityId!: string;

  @Column("varchar")
  entityType!: string;

  @Column("varchar")
  date!: string;

  @Column("varchar")
  status!: string;

  @Column({ type: "varchar", nullable: true })
  remarks?: string;
}

@Entity("leave_requests")
export class LeaveRequestEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  entityId!: string;

  @Column("varchar")
  entityType!: string;

  @Column("varchar")
  startDate!: string;

  @Column("varchar")
  endDate!: string;

  @Column("varchar")
  reason!: string;

  @Column("varchar")
  status!: string;

  @Column({ type: "varchar", nullable: true })
  approvedBy?: string;

  @Column({ type: "varchar", nullable: true })
  note?: string;
}

@Entity("performance_metrics")
export class PerformanceMetricEntity extends OwnedEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar")
  entityId!: string;

  @Column("varchar")
  entityType!: string;

  @Column("varchar")
  month!: string;

  @Column("numeric")
  tripsCompleted!: number;

  @Column("numeric")
  onTimeDeliveryRate!: number;

  @Column("numeric")
  fuelEfficiencyScore!: number;

  @Column("numeric")
  safetyRating!: number;

  @Column("numeric")
  attendanceRating!: number;

  @Column("numeric")
  overallScore!: number;

  @Column("simple-json", { nullable: true })
  history?: any[];
}
