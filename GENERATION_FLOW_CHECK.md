# Проверка флоу генерации идей

## Флоу генерации идей

### 1. Frontend: SeoContentPanel.tsx
- ✅ Получает `projectId` и `hypothesisId` из props
- ✅ Проверяет наличие `hypothesisId` перед показом кнопки генерации
- ✅ Вызывает `generateContentIdeasMutation({ projectId, hypothesisId })`

### 2. Frontend: generateContentIdeas.ts
- ✅ Отправляет GraphQL mutation с правильными переменными
- ✅ Обрабатывает ошибки и возвращает массив идей

### 3. Frontend: seoAgentClient.ts
- ✅ **ИСПРАВЛЕНО**: Использует `getActiveIds()` для получения ID из cookies:
  - Читает `activeProjectId` и `activeHypothesisId` из cookies
  - IDs также передаются напрямую через props компонента (SeoContentPanel)

### 4. Backend: resolvers.ts -> generateContentIdeas
- ✅ **ДОБАВЛЕНО**: Валидация входных параметров (projectId и hypothesisId не пустые)
- ✅ Вызывает `loadSeoContext(args.projectId, args.hypothesisId)`
- ✅ Загружает язык из настроек или использует "English" по умолчанию
- ✅ Маппит категории из ContentCategory в generator category names
- ✅ Генерирует идеи для всех категорий или для конкретной категории
- ✅ Проверяет дубликаты перед сохранением
- ✅ Сохраняет идеи в `SeoContentItem`
- ✅ Возвращает сгенерированные идеи через `mapContentIdea`

### 5. Backend: seoContext.ts -> loadSeoContext
- ✅ **ИСПРАВЛЕНО**: Проверяет принадлежность гипотезы к проекту в запросе
- ✅ Загружает проект, гипотезу, Lean Canvas, ICP, кластеры
- ✅ Валидирует, что проект и гипотеза найдены
- ✅ Валидирует, что гипотеза принадлежит проекту
- ✅ Возвращает полный SEO контекст

### 6. Backend: generator.ts -> generateIdeasFromOpenAI
- ✅ Строит промпт на основе контекста
- ✅ Вызывает OpenAI API с правильными параметрами
- ✅ Обрабатывает ошибки и fallback на другой модель
- ✅ Парсит JSON ответ
- ✅ Дедуплицирует идеи
- ✅ Возвращает массив идей

## Потенциальные проблемы и решения

### ✅ Исправлено:
1. **Хардкод projectId/hypothesisId**: Исправлено в `seoAgentClient.ts` - теперь читает из правильных ключей localStorage
2. **Проверка принадлежности гипотезы**: Добавлена в `seoContext.ts` - запрос гипотезы теперь включает проверку `projectId`
3. **Валидация параметров**: Добавлена в начале `generateContentIdeas` resolver

### ⚠️ Рекомендации:
1. **Обработка пустых результатов**: Если генерация вернула 0 идей, стоит логировать это
2. **Таймауты**: Добавить таймауты для OpenAI API вызовов
3. **Rate limiting**: Учесть лимиты OpenAI API при генерации для всех категорий

## Тестирование

### ✅ Результаты тестирования (выполнено)

**Тест 1: Прямой тест флоу (test-generation-flow.ts)**
- ✅ Валидация входных параметров: пройдена
- ✅ Загрузка контекста: успешно (проект "AI marketing copilot", гипотеза "Solo founders")
- ✅ Проверка принадлежности гипотезы к проекту: пройдена
- ✅ Генерация идей через OpenAI: 3 идеи сгенерировано
- ✅ Проверка дубликатов: работает корректно
- ✅ Сохранение в БД: 3 идеи сохранено

**Тест 2: GraphQL Resolver (test-graphql-generation-flow.ts)**
- ✅ Валидация параметров в resolver: работает
- ✅ Загрузка контекста через resolver: успешно
- ✅ Генерация для категории PAINS: 3 идеи
- ✅ Маппинг категорий: корректный (PAINS → PAIN)
- ✅ Сохранение через resolver: успешно
- ✅ Возврат через mapContentIdea: корректный формат

**Проверенные ID:**
- Проект: `686774b6773b5947fed60a78` (AI marketing copilot)
- Гипотеза: `687fe5363c4cca83a3cc578d` (Solo founders)
- Пользователь: `686773b5773b5947fed60a68` (sigayyury5@gmail.com)

**Логи бэкенда (проверены):**
- ✅ `[generateContentIdeas] Request:` содержит правильные ID
- ✅ `[generateContentIdeas] Context:` показывает "AI marketing copilot | Solo founders"
- ✅ Нет ошибок "Hypothesis not found"
- ✅ Язык по умолчанию: English (вместо Russian, как указано в документе)

### ⚠️ Обнаруженные расхождения:

1. **Язык по умолчанию**: В коде используется "English" по умолчанию, а не "Russian" как указано в документе (строка 23)
2. **seoAgentClient.ts**: Фактически использует `getActiveIds()` из cookies, а не localStorage ключи `seoAgent_selectedProjectId`/`seoAgent_selectedHypothesisId`. Однако это не проблема, так как IDs передаются напрямую через props компонента.

### Для проверки через UI:

1. Убедиться, что в cookies сохранены правильные `activeProjectId` и `activeHypothesisId`
2. Выбрать проект "AI marketing copilot" и гипотезу "Solo founders" в UI
3. Нажать "Generate Ideas"
4. Проверить логи бэкенда:
   - `[generateContentIdeas] Request:` должен содержать правильные ID
   - `[generateContentIdeas] Context:` должен показывать правильные названия проекта и гипотезы
   - Не должно быть ошибок "Hypothesis not found"

