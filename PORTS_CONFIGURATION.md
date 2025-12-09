# Конфигурация портов и запросов

## 📋 Сводка портов (из PORTS.md)

| Сервис | Порт | URL | Переменная окружения |
|--------|------|-----|---------------------|
| Main Backend | 5001 | http://localhost:5001/graphql | `VITE_SERVER_URL` |
| SEO Agent Backend | 4100 | http://localhost:4100/graphql | `VITE_SEO_AGENT_URL` |
| WebSocket | 5001 | ws://localhost:5001 | `VITE_WS_SERVER_URL` |
| Semantics Service | 4200 | http://localhost:4200 | `SEMANTICS_SERVICE_URL` (backend) |
| Images Service | 4300 | http://localhost:4300 | `IMAGES_SERVICE_URL` (backend) |
| Website Pages Service | 4400 | http://localhost:4400 | `WEBSITE_PAGES_SERVICE_URL` (backend) |
| Frontend | 8080 | http://localhost:8080 | - |

## 🔌 Apollo Clients

### Основной клиент (порт 5001)
**Файл**: `TRYGO-Front/src/config/apollo/client/index.ts`
- **Использует**: `VITE_SERVER_URL` → `http://localhost:5001/graphql`
- **Экспортирует**: `QUERY`, `MUTATE`
- **Используется для**: 
  - Авторизация (`getUserByToken`, `login`, `register`)
  - Проекты (`getProjects`, `getProjectHypotheses`)
  - Гипотезы (`getHypothesesCore`, `getHypothesesGtm`, и т.д.)
  - Все НЕ-SEO Agent запросы

### SEO Agent клиент (порт 4100)
**Файл**: `TRYGO-Front/src/config/apollo/client/seoAgentClient.ts`
- **Использует**: `VITE_SEO_AGENT_URL` → `http://localhost:4100/graphql`
- **Экспортирует**: `SEO_AGENT_QUERY`, `SEO_AGENT_MUTATE`
- **Используется для**:
  - `getSeoAgentBacklog.ts` → `SEO_AGENT_QUERY`
  - `updateSeoAgentBacklogItem.ts` → `SEO_AGENT_MUTATE`
  - `deleteSeoAgentBacklogItem.ts` → `SEO_AGENT_MUTATE`
  - `getSeoAgentContentIdeas.ts` → `SEO_AGENT_QUERY`
  - `addContentIdeaToBacklog.ts` → `SEO_AGENT_MUTATE`
  - `dismissContentIdea.ts` → `SEO_AGENT_MUTATE`
  - `createCustomContentIdea.ts` → `SEO_AGENT_MUTATE`
  - `getSeoAgentClusters.ts` → `SEO_AGENT_QUERY`
  - `createSeoAgentCluster.ts` → `SEO_AGENT_MUTATE`
  - `updateSeoAgentCluster.ts` → `SEO_AGENT_MUTATE`
  - `deleteSeoAgentCluster.ts` → `SEO_AGENT_MUTATE`
  - `getSeoAgentPostingSettings.ts` → `SEO_AGENT_QUERY`
  - `updateSeoAgentPostingSettings.ts` → `SEO_AGENT_MUTATE`
  - `getSeoAgentContext.ts` → `SEO_AGENT_QUERY`

## 📁 Файлы конфигурации

### Frontend (.env)
```env
VITE_SERVER_URL=http://localhost:5001/graphql
VITE_WS_SERVER_URL=ws://localhost:5001
VITE_SEO_AGENT_URL=http://localhost:4100/graphql
```

### SEO Agent Backend (backend/.env)
```env
PORT=4100
FRONTEND_URL=http://localhost:8080
MONGODB_URI=your_mongodb_uri
SEMANTICS_SERVICE_URL=http://localhost:4200
IMAGES_SERVICE_URL=http://localhost:4300
WEBSITE_PAGES_SERVICE_URL=http://localhost:4400
```

### Main Backend (TRYGO-Backend/.env)
```env
PORT=5001
```

## ✅ Правила использования

1. **Все SEO Agent запросы** → используют `SEO_AGENT_QUERY` / `SEO_AGENT_MUTATE` → порт 4100
2. **Все остальные запросы** → используют `QUERY` / `MUTATE` → порт 5001
3. **Не создавать новые порты** - использовать только те, что указаны в PORTS.md
4. **Не менять порты** без обновления документации

## 🚫 Что НЕ делать

- ❌ Не использовать `VITE_SERVER_URL` для SEO Agent запросов
- ❌ Не использовать `VITE_SEO_AGENT_URL` для обычных запросов
- ❌ Не создавать новые порты без обновления PORTS.md
- ❌ Не менять порты в коде без обновления .env файлов

