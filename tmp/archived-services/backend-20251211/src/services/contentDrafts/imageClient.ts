import { env } from "../../config/env.js";

export interface ImageIdeaPayload {
  title: string;
  description?: string | null;
  category?: string | null;
}

export type ImageVariant = "hero" | "inline";

export interface GeneratedImage {
  variant: ImageVariant;
  prompt: string;
  negativePrompt?: string | null;
  style: string;
  aspectRatio: string;
  path: string;
  url: string;
}

interface GenerateImagesResponse {
  success: boolean;
  images: GeneratedImage[];
}

const baseUrl = env.imagesServiceUrl ?? "http://localhost:4300";

export const imageClient = {
  async generate(draftId: string, idea: ImageIdeaPayload, variants?: ImageVariant[]) {
    const response = await fetch(`${baseUrl}/api/images/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        draftId,
        idea,
        variants
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Images service error (${response.status} ${response.statusText}): ${errorBody}`
      );
    }

    const payload = (await response.json()) as GenerateImagesResponse;
    return payload.images ?? [];
  },

  async delete(paths: string[]) {
    if (!paths.length) return;
    await fetch(`${baseUrl}/api/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ paths })
    }).catch((error) => {
      console.warn("Failed to delete images via image service", error);
    });
  }
};


