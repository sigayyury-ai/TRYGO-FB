import OpenAI from "openai";
import { env } from "../config/env.js";
import { buildWebsitePagePrompt } from "./buildWebsitePagePrompt.js";

let openAiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: env.openAiApiKey });
  }
  return openAiClient;
}

export interface WebsitePageContextPayload {
  project?: Record<string, any> | null;
  hypothesis?: Record<string, any> | null;
  leanCanvas?: Record<string, any> | null;
  icp?: Record<string, any> | null;
  language?: string | null;
}

export interface WebsitePageClusterPayload {
  id: string;
  title: string;
  intent: string;
  keywords: string[];
}

export interface WebsitePageGenerationRequest {
  context: WebsitePageContextPayload;
  cluster: WebsitePageClusterPayload;
  persona?: string | null;
}

export interface WebsitePageGenerationResult {
  payload: any;
  prompt: string;
  model: string;
}

export async function generateWebsitePageIdea(
  params: WebsitePageGenerationRequest
): Promise<WebsitePageGenerationResult> {
  const { context, cluster, persona } = params;
  const { prompt } = buildWebsitePagePrompt({
    context,
    cluster,
    personaOverride: persona
  });

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a senior conversion strategist. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response for website page generation");
  }

  let payload: any;
  try {
    payload = JSON.parse(content);
  } catch (error) {
    throw new Error("Failed to parse website page generation response");
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Website page payload is not an object");
  }

  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new Error("Website page payload missing sections");
  }

  return {
    payload,
    prompt,
    model: response.model ?? "unknown"
  };
}
