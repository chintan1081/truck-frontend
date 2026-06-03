import { Request, Response } from "express";
import type { DataSource } from "typeorm";
import { In } from "typeorm";
import { InvoiceEntity, OrderEntity } from "../../db/entities";
import { parsePageParams } from "../../shared/pagination";
import { badRequest, notFound } from "../../shared/http-error";
import { computeInvoiceTotals, summarisePaidAmount, deriveInvoiceStatus } from "./invoice-compute";

/** Loads the user's referenced orders, computes server-authoritative totals + status. */
async function buildInvoiceWithComputedTotals(db: DataSource, userId: string, payload: any) {
  const orderRepo = db.getRepository(OrderEntity);
  const orderIds: string[] = Array.isArray(payload.orderIds) ? payload.orderIds : [];
  const orders = orderIds.length ? await orderRepo.find({ where: { id: In(orderIds), userId } }) : [];

  if (orders.length !== orderIds.length) {
    throw badRequest("One or more orderIds not found");
  }

  const totals = computeInvoiceTotals({
    orders,
    gstRate: payload.gstRate,
    gstType: payload.gstType,
    tdsAmount: payload.tdsAmount || 0,
    discountAmount: payload.discountAmount || 0,
    tcsRate: payload.tcsRate || 0,
    roundOff: payload.roundOff || 0,
  });

  const paidAmount = summarisePaidAmount(payload.payments || []);
  const status = deriveInvoiceStatus(totals, paidAmount, payload.dueDate, payload.status);

  return { totals, paidAmount, status, orders };
}

export async function listInvoices(req: Request, res: Response): Promise<void> {
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const [data, total] = await req.db!.getRepository(InvoiceEntity).findAndCount({
    where: { userId: req.user!.id },
    take: limit,
    skip: offset,
  });
  res.json({ data, total, limit, offset });
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const invRepo = req.db!.getRepository(InvoiceEntity);
  const payload = { ...req.body } as any;
  delete payload.id;
  delete payload.user;
  payload.userId = userId;

  const { totals, paidAmount, status } = await buildInvoiceWithComputedTotals(req.db!, userId, payload);
  Object.assign(payload, totals, { paidAmount, status });

  res.status(201).json(await invRepo.save(payload));
}

export async function updateInvoice(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const invRepo = req.db!.getRepository(InvoiceEntity);
  const existing = await invRepo.findOne({ where: { id: String(req.params.id), userId } });
  if (!existing) throw notFound("Invoice not found");

  const body = { ...req.body };
  delete body.id;
  delete body.userId;
  delete body.user;

  const merged: any = invRepo.merge(existing, body);
  const { totals, paidAmount, status } = await buildInvoiceWithComputedTotals(req.db!, userId, merged);
  Object.assign(merged, totals, { paidAmount, status });

  res.json(await invRepo.save(merged));
}

export async function deleteInvoice(req: Request, res: Response): Promise<void> {
  const invRepo = req.db!.getRepository(InvoiceEntity);
  const existing = await invRepo.findOne({ where: { id: String(req.params.id), userId: req.user!.id } });
  if (!existing) throw notFound("Invoice not found");
  await invRepo.remove(existing);
  res.json({ success: true });
}
