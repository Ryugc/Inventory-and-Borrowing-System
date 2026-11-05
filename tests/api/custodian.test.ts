import request from "supertest";
import { app } from "../../src/app.js";

describe("STS-CUSTODIAN pending request management", () => {
  test("STS-CUSTODIAN-001: Custodian lists pending requests with asset and borrower details", async () => {
    const response = await request(app)
      .get("/api/borrow-requests/pending")
      .set("Authorization", "Bearer custodian-token");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toEqual(expect.objectContaining({
        id: expect.any(String),
        asset: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          assetTag: expect.any(String)
        }),
        borrower: expect.objectContaining({ email: expect.any(String) }),
        requestDate: expect.any(String)
      }));
      expect(response.body[0].status).toBe("PENDING");
    }
  });

  test("STS-CUSTODIAN-002: Borrower cannot list pending requests", async () => {
    const response = await request(app)
      .get("/api/borrow-requests/pending")
      .set("Authorization", "Bearer borrower-token");

    expect(response.status).toBe(403);
  });

  test("STS-CUSTODIAN-003: unauthenticated access is rejected", async () => {
    const response = await request(app).get("/api/borrow-requests/pending");

    expect(response.status).toBe(401);
  });
});
