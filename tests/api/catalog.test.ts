import request from "supertest";
import { app } from "../../src/app.js";

describe("STS-CATALOG catalog inspection", () => {
  test("STS-CATALOG-001: authenticated users retrieve the catalog", async () => {
    const response = await request(app).get("/assets").set("Authorization", "Bearer borrower-token");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("STS-CATALOG-002: unauthenticated catalog request returns 401 Unauthorized", async () => {
    const response = await request(app).get("/assets");
    expect(response.status).toBe(401);
  });

  test("STS-CATALOG-003: catalog entries expose tag, name, category, and availability status", async () => {
    const response = await request(app).get("/assets").set("Authorization", "Bearer borrower-token");
    expect(response.status).toBe(200);

    if (response.body.length > 0) {
      expect(response.body[0]).toEqual(expect.objectContaining({
        assetTag: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        status: expect.stringMatching(/AVAILABLE|CHECKED_OUT|RESERVED|MAINTENANCE/) 
      }));
    }
  });
});
