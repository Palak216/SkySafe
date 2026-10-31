const { z } = require("zod");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from server directory or project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  MONGO_URI: z.string({
    required_error: "MONGO_URI is required",
  }).min(1, "MONGO_URI cannot be empty"),
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET is required",
  }).min(1, "JWT_SECRET cannot be empty"),
  RAZORPAY_KEY_ID: z.string({
    required_error: "RAZORPAY_KEY_ID is required",
  }).min(1, "RAZORPAY_KEY_ID cannot be empty"),
  RAZORPAY_KEY_SECRET: z.string({
    required_error: "RAZORPAY_KEY_SECRET is required",
  }).min(1, "RAZORPAY_KEY_SECRET cannot be empty"),
  RAZORPAY_WEBHOOK_SECRET: z.string({
    required_error: "RAZORPAY_WEBHOOK_SECRET is required",
  }).min(1, "RAZORPAY_WEBHOOK_SECRET cannot be empty"),
  CLIENT_URL: z.string({
    required_error: "CLIENT_URL is required",
  }).min(1, "CLIENT_URL cannot be empty"),

  // Optional env variables with graceful defaults
  ADMIN_EMAIL: z.string().email().optional().default("admin@skysafe.com"),
  ADMIN_PASSWORD: z.string().optional().default("Admin@123456"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 587)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default("SkySafe <no-reply@skysafe.com>"),
  GEMINI_API_KEY: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
});

function validateEnv() {
  // Allow MONGO_URI fallback to MONGODB_URI if user set MONGODB_URI
  if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
    process.env.MONGO_URI = process.env.MONGODB_URI;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ CRITICAL: Environment variable validation failed!");
    console.error("---------------------------------------------------------");
    const formatted = result.error.format();
    for (const [key, val] of Object.entries(formatted)) {
      if (key !== "_errors" && val?._errors?.length) {
        console.error(`  - ${key}: ${val._errors.join(", ")}`);
      }
    }
    console.error("---------------------------------------------------------");
    console.error("Please configure the required environment variables in server/.env");
    console.error("Refer to .env.example for required configuration.\n");
    throw new Error("Missing or invalid required environment variables.");
  }

  return result.data;
}

const env = validateEnv();

module.exports = env;
