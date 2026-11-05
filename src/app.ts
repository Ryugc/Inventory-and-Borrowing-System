import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { assetsRouter } from "./routes/assets.routes.js";
import { borrowRequestsRouter } from "./routes/borrowRequests.routes.js";
import { loansRouter } from "./routes/loans.routes.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();
app.use(express.json());

app.use("/auth", authRouter);
app.use("/assets", assetsRouter);
app.use("/borrow-requests", borrowRequestsRouter);
app.use("/loans", loansRouter);
app.use("/api/auth", authRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/borrow-requests", borrowRequestsRouter);
app.use("/api/loans", loansRouter);
app.use(errorHandler);
