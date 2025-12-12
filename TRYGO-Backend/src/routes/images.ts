import { Router } from "express";
import { generateImageForContent } from "../services/images/generateImage";
import { deleteImage, imageExists } from "../services/images/imageStorage";

const router = Router();

/**
 * POST /api/images/generate
 * Generate an image for a content item
 */
router.post("/generate", async (req, res, next) => {
  const startTime = Date.now();
  const { contentItemId, title, description } = req.body;

  try {
    console.log(`[Images API] 🖼️ Image generation request:`, {
      contentItemId,
      title: title?.substring(0, 100),
      hasDescription: !!description,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!contentItemId || !title) {
      const errorMsg = "contentItemId and title are required";
      console.error(`[Images API] ❌ Validation error: ${errorMsg}`, {
        received: { contentItemId: !!contentItemId, title: !!title }
      });
      return res.status(400).json({
        error: errorMsg
      });
    }

    // Generate image
    const imageUrl = await generateImageForContent({
      contentItemId,
      title,
      description
    });

    const duration = Date.now() - startTime;
    console.log(`[Images API] ✅ Image generation successful:`, {
      contentItemId,
      imageUrl: imageUrl?.substring(0, 100),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    res.json({ imageUrl });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorDetails = {
      contentItemId,
      title: title?.substring(0, 100),
      error: error?.message || String(error),
      errorType: error?.constructor?.name || typeof error,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.error(`[Images API] ❌ Image generation failed:`, errorDetails);
    console.error(`[Images API] ❌ Full error:`, error);

    // Return error response
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      error: error?.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/images/:id
 * Delete an image by ID (format: contentItemId/filename)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Parse id format: contentItemId/filename
    const parts = id.split("/");
    if (parts.length !== 2) {
      return res.status(400).json({
        error: "Invalid image ID format. Expected: contentItemId/filename"
      });
    }

    const [contentItemId, filename] = parts;

    // Check if image exists
    const exists = await imageExists(contentItemId, filename);
    if (!exists) {
      return res.status(404).json({
        error: "Image not found"
      });
    }

    // Delete image
    await deleteImage(contentItemId, filename);

    console.log(`[Images API] ✅ Image deleted: ${id}`);

    res.json({
      success: true,
      id
    });
  } catch (error: any) {
    console.error(`[Images API] ❌ Image deletion failed:`, {
      id: req.params.id,
      error: error?.message || String(error)
    });
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      error: error?.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

