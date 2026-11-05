import request from "supertest";
import { app } from "../../src/app.js";
describe("STS-CHECKOUT custodian checkout execution", () => {
    test("STS-CHECKOUT-001: Custodian approves a pending request and creates an active loan", async () => {
        const response = await request(app)
            .post("/borrow-requests/request-1/checkout")
            .set("Authorization", "Bearer custodian-token")
            .send({ dueAt: "2026-11-30T00:00:00.000Z" });
        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({ status: "ACTIVE", requestId: "request-1" }));
    });
    test("STS-CHECKOUT-002: checkout transitions the asset status to CHECKED_OUT", async () => {
        const response = await request(app)
            .post("/borrow-requests/request-1/checkout")
            .set("Authorization", "Bearer custodian-token")
            .send({ dueAt: "2026-11-30T00:00:00.000Z" });
        expect(response.status).toBe(201);
        expect(response.body.assetStatus).toBe("CHECKED_OUT");
    });
    test("STS-CHECKOUT-003: checkout of an unavailable asset returns 409 Conflict", async () => {
        const response = await request(app)
            .post("/borrow-requests/unavailable-request/checkout")
            .set("Authorization", "Bearer custodian-token")
            .send({ dueAt: "2026-11-30T00:00:00.000Z" });
        expect(response.status).toBe(409);
    });
});
