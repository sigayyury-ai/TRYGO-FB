#!/bin/bash
echo "🔍 Проверка ошибок на фронтенде"
echo "=================================="
echo ""

echo "📋 1. Проверка сборки:"
cd TRYGO-Front && npm run build 2>&1 | tail -20

echo ""
echo "📋 2. Проверка TypeScript ошибок:"
npx tsc --noEmit 2>&1 | head -30 || echo "TypeScript не установлен или нет ошибок"

echo ""
echo "📋 3. Проверка ESLint:"
npm run lint 2>&1 | head -30 || echo "ESLint не настроен"

echo ""
echo "📋 4. Проверка переменных окружения:"
echo "VITE_SERVER_URL: ${VITE_SERVER_URL:-не установлена}"
echo "VITE_SEO_AGENT_URL: ${VITE_SEO_AGENT_URL:-не установлена}"
echo "VITE_WS_SERVER_URL: ${VITE_WS_SERVER_URL:-не установлена}"

echo ""
echo "✅ Для просмотра runtime ошибок:"
echo "   1. Откройте браузер: http://localhost:8080"
echo "   2. Откройте DevTools (F12)"
echo "   3. Проверьте вкладку Console на наличие ошибок"
