#!/bin/bash

# Скрипт для запуска теста cookie-based state management

echo "🍪 Запуск теста cookie-based state management..."
echo ""

# Проверяем, что Playwright установлен
if ! command -v npx &> /dev/null; then
    echo "❌ npx не найден. Установите Node.js"
    exit 1
fi

# Проверяем, что tsx установлен
if ! npm list tsx &> /dev/null; then
    echo "📦 Устанавливаю tsx..."
    cd "$(dirname "$0")/.."
    npm install tsx --save-dev
fi

# Запускаем тест
cd "$(dirname "$0")/.."
npx tsx scripts/testCookieBasedState.ts

