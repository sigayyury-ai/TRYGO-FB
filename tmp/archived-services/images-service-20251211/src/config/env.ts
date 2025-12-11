import path from "node:path";
import dotenv from "dotenv";

(() => {
  dotenv.config({ path: ".env.local", override: false });
  dotenv.config({ path: ".env", override: false });
})();

const {
  PORT = "4300",
  NODE_ENV = "development",
  IMAGE_PROVIDER = "gemini",
  OPENAI_API_KEY,
  OPENAI_IMAGE_MODEL = "dall-e-2",
  GEMINI_API_KEY,
  GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image",
  GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta",
  PUBLIC_URL,
  STORAGE_ROOT
} = process.env;

if (IMAGE_PROVIDER === "openai" && !OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required when IMAGE_PROVIDER=openai");
}

if (IMAGE_PROVIDER === "gemini" && !GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required when IMAGE_PROVIDER=gemini");
}

const trimmedPublic = (PUBLIC_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");

export const env = {
  port: Number.parseInt(PORT, 10),
  nodeEnv: NODE_ENV,
  imageProvider: IMAGE_PROVIDER,
  openAiApiKey: OPENAI_API_KEY,
  openAiImageModel: OPENAI_IMAGE_MODEL,
  geminiApiKey: GEMINI_API_KEY,
  geminiImageModel: GEMINI_IMAGE_MODEL,
  geminiApiBaseUrl: GEMINI_API_BASE_URL.replace(/\/$/, ""),
  publicUrl: trimmedPublic,
  storageRoot: STORAGE_ROOT ? path.resolve(STORAGE_ROOT) : path.join(process.cwd(), "storage")
};


