import { DraftImageAsset } from "../../db/models/DraftImageAsset.js";
import type { SeoContentDraftDoc } from "../../db/models/SeoContentDraft.js";
import type { SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea.js";
import { imageClient, type ImageVariant } from "./imageClient.js";
import { env } from "../../config/env.js";

interface GenerateImagesOptions {
  draft: SeoContentDraftDoc;
  idea: SeoBacklogIdeaDoc;
  userId: string;
  variants?: ImageVariant[];
}

const DEFAULT_VARIANTS: ImageVariant[] = ["hero"];

const deleteExistingImages = async (draftId: string) => {
  const existing = await DraftImageAsset.find({ draftId });
  const paths = existing
    .map((asset) => asset.storagePath)
    .filter((storagePath): storagePath is string => typeof storagePath === "string");
  if (paths.length > 0) {
    await imageClient.delete(paths);
  }
  await DraftImageAsset.deleteMany({ draftId });
};

export const generateDraftImages = async ({
  draft,
  idea,
  userId,
  variants
}: GenerateImagesOptions) => {
  await deleteExistingImages(draft.id);

  const images = await imageClient.generate(
    draft.id,
    {
      title: idea.title,
      description: idea.description,
      category: idea.category
    },
    variants && variants.length > 0 ? variants : DEFAULT_VARIANTS
  );

  const assets = [];

  for (const image of images) {
    const altText = `${idea.title} illustration (${image.variant})`;
    const asset = await DraftImageAsset.findOneAndUpdate(
      { draftId: draft.id, type: image.variant },
      {
        projectId: draft.projectId,
        hypothesisId: draft.hypothesisId,
        ideaId: draft.ideaId,
        draftId: draft.id,
        type: image.variant,
        provider: env.imageProvider === "gemini" ? "gemini" : "openai",
        prompt: image.prompt,
        negativePrompt: image.negativePrompt ?? null,
        style: image.style,
        aspectRatio: image.aspectRatio,
        storagePath: image.path,
        url: image.url,
        altText,
        createdBy: userId,
        updatedBy: userId
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    assets.push(asset);
  }

  return assets;
};


