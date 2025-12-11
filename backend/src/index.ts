import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import cron from "node-cron";

import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { resolvers } from "./schema/resolvers.js";
import { typeDefs } from "./schema/typeDefs.js";

/**
 * Sanitize sensitive data from variables before logging
 */
function sanitizeVariables(variables: any): any {
  if (!variables || typeof variables !== "object") {
    return variables;
  }

  const sensitiveKeys = [
    "wordpressAppPassword",
    "password",
    "appPassword",
    "token",
    "apiKey",
    "secret",
    "credentials"
  ];

  const sanitized = { ...variables };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) => 
          typeof item === "object" ? sanitizeVariables(item) : item
        );
      } else {
        sanitized[key] = sanitizeVariables(sanitized[key]);
      }
    }
  }

  return sanitized;
}

async function bootstrap() {
  try {
    await connectMongo();
  } catch (error: any) {
    console.error("❌ Failed to start backend - MongoDB connection error:", error.message);
    console.error("   Please check your MONGODB_URI environment variable");
    process.exit(1);
  }

  const app = express();

  // Health check endpoint for Render
  app.get("/", (_req, res) => {
    res.json({
      message: "SEO Agent GraphQL API",
      version: "1.0.0",
      status: "ok",
      graphqlEndpoint: "/graphql"
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Auto-publish endpoint (can be called by cron job)
  app.post("/auto-publish", async (_req, res) => {
    try {
      const { autoPublishScheduledContent } = await import("./services/wordpress/autoPublish.js");
      const result = await autoPublishScheduledContent();
      res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[auto-publish endpoint] Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to auto-publish",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // CORS middleware - allow all origins in development, specific origin in production
  const corsOrigin = env.frontendUrl || "*";
  console.log("[backend] CORS configured with origin:", corsOrigin);
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-project-id', 'x-hypothesis-id', 'x-user-id']
    })
  );

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false, // Disable CSRF for local development
    formatError: (error) => {
      // Log the error for debugging
      console.error("GraphQL Error:", {
        message: error.message,
        path: error.path,
        extensions: error.extensions
      });
      return error;
    },
    plugins: [
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext: any) {
              // Log the operation
              if (requestContext.operationName) {
                console.log(`GraphQL Operation: ${requestContext.operationName}`);
              }
            },
            async didEncounterErrors(requestContext: any) {
              // Log errors
              requestContext.errors.forEach((error: any) => {
                console.error("GraphQL Request Error:", {
                  message: error.message,
                  path: error.path,
                  operation: requestContext.operationName,
                  variables: requestContext.request.variables
                });
              });
            }
          };
        }
      }
    ]
  });

  await server.start();

  // Increase body parser limit for GraphQL requests (default is 100kb)
  // GraphQL queries with large variables can exceed this limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Log all GraphQL requests
  app.use("/graphql", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.body && req.body.query) {
      const queryName = req.body.operationName || req.body.query.split("{")[1]?.split("(")[0]?.trim() || "unknown";
      console.log(`  Query: ${queryName}`);
      if (req.body.variables) {
        if (env.logSensitiveData) {
          // Log full variables only if explicitly enabled
          console.log(`  Variables:`, JSON.stringify(req.body.variables));
        } else {
          // Sanitize sensitive data before logging
          const sanitized = sanitizeVariables(req.body.variables);
          console.log(`  Variables:`, JSON.stringify(sanitized));
        }
      }
    }
    next();
  });
  
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization ?? "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice("Bearer ".length)
          : authHeader || null;

        const projectId = req.headers["x-project-id"] as string | undefined;
        const hypothesisId = req.headers["x-hypothesis-id"] as string | undefined;
        const userIdFromHeader = req.headers["x-user-id"] as string | undefined;

        // ⭐ ДЕКОДИРУЕМ userId ИЗ JWT ТОКЕНА
        let userId: string | undefined = userIdFromHeader;
        if (token && !userId) {
          try {
            // Используем динамический импорт для jsonwebtoken
            const jwt = await import("jsonwebtoken");
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
              const decoded = jwt.verify(token, jwtSecret) as { id?: string };
              if (decoded?.id) {
                userId = decoded.id;
                console.log("[GraphQL Context] ✅ Extracted userId from JWT token:", userId);
              }
            } else {
              console.warn("[GraphQL Context] ⚠️ JWT_SECRET not configured");
            }
          } catch (err: any) {
            // Если jsonwebtoken не установлен, просто логируем предупреждение
            if (err?.code === "MODULE_NOT_FOUND") {
              console.warn("[GraphQL Context] ⚠️ jsonwebtoken not installed, using userId from header only");
            } else {
              console.warn("[GraphQL Context] ⚠️ Failed to decode JWT token:", err?.message || err);
            }
          }
        }

        // Логирование заголовков для отладки
        if (projectId || hypothesisId) {
          console.log("[GraphQL Context] Headers:", {
            projectId: projectId || "not provided",
            hypothesisId: hypothesisId || "not provided",
            userId: userId || "not provided",
            userIdSource: userIdFromHeader ? "header" : (token ? "JWT" : "none")
          });
        }

        return {
          token,
          projectId,
          hypothesisId,
          userId
        };
      }
    }) as any
  );

  const port = Number(process.env.PORT || env.port);
  app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 SEO Agent server ready on port ${port}`);
    // eslint-disable-next-line no-console
    console.log(`📊 GraphQL API ready at http://0.0.0.0:${port}/graphql`);
  });

  // Setup cron job for auto-publishing scheduled content
  // Run once a day at 9:00 AM UTC
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("[cron] 🔄 Запуск автопубликации по расписанию (9:00 AM UTC)...");
      const { autoPublishScheduledContent } = await import("./services/wordpress/autoPublish.js");
      const result = await autoPublishScheduledContent();
      console.log("[cron] ✅ Автопубликация завершена:", {
        published: result.published,
        failed: result.failed,
        errors: result.errors.length
      });
      if (result.errors.length > 0) {
        console.error("[cron] Ошибки автопубликации:", result.errors);
      }
    } catch (error: any) {
      console.error("[cron] ❌ Ошибка автопубликации:", error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log("⏰ Cron job для автопубликации настроен (каждый день в 9:00 AM UTC)");
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error);
  process.exit(1);
});

