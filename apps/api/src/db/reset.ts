import { sql } from "./client";

async function reset() {
  await sql.unsafe(`
    drop schema public cascade;
    create schema public;
  `);

  await sql.end();
}

reset().catch(async (error) => {
  console.error("Reset failed", error);
  await sql.end();
  process.exit(1);
});
