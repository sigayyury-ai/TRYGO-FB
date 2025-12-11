#!/bin/bash
# Скрипт для проверки больших JSON файлов в проекте

echo "🔍 Поиск больших JSON файлов (>1MB) в проекте TRYGO..."
echo ""

find . -type f -name "*.json" -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | while read file; do
    size=$(ls -lh "$file" | awk '{print $5}')
    echo "⚠️  $size - $file"
done

echo ""
echo "💡 Рекомендация: НЕ открывайте эти файлы в Cursor!"
echo "   Используйте: head -100 file.json или cat file.json | jq | head -100"

