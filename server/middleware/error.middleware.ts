import { Request, Response, NextFunction } from "express";
import { QueryFailedError } from "typeorm";
import { HttpError } from "../shared/http-error";
import { logger } from "../config/logger";
import { config } from "../config/env";

/** 404 fallback for unmatched API routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "The requested resource was not found." });
}

function toFieldLabel(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function translateDbError(err: QueryFailedError): HttpError {
  const msg = err.message ?? "";
  const driver = (err as any).driverError ?? {};
  const pgCode: string | undefined = driver.code;

  // ── SQLite ────────────────────────────────────────────────────────────────
  if (msg.includes("NOT NULL constraint failed")) {
    const column = msg.split("NOT NULL constraint failed: ").pop()?.split(".").pop() ?? "";
    const label = column ? toFieldLabel(column) : "A required field";
    return new HttpError(400, `${label} is required and cannot be empty.`);
  }

  if (msg.includes("UNIQUE constraint failed")) {
    const column = msg.split("UNIQUE constraint failed: ").pop()?.split(".").pop() ?? "";
    const label = column ? toFieldLabel(column) : "This value";
    return new HttpError(409, `${label} already exists. Please use a different value.`);
  }

  if (msg.includes("FOREIGN KEY constraint failed")) {
    return new HttpError(400, "This record links to another item that no longer exists.");
  }

  // ── PostgreSQL ────────────────────────────────────────────────────────────
  if (pgCode === "23502") {
    const label = driver.column ? toFieldLabel(driver.column) : "A required field";
    return new HttpError(400, `${label} is required and cannot be empty.`);
  }

  if (pgCode === "23505") {
    const match = (driver.detail ?? "").match(/\(([^)]+)\)=/);
    const label = match ? toFieldLabel(match[1]) : "This value";
    return new HttpError(409, `${label} already exists. Please use a different value.`);
  }

  if (pgCode === "23503") {
    return new HttpError(400, "This record links to another item that no longer exists.");
  }

  if (pgCode === "23514") {
    return new HttpError(400, "The value provided does not meet the allowed range or format.");
  }

  return new HttpError(500, "A database error occurred. Please try again.");
}

/**
 * Central error handler. Translates HttpError and TypeORM QueryFailedError
 * into friendly status codes and messages; everything else becomes a 500.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) {
      logger.error("Request failed", { method: req.method, url: req.originalUrl, message: err.message });
    }
    res.status(err.statusCode).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }

  if (err instanceof QueryFailedError) {
    logger.error("DB constraint error", { method: req.method, url: req.originalUrl, message: err.message });
    const httpErr = translateDbError(err);
    res.status(httpErr.statusCode).json({ error: httpErr.message });
    return;
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  logger.error("Unhandled error", {
    method: req.method,
    url: req.originalUrl,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    error: config.isProduction ? "Something went wrong on our end. Please try again shortly." : message,
  });
}
