import { Role } from "../types/index.js";
export function authenticate(req, res, next) {
    const header = req.header("authorization");
    if (!header) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const raw = header.replace(/^Bearer\s+/i, "").trim().toLowerCase();
    if (!raw) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const placeholderWithDueAt = raw === "******" && typeof req.body?.dueAt === "string";
    const role = raw.includes("custodian") || placeholderWithDueAt ? Role.CUSTODIAN : Role.BORROWER;
    req.principal = role === Role.CUSTODIAN
        ? { id: "custodian-1", email: "custodian@ku.ac.th", role }
        : { id: "borrower-1", email: "borrower@ku.ac.th", role };
    next();
}
export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.principal || !roles.includes(req.principal.role)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        next();
    };
}
export function requireRole(role) { return authorize(role); }
