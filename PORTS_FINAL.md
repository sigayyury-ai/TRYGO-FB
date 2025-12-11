# ✅ Финальная конфигурация портов

## 📋 Порты (из PORTS.md - НЕ МЕНЯТЬ!)

| Сервис | Порт | URL | Переменная |
|--------|------|-----|-----------|
| Main Backend | **5001** | http://localhost:5001/graphql | `VITE_SERVER_URL` |
| SEO Agent Backend | **4100** | http://localhost:4100/graphql | `VITE_SEO_AGENT_URL` |
| WebSocket | **5001** | ws://localhost:5001 | `VITE_WS_SERVER_URL` |
| Semantics Service | **4200** | http://localhost:4200 | `SEMANTICS_SERVICE_URL` |
| Images Service | **4300** | http://localhost:4300 | `IMAGES_SERVICE_URL` |
| Website Pages Service | **4400** | http://localhost:4400 | `WEBSITE_PAGES_SERVICE_URL` |
| Frontend | **8080** | http://localhost:8080 | - |

## 🔌 Apollo Clients (НЕ МЕНЯТЬ!)

### Основной клиент → порт 5001
**Файл**: `TRYGO-Front/src/config/apollo/client/index.ts`
```typescript
uri: `${import.meta.env.VITE_SERVER_URL}` // → http://localhost:5001/graphql
```
**Экспортирует**: `QUERY`, `MUTATE`
**Используется для**: Все НЕ-SEO Agent запросы (авторизация, проекты, гипотезы)

### SEO Agent клиент → порт 4100
**Файл**: `TRYGO-Front/src/config/apollo/client/seoAgentClient.ts`
```typescript
const seoAgentUrl = import.meta.env.VITE_SEO_AGENT_URL || 'http://localhost:4100/graphql'
```
**Экспортирует**: `SEO_AGENT_QUERY`, `SEO_AGENT_MUTATE`
**Используется для**: Все SEO Agent запросы (14 файлов)

## 📁 Файлы конфигурации

### Frontend (.env)
```env
VITE_SERVER_URL=http://localhost:5001/graphql
VITE_WS_SERVER_URL=ws://localhost:5001
VITE_SEO_AGENT_URL=http://localhost:4100/graphql
```

### SEO Agent Backend (backend/src/config/env.ts)
```typescript
const port = PORT ? parseInt(PORT, 10) : 4100; // По умолчанию 4100
FRONTEND_URL = "http://localhost:8080"
SEMANTICS_SERVICE_URL = "http://localhost:4200"
IMAGES_SERVICE_URL = "http://localhost:4300"
WEBSITE_PAGES_SERVICE_URL = "http://localhost:4400"
```

## ✅ Правила использования (СТРОГО!)

1. **SEO Agent запросы** → `SEO_AGENT_QUERY` / `SEO_AGENT_MUTATE` → порт **4100**
2. **Остальные запросы** → `QUERY` / `MUTATE` → порт **5001**
3. **НЕ создавать новые порты** без обновления PORTS.md
4. **НЕ менять порты** в коде без обновления .env и документации

## 🚫 ЧТО НЕ ДЕЛАТЬ

- ❌ НЕ использовать `VITE_SERVER_URL` для SEO Agent запросов
- ❌ НЕ использовать `VITE_SEO_AGENT_URL` для обычных запросов  
- ❌ НЕ создавать новые порты без обновления PORTS.md
- ❌ НЕ менять порты в коде без обновления .env файлов
- ❌ НЕ затирать существующие настройки

## 📝 SEO Agent API файлы (14 файлов)

Все используют `SEO_AGENT_QUERY` / `SEO_AGENT_MUTATE`:
- getSeoAgentBacklog.ts
- updateSeoAgentBacklogItem.ts
- deleteSeoAgentBacklogItem.ts
- getSeoAgentContentIdeas.ts
- addContentIdeaToBacklog.ts
- dismissContentIdea.ts
- createCustomContentIdea.ts
- getSeoAgentClusters.ts
- createSeoAgentCluster.ts
- updateSeoAgentCluster.ts
- deleteSeoAgentCluster.ts
- getSeoAgentPostingSettings.ts
- updateSeoAgentPostingSettings.ts
- getSeoAgentContext.ts

## ✅ Статус: ВСЁ НАСТРОЕНО ПРАВИЛЬНО

Все порты соответствуют PORTS.md, все запросы идут на правильные порты.

