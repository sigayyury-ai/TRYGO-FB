import "dotenv/config";

const {
  MONGODB_URI,
  PORT = "4000",
  NODE_ENV = "development",
  WEBSITE_PAGES_SERVICE_URL = "http://localhost:4400"
} = process.env;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

export const env = {
  mongoUri: MONGODB_URI,
  port: parseInt(PORT, 10),
  nodeEnv: NODE_ENV,
  websitePagesServiceUrl: WEBSITE_PAGES_SERVICE_URL.replace(/\/$/, "")
};

