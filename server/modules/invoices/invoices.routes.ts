import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { invoiceCreateSchema, invoiceUpdateSchema } from "../../validation/schemas";
import * as controller from "./invoices.controller";

/** Invoices recompute totals/GST/status server-side on every write. */
export const invoicesRouter = Router({ mergeParams: true });

invoicesRouter.get("/", asyncHandler(controller.listInvoices));
invoicesRouter.post("/", validate(invoiceCreateSchema), asyncHandler(controller.createInvoice));
invoicesRouter.put("/:id", validate(invoiceUpdateSchema), asyncHandler(controller.updateInvoice));
invoicesRouter.delete("/:id", asyncHandler(controller.deleteInvoice));
