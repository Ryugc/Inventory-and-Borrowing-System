import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, createPending, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("STS-CUSTODIAN pending request management", () => {
  test("STS-CUSTODIAN-001: Custodian lists pending requests with asset and borrower details", async () => {
    await createPending(seeded.available.id, seeded.borrower.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const response = await request(app).get("/api/borrow-requests/pending").set("Authorization", bearer(token));
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(expect.objectContaining({
      id: expect.any(String),
      asset: expect.objectContaining({ id: expect.any(String), name: expect.any(String), assetTag: expect.any(String) }),
      borrower: expect.objectContaining({ email: "borrower@ku.ac.th" }),
      requestDate: expect.any(String)
    }));
    expect(response.body[0].status).toBe("PENDING");
  });

  test("STS-CUSTODIAN-002: Borrower cannot list pending requests", async () => {
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).get("/api/borrow-requests/pending").set("Authorization", bearer(token));
    expect(response.status).toBe(403);
  });

  test("STS-CUSTODIAN-003: unauthenticated access is rejected", async () => {
    const response = await request(app).get("/api/borrow-requests/pending");
    expect(response.status).toBe(401);
  });
});
