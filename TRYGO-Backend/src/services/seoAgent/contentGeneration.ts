import { config } from "../../constants/config/env";
import { SeoBacklogIdea, type SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea";
import { websitePageServiceClient, type WebsitePageContextPayload, type WebsitePageClusterPayload } from "./websitePages/apiClient";
import { loadSeoContext } from "./context/seoContext";
import { buildDraftPrompt } from "./contentDrafts/buildDraftPrompt";
import { generateImageForContent } from "../images/generateImage";

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
  userId?: string; // ⭐ Добавлено для проверки принадлежности проекта
}

export interface ContentGenerationResponse {
  content: string;
  outline?: string;
}

export interface ImageGenerationRequest {
  title: string;
  description?: string;
  content?: string;
  contentItemId?: string; // For new integrated API
  // Audience context for better image generation
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

      // Convert website page structure to HTML content (for WordPress compatibility)
      const sections = result.payload.sections || [];
      const htmlContent = `<h1>${escapeHtml(result.payload.title || request.title)}</h1>

${result.payload.summary || request.description 
  ? `<p>${escapeHtml(result.payload.summary || request.description || "")}</p>` 
  : ""}

${sections.map((section: any) => {
  if (!section.body) return "";
  const heading = section.heading || section.key;
  const headingHtml = heading ? `<h2>${escapeHtml(heading)}</h2>` : "";
  // Body might already contain HTML or be plain text
  const bodyHtml = section.body.trim().startsWith('<') 
    ? section.body 
    : `<p>${escapeHtml(section.body)}</p>`;
  const notesHtml = section.notes ? `<p><em>Note: ${escapeHtml(section.notes)}</em></p>` : "";
  return `${headingHtml}\n\n${bodyHtml}\n\n${notesHtml}`.trim();
}).filter(Boolean).join("\n\n")}

${result.payload.faq && result.payload.faq.length > 0 ? `<h2>FAQ</h2>

${result.payload.faq.map((faq: any) => `<h3>${escapeHtml(faq.question)}</h3>

<p>${escapeHtml(faq.answer)}</p>`).join("\n\n")}` : ""}`;

      return {
        content: htmlContent,
        outline: request.description || result.payload.summary
      };
    }

    // For blog articles, use new prompt system if backlogIdeaId is provided
    if (request.backlogIdeaId && request.projectId && request.hypothesisId) {
      try {
        console.log("[generateContent] Using new prompt system:", {
          backlogIdeaId: request.backlogIdeaId,
          projectId: request.projectId,
          hypothesisId: request.hypothesisId,
          title: request.title
        });

        // Use new prompt system with content type detection
        const backlogIdea = await SeoBacklogIdea.findById(request.backlogIdeaId).exec();
        if (!backlogIdea) {
          throw new Error(`Backlog idea not found: ${request.backlogIdeaId}`);
        }

        // Load SEO context
        const seoContext = await loadSeoContext(request.projectId, request.hypothesisId, request.userId);
        console.log("[generateContent] SEO context loaded for:", {
          project: seoContext.project?.title || "NOT FOUND",
          hypothesis: seoContext.hypothesis?.title || "NOT FOUND",
          hasICP: !!seoContext.icp,
          hasLeanCanvas: !!seoContext.leanCanvas,
          clustersCount: seoContext.clusters?.length || 0,
          language: seoContext.language
        });

        // Build prompt using new system
        console.log("[generateContent] Building draft prompt...");
        const { prompt, detectedType } = buildDraftPrompt({
          context: seoContext,
          idea: backlogIdea,
          contentType: "article",
          language: seoContext.language
        });
        console.log("[generateContent] Prompt built, detected type:", detectedType);
        console.log("[generateContent] Prompt length:", prompt.length);

        const OpenAI = (await import("openai")).default;
        const apiKey = process.env.OPENAI_API_KEY || config.SEO_AGENT.openAiApiKey;
        if (!apiKey) {
          console.error("[generateContent] OPENAI_API_KEY is not set!");
          throw new Error("OPENAI_API_KEY is not set in environment variables");
        }
        console.log("[generateContent] OpenAI API key found, creating client...");
        const client = new OpenAI({ apiKey });

      const model = config.SEO_AGENT.openAiModel || "gpt-4o";
      let response;
      try {
        response = await client.chat.completions.create({
          model: model,
          temperature: 0.7,
          max_tokens: 8000,
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
      } catch (apiError: any) {
        console.error("[generateContent] OpenAI API error:", apiError.message);
        // Fallback to gpt-4o if model error
        if (model !== "gpt-4o") {
          console.log("[generateContent] Trying fallback model gpt-4o...");
          response = await client.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            max_tokens: 8000,
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
        } else {
          throw apiError;
        }
      }

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
      } catch (error: any) {
        console.error("[generateContent] Error in new prompt system:", error);
        // Re-throw to be caught by outer catch block
        throw error;
      }
    }

    // Fallback to old prompt system for backward compatibility
    const OpenAI = (await import("openai")).default;
    const apiKey = process.env.OPENAI_API_KEY || config.SEO_AGENT.openAiApiKey;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    const client = new OpenAI({ apiKey });
    
    const articlePrompt = buildArticlePrompt(request);
    
    const model = config.SEO_AGENT.openAiModel || "gpt-4o";
    let response;
    try {
      response = await client.chat.completions.create({
        model: model,
        temperature: 0.7,
        max_tokens: 6000,
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
    } catch (apiError: any) {
      console.error("[generateContent] OpenAI API error (fallback):", apiError.message);
      // Fallback to gpt-4o if model error
      if (model !== "gpt-4o") {
        console.log("[generateContent] Trying fallback model gpt-4o...");
        response = await client.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.7,
          max_tokens: 6000,
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
      } else {
        throw apiError;
      }
    }
    
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
 * Escape HTML special characters (used for headings and summary that come as plain text)
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Convert JSON content structure to HTML (for WordPress compatibility)
 * WordPress does not support Markdown by default, so we use HTML tags
 */
function convertJsonToMarkdown(parsed: any, fallbackTitle: string): string {
  const title = parsed.title || fallbackTitle;
  const summary = parsed.summary || "";
  const outline = parsed.outline || [];
  
  // Use HTML format for WordPress compatibility
  let html = `<h1>${escapeHtml(title)}</h1>\n\n`;
  
  if (summary) {
    // Summary might be plain text or already HTML, wrap in <p> if needed
    const summaryHtml = summary.trim().startsWith('<') ? summary : `<p>${escapeHtml(summary)}</p>`;
    html += `${summaryHtml}\n\n`;
  }
  
  if (Array.isArray(outline)) {
    for (const section of outline) {
      if (section.heading) {
        // Use <h2> instead of markdown ## for WordPress
        html += `<h2>${escapeHtml(section.heading)}</h2>\n\n`;
      }
      if (section.body) {
        // Body already contains HTML tags from the prompt, use as-is
        html += `${section.body}\n\n`;
      }
    }
  }
  
  // Add CTA if present
  if (parsed.cta && parsed.cta.headline) {
    html += `<h2>${escapeHtml(parsed.cta.headline)}</h2>\n\n`;
    if (parsed.cta.body) {
      // CTA body might be plain text or HTML, wrap in <p> if needed
      const ctaBodyHtml = parsed.cta.body.trim().startsWith('<') 
        ? parsed.cta.body 
        : `<p>${escapeHtml(parsed.cta.body)}</p>`;
      html += `${ctaBodyHtml}\n\n`;
    }
    // Add CTA button/link if url_hint and buttonLabel are present
    if (parsed.cta.url_hint && parsed.cta.buttonLabel) {
      const url = parsed.cta.url_hint.startsWith('http') 
        ? parsed.cta.url_hint 
        : (parsed.cta.url_hint === 'TODO' ? '#' : parsed.cta.url_hint);
      html += `<p><a href="${escapeHtml(url)}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">${escapeHtml(parsed.cta.buttonLabel)}</a></p>\n\n`;
    }
  }
  
  return html.trim();
}

// Export convertJsonToMarkdown for use in resolvers
export { convertJsonToMarkdown };

/**
 * Try Imagen 3.0 as fallback
 */

/**
 * Generate image for content using Google Gemini only
 */
export const generateImage = async (
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> => {
  // Use integrated images API directly (no HTTP call needed)
  try {
    if (request.contentItemId) {
      const imageUrl = await generateImageForContent({
        contentItemId: request.contentItemId,
        title: request.title,
        description: request.description
      });
      console.log("[generateImage] ✅ Image generated via integrated API");
      return {
        imageUrl
      };
    }
  } catch (serviceError) {
    console.warn("[generateImage] ⚠️ Integrated images API not available, falling back to Gemini:", serviceError);
  }

  // Fallback to Google Gemini (original implementation)
  try {
    // Use Google Gemini only
    const hasGeminiKey = !!(config.SEO_AGENT.geminiApiKey || config.SEO_AGENT.googleApiKey);
    const apiKey = config.SEO_AGENT.geminiApiKey || config.SEO_AGENT.googleApiKey;
    
    console.log("[generateImage] 🔍 Checking Google Gemini API key:", {
      hasGeminiKey,
      hasGeminiApiKey: !!config.SEO_AGENT.geminiApiKey,
      hasGoogleApiKey: !!config.SEO_AGENT.googleApiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : "none"
    });

    if (!hasGeminiKey || !apiKey) {
      const errorMessage = "GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables";
      console.error("[generateImage] ❌", errorMessage);
      throw new Error(errorMessage);
    }

    try {
      console.log("[generateImage] ✅ Using Google Gemini for image generation");
      
      // Step 1: Generate detailed scene description using OpenAI
      console.log("[generateImage] 📝 Step 1: Generating detailed scene description...");
      const { generateSceneDescription } = await import("./contentGeneration/generateSceneDescription");
      
      const sceneDescription = await generateSceneDescription({
        title: request.title,
        description: request.description,
        projectContext: request.projectContext,
        hypothesisContext: request.hypothesisContext,
        icpContext: request.icpContext
      });
      
      console.log("[generateImage] ✅ Scene description generated:", sceneDescription.substring(0, 150) + "...");
      
      // Step 2: Build image prompt from scene description
      console.log("[generateImage] 🎨 Step 2: Building image prompt from scene description...");
      const { buildImagePrompt } = await import("./contentGeneration/buildImagePrompt");
      const imagePrompt = buildImagePrompt(sceneDescription, "hero");
      
      console.log("[generateImage] 📝 Prompt length:", imagePrompt.prompt.length, "chars");
      console.log("[generateImage] 📝 Prompt preview:", imagePrompt.prompt.substring(0, 200) + "...");
      
      // Use correct Imagen API endpoint format
      // Imagen 3.0 was shut down on Nov 10, 2025, using Imagen 4.0
      // Use :predict endpoint with instances/parameters format
      const model = "imagen-4.0-generate-001";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
      
      // Build request body in correct format: instances + parameters
      // Note: negativePrompt is no longer supported by Google Gemini Imagen API
      const requestBody: any = {
        instances: [{
          prompt: imagePrompt.prompt
        }],
        parameters: {
          sampleCount: 1
        }
      };
      
      // Add aspect ratio to parameters if available (may not be supported, but try)
      if (imagePrompt.aspectRatio) {
        // Try adding aspect ratio - if not supported, API will ignore it
        requestBody.parameters.aspectRatio = imagePrompt.aspectRatio;
      }
      
      // Note: negativePrompt is no longer supported - do not include it
      
      console.log("[generateImage] 🌐 Making request to Google Gemini API...");
      console.log("[generateImage] 🌐 URL:", apiUrl.replace(apiKey, "***"));
      console.log("[generateImage] 🌐 Request body keys:", Object.keys(requestBody));
      
      // Try Google Gemini Imagen API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      console.log("[generateImage] 🌐 Google Gemini response status:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("[generateImage] 📦 Google Gemini response data keys:", Object.keys(data));
        console.log("[generateImage] 📦 Response structure:", JSON.stringify(data).substring(0, 500));
        
        // Check for different response formats (Imagen 4.0 format)
        let imageBase64: string | null = null;
        
        // Format 1: Imagen 4.0 format - candidates[0].content.parts[0].inlineData.data
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const parts = data.candidates[0].content.parts;
          if (parts && parts[0] && parts[0].inlineData && parts[0].inlineData.data) {
            imageBase64 = parts[0].inlineData.data;
          }
        }
        // Format 2: Direct b64_json in response
        else if (data.b64_json) {
          imageBase64 = data.b64_json;
        }
        // Format 3: In data array
        else if (data.data && data.data[0] && data.data[0].b64_json) {
          imageBase64 = data.data[0].b64_json;
        }
        // Format 4: Direct imageBase64
        else if (data.imageBase64) {
          imageBase64 = data.imageBase64;
        }
        // Format 5: In generatedImages array
        else if (data.generatedImages && data.generatedImages[0] && data.generatedImages[0].imageBase64) {
          imageBase64 = data.generatedImages[0].imageBase64;
        }
        // Format 6: In predictions array (old format)
        else if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
          imageBase64 = data.predictions[0].bytesBase64Encoded;
        }
        
        if (imageBase64) {
          console.log("[generateImage] ✅✅✅ Image generated via Google Gemini");
          const imageDataLength = imageBase64.length;
          console.log("[generateImage] 📊 Image data length:", imageDataLength, "chars");
          // Convert base64 to data URL
          return {
            imageUrl: `data:image/png;base64,${imageBase64}`
          };
        } else {
          const errorDetails = JSON.stringify(data).substring(0, 500);
          console.warn("[generateImage] ⚠️ Google Gemini response OK but no image data:", errorDetails);
          throw new Error(`Google Gemini API returned success but no image data. Response: ${errorDetails}`);
        }
      } else {
        const errorText = await response.text();
        console.error("[generateImage] ❌ Google Gemini API error:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        });
        
        // Try to parse error JSON
        let errorMessage = `Google Gemini API error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = `Google Gemini API error: ${errorJson.error.message}`;
          }
        } catch {
          // Not JSON, use text as is
          if (errorText) {
            errorMessage = `Google Gemini API error: ${errorText.substring(0, 200)}`;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (geminiError: any) {
      if (geminiError.name === 'AbortError') {
        console.error("[generateImage] ⏱️ Google Gemini request timed out");
        throw new Error("Google Gemini API request timed out after 30 seconds");
      } else if (geminiError.message) {
        // Re-throw if it's already our formatted error
        throw geminiError;
      } else {
        console.error("[generateImage] ❌ Google Gemini image generation failed:", {
          message: geminiError?.message,
          stack: geminiError?.stack,
          error: geminiError
        });
        throw new Error(`Google Gemini image generation failed: ${geminiError?.message || String(geminiError)}`);
      }
    }
  } catch (error: any) {
    console.error("[generateImage] ❌ Error generating image:", {
      message: error.message,
      stack: error.stack,
      error
    });
    // Re-throw the error so it can be handled by the caller
    throw error;
  }
};


