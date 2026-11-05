import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/authService.js";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await authService.login(req.body)); } catch (error) { next(error); }
}
