import { config } from "dotenv";

import { DEFAULT_SEED_IDS } from "./seedIds.js";
import { createGraphQLTestClient } from "./utils/graphqlTestClient.js";

config({ path: ".env.local" });
config({ path: ".env" });

async function planFlowSmoke() {
  const client = await createGraphQLTestClient();
  let backlogId: string | null = null;
  let contentId: string | null = null;

  try {
    console.log("🧪 Plan/Content smoke test started");
    const backlogTitle = `Smoke Backlog ${new Date().toISOString()}`;
    const backlogResult = await client.run(
      `
      mutation CreateBacklog($input: CreateBacklogIdeaInput!) {
        createBacklogIdea(input: $input) {
          id
          title
          category
        }
      }
    `,
      {
        input: {
          projectId: DEFAULT_SEED_IDS.projectId,
          hypothesisId: DEFAULT_SEED_IDS.hypothesisId,
          userId: DEFAULT_SEED_IDS.userId,
          title: backlogTitle,
          description: "Smoke backlog item created via automated test.",
          category: "INFO"
        }
      }
    );
    backlogId = backlogResult?.createBacklogIdea?.id ?? null;
    if (!backlogId) {
      throw new Error("Failed to create backlog idea");
    }
    console.log("✅ Backlog idea created:", backlogId);

    const backlogCheck = await client.run(
      `
      query VerifyBacklog($projectId: ID!, $hypothesisId: ID!) {
        seoBacklog(projectId: $projectId, hypothesisId: $hypothesisId) {
          id
          title
        }
      }
    `,
      {
        projectId: DEFAULT_SEED_IDS.projectId,
        hypothesisId: DEFAULT_SEED_IDS.hypothesisId
      }
    );
    const backlogFound = backlogCheck?.seoBacklog?.some(
      (item: any) => item.id === backlogId
    );
    console.log(
      backlogFound
        ? "✅ Backlog idea is queryable"
        : "⚠️ Backlog idea missing from query results"
    );

    const contentTitle = `${backlogTitle} Content`;
    const contentResult = await client.run(
      `
      mutation UpsertContent($input: ContentItemInput!) {
        upsertContentItem(input: $input) {
          id
          title
          status
          backlogIdeaId
        }
      }
    `,
      {
        input: {
          id: null,
          projectId: DEFAULT_SEED_IDS.projectId,
          hypothesisId: DEFAULT_SEED_IDS.hypothesisId,
          backlogIdeaId: backlogId,
          title: contentTitle,
          category: "INFO",
          format: "BLOG",
          status: "DRAFT",
          userId: DEFAULT_SEED_IDS.userId
        }
      }
    );
    contentId = contentResult?.upsertContentItem?.id ?? null;
    if (!contentId) {
      throw new Error("Failed to create content item");
    }
    console.log("✅ Content item created:", contentId);

    await client.run(
      `
      mutation UpdateContent($id: ID!, $input: UpdateContentItemInput!) {
        updateContentItem(id: $id, input: $input) {
          id
          status
        }
      }
    `,
      {
        id: contentId,
        input: {
          status: "READY",
          userId: DEFAULT_SEED_IDS.userId
        }
      }
    );
    console.log("✅ Content item status updated to READY");

    console.log("🎉 Plan/Content smoke test completed successfully.");
  } finally {
    if (contentId) {
      try {
        await client.run(
          `
          mutation DeleteContent($id: ID!) {
            deleteContentItem(id: $id)
          }
        `,
          { id: contentId }
        );
        console.log("🧹 Cleaned up content item", contentId);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to delete content item:", cleanupError);
      }
    }
    if (backlogId) {
      try {
        await client.run(
          `
          mutation DeleteBacklog($id: ID!) {
            deleteBacklogIdea(id: $id)
          }
        `,
          { id: backlogId }
        );
        console.log("🧹 Cleaned up backlog idea", backlogId);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to delete backlog idea:", cleanupError);
      }
    }
    await client.stop();
  }
}

planFlowSmoke()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Plan/Content smoke test failed:", error);
    process.exit(1);
  });
