import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export function checkout(req: Request, res: Response, next: NextFunction): void {
  try { if (req.principal) res.status(201).json(inventoryService.checkout(String(req.params.id), String(req.body.dueAt ?? req.body.dueDate ?? "2026-11-30T00:00:00.000Z"), req.principal)); } catch (error) { next(error); }
}
export function listActiveLoans(req: Request, res: Response, next: NextFunction): void { try { if (req.principal) res.status(200).json(inventoryService.listActiveLoans(req.principal)); } catch (error) { next(error); } }
export function returnLoan(req: Request, res: Response, next: NextFunction): void { try { res.status(200).json(inventoryService.returnLoan(String(req.params.id), req.body.returnCondition)); } catch (error) { next(error); } }
