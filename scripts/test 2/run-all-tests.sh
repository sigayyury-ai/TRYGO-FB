#!/bin/bash
# Скрипт для запуска всех тестов

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../../TRYGO-Backend"
ROOT_DIR="$SCRIPT_DIR/../.."

echo "🧪 Running all TRYGO tests..."
echo "=================================="

# Проверка что бэкенд запущен
if ! curl -s http://localhost:5001/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 5001"
    echo "   Please start the backend first: cd TRYGO-Backend && npm run dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Тест OpenAI API
echo "1️⃣ Testing OpenAI API..."
cd "$BACKEND_DIR"
node "$SCRIPT_DIR/test-ai-openai.js" || echo "⚠️  OpenAI API test failed"
echo ""

# Тест регистрации
echo "2️⃣ Testing registration..."
cd "$ROOT_DIR"
node "$SCRIPT_DIR/test-registration.js" || echo "⚠️  Registration test failed"
echo ""

# Полный тест AI Assistant
echo "3️⃣ Testing AI Assistant (full integration)..."
cd "$BACKEND_DIR"
node "$SCRIPT_DIR/test-ai-assistant-full.js" || echo "⚠️  AI Assistant test failed"
echo ""

# Комплексный тест стабилизации
echo "4️⃣ Running full stabilization tests..."
cd "$ROOT_DIR"
node "$SCRIPT_DIR/test-full-stabilization.js" || echo "⚠️  Stabilization tests failed"
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo ""
echo "Note: Some tests may have failed. Check the output above for details."

