
/*
 * Creates one shared Prisma Client instance for the RentHub API.
 * Uses the Neon pooled connection for application database queries.
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from the environment.");
}

const { Pool } = pg;

// PrismaPg creates and disposes a pool for every adapter connection when it
// receives a configuration object. Supplying one Pool instance keeps database
// connections reusable across requests.
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  min: 4,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
