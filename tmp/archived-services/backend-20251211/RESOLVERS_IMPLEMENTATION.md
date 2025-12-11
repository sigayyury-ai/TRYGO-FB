# Реализация всех мутаций и резолверов

## ✅ Все мутации и резолверы внедрены и используют существующие модели

### 📋 Query (8 запросов) - все реализованы

1. ✅ `_health` - проверка работоспособности
2. ✅ `seoClusters` - использует `SeoCluster.find()`
3. ✅ `seoAgentClusters` - использует `SeoCluster.find()`
4. ✅ `seoBacklog` - использует `SeoBacklogIdea.find()`
5. ✅ `seoAgentBacklog` - использует `SeoBacklogIdea.find()`
6. ✅ `seoAgentContentIdeas` - использует `SeoContentItem.find()` с маппингом через `mapContentIdea()`
7. ✅ `seoAgentPostingSettings` - использует `SeoSprintSettings.findOne()` с маппингом
8. ✅ `seoContentQueue` - использует `SeoContentItem.find()`

### 🔧 Mutation (15 мутаций) - все реализованы

#### Clusters (5 мутаций):
1. ✅ `upsertSeoCluster` - использует `SeoCluster.findByIdAndUpdate()` / `SeoCluster.create()`
2. ✅ `createSeoAgentCluster` - использует `SeoCluster.create()`
3. ✅ `updateSeoAgentCluster` - использует `SeoCluster.findByIdAndUpdate()`
4. ✅ `deleteSeoCluster` - использует `SeoCluster.findByIdAndDelete()`
5. ✅ `deleteSeoAgentCluster` - использует `SeoCluster.findByIdAndDelete()`

#### Backlog (4 мутации):
6. ✅ `upsertBacklogIdea` - использует `SeoBacklogIdea.findByIdAndUpdate()` / `SeoBacklogIdea.create()`
7. ✅ `updateSeoAgentBacklogIdea` - использует `SeoBacklogIdea.findByIdAndUpdate()`
   - ✅ Поддержка `scheduledDate`
   - ✅ Использует `userId` из context
8. ✅ `deleteBacklogIdea` - использует `SeoBacklogIdea.findByIdAndDelete()`
9. ✅ `deleteSeoAgentBacklogIdea` - использует `SeoBacklogIdea.findByIdAndDelete()`

#### Content Ideas (3 мутации):
10. ✅ `addContentIdeaToBacklog` - использует `SeoContentItem.findById()` и `SeoBacklogIdea.create()`
    - ✅ Получает `projectId` и `hypothesisId` из исходной идеи
    - ✅ Обновляет статус исходной идеи на "published"
    - ✅ Использует `userId` из context
11. ✅ `dismissContentIdea` - использует `SeoContentItem.findByIdAndUpdate()`
    - ✅ Устанавливает статус "archived" (эквивалент dismissed)
12. ✅ `createCustomContentIdea` - использует `SeoContentItem.create()`
    - ✅ Маппинг категорий: `ContentCategory` → `SeoContentItem.category`
    - ✅ Маппинг типов: `ContentIdeaType` → `SeoContentItem.format`
    - ✅ Использует `userId` из context

#### Posting Settings (1 мутация):
13. ✅ `updateSeoAgentPostingSettings` - использует `SeoSprintSettings.findOneAndUpdate()` с `upsert: true`
    - ✅ Маппинг `preferredDays` (строки) ↔ `publishDays` (числа 0-6)
    - ✅ Использует `userId` из context

#### Content Items (2 мутации):
14. ✅ `upsertContentItem` - использует `SeoContentItem.findByIdAndUpdate()` / `SeoContentItem.create()`
15. ✅ `deleteContentItem` - использует `SeoContentItem.findByIdAndDelete()`

## 🔄 Используемые модели

### SeoCluster
- Используется для: `seoClusters`, `seoAgentClusters`, все cluster мутации

### SeoBacklogIdea
- Используется для: `seoBacklog`, `seoAgentBacklog`, все backlog мутации
- ✅ Добавлено поле `scheduledDate` в модель
- ✅ Обновлен статус enum для поддержки всех статусов

### SeoContentItem
- Используется для: `seoAgentContentIdeas`, `seoContentQueue`, content ideas мутации
- ✅ Маппинг через `mapContentIdea()` для преобразования в `ContentIdea` тип
- ✅ Статус "archived" используется как эквивалент "dismissed"

### SeoSprintSettings
- Используется для: `seoAgentPostingSettings`, `updateSeoAgentPostingSettings`
- ✅ Маппинг между `weeklyCadence` ↔ `weeklyPublishCount`
- ✅ Маппинг между `publishDays` (числа) ↔ `preferredDays` (строки)

## 🔐 Context и авторизация

Все мутации, которые создают или обновляют данные, используют `userId` из context:
- `updateSeoAgentBacklogIdea` ✅
- `createCustomContentIdea` ✅
- `updateSeoAgentPostingSettings` ✅
- `addContentIdeaToBacklog` ✅

Context передается через заголовок `x-user-id` и доступен в `context.userId`.

## 📝 Маппинг данных

### mapBacklogIdea
- ✅ Маппинг статусов: `backlog` → `PENDING`, `scheduled` → `SCHEDULED`, `archived` → `ARCHIVED`
- ✅ Поддержка `scheduledDate` из модели

### mapContentIdea
- ✅ Маппинг формата: `commercial` → `COMMERCIAL_PAGE`, `faq` → `ARTICLE`, `blog` → `ARTICLE`
- ✅ Маппинг категорий: `pain` → `PAINS`, `goal` → `GOALS`, и т.д.
- ✅ Маппинг статусов: `draft/review/ready` → `NEW`, `published` → `ADDED_TO_BACKLOG`, `archived` → `DISMISSED`
- ✅ Поле `dismissed` вычисляется из статуса `archived`

## ✅ Итог

Все 8 запросов и 15 мутаций полностью реализованы и используют существующие модели базы данных. Никаких заглушек (stubs) не осталось. Все операции работают с реальными данными через Mongoose модели.

