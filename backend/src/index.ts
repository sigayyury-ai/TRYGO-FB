import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";

import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { resolvers } from "./schema/resolvers.js";
import { typeDefs } from "./schema/typeDefs.js";

async function bootstrap() {
  await connectMongo();

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

  // CORS middleware
  app.use(
    cors({
      origin: env.frontendUrl || "*",
      credentials: true
    })
  );

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
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

  app.use(express.json());
  
  // Log all GraphQL requests
  app.use("/graphql", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.body && req.body.query) {
      const queryName = req.body.operationName || req.body.query.split("{")[1]?.split("(")[0]?.trim() || "unknown";
      console.log(`  Query: ${queryName}`);
      if (req.body.variables) {
        console.log(`  Variables:`, JSON.stringify(req.body.variables));
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
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error);
  process.exit(1);
});

