import { Request, Response } from "express";
import { generateChatReply } from "./chat.service";

export async function chat(req: Request, res: Response): Promise<void> {
  const text = await generateChatReply(req.body?.messages);
  res.json({ text });
}
