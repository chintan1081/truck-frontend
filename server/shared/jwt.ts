import crypto from "crypto";
import { config } from "../config/env";

/**
 * Minimal dependency-free HS256 JWT implementation. Kept deliberately small —
 * swap for `jsonwebtoken` here if richer claim handling is ever needed.
 */

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export function signJwt(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + config.auth.tokenTtlSeconds, ...payload };
  const head = b64url(JSON.stringify(header));
  const pay = b64url(JSON.stringify(body));
  const sig = b64url(crypto.createHmac("sha256", config.auth.jwtSecret).update(`${head}.${pay}`).digest());
  return `${head}.${pay}.${sig}`;
}

export function verifyJwt(token: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, pay, sig] = parts;
  const expected = b64url(crypto.createHmac("sha256", config.auth.jwtSecret).update(`${head}.${pay}`).digest());

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const body = JSON.parse(b64urlDecode(pay).toString("utf8"));
    if (typeof body.exp === "number" && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}
