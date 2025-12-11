import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { SeoContextSnapshot } from "../context/seoContext.js";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!env.openAiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    openaiClient = new OpenAI({ apiKey: env.openAiApiKey });
  }
  return openaiClient;
}

export interface KeywordDiscoveryOptions {
  context: SeoContextSnapshot;
  seedKeywords?: string[];
  language?: string;
  count?: number;
  model?: string;
}

export interface KeywordCandidate {
  keyword: string;
  searchVolume?: number | null;
  difficulty?: number | null;
  intent: string;
  source?: string | null;
  opportunityScore?: number | null;
}

export function buildDiscoveryPrompt(
  context: SeoContextSnapshot,
  seedKeywords: string[],
  count: number,
  language: string
): string {
  const { project, hypothesis, icp } = context;
  const projectTitle = project?.title || "Unknown Project";
  const projectDescription = project?.description || "No description";
  const hypothesisTitle = hypothesis?.title || "Untitled hypothesis";
  const hypothesisDescription = hypothesis?.description || "No hypothesis description provided.";

  const pains = Array.isArray(icp?.pains) ? icp?.pains : [];
  const goals = Array.isArray(icp?.goals) ? icp?.goals : [];
  const triggers = Array.isArray(icp?.triggers) ? icp?.triggers : [];

  const formattedSeeds = seedKeywords.length
    ? seedKeywords.map((keyword) => `- ${keyword}`).join("\n")
    : "(no explicit seeds provided)";

  const formattedPains = pains.length
    ? pains.map((item: any) => `- ${item}`).join("\n")
    : "No pains captured.";

  const formattedGoals = goals.length
    ? goals.map((item: any) => `- ${item}`).join("\n")
    : "No goals captured.";

  const formattedTriggers = triggers.length
    ? triggers.map((item: any) => `- ${item}`).join("\n")
    : "No triggers captured.";

  return `You are an enterprise SEO analyst. Build a keyword universe for the following SaaS project.
Return ${count} high-value keywords in ${language}.

PROJECT CONTEXT:
- Title: ${projectTitle}
- Description: ${projectDescription}
- Hypothesis name: ${hypothesisTitle}
- Hypothesis summary: ${hypothesisDescription}

ICP INSIGHTS:
Pains:\n${formattedPains}
Goals:\n${formattedGoals}
Triggers:\n${formattedTriggers}

SEED KEYWORDS:\n${formattedSeeds}

INSTRUCTIONS:
- Diversify across funnel stages and intents.
- Include long-tail and head terms.
- Estimate monthly search volume (integer) and difficulty (0-100).
- Provide an intent label from {commercial, transactional, informational, navigational}.
- Provide source names (e.g., "GPT synthesis", "Seed expansion").
- Compute an opportunity score 0-100 (higher is better) combining volume and difficulty.

RESPONSE FORMAT (valid JSON only):
{
  "keywords": [
    {
      "keyword": "string",
      "searchVolume": 0,
      "difficulty": 0,
      "intent": "commercial | transactional | informational | navigational",
      "source": "string",
      "opportunityScore": 0
    }
  ]
}

REQUIREMENTS:
- Exactly ${count} keyword objects.
- Do not include commentary outside JSON.`;
}

function normaliseNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return null;
}

function normaliseIntent(intent: unknown): string {
  if (typeof intent !== "string") {
    return "informational";
  }
  const value = intent.trim().toLowerCase();
  if (value === "commercial" || value === "transactional" || value === "informational" || value === "navigational") {
    return value;
  }
  return "informational";
}

export async function generateKeywordUniverse(
  options: KeywordDiscoveryOptions
): Promise<KeywordCandidate[]> {
  const { context, seedKeywords = [], language = "English", count = 20, model } = options;

  console.log("[keywordDiscovery] === START ===");
  console.log("[keywordDiscovery] Seeds:", seedKeywords.length);
  console.log("[keywordDiscovery] Project:", context.project?.title || "MISSING");
  console.log("[keywordDiscovery] Hypothesis:", context.hypothesis?.title || "MISSING");

  const prompt = buildDiscoveryPrompt(context, seedKeywords, count, language);
  console.log("[keywordDiscovery] PROMPT:");
  console.log(prompt);
  console.log("[keywordDiscovery] === END PROMPT ===");

  const client = getOpenAIClient();
  const requestedModel = model && model.trim().length > 0 ? model.trim() : env.openAiModel;
  console.log("[keywordDiscovery] Model (requested->used):", model || "(none)", "->", requestedModel);

  async function run(usingModel: string) {
    return client.chat.completions.create({
      model: usingModel,
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an SEO research analyst. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
  }

  let response;
  try {
    response = await run(requestedModel);
  } catch (err: any) {
    const fallbackModel = env.openAiModel;
    const canFallback = requestedModel !== fallbackModel;
    console.warn("[keywordDiscovery] Model call failed for", requestedModel, "error:", err?.message || err);
    if (!canFallback) {
      throw err;
    }
    console.warn("[keywordDiscovery] Falling back to default model:", fallbackModel);
    response = await run(fallbackModel);
  }

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  console.log("[keywordDiscovery] Response length:", content.length);

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error("[keywordDiscovery] Parse error. Response sample:", content.substring(0, 300));
    throw new Error("Invalid JSON from OpenAI");
  }

  if (!Array.isArray(parsed.keywords)) {
    throw new Error("Invalid response structure: keywords missing");
  }

  return parsed.keywords.map((item: any) => ({
    keyword: typeof item.keyword === "string" ? item.keyword.trim() : "",
    searchVolume: normaliseNumber(item.searchVolume),
    difficulty: normaliseNumber(item.difficulty),
    intent: normaliseIntent(item.intent),
    source: typeof item.source === "string" ? item.source.trim() : null,
    opportunityScore: normaliseNumber(item.opportunityScore)
  })).filter((item: KeywordCandidate) => item.keyword.length > 0);
}
