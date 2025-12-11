import { Router, type Request, type Response, type NextFunction } from "express";
import { generateWebsitePageIdea, type WebsitePageGenerationRequest } from "../services/seoAgent/websitePages/generator";

const router = Router();

class ValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

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

/**
 * POST /api/website-pages/generate
 * Generate website page content
 */
router.post("/generate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("[Website Pages API] POST /api/website-pages/generate");
    
    const payload = req.body as WebsitePageGenerationRequest;
    
    if (!payload?.context || !payload?.cluster) {
      return res.status(400).json({ error: "context and cluster payloads are required" });
    }
    
    ensureContextFields(payload);
    
    const result = await generateWebsitePageIdea(payload);
    
    console.log("[Website Pages API] ✅ Generated website page");
    res.json(result);
  } catch (error: any) {
    console.error("[Website Pages API] Error in POST /api/website-pages/generate:", error);
    
    if (error instanceof ValidationError) {
      return res.status(error.status).json({ error: error.message });
    }
    
    const status = error?.status || 500;
    res.status(status).json({ 
      error: error?.message ?? "Internal server error" 
    });
  }
});

export default router;
