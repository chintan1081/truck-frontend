import type { Schema } from "../middleware/validate.middleware";

// ---- Shared status enums (mirrored on the client) ----
export const TRIP_STATUSES = ["CREATED", "ASSIGNED", "PICKED", "DELIVERED", "INVOICED", "PAID"] as const;
export const INVOICE_STATUSES = ["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"] as const;
export const EXPENSE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const GST_TYPES = ["IGST", "CGST_SGST"] as const;

export const orderCreateSchema: Schema = {
  clientName: { type: "string", required: true, min: 1 },
  projectSite: { type: "string", required: true },
  quantity: { type: "number", required: true, min: 0 },
  ratePerMT: { type: "number", required: true, min: 0 },
  pickupDate: { type: "iso-date", required: true },
  deliveryDate: { type: "iso-date", required: true },
  hasGST: { type: "boolean", required: true },
  paymentTerms: { type: "string", required: true },
  status: { type: "string", required: true, enum: TRIP_STATUSES },
  assignedTruckId: { type: "id" },
  assignedRouteId: { type: "id" },
  gstRate: { type: "number", min: 0, max: 100 },
};

// For updates, every field is optional but still validated when present.
export const orderUpdateSchema: Schema = Object.fromEntries(
  Object.entries(orderCreateSchema).map(([k, v]) => [k, { ...v, required: false }])
);

export const invoiceCreateSchema: Schema = {
  invoiceNumber: { type: "string", required: true },
  clientId: { type: "id", required: true },
  clientName: { type: "string", required: true },
  date: { type: "iso-date", required: true },
  dueDate: { type: "iso-date", required: true },
  orderIds: { type: "string[]", required: true },
  gstRate: { type: "number", required: true, min: 0, max: 100 },
  gstType: { type: "string", required: true, enum: GST_TYPES },
  tdsAmount: { type: "number", min: 0 },
  discountAmount: { type: "number", min: 0 },
  tcsRate: { type: "number", min: 0, max: 100 },
  status: { type: "string", enum: INVOICE_STATUSES },
};

export const invoiceUpdateSchema: Schema = Object.fromEntries(
  Object.entries(invoiceCreateSchema).map(([k, v]) => [k, { ...v, required: false }])
);

export const expenseCreateSchema: Schema = {
  category: { type: "string", required: true },
  date: { type: "iso-date", required: true },
  amount: { type: "number", required: true, min: 0 },
  paymentMode: { type: "string", required: true, enum: ["CASH", "BANK", "UPI", "CHEQUE"] as const },
  vendorName: { type: "string", required: true },
  description: { type: "string", required: true },
  status: { type: "string", required: true, enum: EXPENSE_STATUSES },
  paymentStatus: { type: "string", required: true, enum: ["PAID", "UNPAID"] as const },
};
