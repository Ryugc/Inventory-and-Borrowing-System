import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

describe("C-08 custodian asset status management", () => {
  test("STS-ASSET-001: Custodian creates an available asset visible in the catalog", async () => {
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const response = await request(app)
      .post("/api/assets")
      .set("Authorization", bearer(token))
      .send({ assetTag: "TAG-NEW-001", name: "Logic Analyzer", category: "Test Equipment" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({
      assetTag: "TAG-NEW-001",
      name: "Logic Analyzer",
      category: "Test Equipment",
      status: "AVAILABLE"
    }));

    const catalog = await request(app).get("/api/assets").set("Authorization", bearer(token));
    expect(catalog.status).toBe(200);
    expect(catalog.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: response.body.id, status: "AVAILABLE" })
    ]));
  });

  test("STS-ASSET-002: Duplicate tags and missing or empty required fields are rejected", async () => {
    const token = await login("custodian@ku.ac.th", passwords.custodian);
    const duplicateResponse = await request(app)
      .post("/api/assets")
      .set("Authorization", bearer(token))
      .send({ assetTag: "TAG-RPI-001", name: "Duplicate Asset", category: "Test Equipment" });

    expect(duplicateResponse.status).toBe(409);

    const invalidBodies = [
      { name: "Missing Tag", category: "Test Equipment" },
      { assetTag: "", name: "Empty Tag", category: "Test Equipment" },
      { assetTag: "TAG-MISSING-NAME", category: "Test Equipment" },
      { assetTag: "TAG-EMPTY-NAME", name: "", category: "Test Equipment" },
      { assetTag: "TAG-MISSING-CATEGORY", name: "Missing Category" },
      { assetTag: "TAG-EMPTY-CATEGORY", name: "Empty Category", category: "" }
    ];

    for (const body of invalidBodies) {
      const response = await request(app)
        .post("/api/assets")
        .set("Authorization", bearer(token))
        .send(body);
      expect(response.status).toBe(400);
    }
  });

  test("STS-ASSET-003: Maintenance assets cannot be requested by borrowers", async () => {
    const custodianToken = await login("custodian@ku.ac.th", passwords.custodian);
    const statusResponse = await request(app)
      .patch(`/api/assets/${seeded.available.id}/status`)
      .set("Authorization", bearer(custodianToken))
      .send({ status: "MAINTENANCE" });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe("MAINTENANCE");

    const borrowerToken = await login("borrower@ku.ac.th", passwords.borrower);
    const requestResponse = await request(app)
      .post("/api/borrow-requests")
      .set("Authorization", bearer(borrowerToken))
      .send({ assetId: seeded.available.id });

    expect(requestResponse.status).toBe(409);
  });

  test("STS-ASSET-004: Checked-out assets cannot change status and borrowers cannot manage assets", async () => {
    const custodianToken = await login("custodian@ku.ac.th", passwords.custodian);
    const checkedOutResponse = await request(app)
      .patch(`/api/assets/${seeded.checkedOut.id}/status`)
      .set("Authorization", bearer(custodianToken))
      .send({ status: "MAINTENANCE" });

    expect(checkedOutResponse.status).toBe(409);

    const borrowerToken = await login("borrower@ku.ac.th", passwords.borrower);
    const createResponse = await request(app)
      .post("/api/assets")
      .set("Authorization", bearer(borrowerToken))
      .send({ assetTag: "TAG-BORROWER-001", name: "Forbidden Asset", category: "Other" });
    const updateResponse = await request(app)
      .patch(`/api/assets/${seeded.available.id}/status`)
      .set("Authorization", bearer(borrowerToken))
      .send({ status: "MAINTENANCE" });

    expect(createResponse.status).toBe(403);
    expect(updateResponse.status).toBe(403);
  });
});
