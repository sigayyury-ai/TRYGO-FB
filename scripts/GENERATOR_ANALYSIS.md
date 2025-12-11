# Анализ возможностей генератора идей

## Текущий генератор идей

### Что может генерировать:

Генератор использует контекст проекта (Project, Hypothesis, ICP, Lean Canvas) и создает идеи на основе:

1. **PAIN** - статьи о проблемах клиентов
   - Требует: pains из ICP, problems из Lean Canvas
   - Формат: "Как решить проблему X" / "Проблема Y и как с ней справиться"
   - Примеры из списка: ❌ Нет прямых соответствий

2. **GOAL** - статьи о целях клиентов
   - Требует: goals из ICP
   - Формат: "Как достичь цели X"
   - Примеры из списка: ❌ Нет прямых соответствий

3. **TRIGGER** - статьи о триггерах решений
   - Требует: triggers из ICP, JTBD
   - Формат: "Когда и почему клиенты принимают решения"
   - Примеры из списка: ❌ Нет прямых соответствий

4. **BENEFIT** - коммерческие страницы о преимуществах
   - Требует: benefits из ICP, UVP, solutions из Lean Canvas
   - Формат: "Преимущества X для Y"
   - Примеры из списка: 
     - ✅ "Differentiation playbook: как выделиться с TRYGO" (частично)
     - ✅ "Benefits of remote patch management" (если есть в benefits)

5. **FEATURE** - коммерческие страницы о фичах
   - Требует: solutions из Lean Canvas (это фичи продукта)
   - Формат: "Как работает фича X" / "Фича Y в TRYGO"
   - Примеры из списка:
     - ✅ "Как TRYGO генерирует гипотезы для запуска продукта" (если есть в solutions)
     - ✅ "Lean Canvas в TRYGO: от идей к бизнес-модели" (если есть в solutions)
     - ✅ "Управление ICP в TRYGO: сегментация и триггеры" (если есть в solutions)
     - ✅ "Анализ конкурентов в TRYGO: от трекинга к инсайтам" (если есть в solutions)
     - ✅ "SWOT и TOWS анализ: от теории к практике в TRYGO" (если есть в solutions)
     - ✅ "Анализ интервью в TRYGO: от транскриптов к инсайтам" (если есть в solutions)
     - ✅ "GTM стратегия за 1 клик: как работает AI в TRYGO" (если есть в solutions)
     - ✅ "Landing pages в TRYGO: от идеи до конверсии" (если есть в solutions)

6. **FAQ** - FAQ статьи
   - Требует: objections из ICP
   - Формат: "FAQ: вопрос о X"
   - Примеры из списка:
     - ✅ "Как привлечь первых 100 пользователей?" (если есть в objections)
     - ✅ "Когда начинать маркетинг?" (если есть в objections)
     - ✅ "Как рассчитать маркетинговый бюджет?" (если есть в objections)

7. **INFO** - информационные статьи
   - Требует: persona, customerJourney из ICP
   - Формат: Образовательные статьи для персоны
   - Примеры из списка:
     - ✅ "Actionable rollout plan: от стратегии к действиям" (частично)
     - ✅ "Контент для запуска: emails, посты и nurture sequences" (частично)

---

## Что НЕ может генерировать текущий генератор:

### 1. Статьи про TRYGO без привязки к фичам проекта
- ❌ "Как TRYGO генерирует гипотезы" - если нет фичи "Hypothesis generator" в solutions
- ❌ "Lean Canvas в TRYGO" - если нет фичи "Lean Canvas" в solutions
- ❌ Общие статьи о платформе TRYGO

### 2. Бесплатные материалы и шаблоны
- ❌ "Шаблон Lean Canvas для стартапов (бесплатный гайд)"
- ❌ "ICP Research Kit: 50 вопросов"
- ❌ "Hypothesis Testing Framework"
- ❌ "Startup Onboarding Checklist"
- ❌ "Problem-Solution Fit Canvas"
- ❌ "Customer Discovery Interview Script"
- ❌ "MVP Feature Prioritization Matrix"
- ❌ "Business Model Validation Checklist"
- ❌ "Founder Persona Canvas"
- ❌ "Risk Assessment Template"

**Причина:** Генератор создает идеи статей, а не шаблоны/чек-листы/инструменты

### 3. Comparison Content (сравнения)
- ❌ "TRYGO vs FounderPal: сравнение GTM инструментов"
- ❌ "TRYGO vs HubSpot: что выбрать для стартапа"
- ❌ "Lean Startup vs Traditional Business Planning"
- ❌ "Agile Marketing vs Traditional Marketing"
- ❌ "Canva vs Adobe Creative Suite for startups"
- ❌ "Google Analytics vs Mixpanel for SaaS"
- ❌ "Notion vs ClickUp for marketing teams"

**Причина:** Генератор не имеет логики сравнения продуктов/методологий

### 4. How-to статьи общего характера
- ❌ "how to find profitable niche in 3 days"
- ❌ "how to do swot analysis without excel"
- ❌ "how to create high converting landing page"
- ❌ "b2b content marketing strategy"
- ❌ "how to create b2b content calendar"

**Причина:** Генератор требует привязки к конкретным данным проекта (pains, goals, solutions)

### 5. Серии статей
- ❌ "Неделя 1: Валидация идеи"
- ❌ "Неделя 2: MVP разработка"
- ❌ "Неделя 12: Масштабирование после запуска"

**Причина:** Генератор создает отдельные идеи, а не серии

### 6. Кейсы и истории
- ❌ "Как мы привлекли 1000 пользователей за месяц"
- ❌ "GTM стратегия для B2B SaaS"

**Причина:** Генератор не создает кейсы/истории успеха

### 7. Social Media Content
- ❌ "Thread: Complete GTM strategy in 10 tweets"
- ❌ "Thread: 50 marketing tactics for startups"
- ❌ "Why most startups fail at GTM"
- ❌ "The psychology of product adoption"
- ❌ "Day in life of startup founder"
- ❌ "5-second marketing tips"

**Причина:** Генератор создает идеи для блога/статей, а не для соцсетей

### 8. Seasonal Content
- ❌ "Q4 Marketing Strategies for Startups"
- ❌ "End of Year Marketing Review Template"
- ❌ "New Year Marketing Goals for SaaS"
- ❌ "AI Marketing Trends 2024"

**Причина:** Генератор не учитывает сезонность/тренды

### 9. Data-Driven Content
- ❌ "2024 Startup Marketing Report"
- ❌ "GTM Success Metrics Study"
- ❌ "Marketing Budget Benchmarks for SaaS"
- ❌ "Average time to product launch"
- ❌ "Most effective marketing channels for startups"
- ❌ "Customer acquisition cost by industry"

**Причина:** Генератор не создает отчеты/исследования на основе данных

### 10. Technical SEO Content
- ❌ "Complete SEO checklist for SaaS websites"
- ❌ "Technical SEO for single-page applications"
- ❌ "Local SEO strategies for B2B companies"
- ❌ "How to implement product schema"
- ❌ "FAQ schema for SaaS companies"
- ❌ "Review schema for social proof"

**Причина:** Генератор не специализируется на техническом SEO

### 11. International Content
- ❌ "GTM Strategy for Russian Market"
- ❌ "European SaaS Launch Guide"
- ❌ "Asian Market Entry Strategies"

**Причина:** Генератор не учитывает региональную специфику

### 12. Niche-specific Content
- ❌ "GTM for FinTech Startups"
- ❌ "HealthTech Product Launch"
- ❌ "EdTech Marketing Strategies"

**Причина:** Генератор использует данные конкретного проекта, а не общие нишевые темы

### 13. Advanced Tactics
- ❌ "Growth Hacking Techniques"
- ❌ "Viral Marketing Strategies"
- ❌ "Personal Branding for Founders"

**Причина:** Генератор фокусируется на контексте проекта, а не на общих тактиках

---

## Выводы

### ✅ Может генерировать (при наличии данных в проекте):

**Из файла 1 (22 идеи):**
- ✅ ~8-10 идей про фичи TRYGO (если фичи есть в solutions Lean Canvas)
- ✅ ~3-5 FAQ статей (если вопросы есть в objections ICP)
- ✅ ~2-3 информационные статьи (если есть persona и customerJourney)

**Итого: ~13-18 идей из 22** (59-82%)

### ❌ НЕ может генерировать:

**Из файла 1 (22 идеи):**
- ❌ Все бесплатные материалы (10 идей) - шаблоны, чек-листы, фреймворки
- ❌ Некоторые общие статьи без привязки к фичам

**Из файла 3 (91 идея):**
- ❌ ~85-90 идей - это сравнения, серии, кейсы, соцсети, сезонный контент, технический SEO и т.д.

**Итого: ~95-100 идей из 113** (84-88%) НЕ могут быть сгенерированы

---

## Рекомендации

### Для генерации идей из списка нужно:

1. **Расширить промпты** для поддержки:
   - Comparison content (сравнения)
   - How-to статьи общего характера
   - Серии статей
   - Кейсы и истории

2. **Добавить новые категории:**
   - `COMPARISON` - статьи-сравнения
   - `CASE_STUDY` - кейсы и истории
   - `HOW_TO` - how-to гайды
   - `SERIES` - серии статей

3. **Добавить контекст:**
   - Информацию о конкурентах
   - Общие темы индустрии
   - Тренды и сезонность

4. **Для бесплатных материалов:**
   - Создать отдельный генератор для шаблонов/чек-листов
   - Или добавить категорию `TEMPLATE` / `RESOURCE`

---

## Текущие возможности генератора

**Может создать:**
- Идеи статей, привязанные к конкретным данным проекта
- Коммерческие страницы о фичах продукта
- FAQ статьи на основе возражений клиентов
- Информационные статьи для персоны

**Не может создать:**
- Общие how-to статьи без привязки к проекту
- Сравнения продуктов/методологий
- Кейсы и истории успеха
- Серии статей
- Социальный контент
- Сезонный контент
- Технический SEO контент
- Шаблоны и инструменты
- Региональный контент
- Нишевый контент (без данных проекта)






