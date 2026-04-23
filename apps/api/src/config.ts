import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Copy the Supabase Postgres URI into this variable."),
  PORT: z.coerce.number().default(4000),
});

export const env = envSchema.parse(process.env);
