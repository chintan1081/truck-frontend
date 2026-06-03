import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { orderCreateSchema, orderUpdateSchema } from "../../validation/schemas";
import * as controller from "./orders.controller";

/**
 * Orders carry status-transition guards and dispatch side-effects (truck/driver
 * assignment), so they get a dedicated router rather than the generic CRUD one.
 */
export const ordersRouter = Router({ mergeParams: true });

ordersRouter.get("/", asyncHandler(controller.listOrders));
ordersRouter.post("/", validate(orderCreateSchema), asyncHandler(controller.createOrder));
ordersRouter.put("/:id", validate(orderUpdateSchema), asyncHandler(controller.updateOrder));
ordersRouter.delete("/:id", asyncHandler(controller.deleteOrder));
