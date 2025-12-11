#!/usr/bin/env tsx

const wordpressUrl = "https://trygo.io";
const username = "Urock";
const appPassword = "QZpU QJVE 0JWc 77oS OWun l8Ua";

const baseUrl = wordpressUrl.replace(/\/$/, "");
const credentials = `${username}:${appPassword}`;
const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

async function checkTags() {
  try {
    console.log(`\n🔍 Checking tags for post type "blog"\n`);
    
    // Check tags for blog post type
    const tagsResponse = await fetch(`${baseUrl}/wp-json/wp/v2/tags?per_page=100&hide_empty=false`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      console.log(`✅ Found ${tags.length} tags:\n`);
      
      const targetTags = ["Business", "Launch", "Marketing"];
      const foundTags: any[] = [];
      
      tags.forEach((tag: any) => {
        if (targetTags.includes(tag.name)) {
          foundTags.push(tag);
          console.log(`🎯 FOUND TARGET TAG: ${tag.name} (id: ${tag.id}, slug: ${tag.slug}, count: ${tag.count})`);
        }
      });
      
      console.log(`\n📋 Summary:`);
      console.log(`Total tags: ${tags.length}`);
      console.log(`Target tags found: ${foundTags.length}/${targetTags.length}`);
      console.log(`Found: ${foundTags.map(t => t.name).join(", ")}`);
      console.log(`Missing: ${targetTags.filter(t => !foundTags.some(ft => ft.name === t)).join(", ")}`);
      
      // Show all tags
      console.log(`\n📝 All tags (first 20):`);
      tags.slice(0, 20).forEach((tag: any) => {
        console.log(`  - ${tag.name} (${tag.slug}, id: ${tag.id}, count: ${tag.count})`);
      });
      
    } else {
      const errorText = await tagsResponse.text();
      console.log(`❌ Tags endpoint error: ${errorText}\n`);
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  }
}

checkTags();
