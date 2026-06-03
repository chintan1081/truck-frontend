import { Request, Response, NextFunction } from "express";
import { getDataSource } from "../db/data-source";
import { asyncHandler } from "../shared/async-handler";

/**
 * Attaches the shared application DataSource to the request. Must run after
 * `requireAuth` so that downstream handlers also have `req.user.id` available to
 * scope every query to the authenticated user.
 */
export const attachDb = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  req.db = await getDataSource();
  next();
});
