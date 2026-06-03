import { Request, Response, NextFunction } from "express";
import { badRequest } from "../shared/http-error";

type FieldType = "string" | "number" | "boolean" | "string[]" | "any" | "iso-date" | "id";

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  enum?: readonly string[];
  min?: number;
  max?: number;
}

export type Schema = Record<string, FieldRule>;

function checkValue(value: any, rule: FieldRule): string | null {
  if (value === undefined || value === null) {
    return rule.required ? "is required" : null;
  }
  switch (rule.type) {
    case "string":
    case "id":
      if (typeof value !== "string") return "must be a string";
      if (rule.min !== undefined && value.length < rule.min) return `min length ${rule.min}`;
      if (rule.max !== undefined && value.length > rule.max) return `max length ${rule.max}`;
      if (rule.enum && !rule.enum.includes(value)) return `must be one of ${rule.enum.join("|")}`;
      return null;
    case "iso-date":
      if (typeof value !== "string" || isNaN(Date.parse(value))) return "must be an ISO date string";
      return null;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return "must be a finite number";
      if (rule.min !== undefined && value < rule.min) return `must be >= ${rule.min}`;
      if (rule.max !== undefined && value > rule.max) return `must be <= ${rule.max}`;
      return null;
    case "boolean":
      if (typeof value !== "boolean") return "must be a boolean";
      return null;
    case "string[]":
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) return "must be string[]";
      return null;
    case "any":
      return null;
  }
}

/**
 * Builds a body-validation middleware from a declarative schema. On failure it
 * forwards a 400 HttpError (with per-field details) to the central handler.
 */
export function validate(schema: Schema, opts: { allowExtra?: boolean } = { allowExtra: true }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const body = req.body || {};
    const errors: Record<string, string> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const err = checkValue(body[field], rule);
      if (err) errors[field] = err;
    }
    if (!opts.allowExtra) {
      for (const key of Object.keys(body)) {
        if (!(key in schema)) errors[key] = "unknown field";
      }
    }

    if (Object.keys(errors).length) {
      return next(badRequest("Validation failed", errors));
    }
    next();
  };
}
