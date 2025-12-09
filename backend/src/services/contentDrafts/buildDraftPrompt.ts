import type { SeoContextSnapshot } from "../context/seoContext.js";
import type { SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea.js";
import { detectContentTemplateType } from "./contentTypeDetector.js";
import { buildContentTypeSpecificPrompt } from "./promptTemplates.js";

export interface DraftPromptOptions {
  context: SeoContextSnapshot;
  idea: SeoBacklogIdeaDoc;
  contentType: "article" | "website_page";
  language?: string | null;
  contentGoal?: string | null;
  funnelStage?: string | null;
  specialRequirements?: string | null;
}

const fallbackList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  return [];
};

export function buildDraftPrompt(options: DraftPromptOptions): { prompt: string; detectedType?: string } {
  const { context, idea, contentType, language, contentGoal, funnelStage, specialRequirements } =
    options;

  // Detect content type based on idea
  const typeDetection = detectContentTemplateType(idea);
  const detectedType = typeDetection.type;

  // Use content-type-specific prompt template
  const prompt = buildContentTypeSpecificPrompt(detectedType, {
    context,
    idea,
    contentType,
    language: language ?? context.language ?? "Russian",
    contentGoal,
    funnelStage,
    specialRequirements
  });

  return { prompt, detectedType };
}
