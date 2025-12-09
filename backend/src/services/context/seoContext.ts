import mongoose from "mongoose";

import {
  clusterClient,
  type ClusterRecord
} from "../semantics/clusterClient.js";

const toObjectId = (value: string) => {
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

export interface SeoContextSnapshot {
  project: Record<string, any> | null;
  hypothesis: Record<string, any> | null;
  leanCanvas: Record<string, any> | null;
  icp: Record<string, any> | null;
  clusters: ClusterRecord[];
  language: string | null;
}

const extractLanguage = (
  project: Record<string, any> | null,
  icp: Record<string, any> | null
): string | null => {
  const candidates = [
    icp?.language,
    icp?.locale,
    icp?.profileLanguage,
    project?.language,
    project?.info?.language,
    project?.settings?.language
  ];
  const language = candidates
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .find((candidate) => candidate.length > 0);
  return language ?? null;
};

export const loadSeoContext = async (
  projectId: string,
  hypothesisId: string
): Promise<SeoContextSnapshot> => {
  const projectObjectId = toObjectId(projectId);
  const hypothesisObjectId = toObjectId(hypothesisId);

  if (!projectObjectId || !hypothesisObjectId) {
    throw new Error("Invalid project or hypothesis identifier");
  }

  const db = mongoose.connection.db;

  const clustersPromise = clusterClient
    .list(projectId, hypothesisId)
    .catch((error: unknown) => {
      console.warn("[seoContext] Failed to load clusters from semantics service:", error);
      return [];
    });

  const [project, hypothesis, leanCanvas, personProfile, hypothesisCore, clusters] =
    await Promise.all([
    db
      .collection("projects")
      .findOne({ _id: projectObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load project", error);
        return null;
      }),
    db
      .collection("projectHypotheses")
      .findOne({ _id: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load hypothesis", error);
        return null;
      }),
    db
      .collection("hypothesesCores")
      .findOne({ projectHypothesisId: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load Lean Canvas (hypothesesCores)", error);
        return null;
      }),
    db
      .collection("hypothesesPersonProfiles")
      .findOne({ projectHypothesisId: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load person profile", error);
        return null;
      }),
    db
      .collection("hypothesesCores")
      .findOne({ projectHypothesisId: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load hypothesis core", error);
        return null;
      }),
    clustersPromise
  ]);

  // Map hypothesesPersonProfiles to expected ICP structure
  const resolvePersonaField = (): string | null => {
    if (!personProfile) {
      return null;
    }
    const candidates = [
      personProfile.persona,
      personProfile.personaName,
      personProfile.profileTitle,
      personProfile.profileName,
      personProfile.title,
      personProfile.name,
      personProfile.segment,
      personProfile.segmentName
    ];
    const personaCandidate = candidates
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value.length > 0);
    return personaCandidate ?? null;
  };

  const icp = personProfile
    ? {
        persona: resolvePersonaField(),
        pains: personProfile.userPains ?? personProfile.pains ?? [],
        goals: personProfile.userGoals ?? personProfile.goals ?? [],
        gains: personProfile.userGains ?? personProfile.gains ?? [],
        painRelievers: personProfile.painRelievers ?? [],
        triggers: personProfile.triggers ?? null,
        benefits: (personProfile.userGains ?? personProfile.gains) ?? [],
        objections: personProfile.objections ?? null,
        jtbd: personProfile.jtbd ?? null,
        customerJourney: personProfile.customerJourney ?? null
      }
    : null;

  return {
    project,
    hypothesis,
    leanCanvas,
    icp,
    clusters,
    language: extractLanguage(project, icp)
  };
};
