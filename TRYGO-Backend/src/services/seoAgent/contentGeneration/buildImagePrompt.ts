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

  // Build the final prompt in English
  const prompt = [
    "Create a realistic, detailed, professional photograph based on the following precise scene description:",
    "",
    cleanDescription,
    "",
    "Technical requirements:",
    "- Realistic photography style: natural, authentic, and lifelike",
    "- Clear, natural colors with realistic textures",
    "- Thoughtful composition with foreground, middle ground, and background layers",
    "- No glossy magazine aesthetic - aim for authentic, professional photography",
    "- High quality, sharp focus on the main subject",
    framing,
    "",
    "Strict exclusions:",
    "- NO text blocks, captions, words, letters, numbers, or symbols of any kind",
    "- NO logos, memes, infographics, UI elements, or watermarks",
    "- NO graphical elements or design overlays",
    "- The image must be completely free of any textual information"
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





