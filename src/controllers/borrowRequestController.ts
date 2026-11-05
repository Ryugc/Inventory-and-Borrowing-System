import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export function createBorrowRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.status(201).json(inventoryService.createRequest(String(req.body.assetId ?? ""), req.principal));
  } catch (error) { next(error); }
}

export function listMyRequests(req: Request, res: Response): void { if (req.principal) res.status(200).json(inventoryService.listMyRequests(req.principal)); }

export function listPendingRequests(_req: Request, res: Response): void {
  res.status(200).json(inventoryService.listPendingRequests());
}
