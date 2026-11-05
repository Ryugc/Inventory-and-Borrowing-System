import request from "supertest";
import { app } from "../../src/app.js";
describe("STS-AUTH authentication and role authorization", () => {
    test("STS-AUTH-001: valid Borrower login establishes an authenticated session", async () => {
        const response = await request(app).post("/auth/login").send({ email: "borrower@ku.ac.th", password: "borrower-password" });
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String), role: "BORROWER" }));
    });
    test("STS-AUTH-002: valid Custodian login establishes an authenticated session", async () => {
        const response = await request(app).post("/auth/login").send({ email: "custodian@ku.ac.th", password: "custodian-password" });
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
        const response = await request(app).post("/borrow-requests/request-1/checkout").set("Authorization", "Bearer borrower-token");
        expect(response.status).toBe(403);
    });
    test("STS-AUTH-006: Borrower access to all-loan endpoint returns 403 Forbidden", async () => {
        const response = await request(app).get("/loans").set("Authorization", "Bearer borrower-token");
        expect(response.status).toBe(403);
    });
});
