import { connectMongo } from "../src/db/connection.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoGeneratedIdea } from "../src/db/models/SeoGeneratedIdea.js";
import { SeoContentDraft } from "../src/db/models/SeoContentDraft.js";

async function cleanupNullIds() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB");

    // Delete backlog items with null projectId or hypothesisId
    const backlogResult = await SeoBacklogIdea.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${backlogResult.deletedCount} backlog items with null projectId/hypothesisId`);

    // Delete content items with null projectId or hypothesisId
    const contentResult = await SeoContentItem.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${contentResult.deletedCount} content items with null projectId/hypothesisId`);

    // Delete suggestions with null projectId or hypothesisId
    const suggestionsResult = await SeoGeneratedIdea.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${suggestionsResult.deletedCount} suggestions with null projectId/hypothesisId`);

    // Delete drafts with null projectId or hypothesisId
    const draftsResult = await SeoContentDraft.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${draftsResult.deletedCount} drafts with null projectId/hypothesisId`);

    const totalDeleted = 
      backlogResult.deletedCount + 
      contentResult.deletedCount + 
      suggestionsResult.deletedCount + 
      draftsResult.deletedCount;

    console.log(`\n✅ Total deleted: ${totalDeleted} records`);
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning up null IDs:", error);
    process.exit(1);
  }
}

cleanupNullIds();




