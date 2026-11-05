import request from "supertest";
import { app } from "../../src/app.js";

describe("STS-REQUEST borrow request submission", () => {
  test("STS-REQUEST-001: Borrower can submit a request for an available asset", async () => {
    const response = await request(app)
      .post("/borrow-requests")
      .set("Authorization", "Bearer borrower-token")
      .send({ assetId: "available-asset-1" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ status: "PENDING", assetId: "available-asset-1" }));
  });

  test("STS-REQUEST-002: request for an unavailable asset returns 409 Conflict", async () => {
    const response = await request(app)
      .post("/borrow-requests")
      .set("Authorization", "Bearer borrower-token")
      .send({ assetId: "checked-out-asset-1" });

    expect(response.status).toBe(409);
  });

  test("STS-REQUEST-003: concurrent duplicate requests do not create overlapping requests", async () => {
    const first = request(app)
      .post("/borrow-requests")
      .set("Authorization", "Bearer borrower-token")
      .send({ assetId: "exclusive-asset-1" });
    const second = request(app)
      .post("/borrow-requests")
      .set("Authorization", "Bearer another-borrower-token")
      .send({ assetId: "exclusive-asset-1" });

    const responses = await Promise.all([first, second]);
    expect(responses.map(response => response.status)).toContain(201);
    expect(responses.filter(response => response.status === 409).length).toBe(1);
  });
});
