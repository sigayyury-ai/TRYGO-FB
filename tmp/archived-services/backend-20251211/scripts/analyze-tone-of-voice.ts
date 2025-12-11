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

interface ToneOfVoiceAnalysis {
  title: string;
  // Formality
  formality: "formal" | "semi-formal" | "casual";
  formalityScore: number; // 0-100
  
  // Personal pronouns
  usesYou: boolean;
  usesWe: boolean;
  usesI: boolean;
  personalPronounsCount: number;
  
  // Engagement
  hasQuestions: boolean;
  questionsCount: number;
  hasDirectAddress: boolean; // "вы", "ты"
  
  // Clarity
  avgSentenceLength: number;
  longSentences: number; // > 25 words
  shortSentences: number; // < 10 words
  
  // Empathy & Understanding
  empathyWords: string[]; // "понимаю", "знаю", "сталкивались"
  problemAcknowledgment: boolean;
  
  // Action-oriented
  actionWords: string[]; // "сделайте", "попробуйте", "начните"
  imperativeCount: number;
  
  // Positivity
  positiveWords: string[];
  negativeWords: string[];
  positivityRatio: number;
  
  // Professional vs Friendly
  professionalTerms: string[];
  friendlyTerms: string[];
  toneBalance: "professional" | "balanced" | "friendly";
  
  // Issues
  issues: string[];
  strengths: string[];
  overallScore: number; // 0-100
}

const empathyWords = [
  /понимаю/gi, /знаю/gi, /сталкивались/gi, /испытывали/gi,
  /знакомо/gi, /привычно/gi, /обычно/gi, /часто/gi,
  /многие/gi, /большинство/gi, /некоторые/gi
];

const actionWords = [
  /сделайте/gi, /попробуйте/gi, /начните/gi, /используйте/gi,
  /примените/gi, /внедрите/gi, /реализуйте/gi, /создайте/gi,
  /улучшите/gi, /оптимизируйте/gi
];

const positiveWords = [
  /успех/gi, /результат/gi, /решение/gi, /помощь/gi,
  /улучшение/gi, /рост/gi, /развитие/gi, /эффективность/gi,
  /преимущество/gi, /выгода/gi, /польза/gi, /достижение/gi
];

const negativeWords = [
  /проблема/gi, /трудность/gi, /сложность/gi, /нехватка/gi,
  /отсутствие/gi, /недостаток/gi, /ошибка/gi, /провал/gi,
  /неудача/gi, /проблемы/gi, /боль/gi, /стресс/gi
];

const professionalTerms = [
  /рекомендуем/gi, /предлагаем/gi, /рекомендация/gi,
  /методология/gi, /метод/gi, /подход/gi, /стратегия/gi,
  /оптимизация/gi, /эффективность/gi, /результативность/gi
];

const friendlyTerms = [
  /давайте/gi, /попробуем/gi, /вместе/gi, /давай/gi,
  /просто/gi, /легко/gi, /проще/gi, /понятно/gi
];

function analyzeToneOfVoice(content: string, title: string): ToneOfVoiceAnalysis {
  const contentLower = content.toLowerCase();
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Formality analysis
  const formalIndicators = [
    /рекомендуем/gi, /предлагаем/gi, /следует/gi, /необходимо/gi,
    /осуществлять/gi, /реализовывать/gi, /оптимизировать/gi
  ];
  const casualIndicators = [
    /давайте/gi, /попробуем/gi, /просто/gi, /легко/gi,
    /круто/gi, /классно/gi, /отлично/gi
  ];
  
  const formalCount = formalIndicators.reduce((sum, pattern) => 
    sum + (content.match(pattern)?.length || 0), 0);
  const casualCount = casualIndicators.reduce((sum, pattern) => 
    sum + (content.match(pattern)?.length || 0), 0);
  
  let formality: "formal" | "semi-formal" | "casual" = "semi-formal";
  let formalityScore = 50;
  
  if (formalCount > casualCount * 2) {
    formality = "formal";
    formalityScore = 80 + Math.min(20, formalCount * 2);
  } else if (casualCount > formalCount * 2) {
    formality = "casual";
    formalityScore = 20 - Math.min(20, casualCount * 2);
  } else {
    formality = "semi-formal";
    formalityScore = 40 + Math.min(20, (formalCount + casualCount) / 2);
  }
  
  // Personal pronouns
  const youCount = (content.match(/\b(вы|вас|вам|вами|ваш|ваша|ваше|ваши)\b/gi) || []).length;
  const weCount = (content.match(/\b(мы|нас|нам|нами|наш|наша|наше|наши)\b/gi) || []).length;
  const iCount = (content.match(/\b(я|меня|мне|мной|мой|моя|мое|мои)\b/gi) || []).length;
  
  const usesYou = youCount > 0;
  const usesWe = weCount > 0;
  const usesI = iCount > 0;
  const personalPronounsCount = youCount + weCount + iCount;
  
  // Questions
  const questions = content.match(/[?]/g) || [];
  const hasQuestions = questions.length > 0;
  const questionsCount = questions.length;
  
  // Direct address
  const hasDirectAddress = usesYou || (content.match(/\b(ты|тебя|тебе|тобой)\b/gi) || []).length > 0;
  
  // Sentence length
  const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length || 0;
  const longSentences = sentenceLengths.filter(len => len > 25).length;
  const shortSentences = sentenceLengths.filter(len => len < 10).length;
  
  // Empathy
  const empathyMatches: string[] = [];
  empathyWords.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) empathyMatches.push(...matches);
  });
  const empathyWordsFound = [...new Set(empathyMatches.map(m => m.toLowerCase()))];
  
  const problemAcknowledgment = /проблем|трудност|сложност|нехватк|отсутств/i.test(content);
  
  // Action words
  const actionMatches: string[] = [];
  actionWords.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) actionMatches.push(...matches);
  });
  const actionWordsFound = [...new Set(actionMatches.map(m => m.toLowerCase()))];
  
  const imperativeCount = actionWordsFound.length;
  
  // Positivity
  const positiveMatches: string[] = [];
  positiveWords.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) positiveMatches.push(...matches);
  });
  const positiveWordsFound = [...new Set(positiveMatches.map(m => m.toLowerCase()))];
  
  const negativeMatches: string[] = [];
  negativeWords.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) negativeMatches.push(...matches);
  });
  const negativeWordsFound = [...new Set(negativeMatches.map(m => m.toLowerCase()))];
  
  const positivityRatio = positiveWordsFound.length > 0 
    ? positiveWordsFound.length / (positiveWordsFound.length + negativeWordsFound.length)
    : 0.5;
  
  // Professional vs Friendly
  const professionalMatches: string[] = [];
  professionalTerms.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) professionalMatches.push(...matches);
  });
  const professionalTermsFound = [...new Set(professionalMatches.map(m => m.toLowerCase()))];
  
  const friendlyMatches: string[] = [];
  friendlyTerms.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) friendlyMatches.push(...matches);
  });
  const friendlyTermsFound = [...new Set(friendlyMatches.map(m => m.toLowerCase()))];
  
  let toneBalance: "professional" | "balanced" | "friendly" = "balanced";
  if (professionalTermsFound.length > friendlyTermsFound.length * 1.5) {
    toneBalance = "professional";
  } else if (friendlyTermsFound.length > professionalTermsFound.length * 1.5) {
    toneBalance = "friendly";
  }
  
  // Calculate overall score
  let overallScore = 50;
  const issues: string[] = [];
  const strengths: string[] = [];
  
  // Formality check (should be semi-formal for business content)
  if (formality === "formal") {
    overallScore -= 10;
    issues.push("⚠️ Слишком формальный тон (может отталкивать читателей)");
  } else if (formality === "casual") {
    overallScore -= 15;
    issues.push("⚠️ Слишком неформальный тон (не подходит для бизнес-контента)");
  } else {
    strengths.push("✅ Полуформальный тон (подходит для бизнес-контента)");
    overallScore += 10;
  }
  
  // Personal pronouns (should use "вы" for engagement)
  if (usesYou && youCount >= 3) {
    strengths.push(`✅ Использует обращение "вы" (${youCount} раз) - создает вовлеченность`);
    overallScore += 10;
  } else if (!usesYou) {
    issues.push("⚠️ Не использует обращение к читателю - снижает вовлеченность");
    overallScore -= 10;
  }
  
  // Questions (good for engagement)
  if (hasQuestions && questionsCount >= 2) {
    strengths.push(`✅ Содержит вопросы (${questionsCount}) - вовлекает читателя`);
    overallScore += 5;
  } else if (!hasQuestions) {
    issues.push("⚠️ Нет вопросов - упущена возможность вовлечь читателя");
    overallScore -= 5;
  }
  
  // Sentence length (should be varied)
  if (avgSentenceLength > 20) {
    issues.push(`⚠️ Слишком длинные предложения (средняя длина: ${avgSentenceLength.toFixed(1)} слов)`);
    overallScore -= 5;
  } else if (avgSentenceLength >= 12 && avgSentenceLength <= 18) {
    strengths.push(`✅ Оптимальная длина предложений (${avgSentenceLength.toFixed(1)} слов)`);
    overallScore += 5;
  }
  
  if (longSentences > sentences.length * 0.3) {
    issues.push(`⚠️ Слишком много длинных предложений (${longSentences} из ${sentences.length})`);
    overallScore -= 5;
  }
  
  // Empathy
  if (empathyWordsFound.length >= 3) {
    strengths.push(`✅ Проявляет эмпатию (${empathyWordsFound.length} упоминаний)`);
    overallScore += 10;
  } else if (empathyWordsFound.length === 0) {
    issues.push("⚠️ Нет проявления эмпатии - не показывает понимание проблем читателя");
    overallScore -= 10;
  }
  
  if (problemAcknowledgment) {
    strengths.push("✅ Признает проблемы читателя");
    overallScore += 5;
  }
  
  // Action-oriented
  if (imperativeCount >= 2) {
    strengths.push(`✅ Действенный тон (${imperativeCount} призывов к действию)`);
    overallScore += 5;
  } else if (imperativeCount === 0) {
    issues.push("⚠️ Нет призывов к действию - пассивный тон");
    overallScore -= 5;
  }
  
  // Positivity balance
  if (positivityRatio >= 0.4 && positivityRatio <= 0.6) {
    strengths.push(`✅ Сбалансированный тон (позитивность: ${(positivityRatio * 100).toFixed(0)}%)`);
    overallScore += 5;
  } else if (positivityRatio < 0.3) {
    issues.push("⚠️ Слишком негативный тон - может демотивировать");
    overallScore -= 10;
  } else if (positivityRatio > 0.7) {
    issues.push("⚠️ Слишком позитивный тон - может показаться неискренним");
    overallScore -= 5;
  }
  
  // Tone balance
  if (toneBalance === "balanced") {
    strengths.push("✅ Сбалансированный тон (профессиональный + дружелюбный)");
    overallScore += 5;
  } else if (toneBalance === "professional") {
    issues.push("⚠️ Слишком профессиональный тон - может быть сухим");
    overallScore -= 5;
  } else {
    issues.push("⚠️ Слишком дружелюбный тон - может показаться непрофессиональным");
    overallScore -= 5;
  }
  
  overallScore = Math.max(0, Math.min(100, overallScore));
  
  return {
    title,
    formality,
    formalityScore,
    usesYou,
    usesWe,
    usesI,
    personalPronounsCount,
    hasQuestions,
    questionsCount,
    hasDirectAddress,
    avgSentenceLength,
    longSentences,
    shortSentences,
    empathyWords: empathyWordsFound,
    problemAcknowledgment,
    actionWords: actionWordsFound,
    imperativeCount,
    positiveWords: positiveWordsFound,
    negativeWords: negativeWordsFound,
    positivityRatio,
    professionalTerms: professionalTermsFound,
    friendlyTerms: friendlyTermsFound,
    toneBalance,
    issues,
    strengths,
    overallScore
  };
}

async function runToneOfVoiceAnalysis() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(10).exec();
  
  console.log("=".repeat(100));
  console.log("АНАЛИЗ TONE OF VOICE (ТОНА ГОЛОСА) В СТАТЬЯХ");
  console.log("=".repeat(100));
  
  const analyses: ToneOfVoiceAnalysis[] = [];
  
  items.forEach((item, idx) => {
    if (!item.content) return;
    
    const analysis = analyzeToneOfVoice(item.content, item.title);
    analyses.push(analysis);
    
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`СТАТЬЯ ${idx + 1}: ${item.title}`);
    console.log("=".repeat(100));
    
    console.log(`\n📊 ОБЩАЯ ОЦЕНКА TONE OF VOICE: ${analysis.overallScore}/100`);
    if (analysis.overallScore >= 80) {
      console.log("   ✅ ОТЛИЧНО: Тон голоса соответствует требованиям");
    } else if (analysis.overallScore >= 60) {
      console.log("   ⚠️  ХОРОШО: Есть место для улучшения");
    } else if (analysis.overallScore >= 40) {
      console.log("   ⚠️  СРЕДНЕ: Нужны значительные улучшения");
    } else {
      console.log("   ❌ ПЛОХО: Тон голоса не соответствует требованиям");
    }
    
    console.log(`\n📝 ФОРМАЛЬНОСТЬ:`);
    console.log(`   Уровень: ${analysis.formality === "formal" ? "Формальный" : analysis.formality === "casual" ? "Неформальный" : "Полуформальный"} (${analysis.formalityScore}/100)`);
    
    console.log(`\n👤 ОБРАЩЕНИЕ К ЧИТАТЕЛЮ:`);
    console.log(`   Использует "вы": ${analysis.usesYou ? `✅ Да (${(item.content.match(/\b(вы|вас|вам|вами|ваш|ваша|ваше|ваши)\b/gi) || []).length} раз)` : "❌ Нет"}`);
    console.log(`   Использует "мы": ${analysis.usesWe ? `✅ Да (${(item.content.match(/\b(мы|нас|нам|нами|наш|наша|наше|наши)\b/gi) || []).length} раз)` : "❌ Нет"}`);
    console.log(`   Использует "я": ${analysis.usesI ? `⚠️ Да (${(item.content.match(/\b(я|меня|мне|мной|мой|моя|мое|мои)\b/gi) || []).length} раз)` : "✅ Нет"}`);
    console.log(`   Прямое обращение: ${analysis.hasDirectAddress ? "✅ Да" : "❌ Нет"}`);
    
    console.log(`\n❓ ВОВЛЕЧЕННОСТЬ:`);
    console.log(`   Вопросы: ${analysis.hasQuestions ? `✅ Да (${analysis.questionsCount})` : "❌ Нет"}`);
    
    console.log(`\n📏 ЧИТАЕМОСТЬ:`);
    console.log(`   Средняя длина предложения: ${analysis.avgSentenceLength.toFixed(1)} слов`);
    console.log(`   Длинные предложения (>25 слов): ${analysis.longSentences}`);
    console.log(`   Короткие предложения (<10 слов): ${analysis.shortSentences}`);
    
    console.log(`\n💙 ЭМПАТИЯ:`);
    if (analysis.empathyWords.length > 0) {
      console.log(`   ✅ Проявляет эмпатию: ${analysis.empathyWords.slice(0, 5).join(", ")}`);
    } else {
      console.log(`   ❌ Нет проявления эмпатии`);
    }
    console.log(`   Признает проблемы: ${analysis.problemAcknowledgment ? "✅ Да" : "❌ Нет"}`);
    
    console.log(`\n🎯 ДЕЙСТВЕННОСТЬ:`);
    if (analysis.actionWords.length > 0) {
      console.log(`   ✅ Призывы к действию: ${analysis.actionWords.slice(0, 5).join(", ")}`);
    } else {
      console.log(`   ❌ Нет призывов к действию`);
    }
    
    console.log(`\n⚖️ БАЛАНС ПОЗИТИВНОСТИ:`);
    console.log(`   Позитивные слова: ${analysis.positiveWords.length}`);
    console.log(`   Негативные слова: ${analysis.negativeWords.length}`);
    console.log(`   Соотношение: ${(analysis.positivityRatio * 100).toFixed(0)}% позитивных`);
    
    console.log(`\n🎭 ТОН:`);
    console.log(`   Профессиональные термины: ${analysis.professionalTerms.length}`);
    console.log(`   Дружелюбные термины: ${analysis.friendlyTerms.length}`);
    console.log(`   Баланс: ${analysis.toneBalance === "professional" ? "Профессиональный" : analysis.toneBalance === "friendly" ? "Дружелюбный" : "Сбалансированный"}`);
    
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
  
  const avgScore = analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length;
  const avgFormality = analyses.reduce((sum, a) => sum + a.formalityScore, 0) / analyses.length;
  const withYou = analyses.filter(a => a.usesYou).length;
  const withQuestions = analyses.filter(a => a.hasQuestions).length;
  const withEmpathy = analyses.filter(a => a.empathyWords.length >= 3).length;
  const balancedTone = analyses.filter(a => a.toneBalance === "balanced").length;
  const semiFormal = analyses.filter(a => a.formality === "semi-formal").length;
  
  console.log(`\n📊 Средняя оценка tone of voice: ${avgScore.toFixed(1)}/100`);
  console.log(`📊 Средняя формальность: ${avgFormality.toFixed(1)}/100`);
  console.log(`📊 Статей с обращением "вы": ${withYou}/${analyses.length}`);
  console.log(`📊 Статей с вопросами: ${withQuestions}/${analyses.length}`);
  console.log(`📊 Статей с эмпатией: ${withEmpathy}/${analyses.length}`);
  console.log(`📊 Статей со сбалансированным тоном: ${balancedTone}/${analyses.length}`);
  console.log(`📊 Статей с полуформальным тоном: ${semiFormal}/${analyses.length}`);
  
  await mongoose.disconnect();
}

runToneOfVoiceAnalysis();

