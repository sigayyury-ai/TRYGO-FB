import { Router, type Request, type Response, type NextFunction } from "express";
import {
  SeoCluster,
  type SeoClusterDoc,
  type SeoClusterIntent
} from "../db/models/SeoCluster";
import {
  normaliseClusterIntent,
  normaliseKeywords
} from "../utils/normalise";

interface ClusterPayload {
  projectId: string;
  hypothesisId: string;
  userId: string;
  title: string;
  intent: SeoClusterIntent;
  keywords: string[];
}

const router = Router();

/**
 * GET /api/clusters
 * Get all clusters for a project and hypothesis
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, hypothesisId } = req.query;

    if (!projectId || !hypothesisId) {
      return res.status(400).json({
        error: "projectId and hypothesisId are required"
      });
    }

    // Removed verbose logging

    const clusters = await SeoCluster.find({
      projectId: String(projectId),
      hypothesisId: String(hypothesisId)
    })
      .sort({ updatedAt: -1 })
      .exec();

    console.log(`[Clusters API] Found ${clusters.length} clusters`);
    res.json(clusters);
  } catch (error) {
    console.error("[Clusters API] Error in GET /api/clusters:", error);
    next(error);
  }
});

/**
 * POST /api/clusters
 * Create a new cluster
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("[Clusters API] POST /api/clusters - body:", JSON.stringify(req.body));
    
    const cluster = await persistCluster(req.body as ClusterPayload);
    
    console.log(`[Clusters API] Created cluster with id: ${cluster._id}`);
    res.status(201).json(cluster);
  } catch (error) {
    console.error("[Clusters API] Error in POST /api/clusters:", error);
    next(error);
  }
});

/**
 * PUT /api/clusters/:id
 * Update an existing cluster
 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { projectId, hypothesisId } = req.body as ClusterPayload;

    if (!projectId || !hypothesisId) {
      return res.status(400).json({
        error: "projectId and hypothesisId are required"
      });
    }

    // Removed verbose logging

    const cluster = await SeoCluster.findOne({
      _id: id,
      projectId,
      hypothesisId
    }).exec();

    if (!cluster) {
      console.log(`[Clusters API] Cluster not found: ${id}`);
      return res.status(404).json({ error: "Cluster not found" });
    }

    const updated = await persistCluster(
      { ...cluster.toObject(), ...req.body },
      cluster
    );

    console.log(`[Clusters API] Updated cluster: ${id}`);
    res.json(updated);
  } catch (error) {
    console.error(`[Clusters API] Error in PUT /api/clusters/${req.params.id}:`, error);
    next(error);
  }
});

/**
 * DELETE /api/clusters/:id
 * Delete a cluster
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log(`[Clusters API] DELETE /api/clusters/${id}`);

    const cluster = await SeoCluster.findByIdAndDelete(id).exec();
    
    if (!cluster) {
      console.log(`[Clusters API] Cluster not found for deletion: ${id}`);
      return res.status(404).json({ error: "Cluster not found" });
    }

    console.log(`[Clusters API] Deleted cluster: ${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error(`[Clusters API] Error in DELETE /api/clusters/${req.params.id}:`, error);
    next(error);
  }
});

/**
 * Persist cluster (create or update)
 */
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

export default router;

