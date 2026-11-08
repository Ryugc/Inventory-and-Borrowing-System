import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("STS-REQUEST borrow request submission", () => {
  test("STS-REQUEST-001: Borrower can submit a request for an available asset", async () => {
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).post("/borrow-requests").set("Authorization", bearer(token)).send({ assetId: seeded.available.id });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ status: "PENDING", assetId: seeded.available.id }));
  });

  test("STS-REQUEST-002: request for an unavailable asset returns 409 Conflict", async () => {
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).post("/borrow-requests").set("Authorization", bearer(token)).send({ assetId: seeded.checkedOut.id });
    expect(response.status).toBe(409);
  });

  test("STS-REQUEST-003: concurrent duplicate requests do not create overlapping requests", async () => {
    const first = await login("borrower@ku.ac.th", passwords.borrower);
    const second = await login("borrower2@ku.ac.th", passwords.borrower2);
    const responses = await Promise.all([
      request(app).post("/borrow-requests").set("Authorization", bearer(first)).send({ assetId: seeded.exclusive.id }),
      request(app).post("/borrow-requests").set("Authorization", bearer(second)).send({ assetId: seeded.exclusive.id })
    ]);
    expect(responses.filter(r => r.status === 201).length).toBe(1);
    expect(responses.filter(r => r.status === 409).length).toBe(1);
    expect(await prisma.borrowRequest.count({ where: { assetId: seeded.exclusive.id } })).toBe(1);
  });
});
