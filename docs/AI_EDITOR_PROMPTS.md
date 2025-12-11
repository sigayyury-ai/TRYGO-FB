# AI Editor Prompts Documentation

## Обзор

AI Editor использует три типа промптов для работы с контентом:
1. **Partial Rewrite** (`rewriteTextSelection`) - переписывание выбранного фрагмента текста
2. **Full Regeneration** (`regenerateContent`) - полная регенерация контента
3. **Content Generation** (`buildDraftPrompt`) - генерация нового контента из backlog идеи

---

## 1. Partial Rewrite (Частичное переписывание)

### Использование
Когда пользователь выделяет текст в редакторе и отправляет инструкцию через чат.

### System Message
```
You are a professional content editor. Rewrite only the selected text portion while maintaining consistency with the surrounding context. Return ONLY the rewritten text, no explanations.
```

### User Prompt Template
```
You are a professional content editor. Rewrite ONLY the selected text portion, keeping the same meaning but improving clarity, style, and engagement.

CONTEXT BEFORE:
{contextBefore || "(beginning of document)"}

SELECTED TEXT TO REWRITE:
{selectedText}

CONTEXT AFTER:
{contextAfter || "(end of document)"}

{instruction ? `SPECIFIC INSTRUCTION: ${instruction}` : "Improve the selected text while maintaining consistency with the surrounding context."}

IMPORTANT:
- Rewrite ONLY the selected text portion
- Keep the same HTML structure and formatting if present
- Maintain the same tone and style as the surrounding text
- Do not add content before or after the selected text
- Return ONLY the rewritten version of the selected text, nothing else
```

### Переменные
- `contentItemId` (string) - ID контент-элемента
- `selectedText` (string) - выделенный текст для переписывания
- `contextBefore` (string, optional) - контекст до выделенного текста (до 500 символов)
- `contextAfter` (string, optional) - контекст после выделенного текста (до 500 символов)
- `instruction` (string, optional) - пользовательская инструкция (например, "make it more engaging", "simplify")

### Параметры OpenAI API
- **Model**: `gpt-5.1` (из env: `OPENAI_MODEL`)
- **Temperature**: `0.7`
- **Max Completion Tokens**: `2000`
- **Response Format**: обычный текст (не JSON)

---

## 2. Full Regeneration (Полная регенерация)

### Использование
Когда пользователь отправляет общую инструкцию без выделения текста (например, "regenerate this article to be more concise").

### System Message
```
You are a senior content writer. Always respond with valid JSON matching the requested format.
```

### User Prompt
Использует `buildDraftPrompt` для генерации базового промпта, затем добавляет инструкцию пользователя:

```
{basePrompt}

### ADDITIONAL INSTRUCTIONS
{promptPart}
```

Где `basePrompt` генерируется через `buildDraftPrompt` (см. раздел 3).

### Переменные
- `id` (string) - ID контент-элемента
- `promptPart` (string, optional) - дополнительная инструкция от пользователя

### Параметры OpenAI API
- **Model**: `gpt-5.1` (из env: `OPENAI_MODEL`)
- **Temperature**: `0.7`
- **Max Completion Tokens**: `8000`
- **Response Format**: `{ type: "json_object" }`

### Формат ответа (JSON)
```json
{
  "title": "Article Title",
  "summary": "Lead paragraph",
  "outline": [
    {
      "heading": "H2 heading",
      "body": "Section content in HTML",
      "notes": "Editor notes"
    }
  ],
  "cta": {
    "headline": "CTA headline",
    "body": "CTA body",
    "buttonLabel": "Button label",
    "url_hint": "URL",
    "tone": "Tone description"
  },
  "seo": {
    "keywords": ["keyword1", "keyword2"],
    "internalLinks": [{"anchor": "text", "target": "slug"}],
    "externalLinks": [{"anchor": "text", "url_hint": "url"}],
    "schema": "Schema type",
    "metaDescription": "Meta description",
    "slug_hint": "slug"
  },
  "compliance": ["disclaimers"]
}
```

---

## 3. Content Generation (Генерация контента)

### Использование
При генерации нового контента из backlog идеи (кнопка "Generate" в BacklogPanel).

### System Message
```
You are a senior content writer. Always respond with valid JSON matching the requested format.
```

### User Prompt
Генерируется через `buildDraftPrompt`, который использует шаблоны из `promptTemplates.ts`.

### Структура промпта

#### 1. Content Settings
```
- Content type: article | website_page
- Detected template type: {templateType}
- Language: {language} (default: English)
- Funnel stage: {funnelStage}
- Content goal / KPI: {contentGoal}
- Idea category: {idea.category}
- Additional requirements: {specialRequirements}
```

#### 2. Project Overview
```
- Title: {project.title}
- Description: {project.description}
```

#### 3. Hypothesis
```
- Title: {hypothesis.title}
- Summary: {hypothesis.description}
```

#### 4. ICP Snapshot
```
Persona: {icp.persona}
Goals:
- {goal1}
- {goal2}
Pains:
- {pain1}
- {pain2}
Triggers / JTBD:
- {trigger1}
- {trigger2}
Objections:
- {objection1}
- {objection2}
Customer journey: {icp.customerJourney}
```

#### 5. Lean Canvas Excerpt
```
Unique Value Proposition: {leanCanvas.uniqueValueProposition}
Problems:
- {problem1}
- {problem2}
Solutions:
- {solution1}
- {solution2}
Unfair Advantages:
- {advantage1}
- {advantage2}
```

#### 6. Backlog Idea
```
- Title: {idea.title}
- Description: {idea.description}
```

#### 7. Title Requirements
```
- Length: 50-70 characters (optimal: 50-60)
- Word count: 5-9 words (optimal)
- MUST include at least ONE of:
  * Question format: "Как...", "Почему...", "Что такое...", "Когда..."
  * Power words: "лучший", "проверенный", "эффективный", "секрет", "гайд"
  * Numbers: "5 способов", "10 советов", "за 30 дней"
- MUST include SEO keywords
- Avoid generic words: "статья", "информация", "материал"
```

#### 8. Writing Rules
Основные правила написания (зависят от языка):

**Для английского языка:**
- Tone: expert yet empathetic; speak directly to the persona
- Highlight the product naturally: mention real features from Lean Canvas
- Minimum 4000 words total
- Use HTML tags: `<p>`, `<ul>/<ol>` with `<li>`, `<strong>`, `<h3>` for subsections
- Include: problem, solution, benefits with numbers/facts, social proof, objections handling, CTA
- Add analytics sections, practical tips, and FAQ (≥3 questions)
- Final section: analyze all solutions, choose most relevant, explain why it's better
- Use 2-3 highly relevant SEO keywords, repeat naturally in H2 headings and text (3-5 times max)

**Для русского языка:**
- Тон: эксперт, но эмпатичный; говори напрямую с персоной
- Подчёркивай продукт нативно: упоминай реальные функции из Lean Canvas
- Общий объём текста — не менее 4000 слов
- Используй HTML-теги: `<p>`, `<ul>/<ol>` с `<li>`, `<strong>`, `<h3>` для подразделов
- Всегда добавляй блоки: проблема, решение, выгоды с цифрами/фактами, социальные доказательства, ответы на возражения, CTA
- Включай секции с аналитикой, практическими советами и FAQ (≥3 вопроса)
- Финальная секция: проанализируй все решения, выбери наиболее релевантное, объясни почему
- Используй 2-3 высоко-релевантных SEO-ключа, повторяй естественно в заголовках H2 и по тексту (не больше 3-5 раз)

### Переменные контекста

#### SeoContextSnapshot
- `project` - информация о проекте
  - `title` (string)
  - `description` (string)
- `hypothesis` - информация о гипотезе
  - `title` (string)
  - `description` (string)
- `icp` - Ideal Customer Profile
  - `persona` (string)
  - `pains` (string[])
  - `goals` (string[])
  - `triggers` (string[])
  - `objections` (string[])
  - `customerJourney` (string)
- `leanCanvas` - Lean Canvas данные
  - `uniqueValueProposition` (string)
  - `problems` (string[])
  - `solutions` (string[])
  - `unfairAdvantages` (string[])
- `language` (string) - язык контента (default: "English")

#### SeoBacklogIdeaDoc
- `title` (string) - заголовок идеи
- `description` (string) - описание идеи
- `category` (string) - категория идеи (pain, goal, trigger, feature, benefit, faq, info)

#### Параметры функции buildDraftPrompt
- `context` (SeoContextSnapshot) - SEO контекст
- `idea` (SeoBacklogIdeaDoc) - идея из backlog
- `contentType` ("article" | "website_page") - тип контента
- `language` (string, optional) - язык (приоритет: explicit > context > default)
- `contentGoal` (string, optional) - бизнес-цель контента
- `funnelStage` (string, optional) - стадия воронки
- `specialRequirements` (string, optional) - дополнительные требования

### Параметры OpenAI API
- **Model**: `gpt-5.1` (из env: `OPENAI_MODEL`)
- **Temperature**: `0.7`
- **Max Completion Tokens**: `8000`
- **Response Format**: `{ type: "json_object" }`

---

## Переменные окружения

### Обязательные
- `OPENAI_API_KEY` - API ключ OpenAI
- `OPENAI_MODEL` - модель OpenAI (default: `gpt-5.1`)

### Опциональные
- `GEMINI_API_KEY` или `GOOGLE_API_KEY` - для генерации изображений

---

## Детекция типа контента

Система автоматически определяет тип контента на основе backlog идеи:
- **Trigger-based** - если идея связана с триггерами
- **Pain-based** - если идея связана с болями
- **Feature-based** - если идея связана с функциями продукта
- **FAQ** - если категория идеи "faq"
- **Informational** - по умолчанию

Тип контента влияет на структуру и тон промпта.

---

## Примеры использования

### Пример 1: Частичное переписывание
**Пользователь выделяет текст:** "This is a test paragraph."
**Инструкция:** "make it more engaging"

**Промпт:**
```
You are a professional content editor. Rewrite ONLY the selected text portion...

CONTEXT BEFORE:
(previous paragraphs)

SELECTED TEXT TO REWRITE:
This is a test paragraph.

CONTEXT AFTER:
(next paragraphs)

SPECIFIC INSTRUCTION: make it more engaging
```

### Пример 2: Полная регенерация
**Инструкция:** "regenerate this article to be more concise"

**Промпт:**
```
{basePrompt from buildDraftPrompt}

### ADDITIONAL INSTRUCTIONS
regenerate this article to be more concise
```

### Пример 3: Генерация нового контента
**Backlog Idea:**
- Title: "How to market a new product launch"
- Category: "info"

**Промпт включает:**
- Все данные проекта, гипотезы, ICP, Lean Canvas
- Правила написания для английского языка
- Требования к заголовку (50-70 символов, вопрос/сильное слово/число)
- Структура JSON с outline, CTA, SEO данными

---

## Логирование

Все промпты логируются в бэкенде:
- `[rewriteTextSelection]` - для частичного переписывания
- `[regenerateContent]` - для полной регенерации
- `[buildDraftPrompt]` - для генерации промпта
- `[promptTemplates]` - для шаблонов промптов

Логи включают:
- Длину промпта
- Используемый язык
- Параметры запроса
- Ответы от OpenAI API




