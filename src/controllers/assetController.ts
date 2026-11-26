import type { NextFunction, Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";

export async function listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await inventoryService.listAssets({
      q: req.query.q,
      category: req.query.category,
      status: req.query.status
    }));
  } catch (error) { next(error); }
}

export async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await inventoryService.createAsset({
      assetTag: req.body?.assetTag,
      name: req.body?.name,
      category: req.body?.category
    }));
  } catch (error) { next(error); }
}

export async function updateAssetStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await inventoryService.updateAssetStatus(
      String(req.params.id),
      req.body?.status
    ));
  } catch (error) { next(error); }
}
