# 🚀 Команды для деплоя на Render

## 📋 Быстрый старт

### 1. Автоматический деплой через Blueprint (рекомендуется)

1. Зайдите на [Render Dashboard](https://dashboard.render.com/)
2. Нажмите **"New"** → **"Blueprint"**
3. Подключите GitHub репозиторий: `https://github.com/sigayyury-ai/TRYGO-FB`
4. Render автоматически обнаружит `render.yaml` и создаст все сервисы

---

## 🔧 Ручной деплой каждого сервиса

### Сервис 1: SEO Agent Backend

**Тип:** Web Service  
**Настройки:**

```
Name: seo-agent-backend
Environment: Node
Region: Frankfurt (или ближайший к вам)
Branch: main
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
```

**Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=<ваш MongoDB URI>
OPENAI_API_KEY=<ваш OpenAI API ключ>
OPENAI_MODEL=gpt-4o-mini
FRONTEND_URL=<будет установлен после деплоя фронтенда>
SEMANTICS_SERVICE_URL=http://localhost:4200
IMAGES_SERVICE_URL=http://localhost:4300
WEBSITE_PAGES_SERVICE_URL=<будет установлен после деплоя website-pages-service>
IMAGE_PROVIDER=openai
```

---

### Сервис 2: Main Backend (TRYGO-Backend)

**Тип:** Web Service  
**Настройки:**

```
Name: trygo-main-backend
Environment: Node
Region: Frankfurt
Branch: main
Root Directory: TRYGO-Backend
Build Command: npm install && npm run build && npm run codegen
Start Command: npm start
```

**Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=<ваш MongoDB URI>
OPENAI_API_KEY=<ваш OpenAI API ключ>
JWT_SECRET=<случайная строка, минимум 32 символа>
FRONTEND_URL=<будет установлен после деплоя фронтенда>
```

**Опционально (для подписок):**
```
STRIPE_SECRET_KEY=<ваш Stripe Secret Key>
STRIPE_WEBHOOK_SECRET=<ваш Stripe Webhook Secret>
```

**Опционально (для OAuth):**
```
GOOGLE_CLIENT_ID=<ваш Google Client ID>
GOOGLE_CLIENT_SECRET=<ваш Google Client Secret>
```

---

### Сервис 3: Frontend

**Тип:** Static Site  
**Настройки:**

```
Name: trygo-frontend
Environment: Static Site
Region: Frankfurt
Branch: main
Root Directory: TRYGO-Front
Build Command: npm install && npm run build
Publish Directory: dist
```

**Environment Variables:**
```
VITE_SERVER_URL=https://trygo-main-backend.onrender.com/graphql
VITE_SEO_AGENT_URL=https://seo-agent-backend.onrender.com/graphql
VITE_WS_SERVER_URL=https://trygo-main-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=<ваш Google OAuth Client ID>
```

**⚠️ ВАЖНО:** После деплоя бэкендов, обновите URL в этих переменных на реальные URL ваших сервисов.

---

### Сервис 4: Website Pages Service

**Тип:** Web Service  
**Настройки:**

```
Name: website-pages-service
Environment: Node
Region: Frankfurt
Plan: Starter
Branch: main
Root Directory: website-pages-service
Build Command: npm install && npm run build
Start Command: npm start
```

**Environment Variables:**
```
NODE_ENV=production
PORT=4400
OPENAI_API_KEY=<ваш OpenAI API ключ>
```

---

## 🔗 Настройка связей между сервисами

После деплоя всех сервисов, обновите переменные окружения:

### В seo-agent-backend:

```
FRONTEND_URL=https://trygo-frontend.onrender.com
WEBSITE_PAGES_SERVICE_URL=https://website-pages-service.onrender.com
SEMANTICS_SERVICE_URL=http://localhost:4200  # или URL вашего сервиса
IMAGES_SERVICE_URL=http://localhost:4300  # или URL вашего сервиса
```

### В trygo-main-backend:

```
FRONTEND_URL=https://trygo-frontend.onrender.com
```

### В trygo-frontend:

Обновите URL после получения реальных адресов:

```
VITE_SERVER_URL=https://trygo-main-backend.onrender.com/graphql
VITE_SEO_AGENT_URL=https://seo-agent-backend.onrender.com/graphql
VITE_WS_SERVER_URL=https://trygo-main-backend.onrender.com
```

---

## 📝 Генерация JWT_SECRET

Для `JWT_SECRET` используйте случайную строку:

**В терминале:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Или используйте онлайн генератор: https://randomkeygen.com/

---

## ✅ Проверка после деплоя

### Health Checks:

1. **SEO Agent Backend:**
   ```
   https://seo-agent-backend.onrender.com/health
   ```

2. **Main Backend:**
   ```
   https://trygo-main-backend.onrender.com/health
   ```
   (если есть health endpoint)

3. **Website Pages Service:**
   ```
   https://website-pages-service.onrender.com/health
   ```
   (если есть health endpoint)

### GraphQL Endpoints:

1. **SEO Agent:**
   ```
   https://seo-agent-backend.onrender.com/graphql
   ```

2. **Main Backend:**
   ```
   https://trygo-main-backend.onrender.com/graphql
   ```

### Frontend:

```
https://trygo-frontend.onrender.com
```

---

## 🐛 Troubleshooting

### Проблема: Build failed

**Решение:**
1. Проверьте логи в Render Dashboard
2. Убедитесь, что `package.json` содержит правильные скрипты
3. Проверьте, что все зависимости указаны в `package.json`

### Проблема: Service не запускается

**Решение:**
1. Проверьте логи в разделе "Logs"
2. Убедитесь, что все обязательные переменные окружения установлены
3. Проверьте, что `MONGODB_URI` правильный и доступен

### Проблема: Frontend не подключается к Backend

**Решение:**
1. Проверьте CORS настройки в бэкенде
2. Убедитесь, что `FRONTEND_URL` правильно установлен в бэкенде
3. Проверьте, что URL в `VITE_*` переменных правильные и используют HTTPS

### Проблема: MongoDB connection error

**Решение:**
1. В MongoDB Atlas: **Network Access** → **Add IP Address**
2. Добавьте: `0.0.0.0/0` (Allow Access from Anywhere)
3. Или добавьте конкретные IP адреса Render

---

## 🔐 Безопасность

- ✅ Никогда не коммитьте `.env` файлы
- ✅ Используйте `sync: false` для секретных переменных
- ✅ Регулярно обновляйте зависимости
- ✅ Используйте HTTPS для всех сервисов
- ✅ Генерируйте сильные JWT_SECRET (минимум 32 символа)

---

## 📚 Полезные ссылки

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)

---

## 🎯 Порядок деплоя (рекомендуемый)

1. **Сначала:** MongoDB Atlas (создайте базу данных)
2. **Затем:** Main Backend (trygo-main-backend)
3. **Затем:** SEO Agent Backend (seo-agent-backend)
4. **Затем:** Website Pages Service
5. **Затем:** Frontend (последним, так как ему нужны URL бэкендов)
6. **В конце:** Обновите все переменные окружения с реальными URL

---

## 💡 Советы

- Используйте один и тот же `MONGODB_URI` для всех сервисов
- Сохраните все URL сервисов в отдельном файле для быстрого доступа
- Настройте автоматический деплой при push в `main` ветку
- Используйте Environment Groups в Render для общих переменных

