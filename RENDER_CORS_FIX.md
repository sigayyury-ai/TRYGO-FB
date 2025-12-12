# 🔧 Исправление CORS и Google OAuth на Render

## Проблема 1: CORS ошибка

**Ошибка:** `Access to fetch at 'https://trygo-main-backend.onrender.com/graphql' from origin 'https://trygo-frontend.onrender.com' has been blocked by CORS policy`

### Решение:

1. Откройте Render Dashboard: https://dashboard.render.com/
2. Найдите сервис: **trygo-main-backend**
3. Перейдите в раздел **Environment**
4. Проверьте и обновите следующие переменные (должны содержать полный URL с `https://`):

```
CORS_ENABLED=true
FRONTEND_URL=https://trygo-frontend.onrender.com
DEVELOPMENT_FRONTEND_URL=https://trygo-frontend.onrender.com
PRODUCTION_FRONTEND_URL=https://trygo-frontend.onrender.com
```

**⚠️ ВАЖНО:** 
- URL должны начинаться с `https://`
- Не должно быть слеша в конце (`/`)
- После изменения переменных нужно перезапустить сервис

5. После обновления переменных, перезапустите сервис через Render Dashboard

---

## Проблема 2: Google OAuth (403)

**Ошибка:** `The given origin is not allowed for the given client ID`

### Решение:

1. Откройте Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Найдите OAuth 2.0 Client ID: `972667881235-rn1s9p2iovqtiq34r3q18hen3rhs8lf0`
3. Нажмите на него для редактирования
4. В разделе **Authorized JavaScript origins** добавьте:
   ```
   https://trygo-frontend.onrender.com
   ```
5. В разделе **Authorized redirect URIs** (если используется) добавьте:
   ```
   https://trygo-frontend.onrender.com
   ```
6. Сохраните изменения

**⚠️ ВАЖНО:**
- Изменения в Google Cloud Console могут вступить в силу через несколько минут
- Убедитесь, что используете правильный Client ID

---

## Проверка после исправления:

1. Проверьте логи бэкенда в Render Dashboard - должно быть:
   ```
   🌐 CORS enabled for origins: [ 'https://trygo-frontend.onrender.com' ]
   ```

2. Откройте фронтенд: https://trygo-frontend.onrender.com
3. Откройте DevTools (F12) → Console
4. Ошибки CORS и OAuth должны исчезнуть
