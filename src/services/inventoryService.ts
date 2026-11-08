import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { Role } from "../types/index.js";
import type { AuthPrincipal } from "../types/index.js";

async function lockAsset(tx: Prisma.TransactionClient, assetId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Asset" WHERE id = ${assetId} FOR UPDATE`;
}

export const inventoryService = {
  async listAssets() {
    return prisma.asset.findMany({ orderBy: { assetTag: "asc" } });
  },

  async listPendingRequests() {
    return prisma.borrowRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { requestDate: "asc" },
      include: { asset: true, borrower: { select: { id: true, email: true } } }
    });
  },

  async createRequest(assetId: string, principal: AuthPrincipal) {
    return prisma.$transaction(async (tx) => {
      await lockAsset(tx, assetId);
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new HttpError(404, "Asset not found");
      if (asset.status !== "AVAILABLE") throw new HttpError(409, "Asset is unavailable");
      const pending = await tx.borrowRequest.count({ where: { assetId, status: "PENDING" } });
      if (pending > 0) throw new HttpError(409, "Duplicate pending request");
      return tx.borrowRequest.create({ data: { assetId, borrowerId: principal.id } });
    });
  },

  async checkout(requestId: string, dueAt: string, principal: AuthPrincipal) {
    return prisma.$transaction(async (tx) => {
      const found = await tx.borrowRequest.findUnique({ where: { id: requestId } });
      if (!found) throw new HttpError(404, "Borrow request not found");
      await lockAsset(tx, found.assetId);
      const request = await tx.borrowRequest.findUniqueOrThrow({ where: { id: requestId } });
      const asset = await tx.asset.findUniqueOrThrow({ where: { id: request.assetId } });
      if (request.status !== "PENDING" || asset.status !== "AVAILABLE") throw new HttpError(409, "Asset is unavailable");
      const dueDate = new Date(dueAt);
      if (Number.isNaN(dueDate.getTime())) throw new HttpError(400, "Invalid dueAt date");
      await tx.asset.update({ where: { id: asset.id }, data: { status: "CHECKED_OUT" } });
      await tx.borrowRequest.update({ where: { id: request.id }, data: { status: "APPROVED", resolvedDate: new Date() } });
      const loan = await tx.loanRecord.create({
        data: { assetId: asset.id, borrowerId: request.borrowerId, custodianId: principal.id, dueDate }
      });
      return { ...loan, requestId: request.id, assetStatus: "CHECKED_OUT" as const };
    });
  },

  async listMyRequests(principal: AuthPrincipal) {
    return prisma.borrowRequest.findMany({ where: { borrowerId: principal.id }, orderBy: { requestDate: "desc" } });
  },

  async listActiveLoans(principal: AuthPrincipal) {
    if (principal.role !== Role.CUSTODIAN) throw new HttpError(403, "Forbidden");
    return prisma.loanRecord.findMany({ where: { status: "ACTIVE" }, orderBy: { checkoutDate: "desc" } });
  },

  async returnLoan(id: string, returnCondition?: string) {
    return prisma.$transaction(async (tx) => {
      const found = await tx.loanRecord.findUnique({ where: { id } });
      if (!found) throw new HttpError(404, "Loan not found");
      await lockAsset(tx, found.assetId);
      const loan = await tx.loanRecord.findUniqueOrThrow({ where: { id } });
      if (loan.status === "RETURNED") throw new HttpError(409, "Loan already returned");
      const updated = await tx.loanRecord.update({
        where: { id },
        data: { status: "RETURNED", returnDate: new Date(), returnCondition: returnCondition ?? null }
      });
      await tx.asset.update({ where: { id: loan.assetId }, data: { status: "AVAILABLE" } });
      return { ...updated, assetStatus: "AVAILABLE" as const };
    });
  }
};
