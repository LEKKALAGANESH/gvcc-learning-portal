import { PrismaClient } from "@prisma/client";

// Reuse one client per process — across hot-reloads in dev, and across warm serverless
// invocations in production. A fresh client per invocation would open a new pooled
// connection each time and exhaust Supavisor under load.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

globalForPrisma.prisma = db;
