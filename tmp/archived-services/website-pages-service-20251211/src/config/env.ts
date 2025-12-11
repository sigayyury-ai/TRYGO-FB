import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

const {
  PORT = "4400",
  OPENAI_API_KEY
} = process.env;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required for website pages service");
}

export const env = {
  port: parseInt(PORT, 10),
  openAiApiKey: OPENAI_API_KEY
};
