import fs from "node:fs";
import crypto from "node:crypto";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, sql } from "./client";

async function reconcileInitialMigration() {
  await sql.unsafe('create schema if not exists "drizzle"');
  await sql.unsafe(`
    create table if not exists "drizzle"."__drizzle_migrations" (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const [hasMigration] = await sql<{ count: number }[]>`
    select count(*)::int as count from "drizzle"."__drizzle_migrations"
  `;

  if (hasMigration.count > 0) {
    return;
  }

  const [schemaReady] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'clients',
        'quotes',
        'quote_items',
        'work_orders',
        'work_order_items',
        'glass_types',
        'service_extras',
        'stock_sheets',
        'stock_movements',
        'payments',
        'cash_movements',
        'schedule_entries',
        'templates'
      )
  `;

  if (schemaReady.count < 13) {
    return;
  }

  const migrationSql = fs.readFileSync(new URL("../../drizzle/0000_supabase_initial.sql", import.meta.url), "utf8");
  const journal = JSON.parse(
    fs.readFileSync(new URL("../../drizzle/meta/_journal.json", import.meta.url), "utf8"),
  ) as {
    entries: Array<{
      when: number;
    }>;
  };

  const hash = crypto.createHash("sha256").update(migrationSql).digest("hex");
  const createdAt = journal.entries[0]?.when ?? Date.now();

  await sql`
    insert into "drizzle"."__drizzle_migrations" ("hash", "created_at")
    values (${hash}, ${createdAt})
  `;
}

async function run() {
  await reconcileInitialMigration();
  await migrate(db, { migrationsFolder: "./drizzle" });
  await reconcileInitialMigration();
  await sql.end();
}

run().catch(async (error) => {
  console.error("Migration failed", error);
  await sql.end();
  process.exit(1);
});
