import express from "express";
import { prisma } from "./db.js";
import path from "path";
import { authRouter } from "./routes/auth.routes.js";
import { assetsRouter } from "./routes/assets.routes.js";
import { borrowRequestsRouter } from "./routes/borrowRequests.routes.js";
import { loansRouter } from "./routes/loans.routes.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();
app.use(express.json());
app.get("/api/health", (_req, res) => { res.json({ status: "ok" }); });
app.get("/api/ready", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ready" }); }
  catch { res.status(503).json({ status: "unavailable" }); }
});
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/auth", authRouter);
app.use("/assets", assetsRouter);
app.use("/borrow-requests", borrowRequestsRouter);
app.use("/loans", loansRouter);
app.use("/api/auth", authRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/borrow-requests", borrowRequestsRouter);
app.use("/api/loans", loansRouter);
app.use(errorHandler);

