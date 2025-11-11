import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { resolvers } from "./schema/resolvers.js";
import { typeDefs } from "./schema/typeDefs.js";

async function bootstrap() {
  await connectMongo();

  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: env.port }
  });

  // eslint-disable-next-line no-console
  console.log(`🚀 SEO Agent GraphQL ready at ${url}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", error);
  process.exit(1);
});

