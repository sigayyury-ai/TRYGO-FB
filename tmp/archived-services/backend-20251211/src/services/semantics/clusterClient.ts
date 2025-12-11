import { env } from "../../config/env.js";

export interface ClusterRecord {
  id: string;
  projectId: string;
  hypothesisId: string;
  title: string;
  intent: string;
  keywords: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ClusterPayload {
  projectId: string;
  hypothesisId: string;
  userId: string;
  title: string;
  intent: string;
  keywords: string[];
}

const baseUrl = env.semanticsServiceUrl;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? `Semantics service error (${response.status})`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

const encodeQuery = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

export const clusterClient = {
  list: async (projectId: string, hypothesisId: string): Promise<ClusterRecord[]> =>
    request<ClusterRecord[]>(
      `/clusters?${encodeQuery({ projectId, hypothesisId })}`
    ),

  create: async (payload: ClusterPayload): Promise<ClusterRecord> =>
    request<ClusterRecord>("/clusters", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  update: async (
    id: string,
    payload: Partial<ClusterPayload>
  ): Promise<ClusterRecord> =>
    request<ClusterRecord>(`/clusters/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  remove: async (id: string): Promise<{ success: boolean; id: string }> =>
    request<{ success: boolean; id: string }>(`/clusters/${id}`, {
      method: "DELETE"
    })
};

