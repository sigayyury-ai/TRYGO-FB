import { env } from "../config/env.js";
import { SeoBacklogIdea, type SeoBacklogIdeaDoc } from "../db/models/SeoBacklogIdea.js";
import { websitePageServiceClient, type WebsitePageContextPayload, type WebsitePageClusterPayload } from "./websitePages/apiClient.js";
import { loadSeoContext } from "./context/seoContext.js";
import { buildDraftPrompt } from "./contentDrafts/buildDraftPrompt.js";

export interface ContentGenerationRequest {
  title: string;
  description?: string;
  category: string;
  contentType: string;
  projectContext?: Record<string, any>;
  hypothesisContext?: Record<string, any>;
  clusterContext?: {
    title: string;
    intent: string;
    keywords: string[];
  } | null;
  // New: support for backlog idea-based generation
  backlogIdeaId?: string;
  projectId?: string;
  hypothesisId?: string;
}

export interface ContentGenerationResponse {
  content: string;
  outline?: string;
}

export interface ImageGenerationRequest {
  title: string;
  description?: string;
  content?: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
}

/**
 * Generate full article content using existing services and prompts
 * For commercial pages, uses website-pages-service
 * For articles, uses a prompt-based approach similar to existing content generation
 */
export const generateContent = async (
  request: ContentGenerationRequest
): Promise<ContentGenerationResponse> => {
  try {
    // For commercial pages, use website-pages-service
    if (request.contentType === "COMMERCIAL_PAGE" || request.contentType === "LANDING_PAGE") {
      if (!request.clusterContext) {
        throw new Error("Cluster context is required for commercial page generation");
      }

      const context: WebsitePageContextPayload = {
        project: request.projectContext || null,
        hypothesis: request.hypothesisContext || null,
        leanCanvas: request.projectContext?.leanCanvas || null,
        icp: request.projectContext?.icp || null,
        language: null
      };

      const cluster: WebsitePageClusterPayload = {
        id: request.clusterContext.title,
        title: request.clusterContext.title,
        intent: request.clusterContext.intent,
        keywords: request.clusterContext.keywords
      };

      const result = await websitePageServiceClient.generate({
        context,
        cluster,
        persona: null
      });

      // Convert website page structure to markdown content
      const sections = result.payload.sections || [];
      const markdownContent = `# ${result.payload.title || request.title}

${result.payload.summary || request.description || ""}

${sections.map((section: any) => {
  if (!section.body) return "";
  return `## ${section.heading || section.key}

${section.body}

${section.notes ? `*Note: ${section.notes}*` : ""}`;
}).filter(Boolean).join("\n\n")}

${result.payload.faq && result.payload.faq.length > 0 ? `## FAQ

${result.payload.faq.map((faq: any) => `### ${faq.question}

${faq.answer}`).join("\n\n")}` : ""}`;

      return {
        content: markdownContent,
        outline: request.description || result.payload.summary
      };
    }

    // For blog articles, use new prompt system if backlogIdeaId is provided
    if (request.backlogIdeaId && request.projectId && request.hypothesisId) {
      // Use new prompt system with content type detection
      const backlogIdea = await SeoBacklogIdea.findById(request.backlogIdeaId).exec();
      if (!backlogIdea) {
        throw new Error("Backlog idea not found");
      }

      // Load SEO context
      const seoContext = await loadSeoContext(request.projectId, request.hypothesisId);

      // Build prompt using new system
      const { prompt } = buildDraftPrompt({
        context: seoContext,
        idea: backlogIdea,
        contentType: "article",
        language: seoContext.language
      });

      const OpenAI = (await import("openai")).default;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set in environment variables");
      }
      const client = new OpenAI({ apiKey });

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 8000, // Increased for 4000-5000 word articles
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a senior content writer. Always respond with valid JSON matching the requested format."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const jsonContent = response.choices?.[0]?.message?.content || "";
      if (!jsonContent) {
        throw new Error("Failed to generate content");
      }

      // Parse JSON response and convert to Markdown
      const parsed = JSON.parse(jsonContent);
      const markdownContent = convertJsonToMarkdown(parsed, request.title);

      return {
        content: markdownContent,
        outline: parsed.summary || request.description || ""
      };
    }

    // Fallback to old prompt system for backward compatibility
    const OpenAI = (await import("openai")).default;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    const client = new OpenAI({ apiKey });
    
    const articlePrompt = buildArticlePrompt(request);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 6000, // Increased for longer articles (1500-2500 words)
      messages: [
        {
          role: "system",
          content: "You are a senior content writer and SEO specialist. You create comprehensive, well-researched blog articles that provide genuine value to readers while being optimized for search engines. Always respond with clean, well-structured Markdown content without any extra formatting, quotes, or meta-commentary."
        },
        {
          role: "user",
          content: articlePrompt
        }
      ]
    });
    
    const generatedContent = response.choices?.[0]?.message?.content || "";

    if (!generatedContent) {
      throw new Error("Failed to generate content");
    }

    return {
      content: generatedContent,
      outline: request.description
    };
  } catch (error: any) {
    console.error("Error generating content:", error);
    
    // Fallback to placeholder
    const placeholderContent = `# ${request.title}

## Introduction
${request.description || "This is a placeholder introduction for the article."}

## Main Content
This is where the full article content would be generated based on:
- Title: ${request.title}
- Category: ${request.category}
- Content Type: ${request.contentType}

## Conclusion
This is a placeholder conclusion. In production, this would be generated by an AI service based on the project context and hypothesis data.

---

*This content was automatically generated. Please review and edit as needed.*`;

    return {
      content: placeholderContent,
      outline: request.description
    };
  }
};

/**
 * Build comprehensive article prompt using best practices and existing patterns
 * This prompt is designed to generate high-quality, SEO-optimized blog articles
 */
function buildArticlePrompt(request: ContentGenerationRequest): string {
  const { title, description, category, projectContext, hypothesisContext } = request;
  const projectTitle = projectContext?.title || "the project";
  const hypothesisTitle = hypothesisContext?.title || "the hypothesis";
  const leanCanvas = projectContext?.leanCanvas || {};
  const icp = projectContext?.icp || {};
  const cluster = request.clusterContext;

  // Format arrays as bullet points for better readability
  const formatList = (items: unknown, fallback: string): string => {
    if (Array.isArray(items) && items.length > 0) {
      return items
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .map((item) => `- ${item}`)
        .join("\n");
    }
    return fallback;
  };

  const problems = formatList(leanCanvas?.problems, "- Problems not specified");
  const solutions = formatList(leanCanvas?.solutions, "- Solutions not specified");
  const pains = formatList(icp?.pains, "- Pain points not documented");
  const goals = formatList(icp?.goals, "- Goals not documented");
  const uvp = typeof leanCanvas?.uniqueValueProposition === "string"
    ? leanCanvas.uniqueValueProposition
    : "Unique value proposition is not defined";

  const keywords = cluster && Array.isArray(cluster.keywords) && cluster.keywords.length > 0
    ? cluster.keywords.join(", ")
    : "No specific keywords provided";

  let prompt = `You are a senior content writer and SEO specialist with expertise in creating comprehensive, well-researched blog articles that rank well in search engines and provide genuine value to readers.

Your task is to write a complete, publication-ready blog article based on the following specifications.

## Article Specifications

**Title:** ${title}
${description ? `**Description/Outline:** ${description}` : ""}
**Content Category:** ${category}

## Context & Background

**Project:** ${projectTitle}
**Hypothesis:** ${hypothesisTitle}
${cluster ? `**Semantic Cluster:** ${cluster.title}` : ""}
${cluster ? `**Cluster Intent:** ${cluster.intent}` : ""}
${cluster ? `**Target Keywords:** ${keywords}` : ""}

**Target Audience Context:**
**ICP Pain Points:**
${pains}

**ICP Goals & Desires:**
${goals}

**Business Context:**
**Lean Canvas Problems:**
${problems}

**Lean Canvas Solutions:**
${solutions}

**Unique Value Proposition:** ${uvp}

## Article Requirements

### Structure & Length
- **Total Length:** 1,500-2,500 words (aim for comprehensive coverage)
- **Introduction:** 2-3 engaging paragraphs (150-250 words)
  - Hook the reader with a relatable problem or compelling question
  - Establish relevance to the target audience
  - Preview what the article will cover
- **Main Body:** 3-5 substantial sections with H2 headings
  - Each section should be 300-500 words
  - Use H3 subheadings where appropriate for better readability
  - Include practical examples, case studies, or real-world scenarios
  - Address the pain points and goals mentioned in the context
- **Conclusion:** 1-2 paragraphs (100-200 words)
  - Summarize key takeaways
  - Include a clear call-to-action that aligns with the project's goals
  - Encourage engagement or next steps

### Content Quality Standards

1. **SEO Optimization:**
   - Naturally incorporate the target keywords (${keywords}) throughout the article
   - Use the primary keyword in the first paragraph and H2 headings where relevant
   - Include semantic variations and related terms
   - Write for humans first, search engines second

2. **Value & Actionability:**
   - Provide actionable insights, tips, or strategies
   - Include specific examples, step-by-step guides, or frameworks where applicable
   - Address the reader's pain points directly
   - Show how the content relates to achieving their goals

3. **Readability & Engagement:**
   - Use clear, conversational language (avoid jargon unless necessary)
   - Break up long paragraphs (3-4 sentences max)
   - Use bullet points, numbered lists, and formatting to improve scanability
   - Include transitions between sections for smooth flow

4. **Tone & Style:**
   - Professional yet approachable
   - Authoritative but not condescending
   - Empathetic to the reader's challenges
   - Aligned with the project's unique value proposition

### Markdown Formatting Requirements

- Use proper Markdown syntax:
  - H1 for title: \`# ${title}\`
  - H2 for main sections: \`## Section Title\`
  - H3 for subsections: \`### Subsection Title\`
  - Use \`**bold**\` for emphasis
  - Use \`- \` for bullet lists
  - Use \`1. \` for numbered lists
  - Use \`> \` for blockquotes when appropriate
- Do NOT include:
  - Extra quotes around the content
  - Code blocks wrapping the entire article
  - Any meta-commentary or notes about the generation process
  - Placeholder text or "TODO" comments

### Output Format

Return ONLY the article content in clean Markdown format. Start directly with the H1 title, followed by the introduction, main sections, and conclusion. Do not include any preamble, explanation, or postscript.

Begin writing the article now:`;

  return prompt;
}

/**
 * Convert JSON content structure to Markdown
 */
function convertJsonToMarkdown(parsed: any, fallbackTitle: string): string {
  const title = parsed.title || fallbackTitle;
  const summary = parsed.summary || "";
  const outline = parsed.outline || [];
  
  let markdown = `# ${title}\n\n`;
  
  if (summary) {
    markdown += `${summary}\n\n`;
  }
  
  if (Array.isArray(outline)) {
    for (const section of outline) {
      if (section.heading) {
        markdown += `## ${section.heading}\n\n`;
      }
      if (section.body) {
        markdown += `${section.body}\n\n`;
      }
    }
  }
  
  // Add CTA if present
  if (parsed.cta && parsed.cta.headline) {
    markdown += `## ${parsed.cta.headline}\n\n`;
    if (parsed.cta.body) {
      markdown += `${parsed.cta.body}\n\n`;
    }
  }
  
  return markdown.trim();
}

/**
 * Generate image for content using images service or Google Gemini
 */
export const generateImage = async (
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> => {
  try {
    // Try images service first (now integrated into TRYGO-Backend)
    try {
      const response = await fetch(`${env.trygoBackendUrl}/api/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentItemId: request.contentItemId || "unknown",
          title: request.title,
          description: request.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl || data.url) {
          return {
            imageUrl: data.imageUrl || data.url
          };
        }
      }
    } catch (serviceError) {
      console.warn("Images service not available, trying Google Gemini:", serviceError);
    }

    // Fallback to Google Gemini if available
    if (env.geminiApiKey || env.googleApiKey) {
      try {
        const apiKey = env.geminiApiKey || env.googleApiKey;
        const prompt = request.description || request.title;
        
        // Use Gemini API for image generation
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              instances: [{
                prompt: prompt
              }],
              parameters: {
                sampleCount: 1
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            // Convert base64 to data URL or save and return URL
            return {
              imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
            };
          }
        }
      } catch (geminiError) {
        console.warn("Google Gemini image generation failed:", geminiError);
      }
    }

    // Return placeholder if all methods fail
    console.warn("All image generation methods failed, using placeholder");
    // Use data URI instead of external placeholder service
    return {
      imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23e5e7eb' width='1200' height='630'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%236b7280'%3EImage will be generated here%3C/text%3E%3C/svg%3E"
    };
  } catch (error) {
    console.error("Error generating image:", error);
    // Use data URI instead of external placeholder service
    return {
      imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect fill='%23e5e7eb' width='1200' height='630'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%236b7280'%3EImage will be generated here%3C/text%3E%3C/svg%3E"
    };
  }
};

