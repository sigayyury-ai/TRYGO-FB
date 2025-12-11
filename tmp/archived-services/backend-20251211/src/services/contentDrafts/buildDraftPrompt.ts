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

function buildWebsitePagePromptOld(options: DraftPromptOptions): { prompt: string } {
  const { context, idea, contentType, language, contentGoal, funnelStage, specialRequirements } =
    options;

  const projectTitle = context.project?.title ?? "Unknown Project";
  const projectDescription =
    (context.project?.description as string | undefined)?.trim() ?? "Description missing.";
  const hypothesisTitle = context.hypothesis?.title ?? "Unknown Hypothesis";
  const hypothesisDescription =
    (context.hypothesis?.description as string | undefined)?.trim() ??
    "Hypothesis description missing.";

  const icp = context.icp ?? null;

  const icpPersona = typeof icp?.persona === "string" ? icp.persona : null;
  const pains = fallbackList(icp?.pains);
  const goals = fallbackList(icp?.goals);
  const triggers = fallbackList(icp?.triggers);
  const objections = fallbackList(icp?.objections);
  const customerJourney =
    typeof icp?.customerJourney === "string" ? icp.customerJourney : undefined;

  const leanCanvas = context.leanCanvas ?? {};
  const leanProblems = fallbackList(leanCanvas?.problems);
  const leanSolutions = fallbackList(leanCanvas?.solutions);
  const leanUVP =
    typeof leanCanvas?.uniqueValueProposition === "string"
      ? leanCanvas.uniqueValueProposition
      : undefined;
  const leanChannels = fallbackList(leanCanvas?.channels);

  // Resolve language with proper priority: explicit > context > default
  const resolvedLanguage = language ?? context.language;
  
  if (!resolvedLanguage) {
    console.warn("[buildDraftPrompt] No language found in context or parameters, defaulting to English");
  } else {
    console.log("[buildDraftPrompt] Using language:", resolvedLanguage, "(explicit:", language, ", context:", context.language, ")");
  }
  
  const finalLanguage = resolvedLanguage ?? "English";
  const isRussian = finalLanguage.toLowerCase() === "russian" || finalLanguage.toLowerCase() === "ru";

  const goalsBlock = goals.length
    ? goals.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: добавить цели ICP" : "- TODO: add ICP goals");
  const painsBlock = pains.length
    ? pains.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: добавить боли ICP" : "- TODO: add ICP pains");
  const triggersBlock = triggers.length
    ? triggers.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: добавить триггеры / JTBD" : "- TODO: add triggers / JTBD");
  const objectionsBlock = objections.length
    ? objections.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: добавить возражения" : "- TODO: add objections");
  const customerJourneyBlock = customerJourney ?? (isRussian ? "TODO: описать путь клиента" : "TODO: describe customer journey");

  const leanProblemsBlock = leanProblems.length
    ? leanProblems.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: заполнить проблемы (Lean Canvas)" : "- TODO: fill problems (Lean Canvas)");
  const leanSolutionsBlock = leanSolutions.length
    ? leanSolutions.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: заполнить решения (Lean Canvas)" : "- TODO: fill solutions (Lean Canvas)");
  const leanSolutionsList = leanSolutions.length ? leanSolutions.join("; ") : null;
  const leanUVPBlock = leanUVP ?? (isRussian ? "TODO: указать уникальное ценностное предложение" : "TODO: specify unique value proposition");
  const leanChannelsBlock = leanChannels.length
    ? leanChannels.map((item) => `- ${item}`).join("\n")
    : (isRussian ? "- TODO: добавить каналы/сообщения" : "- TODO: add channels/messaging");
  const primaryLeanSolution = leanSolutions.length > 0 ? leanSolutions[0] : null;

  const contentGoalText =
    contentGoal?.trim() ||
    (isRussian 
      ? "Определи и сформулируй основную бизнес-цель статьи на основе контекста и идеи (не допускай TODO)."
      : "Define and formulate the main business goal of the article based on context and idea (do not allow TODO).");
  const funnelStageText =
    funnelStage?.trim() ||
    (isRussian
      ? "Solution-aware / BOFU — читатель знает проблему и рассматривает конкретные решения"
      : "Solution-aware / BOFU — reader knows the problem and is considering specific solutions");
  const specialRequirementsText =
    specialRequirements?.trim() || (isRussian
      ? "Нет дополнительных требований (можно уточнить)."
      : "No additional requirements (can be specified).");

  const ideaCategory = idea.category ?? "info";

  const prompt = `You are a senior content strategist. Produce a full ${contentType.replace(
    "_",
    " "
  )} draft in valid JSON, grounded strictly in the provided context. If data is missing, insert a "TODO" note describing what is needed.

###
CONTENT SETTINGS
- Content type: ${contentType}
- Language: ${finalLanguage}
- Funnel stage: ${funnelStageText}
- Content goal / KPI: ${contentGoalText}
- Idea category: ${ideaCategory}
- Additional requirements: ${specialRequirementsText}

###
PROJECT OVERVIEW
- Title: ${projectTitle}
- Description: ${projectDescription}

###
HYPOTHESIS
- Title: ${hypothesisTitle}
- Summary: ${hypothesisDescription}

###
ICP SNAPSHOT
Persona: ${icpPersona ?? "TODO: указать персону / сегмент"}
Goals:
${goalsBlock}
Pains:
${painsBlock}
Triggers / JTBD:
${triggersBlock}
Objections:
${objectionsBlock}
Customer journey notes:
${customerJourneyBlock}

###
LEAN CANVAS EXCERPT
Unique Value Proposition: ${leanUVPBlock}
Problems:
${leanProblemsBlock}
Solutions:
${leanSolutionsBlock}
Channels / Messaging:
${leanChannelsBlock}

###
BACKLOG IDEA
- Title: ${idea.title}
- Description: ${idea.description}

###
OUTPUT FORMAT (return JSON only):
{
  "title": "Title under 90 characters",
  "summary": "Lead paragraph under 280 characters",
  "outline": [
    {
      "heading": "H2 heading",
      "body": "Section body with optional H3 subheadings (use Markdown or HTML-like tags)",
      "notes": "Editor notes / TODOs"
    }
  ],
  "seo": {
    "keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
    "internalLinks": [
      { "anchor": "Anchor text", "target": "Target page slug or TODO" }
    ],
    "externalLinks": [
      { "anchor": "Anchor text", "url_hint": "Suggested external source or TODO" }
    ],
    "schema": "Suggested JSON-LD schema type or TODO",
    "metaDescription": "Meta description under 160 characters",
    "slug_hint": "Slug suggestion or TODO"
  },
  "compliance": [
    "Mandatory disclaimers or TODO"
  ]
}

###
WRITING RULES
- CRITICAL: Write all content in ${finalLanguage} language. All text, headings, paragraphs, and responses must be in ${finalLanguage}.
- Tone: expert yet empathetic; speak directly to the persona that already understands the problem and is looking for a solution.
- Highlight the product (name: ${projectTitle}) naturally: mention real features from Lean Canvas Solutions/UVP, don't invent new ones. Don't overemphasize the product, but show how it helps address pains/goals.
- Total text volume (sum of all outline.body) — at least 6000-8000 words. This is CRITICAL for comprehensive, valuable content. If there's not enough data to cover the topic, add TODO with description of needed information.
- For each outline.body element, prepare 5-8 substantial paragraphs (each paragraph should be 4-6 sentences, 80-120 words).
- Prioritize narrative, detailed explanations over bullet lists. Use lists only when absolutely necessary (e.g., step-by-step instructions, comparisons). Maximum 1-2 lists per section, and each list should be followed by 2-3 paragraphs of detailed explanation.
- Each section should tell a complete story: introduce the concept, explain it in detail with examples, provide context, discuss implications, and connect to the next section.
- CRITICAL: Write in-depth, comprehensive content. Each paragraph should add substantial value and detail. Avoid superficial, bullet-point-only content.
- In the introductory paragraph (first outline.body), clearly state the material's goal: briefly convey what the reader should achieve and what business result the company needs.
- Always include blocks: problem, solution, benefits with numbers/facts, social proof, answers to objections.
- Work as a professional copywriter and follow these eight principles:
  1. Clarify the task and article's role: show what problem the audience solves and what value the material provides.
  2. Define the main idea: formulate one key message that the reader can retell in one sentence.
  3. Gather context and facts: use arguments, examples, logical explanations, data/observations, real cases, comparisons or metaphors; avoid fluff.
  4. Build structure like a screenwriter: hook → context → analysis/solution → examples/proof → conclusion and action.
  5. Write lively and humanly: short paragraphs, strong verbs, specifics, natural intonations, minimal bureaucracy and clichés.
  6. Support the reader: anticipate questions, provide answers, and make smooth transitions between blocks.
  7. Check the text for voice: ensure the style sounds like an expert-human, not an encyclopedia.
  8. See through the reader's eyes: evaluate what holds attention, whether there's anything unnecessary, what the reader will take away and what they'll do next; finalize the text accordingly.
- For each publication, form a unique, logically segmented structure: vary the order and names of sections, avoid templates.
- Generate expressive and unique H2 headings (avoid dry ones like "Advantages", "Problem", etc.); create phrases that reflect the section's essence and grab attention while maintaining block sequence.
- Include social proof (cases, reviews, testimonials) with specific numerical results if data is available; if absent, indicate what information needs to be clarified.
- Each outline.body block should start with a meaningful <p> (without pseudo-headings like "Introduction:" or lines like "Validating Market Demand"); don't insert additional headings (neither in tags nor as plain text), because the main block heading is passed through the heading field and rendered as <h2> on the frontend. To emphasize a thought, use <strong> inside <p>, not a separate heading.
- In the final text (outline.body), use explicit HTML tags: wrap narrative text in <p>, mark lists as <ul>/<li> or <ol>/<li>; if a nested subsection is needed, use <h3>/<h4>, but don't duplicate the main heading and don't insert lines without tags that look like a separate heading.
- Add separate sections with analytics (data/trends), practical tips, and FAQ (≥3 questions). If the stage is not BOFU — FAQ can be marked TODO. For FAQ, start the section with <h2>FAQ</h2>, and format each question as <p><strong>Question?</strong></p> followed by an answer paragraph (don't use <h2> for questions).
- In the final section, analyze all solutions from Lean Canvas Solutions (${leanSolutionsList ?? "TODO: list solutions"}), select the most relevant to the article topic (e.g., ${primaryLeanSolution ?? "specify key solution"}), explain why it's better than others, and show how it helps solve the key problem.
- Select 2–3 highly relevant SEO keywords (based on ${idea.title} and description ${idea.description}) and naturally repeat them in H2 headings and throughout the text, but no more than 3-5 times.
- Follow SEO best practices: structure content with subheadings, lists, tables; add internal/external links (internalLinks/externalLinks), include PAA-styled FAQ.
- Return ONLY the JSON object.`;

  return { prompt };
}

export function buildDraftPrompt(options: DraftPromptOptions): { prompt: string; detectedType?: string } {
  const { context, idea, contentType, language, contentGoal, funnelStage, specialRequirements } =
    options;

  // For website_page (commercial pages), use the old prompt system
  if (contentType === "website_page") {
    const result = buildWebsitePagePromptOld({
      context,
      idea,
      contentType,
      language,
      contentGoal,
      funnelStage,
      specialRequirements
    });
    return { prompt: result.prompt };
  }

  // For articles, use the new system with content type detection
  const typeDetection = detectContentTemplateType(idea);
  const detectedType = typeDetection.type;

  // Resolve language with proper priority: explicit > context > default
  // Only use "English" as default if no language is found at all
  const resolvedLanguage = language ?? context.language;
  
  if (!resolvedLanguage) {
    console.warn("[buildDraftPrompt] No language found in context or parameters, defaulting to English");
  } else {
    console.log("[buildDraftPrompt] Using language:", resolvedLanguage);
  }

  // Use content-type-specific prompt template
  const prompt = buildContentTypeSpecificPrompt(detectedType, {
    context,
    idea,
    contentType,
      language: resolvedLanguage ?? "English",
    contentGoal,
    funnelStage,
    specialRequirements
  });

  return { prompt, detectedType };
}
