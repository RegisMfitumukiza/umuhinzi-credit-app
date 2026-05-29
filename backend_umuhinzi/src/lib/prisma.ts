import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL missing. Please set it in .env");
}

// const pool = new Pool({
//   connectionString,

//   ssl: { 
//     rejectUnauthorized: false 
//   },

//   max: Number(process.env.DB_POOL_MAX) || 5,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 15000,
// });
const useSsl = process.env.PGSSL === "true";

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.DB_POOL_MAX) || 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ 
  adapter, 
  log: 
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  
});