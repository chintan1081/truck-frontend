import { Router } from "express";
import { requireAuth } from "./middleware/auth.middleware";
import { attachDb } from "./middleware/db.middleware";

import { dataRouter } from "./modules/data/data.routes";
import { usersRouter } from "./modules/users/users.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { plantPoolRouter } from "./modules/plant-pool/plant-pool.routes";
import { driverSalaryRouter, employeeSalaryRouter } from "./modules/salaries/salaries.routes";
import { registerCrudRoutes } from "./modules/crud/crud.registry";

/**
 * Authenticated API router mounted at `/api`.
 *
 * Every route here requires a valid bearer token (requireAuth) and gets the
 * shared DataSource attached (attachDb) before any handler runs. Handlers scope
 * every query to `req.user.id`, so users can only ever read/write their own rows.
 *
 * Custom-logic routers are mounted before the generic CRUD routers.
 */
export function buildApiRouter(): Router {
  const router = Router();

  router.use(requireAuth);
  router.use(attachDb);

  // Aggregate bootstrap + settings.
  router.use("/", dataRouter);

  // User profile (photo upload).
  router.use("/users", usersRouter);

  // Custom business logic.
  router.use("/orders", ordersRouter);
  router.use("/invoices", invoicesRouter);
  router.use("/plant-pool", plantPoolRouter);
  router.use("/salaries", driverSalaryRouter);
  router.use("/employee-salaries", employeeSalaryRouter);

  // Generic CRUD entities.
  registerCrudRoutes((path, sub) => router.use(path, sub));

  return router;
}
