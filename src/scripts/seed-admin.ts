/**
 * Creates the first admin user from environment variables.
 * Safe to run multiple times — skips if the admin email already exists.
 *
 * Usage: npm run seed:admin
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME ?? "Platform Admin";

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`ℹ️  Admin already exists: ${email} — skipping.`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    },
  });

  console.log("✅ Admin created successfully:");
  console.log(`   Name:  ${admin.fullName}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log(`   ID:    ${admin.id}`);

  await prisma.$disconnect();
}

seedAdmin().catch((e) => {
  console.error("❌ Failed to create admin:", e);
  process.exit(1);
});
