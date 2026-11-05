import { inventoryService } from "../services/inventoryService.js";
export function listAssets(_req, res) { res.status(200).json(inventoryService.listAssets()); }
