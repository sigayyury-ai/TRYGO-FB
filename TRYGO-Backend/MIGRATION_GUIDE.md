# Migration Guide / Інструкція з міграції

## Загальні принципи міграції

Цей гайд допоможе вам перенести існуючі виклики ChatGPT API на нову систему з JSON Schema.

## Старий підхід

```typescript
// Старий спосіб
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createProjectHypotheses(isFirstProject),
    5000
);
const response = await parseJsonFromResponse(content);
```

## Новий підхід

```typescript
// Новий спосіб
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PROJECT_HYPOTHESES,
    prompts.createProjectHypotheses(isFirstProject),
    20000
);
```

## Покрокова міграція для кожної функції

### 1. Міграція createProjectHypotheses

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createProjectHypotheses(isFirstProject),
    5000
);
const response = await parseJsonFromResponse(content);
return response; // повертає масив гіпотез
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PROJECT_HYPOTHESES,
    prompts.createProjectHypotheses(isFirstProject),
    20000
);
return response.hypotheses; // тепер потрібно отримати hypotheses з response
```

### 2. Міграція createHypothesesCoreWithPersonProfiles

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES,
    prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart),
    20000
);
return response.response;
```

### 3. Міграція createPersonProfile

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createPersonProfile(projectHypothesis, customerSegment),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PERSON_PROFILE,
    prompts.createPersonProfile(projectHypothesis, customerSegment),
    20000
);
return response.response;
```

### 4. Міграція createLeanCanvasMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createLeanCanvasMessage(message, hypothesesCore, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.LEAN_CANVAS_MESSAGE,
    prompts.createLeanCanvasMessage(message, hypothesesCore, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 5. Міграція createPersonProfileMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createPersonProfileMessage(message, customerSegment, personProfile, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PERSON_PROFILE_MESSAGE,
    prompts.createPersonProfileMessage(message, customerSegment, personProfile, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 6. Міграція createHypothesesMarketResearch

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesMarketResearch(projectHypothesis, promptPart),
    15000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_MARKET_RESEARCH,
    prompts.createHypothesesMarketResearch(projectHypothesis, promptPart),
    20000
);
return response.response;
```

### 7. Міграція createMarketResearchMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createMarketResearchMessage(message, hypothesesMarketResearch, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.MARKET_RESEARCH_MESSAGE,
    prompts.createMarketResearchMessage(message, hypothesesMarketResearch, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 8. Міграція createHypothesesValidation

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesValidation(projectHypothesis, promptPart),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_VALIDATION,
    prompts.createHypothesesValidation(projectHypothesis, promptPart),
    20000
);
return response.response;
```

### 9. Міграція createValidationInsightsCustomerInterviews

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createValidationInsightsCustomerInterviews(customerInterview),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.VALIDATION_INSIGHTS_CUSTOMER_INTERVIEWS,
    prompts.createValidationInsightsCustomerInterviews(customerInterview),
    20000
);
return response.response;
```

### 10. Міграція createValidationMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createValidationMessage(message, hypothesesValidation, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.VALIDATION_MESSAGE,
    prompts.createValidationMessage(message, hypothesesValidation, wantToChangeInfo),
    20000,
    { 
        wantToChangeInfo,
        hasSummaryInterview: hypothesesValidation.summaryInterview ? true : false
    }
);
return response.response;
```

### 11. Міграція createHypothesesPacking

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesPacking(projectHypothesis, promptPart),
    15000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_PACKING,
    prompts.createHypothesesPacking(projectHypothesis, promptPart),
    20000
);
return response.response;
```

### 12. Міграція createPackingMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createPackingMessage(message, packing, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.PACKING_MESSAGE,
    prompts.createPackingMessage(message, packing, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 13. Міграція createHypothesesGtm

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesGtm(projectHypothesis, promptPart),
    15000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_GTM,
    prompts.createHypothesesGtm(projectHypothesis, promptPart),
    20000
);
return response.response;
```

### 14. Міграція createGtmMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createGtmMessage(message, hypothesesGtm, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GTM_MESSAGE,
    prompts.createGtmMessage(message, hypothesesGtm, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 15. Міграція createGtmDetailedChannelMessage

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createGtmDetailedChannelMessage(message, hypothesesGtmDetailedChannel, wantToChangeInfo),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GTM_DETAILED_CHANNEL_MESSAGE,
    prompts.createGtmDetailedChannelMessage(message, hypothesesGtmDetailedChannel, wantToChangeInfo),
    20000,
    { wantToChangeInfo }
);
return response.response;
```

### 16. Міграція createHypothesesGtmDetailedChannel

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.createHypothesesGtmDetailedChannel(projectHypothesis, customerSegment, channel, promptPart),
    15000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.HYPOTHESES_GTM_DETAILED_CHANNEL,
    prompts.createHypothesesGtmDetailedChannel(projectHypothesis, customerSegment, channel, promptPart),
    20000
);
return response.response;
```

### 17. Міграція generateContentIdea

**Було:**
```typescript
const content = await chatGPTService.chatGPTRequestBasic(
    prompts.generateContentIdea(hypothesesGtmDetailedChannel),
    10000
);
const parsed = await parseJsonFromResponse(content);
return parsed.response;
```

**Стало:**
```typescript
const response = await chatGPTService.generateMessageWithJsonSchema(
    JsonSchemaType.GENERATE_CONTENT_IDEA,
    prompts.generateContentIdea(hypothesesGtmDetailedChannel),
    20000
);
return response.response;
```

## Загальний чеклист для міграції

1. ✅ Замініть виклик `chatGPTRequestBasic` на `generateMessageWithJsonSchema`
2. ✅ Додайте відповідний `JsonSchemaType` як перший параметр
3. ✅ Видаліть виклик `parseJsonFromResponse` (він більше не потрібен)
4. ✅ Якщо функція підтримує `wantToChangeInfo` або інші опції, передайте їх в config
5. ✅ Переконайтеся, що ви отримуєте правильне поле з response (зазвичай `response.response` або `response.hypotheses`)
6. ✅ Видаліть невикористані імпорти `parseJsonFromResponse`
7. ✅ Додайте імпорт `JsonSchemaType`

## Імпорти

**Додайте:**
```typescript
import { JsonSchemaType } from '../types/ChatGPT/JsonSchemaTypes';
```

**Видаліть (якщо більше не використовується):**
```typescript
import { parseJsonFromResponse } from '../utils'; // якщо більше не потрібен
```

## Важливі зміни

1. **maxTokens збільшено до 20000** - для більшості функцій рекомендується використовувати 20000 токенів
2. **Структура відповіді** - майже всі відповіді тепер мають структуру `{ response: { ... } }` або `{ hypotheses: [...] }`
3. **Конфігурація** - деякі функції тепер приймають об'єкт конфігурації з додатковими опціями

## Приклад міграції файлу сервісу

**Було (HypothesesCoreService.ts):**
```typescript
async createHypothesesCore(projectHypothesis: IProjectHypothesis, promptPart?: string) {
    const content = await chatGPTService.chatGPTRequestBasic(
        prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart),
        10000
    );
    const parsed = await parseJsonFromResponse(content);
    return parsed.response;
}
```

**Стало:**
```typescript
async createHypothesesCore(projectHypothesis: IProjectHypothesis, promptPart?: string) {
    const response = await chatGPTService.generateMessageWithJsonSchema(
        JsonSchemaType.HYPOTHESES_CORE_WITH_PERSON_PROFILES,
        prompts.createHypothesesCoreWithPersonProfiles(projectHypothesis, promptPart),
        20000
    );
    return response.response;
}
```

## Тестування після міграції

1. Перевірте, що відповідь має правильну структуру
2. Переконайтеся, що всі обов'язкові поля присутні
3. Перевірте типи даних у відповіді
4. Протестуйте з різними значеннями `wantToChangeInfo` (якщо застосовно)

