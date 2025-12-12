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

  // Note: We'll build creative context inline in the prompt instead of literal context blocks

  // Build creative inspiration from context (not literal instructions)
  let creativeContext = "";
  if (icpContext || projectContext || hypothesisContext) {
    creativeContext = "\n\n## Creative Inspiration (use as mood/theme, not literal requirements)\n";
    
    if (icpContext) {
      const persona = icpContext.persona || "";
      const pains = Array.isArray(icpContext.pains) ? icpContext.pains : [];
      const goals = Array.isArray(icpContext.goals) ? icpContext.goals : [];
      
      if (persona || pains.length > 0 || goals.length > 0) {
        creativeContext += "Think about the emotional tone and visual metaphors that would resonate with this audience. ";
        if (persona) creativeContext += `Consider what visuals would speak to ${persona}. `;
        if (pains.length > 0) creativeContext += `The image might subtly reflect themes of challenge, growth, or transformation. `;
        if (goals.length > 0) creativeContext += `Consider visuals that evoke aspiration, progress, or achievement. `;
        creativeContext += "But don't be literal—use these as creative inspiration, not strict requirements.\n";
      }
    }
    
    if (projectContext?.leanCanvas?.uniqueValueProposition) {
      creativeContext += `The article relates to: ${projectContext.leanCanvas.uniqueValueProposition}. Use this as thematic inspiration, not a literal scene requirement.\n`;
    }
  }

  const prompt = `You are a creative visual director. Your task is to imagine a compelling, authentic photograph that would make someone want to read an article titled "${title}".

${description ? `Article theme: ${description}\n` : ""}
${creativeContext}

## CRITICAL: Balance Creativity with Relevance

**The image must be BOTH:**
1. **Relevant to the article topic** - it should clearly relate to and illustrate the subject matter
2. **Creative and non-clichéd** - avoid the most obvious, overused visual interpretations

**Before describing the scene:**
1. Identify the most literal/clichéd visual for this topic (e.g., "marketing" → person at desk with charts)
2. Identify what the topic is REALLY about conceptually (e.g., "marketing challenges" → learning, strategy, growth, connection)
3. Find a creative visual that connects the concept to the topic, but avoids the cliché

**Universal clichés to avoid:**
- ❌ Generic office/workplace scenes with people at desks
- ❌ Stock photo-style poses and compositions
- ❌ The same visual approach for similar topics
- ❌ Repetitive imagery patterns (same angle, same setting, same subject type)
- ❌ Completely abstract images that have no connection to the topic

**Creative approaches that STILL relate to the topic:**
- ✅ Visual metaphors that connect to the topic (e.g., "marketing challenges" → someone learning, studying, planning, connecting with others)
- ✅ Environmental storytelling relevant to the topic (workspaces, learning spaces, collaborative spaces - but shown creatively)
- ✅ Action and movement related to the topic (not just static sitting)
- ✅ Different perspectives on the same subject (e.g., marketing → strategy session, learning moment, connection, growth)
- ✅ Symbolic representations that clearly relate to the topic
- ✅ Unique angles and compositions that show the topic in a new light

## Your Creative Mission

**First, understand the topic:** What is this article really about? What are the core concepts, themes, or ideas?

**Then, brainstorm 3-5 visual approaches that are BOTH creative AND relevant:**
1. What's the most literal/clichéd approach? (Reject this, but note what it's trying to show)
2. What's a creative metaphorical interpretation that STILL clearly relates to the topic?
3. What's an environmental/contextual approach that shows the topic in a new way?
4. What's a symbolic representation that connects to the topic's core concepts?
5. What's an unexpected perspective that reveals something about the topic?

**Choose the approach that:**
- ✅ Clearly relates to and illustrates the article topic
- ✅ Avoids clichés and obvious interpretations
- ✅ Is visually interesting and engaging
- ✅ Makes sense when someone reads the article title

Imagine a photograph that's visually interesting, authentic, and engaging—not generic or templated. Think about what would catch someone's eye and make them curious about the article.

**Be creative and varied.** Consider:
- Different visual metaphors and approaches (journey, puzzle, bridge, growth, connection, discovery, transformation)
- Various moods and atmospheres (dramatic, peaceful, energetic, contemplative, mysterious, hopeful)
- Different times of day, seasons, or settings (dawn, night, urban, nature, abstract spaces, interiors, exteriors)
- Unique perspectives and compositions (bird's eye, worm's eye, close-up details, wide environmental, unusual angles)
- Natural, unposed moments vs. staged scenes
- Objects, environments, or abstract concepts as main subjects (not always people)
- Different scales (macro details, wide landscapes, intimate moments)

## What to Describe

Write a flowing, natural description in English. Include:
- What's in the scene (be creative—avoid the most obvious/literal interpretation)
- The mood and atmosphere you want to convey
- Lighting and color tones that fit the theme
- Composition style (vary it—don't always use the same angle or framing)
- Key visual elements that relate to the article topic

**Think metaphorically and symbolically, but stay connected to the topic.** 
- If your first thought is the most literal interpretation, reject it
- But don't go so abstract that the image has no connection to the article topic
- Consider what the topic represents conceptually, then find a visual that represents that concept
- Think about visual metaphors that capture the essence AND relate to the topic
- Explore different ways to represent the same concept, but ensure the connection is clear
- The image should make sense when someone sees it alongside the article title

## Important Guidelines

- **Stay relevant** - the image must clearly relate to and illustrate the article topic
- **Be creative** - interpret the topic creatively, but don't lose the connection
- **Vary your approach** - each image should feel unique, not like a template
- **Natural and authentic** - avoid stock photo clichés
- **NO text, logos, UI elements, or graphics** - pure photography
- **Professional quality** - but with artistic vision
- **Balance** - creative interpretation that still makes sense for the topic
- **Challenge yourself** - if your first thought is a cliché, reject it, but ensure your alternative still relates to the topic
- **Avoid repetition** - don't use the same visual approach for similar topics
- **Test relevance** - if someone sees just the image, they should be able to guess it relates to the article topic

## Output Format

Write ONLY a flowing scene description in English. No markdown, no lists, no structure. Just natural, creative prose that an image AI can use. Make it vivid and specific, but let it breathe with creative freedom.

**Remember: Find the sweet spot between creativity and relevance. Avoid clichés, but ensure the image clearly relates to the article topic. If the image could be for any random article, it's too abstract. If it's the most obvious interpretation, it's too clichéd.**

Describe the scene:`;

  try {
    console.log("[generateSceneDescription] Generating scene description with OpenAI...");
    console.log("[generateSceneDescription] Model:", model);
    console.log("[generateSceneDescription] Title:", title);

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a creative visual director who imagines compelling, varied, and authentic photographs. You balance creativity with relevance: you avoid clichés and templates, but ensure images clearly relate to and illustrate the article topic. You identify the most obvious/literal visual interpretation, reject it, then find a creative alternative that still clearly connects to the topic. You think creatively, use visual metaphors, explore different perspectives, and create unique concepts that make sense for the subject matter. Each description must feel fresh, creative, non-formulaic, AND relevant to the article topic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9, // Higher temperature for more creative variation
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
