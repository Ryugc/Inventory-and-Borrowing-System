import { Router } from "express";
import { createAsset, listAssets, updateAssetStatus } from "../controllers/assetController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { Role } from "../types/index.js";
export const assetsRouter = Router();
assetsRouter.get("/", authenticate, listAssets);
assetsRouter.post("/", authenticate, authorize(Role.CUSTODIAN), createAsset);
assetsRouter.patch("/:id/status", authenticate, authorize(Role.CUSTODIAN), updateAssetStatus);
