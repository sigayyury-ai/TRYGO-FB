import type { SeoClusterIntent } from "../db/models/SeoCluster.js";

const CLUSTER_INTENTS: SeoClusterIntent[] = [
  "commercial",
  "transactional",
  "informational",
  "navigational"
];

export const normaliseClusterIntent = (
  value: unknown,
  fallback: SeoClusterIntent = "informational"
): SeoClusterIntent => {
  if (typeof value === "string") {
    const candidate = value.trim().toLowerCase();
    if (CLUSTER_INTENTS.includes(candidate as SeoClusterIntent)) {
      return candidate as SeoClusterIntent;
    }
  }
  return fallback;
};

export const normaliseKeywords = (value: unknown): string[] => {
  const unique = new Set<string>();
  const output: string[] = [];

  const ingest = (entry: unknown) => {
    if (typeof entry !== "string") {
      return;
    }
    const keyword = entry.trim();
    if (!keyword) {
      return;
    }
    const fingerprint = keyword.toLowerCase();
    if (unique.has(fingerprint)) {
      return;
    }
    unique.add(fingerprint);
    output.push(keyword);
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      ingest(item);
    }
    return output;
  }

  if (typeof value === "string") {
    value.split(/\r?\n/).forEach(ingest);
    return output;
  }

  return output;
};

