import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import * as controller from "./salaries.controller";

/** Driver and employee payroll. Each create posts an auto-generated expense. */
export const driverSalaryRouter = Router({ mergeParams: true });
driverSalaryRouter.get("/", asyncHandler(controller.listDriverSalaries));
driverSalaryRouter.post("/", asyncHandler(controller.createDriverSalary));

export const employeeSalaryRouter = Router({ mergeParams: true });
employeeSalaryRouter.get("/", asyncHandler(controller.listEmployeeSalaries));
employeeSalaryRouter.post("/", asyncHandler(controller.createEmployeeSalary));
