import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "../config";
import * as schema from "./schema";

const sql = postgres(env.DATABASE_URL, {
  max: 1,
});

export const db = drizzle(sql, { schema });
export { sql };

