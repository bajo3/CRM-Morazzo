import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../config";
import * as schema from "./schema";

const usesSupabase = env.DATABASE_URL.includes("supabase.co");

const sql = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 15,
  ssl: usesSupabase ? "require" : undefined,
});

export const db = drizzle(sql, { schema });
export { sql };
