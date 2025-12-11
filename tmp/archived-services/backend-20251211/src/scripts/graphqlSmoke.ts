import { config } from "dotenv";

import { DEFAULT_SEED_IDS } from "./seedIds.js";
import { createGraphQLTestClient } from "./utils/graphqlTestClient.js";

config({ path: ".env.local" });
config({ path: ".env" });

async function smokeTest() {
  const client = await createGraphQLTestClient();
  try {
    console.log("🔍 GraphQL smoke test (direct resolvers) started");
    await client.run("query { _health }");
    console.log("✅ Health query passed");

    const dashboard = await client.run(
      `
      query SmokeDashboard($projectId: ID!, $hypothesisId: ID!) {
        seoDashboard(projectId: $projectId, hypothesisId: $hypothesisId) {
          project { id title }
          hypothesis { id title }
          clusters { id title intent }
        }
      }
    `,
      {
        projectId: DEFAULT_SEED_IDS.projectId,
        hypothesisId: DEFAULT_SEED_IDS.hypothesisId
      }
    );
    console.log(
      "✅ Dashboard query returned",
      dashboard?.seoDashboard?.clusters?.length ?? 0,
      "clusters"
    );

    const clusterTitle = `Smoke Cluster ${new Date().toISOString()}`;
    const createResult = await client.run(
      `
      mutation CreateCluster($input: CreateSeoClusterInput!) {
        createSeoCluster(input: $input) { id title keywords intent }
      }
    `,
      {
        input: {
          projectId: DEFAULT_SEED_IDS.projectId,
          hypothesisId: DEFAULT_SEED_IDS.hypothesisId,
          title: clusterTitle,
          intent: "INFORMATIONAL",
          keywords: ["smoke keyword"],
          userId: DEFAULT_SEED_IDS.userId
        }
      }
    );
    const clusterId = createResult?.createSeoCluster?.id;
    if (!clusterId) {
      throw new Error("Failed to create smoke cluster");
    }
    console.log("✅ Created smoke cluster:", clusterId);

    await client.run(
      `
      mutation UpdateCluster($id: ID!, $input: UpdateSeoClusterInput!) {
        updateSeoCluster(id: $id, input: $input) { id keywords intent }
      }
    `,
      {
        id: clusterId,
        input: {
          keywords: ["smoke keyword updated"],
          intent: "TRANSACTIONAL",
          userId: DEFAULT_SEED_IDS.userId
        }
      }
    );
    console.log("✅ Updated smoke cluster");

    await client.run(
      `
      mutation DeleteCluster($id: ID!) {
        deleteSeoCluster(id: $id)
      }
    `,
      { id: clusterId }
    );
    console.log("✅ Deleted smoke cluster");

    const semantics = await client.run(
      `
      query Semantics($projectId: ID!, $hypothesisId: ID!) {
        semanticsKeywords(projectId: $projectId, hypothesisId: $hypothesisId) { id keyword intent }
        semanticsDiscoveryJobs(projectId: $projectId, hypothesisId: $hypothesisId) { id status }
      }
    `,
      {
        projectId: DEFAULT_SEED_IDS.projectId,
        hypothesisId: DEFAULT_SEED_IDS.hypothesisId
      }
    );
    console.log(
      "✅ Semantics keywords:",
      semantics?.semanticsKeywords?.length ?? 0,
      "| jobs:",
      semantics?.semanticsDiscoveryJobs?.length ?? 0
    );

    console.log("🎉 GraphQL smoke test completed successfully.");
  } finally {
    await client.stop();
  }
}

smokeTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ GraphQL smoke test failed:", error);
    process.exit(1);
  });
