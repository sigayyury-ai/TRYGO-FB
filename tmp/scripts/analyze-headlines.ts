#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

interface HeadlineAnalysis {
  title: string;
  ideaTitle?: string;
  ideaDescription?: string;
  length: number;
  wordCount: number;
  hasQuestion: boolean;
  hasNumbers: boolean;
  hasPowerWords: boolean;
  seoKeywords: string[];
  readability: "excellent" | "good" | "fair" | "poor";
  interestScore: number; // 0-100
  issues: string[];
  strengths: string[];
}

const powerWords = [
  "как", "почему", "что", "когда", "где", "кто",
  "лучший", "топ", "полный", "детальный", "глубокий",
  "секрет", "способ", "метод", "техника", "стратегия",
  "руководство", "гайд", "советы", "примеры", "кейсы",
  "проверенный", "эффективный", "быстрый", "простой",
  "бесплатный", "легкий", "практичный"
];

const seoIndicators = [
  /как\s+/i,
  /почему\s+/i,
  /что\s+такое/i,
  /руководство/i,
  /гайд/i,
  /советы/i,
  /примеры/i,
  /кейсы/i,
  /лучший/i,
  /топ\s+\d+/i,
  /\d+\s+способ/i,
  /\d+\s+совет/i,
  /для\s+[а-яё]+/i,
  /как\s+[а-яё]+\s+[а-яё]+/i
];

function analyzeHeadline(title: string, ideaTitle?: string, ideaDescription?: string): HeadlineAnalysis {
  const titleLower = title.toLowerCase();
  const words = title.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const length = title.length;
  
  // Check for question
  const hasQuestion = /[?]/.test(title) || 
                     /^(как|почему|что|когда|где|кто)\s+/i.test(title);
  
  // Check for numbers
  const hasNumbers = /\d+/.test(title);
  
  // Check for power words
  const hasPowerWords = powerWords.some(word => 
    new RegExp(`\\b${word}\\b`, "i").test(title)
  );
  
  // Extract SEO keywords
  const seoKeywords: string[] = [];
  seoIndicators.forEach(pattern => {
    const match = title.match(pattern);
    if (match) {
      seoKeywords.push(match[0].trim());
    }
  });
  
  // Extract key phrases (2-3 word combinations)
  const keyPhrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length > 5 && phrase.length < 30) {
      keyPhrases.push(phrase);
    }
  }
  seoKeywords.push(...keyPhrases.slice(0, 3));
  
  // Readability score
  let readability: "excellent" | "good" | "fair" | "poor" = "good";
  if (length < 40) readability = "excellent";
  else if (length < 60) readability = "good";
  else if (length < 80) readability = "fair";
  else readability = "poor";
  
  // Interest score calculation (0-100)
  let interestScore = 50; // Base score
  
  // Length optimization (50-60 chars is ideal for SEO)
  if (length >= 50 && length <= 60) interestScore += 10;
  else if (length >= 40 && length <= 70) interestScore += 5;
  else if (length > 80) interestScore -= 15;
  else if (length < 30) interestScore -= 10;
  
  // Word count (5-9 words is ideal)
  if (wordCount >= 5 && wordCount <= 9) interestScore += 10;
  else if (wordCount >= 4 && wordCount <= 12) interestScore += 5;
  else if (wordCount > 15) interestScore -= 10;
  else if (wordCount < 3) interestScore -= 10;
  
  // Power words
  if (hasPowerWords) interestScore += 15;
  
  // Question format
  if (hasQuestion) interestScore += 10;
  
  // Numbers
  if (hasNumbers) interestScore += 5;
  
  // SEO keywords
  if (seoKeywords.length >= 2) interestScore += 10;
  else if (seoKeywords.length === 1) interestScore += 5;
  
  // Check if title relates to idea
  if (ideaTitle) {
    const ideaWords = ideaTitle.toLowerCase().split(/\s+/);
    const titleWords = titleLower.split(/\s+/);
    const commonWords = ideaWords.filter(w => titleWords.includes(w));
    if (commonWords.length >= 2) interestScore += 10;
    else if (commonWords.length === 1) interestScore += 5;
  }
  
  interestScore = Math.max(0, Math.min(100, interestScore));
  
  // Identify issues
  const issues: string[] = [];
  const strengths: string[] = [];
  
  if (length > 80) {
    issues.push(`⚠️ Слишком длинный заголовок (${length} символов, идеально 50-60)`);
  } else if (length < 30) {
    issues.push(`⚠️ Слишком короткий заголовок (${length} символов)`);
  } else if (length >= 50 && length <= 60) {
    strengths.push(`✅ Оптимальная длина (${length} символов)`);
  }
  
  if (wordCount > 15) {
    issues.push(`⚠️ Слишком много слов (${wordCount}, идеально 5-9)`);
  } else if (wordCount < 3) {
    issues.push(`⚠️ Слишком мало слов (${wordCount})`);
  } else if (wordCount >= 5 && wordCount <= 9) {
    strengths.push(`✅ Оптимальное количество слов (${wordCount})`);
  }
  
  if (!hasPowerWords) {
    issues.push("⚠️ Нет сильных слов (как, почему, лучший, секрет и т.д.)");
  } else {
    strengths.push("✅ Содержит сильные слова");
  }
  
  if (seoKeywords.length === 0) {
    issues.push("❌ Нет SEO-ключевых слов/фраз");
  } else if (seoKeywords.length >= 2) {
    strengths.push(`✅ Хорошее количество SEO-ключевых слов (${seoKeywords.length})`);
  }
  
  if (!hasQuestion && !hasNumbers) {
    issues.push("⚠️ Нет вопроса или цифр для привлечения внимания");
  } else {
    if (hasQuestion) strengths.push("✅ Содержит вопрос");
    if (hasNumbers) strengths.push("✅ Содержит цифры");
  }
  
  // Check for generic/template words
  const genericWords = ["статья", "информация", "материал", "текст"];
  if (genericWords.some(w => titleLower.includes(w))) {
    issues.push("⚠️ Содержит общие слова без ценности");
  }
  
  // Check for specific pain/problem keywords
  const painKeywords = ["проблема", "боль", "трудность", "сложность", "нехватка", "отсутствие"];
  if (painKeywords.some(w => titleLower.includes(w))) {
    strengths.push("✅ Упоминает проблему/боль (релевантно для pain-статей)");
  }
  
  return {
    title,
    ideaTitle,
    ideaDescription,
    length,
    wordCount,
    hasQuestion,
    hasNumbers,
    hasPowerWords,
    seoKeywords: [...new Set(seoKeywords)],
    readability,
    interestScore,
    issues,
    strengths
  };
}

async function analyzeHeadlines() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(20).exec();
  
  console.log("=".repeat(100));
  console.log("АНАЛИЗ ЗАГОЛОВКОВ СТАТЕЙ");
  console.log("=".repeat(100));
  
  const analyses: HeadlineAnalysis[] = [];
  
  for (const item of items) {
    let ideaTitle: string | undefined;
    let ideaDescription: string | undefined;
    
    if (item.backlogIdeaId) {
      const idea = await SeoBacklogIdea.findById(item.backlogIdeaId).exec();
      if (idea) {
        ideaTitle = idea.title;
        ideaDescription = idea.description;
      }
    }
    
    const analysis = analyzeHeadline(item.title, ideaTitle, ideaDescription);
    analyses.push(analysis);
  }
  
  // Display individual analyses
  analyses.forEach((analysis, idx) => {
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`ЗАГОЛОВОК ${idx + 1}: ${analysis.title}`);
    console.log("=".repeat(100));
    
    if (analysis.ideaTitle) {
      console.log(`📋 Идея: ${analysis.ideaTitle}`);
    }
    
    console.log(`\n📊 ОЦЕНКА ИНТЕРЕСНОСТИ: ${analysis.interestScore}/100`);
    if (analysis.interestScore >= 80) {
      console.log("   ✅ ОТЛИЧНО: Очень привлекательный заголовок");
    } else if (analysis.interestScore >= 60) {
      console.log("   ⚠️  ХОРОШО: Приемлемый заголовок");
    } else if (analysis.interestScore >= 40) {
      console.log("   ⚠️  СРЕДНЕ: Нужны улучшения");
    } else {
      console.log("   ❌ ПЛОХО: Непривлекательный заголовок");
    }
    
    console.log(`\n📏 ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ:`);
    console.log(`   Длина: ${analysis.length} символов (идеально 50-60)`);
    console.log(`   Слов: ${analysis.wordCount} (идеально 5-9)`);
    console.log(`   Читаемость: ${analysis.readability === "excellent" ? "✅ Отличная" : analysis.readability === "good" ? "✅ Хорошая" : analysis.readability === "fair" ? "⚠️ Средняя" : "❌ Плохая"}`);
    
    console.log(`\n🔍 SEO-АНАЛИЗ:`);
    if (analysis.seoKeywords.length > 0) {
      console.log(`   Найдено ключевых слов/фраз: ${analysis.seoKeywords.length}`);
      console.log(`   Ключевые слова: ${analysis.seoKeywords.slice(0, 5).join(", ")}`);
    } else {
      console.log(`   ❌ SEO-ключевые слова не обнаружены`);
    }
    
    console.log(`\n💡 ЭЛЕМЕНТЫ ПРИВЛЕКАТЕЛЬНОСТИ:`);
    console.log(`   Вопрос: ${analysis.hasQuestion ? "✅ Да" : "❌ Нет"}`);
    console.log(`   Цифры: ${analysis.hasNumbers ? "✅ Да" : "❌ Нет"}`);
    console.log(`   Сильные слова: ${analysis.hasPowerWords ? "✅ Да" : "❌ Нет"}`);
    
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
  
  // Overall statistics
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ОБЩАЯ СТАТИСТИКА");
  console.log("=".repeat(100));
  
  const avgInterest = analyses.reduce((sum, a) => sum + a.interestScore, 0) / analyses.length;
  const avgLength = analyses.reduce((sum, a) => sum + a.length, 0) / analyses.length;
  const avgWords = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
  const withQuestions = analyses.filter(a => a.hasQuestion).length;
  const withNumbers = analyses.filter(a => a.hasNumbers).length;
  const withPowerWords = analyses.filter(a => a.hasPowerWords).length;
  const withSeoKeywords = analyses.filter(a => a.seoKeywords.length > 0).length;
  const excellentReadability = analyses.filter(a => a.readability === "excellent").length;
  
  console.log(`\n📊 Средняя оценка интересности: ${avgInterest.toFixed(1)}/100`);
  console.log(`📊 Средняя длина: ${avgLength.toFixed(1)} символов`);
  console.log(`📊 Среднее количество слов: ${avgWords.toFixed(1)}`);
  console.log(`📊 Заголовков с вопросами: ${withQuestions}/${analyses.length}`);
  console.log(`📊 Заголовков с цифрами: ${withNumbers}/${analyses.length}`);
  console.log(`📊 Заголовков с сильными словами: ${withPowerWords}/${analyses.length}`);
  console.log(`📊 Заголовков с SEO-ключевыми словами: ${withSeoKeywords}/${analyses.length}`);
  console.log(`📊 Заголовков с отличной читаемостью: ${excellentReadability}/${analyses.length}`);
  
  // Distribution by score
  const excellent = analyses.filter(a => a.interestScore >= 80).length;
  const good = analyses.filter(a => a.interestScore >= 60 && a.interestScore < 80).length;
  const fair = analyses.filter(a => a.interestScore >= 40 && a.interestScore < 60).length;
  const poor = analyses.filter(a => a.interestScore < 40).length;
  
  console.log(`\n📈 РАСПРЕДЕЛЕНИЕ ПО ОЦЕНКАМ:`);
  console.log(`   Отлично (80-100): ${excellent} (${((excellent/analyses.length)*100).toFixed(1)}%)`);
  console.log(`   Хорошо (60-79): ${good} (${((good/analyses.length)*100).toFixed(1)}%)`);
  console.log(`   Средне (40-59): ${fair} (${((fair/analyses.length)*100).toFixed(1)}%)`);
  console.log(`   Плохо (0-39): ${poor} (${((poor/analyses.length)*100).toFixed(1)}%)`);
  
  await mongoose.disconnect();
}

analyzeHeadlines();


