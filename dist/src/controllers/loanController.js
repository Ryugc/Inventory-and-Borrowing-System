import { inventoryService } from "../services/inventoryService.js";
export function checkout(req, res, next) {
    try {
        if (req.principal)
            res.status(201).json(inventoryService.checkout(String(req.params.id), String(req.body.dueAt ?? req.body.dueDate ?? "2026-11-30T00:00:00.000Z"), req.principal));
    }
    catch (error) {
        next(error);
    }
}
export function listActiveLoans(req, res, next) { try {
    if (req.principal)
        res.status(200).json(inventoryService.listActiveLoans(req.principal));
}
catch (error) {
    next(error);
} }
export function returnLoan(req, res, next) { try {
    res.status(200).json(inventoryService.returnLoan(String(req.params.id), req.body.returnCondition));
}
catch (error) {
    next(error);
} }
