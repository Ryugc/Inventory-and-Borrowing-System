import bcrypt from "bcrypt";
import { PrismaClient, Role, AssetStatus } from "@prisma/client";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

async function upsertUser(email: string, password: string, role: Role): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, role }
  });
}

async function main(): Promise<void> {
  // First administrator (always created)
  await upsertUser("custodian@ku.ac.th", requireEnv("ADMIN_PASSWORD"), Role.CUSTODIAN);

  // Demo borrower, only when SEED_DEMO_DATA=true
  if (process.env.SEED_DEMO_DATA === "true") {
    await upsertUser("borrower@ku.ac.th", requireEnv("DEMO_USER_PASSWORD"), Role.BORROWER);
  }

  // Reference data
  await prisma.asset.upsert({ where: { assetTag: "TAG-RPI-001" }, update: {}, create: { assetTag: "TAG-RPI-001", name: "Raspberry Pi 5", category: "Microcontrollers", status: AssetStatus.AVAILABLE } });
  await prisma.asset.upsert({ where: { assetTag: "TAG-DSO-001" }, update: {}, create: { assetTag: "TAG-DSO-001", name: "Oscilloscope", category: "Test Equipment", status: AssetStatus.AVAILABLE } });
  await prisma.asset.upsert({ where: { assetTag: "TAG-SNS-001" }, update: {}, create: { assetTag: "TAG-SNS-001", name: "Sensor Kit", category: "Sensors", status: AssetStatus.AVAILABLE } });
}

main().finally(async () => prisma.$disconnect()).catch(async (error: unknown) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
