import bcrypt from "bcrypt";
import { PrismaClient, Role, AssetStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const borrowerHash = await bcrypt.hash("borrower-password", 10);
  const custodianHash = await bcrypt.hash("custodian-password", 10);

  await prisma.user.upsert({ where: { email: "borrower@ku.ac.th" }, update: { passwordHash: borrowerHash }, create: { email: "borrower@ku.ac.th", passwordHash: borrowerHash, role: Role.BORROWER } });
  await prisma.user.upsert({ where: { email: "custodian@ku.ac.th" }, update: { passwordHash: custodianHash }, create: { email: "custodian@ku.ac.th", passwordHash: custodianHash, role: Role.CUSTODIAN } });

  await prisma.asset.upsert({ where: { assetTag: "TAG-RPI-001" }, update: {}, create: { assetTag: "TAG-RPI-001", name: "Raspberry Pi 5", category: "Microcontrollers", status: AssetStatus.AVAILABLE } });
  await prisma.asset.upsert({ where: { assetTag: "TAG-DSO-001" }, update: {}, create: { assetTag: "TAG-DSO-001", name: "Oscilloscope", category: "Test Equipment", status: AssetStatus.AVAILABLE } });
  await prisma.asset.upsert({ where: { assetTag: "TAG-SNS-001" }, update: {}, create: { assetTag: "TAG-SNS-001", name: "Sensor Kit", category: "Sensors", status: AssetStatus.AVAILABLE } });
}

main().finally(async () => prisma.$disconnect()).catch(async (error: unknown) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
