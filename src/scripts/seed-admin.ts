/**
 * Creates the first admin user from environment variables.
 * Safe to call on every startup — skips if the admin already exists.
 *
 * Manual usage: npm run seed:admin
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";

export async function seedAdmin(): Promise<void> {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME ?? "Platform Admin";

  if (!email || !password) {
    logger.warn("Admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    logger.info(`Admin seed: ${email} already exists — skipping.`);
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

  logger.info(`Admin seed: created ${admin.email} (id: ${admin.id})`);
}

/* ── Standalone entry point (npm run seed:admin) ── */
const isMain =
  process.argv[1]?.endsWith("seed-admin.ts") ||
  process.argv[1]?.endsWith("seed-admin.js");

if (isMain) {
  seedAdmin()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error("❌ Admin seed failed:", e);
      process.exit(1);
    });
}
