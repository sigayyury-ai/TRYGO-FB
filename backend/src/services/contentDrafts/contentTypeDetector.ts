// Detect content type based on idea title, description, and category
import type { SeoBacklogIdeaDoc } from "../../db/models/SeoBacklogIdea.js";

export type ContentTemplateType =
  | "onboarding"
  | "feature"
  | "pain_point"
  | "trigger"
  | "solution"
  | "benefit"
  | "tutorial"
  | "comparison"
  | "case_study"
  | "faq"
  | "info"
  | "general";

export interface ContentTypeDetection {
  type: ContentTemplateType;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export function detectContentTemplateType(idea: SeoBacklogIdeaDoc): ContentTypeDetection {
  const text = `${idea.title} ${idea.description}`.toLowerCase();
  const category = idea.category;

  // High confidence detections based on explicit keywords
  
  // Tutorial/Guide - highest priority (before trigger to avoid false positives)
  // "how to" articles should be recognized as tutorials, not triggers
  if (text.match(/tutorial|туториал|руководство|инструкция|как сделать|how to|guide|гайд|step by step|пошагов|from scratch|с нуля|complete guide|полное руководство|create.*strategy|build.*strategy|make.*strategy/i)) {
    return {
      type: "tutorial",
      confidence: "high",
      reasoning: "Tutorial/guide keywords detected (how to, step by step, from scratch, etc.)"
    };
  }
  
  // Onboarding - high priority
  if (text.match(/onboarding|онбординг|начало работы|getting started|first steps|quick start|быстрый старт|как начать/i)) {
    return {
      type: "onboarding",
      confidence: "high",
      reasoning: "Detected onboarding keywords in title/description"
    };
  }

  // Trigger - specific pattern (only if category is explicitly "trigger" or very specific trigger phrases)
  // Avoid matching "how to" articles that might contain word "trigger" in context
  if (category === "trigger" || text.match(/когда появляется|когда возникает|момент когда|recognize.*trigger|address.*trigger|identify.*trigger/i)) {
    // Double-check: if it's a "how to" article, don't classify as trigger
    if (!text.match(/how to|tutorial|guide|step by step|from scratch/i)) {
      return {
        type: "trigger",
        confidence: "high",
        reasoning: "Category is 'trigger' or specific trigger recognition keywords detected"
      };
    }
  }

  // Pain point - specific pattern
  if (category === "pain" || text.match(/боль|pain|проблема|трудность|вызов|challenge|problem|issue/i)) {
    return {
      type: "pain_point",
      confidence: "high",
      reasoning: "Category is 'pain' or pain keywords detected"
    };
  }

  // Feature - specific pattern
  if (category === "feature" || text.match(/feature|фича|функция|возможность|как работает|how.*works|что такое.*функция/i)) {
    return {
      type: "feature",
      confidence: "high",
      reasoning: "Category is 'feature' or feature keywords detected"
    };
  }

  // FAQ
  if (category === "faq" || text.match(/faq|вопрос|question|ответ|часто задаваем/i)) {
    return {
      type: "faq",
      confidence: "high",
      reasoning: "Category is 'faq' or FAQ keywords detected"
    };
  }

  // Solution/Service
  if (text.match(/solution|решение|сервис|service|услуга|помощь|как решить|способ/i)) {
    return {
      type: "solution",
      confidence: "medium",
      reasoning: "Solution/service keywords detected"
    };
  }

  // Benefit
  if (category === "benefit" || text.match(/benefit|преимущество|выгода|польза|advantage/i)) {
    return {
      type: "benefit",
      confidence: "medium",
      reasoning: "Category is 'benefit' or benefit keywords detected"
    };
  }

  // Tutorial/Guide - already handled above with higher priority, but keep as fallback
  // (This should rarely be reached due to earlier check)

  // Comparison
  if (text.match(/comparison|сравнение|vs|или|лучше|лучший|compare/i)) {
    return {
      type: "comparison",
      confidence: "medium",
      reasoning: "Comparison keywords detected"
    };
  }

  // Case study
  if (text.match(/case study|кейс|пример|история успеха|success story/i)) {
    return {
      type: "case_study",
      confidence: "medium",
      reasoning: "Case study keywords detected"
    };
  }

  // Info/Educational - fallback for info, goal categories
  if (category === "info" || category === "goal") {
    return {
      type: "info",
      confidence: "medium",
      reasoning: `Category is '${category}', treating as informational content`
    };
  }

  // Default fallback
  return {
    type: "general",
    confidence: "low",
    reasoning: "No specific type detected, using general template"
  };
}

