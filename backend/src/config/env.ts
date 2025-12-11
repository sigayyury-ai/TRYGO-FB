import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// dotenv/config already loaded .env
// Now load .env.local if it exists (will override .env values)
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const {
  MONGODB_URI,
  PORT,
  NODE_ENV = "development",
  SEMANTICS_SERVICE_URL = "http://localhost:4200",
  IMAGES_SERVICE_URL = "http://localhost:4300",
  WEBSITE_PAGES_SERVICE_URL = "http://localhost:4400",
  FRONTEND_URL = "http://localhost:8080",
  GOOGLE_API_KEY,
  GEMINI_API_KEY,
  OPENAI_API_KEY,
  OPENAI_MODEL = "gpt-4o",
  WORDPRESS_BASE_URL,
  WORDPRESS_USERNAME,
  WORDPRESS_APP_PASSWORD,
  LOG_SENSITIVE_DATA = "false"
} = process.env;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

// PORT is set by Render automatically, use it directly
// Default port for SEO Agent backend is 4100 (as per PORTS.md)
const port = PORT ? parseInt(PORT, 10) : 4100;

export const env = {
  mongoUri: MONGODB_URI,
  port,
  nodeEnv: NODE_ENV,
  semanticsServiceUrl: SEMANTICS_SERVICE_URL.replace(/\/$/, ""),
  imagesServiceUrl: IMAGES_SERVICE_URL.replace(/\/$/, ""),
  websitePagesServiceUrl: WEBSITE_PAGES_SERVICE_URL.replace(/\/$/, ""),
  frontendUrl: FRONTEND_URL,
  googleApiKey: GOOGLE_API_KEY,
  geminiApiKey: GEMINI_API_KEY,
  openAiApiKey: OPENAI_API_KEY,
  openAiModel: OPENAI_MODEL,
  wordpressBaseUrl: WORDPRESS_BASE_URL,
  wordpressUsername: WORDPRESS_USERNAME,
  wordpressAppPassword: WORDPRESS_APP_PASSWORD,
  logSensitiveData: LOG_SENSITIVE_DATA === "true"
};

