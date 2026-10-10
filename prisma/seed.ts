import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { seedContent } from "./seeds/content";
import { seedCore } from "./seeds/core";
import { seedAuth } from "./seeds/auth";

config({ path: [".env.local", ".env"] });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed PostgreSQL.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await seedCore(prisma);
  await seedAuth(prisma);
  await seedContent(prisma);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
