import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import * as controller from "./plant-pool.controller";

export const plantPoolRouter = Router({ mergeParams: true });

plantPoolRouter.get("/", asyncHandler(controller.listPoolEntries));
plantPoolRouter.post("/", asyncHandler(controller.createPoolEntry));
