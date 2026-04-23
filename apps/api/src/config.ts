import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5432/crmfmorazzo"),
  PORT: z.coerce.number().default(4000),
});

export const env = envSchema.parse(process.env);

