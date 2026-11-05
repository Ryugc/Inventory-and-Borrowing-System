import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { listActiveLoans, returnLoan } from "../controllers/loanController.js";
import { Role } from "../types/index.js";
export const loansRouter = Router();
loansRouter.get("/", authenticate, authorize(Role.CUSTODIAN), listActiveLoans);
loansRouter.get("/active", authenticate, authorize(Role.CUSTODIAN), listActiveLoans);
loansRouter.post("/:id/return", authenticate, authorize(Role.CUSTODIAN), returnLoan);
