import { connectMongo } from "../src/db/connection.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoGeneratedIdea } from "../src/db/models/SeoGeneratedIdea.js";
import { SeoContentDraft } from "../src/db/models/SeoContentDraft.js";

async function deleteMockIds() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB\n");

    // Find and delete backlog items with mock IDs (starting with "backlog-")
    // First, find all backlog items
    const allBacklog = await SeoBacklogIdea.find({}).exec();
    const mockBacklogIds = allBacklog
      .filter(item => {
        const id = item.id || item._id?.toString() || '';
        return id.startsWith('backlog-') || !item.projectId || !item.hypothesisId;
      })
      .map(item => item._id);
    
    let backlogDeleted = 0;
    if (mockBacklogIds.length > 0) {
      const backlogResult = await SeoBacklogIdea.deleteMany({ _id: { $in: mockBacklogIds } });
      backlogDeleted = backlogResult.deletedCount;
    }
    console.log(`Deleted ${backlogDeleted} backlog items with mock IDs or null projectId/hypothesisId`);


    // Delete content items with mock IDs or null
    const contentResult = await SeoContentItem.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${contentResult.deletedCount} content items with null projectId/hypothesisId`);

    // Delete suggestions with null
    const suggestionsResult = await SeoGeneratedIdea.deleteMany({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } }
      ]
    });
    console.log(`Deleted ${suggestionsResult.deletedCount} suggestions with null projectId/hypothesisId`);

    // Find and delete drafts with mock IDs
    const allDrafts = await SeoContentDraft.find({}).exec();
    const mockDraftIds = allDrafts
      .filter(item => {
        const id = item.id || item._id?.toString() || '';
        return id.startsWith('draft-') || !item.projectId || !item.hypothesisId;
      })
      .map(item => item._id);
    
    let draftsDeleted = 0;
    if (mockDraftIds.length > 0) {
      const draftsResult = await SeoContentDraft.deleteMany({ _id: { $in: mockDraftIds } });
      draftsDeleted = draftsResult.deletedCount;
    }
    console.log(`Deleted ${draftsDeleted} drafts with mock IDs or null projectId/hypothesisId`);

    // Find and delete suggestions with mock IDs
    const allSuggestions = await SeoGeneratedIdea.find({}).exec();
    const mockSuggestionIds = allSuggestions
      .filter(item => {
        const id = item.id || item._id?.toString() || '';
        return id.startsWith('suggestion-') || !item.projectId || !item.hypothesisId;
      })
      .map(item => item._id);
    
    let suggestionsMockDeleted = 0;
    if (mockSuggestionIds.length > 0) {
      const suggestionsMockResult = await SeoGeneratedIdea.deleteMany({ _id: { $in: mockSuggestionIds } });
      suggestionsMockDeleted = suggestionsMockResult.deletedCount;
    }
    console.log(`Deleted ${suggestionsMockDeleted} suggestions with mock IDs or null projectId/hypothesisId`);

    const totalDeleted = 
      backlogDeleted +
      contentResult.deletedCount + 
      suggestionsResult.deletedCount + 
      suggestionsMockDeleted +
      draftsDeleted;

    console.log(`\n✅ Total deleted: ${totalDeleted} records`);
    
    // Check what's left
    const remainingBacklog = await SeoBacklogIdea.countDocuments({});
    const remainingContent = await SeoContentItem.countDocuments({});
    const remainingSuggestions = await SeoGeneratedIdea.countDocuments({});
    const remainingDrafts = await SeoContentDraft.countDocuments({});
    
    console.log(`\nRemaining records:`);
    console.log(`  Backlog: ${remainingBacklog}`);
    console.log(`  Content: ${remainingContent}`);
    console.log(`  Suggestions: ${remainingSuggestions}`);
    console.log(`  Drafts: ${remainingDrafts}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error deleting mock IDs:", error);
    process.exit(1);
  }
}

deleteMockIds();

