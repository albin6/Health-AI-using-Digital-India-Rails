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
    EKA_CARE_API_BASE_URL: z.string().url(),
    EKA_CARE_CLIENT_ID: z.string().min(1),
    EKA_CARE_CLIENT_SECRET: z.string().min(1),
    WHATSAPP_VERIFY_TOKEN: z.string().min(1),
    WHATSAPP_ACCESS_TOKEN: z.string().min(1),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
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
    eka: {
        baseUrl: envVars.EKA_CARE_API_BASE_URL,
        clientId: envVars.EKA_CARE_CLIENT_ID,
        clientSecret: envVars.EKA_CARE_CLIENT_SECRET,
    },
    whatsapp: {
        verifyToken: envVars.WHATSAPP_VERIFY_TOKEN,
        accessToken: envVars.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: envVars.WHATSAPP_PHONE_NUMBER_ID,
    },
};
