import { inventoryService } from "../services/inventoryService.js";
export function createBorrowRequest(req, res, next) {
    try {
        if (!req.principal) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        res.status(201).json(inventoryService.createRequest(String(req.body.assetId ?? ""), req.principal));
    }
    catch (error) {
        next(error);
    }
}
export function listMyRequests(req, res) { if (req.principal)
    res.status(200).json(inventoryService.listMyRequests(req.principal)); }
export function listPendingRequests(_req, res) {
    res.status(200).json(inventoryService.listPendingRequests());
}
