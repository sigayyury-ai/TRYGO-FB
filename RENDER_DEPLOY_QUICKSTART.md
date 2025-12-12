# 🚀 Быстрый старт деплоя на Render

## Шаг 1: Подготовка

1. **MongoDB Atlas**:
   - Создайте кластер на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Получите connection string (MONGODB_URI)
   - Настройте Network Access: разрешите доступ с 0.0.0.0/0

2. **API ключи**:
   - OpenAI API Key: [platform.openai.com](https://platform.openai.com/api-keys)
   - Google OAuth: [Google Cloud Console](https://console.cloud.google.com/)
   - Stripe (опционально): [Stripe Dashboard](https://dashboard.stripe.com/)

## Шаг 2: Деплой через Blueprint

1. Зайдите на [Render Dashboard](https://dashboard.render.com/)
2. **New** → **Blueprint**
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст все 6 сервисов из `render.yaml`

## Шаг 3: Настройка переменных окружения

После создания сервисов, настройте переменные окружения в каждом сервисе:

### SEO Agent Backend
```
MONGODB_URI=<ваш MongoDB URI>
OPENAI_API_KEY=<ваш OpenAI ключ>
FRONTEND_URL=https://trygo-frontend.onrender.com
SEMANTICS_SERVICE_URL=https://semantics-service.onrender.com
IMAGES_SERVICE_URL=https://images-service.onrender.com
WEBSITE_PAGES_SERVICE_URL=https://website-pages-service.onrender.com
```

### Main Backend
```
MONGODB_URI=<ваш MongoDB URI>
JWT_SECRET=<случайная строка 32+ символов>
FRONTEND_URL=https://trygo-frontend.onrender.com
DEVELOPMENT_FRONTEND_URL=https://trygo-frontend.onrender.com
PRODUCTION_FRONTEND_URL=https://trygo-frontend.onrender.com
GOOGLE_AUTH_CLIENT_ID=<ваш Google Client ID>
GOOGLE_AUTH_CLIENT_SECRET=<ваш Google Client Secret>
```

### Frontend
```
VITE_SERVER_URL=https://trygo-main-backend.onrender.com/graphql
VITE_SEO_AGENT_URL=https://seo-agent-backend.onrender.com/graphql
VITE_WS_SERVER_URL=wss://trygo-main-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=<ваш Google Client ID>
```

### Images Service
```
OPENAI_API_KEY=<ваш OpenAI ключ>
PUBLIC_URL=https://images-service.onrender.com
```

### Website Pages Service
```
OPENAI_API_KEY=<ваш OpenAI ключ>
```

### Semantics Service
```
MONGODB_URI=<ваш MongoDB URI>
SEMANTICS_SERVICE_ORIGIN=https://trygo-frontend.onrender.com
```

## Шаг 4: Проверка

После деплоя проверьте:

- ✅ SEO Agent Backend: `https://seo-agent-backend.onrender.com/health`
- ✅ Main Backend: `https://trygo-main-backend.onrender.com/health`
- ✅ Images Service: `https://images-service.onrender.com/`
- ✅ Website Pages Service: `https://website-pages-service.onrender.com/health`
- ✅ Semantics Service: `https://semantics-service.onrender.com/health`
- ✅ Frontend: `https://trygo-frontend.onrender.com`

## 📝 Важно

- Все сервисы используют `starter` план (можно обновить в Render Dashboard)
- WebSocket использует `wss://` (WebSocket Secure) в production
- После первого деплоя, изменения будут автоматически деплоиться при push в main ветку

## 🔗 Подробная документация

См. [DEPLOY_RENDER.md](./DEPLOY_RENDER.md) для полной документации.

