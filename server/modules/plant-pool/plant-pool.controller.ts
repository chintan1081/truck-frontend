import { Request, Response } from "express";
import {
  PlantAdvancePoolEntryEntity, PaymentRecordEntity, ExpenseEntity, BankEntity, SiteEntity,
} from "../../db/entities";

export async function listPoolEntries(req: Request, res: Response): Promise<void> {
  res.json(await req.db!.getRepository(PlantAdvancePoolEntryEntity).find({ where: { userId: req.user!.id } }));
}

/**
 * Creating a pool entry has accounting side-effects: it always posts a payment
 * record, and for PAID entries it also posts an auto-generated expense. All three
 * rows are owned by the same user and linked via the generated pool id.
 */
export async function createPoolEntry(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const poolRepo = req.db!.getRepository(PlantAdvancePoolEntryEntity);
  const payRepo = req.db!.getRepository(PaymentRecordEntity);
  const expRepo = req.db!.getRepository(ExpenseEntity);
  const bRepo = req.db!.getRepository(BankEntity);
  const sRepo = req.db!.getRepository(SiteEntity);

  const entry = { ...req.body } as any;
  delete entry.id;
  delete entry.user;
  entry.userId = userId;
  const savedPool = await poolRepo.save(entry);

  const bank = entry.bankId ? await bRepo.findOne({ where: { id: entry.bankId, userId } }) : null;
  const station = entry.stationId ? await sRepo.findOne({ where: { id: entry.stationId, userId } }) : null;
  const stationName = station?.name || "Power Station";

  await payRepo.save({
    userId,
    type: entry.transactionType === "PAID" ? "PAY" : "RECEIVE",
    partyName: stationName,
    method: entry.paymentMethod,
    amount: entry.amount,
    date: entry.date,
    bankId: entry.bankId,
    bankName: bank?.bankName || "Self",
    transactionId: entry.referenceNo,
    description: `[POOL: ${savedPool.id}] Lifetime Advance ${entry.transactionType === "PAID" ? "Paid" : "Received"} for ${stationName}.`,
    poolId: savedPool.id,
  });

  if (entry.transactionType === "PAID") {
    await expRepo.save({
      userId,
      category: "PLANT_ADVANCE",
      date: entry.date,
      amount: entry.amount,
      paymentMode: entry.paymentMethod === "CASH" ? "CASH" : entry.paymentMethod === "UPI" ? "UPI" : "BANK",
      referenceNo: entry.referenceNo,
      vendorName: stationName,
      description: `[POOL: ${savedPool.id}] Lifetime Advance Deposit to TPS: ${stationName}.`,
      status: "APPROVED",
      paymentStatus: "PAID",
      paidDate: entry.date,
      responsibleStaff: entry.employeeName || "System Admin",
      isAuto: true,
      poolId: savedPool.id,
      history: [{
        action: "PLANT_ADV_POOL_ADD",
        user: "System Admin",
        timestamp: new Date().toISOString().split("T")[0],
        note: `Auto-posted from Plant Hub [${savedPool.id}]`,
      }],
    });
  }

  res.status(201).json(savedPool);
}
