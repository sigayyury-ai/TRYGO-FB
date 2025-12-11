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

  const goalsBlock = goals.length
    ? goals.map((item) => `- ${item}`).join("\n")
    : "- TODO: добавить цели ICP";
  const painsBlock = pains.length
    ? pains.map((item) => `- ${item}`).join("\n")
    : "- TODO: добавить боли ICP";
  const triggersBlock = triggers.length
    ? triggers.map((item) => `- ${item}`).join("\n")
    : "- TODO: добавить триггеры / JTBD";
  const objectionsBlock = objections.length
    ? objections.map((item) => `- ${item}`).join("\n")
    : "- TODO: добавить возражения";
  const customerJourneyBlock = customerJourney ?? "TODO: описать путь клиента";

  const leanProblemsBlock = leanProblems.length
    ? leanProblems.map((item) => `- ${item}`).join("\n")
    : "- TODO: заполнить проблемы (Lean Canvas)";
  const leanSolutionsBlock = leanSolutions.length
    ? leanSolutions.map((item) => `- ${item}`).join("\n")
    : "- TODO: заполнить решения (Lean Canvas)";
  const leanSolutionsList = leanSolutions.length ? leanSolutions.join("; ") : null;
  const leanUVPBlock = leanUVP ?? "TODO: указать уникальное ценностное предложение";
  const leanChannelsBlock = leanChannels.length
    ? leanChannels.map((item) => `- ${item}`).join("\n")
    : "- TODO: добавить каналы/сообщения";
  const primaryLeanSolution = leanSolutions.length > 0 ? leanSolutions[0] : null;

  const resolvedLanguage = language ?? context.language ?? "Russian";

  const contentGoalText =
    contentGoal?.trim() ||
    "Определи и сформулируй основную бизнес-цель статьи на основе контекста и идеи (не допускай TODO).";
  const funnelStageText =
    funnelStage?.trim() ||
    "Solution-aware / BOFU — читатель знает проблему и рассматривает конкретные решения";
  const specialRequirementsText =
    specialRequirements?.trim() || "Нет дополнительных требований (можно уточнить).";

  const ideaCategory = idea.category ?? "info";

  const prompt = `You are a senior content strategist. Produce a full ${contentType.replace(
    "_",
    " "
  )} draft in valid JSON, grounded strictly in the provided context. If data is missing, insert a "TODO" note describing what is needed.

###
CONTENT SETTINGS
- Content type: ${contentType}
- Language: ${resolvedLanguage}
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
  "cta": {
    "headline": "Short CTA headline under 60 characters that hints at the product benefit",
    "body": "2-3 persuasive sentences that summarise the solution and invite action (use the product name ${projectTitle})",
    "buttonLabel": "Action-oriented label (≤20 characters)",
    "url_hint": "Suggested destination URL or TODO",
    "tone": "Describe the tone, e.g. consultative, urgent, exclusive"
  },
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
- Use ${resolvedLanguage}.
- Tone: expert yet empathetic; speak directly to the persona that already understands проблему и ищет решение.
- Подчёркивай продукт (название: ${projectTitle}) нативно: упоминай реальные функции из Lean Canvas Solutions/UVP, не выдумывай новых. Не выделяй продукт чрезмерно, но покажи, как он помогает закрыть pains/goals.
- Общий объём текста (сумма всех outline.body) — не менее 4000 слов; если для раскрытия темы не хватает данных, добавь TODO с описанием нужной информации.
- Для каждого элемента outline.body подготовь минимум три абзаца по 2–4 предложения, сочетая нарратив, списки и таблицы, когда это помогает.
- Во вводном абзаце (первый outline.body) явно обозначь цель материала: коротко передай, чего должен добиться читатель и какой бизнес-результат нужен компании.
- Всегда добавляй блоки: проблема, решение, выгоды с цифрами/фактами, социальные доказательства, ответы на возражения, CTA.
- Работай как профессиональный копирайтер и следуй восьми установкам:
  1. Уточни задачу и роль статьи: покажи, какую проблему решает аудитория и какую ценность несёт материал.
  2. Определи главную идею: сформулируй одно ключевое сообщение, которое читатель сможет пересказать в одном предложении.
  3. Собери контекст и факты: используй аргументы, примеры, логические объяснения, данные/наблюдения, реальные кейсы, сравнения или метафоры; избегай воды.
  4. Построй структуру как сценарист: зацеп → контекст → разбор/решение → примеры/доказательства → вывод и действие.
  5. Пиши живо и по-человечески: короткие абзацы, сильные глаголы, конкретика, естественные интонации, минимум канцелярита и штампов.
  6. Поддерживай читателя: предвосхищай вопросы, давай ответы и делай плавные переходы между блоками.
  7. Проверь текст на голос: убедись, что стиль звучит как эксперт-человек, а не энциклопедия.
  8. Смотри глазами читателя: оцени, что удерживает внимание, нет ли лишнего, что читатель унесёт и что сделает дальше; финализируй текст под это.
- Для каждой публикации формируй уникальную, логически сегментированную структуру: варьируй порядок и названия разделов, избегай шаблонов.
- Генерируй выразительные и уникальные заголовки H2 (без сухих "Преимущества", "Проблема" и т.п.); придумай фразы, которые отражают суть раздела и цепляют внимание, сохраняя последовательность блоков.
- Включай социальные доказательства (кейсы, обзоры, отзывы) с конкретными числовыми результатами, если данные доступны; при отсутствии обозначай, какую информацию нужно уточнить.
- Каждый блок outline.body начинай с содержательного <p> (без псевдозаголовков вроде "Введение:" или строк вида "Validating Market Demand"); не вставляй дополнительные заголовки (ни в тегах, ни простым текстом), потому что основной заголовок блока передаётся через поле heading и рендерится как <h2> на фронтенде. Чтобы выделить мысль, используй <strong> внутри <p>, а не отдельный заголовок.
- В итоговом тексте (outline.body) используй явные HTML-теги: развивающий текст оформляй в <p>, списки размечай <ul>/<li> или <ol>/<li>; если нужен вложенный подраздел, используй <h3>/<h4>, но не дублируй основной заголовок и не вставляй строки без тегов, которые выглядят как отдельный заголовок.
- Добавь отдельные секции с аналитикой (данные/тенденции), практическими советами и FAQ (≥3 вопроса). Если стадия не BOFU — FAQ можно отметить TODO. Для FAQ начни раздел с <h2>FAQ</h2>, а каждый вопрос оформляй как <p><strong>Вопрос?</strong></p> с последующим абзацем-ответом (не используй <h2> для вопросов).
- В финальной секции проанализируй все решения из Lean Canvas Solutions (${leanSolutionsList ?? "TODO: перечислить решения"}), выбери наиболее релевантное теме статьи (например, ${primaryLeanSolution ?? "укажи ключевое решение"}), объясни, почему оно лучше остальных, и покажи, как помогает закрыть ключевую проблему; заверши секцию нативным призывом к действию, плавно подводящим читателя к следующему шагу (без явного слова "CTA").
- Финальный абзац outline.body оформи как цельный <p> с естественным призывом и упоминанием продукта, без лейблов вроде "CTA:".
- Обязательно заполни объект "cta": подбери headline, body, buttonLabel и tone, согласованные с финальной секцией; не оставляй там TODO, если данные доступны.
- Подбери 2–3 высоко-релевантных SEO-ключа (на основе  ${idea.title} и описания ${idea.description} ) и естественно повтори в заголовках H2 и по тексту но не больше 3-5 раз.
- Соблюдай SEO best practices: структурируй контент с подзаголовками, списками, таблицами; добавляй внутренние/внешние ссылки (internalLinks/externalLinks), включай PAA-стилизованный FAQ.
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
