#!/bin/bash
# Скрипт для проверки статуса деплоя на Render

SERVICE_ID="srv-d4tjfnruibrs73aohc30"
DASHBOARD_URL="https://dashboard.render.com/"

echo "🔍 Проверка статуса деплоя на Render"
echo "=================================="
echo ""
echo "Service ID: $SERVICE_ID"
echo ""
echo "📊 Откройте Dashboard:"
echo "   $DASHBOARD_URL"
echo ""
echo "📝 Для просмотра логов:"
echo "   1. Найдите сервис 'trygo-main-backend'"
echo "   2. Перейдите в раздел 'Logs' или 'Events'"
echo ""
echo "🔗 Прямая ссылка на сервис (если доступна):"
echo "   https://dashboard.render.com/web/$SERVICE_ID"
echo ""
