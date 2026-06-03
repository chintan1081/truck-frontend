import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import * as controller from "./data.controller";

/** Aggregate bootstrap data + global settings. Tenant DB is attached upstream. */
export const dataRouter = Router();

dataRouter.get("/all-data", asyncHandler(controller.getAllData));
dataRouter.put("/settings", asyncHandler(controller.updateSettings));
