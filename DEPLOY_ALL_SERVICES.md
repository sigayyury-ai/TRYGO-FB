# 🚀 Инструкция по деплою всех сервисов на Render

## 📋 Обзор сервисов

В проекте есть несколько сервисов, которые нужно задеплоить:

1. **Backend** (GraphQL API) - `backend/`
2. **Frontend** (React SPA) - `TRYGO-Front/`
3. **Website Pages Service** - `website-pages-service/`

## 🔧 Настройка деплоя

### Вариант 1: Автоматический деплой через render.yaml

Файл `render.yaml` в корне репозитория содержит конфигурацию всех сервисов.

1. Зайдите в Render Dashboard
2. Нажмите **New** → **Blueprint**
3. Подключите репозиторий
4. Render автоматически создаст все сервисы из `render.yaml`

### Вариант 2: Ручной деплой каждого сервиса

#### 1. Backend (GraphQL API)

**Настройки:**
- **Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Переменные окружения:**
```
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://your-frontend.onrender.com
WEBSITE_PAGES_SERVICE_URL=https://website-pages-service.onrender.com
```

#### 2. Frontend (React SPA)

**Настройки:**
- **Type**: Static Site
- **Root Directory**: `TRYGO-Front`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Переменные окружения:**
```
VITE_API_URL=https://seo-agent-backend.onrender.com
```

#### 3. Website Pages Service

**Настройки:**
- **Type**: Web Service
- **Root Directory**: `website-pages-service`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Переменные окружения:**
```
OPENAI_API_KEY=sk-...
PORT=4400
```

## 🔗 Связывание сервисов

После деплоя всех сервисов нужно обновить переменные окружения:

1. **Backend** → `FRONTEND_URL`: URL фронтенда
2. **Backend** → `WEBSITE_PAGES_SERVICE_URL`: URL website-pages-service
3. **Frontend** → `VITE_API_URL`: URL бекенда

## 📝 Порядок деплоя

1. **Сначала**: Website Pages Service (независимый сервис)
2. **Затем**: Backend (зависит от Website Pages Service)
3. **Последний**: Frontend (зависит от Backend)

## ⚠️ Важно

- После деплоя каждого сервиса скопируйте его URL
- Обновите переменные окружения в зависимых сервисах
- Запустите Manual Deploy после изменения переменных окружения

## 🔍 Проверка после деплоя

1. **Backend**: `https://seo-agent-backend.onrender.com/`
2. **Frontend**: `https://seo-agent-frontend.onrender.com`
3. **Website Pages Service**: `https://website-pages-service.onrender.com/`

