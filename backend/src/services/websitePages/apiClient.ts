import { env } from "../../config/env.js";

export interface WebsitePageContextPayload {
  project?: Record<string, any> | null;
  hypothesis?: Record<string, any> | null;
  leanCanvas?: Record<string, any> | null;
  icp?: Record<string, any> | null;
  language?: string | null;
}

export interface WebsitePageClusterPayload {
  id: string;
  title: string;
  intent: string;
  keywords: string[];
}

export interface WebsitePageGenerationRequest {
  context: WebsitePageContextPayload;
  cluster: WebsitePageClusterPayload;
  persona?: string | null;
}

interface WebsitePageGenerationResponse {
  payload: any;
  prompt: string;
  model: string;
}

export const websitePageServiceClient = {
  async generate(input: WebsitePageGenerationRequest): Promise<WebsitePageGenerationResponse> {
    const response = await fetch(`${env.websitePagesServiceUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error ?? response.statusText ?? "Website page service error";
      throw new Error(message);
    }

    return response.json() as Promise<WebsitePageGenerationResponse>;
  }
};
