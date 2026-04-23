import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Copy the Supabase Postgres URI into ../../.env before running Drizzle.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
