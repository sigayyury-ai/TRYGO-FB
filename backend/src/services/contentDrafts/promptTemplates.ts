// Content-specific prompt templates for different content types
import type { SeoContextSnapshot } from "../context/seoContext.js";
import type { SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea.js";
import type { ContentTemplateType } from "./contentTypeDetector.js";

export interface TemplateContext {
  context: SeoContextSnapshot;
  idea: SeoBacklogIdeaDoc;
  contentType: "article" | "website_page";
  language: string;
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

export function buildContentTypeSpecificPrompt(
  templateType: ContentTemplateType,
  templateContext: TemplateContext
): string {
  const { context, idea, contentType, language, contentGoal, funnelStage, specialRequirements } = templateContext;

  const projectTitle = context.project?.title ?? "Unknown Project";
  const projectDescription = (context.project?.description as string | undefined)?.trim() ?? "Description missing.";
  const hypothesisTitle = context.hypothesis?.title ?? "Unknown Hypothesis";
  const hypothesisDescription = (context.hypothesis?.description as string | undefined)?.trim() ?? "Hypothesis description missing.";
  
  const icp = context.icp ?? null;
  const icpPersona = typeof icp?.persona === "string" ? icp.persona : null;
  const pains = fallbackList(icp?.pains);
  const goals = fallbackList(icp?.goals);
  const triggers = fallbackList(icp?.triggers);
  const objections = fallbackList(icp?.objections);
  const customerJourney = typeof icp?.customerJourney === "string" ? icp.customerJourney : undefined;
  
  const leanCanvas = context.leanCanvas ?? {};
  const leanProblems = fallbackList(leanCanvas?.problems);
  const leanSolutions = fallbackList(leanCanvas?.solutions);
  const leanUVP = typeof leanCanvas?.uniqueValueProposition === "string" ? leanCanvas.uniqueValueProposition : undefined;
  const leanUnfairAdvantages = fallbackList(leanCanvas?.unfairAdvantages);

  // Select relevant trigger/pain/feature based on idea
  const selectedTrigger = triggers.length > 0 ? triggers[0] : null;
  const selectedPain = pains.length > 0 ? pains[0] : null;
  const selectedFeature = leanSolutions.length > 0 ? leanSolutions[0] : null;

  const resolvedLanguage = language ?? "Russian";
  const contentGoalText = contentGoal?.trim() || "Определи и сформулируй основную бизнес-цель статьи на основе контекста и идеи.";
  const funnelStageText = funnelStage?.trim() || "Solution-aware / BOFU — читатель знает проблему и рассматривает конкретные решения";
  const specialRequirementsText = specialRequirements?.trim() || "Нет дополнительных требований.";

  const baseInstructions = getBaseWritingRules(resolvedLanguage, projectTitle, leanSolutions, leanUnfairAdvantages, pains);

  // Build common context block
  const commonContext = `###
CONTENT SETTINGS
- Content type: ${contentType}
- Detected template type: ${templateType}
- Language: ${resolvedLanguage}
- Funnel stage: ${funnelStageText}
- Content goal / KPI: ${contentGoalText}
- Idea category: ${idea.category}
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
Goals: ${goals.length ? goals.map(g => `- ${g}`).join("\n") : "- TODO: добавить цели ICP"}
Pains: ${pains.length ? pains.map(p => `- ${p}`).join("\n") : "- TODO: добавить боли ICP"}
Triggers / JTBD: ${triggers.length ? triggers.map(t => `- ${t}`).join("\n") : "- TODO: добавить триггеры"}
Objections: ${objections.length ? objections.map(o => `- ${o}`).join("\n") : "- TODO: добавить возражения"}
Customer journey: ${customerJourney ?? "TODO: описать путь клиента"}

###
LEAN CANVAS EXCERPT
Unique Value Proposition: ${leanUVP ?? "TODO: указать UVP"}
Problems: ${leanProblems.length ? leanProblems.map(p => `- ${p}`).join("\n") : "- TODO: заполнить проблемы"}
Solutions: ${leanSolutions.length ? leanSolutions.map(s => `- ${s}`).join("\n") : "- TODO: заполнить решения"}
Unfair Advantages: ${leanUnfairAdvantages.length ? leanUnfairAdvantages.map(a => `- ${a}`).join("\n") : "- TODO: указать уникальные преимущества"}

###
BACKLOG IDEA
- Title: ${idea.title}
- Description: ${idea.description}

###
TITLE REQUIREMENTS (CRITICAL):
- Length: 50-70 characters (optimal: 50-60)
- Word count: 5-9 words (optimal)
- MUST include at least ONE of the following:
  * Question format: "Как...", "Почему...", "Что такое...", "Когда..."
  * Power words: "лучший", "проверенный", "эффективный", "секрет", "гайд", "руководство"
  * Numbers: "5 способов", "10 советов", "за 30 дней", "3 шага"
- MUST include SEO keywords from the idea/topic
- Avoid generic words: "статья", "информация", "материал"
- Make it specific and valuable to the reader

OUTPUT FORMAT (return JSON only):
{
  "title": "Title 50-70 characters with question/power word/number + SEO keywords",
  "summary": "Lead paragraph under 280 characters",
  "outline": [
    {
      "heading": "H2 heading",
      "body": "Section body using HTML: <p>, <ul>/<ol> with <li>, <strong>, <h3> for subsections (NO <h2> inside body)",
      "notes": "Editor notes / TODOs"
    }
  ],
  "cta": {
    "headline": "Short CTA headline under 60 characters",
    "body": "2-3 persuasive sentences",
    "buttonLabel": "Action label (≤20 chars)",
    "url_hint": "Suggested URL or TODO",
    "tone": "Tone description"
  },
  "seo": {
    "keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
    "internalLinks": [{"anchor": "Text", "target": "slug"}],
    "externalLinks": [{"anchor": "Text", "url_hint": "URL"}],
    "schema": "JSON-LD schema type or TODO",
    "metaDescription": "Meta description under 160 characters",
    "slug_hint": "Slug suggestion or TODO"
  },
  "compliance": ["Mandatory disclaimers or TODO"]
}

###`;

  const typeSpecificInstructions = (() => {
    switch (templateType) {
      case "trigger":
        return buildTriggerPrompt({
          idea,
          selectedTrigger,
          selectedPain,
          baseInstructions,
          projectTitle,
          leanUVP
        });

      case "pain_point":
        return buildPainPointPrompt({
          idea,
          selectedPain,
          selectedTrigger,
          baseInstructions,
          projectTitle,
          leanUVP
        });

      case "feature":
        return buildFeaturePrompt({
          idea,
          selectedFeature,
          baseInstructions,
          projectTitle,
          leanUVP,
          leanUnfairAdvantages
        });

      case "onboarding":
        return buildOnboardingPrompt({
          idea,
          baseInstructions,
          projectTitle,
          leanSolutions
        });

      case "solution":
        return buildSolutionPrompt({
          idea,
          selectedPain,
          selectedFeature,
          baseInstructions,
          projectTitle,
          leanUVP
        });

      case "benefit":
        return buildBenefitPrompt({
          idea,
          baseInstructions,
          projectTitle,
          leanUnfairAdvantages
        });

      case "faq":
        return buildFAQPrompt({
          idea,
          baseInstructions
        });

      default:
        return buildGeneralPrompt({
          idea,
          baseInstructions
        });
    }
  })();

  return `${commonContext}

###
CONTENT-SPECIFIC INSTRUCTIONS (Template: ${templateType.toUpperCase()})
${typeSpecificInstructions}

Return ONLY the JSON object.`;
}

function generateProductSynonyms(projectTitle: string): string[] {
  const titleLower = projectTitle.toLowerCase();
  const synonyms: string[] = [];
  
  // Extract potential brand name (first word if it's a single capitalized word)
  const words = projectTitle.split(/\s+/);
  const firstWord = words[0];
  const isBrandName = firstWord.length > 0 && 
                      firstWord[0] === firstWord[0].toUpperCase() && 
                      words.length > 1;
  
  // Universal synonyms generation
  // 1. Original title
  synonyms.push(projectTitle);
  
  // 2. Brand name (if detected) or first word as brand
  if (isBrandName) {
    synonyms.push(firstWord);
    synonyms.push(`платформа ${firstWord}`);
  }
  
  // 3. Descriptive variations
  synonyms.push(`${projectTitle} (платформа)`);
  synonyms.push(`инструмент ${projectTitle}`);
  synonyms.push(`сервис ${projectTitle}`);
  
  // 4. Shortened versions (if title is long)
  if (words.length > 2) {
    // Take first 2-3 words
    const shortVersion = words.slice(0, 2).join(" ");
    if (shortVersion.length < projectTitle.length * 0.7) {
      synonyms.push(shortVersion);
    }
  }
  
  // 5. Alternative formats
  // Replace common connectors with alternatives
  const altFormats = [
    projectTitle.replace(/\s+/g, "-"), // hyphenated
    projectTitle.replace(/\s+/g, ""),    // no spaces (if short)
  ].filter(f => f !== projectTitle && f.length > 0 && f.length < 50);
  
  synonyms.push(...altFormats);
  
  // 6. Language-specific variations (if contains English, add Russian equivalent concepts)
  const hasEnglish = /[a-z]/i.test(projectTitle);
  if (hasEnglish) {
    // Try to create Russian descriptive equivalent
    const russianDescriptions = [
      `платформа ${projectTitle}`,
      `инструмент ${projectTitle}`,
    ];
    synonyms.push(...russianDescriptions);
  }
  
  // Remove duplicates and limit to 8-10 most relevant
  const unique = Array.from(new Set(synonyms));
  return unique.slice(0, 10);
}

function getBaseWritingRules(
  language: string,
  projectTitle: string,
  leanSolutions: string[],
  leanUnfairAdvantages: string[],
  pains: string[]
): string {
  const productSynonyms = generateProductSynonyms(projectTitle);
  
  return `- Use ${language}.
- ГЛАВНОЕ: Раскрывай тему статьи глубоко и полно. Тема статьи - это центр внимания, не продукт.
- Продукт упоминай 2-3 раза в конце статьи, используя РАЗНЫЕ синонимы для избежания переспама:
  ${productSynonyms.slice(0, 5).map(s => `  • ${s}`).join("\n")}
- КРИТИЧНО: Никогда не используй один и тот же синоним дважды в одной статье.
- Создавай плавные переходы перед упоминанием продукта: сначала проблема → общие решения → конкретный инструмент.
- Общий объём текста — не менее 4000-5000 слов.
- Генерируй выразительные и уникальные заголовки H2; избегай шаблонов вроде "Introduction", "Conclusion".
- В каждом outline.body используй валидный HTML: <p>, <ul>/<ol> с <li>, <strong>, <h3> для подзаголовков.
- Фокус на ценности для читателя, а не на продаже продукта.
- Избегай продающих слов: "купите", "закажите", "только сегодня", "не упустите" и т.п.

TONE OF VOICE REQUIREMENTS:
- Формальность: Полуформальный тон (не слишком формальный, не слишком неформальный)
- Обращение к читателю: Используй "вы" минимум 3-5 раз для создания вовлеченности
- Эмпатия: Проявляй понимание проблем читателя - используй слова "понимаю", "знаю", "многие сталкиваются", "обычно", "часто"
- Вопросы: Включай вопросы в текст (2-4 вопроса) для вовлечения читателя
- Длина предложений: Средняя длина 12-18 слов, варьируй длину (короткие и длинные предложения)
- Действенность: Используй призывы к действию естественно: "попробуйте", "начните", "используйте" (2-3 раза)
- Баланс: Сбалансированный тон - профессиональный, но дружелюбный
- Позитивность: Баланс позитивных и негативных слов (40-60% позитивных)
- Признание проблем: Явно признавай проблемы читателя перед предложением решений`;
}

function buildTriggerPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  selectedTrigger: string | null;
  selectedPain: string | null;
  baseInstructions: string;
  projectTitle: string;
  leanUVP?: string;
}): string {
  const { idea, selectedTrigger, selectedPain, baseInstructions, projectTitle, leanUVP } = params;

  return `You are writing a TRIGGER-focused article. Your MAIN GOAL is to deeply explore WHEN a problem starts and what happens if it's not addressed.

PRIMARY FOCUS (90% of content):
- Start by describing the TRIGGER: ${selectedTrigger || "the moment when the problem begins"}
- Explain WHEN this trigger occurs (specific situations, conditions, moments, real scenarios)
- Describe what happens AFTER the trigger (consequences, escalation, chain of events)
- Show what will happen if the problem is NOT addressed in time (real outcomes, costs, impacts)
- Connect to the pain: ${selectedPain || "the resulting problem"} - explore it deeply
- Provide insights, examples, and real-world scenarios
- Help readers recognize and understand this trigger pattern

SECONDARY FOCUS (10% of content - ONLY at the end):
- Brief mention of solutions in general (not product-specific)
- Natural transition to ${projectTitle} as ONE of the possible solutions${leanUVP ? ` (UVP: ${leanUVP})` : ""}
- CTA: Offer to explore ${projectTitle} (low-pressure, informative)

STRUCTURE:
1. Introduction: Set the scene - when does this trigger occur? Real examples
2. The Trigger Moment: Deep dive into specific situations/conditions when the problem starts
3. Escalation: What happens next? How does the problem grow? Real scenarios
4. Consequences: Long-term effects if not addressed - detailed exploration
5. The Turning Point: When is it too late? Cost of inaction - quantified
6. Recognizing the Pattern: How to identify this trigger early
7. Solutions Overview: General approaches (brief, 1-2 paragraphs)
8. Natural Transition: ${projectTitle} as one solution option${leanUVP ? ` (${leanUVP})` : ""}
9. CTA: Low-pressure offer to learn more

CRITICAL: Focus 90% on the trigger topic itself. Product mention should feel natural and minimal, not salesy.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildPainPointPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  selectedPain: string | null;
  selectedTrigger: string | null;
  baseInstructions: string;
  projectTitle: string;
  leanUVP?: string;
}): string {
  const { idea, selectedPain, selectedTrigger, baseInstructions, projectTitle, leanUVP } = params;

  // Generate product synonyms to avoid repetition
  const productSynonyms = generateProductSynonyms(projectTitle);

  return `You are writing a PAIN POINT article. Your MAIN GOAL is to deeply explore ONE specific pain.

PRIMARY FOCUS (85% of content):
- Deep dive into ONE pain: ${selectedPain || "the main pain point"}
- Explain what this pain means in real terms - detailed exploration
- Show how it affects daily work/life - real scenarios and examples
- Describe the cost of this pain (time, money, stress, opportunities) - quantified
- Connect to the trigger: ${selectedTrigger || "what causes this pain"}
- Explore why this pain is so common and persistent
- Provide insights, patterns, and recognition signs
- Help readers understand and validate their experience

SECONDARY FOCUS (15% of content - ONLY at the end):
- Brief overview of solution approaches (general, not product-specific)
- Natural, smooth transition to product mention using synonyms
- Product mention: 2-3 times using DIFFERENT synonyms to avoid repetition
- CTA: Low-pressure, informative offer

PRODUCT SYNONYMS (use DIFFERENT ones each time, avoid repetition):
${productSynonyms.map((syn, idx) => `${idx + 1}. ${syn}`).join("\n")}

CRITICAL SYNONYM RULES:
- NEVER use the same synonym twice in one article
- Use 2-3 different synonyms across the article (one per mention)
- Mix brand name (TRYGO) with descriptive terms (marketing co-pilot, AI-копилот)
- Vary between full names and shortened versions

NATURAL TRANSITION REQUIREMENTS:
Before mentioning the product, you MUST create a smooth bridge:
1. First, acknowledge the problem: "Как мы видели, эта проблема требует решения..."
2. Then, mention general solution approaches: "Существует несколько подходов к решению..."
3. Then, introduce the product naturally: "Одним из инструментов, который может помочь в этом, является [SYNONYM 1]..."
4. Use transition phrases: "В качестве решения можно рассмотреть...", "Естественным продолжением этого подхода является...", "Одним из вариантов может стать..."

STRUCTURE:
1. Introduction: Define the pain clearly with real examples
2. The Pain in Detail: What does it feel like? Deep exploration with scenarios
3. Impact: How does it affect work/life/business? Multiple dimensions
4. The Cost: Quantify the impact (time, money, stress, opportunities lost)
5. Why It Persists: What makes this pain hard to solve? Root causes
6. Recognizing the Pattern: How to identify this pain early
7. Solution Approaches: General ways to address this (brief overview, 1-2 paragraphs)
8. Natural Bridge: Create smooth transition from problem to solutions (1 paragraph)
   - Acknowledge the problem needs solving
   - Mention that various tools/approaches exist
   - Set context for product mention
9. Product Introduction (First mention): Use [SYNONYM 1] naturally in context of solutions
   - Example: "Одним из инструментов, который решает эту задачу, является [SYNONYM 1]"
   - Explain briefly how it addresses the pain (1-2 sentences)
   - ${leanUVP ? `Mention UVP naturally: ${leanUVP}` : ""}
10. Product Context (Second mention, if needed): Use [SYNONYM 2] in different context
    - Example: "Такие платформы, как [SYNONYM 2], позволяют..."
    - Keep it contextual and natural
11. CTA: Informative, low-pressure offer to explore solutions
    - Use [SYNONYM 3] or repeat one of previous synonyms
    - Example: "Изучите возможности [SYNONYM 3] для решения этой проблемы"

CRITICAL RULES:
- Focus 85% on exploring the pain itself
- Product mentions: 2-3 times total, using DIFFERENT synonyms
- Each mention must be in different section/context
- Create smooth, natural transitions - never abrupt jumps
- Avoid sales language: no "купите", "закажите", "только сегодня"
- Use informative, helpful tone throughout
- Product should feel like a natural part of the solution landscape, not a sales pitch

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildFeaturePrompt(params: {
  idea: SeoBacklogIdeaDoc;
  selectedFeature: string | null;
  baseInstructions: string;
  projectTitle: string;
  leanUVP?: string;
  leanUnfairAdvantages: string[];
}): string {
  const { idea, selectedFeature, baseInstructions, projectTitle, leanUVP, leanUnfairAdvantages } = params;

  return `You are writing a FEATURE article. Your MAIN GOAL is to deeply explore ONE feature/concept.

PRIMARY FOCUS (85% of content):
- Deep dive into ONE feature/concept: ${selectedFeature || "the main feature"}
- Explain how this feature/concept works - detailed technical/practical explanation
- Show real use cases and examples - multiple scenarios
- Describe benefits and outcomes - what users achieve
- Explore different approaches and methodologies
- Compare with alternatives - fair comparison
- Provide practical insights and best practices

SECONDARY FOCUS (15% of content - ONLY at the end):
- Brief mention of ${projectTitle} as an example implementation
- Natural connection to UVP: ${leanUVP || "unique value proposition"} - ONE mention only
- CTA: Low-pressure offer

STRUCTURE:
1. Introduction: What is this feature/concept and why it matters
2. How It Works: Detailed explanation with examples and mechanics
3. Use Cases: Real scenarios where this feature/concept helps - multiple examples
4. Benefits: What outcomes users get - detailed exploration
5. Comparison: How it differs from alternatives - fair analysis
6. Best Practices: How to implement/use this effectively
7. Real-World Examples: Case studies and scenarios
8. Natural Transition: ${projectTitle} as one implementation example${leanUVP ? ` (${leanUVP})` : ""}
9. CTA: Offer to explore ${projectTitle}

CRITICAL: Focus 85% on the feature/concept itself. Product should be mentioned as ONE example, not the main topic.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildOnboardingPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  baseInstructions: string;
  projectTitle: string;
  leanSolutions: string[];
}): string {
  const { idea, baseInstructions, projectTitle, leanSolutions } = params;

  return `You are writing an ONBOARDING guide. Your MAIN GOAL is to help readers get started with the topic: ${idea.title}.

PRIMARY FOCUS (85% of content):
- Deep exploration of getting started with: ${idea.title}
- Step-by-step guide for beginners
- Key concepts and fundamentals to understand first
- Common pitfalls and how to avoid them
- Practical first steps and actions
- Quick wins and early results
- Real examples and scenarios

SECONDARY FOCUS (15% of content - ONLY at the end):
- Brief mention of ${projectTitle} as one tool that can help
- Natural transition to exploring ${projectTitle}${leanSolutions.length > 0 ? ` (features: ${leanSolutions.slice(0, 3).join(", ")})` : ""}
- CTA: Low-pressure offer to try ${projectTitle}

STRUCTURE:
1. Introduction: What is ${idea.title} and why start here?
2. Prerequisites: What you need to know/understand first
3. Step 1: First concepts and fundamentals
4. Step 2: Initial practical steps
5. Step 3: First actions and practice
6. Common Mistakes: What beginners often get wrong
7. Quick Wins: What to expect in first days/weeks
8. Next Steps: Where to go from here
9. Tools & Resources: Overview of helpful tools (including ${projectTitle} as one option)
10. CTA: Explore ${projectTitle} to get started

CRITICAL: Focus 85% on the onboarding topic itself. Product should be mentioned as ONE helpful tool, not the main focus.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildSolutionPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  selectedPain: string | null;
  selectedFeature: string | null;
  baseInstructions: string;
  projectTitle: string;
  leanUVP?: string;
}): string {
  const { idea, selectedPain, selectedFeature, baseInstructions, projectTitle, leanUVP } = params;

  return `You are writing a SOLUTION article. Your MAIN GOAL is to explore solutions for: ${idea.title}.

PRIMARY FOCUS (85% of content):
- Deep exploration of the problem: ${selectedPain || "the problem being solved"}
- Different solution approaches and methodologies
- How solutions work in general - detailed explanation
- Comparison of different approaches (pros/cons)
- Best practices for implementing solutions
- Real-world examples and case studies
- What makes solutions effective

SECONDARY FOCUS (15% of content - ONLY at the end):
- Brief mention of ${projectTitle} as ONE solution option
- Natural connection to UVP: ${leanUVP || "unique value proposition"} - ONE mention only
- CTA: Low-pressure offer

STRUCTURE:
1. Introduction: The problem and why solutions matter
2. The Problem in Detail: ${selectedPain || "Deep exploration of the problem"}
3. Solution Approaches: Different ways to solve this (general overview)
4. How Solutions Work: Detailed explanation of solution mechanics
5. Comparison: Pros and cons of different approaches
6. Best Practices: What makes solutions effective
7. Real-World Examples: Case studies and scenarios
8. Implementation Guide: How to choose and implement a solution
9. Natural Transition: ${projectTitle} as one solution option${leanUVP ? ` (${leanUVP})` : ""}
10. CTA: Explore ${projectTitle}

CRITICAL: Focus 85% on solutions in general. Product should be mentioned as ONE option among others, not the main topic.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildBenefitPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  baseInstructions: string;
  projectTitle: string;
  leanUnfairAdvantages: string[];
}): string {
  const { idea, baseInstructions, projectTitle, leanUnfairAdvantages } = params;

  return `You are writing a BENEFITS article. Your MAIN GOAL is to explore the benefits and value of: ${idea.title}.

PRIMARY FOCUS (85% of content):
- Deep exploration of benefits related to: ${idea.title}
- What these benefits mean in real terms - detailed explanation
- How to achieve these benefits - practical approaches
- Real outcomes and value - quantified where possible
- ROI and impact - detailed analysis
- Examples and case studies showing benefits
- Best practices for maximizing benefits

SECONDARY FOCUS (15% of content - ONLY at the end):
- Brief mention of ${projectTitle} as one way to achieve these benefits
- Natural connection to advantages: ${leanUnfairAdvantages.length > 0 ? leanUnfairAdvantages.join(", ") : "unique benefits"} - ONE mention only
- CTA: Low-pressure offer

STRUCTURE:
1. Introduction: What benefits are available and why they matter
2. Benefit 1: Deep dive into first benefit - what it means, how to achieve it
3. Benefit 2: Deep dive into second benefit - real-world impact
4. Benefit 3: Deep dive into third benefit - quantified value
5. Combined Value: How benefits work together synergistically
6. Real-World Examples: Case studies showing benefits achieved
7. How to Maximize Benefits: Best practices and strategies
8. Measuring Impact: How to quantify and track benefits
9. Natural Transition: ${projectTitle} as one way to achieve these benefits${leanUnfairAdvantages.length > 0 ? ` (${leanUnfairAdvantages.join(", ")})` : ""}
10. CTA: Explore ${projectTitle}

CRITICAL: Focus 85% on benefits themselves. Product should be mentioned as ONE way to achieve benefits, not the main topic.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildFAQPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  baseInstructions: string;
}): string {
  const { idea, baseInstructions } = params;

  return `You are writing an FAQ article. Your MAIN GOAL is to answer questions about: ${idea.title}.

PRIMARY FOCUS (95% of content):
- Address the main question: ${idea.title}
- Provide clear, comprehensive, helpful answers
- Cover related questions and follow-ups
- Practical, actionable information
- Real examples and scenarios
- Deep explanations, not surface-level answers

SECONDARY FOCUS (5% of content - ONLY at the end):
- Brief mention of additional resources or tools (if relevant)
- Low-pressure CTA (if appropriate)

STRUCTURE:
1. Introduction: The topic and why these questions matter
2. Main Question: Deep answer to ${idea.title}
3. FAQ Section: Multiple Q&A pairs covering related questions
4. Related Questions: Additional context and edge cases
5. Common Misconceptions: What people often get wrong
6. Practical Examples: Real-world scenarios
7. Summary: Key takeaways
8. Next Steps: Where to learn more (brief, low-pressure)

CRITICAL: Focus 95% on answering questions thoroughly. Avoid product mentions unless directly relevant to answering the question.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

function buildGeneralPrompt(params: {
  idea: SeoBacklogIdeaDoc;
  baseInstructions: string;
}): string {
  const { idea, baseInstructions } = params;

  return `You are writing a general article. Your MAIN GOAL is to comprehensively explore: ${idea.title}.

PRIMARY FOCUS (90% of content):
- Deep exploration of the topic: ${idea.title}
- Comprehensive coverage: ${idea.description}
- Practical value and insights
- Real examples and scenarios
- Multiple perspectives and approaches
- Detailed explanations and analysis

SECONDARY FOCUS (10% of content - ONLY at the end if relevant):
- Brief mention of tools/resources (if directly relevant to the topic)
- Low-pressure CTA (if appropriate)

STRUCTURE:
1. Introduction: What is ${idea.title} and why it matters
2. Main Content Section 1: Deep dive into first aspect
3. Main Content Section 2: Deep dive into second aspect
4. Main Content Section 3: Deep dive into third aspect
5. Additional Sections: More aspects as needed (3-5 total sections)
6. Real-World Applications: Examples and use cases
7. Key Takeaways: Summary of main points
8. Conclusion: Final thoughts and next steps (brief, low-pressure if mentioning resources)

CRITICAL: Focus 90% on the topic itself. Product mentions should be minimal and only if directly relevant to the topic.

${baseInstructions}

Return JSON with outline sections following this structure.`;
}

