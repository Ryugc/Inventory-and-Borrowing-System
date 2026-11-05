import { Router } from "express";
import { listAssets } from "../controllers/assetController.js";
import { authenticate } from "../middleware/auth.js";
export const assetsRouter = Router();
assetsRouter.get("/", authenticate, listAssets);
