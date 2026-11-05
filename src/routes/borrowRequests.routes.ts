import { Router } from "express";
import { createBorrowRequest, listMyRequests } from "../controllers/borrowRequestController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { checkout } from "../controllers/loanController.js";
import { Role } from "../types/index.js";
export const borrowRequestsRouter = Router();
borrowRequestsRouter.post("/", authenticate, authorize(Role.BORROWER), createBorrowRequest);
borrowRequestsRouter.get("/my", authenticate, authorize(Role.BORROWER), listMyRequests);
borrowRequestsRouter.post("/:id/checkout", authenticate, authorize(Role.CUSTODIAN), checkout);
