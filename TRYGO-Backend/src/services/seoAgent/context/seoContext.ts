import mongoose from "mongoose";
import { SeoCluster, type SeoClusterDoc } from "../../../db/models/SeoCluster";

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
  // CRITICAL: Only use language from project settings (global setting)
  // Priority order: project.settings.language > project.language > project.info.language
  // Ignore ICP language settings - use only project-level global setting
  
  const candidates = [
    project?.settings?.language,  // Primary: global project settings
    project?.language,             // Secondary: direct project language
    project?.info?.language        // Tertiary: project info language
  ];
  
  // Log candidates for debugging
  console.log("[seoContext] Language extraction (GLOBAL SETTINGS ONLY):", {
    projectSettingsLanguage: project?.settings?.language,
    projectLanguage: project?.language,
    projectInfoLanguage: project?.info?.language,
    ignoredIcpLanguage: icp?.language,
    ignoredIcpLocale: icp?.locale
  });
  
  const language = candidates
    .map((candidate) => {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          // Normalize language values: "en", "EN", "english", "English" -> "English"
          const normalized = normalizeLanguage(trimmed);
          return normalized;
        }
      }
      return "";
    })
    .find((candidate) => candidate.length > 0);
  
  if (language) {
    console.log("[seoContext] Extracted language from global settings:", language);
  } else {
    console.warn("[seoContext] No language found in project global settings");
  }
  
  return language ?? null;
};

/**
 * Normalize language values to standard format
 * Maps common variations to standard names
 */
function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim();
  
  // English variations
  if (lower === "en" || lower === "english" || lower === "eng" || lower === "английский") {
    return "English";
  }
  
  // Russian variations
  if (lower === "ru" || lower === "russian" || lower === "rus" || lower === "русский" || lower === "ru-ru") {
    return "Russian";
  }
  
  // Return capitalized version if not recognized (preserve original if already capitalized)
  if (lang === lang.toUpperCase() || lang === lang.toLowerCase()) {
    return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
  }
  return lang; // Preserve original capitalization if mixed case
}

export const loadSeoContext = async (
  projectId: string,
  hypothesisId: string,
  userId?: string
): Promise<SeoContextSnapshot> => {
  const projectObjectId = toObjectId(projectId);
  const hypothesisObjectId = toObjectId(hypothesisId);

  if (!projectObjectId || !hypothesisObjectId) {
    throw new Error("Invalid project or hypothesis identifier");
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection not established");
  }

  // Load clusters directly from MongoDB (no HTTP call needed after integration)
  const clustersPromise = SeoCluster.find({
    projectId,
    hypothesisId
  })
    .sort({ updatedAt: -1 })
    .exec()
    .then((clusters: SeoClusterDoc[]): ClusterRecord[] => {
      return clusters.map((cluster) => ({
        id: cluster._id.toString(),
        projectId: cluster.projectId,
        hypothesisId: cluster.hypothesisId,
        title: cluster.title,
        intent: cluster.intent,
        keywords: cluster.keywords,
        createdBy: cluster.createdBy || "",
        updatedBy: cluster.updatedBy || "",
        createdAt: cluster.createdAt.toISOString(),
        updatedAt: cluster.updatedAt.toISOString()
      }));
    })
    .catch((error: unknown) => {
      console.warn("[seoContext] Failed to load clusters from database:", error);
      return [];
    });

  // Сначала загружаем проект, чтобы проверить его существование
  const project = await db
    .collection("projects")
    .findOne({ _id: projectObjectId })
    .catch((error) => {
      console.error("[seoContext] Failed to load project", error);
      return null;
    });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // ⭐ ПРОВЕРКА: проект должен принадлежать пользователю
  if (userId) {
    const projectUserId = typeof project.userId === 'object' 
      ? project.userId.toString() 
      : project.userId;
    
    if (projectUserId !== userId) {
      console.error(`[seoContext] ❌ Project ${projectId} does not belong to user ${userId}!`);
      console.error(`[seoContext] Project userId: ${projectUserId}, Request userId: ${userId}`);
      throw new Error(`Project ${projectId} does not belong to user ${userId}`);
    }
  }

  // Загружаем гипотезу с проверкой, что она принадлежит проекту
  const [hypothesis, leanCanvas, personProfile, hypothesisCore, clusters] =
    await Promise.all([
    db!
      .collection("projectHypotheses")
      .findOne({ 
        _id: hypothesisObjectId,
        projectId: projectObjectId  // КРИТИЧНО: проверяем принадлежность к проекту
      })
      .catch((error) => {
        console.error("[seoContext] Failed to load hypothesis", error);
        return null;
      }),
    db!
      .collection("hypothesesCores")
      .findOne({ projectHypothesisId: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load Lean Canvas (hypothesesCores)", error);
        return null;
      }),
    db!
      .collection("hypothesesPersonProfiles")
      .findOne({ projectHypothesisId: hypothesisObjectId })
      .catch((error) => {
        console.error("[seoContext] Failed to load person profile", error);
        return null;
      }),
    db!
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

  // Validate that hypothesis was found
  if (!hypothesis) {
    // Получаем список доступных гипотез для отладки
    const availableHypotheses = await db!
      .collection("projectHypotheses")
      .find({ projectId: projectObjectId })
      .toArray()
      .catch(() => []);
    
    const availableIds = availableHypotheses.map(h => h._id.toString());
    
    console.error(`[seoContext] ❌ Hypothesis not found! hypothesisId: ${hypothesisId}, projectId: ${projectId}`);
    console.error(`[seoContext] Project title: ${project.title}`);
    console.error(`[seoContext] Available hypotheses for this project: ${availableIds.join(", ")}`);
    
    throw new Error(
      `Hypothesis not found: ${hypothesisId} for project: ${projectId} (${project.title}). ` +
      `Available hypotheses: ${availableIds.length > 0 ? availableIds.join(", ") : "none"}`
    );
  }
  
  // Validate that hypothesis belongs to the project
  const hypothesisProjectId = typeof hypothesis.projectId === 'object' 
    ? hypothesis.projectId.toString() 
    : hypothesis.projectId;
    
  if (hypothesisProjectId !== projectId) {
    console.error(`[seoContext] ❌ Hypothesis belongs to different project!`);
    console.error(`[seoContext] Expected projectId: ${projectId}, but hypothesis.projectId: ${hypothesisProjectId}`);
    throw new Error(`Hypothesis ${hypothesisId} does not belong to project ${projectId}`);
  }
  
  const context = {
    project,
    hypothesis,
    leanCanvas,
    icp,
    clusters,
    language: extractLanguage(project, icp)
  };
  
  return context;
};
