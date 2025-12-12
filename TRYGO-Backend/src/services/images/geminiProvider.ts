import { config } from "../../constants/config/env";
import { ImageProvider, ImageGenerationResult, FlexibleImagePrompt } from "./imageProvider";

export class GeminiProvider implements ImageProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    const apiKey = config.IMAGE_CONFIG.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required when IMAGE_PROVIDER=gemini");
    }

    this.apiKey = apiKey;
    this.baseUrl = config.IMAGE_CONFIG.geminiApiBaseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.model = config.IMAGE_CONFIG.geminiImageModel || "imagen-4.0-generate-001";
  }

  async generate(prompt: FlexibleImagePrompt): Promise<ImageGenerationResult> {
    try {
      console.log(`[Gemini Provider] Generating image with model: ${this.model}`);
      console.log(`[Gemini Provider] Prompt length: ${prompt.prompt.length} characters`);

      // Use Imagen 4.0 API endpoint format
      const apiUrl = `${this.baseUrl}/models/${this.model}:predict?key=${this.apiKey}`;

      // Extract prompt string from ImagePrompt object
      const promptText = prompt.prompt;
      
      // Build request body in correct format: instances + parameters
      const requestBody: any = {
        instances: [{
          prompt: promptText
        }],
        parameters: {
          sampleCount: 1
        }
      };

      // Add aspect ratio to parameters if available
      if (prompt.aspectRatio) {
        requestBody.parameters.aspectRatio = prompt.aspectRatio;
      }

      console.log(`[Gemini Provider] Making request to Google Gemini Imagen API...`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });

      console.log(`[Gemini Provider] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Gemini API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log(`[Gemini Provider] Response data keys:`, Object.keys(data));
      console.log(`[Gemini Provider] Response structure:`, JSON.stringify(data).substring(0, 1000));

      // Extract image from Imagen API response format
      let imageBase64: string | null = null;

      // Primary format: predictions[0].bytesBase64Encoded (Imagen API format)
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        imageBase64 = data.predictions[0].bytesBase64Encoded;
        console.log(`[Gemini Provider] ✅ Found image in predictions[0].bytesBase64Encoded format`);
      }
      // Format: candidates[0].content.parts[0].inlineData.data (Gemini text models)
      else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].inlineData && parts[0].inlineData.data) {
          imageBase64 = parts[0].inlineData.data;
          console.log(`[Gemini Provider] ✅ Found image in candidates format`);
        }
      }
      // Fallback formats
      else if (data.b64_json) {
        imageBase64 = data.b64_json;
        console.log(`[Gemini Provider] ✅ Found image in b64_json format`);
      }
      else if (data.data && data.data[0] && data.data[0].b64_json) {
        imageBase64 = data.data[0].b64_json;
        console.log(`[Gemini Provider] ✅ Found image in data[0].b64_json format`);
      }
      else if (data.imageBase64) {
        imageBase64 = data.imageBase64;
        console.log(`[Gemini Provider] ✅ Found image in imageBase64 format`);
      }
      else if (data.generatedImages && data.generatedImages[0] && data.generatedImages[0].imageBase64) {
        imageBase64 = data.generatedImages[0].imageBase64;
        console.log(`[Gemini Provider] ✅ Found image in generatedImages format`);
      }

      if (!imageBase64) {
        console.error(`[Gemini Provider] ❌ Response structure:`, JSON.stringify(data, null, 2).substring(0, 2000));
        throw new Error("Google Gemini returned no image data in expected format");
      }

      // Convert base64 to Buffer
      const imageData = Buffer.from(imageBase64, "base64");
      const format = "png"; // Imagen returns PNG

      return {
        imageUrl: "", // Will be set after saving to storage
        imageData,
        format
      };
    } catch (error: any) {
      console.error(`[Gemini Provider] Error generating image:`, error);
      throw new Error(`Google Gemini image generation failed: ${error.message || String(error)}`);
    }
  }
}

