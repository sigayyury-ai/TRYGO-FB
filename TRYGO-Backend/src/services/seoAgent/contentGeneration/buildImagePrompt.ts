export type ImageVariant = "hero" | "inline";

export interface ImagePrompt {
  prompt: string;
  negativePrompt: string;
  style: string;
  aspectRatio: string;
}

/**
 * Build image generation prompt from detailed scene description
 * The scene description should already contain all visual details
 */
export function buildImagePrompt(
  sceneDescription: string,
  variant: ImageVariant = "hero"
): ImagePrompt {
  // Clean and prepare the scene description
  const cleanDescription = sceneDescription.trim().replace(/\s+/g, " ");

  // Add framing instructions based on variant
  const framing =
    variant === "hero"
      ? "Focus the composition as a cinematic wide shot with a pronounced foreground. Use a 16:9 aspect ratio."
      : "Create a tighter composition, emphasizing key details in the middle ground. Use a 4:3 aspect ratio.";

  // Build the final prompt with creative freedom
  const prompt = [
    "Create a compelling, authentic photograph based on this creative scene description:",
    "",
    cleanDescription,
    "",
    "Style and quality:",
    "- Realistic, natural photography with authentic feel",
    "- Professional quality but not overly polished or stock-photo-like",
    "- Natural colors and textures that feel real",
    "- Creative composition that serves the scene (not formulaic)",
    "- Vary the approach - each image should feel unique",
    framing,
    "",
    "Absolutely no text or graphics:",
    "- NO text, words, letters, numbers, symbols, or captions",
    "- NO logos, UI elements, watermarks, memes, or infographics",
    "- NO design overlays or graphical elements",
    "- Pure photography only"
  ].join("\n");

  const aspectRatio = variant === "hero" ? "16:9" : "4:3";

  return {
    prompt,
    negativePrompt:
      "text, letters, words, numbers, captions, typography, logos, ui elements, watermarks, memes, infographics, low quality, noisy texture, overexposed lighting, unrealistic anatomy, plastic skin, graphical elements, design overlays",
    style: "realistic photography",
    aspectRatio
  };
}





