import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db.js";
import { bearer, login, passwords, resetAndSeed } from "../helpers.js";

let seeded: Awaited<ReturnType<typeof resetAndSeed>>;
beforeEach(async () => { seeded = await resetAndSeed(); });
afterAll(async () => { await prisma.$disconnect(); });

async function createLoan(
  assetId: string,
  options: { status?: "ACTIVE" | "RETURNED" | "OVERDUE"; returnDate?: Date | null } = {}
) {
  return prisma.loanRecord.create({
    data: {
      assetId,
      borrowerId: seeded.borrower.id,
      custodianId: seeded.custodian.id,
      dueDate: new Date("2026-12-30T00:00:00.000Z"),
      status: options.status ?? "ACTIVE",
      returnDate: options.returnDate ?? null
    }
  });
}

describe("C-06 asset return processing", () => {
  test("STS-RETURN-001: Custodian records the return condition and return date", async () => {
    const loan = await createLoan(seeded.checkedOut.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);

    const response = await request(app)
      .post(`/api/loans/${loan.id}/return`)
      .set("Authorization", bearer(token))
      .send({ returnCondition: "Minor scratch on casing" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: "RETURNED",
      returnDate: expect.any(String),
      returnCondition: "Minor scratch on casing"
    }));

    const savedLoan = await prisma.loanRecord.findUniqueOrThrow({ where: { id: loan.id } });
    expect(savedLoan.status).toBe("RETURNED");
    expect(savedLoan.returnDate).toBeInstanceOf(Date);
    expect(savedLoan.returnCondition).toBe("Minor scratch on casing");
  });

  test("STS-RETURN-002: Returned asset becomes available and can be requested again", async () => {
    const loan = await createLoan(seeded.checkedOut.id);
    const custodianToken = await login("custodian@ku.ac.th", passwords.custodian);

    const returned = await request(app)
      .post(`/api/loans/${loan.id}/return`)
      .set("Authorization", bearer(custodianToken))
      .send({ returnCondition: "Good" });

    expect(returned.status).toBe(200);
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: seeded.checkedOut.id } });
    expect(asset.status).toBe("AVAILABLE");

    const borrowerToken = await login("borrower@ku.ac.th", passwords.borrower);
    const requestResponse = await request(app)
      .post("/api/borrow-requests")
      .set("Authorization", bearer(borrowerToken))
      .send({ assetId: seeded.checkedOut.id });

    expect(requestResponse.status).toBe(201);
  });

  test("STS-RETURN-003: Returned loans and loans with a non-checked-out asset return 409", async () => {
    const alreadyReturnedLoan = await createLoan(seeded.available.id, {
      status: "RETURNED",
      returnDate: new Date()
    });
    const loanWithAvailableAsset = await createLoan(seeded.exclusive.id);
    const token = await login("custodian@ku.ac.th", passwords.custodian);

    const alreadyReturnedResponse = await request(app)
      .post(`/api/loans/${alreadyReturnedLoan.id}/return`)
      .set("Authorization", bearer(token))
      .send({});
    const availableAssetResponse = await request(app)
      .post(`/api/loans/${loanWithAvailableAsset.id}/return`)
      .set("Authorization", bearer(token))
      .send({});

    expect(alreadyReturnedResponse.status).toBe(409);
    expect(availableAssetResponse.status).toBe(409);
  });

  test("STS-RETURN-004: Borrower cannot return a loan", async () => {
    const loan = await createLoan(seeded.checkedOut.id);
    const token = await login("borrower@ku.ac.th", passwords.borrower);

    const response = await request(app)
      .post(`/api/loans/${loan.id}/return`)
      .set("Authorization", bearer(token))
      .send({ returnCondition: "Good" });

    expect(response.status).toBe(403);
  });
});
