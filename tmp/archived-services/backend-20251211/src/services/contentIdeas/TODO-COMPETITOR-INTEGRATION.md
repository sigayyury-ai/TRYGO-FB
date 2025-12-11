# Задача: Интеграция данных конкурентов в генератор идей контента

## Цель
Расширить контекст генератора идей контента через парсинг и анализ сайтов конкурентов из раздела Market Research.

## Текущее состояние
- Генератор идей использует контекст: Project, Hypothesis, ICP, Lean Canvas
- В системе есть раздел Market Research с данными о конкурентах
- Конкуренты содержат: name, url, description, pricing, slogans, leadMagnets, reviews, channels, socialLinks
- Парсинг сайтов конкурентов еще не настроен

## Что нужно сделать

### 1. Настроить парсинг сайтов конкурентов
- [ ] Создать сервис для парсинга сайтов конкурентов
- [ ] Извлекать контент-стратегию конкурентов:
  - Темы блогов и статей
  - Структура контента
  - Ключевые слова и SEO-стратегия
  - Типы контента (how-to, comparisons, case studies, etc.)
  - Lead magnets и CTA
  - Частота публикаций
- [ ] Сохранять распарсенные данные в БД (расширить модель Competitor)
- [ ] Настроить периодическое обновление данных

### 2. Интегрировать данные конкурентов в генератор
- [ ] Расширить `SeoContextSnapshot` для включения данных конкурентов
- [ ] Добавить секцию конкурентов в промпт генератора:
  ```
  COMPETITOR CONTEXT:
  - Competitor names and websites
  - Competitor content topics and strategies
  - Content gaps and opportunities
  - Competitive positioning insights
  ```
- [ ] Использовать данные конкурентов для генерации:
  - Comparison articles (e.g., "[Product] vs [Competitor]")
  - Differentiation content
  - Content ideas based on competitor gaps
  - Competitive positioning articles

### 3. Обновить промпты категорий
- [ ] Добавить инструкции по использованию данных конкурентов в каждой категории
- [ ] Для FEATURE: генерировать сравнения с конкурентами
- [ ] Для BENEFIT: использовать конкурентные преимущества
- [ ] Для INFO: учитывать контент-стратегии конкурентов

## Технические детали

### Модель данных конкурента (расширение)
```typescript
interface Competitor {
  id: string;
  name: string;
  url: string;
  description: string;
  // Существующие поля
  pricing: string[];
  slogans: string[];
  leadMagnets: string[];
  reviews: { positive: string[]; negative: string[] };
  channels: string[];
  socialLinks: SocialLink[];
  
  // Новые поля для парсинга
  parsedContent?: {
    blogTopics: string[];
    contentTypes: string[];
    keywords: string[];
    lastUpdated: Date;
    contentStrategy: {
      frequency: string;
      topics: string[];
      formats: string[];
    };
  };
}
```

### API для парсинга
- `POST /api/competitors/:id/parse` - запустить парсинг сайта конкурента
- `GET /api/competitors/:id/content` - получить распарсенные данные
- `POST /api/competitors/:id/refresh` - обновить данные

### Интеграция в генератор
```typescript
// В buildPrompt добавить:
const competitorSection = competitors.length > 0 ? `
COMPETITOR CONTEXT:
${competitors.map((c: any) => `
- ${c.name} (${c.url}):
  - Content topics: ${c.parsedContent?.blogTopics?.join(", ") || "Not parsed"}
  - Content strategy: ${c.parsedContent?.contentStrategy?.topics?.join(", ") || "Not parsed"}
  - Lead magnets: ${c.leadMagnets.join(", ")}
`).join("\n")}

Use competitor data to:
- Generate comparison articles
- Identify content gaps
- Create differentiation content
- Find opportunities for unique positioning
` : "";
```

## Приоритет
**P2** - Важная функция для улучшения качества генерируемых идей, но не блокирует текущую работу.

## Связанные файлы
- `/backend/src/services/contentIdeas/generator.ts` - генератор идей (TODO комментарий добавлен)
- `/TRYGO-Front/src/components/market-research/CompetitorDetails.tsx` - компонент конкурентов
- `/TRYGO-Backend/src/constants/aIntelligence/prompts.ts` - промпты для анализа конкурентов

## Заметки
- Парсинг должен быть уважительным к robots.txt и rate limits
- Рассмотреть использование готовых сервисов парсинга (например, ScraperAPI, Bright Data)
- Кэшировать результаты парсинга для снижения нагрузки
- Добавить обработку ошибок для недоступных сайтов






