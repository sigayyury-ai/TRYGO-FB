# Google OAuth Setup Guide

## Налаштування Google OAuth для проекту

### 1. Створення Google OAuth Client

1. Перейдіть до [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект або виберіть існуючий
3. Увімкніть Google+ API:
   - Перейдіть до "APIs & Services" > "Library"
   - Знайдіть "Google+ API" та увімкніть його
4. Створіть OAuth 2.0 Client ID:
   - Перейдіть до "APIs & Services" > "Credentials"
   - Натисніть "Create Credentials" > "OAuth client ID"
   - Виберіть "Web application"
   - Додайте авторизовані JavaScript origins:
     - `http://localhost:5173` (для локальної розробки)
     - Ваш продакшн домен
   - Додайте авторизовані redirect URIs:
     - `http://localhost:5173` (для локальної розробки)
     - Ваш продакшн домен

### 2. Налаштування змінних оточення

Створіть файл `.env` у корені проекту (якщо його ще немає):

```bash
# Server URL
VITE_SERVER_URL=your_graphql_server_url_here

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Замініть `your_google_client_id_here` на Client ID, отриманий з Google Cloud Console.

### 3. Backend налаштування

Переконайтеся, що ваш GraphQL backend має mutation `authThrowThirdParty`:

```graphql
mutation AuthThrowThirdParty($input: AuthThrowThirdPartyInput!) {
  authThrowThirdParty(input: $input) {
    user {
      id
      email
      role
      freeTrialDueTo
    }
    token
  }
}
```

Input type:
```graphql
input AuthThrowThirdPartyInput {
  googleIdToken: String
  appleIdToken: String
}
```

### 4. Тестування

1. Запустіть проект: `npm run dev` або `pnpm dev`
2. Перейдіть на сторінку `/auth`
3. Натисніть кнопку "Continue with Google"
4. Виберіть Google акаунт
5. Перевірте, що логін пройшов успішно

### 5. Структура файлів

Реалізація Google OAuth складається з наступних файлів:

- `/src/api/authThrowThirdParty.ts` - GraphQL mutation для OAuth
- `/src/providers/GoogleOAuthProvider/GoogleOAuthProvider.tsx` - Provider для Google OAuth
- `/src/components/icons/GoogleIcon.tsx` - Іконка Google
- `/src/store/useAuthStore.ts` - Додано метод `loginWithGoogle`
- `/src/pages/Auth.tsx` - Додано GoogleLogin компонент (використовує ID token)
- `/src/App.tsx` - Обгорнуто в GoogleOAuthProvider

### 6. Важливо: ID Token vs Access Token

Бекенд використовує `verifyIdToken` від Google, тому фронтенд надсилає **ID token** (credential), а не access token. Компонент `GoogleLogin` автоматично надає ID token через `credentialResponse.credential`.

### 7. Troubleshooting

**Проблема:** "Google Client ID is not configured"
- **Рішення:** Переконайтеся, що змінна `VITE_GOOGLE_CLIENT_ID` додана до `.env` файлу та перезапустіть dev сервер

**Проблема:** "Google login failed"
- **Рішення:** Перевірте, що додали правильні authorized origins в Google Cloud Console

**Проблема:** Backend повертає помилку "Wrong number of segments in token"
- **Рішення:** Ця помилка виникає, якщо замість ID token надсилається access token. Переконайтеся, що використовується компонент `GoogleLogin`, який надає ID token через `credentialResponse.credential`

**Проблема:** Backend повертає помилку
- **Рішення:** Переконайтеся, що mutation `authThrowThirdParty` реалізована на backend та приймає `googleIdToken`

