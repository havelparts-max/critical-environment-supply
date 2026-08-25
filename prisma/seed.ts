import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

async function upsertUser(email: string, name: string, role: "ADMIN" | "SALES") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Already exists, skipping: ${email} (${role})`);
    return;
  }
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, name, role, passwordHash } });
  console.log(`Created ${role} user: ${email} / ${password}`);
}

async function main() {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionRatePercent: 10, defaultMarkupPercent: 20 },
  });

  await upsertUser("admin@example.com", "Admin", "ADMIN");
  await upsertUser("staff@example.com", "Sample Sales Rep", "SALES");

  console.log("\nSave these credentials now - passwords are not stored anywhere and won't be shown again.");
  console.log("Sign in at /sign-in with them.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
