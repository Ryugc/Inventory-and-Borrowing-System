import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

export const passwords = {
  borrower: randomBytes(12).toString("hex"),
  borrower2: randomBytes(12).toString("hex"),
  custodian: randomBytes(12).toString("hex")
};

export async function resetAndSeed() {
  await prisma.session.deleteMany();
  await prisma.loanRecord.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  const hash = (password: string) => bcrypt.hash(password, 4);
  const borrower = await prisma.user.create({ data: { email: "borrower@ku.ac.th", passwordHash: await hash(passwords.borrower), role: "BORROWER" } });
  const borrower2 = await prisma.user.create({ data: { email: "borrower2@ku.ac.th", passwordHash: await hash(passwords.borrower2), role: "BORROWER" } });
  const custodian = await prisma.user.create({ data: { email: "custodian@ku.ac.th", passwordHash: await hash(passwords.custodian), role: "CUSTODIAN" } });

  const available = await prisma.asset.create({ data: { assetTag: "TAG-RPI-001", name: "Raspberry Pi 5", category: "Microcontrollers", status: "AVAILABLE" } });
  const checkedOut = await prisma.asset.create({ data: { assetTag: "TAG-DSO-001", name: "Oscilloscope", category: "Test Equipment", status: "CHECKED_OUT" } });
  const exclusive = await prisma.asset.create({ data: { assetTag: "TAG-SNS-001", name: "Sensor Kit", category: "Sensors", status: "AVAILABLE" } });

  return { borrower, borrower2, custodian, available, checkedOut, exclusive };
}

export async function login(email: string, password: string): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email, password });
  return response.body.token as string;
}

export const bearer = (token: string): string => `Bearer ${token}`;

export function createPending(assetId: string, borrowerId: string) {
  return prisma.borrowRequest.create({ data: { assetId, borrowerId } });
}
