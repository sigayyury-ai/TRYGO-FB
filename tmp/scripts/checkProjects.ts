import "dotenv/config";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const userId = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

async function checkProjects() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check projects collection
    const projectsCollection = mongoose.connection.db.collection("projects");
    
    // Get the specific projects by ID first
    const projectId1 = "686774b6773b5947fed60a78";
    const projectId2 = "693837ae163ed59ff5b45345";
    
    // Try both string and ObjectId
    const project1 = await projectsCollection.findOne({ _id: new ObjectId(projectId1) }) ||
                     await projectsCollection.findOne({ _id: projectId1 });
    const project2 = await projectsCollection.findOne({ _id: new ObjectId(projectId2) }) ||
                     await projectsCollection.findOne({ _id: projectId2 });
    
    console.log(`\n🔍 Project 1 (${projectId1}):`);
    if (project1) {
      console.log(`   Full document:`, JSON.stringify(project1, null, 2));
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    
    console.log(`\n🔍 Project 2 (${projectId2}):`);
    if (project2) {
      console.log(`   Full document:`, JSON.stringify(project2, null, 2));
    } else {
      console.log(`   ❌ NOT FOUND`);
    }
    
    // Try different field names for userId
    console.log(`\n📊 Searching projects with different userId field names:`);
    const byUserId = await projectsCollection.find({ userId: userId }).toArray();
    const byOwnerId = await projectsCollection.find({ ownerId: userId }).toArray();
    const byCreatedBy = await projectsCollection.find({ createdBy: userId }).toArray();
    
    console.log(`   Found by userId: ${byUserId.length}`);
    console.log(`   Found by ownerId: ${byOwnerId.length}`);
    console.log(`   Found by createdBy: ${byCreatedBy.length}`);


    // Check if there are projects with different userId
    const allProjects = await projectsCollection.find({}).limit(10).toArray();
    console.log(`\n📊 Sample of all projects in database (first 10):`);
    allProjects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p._id} - ${p.name || "N/A"} - userId: ${p.userId}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Check complete");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkProjects();

