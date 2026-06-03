/**
 * Single source of truth for the TypeORM entity set.
 *
 * Entities are grouped by domain into sibling files; this barrel re-exports them
 * and exposes the `ENTITIES` array consumed by every DataSource (runtime tenant
 * connections and the migration CLI alike). Add a new entity to its domain file
 * and to `ENTITIES` below — nothing else needs to change.
 */
export * from "./base.entity";
export * from "./user.entity";
export * from "./system.entities";
export * from "./fleet.entities";
export * from "./operations.entities";
export * from "./finance.entities";
export * from "./hr.entities";

import { UserEntity } from "./user.entity";
import { SettingsEntity, CustomAlertEntity } from "./system.entities";
import {
  TruckEntity,
  DriverEntity,
  TruckEMIEntity,
  MaintenanceExpenseEntity,
  FuelSiteEntity,
  FuelTransactionEntity,
} from "./fleet.entities";
import {
  ClientEntity,
  SiteEntity,
  RouteEntity,
  BrokerEntity,
  ItemProductEntity,
  OrderEntity,
  ExpenseEntity,
} from "./operations.entities";
import {
  BankEntity,
  InvoiceEntity,
  PlantAdvanceEntity,
  PlantAdvancePoolEntryEntity,
  StationRateEntity,
  BankTransactionEntity,
  PaymentRecordEntity,
} from "./finance.entities";
import {
  EmployeeEntity,
  DriverSalaryEntity,
  EmployeeSalaryEntity,
  AttendanceRecordEntity,
  LeaveRequestEntity,
  PerformanceMetricEntity,
} from "./hr.entities";

export const ENTITIES = [
  // system
  SettingsEntity, CustomAlertEntity, UserEntity,
  // fleet
  TruckEntity, DriverEntity, TruckEMIEntity, MaintenanceExpenseEntity, FuelSiteEntity, FuelTransactionEntity,
  // operations
  ClientEntity, SiteEntity, RouteEntity, BrokerEntity, ItemProductEntity, OrderEntity, ExpenseEntity,
  // finance
  BankEntity, InvoiceEntity, PlantAdvanceEntity, PlantAdvancePoolEntryEntity, StationRateEntity,
  BankTransactionEntity, PaymentRecordEntity,
  // hr
  EmployeeEntity, DriverSalaryEntity, EmployeeSalaryEntity, AttendanceRecordEntity, LeaveRequestEntity,
  PerformanceMetricEntity,
] as const;
