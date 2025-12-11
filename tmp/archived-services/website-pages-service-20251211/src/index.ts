import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import {
  generateWebsitePageIdea,
  WebsitePageGenerationRequest
} from "./services/generator.js";

class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const ensureContextFields = (payload: WebsitePageGenerationRequest) => {
  const missing: string[] = [];
  const { context } = payload;
  if (!context?.icp?.persona) {
    missing.push("persona profile");
  }
  const problems = context?.leanCanvas?.problems;
  if (!Array.isArray(problems) || problems.length === 0) {
    missing.push("Lean Canvas problems");
  }
  const solutions = context?.leanCanvas?.solutions;
  if (!Array.isArray(solutions) || solutions.length === 0) {
    missing.push("Lean Canvas solutions");
  }
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required context: ${missing.join(", ")}. Update the hypothesis data and try again.`
    );
  }
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate", async (req, res) => {
  try {
    const payload = req.body as WebsitePageGenerationRequest;
    if (!payload?.context || !payload?.cluster) {
      throw new ValidationError("context and cluster payloads are required");
    }
    ensureContextFields(payload);
    const result = await generateWebsitePageIdea(payload);
    res.json(result);
  } catch (error: any) {
    console.error("[website-pages-service]", error);
    const status = error instanceof ValidationError ? error.status : 500;
    res.status(status).json({ error: error?.message ?? "Internal server error" });
  }
});

app.listen(env.port, () => {
  console.log(`🚀 Website Pages service ready at http://localhost:${env.port}`);
});
