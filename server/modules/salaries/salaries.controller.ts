import { Request, Response } from "express";
import { DriverSalaryEntity, EmployeeSalaryEntity, ExpenseEntity } from "../../db/entities";

function paymentModeToExpenseMode(mode: string): string {
  return mode === "CASH" ? "CASH" : mode === "UPI" ? "UPI" : mode === "CHEQUE" ? "CHEQUE" : "BANK";
}

const today = () => new Date().toISOString().split("T")[0];

// ---------- Driver salaries ----------
export async function listDriverSalaries(req: Request, res: Response): Promise<void> {
  res.json(await req.db!.getRepository(DriverSalaryEntity).find({ where: { userId: req.user!.id } }));
}

export async function createDriverSalary(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const salRepo = req.db!.getRepository(DriverSalaryEntity);
  const expRepo = req.db!.getRepository(ExpenseEntity);

  const s = { ...req.body } as any;
  delete s.id;
  delete s.user;
  s.userId = userId;
  const savedSal = await salRepo.save(s);

  await expRepo.save({
    userId,
    category: "DRIVER_SALARY",
    date: savedSal.dateGiven,
    amount: savedSal.totalAmount,
    paymentMode: paymentModeToExpenseMode(savedSal.paymentMode),
    referenceNo: savedSal.referenceNo || "",
    vendorName: savedSal.driverName,
    description: `Driver Salary Payout to ${savedSal.driverName} for ${savedSal.month}.`,
    status: "APPROVED",
    paymentStatus: "PAID",
    isAuto: true,
    bankId: savedSal.bankId,
    bankName: savedSal.bankName,
    history: [{ timestamp: today(), action: "CREATED", user: "System", note: "Auto-generated from Driver Payroll" }],
  });

  res.status(201).json(savedSal);
}

// ---------- Employee salaries ----------
export async function listEmployeeSalaries(req: Request, res: Response): Promise<void> {
  res.json(await req.db!.getRepository(EmployeeSalaryEntity).find({ where: { userId: req.user!.id } }));
}

export async function createEmployeeSalary(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const salRepo = req.db!.getRepository(EmployeeSalaryEntity);
  const expRepo = req.db!.getRepository(ExpenseEntity);

  const s = { ...req.body } as any;
  delete s.id;
  delete s.user;
  s.userId = userId;
  const savedSal = await salRepo.save(s);

  await expRepo.save({
    userId,
    category: "EMPLOYEE_SALARY",
    date: savedSal.dateGiven,
    amount: savedSal.netAmount,
    paymentMode: paymentModeToExpenseMode(savedSal.paymentMode),
    referenceNo: savedSal.referenceNo || "",
    vendorName: savedSal.employeeName,
    description: `Employee Salary Payout to ${savedSal.employeeName} for ${savedSal.salaryMonth}.`,
    status: "APPROVED",
    paymentStatus: "PAID",
    isAuto: true,
    bankId: savedSal.bankId,
    bankName: savedSal.bankName,
    history: [{ timestamp: today(), action: "CREATED", user: "System", note: "Auto-generated from Employee Payroll" }],
  });

  res.status(201).json(savedSal);
}
