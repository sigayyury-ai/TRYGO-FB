import OpenAI from "openai";
import { env } from "../../config/env.js";
import type { SeoContextSnapshot } from "../context/seoContext.js";
import type { SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea.js";
import type { ContentDraftType } from "../../db/models/SeoContentDraft.js";
import { buildDraftPrompt } from "./buildDraftPrompt.js";

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

export interface DraftGenerationParams {
  context: SeoContextSnapshot;
  idea: SeoBacklogIdeaDoc;
  userId: string;
  contentType: ContentDraftType;
  contentGoal?: string | null;
  funnelStage?: string | null;
  specialRequirements?: string | null;
  languageOverride?: string | null;
  model?: string | null;
}

export interface GeneratedDraftPayload {
  title: string;
  summary: string;
  body: string;
  structure: Record<string, any>;
  model: string;
  prompt: string;
}

const DEFAULT_MODEL = env.openAiModel;

export async function generateDraftFromOpenAI(
  params: DraftGenerationParams
): Promise<GeneratedDraftPayload> {
  const {
    context,
    idea,
    contentType,
    contentGoal,
    funnelStage,
    specialRequirements,
    languageOverride,
    model
  } = params;

  const resolvedLanguage = languageOverride ?? context.language ?? "Russian";

  const { prompt } = buildDraftPrompt({
    context,
    idea,
    contentType,
    language: resolvedLanguage,
    contentGoal,
    funnelStage,
    specialRequirements
  });

  const client = getOpenAIClient();
  const requestedModel = model?.trim()?.length ? model.trim() : DEFAULT_MODEL;

  async function runCompletion(usingModel: string) {
    return client.chat.completions.create({
      model: usingModel,
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a senior content strategist. Always respond with valid JSON."
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
    response = await runCompletion(requestedModel);
  } catch (error) {
    if (requestedModel !== DEFAULT_MODEL) {
      response = await runCompletion(DEFAULT_MODEL);
    } else {
      throw error;
    }
  }

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI returned empty response for draft generation");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawContent);
  } catch (error) {
    throw new Error("Failed to parse OpenAI response for draft generation");
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Draft payload is not an object");
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
  const outline = Array.isArray(payload.outline) ? payload.outline : [];

  if (!title || !summary || outline.length === 0) {
    throw new Error("Draft payload missing title, summary, or outline");
  }

  const body = outline
    .map((item: any) => {
      const heading = typeof item.heading === "string" ? item.heading.trim() : "";
      const sectionBody = typeof item.body === "string" ? item.body.trim() : "";
      const headingHtml = heading ? `<h2>${heading}</h2>` : "";
      if (headingHtml && sectionBody) {
        return `${headingHtml}\n\n${sectionBody}`;
      }
      return headingHtml || sectionBody;
    })
    .filter((section: string) => section && section.trim().length > 0)
    .join("\n\n");

  return {
    title,
    summary,
    body,
    structure: payload,
    model: response.model ?? requestedModel,
    prompt
  };
}

