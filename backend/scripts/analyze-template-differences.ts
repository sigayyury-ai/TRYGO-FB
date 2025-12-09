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

interface ArticleAnalysis {
  category: string;
  title: string;
  wordCount: number;
  structure: {
    sections: number;
    sectionTitles: string[];
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasCTA: boolean;
  };
  headings: {
    h1: string;
    h2Count: number;
    h3Count: number;
    h2Patterns: string[];
  };
  approach: {
    questionBased: boolean;
    problemBased: boolean;
    solutionBased: boolean;
    tutorialBased: boolean;
    comparisonBased: boolean;
    exampleBased: boolean;
  };
  productMentions: number;
  tone: {
    usesYou: boolean;
    usesWe: boolean;
    questionsCount: number;
    imperativeCount: number;
  };
}

function analyzeArticle(content: string, title: string, category: string): ArticleAnalysis {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Структура
  const h2Sections = content.match(/^##\s+(.+)$/gm) || [];
  const h3Sections = content.match(/^###\s+(.+)$/gm) || [];
  const sectionTitles = h2Sections.map(s => s.replace(/^##\s+/, ""));
  
  const hasIntroduction = /введение|introduction|начало|о чем/i.test(sectionTitles[0] || "") ||
                         /^#\s/.test(content);
  const hasConclusion = /заключение|вывод|итог|conclusion/i.test(content) ||
                       /заключение|вывод|итог/i.test(sectionTitles[sectionTitles.length - 1] || "");
  const hasCTA = /узнайте|попробуйте|начните|изучите|создайте|получите/i.test(content.toLowerCase());
  
  // Заголовки
  const h1 = content.match(/^#\s+(.+)$/m)?.[1] || "";
  const h2Count = h2Sections.length;
  const h3Count = h3Sections.length;
  
  // Паттерны заголовков H2
  const h2Patterns: string[] = [];
  sectionTitles.forEach(title => {
    if (/как|how/i.test(title)) h2Patterns.push("Как/How");
    if (/почему|why/i.test(title)) h2Patterns.push("Почему/Why");
    if (/что|what/i.test(title)) h2Patterns.push("Что/What");
    if (/пример|example|кейс|case/i.test(title)) h2Patterns.push("Примеры/Examples");
    if (/преимуществ|benefit|польз/i.test(title)) h2Patterns.push("Преимущества/Benefits");
    if (/проблем|problem|трудност/i.test(title)) h2Patterns.push("Проблемы/Problems");
    if (/решен|solution|подход/i.test(title)) h2Patterns.push("Решения/Solutions");
    if (/сравнен|comparison|vs/i.test(title)) h2Patterns.push("Сравнение/Comparison");
    if (/шаг|step|этап/i.test(title)) h2Patterns.push("Шаги/Steps");
    if (/лучш|best|практик|practice/i.test(title)) h2Patterns.push("Практики/Practices");
  });
  
  // Подход
  const questionBased = /^[как|почему|что|when|how|why|what]/i.test(title) || 
                        (content.match(/[?]/g) || []).length > 2;
  const problemBased = /проблем|трудност|сложност|нехватк|отсутств|боль/i.test(content.toLowerCase());
  const solutionBased = /решен|подход|метод|способ|инструмент|помощ/i.test(content.toLowerCase());
  const tutorialBased = /шаг|этап|руководств|гайд|инструкц|tutorial|guide/i.test(content.toLowerCase());
  const comparisonBased = /сравнен|против|vs|versus|или|альтернатив/i.test(content.toLowerCase());
  const exampleBased = /пример|кейс|case|примеры|scenario/i.test(content.toLowerCase());
  
  // Упоминания продукта
  const productMentions = (content.match(/ai marketing copilot|marketing copilot|trygo/gi) || []).length;
  
  // Тон
  const usesYou = (content.match(/\b(вы|вас|вам|вами|ваш|ваша|ваше|ваши)\b/gi) || []).length > 0;
  const usesWe = (content.match(/\b(мы|нас|нам|нами|наш|наша|наше|наши)\b/gi) || []).length > 0;
  const questionsCount = (content.match(/[?]/g) || []).length;
  const imperativeCount = (content.match(/\b(попробуйте|начните|используйте|создайте|получите|изучите)\b/gi) || []).length;
  
  return {
    category,
    title,
    wordCount,
    structure: {
      sections: h2Count,
      sectionTitles,
      hasIntroduction,
      hasConclusion,
      hasCTA
    },
    headings: {
      h1,
      h2Count,
      h3Count,
      h2Patterns: [...new Set(h2Patterns)]
    },
    approach: {
      questionBased,
      problemBased,
      solutionBased,
      tutorialBased,
      comparisonBased,
      exampleBased
    },
    productMentions,
    tone: {
      usesYou,
      usesWe,
      questionsCount,
      imperativeCount
    }
  };
}

async function analyzeTemplateDifferences() {
  await mongoose.connect(MONGODB_URI!);
  
  const categories = ["pain", "goal", "trigger", "feature", "benefit", "faq", "info"];
  const analyses: ArticleAnalysis[] = [];
  
  console.log("=".repeat(100));
  console.log("АНАЛИЗ РАЗЛИЧИЙ МЕЖДУ ШАБЛОНАМИ КАТЕГОРИЙ");
  console.log("=".repeat(100));
  
  for (const category of categories) {
    const item = await SeoContentItem.findOne({
      projectId,
      hypothesisId,
      category
    }).sort({ createdAt: -1 }).exec();
    
    if (!item || !item.content) {
      console.log(`\n❌ Нет статьи для категории ${category}`);
      continue;
    }
    
    const analysis = analyzeArticle(item.content, item.title, category);
    analyses.push(analysis);
  }
  
  // Детальный анализ каждой категории
  console.log("\n\n" + "=".repeat(100));
  console.log("ДЕТАЛЬНЫЙ АНАЛИЗ ПО КАТЕГОРИЯМ");
  console.log("=".repeat(100));
  
  analyses.forEach((analysis, idx) => {
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`КАТЕГОРИЯ ${idx + 1}: ${analysis.category.toUpperCase()}`);
    console.log("=".repeat(100));
    console.log(`\n📌 Заголовок: ${analysis.title}`);
    console.log(`📊 Объем: ${analysis.wordCount} слов`);
    
    console.log(`\n📐 СТРУКТУРА:`);
    console.log(`   Разделов H2: ${analysis.structure.sections}`);
    console.log(`   Подразделов H3: ${analysis.structure.h3Count}`);
    console.log(`   Есть введение: ${analysis.structure.hasIntroduction ? "✅" : "❌"}`);
    console.log(`   Есть заключение: ${analysis.structure.hasConclusion ? "✅" : "❌"}`);
    console.log(`   Есть CTA: ${analysis.structure.hasCTA ? "✅" : "❌"}`);
    console.log(`\n   Разделы:`);
    analysis.structure.sectionTitles.forEach((title, i) => {
      console.log(`     ${i + 1}. ${title}`);
    });
    
    console.log(`\n📝 ЗАГОЛОВКИ:`);
    console.log(`   H1: ${analysis.headings.h1}`);
    console.log(`   Паттерны H2: ${analysis.headings.h2Patterns.join(", ") || "нет"}`);
    
    console.log(`\n🎯 ПОДХОД:`);
    console.log(`   Вопросный: ${analysis.approach.questionBased ? "✅" : "❌"}`);
    console.log(`   Проблемный: ${analysis.approach.problemBased ? "✅" : "❌"}`);
    console.log(`   Решение-ориентированный: ${analysis.approach.solutionBased ? "✅" : "❌"}`);
    console.log(`   Обучающий: ${analysis.approach.tutorialBased ? "✅" : "❌"}`);
    console.log(`   Сравнительный: ${analysis.approach.comparisonBased ? "✅" : "❌"}`);
    console.log(`   Примеры/кейсы: ${analysis.approach.exampleBased ? "✅" : "❌"}`);
    
    console.log(`\n💬 ТОН:`);
    console.log(`   Использует "вы": ${analysis.tone.usesYou ? "✅" : "❌"}`);
    console.log(`   Использует "мы": ${analysis.tone.usesWe ? "✅" : "❌"}`);
    console.log(`   Вопросов: ${analysis.tone.questionsCount}`);
    console.log(`   Призывов к действию: ${analysis.tone.imperativeCount}`);
    console.log(`   Упоминаний продукта: ${analysis.productMentions}`);
  });
  
  // Сравнительный анализ
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("СРАВНИТЕЛЬНЫЙ АНАЛИЗ");
  console.log("=".repeat(100));
  
  // Структура
  console.log(`\n📐 СТРУКТУРА (количество разделов):`);
  analyses.forEach(a => {
    console.log(`   ${a.category.toUpperCase().padEnd(10)}: ${a.structure.sections} разделов`);
  });
  
  const avgSections = analyses.reduce((sum, a) => sum + a.structure.sections, 0) / analyses.length;
  console.log(`   Среднее: ${avgSections.toFixed(1)} разделов`);
  
  // Объем
  console.log(`\n📊 ОБЪЕМ (слов):`);
  analyses.forEach(a => {
    console.log(`   ${a.category.toUpperCase().padEnd(10)}: ${a.wordCount} слов`);
  });
  const avgWords = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
  console.log(`   Среднее: ${avgWords.toFixed(0)} слов`);
  
  // Подходы
  console.log(`\n🎯 ПОДХОДЫ (какие используются):`);
  const approachTypes = ["questionBased", "problemBased", "solutionBased", "tutorialBased", "comparisonBased", "exampleBased"];
  approachTypes.forEach(approachType => {
    const count = analyses.filter(a => a.approach[approachType as keyof typeof a.approach]).length;
    const label = approachType.replace(/([A-Z])/g, " $1").toLowerCase();
    console.log(`   ${label.padEnd(25)}: ${count}/${analyses.length} статей`);
  });
  
  // Паттерны заголовков
  console.log(`\n📝 ПАТТЕРНЫ ЗАГОЛОВКОВ H2:`);
  const allPatterns = new Set<string>();
  analyses.forEach(a => {
    a.headings.h2Patterns.forEach(p => allPatterns.add(p));
  });
  allPatterns.forEach(pattern => {
    const count = analyses.filter(a => a.headings.h2Patterns.includes(pattern)).length;
    console.log(`   ${pattern.padEnd(25)}: ${count}/${analyses.length} статей`);
  });
  
  // Уникальность структуры
  console.log(`\n🔍 УНИКАЛЬНОСТЬ СТРУКТУРЫ:`);
  const structures = analyses.map(a => a.structure.sectionTitles.join(" | "));
  const uniqueStructures = new Set(structures);
  console.log(`   Уникальных структур: ${uniqueStructures.size}/${analyses.length}`);
  
  // Сходство между категориями
  console.log(`\n📊 СХОДСТВО МЕЖДУ КАТЕГОРИЯМИ:`);
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const a1 = analyses[i];
      const a2 = analyses[j];
      
      // Сравнить структуру
      const commonSections = a1.structure.sectionTitles.filter(t => 
        a2.structure.sectionTitles.some(t2 => 
          t.toLowerCase().includes(t2.toLowerCase()) || t2.toLowerCase().includes(t.toLowerCase())
        )
      ).length;
      
      const similarity = (commonSections / Math.max(a1.structure.sections, a2.structure.sections)) * 100;
      
      if (similarity > 30) {
        console.log(`   ${a1.category.toUpperCase()} ↔ ${a2.category.toUpperCase()}: ${similarity.toFixed(0)}% сходства`);
      }
    }
  }
  
  // Выводы
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ВЫВОДЫ");
  console.log("=".repeat(100));
  
  console.log(`\n✅ РАЗЛИЧИЯ:`);
  console.log(`   1. Структура: ${uniqueStructures.size === analyses.length ? "Полностью уникальна" : `Частично похожа (${uniqueStructures.size} уникальных из ${analyses.length})`}`);
  console.log(`   2. Объем: Разброс от ${Math.min(...analyses.map(a => a.wordCount))} до ${Math.max(...analyses.map(a => a.wordCount))} слов`);
  console.log(`   3. Подходы: Используются разные комбинации подходов для каждой категории`);
  console.log(`   4. Заголовки: ${allPatterns.size} различных паттернов заголовков`);
  
  const mostCommonPattern = Array.from(allPatterns).reduce((max, p) => {
    const count = analyses.filter(a => a.headings.h2Patterns.includes(p)).length;
    return count > (analyses.filter(a => a.headings.h2Patterns.includes(max)).length || 0) ? p : max;
  }, "");
  
  console.log(`   5. Самый частый паттерн: ${mostCommonPattern}`);
  
  await mongoose.disconnect();
}

analyzeTemplateDifferences().catch(console.error);

