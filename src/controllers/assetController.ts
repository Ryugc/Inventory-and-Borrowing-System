import type { Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";
export function listAssets(_req: Request, res: Response): void { res.status(200).json(inventoryService.listAssets()); }
