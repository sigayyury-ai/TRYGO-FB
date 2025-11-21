# 🚀 Быстрый деплой всех сервисов на Render

## 📋 Что будет задеплоено:

1. ✅ **Backend** (GraphQL API) - `seo-agent-backend`
2. ✅ **Frontend** (React UI) - `seo-agent-frontend`  
3. ✅ **Website Pages Service** - `website-pages-service`

## 🎯 Способ 1: Автоматический деплой через Blueprint (рекомендуется)

1. Зайдите в Render Dashboard
2. Нажмите **New** → **Blueprint**
3. Подключите репозиторий: `sigayyury-ai/SEO-AGENT`
4. Выберите ветку: `001-openapi-content-ideas`
5. Render автоматически обнаружит `render.yaml` и создаст все 3 сервиса
6. После создания сервисов добавьте переменные окружения (см. ниже)

## 🔧 Способ 2: Ручной деплой каждого сервиса

### Шаг 1: Website Pages Service (сначала, так как от него зависит бекенд)

**Настройки:**
- **Type**: Web Service
- **Name**: `website-pages-service`
- **Root Directory**: `website-pages-service`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Переменные окружения:**
```
OPENAI_API_KEY=sk-your-openai-key-here
PORT=4400
NODE_ENV=production
```

**После деплоя**: Скопируйте URL сервиса (например: `https://website-pages-service.onrender.com`)

---

### Шаг 2: Backend (GraphQL API)

**Настройки:**
- **Type**: Web Service
- **Name**: `seo-agent-backend`
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Переменные окружения:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-2
FRONTEND_URL=https://seo-agent-frontend.onrender.com
WEBSITE_PAGES_SERVICE_URL=https://website-pages-service.onrender.com
NODE_ENV=production
```

**После деплоя**: Скопируйте URL бекенда (например: `https://seo-agent-backend.onrender.com`)

---

### Шаг 3: Frontend (React UI)

**Настройки:**
- **Type**: Static Site
- **Name**: `seo-agent-frontend`
- **Root Directory**: `TRYGO-Front`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Переменные окружения:**
```
VITE_SERVER_URL=https://seo-agent-backend.onrender.com
VITE_WS_SERVER_URL=https://seo-agent-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id (если используется)
```

## ⚠️ Важные моменты:

1. **Порядок деплоя важен**: Website Pages → Backend → Frontend
2. После деплоя каждого сервиса обновите URL в зависимых сервисах
3. Для фронтенда используйте **Static Site**, а не Web Service
4. Все переменные окружения должны быть установлены до первого билда

## 🔗 После деплоя:

1. Проверьте все сервисы:
   - Backend: `https://seo-agent-backend.onrender.com/`
   - Frontend: `https://seo-agent-frontend.onrender.com`
   - Website Pages: `https://website-pages-service.onrender.com/`

2. Обновите переменные окружения в бекенде:
   - `FRONTEND_URL` = URL фронтенда
   - `WEBSITE_PAGES_SERVICE_URL` = URL website-pages-service

3. Обновите переменные окружения во фронтенде:
   - `VITE_SERVER_URL` = URL бекенда
   - `VITE_WS_SERVER_URL` = URL бекенда

4. После обновления переменных запустите **Manual Deploy** для каждого сервиса

## ✅ Готово!

После успешного деплоя всех сервисов у вас будет:
- ✅ Работающий бекенд API
- ✅ Работающий фронтенд UI
- ✅ Работающий Website Pages Service

