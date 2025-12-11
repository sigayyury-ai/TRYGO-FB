import { config } from "../../constants/config/env";
import { ImageProvider } from "./imageProvider";
import { saveImage } from "./imageStorage";

interface GenerateImageOptions {
  contentItemId: string;
  title: string;
  description?: string;
  variant?: "hero" | "inline";
}

/**
 * Get the appropriate image provider based on configuration
 */
function getImageProvider(): ImageProvider {
  const providerType = config.IMAGE_CONFIG.provider;

  if (providerType === "gemini") {
    const { GeminiProvider } = require("./geminiProvider");
    return new GeminiProvider();
  }

  // Only Gemini/Imagen is supported
  throw new Error(`Unsupported image provider: ${providerType}. Only 'gemini' is supported.`);
}

/**
 * Generate image for content item using Google Gemini/Imagen
 */
export async function generateImageForContent(
  options: GenerateImageOptions
): Promise<string> {
  const { contentItemId, title, description, variant = "hero" } = options;

  try {
    console.log(`[Image Service] 🎨 Starting image generation:`, {
      contentItemId,
      title: title?.substring(0, 100),
      variant,
      hasDescription: !!description
    });

    // For Gemini/Imagen, generate scene description first, then build prompt
    let sceneDescription: string;
    
    try {
      // Generate detailed scene description using OpenAI (for better prompts)
      const { generateSceneDescription } = await import("../seoAgent/contentGeneration/generateSceneDescription");
      sceneDescription = await generateSceneDescription({
        title,
        description,
        projectContext: undefined,
        hypothesisContext: undefined,
        icpContext: undefined
      });
      console.log(`[Image Service] ✅ Scene description generated (${sceneDescription.length} chars)`);
    } catch (sceneError: any) {
      // Fallback: use title and description directly
      console.warn(`[Image Service] ⚠️ Scene description generation failed, using direct:`, sceneError?.message);
      sceneDescription = description || title;
    }

    // Build image prompt from scene description (Gemini/Imagen format)
    const { buildImagePrompt: buildGeminiPrompt } = await import("../seoAgent/contentGeneration/buildImagePrompt");
    const imagePrompt = buildGeminiPrompt(sceneDescription, variant);

    console.log(`[Image Service] 📝 Built prompt (${imagePrompt.prompt.length} chars)`);

    // Generate image using provider (pass full ImagePrompt for Gemini)
    const provider = getImageProvider();
    const result = await provider.generate(imagePrompt);

    console.log(`[Image Service] ✅ Image generated, saving to storage...`);

    // Save image to storage
    const savedImage = await saveImage({
      contentItemId,
      variant,
      imageData: result.imageData!,
      format: result.format || "png"
    });

    console.log(`[Image Service] ✅ Image saved: ${savedImage.publicUrl}`);

    return savedImage.publicUrl;
  } catch (error: any) {
    console.error(`[Image Service] ❌ Error in generateImageForContent:`, {
      contentItemId,
      title: title?.substring(0, 100),
      error: error?.message || String(error),
      errorType: error?.constructor?.name || typeof error
    });
    throw error;
  }
}
