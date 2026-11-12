import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export async function createBorrowRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.status(201).json(await inventoryService.createRequest(String(req.body?.assetId ?? ""), req.principal));
  } catch (error) { next(error); }
}

export async function listMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.status(200).json(await inventoryService.listMyRequests(req.principal));
  } catch (error) { next(error); }
}

export async function listPendingRequests(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await inventoryService.listPendingRequests()); } catch (error) { next(error); }
}
