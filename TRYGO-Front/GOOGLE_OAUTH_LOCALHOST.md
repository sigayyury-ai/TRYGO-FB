# Настройка Google OAuth для localhost

## Проблема

При запуске на localhost:8080 вы видите ошибку:
```
Failed to load resource: the server responded with a status of 403
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

**Причина**: Google OAuth Client ID не настроен для работы с `http://localhost:8080`

## Решение 1: Добавить localhost в Google Cloud Console (рекомендуется)

### Шаги:

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект с Client ID: `972667881235-rn1s9p2iovqtiq34r3q18hen3rhs8lf0`
3. Перейдите в **APIs & Services** → **Credentials**
4. Найдите OAuth 2.0 Client ID
5. Нажмите **Edit**
6. В разделе **Authorized JavaScript origins** добавьте:
   - `http://localhost:8080`
   - `http://localhost:5173` (если используете другой порт)
   - `http://127.0.0.1:8080`
7. В разделе **Authorized redirect URIs** добавьте те же URL
8. Сохраните изменения

### После настройки:
- Перезапустите dev server
- Google OAuth должен заработать

## Решение 2: Использовать Email/Password авторизацию (для разработки)

Пока Google OAuth не настроен, можно использовать обычную email/password форму:

1. На странице `/auth` есть таб **Sign In**
2. Используйте email и password для входа
3. Это не требует Google OAuth

## Решение 3: Временно отключить Google OAuth (только для разработки)

Если нужно работать без Google OAuth, можно временно отключить:

### Вариант A: Комментировать в Auth.tsx

```typescript
// Временно закомментировать GoogleLogin компоненты
{/* <GoogleLogin ... /> */}
```

### Вариант B: Проверка окружения в GoogleOAuthProvider

Можно модифицировать `GoogleOAuthProvider.tsx`:

```typescript
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

if (!clientId || isLocalhost) {
  console.warn('Google OAuth disabled for localhost');
  return <>{children}</>;
}
```

## Текущая ситуация

**Что работает:**
- ✅ Email/Password авторизация должна работать
- ✅ Основная функциональность приложения
- ✅ Все маршруты и компоненты

**Что НЕ работает:**
- ❌ Google OAuth кнопка (ошибка 403)
- Но это не блокирует использование приложения

## Рекомендация

**Для разработки SEO Agent:**
- Можно использовать Email/Password авторизацию
- Или настроить Google OAuth для localhost (5 минут работы)
- Google OAuth не критичен для разработки функциональности

**Для продакшена:**
- Google OAuth уже настроен для production домена
- Локальная разработка не влияет на production

## Следующие шаги

1. Попробуйте войти через Email/Password форму
2. После входа вы попадете на Dashboard
3. Можете начинать разработку SEO Agent
4. Google OAuth можно настроить позже или работать без него

