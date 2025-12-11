#!/usr/bin/env tsx

/**
 * Script to get all available WordPress post types
 * Usage: tsx get-wordpress-post-types.ts <wordpressUrl> <username> <appPassword>
 * Example: tsx get-wordpress-post-types.ts https://example.com admin "QZpU QJVE 0JWc 77oS OWun l8Ua"
 */

const wordpressUrl = process.argv[2];
const username = process.argv[3];
const appPassword = process.argv[4];

if (!wordpressUrl || !username || !appPassword) {
  console.error("Usage: tsx get-wordpress-post-types.ts <wordpressUrl> <username> <appPassword>");
  console.error('Example: tsx get-wordpress-post-types.ts https://example.com admin "QZpU QJVE 0JWc 77oS OWun l8Ua"');
  process.exit(1);
}

const baseUrl = wordpressUrl.replace(/\/$/, "");
const credentials = `${username}:${appPassword}`;
const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

async function getPostTypes() {
  try {
    console.log(`\n🔍 Fetching post types from: ${baseUrl}\n`);
    
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/types`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.status} ${errorText}`);
    }

    const types = await response.json();
    
    // Filter to post types that have REST API endpoint (even if not public)
    const availablePostTypes = Object.entries(types)
      .filter(([_, type]: [string, any]) => type.rest_base)
      .map(([name, type]: [string, any]) => ({
        name,
        label: type.name || name,
        public: type.public || false,
        restBase: type.rest_base,
        taxonomies: type.taxonomies || [],
        supports: type.supports || []
      }));

    console.log(`✅ Found ${availablePostTypes.length} available post types:\n`);
    console.log("=" .repeat(80));
    
    availablePostTypes.forEach((pt, index) => {
      console.log(`\n${index + 1}. ${pt.label} (${pt.name})`);
      console.log(`   Public: ${pt.public ? "Yes" : "No"}`);
      console.log(`   REST Base: ${pt.restBase}`);
      console.log(`   Taxonomies: ${pt.taxonomies.length > 0 ? pt.taxonomies.join(", ") : "None"}`);
      console.log(`   Supports: ${pt.supports.length > 0 ? Object.keys(pt.supports).join(", ") : "None"}`);
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("\n📋 Summary:");
    console.log(`Total post types: ${availablePostTypes.length}`);
    console.log(`Public: ${availablePostTypes.filter(pt => pt.public).length}`);
    console.log(`Private: ${availablePostTypes.filter(pt => !pt.public).length}`);
    
    // Show taxonomies for each post type
    console.log("\n📂 Taxonomies by post type:");
    availablePostTypes.forEach(pt => {
      if (pt.taxonomies.length > 0) {
        console.log(`\n${pt.name}:`);
        pt.taxonomies.forEach(tax => {
          console.log(`  - ${tax}`);
        });
      }
    });
    
    return availablePostTypes;
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("401")) {
      console.error("\n💡 Authentication failed. Please check:");
      console.error("   - Username is correct");
      console.error("   - Application Password is correct (not regular password)");
      console.error("   - Application Passwords are enabled in WordPress");
    } else if (error.message.includes("404")) {
      console.error("\n💡 WordPress REST API not found. Please check:");
      console.error("   - The URL is correct");
      console.error("   - WordPress REST API is enabled");
    }
    process.exit(1);
  }
}

getPostTypes();
