import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

const {
  MONGODB_URI,
  PORT = "4200",
  SEMANTICS_SERVICE_ORIGIN = "http://localhost:5173"
} = process.env;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

export const env = {
  mongoUri: MONGODB_URI,
  port: Number.parseInt(PORT, 10),
  corsOrigin: SEMANTICS_SERVICE_ORIGIN
};




