import { Router } from "express";
import { generateImageForContent } from "../services/generateImage.js";

const router = Router();

router.post("/generate", async (req, res, next) => {
  const startTime = Date.now();
  const { contentItemId, title, description } = req.body;

  try {
    console.log(`[images-service] 🖼️ Image generation request:`, {
      contentItemId,
      title: title?.substring(0, 100),
      hasDescription: !!description,
      timestamp: new Date().toISOString()
    });

    if (!contentItemId || !title) {
      const errorMsg = "contentItemId and title are required";
      console.error(`[images-service] ❌ Validation error: ${errorMsg}`, {
        received: { contentItemId: !!contentItemId, title: !!title }
      });
      return res.status(400).json({
        error: errorMsg
      });
    }

    const imageUrl = await generateImageForContent({
      contentItemId,
      title,
      description,
    });

    const duration = Date.now() - startTime;
    console.log(`[images-service] ✅ Image generation successful:`, {
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
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    console.error(`[images-service] ❌ Image generation failed:`, errorDetails);
    console.error(`[images-service] ❌ Full error:`, error);

    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // TODO: Implement image deletion
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
});

export default router;

