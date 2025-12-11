#!/usr/bin/env tsx

/**
 * Показать ICP для гипотезы
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const hypothesisId = "687fe5363c4cca83a3cc578d"; // Solo founders

async function showICP() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  const hypothesisObjectId = new mongoose.Types.ObjectId(hypothesisId);
  
  console.log("=== ICP ДЛЯ ГИПОТЕЗЫ: Solo founders ===\n");
  console.log(`Hypothesis ID: ${hypothesisId}\n`);
  
  // Загружаем гипотезу
  const hypothesis = await db.collection("projectHypotheses").findOne({
    _id: hypothesisObjectId
  });
  
  if (!hypothesis) {
    console.error("❌ Гипотеза не найдена!");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Гипотеза: ${hypothesis.title}`);
  console.log(`Проект ID: ${hypothesis.projectId}\n`);
  
  // Загружаем ICP
  const icp = await db.collection("hypothesesPersonProfiles").findOne({
    projectHypothesisId: hypothesisObjectId
  });
  
  if (!icp) {
    console.error("❌ ICP не найден для этой гипотезы!");
    await mongoose.disconnect();
    return;
  }
  
  console.log("=".repeat(60));
  console.log("ICP (IDEAL CUSTOMER PROFILE)");
  console.log("=".repeat(60));
  
  // Persona
  const persona = icp.persona || icp.personaName || icp.profileTitle || icp.profileName || icp.title || icp.name || icp.segment || icp.segmentName;
  if (persona) {
    console.log(`\n👤 Persona: ${persona}`);
  }
  
  // Pains
  const pains = icp.userPains || icp.pains || [];
  if (Array.isArray(pains) && pains.length > 0) {
    console.log(`\n😰 Pains (${pains.length}):`);
    pains.forEach((pain: any, i: number) => {
      console.log(`   ${i + 1}. ${pain}`);
    });
  } else if (pains) {
    console.log(`\n😰 Pains: ${pains}`);
  } else {
    console.log(`\n😰 Pains: не указаны`);
  }
  
  // Goals
  const goals = icp.userGoals || icp.goals || [];
  if (Array.isArray(goals) && goals.length > 0) {
    console.log(`\n🎯 Goals (${goals.length}):`);
    goals.forEach((goal: any, i: number) => {
      console.log(`   ${i + 1}. ${goal}`);
    });
  } else if (goals) {
    console.log(`\n🎯 Goals: ${goals}`);
  } else {
    console.log(`\n🎯 Goals: не указаны`);
  }
  
  // Gains
  const gains = icp.userGains || icp.gains || [];
  if (Array.isArray(gains) && gains.length > 0) {
    console.log(`\n✨ Gains (${gains.length}):`);
    gains.forEach((gain: any, i: number) => {
      console.log(`   ${i + 1}. ${gain}`);
    });
  } else if (gains) {
    console.log(`\n✨ Gains: ${gains}`);
  }
  
  // Pain Relievers
  const painRelievers = icp.painRelievers || [];
  if (Array.isArray(painRelievers) && painRelievers.length > 0) {
    console.log(`\n💊 Pain Relievers (${painRelievers.length}):`);
    painRelievers.forEach((reliever: any, i: number) => {
      console.log(`   ${i + 1}. ${reliever}`);
    });
  }
  
  // Triggers
  const triggers = icp.triggers;
  if (triggers) {
    if (Array.isArray(triggers) && triggers.length > 0) {
      console.log(`\n⚡ Triggers (${triggers.length}):`);
      triggers.forEach((trigger: any, i: number) => {
        console.log(`   ${i + 1}. ${trigger}`);
      });
    } else if (typeof triggers === 'string') {
      console.log(`\n⚡ Triggers: ${triggers}`);
    }
  } else {
    console.log(`\n⚡ Triggers: не указаны`);
  }
  
  // Benefits
  const benefits = icp.userGains || icp.gains || icp.benefits || [];
  if (Array.isArray(benefits) && benefits.length > 0) {
    console.log(`\n💎 Benefits (${benefits.length}):`);
    benefits.forEach((benefit: any, i: number) => {
      console.log(`   ${i + 1}. ${benefit}`);
    });
  }
  
  // Objections
  const objections = icp.objections;
  if (objections) {
    if (Array.isArray(objections) && objections.length > 0) {
      console.log(`\n🚫 Objections (${objections.length}):`);
      objections.forEach((objection: any, i: number) => {
        console.log(`   ${i + 1}. ${objection}`);
      });
    } else if (typeof objections === 'string') {
      console.log(`\n🚫 Objections: ${objections}`);
    }
  }
  
  // JTBD (Jobs To Be Done)
  const jtbd = icp.jtbd;
  if (jtbd) {
    console.log(`\n🔧 Jobs To Be Done (JTBD):`);
    if (typeof jtbd === 'string') {
      console.log(`   ${jtbd}`);
    } else {
      console.log(`   ${JSON.stringify(jtbd, null, 2)}`);
    }
  }
  
  // Customer Journey
  const customerJourney = icp.customerJourney;
  if (customerJourney) {
    console.log(`\n🗺️  Customer Journey:`);
    if (typeof customerJourney === 'string') {
      console.log(`   ${customerJourney}`);
    } else {
      console.log(`   ${JSON.stringify(customerJourney, null, 2)}`);
    }
  }
  
  // Дополнительные поля
  console.log(`\n📋 Дополнительная информация:`);
  console.log(`   ICP ID: ${icp._id}`);
  console.log(`   projectHypothesisId: ${icp.projectHypothesisId}`);
  console.log(`   projectId: ${icp.projectId || "не указан"}`);
  if (icp.language) console.log(`   Language: ${icp.language}`);
  if (icp.locale) console.log(`   Locale: ${icp.locale}`);
  if (icp.createdAt) console.log(`   Created: ${new Date(icp.createdAt).toLocaleString("ru-RU")}`);
  if (icp.updatedAt) console.log(`   Updated: ${new Date(icp.updatedAt).toLocaleString("ru-RU")}`);
  
  console.log("\n" + "=".repeat(60));
  
  await mongoose.disconnect();
}

showICP();


