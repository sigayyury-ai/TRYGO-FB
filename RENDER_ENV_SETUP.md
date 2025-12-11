# 🔐 Настройка переменных окружения для Render

## 📋 Для сервиса: `trygo-main-backend`

### ✅ ОБЯЗАТЕЛЬНЫЕ переменные

Эти переменные **необходимы** для работы приложения:

| Переменная | Описание | Как получить |
|-----------|----------|--------------|
| `MONGODB_URI` | Connection string для MongoDB Atlas | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Clusters → Connect → Connection String |
| `OPENAI_API_KEY` | API ключ OpenAI для генерации контента | [OpenAI Platform](https://platform.openai.com/api-keys) → Create new secret key |
| `JWT_SECRET` | Секретный ключ для JWT токенов (минимум 32 символа) | Сгенерируйте случайную строку: `openssl rand -base64 32` или используйте [генератор](https://randomkeygen.com/) |
| `GOOGLE_AUTH_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_AUTH_CLIENT_SECRET` | Google OAuth Client Secret | Там же, где Client ID |

---

### 🔧 ОПЦИОНАЛЬНЫЕ переменные

Эти переменные нужны только если используете соответствующие функции:

#### 💳 Stripe (для подписок)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `STRIPE_SECRET_KEY` | Stripe Secret Key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | Price ID для Starter подписки | Stripe Dashboard → Products → Create Price → скопируйте Price ID |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID для Pro подписки | То же самое |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret для обработки событий | Stripe Dashboard → Developers → Webhooks → Add endpoint → скопируйте Signing secret |

#### 🖼️ Генерация изображений (Google Gemini/Imagen)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `GEMINI_API_KEY` | API ключ Google Gemini | [Google AI Studio](https://makersuite.google.com/app/apikey) → Create API Key |
| `GOOGLE_API_KEY` | Альтернативный Google API ключ | То же самое (можно использовать тот же ключ) |

#### 📧 Email (Mailtrap)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `MAILT_API_KEY` | Mailtrap API ключ | [Mailtrap](https://mailtrap.io/) → Settings → API Tokens |
| `MAILT_EMAIL_ADDRESS` | Email адрес отправителя | Ваш email |
| `MAILT_FROM_NAME` | Имя отправителя | Например: "TRYGO Platform" |

#### ☁️ AWS S3 (для хранения файлов)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `AWS_ACCESS_KEY` | AWS Access Key ID | [AWS Console](https://console.aws.amazon.com/) → IAM → Users → Security credentials → Create access key |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | Там же |
| `AWS_REGION` | AWS регион | Например: `us-east-1`, `eu-west-1` |
| `AWS_BUCKET_NAME` | Имя S3 bucket | AWS Console → S3 → Create bucket → имя bucket |

#### 📱 Telegram (для уведомлений)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `TG_TOKEN_STATISTICS` | Telegram Bot Token | [@BotFather](https://t.me/botfather) → /newbot → скопируйте token |
| `TG_CHAT_ID_STATISTICS` | Chat ID для статистики | Отправьте сообщение боту, затем: `https://api.telegram.org/bot<TOKEN>/getUpdates` → найдите `chat.id` |
| `TG_CHAT_ID_ERROR` | Chat ID для ошибок | То же самое (можно использовать тот же chat) |
| `TG_ENABLED` | Включить/выключить Telegram | `true` или `false` |

#### 🔒 Безопасность
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `BOUNCER_CHECK_API_KEY` | API ключ для проверки email | [Bouncer](https://bouncer.email/) или другой email validation сервис |

#### 📝 WordPress (для публикации)
| Переменная | Описание | Где получить |
|-----------|----------|--------------|
| `WORDPRESS_BASE_URL` | URL вашего WordPress сайта | Например: `https://yoursite.com` |
| `WORDPRESS_USERNAME` | WordPress username | Ваш WordPress логин |
| `WORDPRESS_APP_PASSWORD` | WordPress Application Password | WordPress Dashboard → Users → Your Profile → Application Passwords → Create |

#### 🔗 Другие сервисы
| Переменная | Описание | Примечание |
|-----------|----------|------------|
| `IMAGES_SERVICE_URL` | URL сервиса изображений | Не нужен (интегрирован в backend) - можно оставить пустым или удалить |

---

### ⚙️ АВТОМАТИЧЕСКИЕ переменные

Эти переменные устанавливаются Render автоматически (не нужно заполнять):

- `NODE_ENV` = `production` ✅
- `CORS_ENABLED` = `true` ✅
- `FRONTEND_URL` - автоматически из `trygo-frontend` ✅
- `DEVELOPMENT_FRONTEND_URL` - автоматически из `trygo-frontend` ✅
- `PRODUCTION_FRONTEND_URL` - автоматически из `trygo-frontend` ✅
- `PUBLIC_URL` - автоматически из `trygo-main-backend` ✅
- `STORAGE_ROOT` = `./storage` ✅
- `IMAGE_PROVIDER` = `gemini` ✅
- `GEMINI_IMAGE_MODEL` = `imagen-4.0-generate-001` ✅
- `GEMINI_API_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta` ✅

---

## 📋 Для сервиса: `trygo-frontend`

### ✅ ОБЯЗАТЕЛЬНЫЕ переменные

**⚠️ ВАЖНО:** URL бэкенда вы узнаете только ПОСЛЕ деплоя `trygo-main-backend`. 
Сначала установите placeholder значения, затем обновите их после деплоя.

| Переменная | Описание | Начальное значение (placeholder) |
|-----------|----------|----------------------------------|
| `VITE_SERVER_URL` | GraphQL endpoint основного бэкенда | `https://trygo-main-backend.onrender.com/graphql` (замените на реальный URL после деплоя) |
| `VITE_SEO_AGENT_URL` | GraphQL endpoint для SEO Agent | `https://trygo-main-backend.onrender.com/graphql` (тот же URL, так как интегрирован) |
| `VITE_WS_SERVER_URL` | WebSocket URL для real-time обновлений | `wss://trygo-main-backend.onrender.com` (замените на реальный URL после деплоя) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (тот же что в backend) | [Google Cloud Console](https://console.cloud.google.com/) → OAuth 2.0 Client ID |

### ⚙️ АВТОМАТИЧЕСКИЕ переменные

- `VITE_SEO_AGENT_ENABLED` = `true` ✅
- `VITE_SEO_AGENT_DEV_SHELL` = `false` ✅
- `VITE_SEO_AGENT_UI_TESTING` = `false` ✅

---

## 🚀 Быстрая инструкция

### Шаг 1: Минимальный набор для запуска

Для начала работы достаточно установить только обязательные переменные:

**trygo-main-backend:**
```
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
JWT_SECRET=<сгенерируйте 32+ символов>
GOOGLE_AUTH_CLIENT_ID=...
GOOGLE_AUTH_CLIENT_SECRET=...
```

**trygo-frontend (placeholder значения, обновить после деплоя бэкенда):**
```
VITE_SERVER_URL=https://trygo-main-backend.onrender.com/graphql
VITE_SEO_AGENT_URL=https://trygo-main-backend.onrender.com/graphql
VITE_WS_SERVER_URL=wss://trygo-main-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=<тот же что в backend>
```

**⚠️ После деплоя `trygo-main-backend`:**
1. Откройте Render Dashboard → `trygo-main-backend` → скопируйте его URL
2. Обновите в `trygo-frontend` все три URL на реальный URL из шага 1

### Шаг 2: После деплоя

1. Дождитесь успешного деплоя `trygo-main-backend`
2. Скопируйте его URL из Render Dashboard
3. Обновите в `trygo-frontend`:
   - `VITE_SERVER_URL` → `https://ваш-backend-url.onrender.com/graphql`
   - `VITE_SEO_AGENT_URL` → `https://ваш-backend-url.onrender.com/graphql`
   - `VITE_WS_SERVER_URL` → `wss://ваш-backend-url.onrender.com`

### Шаг 3: Добавьте опциональные функции

Добавляйте опциональные переменные по мере необходимости (Stripe, AWS, Telegram и т.д.)

---

## 🔑 Генерация JWT_SECRET

Выполните в терминале:
```bash
openssl rand -base64 32
```

Или используйте онлайн генератор: https://randomkeygen.com/

---

## ✅ Чеклист перед деплоем

- [ ] MongoDB Atlas кластер создан и доступен
- [ ] MongoDB Network Access разрешает подключения (0.0.0.0/0)
- [ ] OpenAI API ключ создан
- [ ] Google OAuth credentials созданы
- [ ] JWT_SECRET сгенерирован (32+ символов)
- [ ] Все обязательные переменные готовы
- [ ] Опциональные переменные подготовлены (если нужны)

---

## 📝 Примечания

1. **Не коммитьте секреты** - все переменные с `sync: false` должны быть установлены вручную в Render Dashboard
2. **Порядок деплоя**: сначала деплойте `trygo-main-backend`, затем обновите URL в `trygo-frontend`
3. **Проверка**: после деплоя проверьте `/health` endpoint бэкенда
