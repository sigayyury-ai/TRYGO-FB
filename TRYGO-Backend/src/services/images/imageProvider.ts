import { ImagePrompt } from "./buildImagePrompt";

export type { ImagePrompt };

export interface ImageGenerationResult {
  imageUrl: string;
  imageData?: Buffer;
  format?: string;
}

// Flexible prompt format - can be ImagePrompt or simple object with prompt string
export type FlexibleImagePrompt = ImagePrompt | { prompt: string; aspectRatio?: string };

export interface ImageProvider {
  generate(prompt: FlexibleImagePrompt): Promise<ImageGenerationResult>;
}
