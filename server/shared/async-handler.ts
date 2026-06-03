import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so any rejected promise is forwarded to Express's
 * error pipeline instead of crashing the process or hanging the request. This
 * removes the need for a try/catch in every controller.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
