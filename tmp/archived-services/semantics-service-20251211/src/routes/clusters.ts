import { Router } from "express";

import {
  SeoCluster,
  type SeoClusterDoc,
  type SeoClusterIntent
} from "../db/models/SeoCluster.js";
import {
  normaliseClusterIntent,
  normaliseKeywords
} from "../utils/normalise.js";

interface ClusterPayload {
  projectId: string;
  hypothesisId: string;
  userId: string;
  title: string;
  intent: SeoClusterIntent;
  keywords: string[];
}

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { projectId, hypothesisId } = req.query;

    if (!projectId || !hypothesisId) {
      return res.status(400).json({
        error: "projectId and hypothesisId are required"
      });
    }

    const clusters = await SeoCluster.find({
      projectId,
      hypothesisId
    })
      .sort({ updatedAt: -1 })
      .exec();

    res.json(clusters);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const cluster = await persistCluster(req.body as ClusterPayload);
    res.status(201).json(cluster);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectId, hypothesisId } = req.body as ClusterPayload;

    if (!projectId || !hypothesisId) {
      return res.status(400).json({
        error: "projectId and hypothesisId are required"
      });
    }

    const cluster = await SeoCluster.findOne({
      _id: id,
      projectId,
      hypothesisId
    }).exec();

    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }

    const updated = await persistCluster(
      { ...cluster.toObject(), ...req.body },
      cluster
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const cluster = await SeoCluster.findByIdAndDelete(id).exec();
    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    res.json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

async function persistCluster(
  payload: Partial<ClusterPayload>,
  existing?: SeoClusterDoc | null
) {
  const {
    projectId,
    hypothesisId,
    userId,
    title,
    intent,
    keywords = []
  } = payload;

  if (!projectId || !hypothesisId || !userId) {
    throw new Error("projectId, hypothesisId, and userId are required");
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new Error("Cluster title is required");
  }

  const normalisedIntent = normaliseClusterIntent(intent);
  const keywordList = normaliseKeywords(keywords);

  if (existing) {
    existing.title = title.trim();
    existing.intent = normalisedIntent;
    existing.keywords = keywordList;
    existing.updatedBy = userId;
    return existing.save();
  }

  return SeoCluster.create({
    projectId,
    hypothesisId,
    title: title.trim(),
    intent: normalisedIntent,
    keywords: keywordList,
    createdBy: userId,
    updatedBy: userId
  });
}

export const clustersRouter = router;

