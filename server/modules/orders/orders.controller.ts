import { Request, Response } from "express";
import { OrderEntity, TruckEntity, DriverEntity } from "../../db/entities";
import { parsePageParams } from "../../shared/pagination";
import { badRequest, conflict, notFound } from "../../shared/http-error";
import { assertTransition, TripStatus } from "../../shared/order-status";

export async function listOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { limit, offset } = parsePageParams(req.query as Record<string, unknown>);
  const [data, total] = await req.db!.getRepository(OrderEntity).findAndCount({
    where: { userId },
    take: limit,
    skip: offset,
  });
  res.json({ data, total, limit, offset });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const oRepo = req.db!.getRepository(OrderEntity);
  const tRepo = req.db!.getRepository(TruckEntity);
  const dRepo = req.db!.getRepository(DriverEntity);

  const oData = { ...req.body } as any;
  delete oData.id;
  delete oData.user;
  oData.userId = userId;

  // On create, only CREATED or ASSIGNED-with-truck are allowed.
  if (oData.status !== "CREATED" && oData.status !== "ASSIGNED") {
    throw badRequest("New orders must start in CREATED or ASSIGNED status");
  }
  if (oData.status === "ASSIGNED" && !oData.assignedTruckId) {
    throw badRequest("ASSIGNED orders require assignedTruckId");
  }

  if (oData.assignedTruckId) {
    const truck = await tRepo.findOne({ where: { id: oData.assignedTruckId, userId } });
    if (!truck) throw badRequest("assignedTruckId does not match any truck");
    if (truck.status === "ON_TRIP") throw conflict("Truck already on a trip");

    oData.driverName = truck.driverName;
    oData.assignedTruckNumber = truck.truckNumber;
    const driver = await dRepo.findOne({ where: { name: truck.driverName, userId } });
    if (driver) oData.driverPhone = driver.phoneNumber;

    truck.status = "ON_TRIP";
    await tRepo.save(truck);
    if (oData.status === "CREATED") oData.status = "ASSIGNED";
  }

  res.status(201).json(await oRepo.save(oData));
}

export async function updateOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const oRepo = req.db!.getRepository(OrderEntity);
  const tRepo = req.db!.getRepository(TruckEntity);
  const dRepo = req.db!.getRepository(DriverEntity);

  const id = String(req.params.id);
  const oData = { ...req.body } as any;
  delete oData.id;
  delete oData.userId;
  delete oData.user;

  const originalOrder = await oRepo.findOne({ where: { id, userId } });
  if (!originalOrder) throw notFound("Order not found");

  if (oData.status && oData.status !== originalOrder.status) {
    assertTransition(originalOrder.status as TripStatus, oData.status as TripStatus);
  }

  // Releasing a previously assigned truck.
  if (originalOrder.assignedTruckId && originalOrder.assignedTruckId !== oData.assignedTruckId) {
    const oldTruck = await tRepo.findOne({ where: { id: originalOrder.assignedTruckId, userId } });
    if (oldTruck) {
      oldTruck.status = "AVAILABLE";
      await tRepo.save(oldTruck);
    }
  }

  // Attaching a new truck.
  if (oData.assignedTruckId && oData.assignedTruckId !== originalOrder.assignedTruckId) {
    const truck = await tRepo.findOne({ where: { id: oData.assignedTruckId, userId } });
    if (!truck) throw badRequest("assignedTruckId does not match any truck");
    if (truck.status === "ON_TRIP") throw conflict("Truck already on a trip");

    oData.driverName = truck.driverName;
    oData.assignedTruckNumber = truck.truckNumber;
    const driver = await dRepo.findOne({ where: { name: truck.driverName, userId } });
    if (driver) oData.driverPhone = driver.phoneNumber;

    truck.status = "ON_TRIP";
    await tRepo.save(truck);
  }

  oRepo.merge(originalOrder, oData);
  res.json(await oRepo.save(originalOrder));
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const oRepo = req.db!.getRepository(OrderEntity);
  const tRepo = req.db!.getRepository(TruckEntity);

  const order = await oRepo.findOne({ where: { id: String(req.params.id), userId } });
  if (!order) throw notFound("Order not found");

  if (order.assignedTruckId) {
    const truck = await tRepo.findOne({ where: { id: order.assignedTruckId, userId } });
    if (truck) {
      truck.status = "AVAILABLE";
      await tRepo.save(truck);
    }
  }

  await oRepo.remove(order);
  res.json({ success: true });
}
