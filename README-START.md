# Быстрый запуск TRYGO Frontend

## Автоматический запуск

```bash
./start-trygo-frontend.sh
```

Скрипт автоматически:
- Проверит наличие Node.js и npm
- Создаст `.env` файл если его нет
- Установит зависимости если `node_modules` отсутствует
- Запустит dev сервер на порту 8080

## Ручной запуск

1. Перейти в директорию фронтенда:
```bash
cd TRYGO-Front
```

2. Установить зависимости (если еще не установлены):
```bash
npm install
```

3. Проверить `.env` файл:
```bash
cat .env
```

Должен содержать:
```
VITE_SERVER_URL=https://ailaunchkit-backend-production.onrender.com/graphql
VITE_WS_SERVER_URL=wss://ailaunchkit-backend-production.onrender.com
VITE_GOOGLE_CLIENT_ID=972667881235-rn1s9p2iovqtiq34r3q18hen3rhs8lf0.apps.googleusercontent.com
```

4. Запустить dev сервер:
```bash
npm run dev
```

5. Открыть в браузере:
```
http://localhost:8080
```

## Troubleshooting

### Порт 8080 занят
Измените порт в `vite.config.ts`:
```typescript
server: {
  port: 8081,  // или другой свободный порт
}
```

### Ошибки установки зависимостей
Попробуйте очистить кеш:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Ошибки подключения к backend
Проверьте что `VITE_SERVER_URL` в `.env` правильный и backend доступен.






