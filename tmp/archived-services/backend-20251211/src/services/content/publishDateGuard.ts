import mongoose from "mongoose";

import { SeoContentItem } from "../../db/models/SeoContentItem.js";

interface PublishDateGuardOptions {
  projectId: string;
  hypothesisId: string;
  publishDate: Date | null | undefined;
  excludeId?: string;
  allowOverride?: boolean;
}

export async function assertPublishDateAvailable({
  projectId,
  hypothesisId,
  publishDate,
  excludeId,
  allowOverride = false
}: PublishDateGuardOptions): Promise<void> {
  if (!publishDate || allowOverride) {
    return;
  }

  const query: Record<string, unknown> = {
    projectId,
    hypothesisId,
    publishDate
  };

  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const conflict = await SeoContentItem.findOne(query).lean().exec();
  if (conflict) {
    const error = new Error("Publish date already assigned to another item");
    (error as any).code = "PUBLISH_DATE_CONFLICT";
    (error as any).conflictContentId = conflict._id?.toString?.();
    throw error;
  }
}





