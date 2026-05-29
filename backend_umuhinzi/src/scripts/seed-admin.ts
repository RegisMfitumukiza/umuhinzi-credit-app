

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function seedAdmin() {
  /**
   * ---------------------------------------
   * CREATE DEFAULT COOPERATIVE
   * ---------------------------------------
   */

  const cooperativeName = "Umuhinzi Cooperative";

  let cooperative = await prisma.cooperative.findFirst({
    where: {
      name: cooperativeName,
    },
  });

  if (!cooperative) {
    cooperative = await prisma.cooperative.create({
      data: {
        name: cooperativeName,
        district: "Kicukiro",
        sector: "Niboye",
        village: "Gatare",
      },
    });

    console.log("✅ Cooperative created successfully:");
    console.log(`   Name: ${cooperative.name}`);
    console.log(`   ID:   ${cooperative.id}`);
  } else {
    console.log("ℹ️ Cooperative already exists:");
    console.log(`   Name: ${cooperative.name}`);
    console.log(`   ID:   ${cooperative.id}`);
  }

  /**
   * ---------------------------------------
   * CREATE ADMIN USER
   * ---------------------------------------
   */

  const email = "alainmucyo33@gmail.com";
  const password = "Admin2026!";
  const fullName = "Alain Mucyo";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`ℹ️ Admin already exists: ${email}`);

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

      // CONNECT ADMIN TO COOPERATIVE
      
    },
  });

  console.log("\n✅ Admin created successfully:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   ID:       ${admin.id}`);
  console.log(`   Cooperative ID: ${cooperative.id}`);

  await prisma.$disconnect();
}

seedAdmin().catch(async (e) => {
  console.error("❌ Failed to seed database:", e);

  await prisma.$disconnect();

  process.exit(1);
});