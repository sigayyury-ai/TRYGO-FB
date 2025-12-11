import OpenAI from "openai";
import { config } from "../../../constants/config/env";

interface SceneDescriptionRequest {
  title: string;
  description?: string;
  projectContext?: {
    title?: string;
    leanCanvas?: {
      problems?: string[];
      solutions?: string[];
      uniqueValueProposition?: string;
    };
  };
  hypothesisContext?: {
    title?: string;
    description?: string;
  };
  icpContext?: {
    persona?: string;
    pains?: string[];
    goals?: string[];
    triggers?: string[];
  };
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!config.SEO_AGENT.openAiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    openaiClient = new OpenAI({ apiKey: config.SEO_AGENT.openAiApiKey });
  }
  return openaiClient;
}

/**
 * Generate detailed scene description for image generation
 * This description will be used to create a precise visual representation
 */
export async function generateSceneDescription(
  request: SceneDescriptionRequest
): Promise<string> {
  const { title, description, projectContext, hypothesisContext, icpContext } = request;

  if (!config.SEO_AGENT.openAiApiKey) {
    throw new Error("OpenAI API key is not configured for scene description generation");
  }

  const client = getOpenAIClient();
  const model = config.SEO_AGENT.openAiModel || "gpt-4o";

  // Build audience context
  let audienceContext = "";
  if (icpContext) {
    const persona = icpContext.persona || "";
    const pains = Array.isArray(icpContext.pains) ? icpContext.pains : [];
    const goals = Array.isArray(icpContext.goals) ? icpContext.goals : [];
    const triggers = Array.isArray(icpContext.triggers) ? icpContext.triggers : [];

    if (persona || pains.length > 0 || goals.length > 0 || triggers.length > 0) {
      audienceContext = "\n\n## Target Audience Context\n";
      if (persona) {
        audienceContext += `Target Persona: ${persona}\n`;
      }
      if (pains.length > 0) {
        audienceContext += `Their Pain Points: ${pains.join(", ")}\n`;
      }
      if (goals.length > 0) {
        audienceContext += `Their Goals: ${goals.join(", ")}\n`;
      }
      if (triggers.length > 0) {
        audienceContext += `Their Triggers: ${triggers.join(", ")}\n`;
      }
      audienceContext += "\nThe image should resonate with this audience and reflect their context, challenges, and aspirations.";
    }
  }

  // Build project context
  let projectInfo = "";
  if (projectContext) {
    const projectTitle = projectContext.title || "";
    const problems = Array.isArray(projectContext.leanCanvas?.problems) 
      ? projectContext.leanCanvas.problems 
      : [];
    const solutions = Array.isArray(projectContext.leanCanvas?.solutions) 
      ? projectContext.leanCanvas.solutions 
      : [];
    const uvp = projectContext.leanCanvas?.uniqueValueProposition || "";

    if (projectTitle || problems.length > 0 || solutions.length > 0 || uvp) {
      projectInfo = "\n\n## Project Context\n";
      if (projectTitle) {
        projectInfo += `Project: ${projectTitle}\n`;
      }
      if (uvp) {
        projectInfo += `Value Proposition: ${uvp}\n`;
      }
      if (problems.length > 0) {
        projectInfo += `Problems Addressed: ${problems.join(", ")}\n`;
      }
      if (solutions.length > 0) {
        projectInfo += `Solutions Offered: ${solutions.join(", ")}\n`;
      }
    }
  }

  // Build hypothesis context
  let hypothesisInfo = "";
  if (hypothesisContext) {
    const hypothesisTitle = hypothesisContext.title || "";
    const hypothesisDesc = hypothesisContext.description || "";
    if (hypothesisTitle || hypothesisDesc) {
      hypothesisInfo = "\n\n## Hypothesis Context\n";
      if (hypothesisTitle) {
        hypothesisInfo += `Hypothesis: ${hypothesisTitle}\n`;
      }
      if (hypothesisDesc) {
        hypothesisInfo += `Description: ${hypothesisDesc}\n`;
      }
    }
  }

  const prompt = `You are a professional visual director and scene designer. Your task is to create a detailed, precise scene description for a realistic photograph that will illustrate an article.

## Article Information
Title: "${title}"
${description ? `Description: "${description}"` : ""}
${audienceContext}
${projectInfo}
${hypothesisInfo}

## Your Task
Create a comprehensive scene description that specifies EXACTLY what should appear in the image. This description will be used by an image generation AI to create a realistic photograph.

## Scene Description Requirements

Your description must include:

1. **Main Subject/Characters:**
   - Who or what is the main focus? (if people: their approximate age, gender, appearance, clothing, posture, expression)
   - Their position in the frame (foreground, center, background)
   - What they are doing (specific actions, gestures, interactions)

2. **Environment & Setting:**
   - Location type (office, home, outdoor, workspace, etc.)
   - Specific details about the environment (furniture, equipment, natural elements, architectural features)
   - Time of day and lighting conditions (natural light, artificial light, time of day)
   - Weather or atmospheric conditions if relevant

3. **Composition & Layout:**
   - Camera angle and perspective (eye-level, slightly elevated, close-up, wide shot)
   - Foreground elements (what's closest to camera)
   - Middle ground elements (main focus area)
   - Background elements (what's in the distance)
   - Depth of field (what's in focus vs blurred)

4. **Objects & Props:**
   - Specific objects that should be visible (tools, devices, documents, items relevant to the topic)
   - Their placement and arrangement
   - Their state or condition (new, used, organized, etc.)

5. **Lighting & Mood:**
   - Light source direction and quality (soft, harsh, natural, warm, cool)
   - Shadows and highlights
   - Overall mood and atmosphere (professional, friendly, energetic, calm, etc.)
   - Color palette hints (warm tones, cool tones, neutral, vibrant)

6. **Details & Textures:**
   - Surface textures (wood, metal, fabric, paper, etc.)
   - Material qualities (matte, glossy, rough, smooth)
   - Small details that add realism and context

## Important Guidelines

- Be SPECIFIC and DETAILED - the more precise your description, the better the image will be
- Focus on REALISTIC, NATURAL scenes - this is for a professional article
- NO text, logos, UI elements, memes, or infographics should be mentioned
- The scene should directly relate to and illustrate the article topic
- Consider the target audience - the image should resonate with them
- Think about what would make a reader stop and engage with the article
- Use professional, cinematic language but keep it clear and actionable

## Output Format

Provide ONLY the scene description text. No markdown, no headers, no bullet points. Just a flowing, detailed description in English that an image generation AI can use directly.

Start your description now:`;

  try {
    console.log("[generateSceneDescription] Generating scene description with OpenAI...");
    console.log("[generateSceneDescription] Model:", model);
    console.log("[generateSceneDescription] Title:", title);

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a professional visual director specializing in creating detailed scene descriptions for realistic photography."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const sceneDescription = response.choices[0]?.message?.content?.trim();
    
    if (!sceneDescription) {
      throw new Error("OpenAI returned empty scene description");
    }

    console.log("[generateSceneDescription] Scene description generated:", sceneDescription.substring(0, 100) + "...");
    console.log("[generateSceneDescription] Scene description length:", sceneDescription.length, "chars");

    return sceneDescription;
  } catch (error: any) {
    console.error("[generateSceneDescription] Error generating scene description:", error);
    throw new Error(`Failed to generate scene description: ${error.message || error}`);
  }
}
