# JSON Schema Usage Examples / Приклади використання JSON Schema

## Загальна концепція

Створено універсальну систему для роботи з JSON Schema в ChatGPT API. Замість того, щоб кожен раз описувати формат відповіді в промптах, тепер використовується спеціальна функція `generateMessageWithJsonSchema`, яка автоматично застосовує відповідну схему на основі типу запиту.

## Структура

1. **Enum JsonSchemaType** (`src/types/ChatGPT/JsonSchemaTypes.ts`) - містить всі типи схем
2. **getJsonSchemaForType** (`src/utils/aIntelligence/jsonSchemas.ts`) - функція, що повертає конфігурацію схеми для конкретного типу
3. **generateMessageWithJsonSchema** (`src/services/ai/ChatGPTService.ts`) - універсальний метод в ChatGPTService

## Приклади використання

### 1. createProjectHypotheses

```typescript
import chatGPTService from '../services/ai/ChatGPTService';
import { JsonSchemaType } from '../types/ChatGPT/JsonSchemaTypes';
import { prompts } from '../constants/aIntelligence/prompts';

const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PROJECT_HYPOTHESES,
    prompts.createProjectHypotheses(isFirstProject),
    20000
);

// Результат: { hypotheses: [{ title: string, description: string }] }
```

### 2. createHypothesesCoreWithPersonProfiles

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES,
    prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart),
    20000
);

// Результат: { response: { problems, customerSegments, uniqueProposition, ... } }
```

### 3. createPersonProfile

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PERSON_PROFILE,
    prompts.createPersonProfile(projectHypothesis, customerSegment),
    20000
);

// Результат: { response: { name, description, platforms, age, ... } }
```

### 4. createLeanCanvasMessage (з опцією wantToChangeInfo)

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.LEAN_CANVAS_MESSAGE,
    prompts.createLeanCanvasMessage(message, hypothesesCore, wantToChangeInfo),
    20000,
    { wantToChangeInfo: true }
);

// Якщо wantToChangeInfo: true
// Результат: { response: { message, problems, customerSegments, uniqueProposition, ... } }

// Якщо wantToChangeInfo: false
// Результат: { response: { message } }
```

### 5. createPersonProfileMessage

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PERSON_PROFILE_MESSAGE,
    prompts.createPersonProfileMessage(message, customerSegment, personProfile, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
```

### 6. createHypothesesMarketResearch

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_MARKET_RESEARCH,
    prompts.createHypothesesMarketResearch(projectHypothesis, promptPart),
    20000
);

// Результат: { response: { summary: string } }
```

### 7. createMarketResearchMessage

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.MARKET_RESEARCH_MESSAGE,
    prompts.createMarketResearchMessage(message, hypothesesMarketResearch, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
```

### 8. createHypothesesValidation

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_VALIDATION,
    prompts.createHypothesesValidation(projectHypothesis, promptPart),
    20000
);

// Результат: { response: { validationChannels, customerInterviewQuestions } }
```

### 9. createValidationInsightsCustomerInterviews

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS,
    prompts.createValidationInsightsCustomerInterviews(customerInterview),
    20000
);

// Результат: { response: { insightsCustomerInterviews, summaryInterview: { goals, pains, hypotheses, toneOfVoice } } }
```

### 10. createValidationMessage (з опцією hasSummaryInterview)

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.VALIDATION_MESSAGE,
    prompts.createValidationMessage(message, hypothesesValidation, wantToChangeInfo),
    20000,
    { 
        wantToChangeInfo, 
        hasSummaryInterview: hypothesesValidation.summaryInterview ? true : false 
    }
);
```

### 11. createHypothesesPacking

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_PACKING,
    prompts.createHypothesesPacking(projectHypothesis, promptPart),
    20000
);

// Результат: { response: { summary: string } }
```

### 12. createPackingMessage

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PACKING_MESSAGE,
    prompts.createPackingMessage(message, packing, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
```

### 13. createHypothesesGtm

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_GTM,
    prompts.createHypothesesGtm(projectHypothesis, promptPart),
    20000
);

// Результат: { response: { stageValidate, stageBuildAudience, stageScale } }
```

### 14. createGtmMessage

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GTM_MESSAGE,
    prompts.createGtmMessage(message, hypothesesGtm, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
```

### 15. createGtmDetailedChannelMessage

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GTM_DETAILED_CHANNEL_MESSAGE,
    prompts.createGtmDetailedChannelMessage(message, hypothesesGtmDetailedChannel, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
```

### 16. createHypothesesGtmDetailedChannel

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_GTM_DETAILED_CHANNEL,
    prompts.createHypothesesGtmDetailedChannel(projectHypothesis, customerSegment, channel, promptPart),
    20000
);

// Результат: { response: { channelStrategy, channelPreparationTasks, tools, resources, contentIdeas, actionPlan, metricsAndKpis } }
```

### 17. generateContentIdea

```typescript
const result = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GENERATE_CONTENT_IDEA,
    prompts.generateContentIdea(hypothesesGtmDetailedChannel),
    20000
);

// Результат: { response: { title: string, text: string } }
```

## Переваги нового підходу

1. **Чистіші промпти** - промпти тепер містять тільки інструкції, без опису форматів
2. **Строга типізація** - JSON Schema гарантує, що ChatGPT поверне дані в очікуваному форматі
3. **Централізоване управління** - всі схеми в одному місці, легко підтримувати
4. **Гнучкість** - можна легко додавати нові схеми або модифікувати існуючі
5. **Конфігурабельність** - підтримка додаткових опцій (wantToChangeInfo, hasSummaryInterview)

## Як додати нову схему

1. Додайте новий тип в `JsonSchemaType` enum
2. Додайте схему в об'єкт `schemas` в функції `getJsonSchemaForType`
3. Очистіть відповідний промпт від описів формату
4. Використовуйте `generateMessageWithJsonSchema` з новим типом

