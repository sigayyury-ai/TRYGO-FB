# 🚀 Деплой на Vercel - Инструкция

Этот документ описывает процесс деплоя фронтенда и бэкенда TRYGO на Vercel.

## 📋 Оглавление

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Ограничения Vercel](#ограничения-vercel)
3. [Подготовка к деплою](#подготовка-к-деплою)
4. [Деплой фронтенда](#деплой-фронтенда)
5. [Деплой бэкенда](#деплой-бэкенда)
6. [Настройка переменных окружения](#настройка-переменных-окружения)
7. [Мониторинг и отладка](#мониторинг-и-отладка)

---

## 🏗️ Обзор архитектуры

### Структура проекта

```
TRYGO/
├── TRYGO-Front/          # React + Vite фронтенд
│   ├── vercel.json       # Конфигурация Vercel для фронтенда
│   └── package.json
│
└── TRYGO-Backend/        # Node.js + Express + Apollo Server бэкенд
    ├── api/
    │   └── index.ts      # Vercel serverless function adapter
    ├── vercel.json       # Конфигурация Vercel для бэкенда
    └── package.json
```

### Подход к деплою

**Рекомендуется:** Два отдельных проекта в Vercel
- **Frontend Project**: Статический сайт (Vite build)
- **Backend Project**: Serverless функции (Express + Apollo Server)

**Альтернатива:** Один проект с монорепо структурой (более сложная настройка)

---

## ⚠️ Ограничения Vercel

### Критические ограничения

1. **Socket.io / WebSocket не поддерживается**
   - Vercel serverless функции не поддерживают постоянные WebSocket соединения
   - Socket.io функциональность **НЕ БУДЕТ РАБОТАТЬ** на Vercel
   - **Решение:** Использовать альтернативные подходы:
     - Polling вместо WebSocket
     - Отдельный сервис для Socket.io (например, на Render, Railway, или AWS)
     - Server-Sent Events (SSE) для односторонней коммуникации

2. **Agenda Jobs (Cron задачи)**
   - Agenda требует постоянного процесса, что несовместимо с serverless
   - **Решение:** Использовать Vercel Cron Jobs или внешний сервис для cron задач

3. **Файловое хранилище**
   - Локальное хранилище (`./storage`) не будет работать в serverless окружении
   - **Решение:** Использовать S3 или другой cloud storage

4. **Время выполнения функций**
   - Максимальное время выполнения: 30 секунд (Hobby), 60 секунд (Pro)
   - Долгие операции могут таймаутить

### Что работает

✅ GraphQL API (Apollo Server)  
✅ REST API endpoints  
✅ Express middleware  
✅ MongoDB подключения  
✅ Статический фронтенд  
✅ Environment variables  

---

## 🔧 Подготовка к деплою

### 1. Установка Vercel CLI

```bash
npm install -g vercel
```

### 2. Авторизация

```bash
vercel login
```

### 3. Проверка зависимостей

Убедитесь, что в `TRYGO-Backend/package.json` есть:

```json
{
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "@types/node": "^20.11.30"
  }
}
```

Если нет, установите:

```bash
cd TRYGO-Backend
npm install --save-dev @vercel/node @types/node
```

---

## 🎨 Деплой фронтенда

### Вариант 1: Через Vercel CLI

```bash
cd TRYGO-Front
vercel
```

Следуйте инструкциям:
- Выберите "Create a new project"
- Укажите название проекта (например, `trygo-frontend`)
- Root Directory: `./` (оставьте по умолчанию)
- Build Command: `npm run build` (автоматически определится)
- Output Directory: `dist` (автоматически определится)

### Вариант 2: Через GitHub Integration

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "Add New Project"
3. Импортируйте репозиторий
4. Настройки проекта:
   - **Framework Preset**: Vite
   - **Root Directory**: `TRYGO-Front`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Конфигурация (vercel.json)

Файл `TRYGO-Front/vercel.json` уже настроен:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🔌 Деплой бэкенда

### Вариант 1: Через Vercel CLI

```bash
cd TRYGO-Backend
vercel
```

Следуйте инструкциям:
- Выберите "Create a new project"
- Укажите название проекта (например, `trygo-backend`)
- Root Directory: `./` (оставьте по умолчанию)
- Build Command: `npm run build` (опционально, для TypeScript)
- Output Directory: не требуется (serverless функции)

### Вариант 2: Через GitHub Integration

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "Add New Project"
3. Импортируйте репозиторий
4. Настройки проекта:
   - **Framework Preset**: Other
   - **Root Directory**: `TRYGO-Backend`
   - **Build Command**: `npm run build` (для компиляции TypeScript)
   - **Output Directory**: оставьте пустым
   - **Install Command**: `npm install`

### Структура API handler

Vercel автоматически обнаружит файл `TRYGO-Backend/api/index.ts` и создаст serverless функцию.

Конфигурация в `TRYGO-Backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/graphql",
      "dest": "/api/index.ts"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/health",
      "dest": "/api/index.ts"
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### Важные замечания для бэкенда

1. **Socket.io отключен**: Код Socket.io не будет выполняться в serverless окружении
2. **Agenda Jobs**: Cron задачи нужно настроить через Vercel Cron Jobs
3. **Storage**: Используйте S3 или другой cloud storage вместо локального `./storage`

---

## 🔐 Настройка переменных окружения

### Frontend переменные (TRYGO-Front)

В настройках проекта Vercel добавьте:

```env
VITE_SERVER_URL=https://your-backend.vercel.app/graphql
VITE_WS_SERVER_URL=wss://your-backend.vercel.app  # Не будет работать, но нужно для совместимости
VITE_SEO_AGENT_URL=https://your-seo-agent.vercel.app/graphql  # Если SEO Agent отдельно
```

### Backend переменные (TRYGO-Backend)

В настройках проекта Vercel добавьте:

#### Обязательные

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

#### CORS настройки

```env
CORS_ENABLED=true
PRODUCTION_FRONTEND_URL=https://your-frontend.vercel.app
DEVELOPMENT_FRONTEND_URL=http://localhost:8080
```

#### Stripe (если используется)

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
```

#### OpenAI / Gemini (для AI функций)

```env
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=your_gemini_key
GOOGLE_API_KEY=your_google_key
```

#### Image Generation

```env
IMAGE_PROVIDER=gemini
GEMINI_IMAGE_MODEL=imagen-4.0-generate-001
PUBLIC_URL=https://your-backend.vercel.app
```

#### Storage (S3 или другой)

```env
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

#### Дополнительные (опционально)

```env
TG_ENABLED=false
TG_TOKEN_STATISTICS=your_telegram_token
TG_CHAT_ID_STATISTICS=your_chat_id
```

### Как добавить переменные в Vercel

1. Зайдите в настройки проекта на Vercel
2. Перейдите в раздел "Environment Variables"
3. Добавьте каждую переменную:
   - **Key**: название переменной (например, `MONGODB_URI`)
   - **Value**: значение переменной
   - **Environment**: выберите `Production`, `Preview`, `Development` (или все)

---

## 📊 Мониторинг и отладка

### Просмотр логов

#### Через Vercel Dashboard

1. Зайдите в проект на Vercel
2. Перейдите в раздел "Deployments"
3. Выберите нужный деплой
4. Нажмите "View Function Logs" для бэкенда

#### Через Vercel CLI

```bash
# Логи фронтенда
cd TRYGO-Front
vercel logs

# Логи бэкенда
cd TRYGO-Backend
vercel logs
```

### Тестирование endpoints

После деплоя проверьте:

1. **Health check**:
   ```bash
   curl https://your-backend.vercel.app/health
   ```

2. **GraphQL endpoint**:
   ```bash
   curl -X POST https://your-backend.vercel.app/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ __typename }"}'
   ```

3. **Frontend**:
   Откройте в браузере: `https://your-frontend.vercel.app`

### Отладка проблем

#### Проблема: "Function timeout"

**Причина**: Функция выполняется дольше 30 секунд

**Решение**:
- Оптимизируйте запросы к базе данных
- Используйте индексы MongoDB
- Разбейте большие операции на меньшие
- Увеличьте `maxDuration` в `vercel.json` (требует Pro план)

#### Проблема: "Module not found"

**Причина**: Зависимости не установлены или путь неправильный

**Решение**:
- Проверьте `package.json` и убедитесь, что все зависимости указаны
- Проверьте пути импортов в `api/index.ts`
- Убедитесь, что `node_modules` не в `.gitignore` (Vercel установит их сам)

#### Проблема: "MongoDB connection failed"

**Причина**: Неправильный connection string или сетевые ограничения

**Решение**:
- Проверьте `MONGODB_URI` в переменных окружения
- Убедитесь, что MongoDB Atlas разрешает подключения с IP Vercel (0.0.0.0/0 для теста)
- Проверьте логи на Vercel для деталей ошибки

#### Проблема: "CORS error"

**Причина**: CORS не настроен правильно

**Решение**:
- Проверьте `FRONTEND_URL` в переменных окружения бэкенда
- Убедитесь, что `CORS_ENABLED=true`
- Проверьте `PRODUCTION_PORTS` в конфигурации

---

## 🔄 Обновление деплоя

### Автоматический деплой

Если проект подключен к GitHub, Vercel автоматически деплоит при каждом push в основную ветку.

### Ручной деплой

```bash
# Фронтенд
cd TRYGO-Front
vercel --prod

# Бэкенд
cd TRYGO-Backend
vercel --prod
```

### Превью деплои

Для каждой ветки и pull request Vercel создает preview deployment:

```bash
vercel  # Создает preview deployment
```

---

## 📝 Чеклист перед деплоем

- [ ] Все зависимости установлены (`npm install`)
- [ ] TypeScript компилируется без ошибок (`npm run build`)
- [ ] Переменные окружения настроены в Vercel
- [ ] MongoDB доступна из интернета (Atlas или другой)
- [ ] CORS настроен правильно
- [ ] Socket.io функциональность отключена или заменена
- [ ] Agenda jobs настроены через Vercel Cron или внешний сервис
- [ ] Storage настроен (S3 или другой cloud storage)
- [ ] Health check endpoint работает
- [ ] GraphQL endpoint доступен

---

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи в Vercel Dashboard
2. Проверьте документацию Vercel: https://vercel.com/docs
3. Проверьте документацию Apollo Server: https://www.apollographql.com/docs/apollo-server/
4. Проверьте документацию Express на Vercel: https://vercel.com/docs/functions/serverless-functions/runtimes/node-js

---

## 📚 Дополнительные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Apollo Server Deployment](https://www.apollographql.com/docs/apollo-server/deployment/)
- [Express on Vercel](https://vercel.com/guides/express)

---

**Последнее обновление**: 2024
