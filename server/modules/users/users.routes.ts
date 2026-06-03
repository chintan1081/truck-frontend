import { Router, Request, Response } from "express";
import multer from "multer";
import { asyncHandler } from "../../shared/async-handler";
import { getDataSource } from "../../db/data-source";
import { UserEntity } from "../../db/entities";
import { badRequest } from "../../shared/http-error";

export const usersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

usersRouter.put(
  "/profile-photo",
  upload.single("photo"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw badRequest("No image file provided");

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const db = await getDataSource();
    await db.getRepository(UserEntity).update(req.user!.id, { profilePhoto: base64 });

    res.json({ profilePhoto: base64 });
  })
);
