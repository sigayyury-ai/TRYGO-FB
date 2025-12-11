# GraphQL API - Полный список запросов и мутаций

## 📋 Query (Запросы)

### 1. Health Check
- **`_health`**: `String!`
  - Проверка работоспособности API
  - Возвращает: `"ok"`

### 2. Clusters (Кластеры)
- **`seoClusters(projectId: ID!, hypothesisId: ID)`**: `[SeoCluster!]!`
  - Получить все кластеры для проекта/гипотезы
  - Модель: `SeoCluster`
  
- **`seoAgentClusters(projectId: ID!, hypothesisId: ID)`**: `[SeoCluster!]!`
  - Получить все кластеры для проекта/гипотезы (SEO Agent)
  - Модель: `SeoCluster`
  - **Резолвер**: Использует `SeoCluster.find()`

### 3. Backlog (Бэклог)
- **`seoBacklog(projectId: ID!, hypothesisId: ID, status: BacklogStatus)`**: `[BacklogIdea!]!`
  - Получить идеи бэклога с фильтром по статусу
  - Модель: `SeoBacklogIdea`
  
- **`seoAgentBacklog(projectId: ID!, hypothesisId: ID)`**: `[BacklogIdea!]!`
  - Получить идеи бэклога для SEO Agent
  - Модель: `SeoBacklogIdea`
  - **Резолвер**: Использует `SeoBacklogIdea.find()`

### 4. Content Ideas (Идеи контента)
- **`seoAgentContentIdeas(projectId: ID!, hypothesisId: ID)`**: `[ContentIdea!]!`
  - Получить идеи контента для SEO Agent
  - Модель: `SeoContentItem` (маппится в `ContentIdea`)
  - **Резолвер**: Использует `SeoContentItem.find()` + `mapContentIdea()`

### 5. Posting Settings (Настройки публикации)
- **`seoAgentPostingSettings(projectId: ID!)`**: `PostingSettings`
  - Получить настройки публикации для проекта
  - Модель: `SeoSprintSettings`
  - **Резолвер**: Использует `SeoSprintSettings.findOne()`

### 6. Content Queue (Очередь контента)
- **`seoContentQueue(projectId: ID!, hypothesisId: ID, status: ContentStatus)`**: `[ContentItem!]!`
  - Получить очередь контента с фильтром по статусу
  - Модель: `SeoContentItem`
  - **Резолвер**: Использует `SeoContentItem.find()`

---

## 🔧 Mutation (Мутации)

### 1. Clusters (Кластеры)

#### `upsertSeoCluster(input: ClusterInput!)`: `SeoCluster!`
- Создать или обновить кластер
- Модель: `SeoCluster`
- **Резолвер**: `SeoCluster.findByIdAndUpdate()` или `SeoCluster.create()`

#### `createSeoAgentCluster(input: ClusterInput!)`: `SeoCluster!`
- Создать новый кластер для SEO Agent
- Модель: `SeoCluster`
- **Резолвер**: `SeoCluster.create()`

#### `updateSeoAgentCluster(id: ID!, input: ClusterInput!)`: `SeoCluster!`
- Обновить существующий кластер
- Модель: `SeoCluster`
- **Резолвер**: `SeoCluster.findByIdAndUpdate()`

#### `deleteSeoCluster(id: ID!)`: `Boolean!`
- Удалить кластер
- **Резолвер**: `SeoCluster.findByIdAndDelete()`

#### `deleteSeoAgentCluster(id: ID!)`: `Boolean!`
- Удалить кластер SEO Agent
- **Резолвер**: `SeoCluster.findByIdAndDelete()`

### 2. Backlog (Бэклог)

#### `upsertBacklogIdea(input: BacklogIdeaInput!)`: `BacklogIdea!`
- Создать или обновить идею бэклога
- Модель: `SeoBacklogIdea`
- **Резолвер**: `SeoBacklogIdea.findByIdAndUpdate()` или `SeoBacklogIdea.create()`

#### `updateSeoAgentBacklogIdea(id: ID!, input: SeoAgentBacklogIdeaInput!)`: `BacklogIdea!`
- Обновить идею бэклога для SEO Agent
- Модель: `SeoBacklogIdea`
- **Резолвер**: `SeoBacklogIdea.findByIdAndUpdate()`

#### `deleteBacklogIdea(id: ID!)`: `Boolean!`
- Удалить идею бэклога
- **Резолвер**: `SeoBacklogIdea.findByIdAndDelete()`

#### `deleteSeoAgentBacklogIdea(id: ID!)`: `Boolean!`
- Удалить идею бэклога SEO Agent
- **Резолвер**: `SeoBacklogIdea.findByIdAndDelete()`

### 3. Content Ideas (Идеи контента)

#### `addContentIdeaToBacklog(input: AddContentIdeaToBacklogInput!)`: `BacklogIdea!`
- Добавить идею контента в бэклог
- Модель: `SeoBacklogIdea`
- **Резолвер**: `SeoBacklogIdea.create()` (⚠️ TODO: получить projectId из contentIdea)

#### `dismissContentIdea(id: ID!)`: `ContentIdea!`
- Отклонить идею контента
- **Резолвер**: Возвращает stub (⚠️ TODO: реализовать через модель)

#### `createCustomContentIdea(input: CreateCustomContentIdeaInput!)`: `ContentIdea!`
- Создать кастомную идею контента
- **Резолвер**: Возвращает stub (⚠️ TODO: реализовать через модель)

### 4. Posting Settings (Настройки публикации)

#### `updateSeoAgentPostingSettings(input: PostingSettingsInput!)`: `PostingSettings!`
- Обновить настройки публикации
- Модель: `SeoSprintSettings`
- **Резолвер**: `SeoSprintSettings.findOneAndUpdate()` с `upsert: true`

### 5. Content Items (Элементы контента)

#### `upsertContentItem(input: ContentItemInput!)`: `ContentItem!`
- Создать или обновить элемент контента
- Модель: `SeoContentItem`
- **Резолвер**: `SeoContentItem.findByIdAndUpdate()` или `SeoContentItem.create()`

#### `deleteContentItem(id: ID!)`: `Boolean!`
- Удалить элемент контента
- **Резолвер**: `SeoContentItem.findByIdAndDelete()`

---

## 📊 Модели данных

### SeoCluster
- Используется для: кластеры ключевых слов
- Коллекция: `seoClusters`

### SeoBacklogIdea
- Используется для: идеи бэклога
- Коллекция: `seoBacklogIdeas`

### SeoContentItem
- Используется для: элементы контента и идеи контента (через маппинг)
- Коллекция: `seoContentItems`

### SeoSprintSettings
- Используется для: настройки публикации (posting settings)
- Коллекция: `seoSprintSettings`

---

## ⚠️ TODO / Проблемы

1. **`addContentIdeaToBacklog`**: 
   - Не получает `projectId` из contentIdea (использует "unknown")
   - Нужно получать из исходной идеи контента

2. **`dismissContentIdea`**: 
   - Возвращает stub, не использует модель
   - Нужно реализовать через `SeoContentItem` или создать модель `ContentIdea`

3. **`createCustomContentIdea`**: 
   - Возвращает stub, не использует модель
   - Нужно реализовать через `SeoContentItem` или создать модель `ContentIdea`

4. **`seoAgentPostingSettings`**: 
   - `autoPublishEnabled` не хранится в `SeoSprintSettings`
   - Нужно добавить поле в модель или использовать другую модель

---

## 📝 Примечания

- Все запросы и мутации используют существующие модели MongoDB
- Маппинг между GraphQL типами и моделями выполняется через функции `map*`
- `hypothesisId` опционален в большинстве запросов
- Все мутации требуют `userId` из контекста (через headers)

