// Website Pages service is now integrated into TRYGO-Backend
// Use direct import instead of HTTP calls
import { 
  generateWebsitePageIdea, 
  type WebsitePageGenerationRequest,
  type WebsitePageGenerationResult,
  type WebsitePageContextPayload,
  type WebsitePageClusterPayload
} from "./generator";

// Re-export types for backward compatibility
export type { 
  WebsitePageContextPayload,
  WebsitePageClusterPayload,
  WebsitePageGenerationRequest 
};

export interface WebsitePageGenerationResponse {
  payload: any;
  prompt: string;
  model: string;
}

// Direct function call instead of HTTP request
export const websitePageServiceClient = {
  async generate(input: WebsitePageGenerationRequest): Promise<WebsitePageGenerationResponse> {
    return generateWebsitePageIdea(input);
  }
};
