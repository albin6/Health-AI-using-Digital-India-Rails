import dotenv from "dotenv";
import { z } from "zod";
import { IAppConfig } from "./IAppConfig";

// 1. Load .env file
dotenv.config();

// 2. Define Schema
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().optional(),
});

// 3. Validate process.env
// We parse process.env (treating it as unknown first to satisfy TS if needed, or letting Zod handle loose matching)
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(_env.error.format(), null, 4));
    process.exit(1);
}

const envVars = _env.data;

// 4. Map to Config Object
export const config: IAppConfig = {
    env: envVars.NODE_ENV,
    server: {
        port: envVars.PORT,
    },
    db: {
        url: envVars.DATABASE_URL,
    },
};
