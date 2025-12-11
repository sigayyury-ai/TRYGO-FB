#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

interface OfferAnalysis {
  articleIndex: number;
  title: string;
  totalWords: number;
  productMentions: {
    count: number;
    positions: Array<{ section: string; context: string; position: "early" | "middle" | "late" }>;
    exactPhrases: string[];
  };
  transitionQuality: {
    hasNaturalTransition: boolean;
    transitionText: string;
    abruptness: "smooth" | "moderate" | "abrupt";
    contextBefore: string;
    contextAfter: string;
  };
  salesLanguage: {
    hasSalesWords: boolean;
    salesWordsFound: string[];
    pressureLevel: "low" | "medium" | "high";
  };
  integrationScore: number; // 0-100
  issues: string[];
  strengths: string[];
}

function analyzeOfferNativeness(content: string, title: string): OfferAnalysis {
  const contentLower = content.toLowerCase();
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  // Найти все упоминания продукта
  const productPhrases = [
    /ai marketing copilot/gi,
    /marketing copilot/gi,
    /ai маркетинг[-\s]?копилот/gi,
    /маркетинг[-\s]?копилот/gi
  ];
  
  const productMentions: Array<{ section: string; context: string; position: "early" | "middle" | "late" }> = [];
  const exactPhrases: string[] = [];
  
  // Разбить на разделы
  const sections = content.split(/^##\s+/gm).filter(s => s.trim().length > 0);
  const sectionTitles: string[] = [];
  
  sections.forEach((section, idx) => {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || `Section ${idx + 1}`;
    sectionTitles.push(title);
    
    const sectionText = section.toLowerCase();
    const wordPosition = idx < sections.length * 0.33 ? "early" : idx < sections.length * 0.67 ? "middle" : "late";
    
    productPhrases.forEach(phrase => {
      const matches = sectionText.match(phrase);
      if (matches) {
        matches.forEach(match => {
          exactPhrases.push(match);
          
          // Найти контекст упоминания (50 слов до и после)
          const matchIndex = sectionText.indexOf(match.toLowerCase());
          const beforeContext = section.substring(Math.max(0, matchIndex - 200), matchIndex).trim();
          const afterContext = section.substring(matchIndex + match.length, Math.min(section.length, matchIndex + match.length + 200)).trim();
          
          productMentions.push({
            section: title,
            context: `${beforeContext.substring(Math.max(0, beforeContext.length - 100))}... [${match}] ...${afterContext.substring(0, 100)}`,
            position: wordPosition
          });
        });
      }
    });
  });
  
  // Анализ перехода к оферу
  const lastSections = sections.slice(-3);
  let transitionText = "";
  let contextBefore = "";
  let contextAfter = "";
  let hasNaturalTransition = false;
  let abruptness: "smooth" | "moderate" | "abrupt" = "abrupt";
  
  if (lastSections.length > 0) {
    const lastSection = lastSections[lastSections.length - 1];
    const secondLastSection = lastSections.length > 1 ? lastSections[lastSections.length - 2] : "";
    
    // Проверить, есть ли упоминание продукта в последних разделах
    const hasProductInLast = productPhrases.some(phrase => phrase.test(lastSection.toLowerCase()));
    
    if (hasProductInLast) {
      transitionText = lastSection.substring(0, 500);
      contextBefore = secondLastSection.substring(Math.max(0, secondLastSection.length - 300));
      contextAfter = lastSection.substring(0, 300);
      
      // Проверить наличие переходных фраз
      const transitionPhrases = [
        /одним из решений/gi,
        /одним из вариантов/gi,
        /может стать/gi,
        /может помочь/gi,
        /естественный переход/gi,
        /в качестве решения/gi,
        /как вариант/gi,
        /можно использовать/gi,
        /инструмент/gi,
        /решение/gi
      ];
      
      hasNaturalTransition = transitionPhrases.some(phrase => phrase.test(lastSection));
      
      // Оценить резкость перехода
      const beforeIsProblem = /проблем|боль|трудност|сложност|нехватк/i.test(contextBefore);
      const afterIsSolution = /решен|инструмент|помощ|автоматизац/i.test(contextAfter);
      
      if (beforeIsProblem && afterIsSolution && hasNaturalTransition) {
        abruptness = "smooth";
      } else if (beforeIsProblem || afterIsSolution) {
        abruptness = "moderate";
      } else {
        abruptness = "abrupt";
      }
    }
  }
  
  // Анализ продающих слов
  const salesWords = [
    /купите/gi, /покупайте/gi, /купить/gi,
    /закажите/gi, /заказывайте/gi, /заказать/gi,
    /сейчас/gi, /немедленно/gi, /срочно/gi,
    /только сегодня/gi, /ограниченное предложение/gi,
    /не упустите/gi, /успейте/gi,
    /бесплатно/gi, /скидка/gi, /акция/gi,
    /лучший/gi, /единственный/gi, /уникальный/gi,
    /гарантия/gi, /вернем деньги/gi
  ];
  
  const salesWordsFound: string[] = [];
  salesWords.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      salesWordsFound.push(...matches);
    }
  });
  
  const hasSalesWords = salesWordsFound.length > 0;
  let pressureLevel: "low" | "medium" | "high" = "low";
  
  if (salesWordsFound.length > 5) {
    pressureLevel = "high";
  } else if (salesWordsFound.length > 2) {
    pressureLevel = "medium";
  }
  
  // Оценка нативности (0-100)
  let integrationScore = 100;
  const issues: string[] = [];
  const strengths: string[] = [];
  
  // Штрафы
  if (productMentions.length === 0) {
    integrationScore -= 30;
    issues.push("❌ Продукт вообще не упоминается");
  } else if (productMentions.length > 3) {
    integrationScore -= 15;
    issues.push(`⚠️ Слишком много упоминаний продукта (${productMentions.length})`);
  } else {
    strengths.push(`✅ Умеренное количество упоминаний (${productMentions.length})`);
  }
  
  // Проверка позиции упоминаний
  const earlyMentions = productMentions.filter(m => m.position === "early").length;
  if (earlyMentions > 0) {
    integrationScore -= 20;
    issues.push(`❌ Продукт упоминается слишком рано (${earlyMentions} раз в начале статьи)`);
  } else {
    strengths.push("✅ Продукт упоминается только в конце статьи");
  }
  
  // Проверка перехода
  if (!hasNaturalTransition) {
    integrationScore -= 25;
    issues.push("❌ Нет естественного перехода к упоминанию продукта");
  } else {
    strengths.push("✅ Есть переходные фразы");
  }
  
  if (abruptness === "abrupt") {
    integrationScore -= 20;
    issues.push("❌ Резкий переход от проблемы к продукту");
  } else if (abruptness === "smooth") {
    strengths.push("✅ Плавный переход от проблемы к решению");
  }
  
  // Проверка продающих слов
  if (hasSalesWords) {
    integrationScore -= 30;
    issues.push(`❌ Обнаружены продающие слова: ${salesWordsFound.slice(0, 5).join(", ")}`);
  } else {
    strengths.push("✅ Нет навязчивых продающих слов");
  }
  
  if (pressureLevel === "high") {
    integrationScore -= 15;
    issues.push("❌ Высокий уровень давления в тексте");
  } else if (pressureLevel === "low") {
    strengths.push("✅ Низкое давление, информативный тон");
  }
  
  // Проверка контекста упоминаний
  const hasContext = productMentions.every(m => {
    const context = m.context.toLowerCase();
    return context.includes("решен") || context.includes("инструмент") || 
           context.includes("вариант") || context.includes("может");
  });
  
  if (!hasContext && productMentions.length > 0) {
    integrationScore -= 10;
    issues.push("⚠️ Упоминания продукта без контекста решения проблемы");
  } else if (hasContext) {
    strengths.push("✅ Продукт упоминается в контексте решения");
  }
  
  // Проверка объема контента до офера
  const contentBeforeOffer = sections.slice(0, -2).join(" ");
  const wordsBeforeOffer = contentBeforeOffer.split(/\s+/).filter(w => w.length > 0).length;
  const contentRatio = wordsBeforeOffer / totalWords;
  
  if (contentRatio < 0.7) {
    integrationScore -= 15;
    issues.push(`⚠️ Слишком мало контента до офера (${Math.round(contentRatio * 100)}% статьи)`);
  } else if (contentRatio >= 0.85) {
    strengths.push(`✅ Достаточно контента до офера (${Math.round(contentRatio * 100)}%)`);
  }
  
  integrationScore = Math.max(0, Math.min(100, integrationScore));
  
  return {
    articleIndex: 0,
    title,
    totalWords,
    productMentions: {
      count: productMentions.length,
      positions: productMentions,
      exactPhrases: [...new Set(exactPhrases)]
    },
    transitionQuality: {
      hasNaturalTransition,
      transitionText,
      abruptness,
      contextBefore,
      contextAfter
    },
    salesLanguage: {
      hasSalesWords,
      salesWordsFound: [...new Set(salesWordsFound)],
      pressureLevel
    },
    integrationScore,
    issues,
    strengths
  };
}

async function analyzeArticles() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(3).exec();
  
  console.log("=".repeat(100));
  console.log("АНАЛИЗ НАТИВНОСТИ ВПИСЫВАНИЯ ОФЕРА В СТАТЬИ");
  console.log("=".repeat(100));
  
  const analyses: OfferAnalysis[] = [];
  
  items.forEach((item, idx) => {
    if (!item.content) return;
    
    const analysis = analyzeOfferNativeness(item.content, item.title);
    analysis.articleIndex = idx + 1;
    analyses.push(analysis);
    
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`СТАТЬЯ ${idx + 1}: ${item.title}`);
    console.log("=".repeat(100));
    
    console.log(`\n📊 ОБЩАЯ ОЦЕНКА НАТИВНОСТИ: ${analysis.integrationScore}/100`);
    
    if (analysis.integrationScore >= 80) {
      console.log("   ✅ ОТЛИЧНО: Офер вписан очень нативно");
    } else if (analysis.integrationScore >= 60) {
      console.log("   ⚠️  ХОРОШО: Есть место для улучшения");
    } else if (analysis.integrationScore >= 40) {
      console.log("   ⚠️  СРЕДНЕ: Нужны улучшения");
    } else {
      console.log("   ❌ ПЛОХО: Офер вписан неестественно");
    }
    
    console.log(`\n📝 ОБЪЕМ: ${analysis.totalWords} слов`);
    
    console.log(`\n🔗 УПОМИНАНИЯ ПРОДУКТА:`);
    console.log(`   Количество: ${analysis.productMentions.count}`);
    if (analysis.productMentions.exactPhrases.length > 0) {
      console.log(`   Фразы: ${analysis.productMentions.exactPhrases.join(", ")}`);
    }
    
    if (analysis.productMentions.positions.length > 0) {
      console.log(`\n   Контекст упоминаний:`);
      analysis.productMentions.positions.forEach((pos, i) => {
        console.log(`   ${i + 1}. Раздел "${pos.section}" (${pos.position === "early" ? "начало" : pos.position === "middle" ? "середина" : "конец"}):`);
        console.log(`      ${pos.context.substring(0, 150)}...`);
      });
    }
    
    console.log(`\n🔄 КАЧЕСТВО ПЕРЕХОДА:`);
    console.log(`   Естественный переход: ${analysis.transitionQuality.hasNaturalTransition ? "✅ Да" : "❌ Нет"}`);
    console.log(`   Резкость: ${analysis.transitionQuality.abruptness === "smooth" ? "✅ Плавный" : analysis.transitionQuality.abruptness === "moderate" ? "⚠️ Умеренный" : "❌ Резкий"}`);
    
    if (analysis.transitionQuality.transitionText) {
      console.log(`\n   Текст перехода:`);
      console.log(`   ${analysis.transitionQuality.transitionText.substring(0, 300)}...`);
    }
    
    console.log(`\n💬 ПРОДАЮЩИЙ ЯЗЫК:`);
    console.log(`   Продающие слова: ${analysis.salesLanguage.hasSalesWords ? "❌ Да" : "✅ Нет"}`);
    if (analysis.salesLanguage.salesWordsFound.length > 0) {
      console.log(`   Найдено: ${analysis.salesLanguage.salesWordsFound.slice(0, 10).join(", ")}`);
    }
    console.log(`   Уровень давления: ${analysis.salesLanguage.pressureLevel === "low" ? "✅ Низкий" : analysis.salesLanguage.pressureLevel === "medium" ? "⚠️ Средний" : "❌ Высокий"}`);
    
    console.log(`\n✅ СИЛЬНЫЕ СТОРОНЫ:`);
    if (analysis.strengths.length > 0) {
      analysis.strengths.forEach(s => console.log(`   ${s}`));
    } else {
      console.log(`   Нет`);
    }
    
    console.log(`\n❌ ПРОБЛЕМЫ:`);
    if (analysis.issues.length > 0) {
      analysis.issues.forEach(i => console.log(`   ${i}`));
    } else {
      console.log(`   Нет критических проблем`);
    }
  });
  
  // Общая статистика
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ОБЩАЯ СТАТИСТИКА");
  console.log("=".repeat(100));
  
  const avgScore = analyses.reduce((sum, a) => sum + a.integrationScore, 0) / analyses.length;
  const avgMentions = analyses.reduce((sum, a) => sum + a.productMentions.count, 0) / analyses.length;
  const smoothTransitions = analyses.filter(a => a.transitionQuality.abruptness === "smooth").length;
  const noSalesWords = analyses.filter(a => !a.salesLanguage.hasSalesWords).length;
  
  console.log(`\n📊 Средняя оценка нативности: ${avgScore.toFixed(1)}/100`);
  console.log(`📊 Среднее количество упоминаний продукта: ${avgMentions.toFixed(1)}`);
  console.log(`📊 Статей с плавным переходом: ${smoothTransitions}/${analyses.length}`);
  console.log(`📊 Статей без продающих слов: ${noSalesWords}/${analyses.length}`);
  
  await mongoose.disconnect();
}

analyzeArticles();

