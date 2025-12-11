import path from "node:path";
import { env } from "../../config/env.js";
import { WordPressConnection } from "../../db/models/WordPressConnection.js";

export interface WordPressAuthConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
}

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

interface UploadMediaParams {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
  altText?: string | null;
}

interface UploadMediaResult {
  id: number;
  url: string;
}

interface CreatePostParams {
  title: string;
  content: string;
  excerpt?: string;
  status?: "publish" | "draft" | "pending";
  featuredMediaId?: number | null;
  slug?: string | null;
  categories?: number[];
  tags?: number[];
  postType?: string;
}

interface CreatePostResult {
  id: number;
  link: string;
  status: string;
}

const DEFAULT_CONNECTION_KEY = "default";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function buildAuthHeader(config: WordPressAuthConfig): string {
  return Buffer.from(`${config.username}:${config.appPassword}`).toString("base64");
}

async function resolveConfig(override?: WordPressAuthConfig): Promise<WordPressAuthConfig> {
  if (override) {
    return {
      ...override,
      baseUrl: normalizeBaseUrl(override.baseUrl)
    };
  }

  if (env.wordpress?.baseUrl && env.wordpress?.username && env.wordpress?.appPassword) {
    return {
      baseUrl: normalizeBaseUrl(env.wordpress.baseUrl),
      username: env.wordpress.username,
      appPassword: env.wordpress.appPassword
    };
  }

  const record = await WordPressConnection.findOne({ key: DEFAULT_CONNECTION_KEY }).exec();
  if (!record) {
    throw new Error("WordPress integration is not configured");
  }

  return {
    baseUrl: normalizeBaseUrl(record.baseUrl),
    username: record.username,
    appPassword: record.appPassword
  };
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WordPress API error (${response.status} ${response.statusText}): ${body}`);
  }
  return response;
}

export async function uploadMedia(
  { filename, buffer, mimeType = "image/png", altText }: UploadMediaParams,
  overrideConfig?: WordPressAuthConfig
): Promise<UploadMediaResult> {
  const config = await resolveConfig(overrideConfig);
  const endpoint = `${config.baseUrl}/wp-json/wp/v2/media`;
  const binaryBody = bufferToArrayBuffer(buffer);

  const response = await handleResponse(
    await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildAuthHeader(config)}`,
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename=\"${path.basename(filename)}\"`
      },
      body: binaryBody
    })
  );

  const payload = await response.json();

  if (altText && payload?.id) {
    try {
      await handleResponse(
        await fetch(`${endpoint}/${payload.id}`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${buildAuthHeader(config)}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ alt_text: altText })
        })
      );
    } catch (error) {
      console.warn("Failed to set alt text for media", error);
    }
  }

  return {
    id: payload.id,
    url: payload.source_url ?? payload.guid?.rendered ?? ""
  };
}

export async function createPost(
  {
    title,
    content,
    excerpt,
    status = "draft",
    featuredMediaId,
    slug,
    categories,
    tags,
    postType
  }: CreatePostParams,
  overrideConfig?: WordPressAuthConfig
): Promise<CreatePostResult> {
  const config = await resolveConfig(overrideConfig);
  const resource = postType && postType.trim().length > 0 ? postType.trim() : "posts";
  const endpoint = `${config.baseUrl}/wp-json/wp/v2/${resource}`;

  const body: Record<string, any> = {
    title,
    content,
    status,
    excerpt,
    featured_media: featuredMediaId ?? undefined,
    slug: slug ?? undefined,
    categories,
    tags
  };

  const response = await handleResponse(
    await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${buildAuthHeader(config)}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
  );

  const payload = await response.json();
  return {
    id: payload.id,
    link: payload.link,
    status: payload.status
  };
}

export async function testWordPressConnection(config: WordPressAuthConfig) {
  const normalized = await resolveConfig(config);
  const response = await fetch(`${normalized.baseUrl}/wp-json/wp/v2/posts?per_page=1`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${buildAuthHeader(normalized)}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `WordPress credentials test failed (${response.status} ${response.statusText}): ${body}`
    );
  }
}

async function fetchAllPages<T = any>(endpoint: string, config: WordPressAuthConfig): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const querySeparator = endpoint.includes("?") ? "&" : "?";
    const response = await handleResponse(
      await fetch(`${endpoint}${querySeparator}per_page=100&page=${page}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${buildAuthHeader(config)}`
        }
      })
    );

    const data = (await response.json()) as T[];
    results.push(...data);

    const headerTotalPages = response.headers.get("X-WP-TotalPages");
    totalPages = headerTotalPages ? Number(headerTotalPages) || 1 : 1;
    page += 1;
  } while (page <= totalPages);

  return results;
}

export async function fetchWordPressCategories(config?: WordPressAuthConfig) {
  const resolved = await resolveConfig(config);
  const endpoint = `${resolved.baseUrl}/wp-json/wp/v2/categories`;
  return fetchAllPages(endpoint, resolved);
}

export async function fetchWordPressTags(config?: WordPressAuthConfig) {
  const resolved = await resolveConfig(config);
  const endpoint = `${resolved.baseUrl}/wp-json/wp/v2/tags`;
  return fetchAllPages(endpoint, resolved);
}

export async function fetchWordPressPostTypes(config?: WordPressAuthConfig) {
  const resolved = await resolveConfig(config);
  const endpoint = `${resolved.baseUrl}/wp-json/wp/v2/types`;
  const response = await handleResponse(
    await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${buildAuthHeader(resolved)}`
      }
    })
  );
  const payload = await response.json();
  return payload;
}
