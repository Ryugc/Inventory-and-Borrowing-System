import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { AssetStatus, Role } from "../types/index.js";
import type { AuthPrincipal } from "../types/index.js";

async function lockAsset(tx: Prisma.TransactionClient, assetId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Asset" WHERE id = ${assetId} FOR UPDATE`;
}

type LoanStatusRecord = {
  id: string;
  dueDate: Date;
  returnDate: Date | null;
  status: string;
};

function isAssetStatus(value: unknown): value is AssetStatus {
  return value === AssetStatus.AVAILABLE ||
    value === AssetStatus.CHECKED_OUT ||
    value === AssetStatus.MAINTENANCE;
}

async function addOverdueStatus<T extends LoanStatusRecord>(loans: T[]) {
  const now = new Date();
  const overdueLoans = loans.filter(
    loan => loan.status !== "RETURNED" && loan.returnDate === null && now > loan.dueDate
  );

  await Promise.all(overdueLoans
    .filter(loan => loan.status !== "OVERDUE")
    .map(loan => prisma.loanRecord.update({
      where: { id: loan.id },
      data: { status: "OVERDUE" }
    })));

  return loans.map(loan => {
    const isOverdue = loan.status !== "RETURNED" && loan.returnDate === null && now > loan.dueDate;
    return { ...loan, status: isOverdue ? "OVERDUE" : loan.status, isOverdue };
  });
}

export const inventoryService = {
  async listAssets(filters: { q?: unknown; category?: unknown; status?: unknown } = {}) {
    const where: Prisma.AssetWhereInput = {};
    const query = typeof filters.q === "string" ? filters.q.trim() : "";
    const category = typeof filters.category === "string" ? filters.category.trim() : "";

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { assetTag: { contains: query, mode: "insensitive" } }
      ];
    }
    if (category) where.category = { equals: category, mode: "insensitive" };
    if (filters.status !== undefined) {
      if (!isAssetStatus(filters.status)) throw new HttpError(400, "Invalid asset status filter");
      where.status = filters.status;
    }

    return prisma.asset.findMany({ where, orderBy: { assetTag: "asc" } });
  },

  async createAsset(input: { assetTag: unknown; name: unknown; category: unknown }) {
    const assetTag = typeof input.assetTag === "string" ? input.assetTag.trim() : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const category = typeof input.category === "string" ? input.category.trim() : "";
    if (!assetTag || !name || !category) {
      throw new HttpError(400, "Asset tag, name, and category are required");
    }

    try {
      return await prisma.asset.create({
        data: { assetTag, name, category, status: "AVAILABLE" }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "Asset tag already exists");
      }
      throw error;
    }
  },

  async updateAssetStatus(id: string, status: unknown) {
    if (status !== "AVAILABLE" && status !== "MAINTENANCE") {
      throw new HttpError(400, "Invalid asset status");
    }

    return prisma.$transaction(async tx => {
      await lockAsset(tx, id);
      const asset = await tx.asset.findUnique({ where: { id } });
      if (!asset) throw new HttpError(404, "Asset not found");
      if (asset.status === "CHECKED_OUT") {
        throw new HttpError(409, "Checked-out assets cannot be manually updated");
      }
      return tx.asset.update({ where: { id }, data: { status } });
    });
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

  async checkout(requestId: string, dueAt: string | undefined, principal: AuthPrincipal) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const MIN_LOAN_MS = 1 * DAY_MS;
    const MAX_LOAN_MS = 14 * DAY_MS;
    const checkoutDate = new Date();
    const dueDate = dueAt === undefined
      ? new Date(checkoutDate.getTime() + MAX_LOAN_MS)
      : new Date(dueAt);

    if (Number.isNaN(dueDate.getTime())) {
      throw new HttpError(400, "Invalid dueAt date");
    }

    const durationMs = dueDate.getTime() - checkoutDate.getTime();
    if (durationMs < MIN_LOAN_MS || durationMs > MAX_LOAN_MS) {
      throw new HttpError(400, "Due date must be between 1 and 14 days after checkout");
    }

    return prisma.$transaction(async (tx) => {
      const found = await tx.borrowRequest.findUnique({ where: { id: requestId } });
      if (!found) throw new HttpError(404, "Borrow request not found");
      await lockAsset(tx, found.assetId);
      const request = await tx.borrowRequest.findUniqueOrThrow({ where: { id: requestId } });
      const asset = await tx.asset.findUniqueOrThrow({ where: { id: request.assetId } });
      if (request.status !== "PENDING" || asset.status !== "AVAILABLE") throw new HttpError(409, "Asset is unavailable");
      await tx.asset.update({ where: { id: asset.id }, data: { status: "CHECKED_OUT" } });
      await tx.borrowRequest.update({ where: { id: request.id }, data: { status: "APPROVED", resolvedDate: new Date() } });
      const loan = await tx.loanRecord.create({
        data: {
          assetId: asset.id,
          borrowerId: request.borrowerId,
          custodianId: principal.id,
          checkoutDate,
          dueDate
        }
      });
      return { ...loan, requestId: request.id, assetStatus: "CHECKED_OUT" as const };
    });
  },

  async listMyRequests(principal: AuthPrincipal) {
    const requests = await prisma.borrowRequest.findMany({
      where: { borrowerId: principal.id },
      orderBy: { requestDate: "desc" },
      include: { asset: { select: { name: true, assetTag: true } } }
    });
    const approvedRequests = requests.filter(request => request.status === "APPROVED");
    if (approvedRequests.length === 0) return requests;

    const loans = await prisma.loanRecord.findMany({
      where: {
        borrowerId: principal.id,
        assetId: { in: [...new Set(approvedRequests.map(request => request.assetId))] }
      },
      orderBy: { checkoutDate: "desc" }
    });
    const loansWithOverdueStatus = await addOverdueStatus(loans);
    const matchedLoanIds = new Set<string>();

    return requests.map(request => {
      if (request.status !== "APPROVED") return request;
      const loan = loansWithOverdueStatus.find(candidate =>
        !matchedLoanIds.has(candidate.id) &&
        candidate.assetId === request.assetId &&
        candidate.checkoutDate >= request.requestDate
      );
      if (!loan) return request;
      matchedLoanIds.add(loan.id);
      return {
        ...request,
        status: loan.status === "OVERDUE" || loan.status === "RETURNED" ? loan.status : request.status,
        isOverdue: loan.isOverdue,
        loanId: loan.id,
        dueDate: loan.dueDate,
        returnDate: loan.returnDate
      };
    });
  },

  async listActiveLoans(principal: AuthPrincipal) {
    if (principal.role !== Role.CUSTODIAN) throw new HttpError(403, "Forbidden");
    const loans = await prisma.loanRecord.findMany({
      where: { status: { in: ["ACTIVE", "OVERDUE"] }, returnDate: null },
      orderBy: { checkoutDate: "desc" },
      include: { asset: { select: { name: true, assetTag: true } } }
    });
    return addOverdueStatus(loans);
  },

  async returnLoan(id: string, returnCondition?: string) {
    if (returnCondition !== undefined && returnCondition.length > 500) {
      throw new HttpError(400, "Return condition must be 500 characters or fewer");
    }
    const condition = returnCondition?.trim() || "Good";

    return prisma.$transaction(async (tx) => {
      const found = await tx.loanRecord.findUnique({ where: { id } });
      if (!found) throw new HttpError(404, "Loan not found");
      await lockAsset(tx, found.assetId);
      const loan = await tx.loanRecord.findUniqueOrThrow({ where: { id } });
      if (loan.status === "RETURNED") throw new HttpError(409, "Loan already returned");
      const asset = await tx.asset.findUniqueOrThrow({ where: { id: loan.assetId } });
      if (asset.status !== "CHECKED_OUT") throw new HttpError(409, "Asset is not checked out");
      const returnDate = new Date();
      const updated = await tx.loanRecord.update({
        where: { id },
        data: { status: "RETURNED", returnDate, returnCondition: condition }
      });
      await tx.asset.update({ where: { id: asset.id }, data: { status: "AVAILABLE" } });
      return { ...updated, assetStatus: "AVAILABLE" as const };
    });
  }
};
