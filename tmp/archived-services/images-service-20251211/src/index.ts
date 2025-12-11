import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env.js";
import imagesRouter from "./routes/images.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/media", express.static(env.storageRoot));

app.get("/", (_req, res) => {
  res.json({
    message: "Images Service",
    version: "0.1.0",
    media: `${env.publicUrl}/media`,
    endpoints: {
      generate: "POST /api/images/generate",
      delete: "DELETE /api/images"
    }
  });
});

app.use("/api/images", imagesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const errorDetails = {
      method: req.method,
      path: req.path,
      error: err?.message || String(err),
      errorType: err?.constructor?.name || typeof err,
      stack: err?.stack?.split('\n').slice(0, 10).join('\n'),
      body: req.body ? {
        contentItemId: req.body.contentItemId,
        title: req.body.title?.substring(0, 100),
        hasDescription: !!req.body.description
      } : undefined,
      timestamp: new Date().toISOString()
    };

    console.error(`[images-service] ❌ Unhandled error in ${req.method} ${req.path}:`, errorDetails);
    console.error(`[images-service] ❌ Full error object:`, err);

    res.status(500).json({ 
      error: err.message || "Internal server error",
      timestamp: errorDetails.timestamp
    });
  }
);

app.listen(env.port, () => {
  console.log(`🖼️ Images service ready at http://localhost:${env.port}`);
  console.log(`🌐 Public media base: ${env.publicUrl}/media`);
  console.log(`📂 Storage root: ${path.relative(process.cwd(), env.storageRoot)}`);
});


