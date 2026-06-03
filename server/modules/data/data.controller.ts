import { Request, Response } from "express";
import type { Repository } from "typeorm";
import { clampInt } from "../../shared/pagination";
import {
  SettingsEntity, TruckEntity, DriverEntity, ClientEntity, SiteEntity, RouteEntity, BrokerEntity,
  EmployeeEntity, BankEntity, ItemProductEntity, OrderEntity, ExpenseEntity, InvoiceEntity,
  DriverSalaryEntity, EmployeeSalaryEntity, TruckEMIEntity, MaintenanceExpenseEntity, CustomAlertEntity,
  PlantAdvanceEntity, PlantAdvancePoolEntryEntity, StationRateEntity, FuelSiteEntity,
  FuelTransactionEntity, BankTransactionEntity, PaymentRecordEntity, AttendanceRecordEntity,
  LeaveRequestEntity, PerformanceMetricEntity,
} from "../../db/entities";

const DEFAULT_SETTINGS = {
  dieselApprovalRequired: true,
  limitStrictEnforcement: true,
  companyName: "FlyAsh Logistics Pro",
  companyEmail: "admin@flyashpro.com",
  companyContact: "+91 98765 43210",
  companyWhatsapp: "+91 98765 43210",
  companyAddress: "Industrial Hub, Sector 5, Greater Noida",
  companyServices: ["FlyAsh Logistics", "Bulk Transportation", "Fleet Management"],
};

/**
 * Aggregated bootstrap payload for the SPA, scoped to the authenticated user.
 *
 * Each collection accepts an independent limit through the query string, e.g.
 *   /api/all-data?orders=50&expenses=100
 * Default per-collection limit is 200. Heavy collections also return a
 * `_meta.totals` map so the client knows when to page via the dedicated
 * CRUD endpoints.
 */
export async function getAllData(req: Request, res: Response): Promise<void> {
  const db = req.db!;
  const userId = req.user!.id;
  const lim = (key: string, def = 200) => clampInt((req.query as any)[key], 1, 1000, def);

  const settings = await db.getRepository(SettingsEntity).findOne({ where: { userId } });

  const heavy = async (repo: Repository<any>, key: string, take = 200) => {
    const [data, total] = await repo.findAndCount({
      where: { userId },
      take: lim(key, take),
      order: { id: "DESC" } as any,
    });
    return { data, total };
  };
  const light = (repo: Repository<any>) => repo.find({ where: { userId } });

  const [
    ordersR, expensesR, fleet, drivers, clients, sites, routes, brokers, employees, banks,
    itemProducts, bankTxR, paymentRecsR, invoicesR, salariesR, empSalariesR, emis, maintenanceR,
    customAlerts, plantAdvancesR, plantAdvancePoolR, stationRates, fuelSites, attendanceR, leaves,
    performance, fuelTransactionsR,
  ] = await Promise.all([
    heavy(db.getRepository(OrderEntity), "orders"),
    heavy(db.getRepository(ExpenseEntity), "expenses"),
    light(db.getRepository(TruckEntity)),
    light(db.getRepository(DriverEntity)),
    light(db.getRepository(ClientEntity)),
    light(db.getRepository(SiteEntity)),
    light(db.getRepository(RouteEntity)),
    light(db.getRepository(BrokerEntity)),
    light(db.getRepository(EmployeeEntity)),
    light(db.getRepository(BankEntity)),
    light(db.getRepository(ItemProductEntity)),
    heavy(db.getRepository(BankTransactionEntity), "bankTransactions"),
    heavy(db.getRepository(PaymentRecordEntity), "paymentRecords"),
    heavy(db.getRepository(InvoiceEntity), "invoices"),
    heavy(db.getRepository(DriverSalaryEntity), "salaries"),
    heavy(db.getRepository(EmployeeSalaryEntity), "employeeSalaries"),
    light(db.getRepository(TruckEMIEntity)),
    heavy(db.getRepository(MaintenanceExpenseEntity), "maintenance"),
    light(db.getRepository(CustomAlertEntity)),
    heavy(db.getRepository(PlantAdvanceEntity), "plantAdvances"),
    heavy(db.getRepository(PlantAdvancePoolEntryEntity), "plantAdvancePool"),
    light(db.getRepository(StationRateEntity)),
    light(db.getRepository(FuelSiteEntity)),
    heavy(db.getRepository(AttendanceRecordEntity), "attendance"),
    light(db.getRepository(LeaveRequestEntity)),
    light(db.getRepository(PerformanceMetricEntity)),
    heavy(db.getRepository(FuelTransactionEntity), "fuelTransactions"),
  ]);

  res.json({
    settings: settings || DEFAULT_SETTINGS,
    orders: ordersR.data,
    expenses: expensesR.data,
    fleet, drivers, clients, sites, routes, brokers, employees, banks, itemProducts,
    bankTransactions: bankTxR.data,
    paymentRecords: paymentRecsR.data,
    invoices: invoicesR.data,
    salaries: salariesR.data,
    employeeSalaries: empSalariesR.data,
    emis,
    maintenance: maintenanceR.data,
    customAlerts,
    plantAdvances: plantAdvancesR.data,
    plantAdvancePool: plantAdvancePoolR.data,
    stationRates, fuelSites,
    attendance: attendanceR.data,
    leaves, performance,
    fuelTransactions: fuelTransactionsR.data,
    _meta: {
      totals: {
        orders: ordersR.total,
        expenses: expensesR.total,
        bankTransactions: bankTxR.total,
        paymentRecords: paymentRecsR.total,
        invoices: invoicesR.total,
        salaries: salariesR.total,
        employeeSalaries: empSalariesR.total,
        maintenance: maintenanceR.total,
        plantAdvances: plantAdvancesR.total,
        plantAdvancePool: plantAdvancePoolR.total,
        attendance: attendanceR.total,
        fuelTransactions: fuelTransactionsR.total,
      },
    },
  });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const repo = req.db!.getRepository(SettingsEntity);

  let settings = await repo.findOne({ where: { userId } });
  if (!settings) {
    settings = new SettingsEntity();
    settings.userId = userId;
  }

  const body = { ...req.body };
  delete body.id;
  delete body.userId;
  delete body.user;
  repo.merge(settings, body);
  settings.userId = userId;

  res.json(await repo.save(settings));
}
