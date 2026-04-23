import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, sql } from "./client";

async function run() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
}

run().catch(async (error) => {
  console.error("Migration failed", error);
  await sql.end();
  process.exit(1);
});

