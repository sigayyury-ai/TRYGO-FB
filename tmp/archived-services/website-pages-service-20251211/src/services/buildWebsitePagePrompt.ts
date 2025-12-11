interface PromptOptions {
  context: {
    project?: Record<string, any> | null;
    hypothesis?: Record<string, any> | null;
    leanCanvas?: Record<string, any> | null;
    icp?: Record<string, any> | null;
    language?: string | null;
  };
  cluster: {
    id: string;
    title: string;
    intent: string;
    keywords: string[];
  };
  personaOverride?: string | null;
}

const formatList = (items: unknown, fallback: string) => {
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join("\n");
  }
  return fallback;
};

export function buildWebsitePagePrompt(options: PromptOptions): { prompt: string } {
  const { context, cluster, personaOverride } = options;
  const projectTitle = context.project?.title ?? "Unnamed project";
  const hypothesisTitle = context.hypothesis?.title ?? "Unnamed hypothesis";
  const icp = context.icp ?? {};
  const leanCanvas = context.leanCanvas ?? {};
  const persona = personaOverride || icp.persona || "Primary ICP";

  const pains = formatList(icp.pains, "- Pain points not documented");
  const goals = formatList(icp.goals, "- Desired outcomes not documented");
  const leanProblems = formatList(leanCanvas?.problems, "- Missing problem statements");
  const leanSolutions = formatList(leanCanvas?.solutions, "- Missing solution statements");
  const leanUnfairAdvantages = formatList(
    leanCanvas?.unfairAdvantages,
    "- No unfair advantages documented"
  );
  const uvp = typeof leanCanvas?.uniqueValueProposition === "string"
    ? leanCanvas.uniqueValueProposition
    : "Unique value proposition is not defined";

  const keywords = Array.isArray(cluster.keywords) && cluster.keywords.length > 0
    ? cluster.keywords.join(", ")
    : "No keywords";

const prompt = `You are a senior conversion copywriter. Create a commercial website page blueprint based on the context below. Before writing, classify which commercial page type best fits this cluster (choose from: feature, service, solution, product, use_case, industry, persona, pricing, integration, template, comparison, overview). Use these heuristics:
- Mention of specific feature/capability → "feature"
- Service/process/deliverables language → "service"
- Persona + scenario/JTBD → "solution"
- Broad product/platform description → "product"
- Industry keywords → "industry"
- Persona override or ICP persona focus → "persona"
- Keywords like "pricing", "plans" → "pricing"
- Keywords like "integration", tool names → "integration"
- Keywords like "template", "generator" → "template"
- Keywords like "compare", "vs" → "comparison"
- Otherwise → "overview"

The cluster title "${cluster.title}" and its keywords (${keywords}) define the core topic — weave them naturally into every major section (especially hero/value/pain headings and copy). Focus on the persona's pains/goals, product UVP, and the cluster intent.

Context:
- Project: ${projectTitle}
- Hypothesis: ${hypothesisTitle}
- Target persona: ${persona}
- ICP pains:\n${pains}
- ICP goals:\n${goals}
- Lean Canvas problems:\n${leanProblems}
- Lean Canvas solutions:\n${leanSolutions}
- Unique value proposition: ${uvp}
- Unfair advantages:\n${leanUnfairAdvantages}
- Cluster title: ${cluster.title} (use it as the guiding topic; mention or paraphrase it in the hero headline and value proposition)
- Cluster intent: ${cluster.intent}
- Cluster keywords: ${keywords} (repeat the most relevant ones 3-4 times across sections without keyword stuffing)
- Task context: interpret the cluster as the \"assignment\". Extract the core topic from its title/keywords and describe it explicitly before writing sections. Use the cluster type classification to pick the most relevant page template from the list above and follow that structure order (e.g., feature pages emphasize capability→benefits→use cases, service pages focus on process/deliverables/result, etc.).

Output requirements:
Return strict JSON with this shape:
{
  "title": "Page headline under 90 characters",
  "summary": "1-2 sentence pitch",
  "personaFocus": "Persona segment for this page",
  "funnelStage": "Awareness/Middle/Bottom of funnel",
  "pageType": "feature | service | solution | product | use_case | industry | persona | pricing | integration | template | comparison | overview",
  "sections": [
    { "key": "hero", "heading": "Hero headline", "body": "Copy that includes a CTA button/secondary link", "notes": "Design/UX hints" },
    { "key": "value", "heading": "Value proposition", "body": "Copy", "notes": "" },
    { "key": "pain", "heading": "Pain/Promise", "body": "", "notes": "" },
    { "key": "solution", "heading": "Solution overview", "body": "", "notes": "" },
    { "key": "proof", "heading": "Social proof", "body": "", "notes": "" },
    { "key": "pricing", "heading": "Pricing / plans", "body": "", "notes": "" },
    { "key": "faq", "heading": "FAQ", "body": "", "notes": "" }
  ],
  "proof": [
    { "type": "case_study", "body": "Short proof point", "metric": "" }
  ],
  "faq": [
    { "question": "", "answer": "" }
  ],
  "cta_first": {
    "headline": "CTA block headline for hero",
    "subheading": "Support sentence",
    "linkText": "Button copy",
    "linkUrl": "Suggested URL slug or anchor",
    "offer": "What user receives"
  },
  "cta_final": {
    "headline": "Final CTA headline",
    "subheading": "Support sentence referencing the overall promise",
    "linkText": "Button copy (can differ from hero CTA)",
    "linkUrl": "Suggested URL slug or anchor",
    "offer": "What user receives"
  }
}

Rules:
- Output must be valid JSON.
- Align copy with persona pains/goals.
- Hero/body copy must reference the cluster keywords naturally (cluster title and main keywords should appear in the hero and at least two additional sections).
- Whenever you list features/steps/benefits, accompany them with a short description (1–2 sentences) that explains the impact or context — avoid plain bullet names with no explanation.
- Make the tone vivid and persuasive: use narrative hooks, contrast pains vs desired outcomes, show examples or metrics where possible.
- Hero section should include a CTA (referenced via "cta_first"), and the final section should introduce a distinct CTA (from "cta_final") to capture users who scroll to the end.
- Keep tone confident and consultative.
- Notes field should describe visual/layout guidance (e.g., "use comparison table").
- FAQ should cover cost, effort, timeline, and risk objections.
`;

  return { prompt };
}
