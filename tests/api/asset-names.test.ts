import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, createPending, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("Issue 36: requests and loans identify the asset by name", () => {
  test("my requests include the asset name and tag", async () => {
    await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).get("/borrow-requests/my").set("Authorization", bearer(token));
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].asset).toEqual(expect.objectContaining({ name: "Raspberry Pi 5", assetTag: "TAG-RPI-001" }));
  });

  test("active loans include the asset name and tag", async () => {
    const pending = await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    await request(app).post(`/borrow-requests/${pending.id}/checkout`).set("Authorization", bearer(token)).send({ dueAt: "2026-12-01T00:00:00.000Z" }).expect(201);
    const response = await request(app).get("/loans/active").set("Authorization", bearer(token));
    expect(response.status).toBe(200);
    expect(response.body[0].asset).toEqual(expect.objectContaining({ name: "Raspberry Pi 5", assetTag: "TAG-RPI-001" }));
  });
});
