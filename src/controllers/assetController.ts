import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export async function listAssets(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await inventoryService.listAssets()); } catch (error) { next(error); }
}
