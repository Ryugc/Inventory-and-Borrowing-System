import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../middleware/error.js";
import { inventoryService } from "../services/inventoryService.js";

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    const rawDueDate: unknown = req.body?.dueAt !== undefined ? req.body.dueAt : req.body?.dueDate;
    if (rawDueDate !== undefined && typeof rawDueDate !== "string") {
      throw new HttpError(400, "Invalid due date");
    }
    const dueAt = typeof rawDueDate === "string" ? rawDueDate : undefined;
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
    const rawCondition: unknown = req.body?.returnCondition;
    if (rawCondition !== undefined && typeof rawCondition !== "string") {
      throw new HttpError(400, "Invalid return condition");
    }
    const condition = typeof rawCondition === "string" ? rawCondition : undefined;
    res.status(200).json(await inventoryService.returnLoan(String(req.params.id), condition));
  } catch (error) { next(error); }
}
