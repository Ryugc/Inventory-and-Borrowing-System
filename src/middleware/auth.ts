import type { NextFunction, Request, Response } from "express";
import type { AuthPrincipal } from "../types/index.js";
import { Role } from "../types/index.js";
import { authService } from "../services/authService.js";

declare global { namespace Express { interface Request { principal?: AuthPrincipal } } }

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!raw) { res.status(401).json({ error: "Unauthorized" }); return; }
    const principal = await authService.authenticate(raw);
    if (!principal) { res.status(401).json({ error: "Unauthorized" }); return; }
    req.principal = principal;
    next();
  } catch (error) { next(error); }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.principal || !roles.includes(req.principal.role)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    next();
  };
}

export function requireRole(role: Role) { return authorize(role); }
