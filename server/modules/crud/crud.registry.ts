import type { Router } from "express";
import type { EntityTarget, ObjectLiteral } from "typeorm";
import { buildCrudRouter } from "./crud.factory";
import { expenseCreateSchema } from "../../validation/schemas";
import type { Schema } from "../../middleware/validate.middleware";
import {
  TruckEntity, DriverEntity, ClientEntity, SiteEntity, RouteEntity, BrokerEntity,
  EmployeeEntity, BankEntity, ItemProductEntity, ExpenseEntity, TruckEMIEntity,
  MaintenanceExpenseEntity, CustomAlertEntity, PlantAdvanceEntity, StationRateEntity,
  FuelSiteEntity, FuelTransactionEntity, BankTransactionEntity, PaymentRecordEntity,
  AttendanceRecordEntity, LeaveRequestEntity, PerformanceMetricEntity,
} from "../../db/entities";

interface CrudDefinition {
  path: string;
  entity: EntityTarget<ObjectLiteral>;
  resourceName: string;
  writeSchema?: Schema;
}

/**
 * Declarative registry of all entities served by the generic CRUD factory.
 * Entities that need custom business logic (orders, invoices, salaries, plant
 * pool) are NOT listed here — they have dedicated modules.
 */
export const CRUD_DEFINITIONS: CrudDefinition[] = [
  { path: "expenses", entity: ExpenseEntity, resourceName: "expenses", writeSchema: expenseCreateSchema },
  { path: "fleet", entity: TruckEntity, resourceName: "fleet" },
  { path: "drivers", entity: DriverEntity, resourceName: "drivers" },
  { path: "clients", entity: ClientEntity, resourceName: "clients" },
  { path: "sites", entity: SiteEntity, resourceName: "sites" },
  { path: "routes", entity: RouteEntity, resourceName: "routes" },
  { path: "brokers", entity: BrokerEntity, resourceName: "brokers" },
  { path: "employees", entity: EmployeeEntity, resourceName: "employees" },
  { path: "banks", entity: BankEntity, resourceName: "banks" },
  { path: "item-products", entity: ItemProductEntity, resourceName: "item-products" },
  { path: "fuel-sites", entity: FuelSiteEntity, resourceName: "fuel-sites" },
  { path: "fuel-transactions", entity: FuelTransactionEntity, resourceName: "fuel-transactions" },
  { path: "bank-transactions", entity: BankTransactionEntity, resourceName: "bank-transactions" },
  { path: "payment-records", entity: PaymentRecordEntity, resourceName: "payment-records" },
  { path: "emis", entity: TruckEMIEntity, resourceName: "emis" },
  { path: "maintenance", entity: MaintenanceExpenseEntity, resourceName: "maintenance" },
  { path: "alerts", entity: CustomAlertEntity, resourceName: "alerts" },
  { path: "plant-advances", entity: PlantAdvanceEntity, resourceName: "plant-advances" },
  { path: "station-rates", entity: StationRateEntity, resourceName: "station-rates" },
  { path: "attendance", entity: AttendanceRecordEntity, resourceName: "attendance" },
  { path: "leaves", entity: LeaveRequestEntity, resourceName: "leaves" },
  { path: "performance", entity: PerformanceMetricEntity, resourceName: "performance" },
];

export function registerCrudRoutes(mount: (path: string, router: Router) => void): void {
  for (const def of CRUD_DEFINITIONS) {
    mount(`/${def.path}`, buildCrudRouter(def.entity, def.resourceName, { writeSchema: def.writeSchema }));
  }
}
