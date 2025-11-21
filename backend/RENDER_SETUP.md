# ⚙️ Настройки для Render Dashboard

## 📋 Команды для настройки в Render

### Основные настройки:

1. **Root Directory**: 
   ```
   backend
   ```

2. **Build Command**:
   ```
   npm install && npm run build
   ```

3. **Start Command**:
   ```
   npm start
   ```

### Альтернативный вариант (если первый не работает):

**Build Command**:
```
npm ci && npm run build
```

Или используйте готовый скрипт:
```
npm run render-build
```

## 🔧 Пошаговая инструкция:

1. Зайдите в Render Dashboard → ваш сервис → **Settings**

2. В разделе **Build & Deploy** укажите:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. В разделе **Environment** добавьте переменные:

### Обязательные переменные:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
OPENAI_API_KEY=sk-your-openai-api-key-here
FRONTEND_URL=https://your-frontend-url.com
```

### Опциональные (имеют значения по умолчанию):
```
NODE_ENV=production
OPENAI_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-2
SEMANTICS_SERVICE_URL=http://localhost:4200
IMAGES_SERVICE_URL=http://localhost:4300
WEBSITE_PAGES_SERVICE_URL=http://localhost:4400
IMAGE_PROVIDER=openai
```

### WordPress (опционально):
```
WORDPRESS_BASE_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

## ⚠️ Важно:

- **PORT** устанавливается Render автоматически - НЕ добавляйте его вручную
- Убедитесь, что **Root Directory** указан как `backend` (без слешей)
- После изменения настроек нажмите **Save Changes** и запустите **Manual Deploy**

## 🔍 Проверка после деплоя:

1. Health endpoint: `https://your-service.onrender.com/`
2. GraphQL endpoint: `https://your-service.onrender.com/graphql`
3. Проверьте логи в разделе **Logs**

