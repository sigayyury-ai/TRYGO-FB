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

export interface GenerateIdeasOptions {
  context: SeoContextSnapshot;
  category: string;
  count?: number;
  language?: string;
  model?: string;
}

export interface GeneratedIdeaResult {
  title: string;
  summary: string;
  clusterTitle?: string | null;
  category?: string | null;
}

export function buildPrompt(
  context: SeoContextSnapshot,
  category: string,
  count: number,
  language: string
): string {
  const { project, hypothesis, icp, leanCanvas } = context;

  const projectTitle = project?.title || "Unknown Project";
  const projectDescription = project?.description || "No description";
  const hypothesisTitle = hypothesis?.title || "Unknown Hypothesis";
  const hypothesisDescription = hypothesis?.description || hypothesis?.title || "No hypothesis";

  // Extract Lean Canvas data
  const problems = Array.isArray(leanCanvas?.problems) ? leanCanvas.problems : [];
  const solutions = Array.isArray(leanCanvas?.solutions) ? leanCanvas.solutions : [];
  const uniqueValueProposition = leanCanvas?.uniqueValueProposition || leanCanvas?.uvp || "";
  const keyMetrics = leanCanvas?.keyMetrics || [];
  const channels = Array.isArray(leanCanvas?.channels) ? leanCanvas.channels : [];

  // Extract ICP data
  const persona = icp?.persona || "";
  const pains = Array.isArray(icp?.pains) ? icp.pains : [];
  const goals = Array.isArray(icp?.goals) ? icp.goals : [];
  const triggers = Array.isArray(icp?.triggers) ? icp.triggers : [];
  const benefits = Array.isArray(icp?.benefits) ? icp.benefits : [];
  const objections = Array.isArray(icp?.objections) ? icp.objections : [];
  const customerJourney = icp?.customerJourney || "";
  const jtbd = icp?.jtbd || "";

  let instructions = "";
  let categorySpecificData = "";
  const categoryUpper = category.toUpperCase();

  switch (categoryUpper) {
    case "PAIN":
      instructions = `Generate diverse article ideas that address customer pain points. Include:
- How-to guides solving specific problems (e.g., "How to solve [pain] in [timeframe]")
- Problem-focused articles (e.g., "The problem of [pain] and how to overcome it")
- Educational content about pain points (e.g., "Why [pain] happens and what to do")
- Comparison articles (e.g., "Traditional approach vs modern solution for [pain]")
- Case studies showing how others solved [pain]
- Templates and frameworks for addressing [pain] (e.g., "[Pain] Assessment Template", "[Pain] Solution Framework")
- Series of articles (e.g., "Week 1: Understanding [pain]", "Week 2: Solving [pain]")
- Content tailored to different customer journey stages (awareness, consideration, decision)

Each idea should be tied to real pains from ICP data when available, but can also explore related industry pain points. Consider the customer journey stage when generating ideas - early-stage content should focus on problem awareness, while later-stage content should focus on solutions.`;
      if (pains.length > 0) {
        categorySpecificData = `CUSTOMER PAINS (use these specific pains - prioritize mentioning them in titles):
${pains.map((p: any) => `- ${p}`).join("\n")}

PROBLEMS FROM LEAN CANVAS:
${problems.length > 0 ? problems.map((p: any) => `- ${p}`).join("\n") : "- No problems defined"}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nUse the customer journey stages to tailor content - create awareness-stage content for early journey, solution-focused content for later stages.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConsider how these pains relate to the job customers are trying to accomplish.` : ""}

CRITICAL: Each article idea should address at least one pain point from the list above. Use appropriate language-specific terms for problems, pain points, challenges, and difficulties in titles when relevant. Mix specific pain-focused articles with broader how-to guides and educational content about these problems.`;
      } else {
        categorySpecificData = `No specific pain points available. Generate ideas about common industry pain points related to the project, including how-to guides, problem-solving frameworks, and educational content.
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nTailor content ideas to different stages of the customer journey.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConsider the job customers are trying to accomplish when generating pain-focused content.` : ""}`;
      }
      break;

    case "GOAL":
      instructions = `Generate diverse article ideas that help customers achieve their goals. Include:
- How-to guides for achieving goals (e.g., "How to achieve [goal] in [timeframe]")
- Step-by-step tutorials (e.g., "Step-by-step guide to [goal]")
- Goal-oriented frameworks (e.g., "[Goal] Achievement Framework", "[Goal] Planning Template")
- Comparison articles (e.g., "Method A vs Method B for achieving [goal]")
- Case studies of goal achievement (e.g., "How [company] achieved [goal]")
- Series of articles (e.g., "Week 1: Setting [goal]", "Week 2: Working towards [goal]")
- Checklists and templates (e.g., "[Goal] Checklist", "[Goal] Planning Template")
- Educational content about goals (e.g., "Why [goal] matters and how to reach it")
- Content aligned with customer journey stages (awareness: goal setting, consideration: goal planning, decision: goal achievement)

Each idea should help the audience achieve their goals, using specific goals from ICP when available, or common business objectives related to the project. Consider how goals relate to the job customers are trying to accomplish.`;
      if (goals.length > 0) {
        categorySpecificData = `CUSTOMER GOALS (use these specific goals - prioritize them):
${goals.map((g: any) => `- ${g}`).join("\n")}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nAlign content with journey stages - early content for goal discovery, later content for goal achievement.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConnect goals to the job customers hire solutions to accomplish.` : ""}

Each article idea should help achieve at least one goal from the list above. Mix actionable how-to guides with frameworks, templates, and educational content about goal achievement.`;
      } else {
        categorySpecificData = `No specific goals available. Generate ideas about common business objectives related to the project, including how-to guides, frameworks, and step-by-step tutorials.
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nCreate content for different journey stages.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConsider the job customers are trying to accomplish.` : ""}`;
      }
      break;

    case "TRIGGER":
      instructions = `Generate diverse article ideas focused on buyer triggers and decision moments. Include:
- How-to guides for decision-making (e.g., "How to decide when to [trigger]")
- Educational content about triggers (e.g., "When is the right time to [trigger]?")
- Comparison articles (e.g., "Early vs late [trigger]: what's better?")
- Case studies of decision moments (e.g., "How [company] decided to [trigger]")
- Frameworks for decision-making (e.g., "[Trigger] Decision Framework", "[Trigger] Timing Template")
- Series of articles (e.g., "Part 1: Recognizing [trigger]", "Part 2: Acting on [trigger]")
- Checklists and guides (e.g., "[Trigger] Checklist", "Signs you're ready for [trigger]")
- Educational content about JTBD (e.g., "Understanding the job customers hire [solution] to do")

Each idea should address when and why customers make decisions, using specific triggers from ICP when available, or common decision moments in the industry.`;
      if (triggers.length > 0) {
        categorySpecificData = `BUYER TRIGGERS / JTBD (use these specific triggers - prioritize them):
${triggers.map((t: any) => `- ${t}`).join("\n")}
${jtbd ? `\nJobs To Be Done: ${jtbd}` : ""}

Each article idea should relate to at least one trigger or decision moment from the list above. Mix how-to guides with frameworks, case studies, and educational content about decision-making and JTBD.`;
      } else {
        categorySpecificData = "No specific triggers available. Generate ideas about common decision moments in the industry, including how-to guides, decision frameworks, and educational content about when and why customers make decisions.";
      }
      break;

    case "BENEFIT":
      instructions = `Generate diverse commercial landing page ideas focused on benefits and positive outcomes. Include:
- Benefit-focused landing pages (e.g., "How [benefit] transforms your [outcome]")
- Comparison pages (e.g., "[Product] vs [Competitor]: which delivers [benefit] better?")
- Case studies showcasing benefits (e.g., "How [company] achieved [benefit] with [solution]")
- ROI calculators and tools (e.g., "[Benefit] ROI Calculator", "[Benefit] Impact Estimator")
- Educational content about benefits (e.g., "Why [benefit] matters for [persona]")
- Series of benefit-focused pages (e.g., "Benefit 1: [benefit]", "Benefit 2: [benefit]")
- Testimonials and social proof pages (e.g., "Real results: [benefit] in action")
- Feature-benefit mapping pages (e.g., "How [feature] delivers [benefit]")
- Content for decision-stage of customer journey (highlighting outcomes and results)

Each idea should highlight specific benefits and connect them to the value proposition, using benefits from ICP when available. Connect benefits to the job customers are trying to accomplish.`;
      if (benefits.length > 0) {
        categorySpecificData = `CUSTOMER BENEFITS (use these specific benefits - prioritize them):
${benefits.map((b: any) => `- ${b}`).join("\n")}

UNIQUE VALUE PROPOSITION:
${uniqueValueProposition || "Not defined"}

SOLUTIONS FROM LEAN CANVAS:
${solutions.length > 0 ? solutions.map((s: any) => `- ${s}`).join("\n") : "- No solutions defined"}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nFocus on decision-stage content that demonstrates benefits and outcomes.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nShow how benefits help customers accomplish the job they're hiring the solution to do.` : ""}

Each idea must highlight specific benefits from the list above and connect them to the value proposition. Mix benefit-focused landing pages with comparison pages, case studies, and educational content.`;
      } else {
        categorySpecificData = `UNIQUE VALUE PROPOSITION:
${uniqueValueProposition || "Not defined"}

SOLUTIONS FROM LEAN CANVAS:
${solutions.length > 0 ? solutions.map((s: any) => `- ${s}`).join("\n") : "- No solutions defined"}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nCreate benefit-focused content for decision stage.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConnect benefits to the job customers are trying to accomplish.` : ""}

Focus on product features and value propositions. Generate benefit-focused landing pages, comparison pages, and educational content about the value proposition.`;
      }
      break;

    case "FEATURE":
      instructions = `Generate diverse commercial landing page ideas focused on product features. Include:
- Feature showcase pages (e.g., "How [feature] works in [product]", "[Feature] in [product]: complete guide")
- Feature comparison pages (e.g., "[Product] vs [Competitor]: [feature] comparison")
- How-to guides for features (e.g., "How to use [feature] to [outcome]")
- Feature case studies (e.g., "How [company] uses [feature] to [result]")
- Feature tutorials and walkthroughs (e.g., "[Feature] tutorial: step-by-step guide")
- Feature benefits pages (e.g., "Why [feature] matters: [benefits]")
- Series of feature pages (e.g., "Feature spotlight: [feature 1]", "Feature spotlight: [feature 2]")
- Integration pages (e.g., "How [feature] integrates with [tool/platform]")
- Feature updates and announcements (e.g., "New: [feature] now available")
- Content for consideration and decision stages (detailed feature exploration)

Each idea should showcase specific features from the solutions list and explain their value, using product features from Lean Canvas. Connect features to how they help customers accomplish their jobs.`;
      categorySpecificData = `UNIQUE VALUE PROPOSITION:
${uniqueValueProposition || "Not defined"}

SOLUTIONS FROM LEAN CANVAS (these are your product features - use them in ideas):
${solutions.length > 0 ? solutions.map((s: any) => `- ${s}`).join("\n") : "- No solutions/features defined"}

KEY METRICS:
${keyMetrics.length > 0 ? keyMetrics.map((m: any) => `- ${m}`).join("\n") : "- No metrics defined"}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nCreate feature content for consideration and decision stages - detailed exploration of how features work.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nShow how each feature helps customers accomplish the job they're hiring the solution to do.` : ""}

Each idea must showcase specific features from the solutions list above and explain their value. Mix feature showcase pages with how-to guides, comparisons, case studies, and tutorials.`;
      break;

    case "FAQ":
      instructions = `Generate diverse FAQ article ideas that address common customer objections and questions. Include:
- Direct FAQ articles (e.g., "FAQ: [common question]", "Answering: [question]")
- How-to guides answering questions (e.g., "How to [solve problem from question]")
- Comparison articles addressing concerns (e.g., "[Product] vs [Alternative]: answering your questions")
- Educational content addressing objections (e.g., "Why [objection] isn't a problem: [explanation]")
- Case studies addressing concerns (e.g., "How we solved [concern] for [customer]")
- Series of FAQ articles (e.g., "FAQ Part 1: [topic]", "FAQ Part 2: [topic]")
- Myth-busting articles (e.g., "Debunking [myth/objection]: the truth about [topic]")
- Troubleshooting guides (e.g., "Common issues with [topic] and how to fix them")
- Content for all journey stages (awareness: general questions, consideration: comparison questions, decision: implementation questions)

Each idea should answer a specific concern or question, using objections from ICP when available, or common questions related to the project and industry. Consider where in the customer journey these questions arise.`;
      if (objections.length > 0) {
        categorySpecificData = `COMMON OBJECTIONS (use these specific objections - prioritize them):
${objections.map((o: any) => `- ${o}`).join("\n")}
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nMap objections to journey stages - early-stage questions vs decision-stage concerns.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nAddress how objections relate to the job customers are trying to accomplish.` : ""}

Each FAQ idea should address at least one objection from the list above. Mix direct FAQ articles with how-to guides, comparison articles, and educational content that addresses these concerns.`;
      } else {
        categorySpecificData = `No specific objections available. Generate ideas about common questions related to the project and industry, including FAQ articles, how-to guides, and educational content that addresses typical concerns.
${customerJourney ? `\nCUSTOMER JOURNEY MAP:\n${customerJourney}\n\nCreate FAQ content for different journey stages.` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nConsider questions customers have about accomplishing their job.` : ""}`;
      }
      break;

    case "INFO":
      instructions = `Generate diverse informational and educational article ideas. Include:
- How-to guides and tutorials (e.g., "How to [action] for [persona]", "Complete guide to [topic]")
- Educational articles (e.g., "Understanding [topic]: a guide for [persona]")
- Industry insights and trends (e.g., "[Topic] trends in [year]", "The future of [topic]")
- Best practices articles (e.g., "Best practices for [topic] in [industry]")
- Comparison articles (e.g., "[Method A] vs [Method B]: which is better?")
- Case studies and examples (e.g., "How [company] achieved [outcome] with [approach]")
- Series of educational articles (e.g., "Part 1: Introduction to [topic]", "Part 2: Advanced [topic]")
- Checklists and templates (e.g., "[Topic] Checklist", "[Topic] Template")
- Tools and calculators (e.g., "[Topic] Calculator", "[Topic] Estimator")
- Research and data-driven content (e.g., "[Topic] statistics and insights", "[Topic] research findings")
- Content aligned with customer journey stages (awareness: educational, consideration: comparison, decision: implementation guides)
- Content that helps customers understand how to accomplish their jobs

Each idea should educate potential customers about relevant topics, tailored to the target persona at different stages of their journey and aligned with the job they're trying to accomplish.`;
      categorySpecificData = `CUSTOMER PERSONA:
${persona || "Not defined"}

CUSTOMER JOURNEY MAP:
${customerJourney || "Not defined"}
${customerJourney ? `\nUse the customer journey stages to create appropriate content:\n- Awareness stage: Educational content, industry insights, problem awareness\n- Consideration stage: Comparison articles, best practices, how-to guides\n- Decision stage: Implementation guides, case studies, tools and templates` : ""}
${jtbd ? `\nJOBS TO BE DONE:\n${jtbd}\n\nCreate educational content that helps customers understand and accomplish the job they're hiring solutions to do.` : ""}

Focus on educating the target persona at different stages of their journey. Mix how-to guides with educational articles, best practices, case studies, and tools that help the persona learn and grow.`;
      break;

    default:
      instructions = "Create helpful content ideas.";
      categorySpecificData = "";
  }

  // Build comprehensive context
  // TODO: Future enhancement - integrate competitor data from market research
  // When competitor parsing is implemented, add competitor context here:
  // - Competitor names, websites, and descriptions
  // - Competitor content strategies (blog topics, lead magnets, CTAs)
  // - Competitor positioning and messaging
  // - Competitive gaps and opportunities for content differentiation
  const leanCanvasSection = `
LEAN CANVAS CONTEXT:
- Problems: ${problems.length > 0 ? problems.join("; ") : "Not defined"}
- Solutions: ${solutions.length > 0 ? solutions.join("; ") : "Not defined"}
- Unique Value Proposition: ${uniqueValueProposition || "Not defined"}
- Key Metrics: ${keyMetrics.length > 0 ? keyMetrics.join("; ") : "Not defined"}
- Channels: ${channels.length > 0 ? channels.join("; ") : "Not defined"}
`;

  const icpSection = `
ICP CONTEXT:
- Persona: ${persona || "Not defined"}
- Pains: ${pains.length > 0 ? pains.join("; ") : "None"}
- Goals: ${goals.length > 0 ? goals.join("; ") : "None"}
- Triggers: ${triggers.length > 0 ? triggers.join("; ") : "None"}
- Benefits: ${benefits.length > 0 ? benefits.join("; ") : "None"}
- Objections: ${objections.length > 0 ? objections.join("; ") : "None"}
${customerJourney ? `- Customer Journey: ${customerJourney}` : ""}
${jtbd ? `- Jobs To Be Done: ${jtbd}` : ""}
`;

  const prompt = `You are an SEO content strategist. Generate ${count} blog article ideas that are SPECIFICALLY tailored to the provided context.

CRITICAL: Each idea MUST be directly related to the project, hypothesis, ICP data, and Lean Canvas information provided below. Do NOT generate generic ideas.

Write in ${language}.

${instructions}

PROJECT CONTEXT:
- Project Title: ${projectTitle}
- Project Description: ${projectDescription}

HYPOTHESIS CONTEXT:
- Hypothesis Title: ${hypothesisTitle}
- Hypothesis Description: ${hypothesisDescription}

${leanCanvasSection}

${icpSection}

${categorySpecificData}

OUTPUT (JSON only):
{
  "ideas": [
    {
      "title": "Article title (under 90 characters, specific to the context)",
      "summary": "Brief description (under 280 characters, explaining how it relates to the context)"
    }
  ]
}

REQUIREMENTS:
- Titles under 90 characters
- Summaries under 280 characters
- ${count} ideas total
- Each idea MUST reference specific data from the context above (pains, goals, solutions, etc.)
- Ideas must be specific, actionable, and directly relevant to the target persona
- Avoid generic or vague topics - use the actual data provided
- Each idea should be unique and valuable
- Connect ideas to the hypothesis and project description
- Use the Lean Canvas solutions and problems to inform the ideas
- Vary content types: include how-to guides, comparisons, case studies, templates, series, and educational content
- For PAIN category: Titles should mention the pain/problem using appropriate language-specific terms for problems, pain points, challenges, and difficulties when relevant
- Always mention the target persona in titles when relevant (use the persona name from ICP context)
- Consider generating comparison content ideas (e.g., "[Product] vs [Competitor]") when appropriate
- Include ideas for templates, checklists, frameworks, and tools when they add value
- IMPORTANT: Generate all content in the specified language (${language}). Do not mix languages.
`;

  return prompt;
}

const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function dedupeIdeas(ideas: GeneratedIdeaResult[]): GeneratedIdeaResult[] {
  const seen = new Set<string>();
  const unique: GeneratedIdeaResult[] = [];

  for (const idea of ideas) {
    const titleKey = normalizeKey(idea.title);
    const summaryKey = normalizeKey(idea.summary);
    const combinedKey = `${titleKey}::${summaryKey}`;

    if (!seen.has(combinedKey)) {
      seen.add(combinedKey);
      unique.push(idea);
    }
  }

  return unique;
}

/**
 * Check if an idea already exists in the database by comparing normalized title and summary
 */
export async function checkDuplicateIdea(
  projectId: string,
  hypothesisId: string,
  title: string,
  summary: string
): Promise<boolean> {
  const { SeoContentItem } = await import("../../db/models/SeoContentItem.js");
  
  const normalizedTitle = normalizeKey(title);
  const normalizedSummary = normalizeKey(summary);
  
  // Find all existing ideas for this project/hypothesis
  const existingIdeas = await SeoContentItem.find({
    projectId,
    hypothesisId,
    status: { $ne: "archived" }
  }).exec();
  
  // Check if any existing idea matches (normalized comparison)
  for (const existing of existingIdeas) {
    const existingTitle = normalizeKey(existing.title);
    const existingSummary = normalizeKey(existing.outline || "");
    
    // Check if title matches (allowing some variation)
    const titleSimilarity = existingTitle === normalizedTitle;
    
    // Check if summary matches (allowing some variation)
    const summarySimilarity = existingSummary === normalizedSummary || 
      (normalizedSummary.length > 0 && existingSummary.includes(normalizedSummary.substring(0, 50))) ||
      (existingSummary.length > 0 && normalizedSummary.includes(existingSummary.substring(0, 50)));
    
    if (titleSimilarity || (titleSimilarity && summarySimilarity)) {
      return true; // Duplicate found
    }
  }
  
  return false; // No duplicate
}

export async function generateIdeasFromOpenAI(
  options: GenerateIdeasOptions
): Promise<GeneratedIdeaResult[]> {
  const { context, category, count = 3, language = "English", model } = options;

  // Проверка наличия OpenAI ключа
  if (!env.openAiApiKey) {
    const error = "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.";
    console.error(`[generator] ${error}`);
    throw new Error(error);
  }

  // Логирование для отладки
  const projectTitle = context.project?.title || "Unknown";
  const hypothesisTitle = context.hypothesis?.title || "Unknown";
  console.log(`[generator] Category: ${category} | Project: ${projectTitle} | Hypothesis: ${hypothesisTitle} | Count: ${count} | Language: ${language}`);

  const prompt = buildPrompt(context, category, count, language);

  const client = getOpenAIClient();
  const primaryModel = model && model.trim().length > 0 ? model.trim() : env.openAiModel;
  
  console.log(`[generator] Using model: ${primaryModel}`);

  async function runOnce(usingModel: string) {
    // Check if model is gpt-5.1 or newer (uses max_completion_tokens instead of max_tokens)
    const isGpt5Model = usingModel?.includes("gpt-5");
    return client.chat.completions.create({
      model: usingModel,
      temperature: 0.7,
      ...(isGpt5Model ? { max_completion_tokens: 1000 } : { max_tokens: 1000 }), // gpt-5.1 uses max_completion_tokens
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an SEO content strategist. Always respond with valid JSON."
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
    console.log(`[generator] Calling OpenAI API with model: ${primaryModel}`);
    response = await runOnce(primaryModel);
    console.log(`[generator] OpenAI API response received`);
  } catch (err: any) {
    const fallback = env.openAiModel;
    const canFallback = primaryModel !== fallback;
    console.error("[generator] Model call failed for", primaryModel, "error:", err?.message || err);
    if (err?.status) {
      console.error("[generator] OpenAI API status:", err.status);
    }
    if (err?.response) {
      console.error("[generator] OpenAI API response:", JSON.stringify(err.response, null, 2));
    }
    if (canFallback) {
      console.warn("[generator] Falling back to default model:", fallback);
      try {
        response = await runOnce(fallback);
        console.log(`[generator] Fallback model succeeded`);
      } catch (fallbackErr: any) {
        console.error("[generator] Fallback model also failed:", fallbackErr?.message || fallbackErr);
        throw new Error(`OpenAI API failed: ${err?.message || err}. Fallback also failed: ${fallbackErr?.message || fallbackErr}`);
      }
    } else {
      throw err;
    }
  }

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    console.error("[generator] Empty response from OpenAI");
    console.error("[generator] Full response:", JSON.stringify(response, null, 2));
    throw new Error("Empty response from OpenAI");
  }

  console.log(`[generator] Received content length: ${content.length} characters`);
  console.log(`[generator] Content preview: ${content.substring(0, 200)}...`);

  let parsed: any;
  try {
    parsed = JSON.parse(content);
    console.log(`[generator] JSON parsed successfully, found ${parsed.ideas?.length || 0} ideas`);
  } catch (error) {
    console.error("[generator] JSON parse error:", error);
    console.error("[generator] Full response content:", content);
    throw new Error(`Invalid JSON from OpenAI: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
    console.error("[generator] Invalid response structure. Expected 'ideas' array, got:", Object.keys(parsed));
    console.error("[generator] Parsed content:", JSON.stringify(parsed, null, 2));
    throw new Error(`Invalid response structure: expected 'ideas' array, got ${typeof parsed.ideas}`);
  }

  const ideas: GeneratedIdeaResult[] = parsed.ideas
    .filter((idea: any) => idea && (idea.title || idea.summary)) // Фильтруем пустые идеи
    .map((idea: any) => ({
      title: idea.title?.trim() || "",
      summary: idea.summary?.trim() || "",
      clusterTitle: null,
      category: null
    }))
    .filter((idea: GeneratedIdeaResult) => idea.title.length > 0); // Убираем идеи без заголовка

  if (ideas.length === 0) {
    console.warn("[generator] No valid ideas found in response");
    throw new Error("No valid ideas generated from OpenAI");
  }

  const uniqueIdeas = dedupeIdeas(ideas);

  if (uniqueIdeas.length < ideas.length) {
    console.log(`[generator] Removed ${ideas.length - uniqueIdeas.length} duplicate ideas`);
  }

  console.log(`[generator] Returning ${uniqueIdeas.length} unique ideas`);
  return uniqueIdeas;
}

