import mongoose from "mongoose";

import {
  SeoBacklogIdea,
  type SeoBacklogIdeaAttrs
} from "../../db/models/SeoBacklogIdea.js";
import {
  SeoContentItem,
  type SeoContentItemAttrs
} from "../../db/models/SeoContentItem.js";
import type { ClusterRecord } from "../semantics/clusterClient.js";
import { clusterClient } from "../semantics/clusterClient.js";
import { INITIAL_BACKLOG, CONTENT_SEED } from "./seedData.js";

interface SeedParams {
  projectId: string;
  hypothesisId: string;
  userId: string;
}

export const CLUSTER_FIXTURES: Array<
  Pick<ClusterRecord, "title" | "intent" | "keywords">
> = [
  {
    title: "Remote IT support pricing",
    intent: "commercial",
    keywords: [
      "remote it support pricing",
      "it support cost per user",
      "outsourced it support rates",
      "remote help desk pricing"
    ]
  },
  {
    title: "24/7 network monitoring",
    intent: "commercial",
    keywords: [
      "24/7 network monitoring services",
      "remote infrastructure monitoring",
      "managed network monitoring",
      "continuous network monitoring"
    ]
  },
  {
    title: "Remote onboarding process",
    intent: "informational",
    keywords: [
      "remote employee onboarding checklist",
      "virtual onboarding best practices",
      "remote onboarding tools"
    ]
  },
  {
    title: "Co-managed IT services",
    intent: "transactional",
    keywords: [
      "co managed it support",
      "co managed it pricing",
      "co managed it service providers"
    ]
  }
];

export const seedSeoAgent = async ({
  projectId,
  hypothesisId,
  userId
}: SeedParams) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const clusterIdsMap = await ensureClusters({
      projectId,
      hypothesisId,
      userId
    });

    const backlogCount = await SeoBacklogIdea.countDocuments(
      { projectId, hypothesisId },
      { session }
    ).exec();
    if (backlogCount < INITIAL_BACKLOG.length) {
      const existingTitles = new Set(
        (
          await SeoBacklogIdea.find(
            { projectId, hypothesisId },
            { title: 1 },
            { session }
          ).exec()
        ).map((doc) => doc.title)
      );
      const backlogDocs: SeoBacklogIdeaAttrs[] = INITIAL_BACKLOG.filter(
        (idea) => !existingTitles.has(idea.title)
      ).map((idea) => ({
        projectId,
        hypothesisId,
        clusterId: clusterIdsMap[lookupClusterTitle(idea.category)] ?? undefined,
        title: idea.title,
        description: idea.description,
        category: idea.category as SeoBacklogIdeaAttrs["category"],
        status: "backlog",
        createdBy: userId,
        updatedBy: userId
      }));
      if (backlogDocs.length > 0) {
        await SeoBacklogIdea.insertMany(backlogDocs, { session });
      }
    }

    const contentCount = await SeoContentItem.countDocuments(
      { projectId, hypothesisId },
      { session }
    ).exec();
    if (contentCount < 12) {
      const existingTitles = new Set(
        (
          await SeoContentItem.find(
            { projectId, hypothesisId },
            { title: 1 },
            { session }
          ).exec()
        ).map((doc) => doc.title)
      );
      const contentDocs: SeoContentItemAttrs[] = Object.entries(CONTENT_SEED)
        .flatMap(([category, titles]) =>
          titles
            .filter((title) => !existingTitles.has(title))
            .map((title) => ({
              projectId,
              hypothesisId,
              backlogIdeaId:
                clusterIdsMap[lookupClusterTitle(category)] ?? undefined,
              title,
              category: category as SeoContentItemAttrs["category"],
              format: (category === "feature" || category === "benefit"
                ? "commercial"
                : category === "faq"
                ? "faq"
                : "blog") as SeoContentItemAttrs["format"],
              status: "draft" as SeoContentItemAttrs["status"],
              createdBy: userId,
              updatedBy: userId
            }))
        )
        .slice(0, 12);

      if (contentDocs.length > 0) {
        await SeoContentItem.insertMany(contentDocs, { session });
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const ensureClusters = async ({
  projectId,
  hypothesisId,
  userId
}: SeedParams): Promise<Record<string, string>> => {
  const existing = await clusterClient.list(projectId, hypothesisId);
  const byTitle = new Map(
    existing.map((item) => [item.title.trim().toLowerCase(), item])
  );

  const missing = CLUSTER_FIXTURES.filter(
    (fixture) => !byTitle.has(fixture.title.trim().toLowerCase())
  );

  for (const fixture of missing) {
    await clusterClient.create({
      projectId,
      hypothesisId,
      userId,
      title: fixture.title,
      intent: fixture.intent,
      keywords: fixture.keywords
    });
  }

  const refreshed = missing.length
    ? await clusterClient.list(projectId, hypothesisId)
    : existing;

  return refreshed.reduce<Record<string, string>>((acc, doc) => {
    acc[doc.title] = doc.id;
    return acc;
  }, {});
};

const lookupClusterTitle = (category: string): string => {
  switch (category) {
    case "pain":
      return "Remote IT support pricing";
    case "goal":
      return "Remote onboarding process";
    case "trigger":
      return "24/7 network monitoring";
    case "feature":
      return "Remote IT support pricing";
    case "benefit":
      return "Co-managed IT services";
    case "faq":
      return "Remote onboarding process";
    default:
      return "Remote onboarding process";
  }
};
