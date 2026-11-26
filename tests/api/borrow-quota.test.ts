import { afterAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, createPending, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;

beforeEach(async () => {
  seeded = await resetAndSeed();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Lab 7 checkout due-date duration window", () => {
  test("STS-CHECKOUT-006: rejects dueAt exceeding 14 days from now with 400", async () => {
    const pending = await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);

    // 30 days in the future exceeds the new 14-day maximum window
    const overLimitDueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const response = await request(app)
      .post(`/borrow-requests/${pending.id}/checkout`)
      .set("Authorization", bearer(token))
      .send({ dueAt: overLimitDueAt });

    expect(response.status).toBe(400);
  });
});
