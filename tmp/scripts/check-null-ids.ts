import { connectMongo } from "../src/db/connection.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

async function checkNullIds() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB\n");

    // Check backlog items
    const backlogItems = await SeoBacklogIdea.find({}).limit(10).exec();
    console.log(`Found ${backlogItems.length} backlog items (showing first 10):`);
    backlogItems.forEach((item, idx) => {
      console.log(`  [${idx}] ID: ${item.id}, projectId: ${JSON.stringify(item.projectId)}, hypothesisId: ${JSON.stringify(item.hypothesisId)}, title: ${item.title}`);
    });

    // Check for null/undefined/empty string
    const backlogWithNull = await SeoBacklogIdea.find({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { projectId: "" },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } },
        { hypothesisId: "" }
      ]
    }).exec();
    console.log(`\nFound ${backlogWithNull.length} backlog items with null/empty projectId or hypothesisId`);

    // Check content items
    const contentItems = await SeoContentItem.find({}).limit(10).exec();
    console.log(`\nFound ${contentItems.length} content items (showing first 10):`);
    contentItems.forEach((item, idx) => {
      console.log(`  [${idx}] ID: ${item.id}, projectId: ${JSON.stringify(item.projectId)}, hypothesisId: ${JSON.stringify(item.hypothesisId)}, title: ${item.title}`);
    });

    const contentWithNull = await SeoContentItem.find({
      $or: [
        { projectId: null },
        { projectId: { $exists: false } },
        { projectId: "" },
        { hypothesisId: null },
        { hypothesisId: { $exists: false } },
        { hypothesisId: "" }
      ]
    }).exec();
    console.log(`\nFound ${contentWithNull.length} content items with null/empty projectId or hypothesisId`);

    process.exit(0);
  } catch (error) {
    console.error("Error checking null IDs:", error);
    process.exit(1);
  }
}

checkNullIds();




