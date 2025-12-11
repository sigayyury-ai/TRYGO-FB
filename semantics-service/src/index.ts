import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { clustersRouter } from "./routes/clusters.js";

async function bootstrap() {
  await connectMongo();

  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/clusters", clustersRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[semantics-service] Error:", err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  });

  app.listen(env.port, () => {
    console.log(
      `🚀 Semantics service ready at http://localhost:${env.port} (origin: ${env.corsOrigin})`
    );
  });
}

bootstrap().catch((error) => {
  console.error("[semantics-service] Failed to start:", error);
  process.exit(1);
});

