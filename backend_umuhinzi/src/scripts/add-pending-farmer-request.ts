import "dotenv/config";
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

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const farmerEmail = "clarissemukayiranga@gmail.com";
const managerEmail = "clarissemukayiranga7@gmail.com";
const fallbackCooperativeName = "Umuhinzi Cooperative";

async function main() {
  const manager = await prisma.user.findUnique({
    where: { email: managerEmail },
    select: {
      id: true,
      fullName: true,
      cooperativeManagerProfile: {
        select: {
          cooperativeId: true,
          cooperative: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const cooperativeId =
    manager?.cooperativeManagerProfile?.cooperativeId ||
    (await prisma.cooperative.findFirst({
      where: { name: fallbackCooperativeName },
      select: { id: true, name: true },
    }))?.id;

  if (!cooperativeId) {
    throw new Error(`No cooperative linked to ${managerEmail} and no cooperative named "${fallbackCooperativeName}" was found.`);
  }

  const farmerUser = await prisma.user.findUnique({
    where: { email: farmerEmail },
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  });

  if (!farmerUser) {
    throw new Error(`Farmer user ${farmerEmail} was not found.`);
  }

  const farmerProfile = await prisma.farmer.findUnique({
    where: { userId: farmerUser.id },
    select: {
      id: true,
      status: true,
      cooperativeId: true,
    },
  });

  if (!farmerProfile) {
    throw new Error(`Farmer profile for ${farmerEmail} was not found.`);
  }

  const member = await prisma.cooperativeMember.upsert({
    where: { farmerId: farmerProfile.id },
    create: {
      farmerId: farmerProfile.id,
      cooperativeId,
      status: "PENDING",
      joinedAt: new Date(),
    },
    update: {
      cooperativeId,
      status: "PENDING",
      joinedAt: new Date(),
      leftAt: null,
    },
    select: {
      id: true,
      status: true,
      cooperativeId: true,
    },
  });

  await prisma.farmer.update({
    where: { id: farmerProfile.id },
    data: {
      cooperativeId,
      status: "PENDING",
    },
  });

  console.log("✅ Pending cooperative request created/updated");
  console.log(`   Farmer: ${farmerEmail}`);
  console.log(`   Manager: ${managerEmail}`);
  console.log(`   Cooperative ID: ${member.cooperativeId}`);
  console.log(`   Member Status: ${member.status}`);
}

main()
  .catch(async (error) => {
    console.error("❌ Failed to create pending cooperative request:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
