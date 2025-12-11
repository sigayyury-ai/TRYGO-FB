#!/usr/bin/env tsx

const wordpressUrl = "https://trygo.io";
const username = "Urock";
const appPassword = "QZpU QJVE 0JWc 77oS OWun l8Ua";

const baseUrl = wordpressUrl.replace(/\/$/, "");
const credentials = `${username}:${appPassword}`;
const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

async function testConnection() {
  try {
    console.log(`\n🔍 Testing connection to: ${baseUrl}\n`);
    
    // Test user endpoint
    const userResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    console.log(`User endpoint status: ${userResponse.status}`);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log(`✅ Connected as: ${userData.name || userData.slug}\n`);
    } else {
      const errorText = await userResponse.text();
      console.log(`❌ User endpoint error: ${errorText}\n`);
    }

    // Test types endpoint
    const typesResponse = await fetch(`${baseUrl}/wp-json/wp/v2/types`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json"
      }
    });

    console.log(`Types endpoint status: ${typesResponse.status}`);
    if (typesResponse.ok) {
      const types = await typesResponse.json();
      console.log(`✅ Found ${Object.keys(types).length} post types:\n`);
      
      Object.entries(types).forEach(([name, type]: [string, any]) => {
        console.log(`${name}:`);
        console.log(`  - Label: ${type.name || name}`);
        console.log(`  - Public: ${type.public || false}`);
        console.log(`  - Publicly Queryable: ${type.publicly_queryable || false}`);
        console.log(`  - REST Base: ${type.rest_base || "N/A"}`);
        console.log(`  - Taxonomies: ${(type.taxonomies || []).join(", ") || "None"}`);
        console.log("");
      });
    } else {
      const errorText = await typesResponse.text();
      console.log(`❌ Types endpoint error: ${errorText}\n`);
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  }
}

testConnection();
