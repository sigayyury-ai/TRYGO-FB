#!/bin/bash

# Скрипт для проверки статуса сервера и просмотра логов

echo "🔍 Проверка статуса сервера..."
echo ""

# Проверка порта
PORT=5001
if lsof -ti:$PORT > /dev/null 2>&1; then
    PID=$(lsof -ti:$PORT | head -1)
    echo "✅ Сервер работает на порту $PORT (PID: $PID)"
    
    # Проверка health endpoint
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ Health check: OK"
    else
        echo "⚠️  Health check: FAILED"
    fi
    
    # Проверка GraphQL
    if curl -s -X POST http://localhost:$PORT/graphql \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}' \
        | grep -q "__typename"; then
        echo "✅ GraphQL: OK"
    else
        echo "⚠️  GraphQL: FAILED"
    fi
    
    echo ""
    echo "📋 Последние 20 строк логов:"
    echo "---"
    tail -20 /tmp/backend-live.log 2>/dev/null || echo "Логи не найдены в /tmp/backend-live.log"
    echo "---"
    echo ""
    echo "💡 Для просмотра логов в реальном времени:"
    echo "   tail -f /tmp/backend-live.log"
    echo ""
    echo "💡 Для остановки сервера:"
    echo "   lsof -ti:$PORT | xargs kill -9"
else
    echo "❌ Сервер не запущен на порту $PORT"
    echo ""
    echo "💡 Для запуска сервера:"
    echo "   cd TRYGO-Backend && npm run dev"
fi
