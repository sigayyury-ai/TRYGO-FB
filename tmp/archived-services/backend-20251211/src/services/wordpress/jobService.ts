import { WordPressPublishJob } from "../../db/models/WordPressPublishJob.js";
import { SeoContentDraft } from "../../db/models/SeoContentDraft.js";
import { SeoBacklogIdea } from "../../db/models/SeoBacklogIdea.js";
import { DraftImageAsset } from "../../db/models/DraftImageAsset.js";
import { getActiveWordPressConnection } from "./connectionService.js";

interface EnqueueJobOptions {
  draftId: string;
  ideaId?: string | null;
  userId: string;
  publishAt?: Date;
  payload?: Record<string, unknown>;
}

function slugify(input: string, fallback: string): string {
  if (!input?.trim()) {
    return fallback;
  }
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : fallback;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

export async function enqueuePublishJob({
  draftId,
  ideaId,
  userId,
  publishAt,
  payload = {}
}: EnqueueJobOptions) {
  const connection = await getActiveWordPressConnection();
  if (!connection) {
    throw new Error("WordPress integration is not configured");
  }

  const draft = await SeoContentDraft.findById(draftId).exec();
  if (!draft) {
    throw new Error("Draft not found");
  }

  if (!draft.title?.trim() || !draft.body?.trim()) {
    throw new Error("Draft must have title and body before publishing");
  }

  const heroImage = await DraftImageAsset.findOne({ draftId, type: "hero" }).exec();
  if (!heroImage) {
    throw new Error("Hero image is required before publishing to WordPress");
  }

  if (!ideaId) {
    const idea = await SeoBacklogIdea.findOne({ _id: draft.ideaId }).exec();
    ideaId = idea?._id?.toString() ?? draft.ideaId ?? null;
  }

  const { settings } = connection;
  const isArticle = draft.contentType !== "website_page";
  const categories: number[] = [];

  const categoryId = isArticle ? settings.articleCategoryId : settings.pageCategoryId;
  if (typeof categoryId === "number" && Number.isFinite(categoryId)) {
    categories.push(categoryId);
  }

  const tags = isArticle ? settings.articleTagIds : settings.pageTagIds;
  const sanitizedTags = isNumberArray(tags)
    ? tags.filter((tag) => typeof tag === "number" && Number.isFinite(tag) && tag > 0)
    : [];

  const slug = slugify(draft.title ?? `draft-${draft.id}`, `draft-${draft.id}`);
  const publishStatus = settings.defaultStatus ?? "draft";
  const postType = isArticle ? settings.articlePostType ?? "posts" : settings.pagePostType ?? "pages";
  const jobPayload = {
    ...payload,
    heroUrl: heroImage.url,
    status: publishStatus,
    categories,
    tags: sanitizedTags,
    postType,
    slug,
    contentType: draft.contentType
  };

  const existingJob = await WordPressPublishJob.findOne({
    draftId,
    status: { $in: ["queued", "publishing"] }
  }).exec();

  if (existingJob) {
    if (!publishAt) {
      throw new Error("Draft already has a publish job in progress");
    }

    existingJob.publishAt = publishAt;
    existingJob.status = "queued";
    existingJob.payload = jobPayload;
    existingJob.error = null;
    existingJob.message =
      payload?.reason === "manual"
        ? "Manual publish request refreshed"
        : "Scheduled publish updated";
    existingJob.startedAt = null;
    existingJob.finishedAt = null;
    await existingJob.save();
    return existingJob;
  }

  const job = await WordPressPublishJob.create({
    draftId,
    ideaId: ideaId ?? draft.ideaId,
    projectId: draft.projectId,
    hypothesisId: draft.hypothesisId,
    targetSite: connection.config.baseUrl,
    status: "queued",
    publishAt: publishAt ?? new Date(),
    payload: jobPayload,
    message:
      payload?.reason === "manual"
        ? "Manual publish request enqueued"
        : "Scheduled publish request enqueued",
    createdBy: userId
  });

  return job;
}

export async function retryPublishJob(jobId: string, userId: string) {
  const job = await WordPressPublishJob.findById(jobId).exec();
  if (!job) {
    throw new Error("Publish job not found");
  }

  if (job.status === "publishing") {
    throw new Error("Cannot retry a job that is currently publishing");
  }

  job.status = "queued";
  job.publishAt = new Date();
  job.error = null;
  job.message = `Retry requested by ${userId}`;
  job.startedAt = null;
  job.finishedAt = null;
  await job.save();

  return job;
}

export async function listPublishJobs(options: {
  projectId?: string;
  hypothesisId?: string;
  limit?: number;
}) {
  const filter: Record<string, any> = {};

  if (options.projectId) {
    filter.projectId = options.projectId;
  }

  if (options.hypothesisId) {
    filter.hypothesisId = options.hypothesisId;
  }

  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));

  const jobs = await WordPressPublishJob.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return jobs;
}
