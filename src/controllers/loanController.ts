import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    const dueAt = String(req.body?.dueAt ?? req.body?.dueDate ?? "2026-11-30T00:00:00.000Z");
    res.status(201).json(await inventoryService.checkout(String(req.params.id), dueAt, req.principal));
  } catch (error) { next(error); }
}

export async function listActiveLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.status(200).json(await inventoryService.listActiveLoans(req.principal));
  } catch (error) { next(error); }
}

export async function returnLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const condition = req.body?.returnCondition === undefined ? undefined : String(req.body.returnCondition);
    res.status(200).json(await inventoryService.returnLoan(String(req.params.id), condition));
  } catch (error) { next(error); }
}
