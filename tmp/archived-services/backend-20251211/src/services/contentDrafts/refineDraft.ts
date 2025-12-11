import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { SeoContentDraftDoc } from "../../db/models/SeoContentDraft.js";

let openAIClient: OpenAI | null = null;

const getClient = () => {
  if (!openAIClient) {
    if (!env.openAiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    openAIClient = new OpenAI({ apiKey: env.openAiApiKey });
  }
  return openAIClient;
};

interface RefineDraftParams {
  draft: SeoContentDraftDoc;
  instructions: string;
  ctaUrl?: string | null;
  ctaText?: string | null;
}

interface RefineDraftResult {
  body: string;
  summary?: string;
}

export async function refineDraftWithOpenAI(
  params: RefineDraftParams
): Promise<RefineDraftResult> {
  const { draft, instructions, ctaUrl, ctaText } = params;
  if (!draft.body.trim().length) {
    throw new Error("Draft body is empty – nothing to refine");
  }
  const client = getClient();
  const prompt = buildRefinementPrompt({
    instructions,
    ctaUrl,
    ctaText,
    body: draft.body,
    summary: draft.summary
  });

  const response = await client.chat.completions.create({
    model: env.openAiModel,
    temperature: 0.3,
    max_tokens: 4000, // Increased to ensure full article is returned, not truncated
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert editor. Your task is to EDIT existing content IN PLACE by modifying paragraphs and sentences, not by appending new content. Integrate changes naturally into the existing text flow while preserving the article structure."
      },
      { role: "user", content: prompt }
    ]
  });
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response for refinement");
  }
  let payload: any;
  try {
    payload = JSON.parse(content);
  } catch (error) {
    throw new Error("Failed to parse OpenAI refinement response");
  }
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid refinement payload");
  }
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : undefined;
  if (!body) {
    throw new Error("Refinement payload missing body");
  }
  return { body, summary };
}

function buildRefinementPrompt(options: {
  body: string;
  summary?: string | null;
  instructions: string;
  ctaUrl?: string | null;
  ctaText?: string | null;
}): string {
  const { body, summary, instructions, ctaUrl, ctaText } = options;
  const ctaBlock = ctaUrl
    ? `CTA requirements: link to ${ctaUrl} with text "${ctaText ?? "Learn more"}" inserted naturally into the conclusion (do NOT add a separate CTA heading).`
    : "CTA requirements: leave existing CTA blocks/links untouched unless the refinement instructions explicitly ask to change them.";
  return `You are editing an existing HTML article. Apply the refinement instructions by MODIFYING the existing content IN PLACE, not by appending new content at the end.

CRITICAL RULES:
- EDIT the existing paragraphs, sentences, and sections to incorporate the instructions
- DO NOT add new sections or paragraphs at the end unless explicitly requested
- DO NOT duplicate existing content
- INTEGRATE changes naturally into the existing text flow
- Preserve every existing <h2> heading (same order/count). If you change a title, keep it wrapped in <h2> tags so the structure stays identical
- Keep tone consistent with the original
- Maintain the same overall length unless instructions specify otherwise

Original summary (optional): ${summary ?? "N/A"}
Original article HTML:
"""
${body}
"""

Refinement instructions:
${instructions}

${ctaBlock}

IMPORTANT: Return the COMPLETE edited article, not just the changes. The output should be a full HTML document with all modifications integrated into the existing content structure.

Return strict JSON: {"body": "updated HTML", "summary": "updated summary or original"}`;
}
