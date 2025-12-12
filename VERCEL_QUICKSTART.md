# ⚡ Быстрый старт деплоя на Vercel

Краткая инструкция для быстрого деплоя TRYGO на Vercel.

## 🚀 Быстрая установка

### 1. Установите Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 2. Деплой фронтенда

```bash
cd TRYGO-Front
vercel
```

Следуйте инструкциям, выберите:
- Create a new project
- Название: `trygo-frontend`
- Root Directory: `./` (по умолчанию)

### 3. Деплой бэкенда

```bash
cd TRYGO-Backend
vercel
```

Следуйте инструкциям, выберите:
- Create a new project
- Название: `trygo-backend`
- Root Directory: `./` (по умолчанию)

### 4. Настройте переменные окружения

#### Frontend (TRYGO-Front)

В Vercel Dashboard → Settings → Environment Variables добавьте:

```env
VITE_SERVER_URL=https://trygo-backend.vercel.app/graphql
VITE_WS_SERVER_URL=wss://trygo-backend.vercel.app
VITE_SEO_AGENT_URL=https://trygo-backend.vercel.app/graphql
```

#### Backend (TRYGO-Backend)

В Vercel Dashboard → Settings → Environment Variables добавьте:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://trygo-frontend.vercel.app
CORS_ENABLED=true
PRODUCTION_FRONTEND_URL=https://trygo-frontend.vercel.app
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

### 5. Передеплойте проекты

```bash
# Frontend
cd TRYGO-Front
vercel --prod

# Backend
cd TRYGO-Backend
vercel --prod
```

## ✅ Проверка

1. Откройте фронтенд: `https://trygo-frontend.vercel.app`
2. Проверьте health check: `https://trygo-backend.vercel.app/health`
3. Проверьте GraphQL: `https://trygo-backend.vercel.app/graphql`

## ⚠️ Важные замечания

1. **Socket.io не работает** на Vercel - используйте polling или отдельный сервис
2. **Agenda Jobs** нужно настроить через Vercel Cron Jobs
3. **Storage** должен быть на S3 или другом cloud storage
4. **Максимальное время выполнения**: 30 секунд (Hobby план)

## 📚 Подробная документация

См. [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) для полной документации.
