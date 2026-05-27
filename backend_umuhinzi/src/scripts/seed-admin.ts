/**
 * Run this script ONCE to create the first admin user.
 * Usage: npx tsx src/scripts/seed-admin.ts
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
  const email = "alainmucyo33@gmail.com";
  const password = "Admin2026!";
  const fullName = "Alain Mucyo";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
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
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   ID:       ${admin.id}`);

  await prisma.$disconnect();
}

seedAdmin().catch((e) => {
  console.error("❌ Failed to create admin:", e);
  process.exit(1);
});
