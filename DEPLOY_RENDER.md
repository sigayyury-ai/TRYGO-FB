# 🚀 Инструкция по деплою на Render

Этот документ описывает процесс деплоя всех сервисов TRYGO на платформу Render.

## 📋 Подготовка

### 1. Создайте MongoDB Atlas базу данных

1. Зайдите на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Создайте новый кластер (бесплатный tier доступен)
3. Создайте пользователя базы данных
4. Получите connection string (MONGODB_URI)

### 2. Получите API ключи

- **OpenAI API Key**: [platform.openai.com](https://platform.openai.com/api-keys)
- **Google OAuth Client ID** (опционально): [Google Cloud Console](https://console.cloud.google.com/)
- **Stripe Keys** (опционально, для подписок): [Stripe Dashboard](https://dashboard.stripe.com/)

## 🔧 Деплой через Render Dashboard

### Вариант 1: Автоматический деплой через render.yaml

1. Зайдите на [Render Dashboard](https://dashboard.render.com/)
2. Нажмите **"New"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий: `https://github.com/sigayyury-ai/TRYGO-FB`
4. Render автоматически обнаружит `render.yaml` и создаст все сервисы

### Вариант 2: Ручной деплой каждого сервиса

#### 1. SEO Agent Backend

1. **New** → **Web Service**
2. Подключите репозиторий
3. Настройки:
   - **Name**: `seo-agent-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=<ваш MongoDB URI>
   OPENAI_API_KEY=<ваш OpenAI API ключ>
   OPENAI_MODEL=gpt-4o-mini
   FRONTEND_URL=<URL вашего фронтенда>
   SEMANTICS_SERVICE_URL=<URL semantics-service>
   IMAGES_SERVICE_URL=<URL images-service>
   WEBSITE_PAGES_SERVICE_URL=<URL website-pages-service>
   IMAGE_PROVIDER=openai
   ```

#### 2. Main Backend (TRYGO-Backend)

1. **New** → **Web Service**
2. Настройки:
   - **Name**: `trygo-main-backend`
   - **Root Directory**: `TRYGO-Backend`
   - **Build Command**: `npm install && npm run build && npm run codegen`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=<ваш MongoDB URI>
   OPENAI_API_KEY=<ваш OpenAI API ключ>
   JWT_SECRET=<случайная строка для JWT>
   FRONTEND_URL=<URL вашего фронтенда>
   ```

#### 3. Frontend

1. **New** → **Static Site**
2. Настройки:
   - **Name**: `trygo-frontend`
   - **Root Directory**: `TRYGO-Front`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:
   ```
   VITE_SERVER_URL=https://trygo-main-backend.onrender.com/graphql
   VITE_SEO_AGENT_URL=https://seo-agent-backend.onrender.com/graphql
   VITE_WS_SERVER_URL=https://trygo-main-backend.onrender.com
   VITE_GOOGLE_CLIENT_ID=<ваш Google Client ID>
   ```

#### 4. Website Pages Service

1. **New** → **Web Service**
2. Настройки:
   - **Name**: `website-pages-service`
   - **Root Directory**: `website-pages-service`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4400
   OPENAI_API_KEY=<ваш OpenAI API ключ>
   ```

#### 5. Semantics Service (если существует)

⚠️ **Внимание**: Убедитесь, что сервис имеет `package.json` и исходный код.

1. **New** → **Web Service**
2. Настройки:
   - **Name**: `semantics-service`
   - **Root Directory**: `semantics-service`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4200
   MONGODB_URI=<ваш MongoDB URI>
   OPENAI_API_KEY=<ваш OpenAI API ключ>
   ```

#### 6. Images Service (если существует)

⚠️ **Внимание**: Убедитесь, что сервис имеет `package.json` и исходный код.

1. **New** → **Web Service**
2. Настройки:
   - **Name**: `images-service`
   - **Root Directory**: `images-service`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4300
   OPENAI_API_KEY=<ваш OpenAI API ключ>
   OPENAI_IMAGE_MODEL=dall-e-2
   ```

## 🔗 Настройка связей между сервисами

После создания всех сервисов, обновите переменные окружения:

1. **В seo-agent-backend**:
   - `SEMANTICS_SERVICE_URL` → `https://semantics-service.onrender.com`
   - `IMAGES_SERVICE_URL` → `https://images-service.onrender.com`
   - `WEBSITE_PAGES_SERVICE_URL` → `https://website-pages-service.onrender.com`
   - `FRONTEND_URL` → `https://trygo-frontend.onrender.com`

2. **В trygo-main-backend**:
   - `FRONTEND_URL` → `https://trygo-frontend.onrender.com`

3. **В trygo-frontend**:
   - `VITE_SERVER_URL` → `https://trygo-main-backend.onrender.com/graphql`
   - `VITE_SEO_AGENT_URL` → `https://seo-agent-backend.onrender.com/graphql`
   - `VITE_WS_SERVER_URL` → `https://trygo-main-backend.onrender.com`

## ✅ Проверка после деплоя

### Health Checks

1. **SEO Agent Backend**: `https://seo-agent-backend.onrender.com/health`
2. **Main Backend**: `https://trygo-main-backend.onrender.com/health` (если есть)
3. **Website Pages Service**: `https://website-pages-service.onrender.com/health` (если есть)

### GraphQL Endpoints

1. **SEO Agent**: `https://seo-agent-backend.onrender.com/graphql`
2. **Main Backend**: `https://trygo-main-backend.onrender.com/graphql`

### Frontend

- **URL**: `https://trygo-frontend.onrender.com`

## 🐛 Troubleshooting

### Проблема: Сервис не запускается

1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что `package.json` содержит правильные скрипты

### Проблема: Frontend не подключается к Backend

1. Проверьте CORS настройки в бэкенде
2. Убедитесь, что `FRONTEND_URL` правильно установлен
3. Проверьте, что URL в `VITE_*` переменных правильные

### Проблема: MongoDB connection error

1. Убедитесь, что MongoDB Atlas разрешает подключения с IP адресов Render
2. В MongoDB Atlas: **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)

## 📝 Важные замечания

1. **Semantics Service и Images Service**: Если эти сервисы не существуют, закомментируйте их в `render.yaml` или удалите из конфигурации.

2. **Порты**: Render автоматически устанавливает порт через переменную `PORT`. Не указывайте порт вручную.

3. **Планы**: Все сервисы настроены на `starter` план. Для production рекомендуется использовать более высокие планы.

4. **Автоматический деплой**: После первого деплоя, Render будет автоматически деплоить при каждом push в `main` ветку.

## 🔐 Безопасность

- Никогда не коммитьте `.env` файлы
- Используйте `sync: false` для секретных переменных
- Регулярно обновляйте зависимости
- Используйте HTTPS для всех сервисов

## 📚 Дополнительные ресурсы

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

