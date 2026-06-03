import { getDataSource } from "../../db/data-source";
import { UserEntity } from "../../db/entities";
import { hashPassword, verifyPassword } from "../../shared/password";
import { signJwt } from "../../shared/jwt";
import { badRequest, conflict, unauthorized } from "../../shared/http-error";

export interface AuthResult {
  token: string;
  user: { id: string; email: string; role: string; name: string | null };
}

const VALID_ROLES = ["ADMIN", "DRIVER", "ACCOUNTANT"];

function normaliseRole(role: unknown): string {
  return role === "DRIVER" || role === "ACCOUNTANT" ? (role as string) : "ADMIN";
}

export async function registerUser(input: {
  email?: unknown;
  password?: unknown;
  name?: unknown;
  role?: unknown;
}): Promise<AuthResult> {
  const { email, password, name, role } = input;
  if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
    throw badRequest("email and password (min 8 chars) required");
  }

  const db = await getDataSource();
  const repo = db.getRepository(UserEntity);
  const normalisedEmail = email.toLowerCase();

  const existing = await repo.findOne({ where: { email: normalisedEmail } });
  if (existing) throw conflict("Email already registered");

  const { hash, salt } = hashPassword(password);
  // `id` is a DB-generated uuid — never set it here.
  const user = await repo.save({
    email: normalisedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    name: typeof name === "string" ? name : undefined,
    role: normaliseRole(role),
    createdAt: new Date().toISOString(),
  });

  return buildAuthResult(user);
}

export async function loginUser(input: { email?: unknown; password?: unknown }): Promise<AuthResult> {
  const { email, password } = input;
  if (typeof email !== "string" || typeof password !== "string") {
    throw badRequest("email and password required");
  }

  const db = await getDataSource();
  const repo = db.getRepository(UserEntity);
  const user = await repo.findOne({ where: { email: email.toLowerCase() } });

  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    throw unauthorized("Invalid credentials");
  }

  return buildAuthResult(user);
}

function buildAuthResult(user: UserEntity): AuthResult {
  const token = signJwt({ sub: user.id, email: user.email, role: user.role });
  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name ?? null },
  };
}

export { VALID_ROLES };
