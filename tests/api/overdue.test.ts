import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, createPending, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

async function createLoan(
  assetId: string,
  options: { status?: "ACTIVE" | "RETURNED" | "OVERDUE"; dueDate?: Date; returnDate?: Date | null } = {}
) {
  return prisma.loanRecord.create({
    data: {
      assetId,
      borrowerId: seeded.borrower.id,
      custodianId: seeded.custodian.id,
      dueDate: options.dueDate ?? new Date("2026-11-24T00:00:00.000Z"),
      status: options.status ?? "ACTIVE",
      returnDate: options.returnDate ?? null
    }
  });
}

async function createApprovedRequest(assetId: string) {
  return prisma.borrowRequest.create({
    data: {
      assetId,
      borrowerId: seeded.borrower.id,
      status: "APPROVED",
      resolvedDate: new Date()
    }
  });
}

describe("C-07 due date and overdue detection", () => {
  test("STS-OVERDUE-001: Checkout without a due date defaults to 14 days after checkout", async () => {
    const pending = await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);

    const response = await request(app)
      .post(`/api/borrow-requests/${pending.id}/checkout`)
      .set("Authorization", bearer(token))
      .send({});

    expect(response.status).toBe(201);
    const checkoutDate = new Date(response.body.checkoutDate);
    const dueDate = new Date(response.body.dueDate);
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    expect(Math.abs(dueDate.getTime() - checkoutDate.getTime() - fourteenDaysMs)).toBeLessThan(1500);

    const savedLoan = await prisma.loanRecord.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(Math.abs(savedLoan.dueDate.getTime() - savedLoan.checkoutDate.getTime() - fourteenDaysMs)).toBeLessThan(1500);
  });

  test("STS-OVERDUE-002: Checkout rejects malformed and past due dates", async () => {
    const malformedPending = await createPending(seeded.available.id, seeded.borrower.id);
    const pastPending = await createPending(seeded.exclusive.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);

    const malformedResponse = await request(app)
      .post(`/api/borrow-requests/${malformedPending.id}/checkout`)
      .set("Authorization", bearer(token))
      .send({ dueAt: "not-a-date" });
    const pastResponse = await request(app)
      .post(`/api/borrow-requests/${pastPending.id}/checkout`)
      .set("Authorization", bearer(token))
      .send({ dueDate: "2000-01-01T00:00:00.000Z" });

    expect(malformedResponse.status).toBe(400);
    expect(pastResponse.status).toBe(400);
  });

  test("STS-OVERDUE-003: Past-due unreturned loans are flagged in custodian and borrower queries", async () => {
    const approvedRequest = await createApprovedRequest(seeded.checkedOut.id);
    const loan = await createLoan(seeded.checkedOut.id, { dueDate: new Date("2000-01-01T00:00:00.000Z") });
    const custodianToken = await login("custodian@ku.ac.th", passwords.custodian);
    const borrowerToken = await login("borrower@ku.ac.th", passwords.borrower);

    const activeLoans = await request(app)
      .get("/api/loans/active")
      .set("Authorization", bearer(custodianToken));
    const myRequests = await request(app)
      .get("/api/borrow-requests/my")
      .set("Authorization", bearer(borrowerToken));

    expect(activeLoans.status).toBe(200);
    expect(activeLoans.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: loan.id, status: "OVERDUE", isOverdue: true })
    ]));
    expect(myRequests.status).toBe(200);
    expect(myRequests.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: approvedRequest.id, status: "OVERDUE", isOverdue: true })
    ]));
  });

  test("STS-OVERDUE-004: A returned past-due loan remains RETURNED, not OVERDUE", async () => {
    const approvedRequest = await createApprovedRequest(seeded.checkedOut.id);
    const loan = await createLoan(seeded.checkedOut.id, {
      status: "RETURNED",
      dueDate: new Date("2000-01-01T00:00:00.000Z"),
      returnDate: new Date()
    });
    const custodianToken = await login("custodian@ku.ac.th", passwords.custodian);
    const borrowerToken = await login("borrower@ku.ac.th", passwords.borrower);

    const activeLoans = await request(app)
      .get("/api/loans/active")
      .set("Authorization", bearer(custodianToken));
    const myRequests = await request(app)
      .get("/api/borrow-requests/my")
      .set("Authorization", bearer(borrowerToken));
    const savedLoan = await prisma.loanRecord.findUniqueOrThrow({ where: { id: loan.id } });

    expect(activeLoans.body).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: loan.id })]));
    expect(myRequests.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: approvedRequest.id, status: "RETURNED" })
    ]));
    expect(myRequests.body).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: approvedRequest.id, status: "OVERDUE" })
    ]));
    expect(savedLoan.status).toBe("RETURNED");
  });
});
