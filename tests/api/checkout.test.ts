import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, createPending, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("STS-CHECKOUT custodian checkout execution", () => {
  test("STS-CHECKOUT-001: Custodian approves a pending request and creates an active loan", async () => {
    const pending = await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const response = await request(app).post(`/borrow-requests/${pending.id}/checkout`).set("Authorization", bearer(token)).send({ dueAt: "2026-11-30T00:00:00.000Z" });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ status: "ACTIVE", requestId: pending.id }));
  });

  test("STS-CHECKOUT-002: checkout transitions the asset status to CHECKED_OUT", async () => {
    const pending = await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const response = await request(app).post(`/borrow-requests/${pending.id}/checkout`).set("Authorization", bearer(token)).send({ dueAt: "2026-11-30T00:00:00.000Z" });
    expect(response.status).toBe(201);
    expect(response.body.assetStatus).toBe("CHECKED_OUT");
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: seeded.available.id } });
    expect(asset.status).toBe("CHECKED_OUT");
  });

  test("STS-CHECKOUT-003: checkout of an unavailable asset returns 409 Conflict", async () => {
    const pending = await createPending(seeded.checkedOut.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const response = await request(app).post(`/borrow-requests/${pending.id}/checkout`).set("Authorization", bearer(token)).send({ dueAt: "2026-11-30T00:00:00.000Z" });
    expect(response.status).toBe(409);
  });
});
