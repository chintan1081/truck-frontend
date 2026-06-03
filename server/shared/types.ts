import type { DataSource } from "typeorm";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Augment Express's Request so `req.user`, `req.userEmail` and `req.db` are
 * strongly typed wherever they are populated by middleware. This avoids the
 * `req: any` casts that were scattered across the old route handlers.
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    userEmail?: string;
    db?: DataSource;
  }
}
