import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { rateLimit } from "../../middleware/rate-limit.middleware";
import { config } from "../../config/env";
import * as controller from "./auth.controller";

/**
 * Public authentication endpoints. Login/register are rate-limited to slow
 * credential-stuffing; `/me` is the only authenticated route here.
 */
export const authRouter = Router();

const authLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max });

authRouter.post("/register", authLimiter, asyncHandler(controller.register));
authRouter.post("/login", authLimiter, asyncHandler(controller.login));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
