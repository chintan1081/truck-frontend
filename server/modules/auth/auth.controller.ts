import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service";
import { getDataSource } from "../../db/data-source";
import { UserEntity } from "../../db/entities";

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body || {});
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body || {});
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const db = await getDataSource();
  const user = await db.getRepository(UserEntity).findOne({ where: { id: req.user!.id } });
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      name: user?.name ?? null,
      profilePhoto: user?.profilePhoto ?? null,
    },
  });
}
