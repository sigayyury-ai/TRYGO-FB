#!/usr/bin/env tsx

import * as fs from "fs";
import { resolve } from "path";

const detailsFile = resolve(process.cwd(), "../logs/generation-by-category-details-1765322144555.txt");

interface ArticleAnalysis {
  category: string;
  title: string;
  wordCount: number;
  sections: number;
  sectionTitles: string[];
  h1: string;
  h2Patterns: string[];
  approaches: string[];
  productMentions: number;
  hasQuestions: boolean;
  hasCTA: boolean;
  usesYou: boolean;
}

function extractArticleFromFile(content: string, category: string): ArticleAnalysis | null {
  const categorySection = content.match(
    new RegExp(`КАТЕГОРИЯ \\d+: ${category.toUpperCase()}([\\s\\S]*?)(?=КАТЕГОРИЯ|$)`, "i")
  );
  
  if (!categorySection) return null;
  
  const section = categorySection[1];
  
  // Извлечь заголовок
  const titleMatch = section.match(/Заголовок:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : "";
  
  // Извлечь полный текст
  const textMatch = section.match(/ПОЛНЫЙ ТЕКСТ:[\s\S]*?\n\n([\s\S]*?)(?=OUTLINE:|$)/);
  if (!textMatch) return null;
  
  const articleText = textMatch[1].trim();
  
  // Анализ
  const words = articleText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Разделы
  const h2Sections = articleText.match(/^##\s+(.+)$/gm) || [];
  const sections = h2Sections.length;
  const sectionTitles = h2Sections.map(s => s.replace(/^##\s+/, "").trim());
  
  // H1
  const h1Match = articleText.match(/^#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1].trim() : "";
  
  // Паттерны заголовков
  const h2Patterns: string[] = [];
  sectionTitles.forEach(title => {
    if (/как|how/i.test(title)) h2Patterns.push("Как/How");
    if (/почему|why/i.test(title)) h2Patterns.push("Почему/Why");
    if (/что|what/i.test(title)) h2Patterns.push("Что/What");
    if (/пример|example|кейс|case/i.test(title)) h2Patterns.push("Примеры");
    if (/преимуществ|benefit|польз/i.test(title)) h2Patterns.push("Преимущества");
    if (/проблем|problem|трудност/i.test(title)) h2Patterns.push("Проблемы");
    if (/решен|solution|подход/i.test(title)) h2Patterns.push("Решения");
    if (/сравнен|comparison|vs/i.test(title)) h2Patterns.push("Сравнение");
    if (/шаг|step|этап/i.test(title)) h2Patterns.push("Шаги");
    if (/лучш|best|практик|practice/i.test(title)) h2Patterns.push("Практики");
    if (/принцип|principle/i.test(title)) h2Patterns.push("Принципы");
    if (/зачем|для чего/i.test(title)) h2Patterns.push("Зачем");
  });
  
  // Подходы
  const approaches: string[] = [];
  if (/^[как|почему|что|when|how|why|what]/i.test(title) || (articleText.match(/[?]/g) || []).length > 2) {
    approaches.push("Вопросный");
  }
  if (/проблем|трудност|сложност|нехватк|отсутств|боль/i.test(articleText.toLowerCase())) {
    approaches.push("Проблемный");
  }
  if (/решен|подход|метод|способ|инструмент|помощ/i.test(articleText.toLowerCase())) {
    approaches.push("Решение-ориентированный");
  }
  if (/шаг|этап|руководств|гайд|инструкц|tutorial|guide/i.test(articleText.toLowerCase())) {
    approaches.push("Обучающий");
  }
  if (/сравнен|против|vs|versus|или|альтернатив/i.test(articleText.toLowerCase())) {
    approaches.push("Сравнительный");
  }
  if (/пример|кейс|case|примеры|scenario/i.test(articleText.toLowerCase())) {
    approaches.push("Примеры/кейсы");
  }
  if (/преимуществ|benefit|выгод|польз/i.test(articleText.toLowerCase())) {
    approaches.push("Преимущества");
  }
  
  // Упоминания продукта
  const productMentions = (articleText.match(/ai marketing copilot|marketing copilot|trygo/gi) || []).length;
  
  // Вопросы
  const hasQuestions = (articleText.match(/[?]/g) || []).length > 0;
  
  // CTA
  const hasCTA = /узнайте|попробуйте|начните|изучите|создайте|получите/i.test(articleText.toLowerCase());
  
  // Использование "вы"
  const usesYou = (articleText.match(/\b(вы|вас|вам|вами|ваш|ваша|ваше|ваши)\b/gi) || []).length > 0;
  
  return {
    category,
    title,
    wordCount,
    sections,
    sectionTitles,
    h1,
    h2Patterns: [...new Set(h2Patterns)],
    approaches: [...new Set(approaches)],
    productMentions,
    hasQuestions,
    hasCTA,
    usesYou
  };
}

async function analyzeTemplates() {
  const content = fs.readFileSync(detailsFile, "utf-8");
  
  const categories = ["PAIN", "GOAL", "TRIGGER", "FEATURE", "BENEFIT", "FAQ", "INFO"];
  const analyses: ArticleAnalysis[] = [];
  
  console.log("=".repeat(100));
  console.log("АНАЛИЗ РАЗЛИЧИЙ МЕЖДУ ШАБЛОНАМИ КАТЕГОРИЙ");
  console.log("=".repeat(100));
  
  for (const category of categories) {
    const analysis = extractArticleFromFile(content, category);
    if (analysis) {
      analyses.push(analysis);
    }
  }
  
  // Детальный анализ
  console.log("\n\n" + "=".repeat(100));
  console.log("ДЕТАЛЬНЫЙ АНАЛИЗ ПО КАТЕГОРИЯМ");
  console.log("=".repeat(100));
  
  analyses.forEach((analysis, idx) => {
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`КАТЕГОРИЯ ${idx + 1}: ${analysis.category}`);
    console.log("=".repeat(100));
    console.log(`\n📌 Заголовок: ${analysis.title}`);
    console.log(`📊 Объем: ${analysis.wordCount} слов`);
    console.log(`📐 Разделов: ${analysis.sections}`);
    console.log(`\n📝 H1: ${analysis.h1}`);
    console.log(`\n📑 Разделы H2:`);
    analysis.sectionTitles.forEach((title, i) => {
      console.log(`   ${i + 1}. ${title}`);
    });
    console.log(`\n🎯 Паттерны заголовков: ${analysis.h2Patterns.join(", ") || "нет"}`);
    console.log(`\n💡 Подходы: ${analysis.approaches.join(", ") || "нет"}`);
    console.log(`\n💬 Тон:`);
    console.log(`   Использует "вы": ${analysis.usesYou ? "✅" : "❌"}`);
    console.log(`   Вопросы: ${analysis.hasQuestions ? "✅" : "❌"}`);
    console.log(`   CTA: ${analysis.hasCTA ? "✅" : "❌"}`);
    console.log(`   Упоминаний продукта: ${analysis.productMentions}`);
  });
  
  // Сравнительный анализ
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("СРАВНИТЕЛЬНЫЙ АНАЛИЗ");
  console.log("=".repeat(100));
  
  console.log(`\n📐 СТРУКТУРА (количество разделов):`);
  analyses.forEach(a => {
    console.log(`   ${a.category.padEnd(10)}: ${a.sections} разделов`);
  });
  const avgSections = analyses.reduce((sum, a) => sum + a.sections, 0) / analyses.length;
  console.log(`   Среднее: ${avgSections.toFixed(1)} разделов`);
  const minSections = Math.min(...analyses.map(a => a.sections));
  const maxSections = Math.max(...analyses.map(a => a.sections));
  console.log(`   Разброс: ${minSections} - ${maxSections} разделов`);
  
  console.log(`\n📊 ОБЪЕМ (слов):`);
  analyses.forEach(a => {
    console.log(`   ${a.category.padEnd(10)}: ${a.wordCount} слов`);
  });
  const avgWords = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
  console.log(`   Среднее: ${avgWords.toFixed(0)} слов`);
  const minWords = Math.min(...analyses.map(a => a.wordCount));
  const maxWords = Math.max(...analyses.map(a => a.wordCount));
  console.log(`   Разброс: ${minWords} - ${maxWords} слов (${((maxWords - minWords) / avgWords * 100).toFixed(0)}% разница)`);
  
  console.log(`\n🎯 ПОДХОДЫ:`);
  const allApproaches = new Set<string>();
  analyses.forEach(a => {
    a.approaches.forEach(ap => allApproaches.add(ap));
  });
  allApproaches.forEach(approach => {
    const count = analyses.filter(a => a.approaches.includes(approach)).length;
    console.log(`   ${approach.padEnd(25)}: ${count}/${analyses.length} статей`);
  });
  
  console.log(`\n📝 ПАТТЕРНЫ ЗАГОЛОВКОВ H2:`);
  const allPatterns = new Set<string>();
  analyses.forEach(a => {
    a.h2Patterns.forEach(p => allPatterns.add(p));
  });
  allPatterns.forEach(pattern => {
    const count = analyses.filter(a => a.h2Patterns.includes(pattern)).length;
    console.log(`   ${pattern.padEnd(25)}: ${count}/${analyses.length} статей`);
  });
  
  // Уникальность структуры
  console.log(`\n🔍 УНИКАЛЬНОСТЬ СТРУКТУРЫ:`);
  const structures = analyses.map(a => a.sectionTitles.join(" → "));
  const uniqueStructures = new Set(structures);
  console.log(`   Уникальных структур: ${uniqueStructures.size}/${analyses.length}`);
  
  // Сходство между категориями
  console.log(`\n📊 СХОДСТВО МЕЖДУ КАТЕГОРИЯМИ (по структуре):`);
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const a1 = analyses[i];
      const a2 = analyses[j];
      
      const commonSections = a1.sectionTitles.filter(t1 => 
        a2.sectionTitles.some(t2 => {
          const t1Lower = t1.toLowerCase();
          const t2Lower = t2.toLowerCase();
          return t1Lower.includes(t2Lower) || t2Lower.includes(t1Lower) || 
                 t1Lower.split(/\s+/).some(w => t2Lower.includes(w)) ||
                 t2Lower.split(/\s+/).some(w => t1Lower.includes(w));
        })
      ).length;
      
      const similarity = (commonSections / Math.max(a1.sections, a2.sections)) * 100;
      
      if (similarity > 20) {
        console.log(`   ${a1.category.padEnd(10)} ↔ ${a2.category.padEnd(10)}: ${similarity.toFixed(0)}% сходства (${commonSections} общих разделов)`);
      }
    }
  }
  
  // Выводы
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ВЫВОДЫ О РАЗЛИЧИЯХ ШАБЛОНОВ");
  console.log("=".repeat(100));
  
  console.log(`\n✅ СТРУКТУРА:`);
  console.log(`   • Разброс разделов: ${minSections}-${maxSections} (${((maxSections - minSections) / avgSections * 100).toFixed(0)}% разница)`);
  console.log(`   • Уникальность: ${uniqueStructures.size === analyses.length ? "Полностью уникальна" : `${uniqueStructures.size} уникальных из ${analyses.length}`}`);
  
  console.log(`\n✅ ЗАГОЛОВКИ:`);
  console.log(`   • Используется ${allPatterns.size} различных паттернов`);
  const mostCommonPattern = Array.from(allPatterns).reduce((max, p) => {
    const count = analyses.filter(a => a.h2Patterns.includes(p)).length;
    const maxCount = analyses.filter(a => a.h2Patterns.includes(max)).length;
    return count > maxCount ? p : max;
  }, Array.from(allPatterns)[0] || "");
  console.log(`   • Самый частый: ${mostCommonPattern} (${analyses.filter(a => a.h2Patterns.includes(mostCommonPattern)).length}/${analyses.length} статей)`);
  
  console.log(`\n✅ ПОДХОДЫ:`);
  console.log(`   • Используется ${allApproaches.size} различных подходов`);
  const mostCommonApproach = Array.from(allApproaches).reduce((max, ap) => {
    const count = analyses.filter(a => a.approaches.includes(ap)).length;
    const maxCount = analyses.filter(a => a.approaches.includes(max)).length;
    return count > maxCount ? ap : max;
  }, Array.from(allApproaches)[0] || "");
  console.log(`   • Самый частый: ${mostCommonApproach} (${analyses.filter(a => a.approaches.includes(mostCommonApproach)).length}/${analyses.length} статей)`);
  
  console.log(`\n✅ ОБЪЕМ:`);
  console.log(`   • Разброс: ${minWords}-${maxWords} слов (${((maxWords - minWords) / avgWords * 100).toFixed(0)}% разница)`);
  
  console.log(`\n✅ ТОН:`);
  const withYou = analyses.filter(a => a.usesYou).length;
  const withQuestions = analyses.filter(a => a.hasQuestions).length;
  const withCTA = analyses.filter(a => a.hasCTA).length;
  console.log(`   • Используют "вы": ${withYou}/${analyses.length} статей`);
  console.log(`   • Содержат вопросы: ${withQuestions}/${analyses.length} статей`);
  console.log(`   • Имеют CTA: ${withCTA}/${analyses.length} статей`);
}

analyzeTemplates();


