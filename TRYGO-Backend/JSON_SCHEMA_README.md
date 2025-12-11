# JSON Schema System for ChatGPT API

## Огляд / Overview

Реалізовано універсальну систему для роботи з JSON Schema в ChatGPT API. Система забезпечує строгу типізацію відповідей від AI та централізоване управління схемами даних.

## Що було створено

### 1. Enum для типів схем
📁 `src/types/ChatGPT/JsonSchemaTypes.ts`

Містить 17 типів схем для різних операцій:
- `PROJECT_HYPOTHESES` - генерація гіпотез проекту
- `HYPOTHESES_CORE_WITH_PERSON_PROFILES` - створення ядра гіпотез з профілями персон
- `PERSON_PROFILE` - створення профілю персони
- `LEAN_CANVAS_MESSAGE` - повідомлення для Lean Canvas
- `PERSON_PROFILE_MESSAGE` - повідомлення для профілю персони
- `HYPOTHESES_MARKET_RESEARCH` - маркетингове дослідження
- `MARKET_RESEARCH_MESSAGE` - повідомлення для маркетингового дослідження
- `HYPOTHESES_VALIDATION` - валідація гіпотез
- `VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS` - аналіз інтерв'ю з клієнтами
- `VALIDATION_MESSAGE` - повідомлення для валідації
- `HYPOTHESES_PACKING` - пакування продукту
- `PACKING_MESSAGE` - повідомлення для пакування
- `HYPOTHESES_GTM` - Go-to-Market стратегія
- `GTM_MESSAGE` - повідомлення для GTM
- `GTM_DETAILED_CHANNEL_MESSAGE` - повідомлення для детального каналу GTM
- `HYPOTHESES_GTM_DETAILED_CHANNEL` - детальний канал GTM
- `GENERATE_CONTENT_IDEA` - генерація ідей контенту

### 2. Функція генерації схем
📁 `src/utils/aIntelligence/jsonSchemas.ts`

Функція `getJsonSchemaForType()` містить:
- JSON Schema для кожного типу
- Підтримку конфігурації (wantToChangeInfo, hasSummaryInterview)
- Динамічну генерацію схем на основі параметрів
- Використання $defs для переповторюваних об'єктів

### 3. Універсальний метод в ChatGPTService
📁 `src/services/ai/ChatGPTService.ts`

Метод `generateMessageWithJsonSchema()`:
```typescript
async generateMessageWithJsonSchema(
    schemaType: JsonSchemaType,
    prompt: string,
    maxTokens: number = 20000,
    config?: {
        wantToChangeInfo?: boolean;
        hasSummaryInterview?: boolean;
    }
): Promise<any>
```

### 4. Оновлені промпти
📁 `src/constants/aIntelligence/prompts.ts`

Видалено всі описи форматів JSON з промптів. Тепер промпти містять тільки:
- Інструкції для AI
- Контекстну інформацію
- Вимоги до контенту

Форматування відповідей повністю контролюється через JSON Schema.

## Архітектура

```
┌─────────────────────────┐
│   Service/Resolver      │
│  (викликає генерацію)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  chatGPTService.generateMessageWithJsonSchema()  │
│  • Приймає JsonSchemaType               │
│  • Приймає prompt                       │
│  • Приймає config (опціонально)         │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  getJsonSchemaForType()             │
│  • Вибирає схему по типу            │
│  • Налаштовує схему по config       │
│  • Повертає готову конфігурацію     │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  OpenAI API (responses.create)      │
│  • Використовує json_schema format  │
│  • Strict mode enabled              │
│  • Гарантує структуру відповіді     │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Structured Response                │
│  • Повністю типізована відповідь    │
│  • Відповідає схемі                 │
│  • Готова до використання           │
└─────────────────────────────────────┘
```

## Переваги

### 1. 🎯 Строга типізація
- OpenAI гарантує відповідність схемі
- Немає неочікуваних форматів
- Автоматична валідація на стороні API

### 2. 🧹 Чисті промпти
- Промпти містять тільки інструкції
- Немає дублювання структур
- Легше читати та підтримувати

### 3. 🏗️ Централізоване управління
- Всі схеми в одному місці
- Легко змінювати формати
- Один раз змінив - працює скрізь

### 4. 🔧 Гнучкість
- Підтримка конфігурації
- Динамічні схеми
- Можливість розширення

### 5. 🚀 Продуктивність
- Збільшено maxTokens до 20000
- Оптимізовані схеми
- Ефективне використання API

### 6. 🛡️ Надійність
- Менше помилок парсингу
- Гарантована структура
- Легше дебажити

## Використання

### Базовий приклад
```typescript
import chatGPTService from '../services/ai/ChatGPTService';
import { JsonSchemaType } from '../types/ChatGPT/JsonSchemaTypes';
import { prompts } from '../constants/aIntelligence/prompts';

const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PROJECT_HYPOTHESES,
    prompts.createProjectHypotheses(true),
    20000
);

console.log(result.hypotheses); // Array of hypotheses
```

### З конфігурацією
```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.LEAN_CANVAS_MESSAGE,
    prompts.createLeanCanvasMessage(message, core, true),
    20000,
    { wantToChangeInfo: true }
);

console.log(result.response.message);
console.log(result.response.problems);
```

## Документація

- 📖 [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Детальні приклади використання для всіх 17 функцій
- 🔄 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Покрокова інструкція з міграції існуючого коду

## Структура файлів

```
src/
├── types/
│   └── ChatGPT/
│       └── JsonSchemaTypes.ts          # Enum з типами схем
├── utils/
│   └── aIntelligence/
│       └── jsonSchemas.ts              # Функція генерації схем
├── services/
│   └── ai/
│       └── ChatGPTService.ts           # Універсальний метод
└── constants/
    └── aIntelligence/
        └── prompts.ts                  # Оновлені промпти (без JSON описів)
```

## Технічні деталі

### JSON Schema Configuration
- **Model**: gpt-4.1
- **Format**: json_schema
- **Strict mode**: enabled
- **Temperature**: 1
- **Top P**: 1
- **Max tokens**: 20000 (за замовчуванням)

### Підтримувані конфігурації
```typescript
interface JsonSchemaConfig {
    wantToChangeInfo?: boolean;      // Чи змінювати існуючі дані
    hasSummaryInterview?: boolean;   // Чи є summary interview
}
```

## Майбутні покращення

- [ ] Додати TypeScript типи для кожної схеми
- [ ] Створити CLI для генерації нових схем
- [ ] Додати валідацію схем під час білду
- [ ] Імплементувати кешування схем
- [ ] Додати метрики використання схем

## Автор

Створено для aiLaunchKit Backend проекту

## Версія

v1.0.0 - Початковий реліз з 17 схемами

