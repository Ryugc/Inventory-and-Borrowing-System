import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, login, passwords, resetAndSeed } from "../helpers.js";

let token: string;

beforeEach(async () => {
  await resetAndSeed();
  token = await login("borrower@ku.ac.th", passwords.borrower);
});

afterAll(async () => { await prisma.$disconnect(); });

describe("C-09 asset search and category filtering", () => {
  test("STS-SEARCH-001: q matches asset names and tags case-insensitively", async () => {
    const nameMatch = await request(app)
      .get("/api/assets")
      .query({ q: "rAsPbErRy" })
      .set("Authorization", bearer(token));
    const tagMatch = await request(app)
      .get("/api/assets")
      .query({ q: "tag-dso" })
      .set("Authorization", bearer(token));

    expect(nameMatch.status).toBe(200);
    expect(nameMatch.body.map((asset: { assetTag: string }) => asset.assetTag)).toEqual(["TAG-RPI-001"]);
    expect(tagMatch.status).toBe(200);
    expect(tagMatch.body.map((asset: { assetTag: string }) => asset.assetTag)).toEqual(["TAG-DSO-001"]);
  });

  test("STS-SEARCH-002: category and status filters match accurately", async () => {
    const response = await request(app)
      .get("/api/assets")
      .query({ category: "tEsT eQuIpMeNt", status: "CHECKED_OUT" })
      .set("Authorization", bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.map((asset: { assetTag: string }) => asset.assetTag)).toEqual(["TAG-DSO-001"]);
  });

  test("STS-SEARCH-003: combined filters intersect and invalid status is rejected", async () => {
    const combined = await request(app)
      .get("/api/assets")
      .query({ q: "pi", category: "microcontrollers", status: "AVAILABLE" })
      .set("Authorization", bearer(token));
    const invalidStatus = await request(app)
      .get("/api/assets")
      .query({ status: "RESERVED" })
      .set("Authorization", bearer(token));

    expect(combined.status).toBe(200);
    expect(combined.body.map((asset: { assetTag: string }) => asset.assetTag)).toEqual(["TAG-RPI-001"]);
    expect(invalidStatus.status).toBe(400);
  });
});
