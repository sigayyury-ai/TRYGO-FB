# Test Scripts

Эта папка содержит скрипты для тестирования различных функций TRYGO.

## Быстрый старт

Запустить все тесты одной командой:
```bash
./scripts/test/run-all-tests.sh
```

## Доступные скрипты

### AI Assistant Tests

- **`test-ai-openai.js`** - Тест конфигурации OpenAI API
  ```bash
  cd TRYGO-Backend
  node ../scripts/test/test-ai-openai.js
  ```

- **`test-ai-assistant-full.js`** - Полный интеграционный тест AI Assistant
  - Тестирует: Login → Get Projects → Socket.IO → Send Message → Receive Answer
  ```bash
  cd TRYGO-Backend
  node ../scripts/test/test-ai-assistant-full.js
  ```

### Authentication & User Tests

- **`test-registration.js`** - Тест регистрации пользователя
  ```bash
  node scripts/test/test-registration.js
  ```

- **`delete-test-user.js`** - Удаление тестового пользователя из БД
  ```bash
  node scripts/test/delete-test-user.js
  ```

### Project Tests

- **`create-test-project.js`** - Создание тестового проекта
  ```bash
  node scripts/test/create-test-project.js
  ```

- **`test-create-comoon-project.js`** - Полный тест создания проекта COMOON с генерацией гипотез и Lean Canvas
  - Тестирует: Login → Socket.IO Project Creation → Auto-generate Hypotheses → Auto-generate Lean Canvas
  - Использует URL_IMPORT с сайта https://comoon.io/
  - Проверяет создание проекта, гипотез и Lean Canvas для каждой гипотезы
  ```bash
  node scripts/test/test-create-comoon-project.js
  ```

### Full System Tests

- **`test-full-stabilization.js`** - Комплексный автотест стабилизации
  - Тестирует все основные функции после слияния SEO Agent
  ```bash
  node scripts/test/test-full-stabilization.js
  ```

### OpenAI API Tests

- **`test-openai-api.js`** - Базовый тест OpenAI API (устаревший, используйте `test-ai-openai.js`)
  ```bash
  node scripts/test/test-openai-api.js
  ```

## Требования

Большинство скриптов требуют:
- Запущенный бэкенд на `http://localhost:5001`
- Правильно настроенный `.env` файл в `TRYGO-Backend/.env`
- Установленные зависимости (`npm install` в соответствующих директориях)

## Переменные окружения

Для работы скриптов могут понадобиться:
- `TEST_EMAIL` - email тестового пользователя (по умолчанию: `sigayyury5@gmail.com`)
- `TEST_PASSWORD` - пароль тестового пользователя (по умолчанию: `1237895aA`)
- `OPENAI_API_KEY` - ключ OpenAI API (должен быть в `TRYGO-Backend/.env`)

## Примечания

- Скрипты в папке `TRYGO-Backend` должны запускаться из директории `TRYGO-Backend` из-за относительных путей к `.env`
- Некоторые скрипты могут требовать модификации путей после перемещения
- Все скрипты используют встроенный `fetch` Node.js (Node.js 18+) или `node-fetch`

