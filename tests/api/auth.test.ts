import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, login, passwords, resetAndSeed } from "../helpers.js";

beforeEach(async () => { await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("STS-AUTH authentication and role authorization", () => {
  test("STS-AUTH-001: valid Borrower login establishes an authenticated session", async () => {
    const response = await request(app).post("/auth/login").send({ email: "borrower@ku.ac.th", password: passwords.borrower });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String), role: "BORROWER" }));
  });

  test("STS-AUTH-002: valid Custodian login establishes an authenticated session", async () => {
    const response = await request(app).post("/auth/login").send({ email: "custodian@ku.ac.th", password: passwords.custodian });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String), role: "CUSTODIAN" }));
  });

  test("STS-AUTH-003: invalid credentials return 401 Unauthorized", async () => {
    const response = await request(app).post("/auth/login").send({ email: "borrower@ku.ac.th", password: "incorrect-password" });
    expect(response.status).toBe(401);
  });

  test("STS-AUTH-004: protected endpoint without a session returns 401 Unauthorized", async () => {
    const response = await request(app).get("/assets");
    expect(response.status).toBe(401);
  });

  test("STS-AUTH-005: Borrower checkout attempt returns 403 Forbidden", async () => {
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).post("/borrow-requests/any-request/checkout").set("Authorization", bearer(token));
    expect(response.status).toBe(403);
  });

  test("STS-AUTH-006: Borrower access to all-loan endpoint returns 403 Forbidden", async () => {
    const token = await login("borrower@ku.ac.th", passwords.borrower);
    const response = await request(app).get("/loans").set("Authorization", bearer(token));
    expect(response.status).toBe(403);
  });

  test("STS-AUTH-007: stored passwords are bcrypt hashes, never plaintext", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "borrower@ku.ac.th" } });
    expect(user.passwordHash).not.toBe(passwords.borrower);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  test("STS-AUTH-008: a guessed or forged token is rejected with 401", async () => {
    const response = await request(app).get("/loans").set("Authorization", "Bearer custodian-token");
    expect(response.status).toBe(401);
  });
});
