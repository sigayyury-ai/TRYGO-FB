#!/bin/bash

# Скрипт для запуска теста генерации идей
# Использование: ./scripts/runTestGenerateIdeas.sh [projectId] [hypothesisId]

echo "=== ТЕСТ ГЕНЕРАЦИИ ИДЕЙ ДЛЯ КАТЕГОРИИ PAINS ==="
echo ""

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Использование: $0 <projectId> <hypothesisId>"
  echo ""
  echo "Чтобы получить ID из браузера:"
  echo "1. Откройте консоль браузера (F12)"
  echo "2. Выполните: window.__DEBUG_STORES__.getProjectStore().activeProject.id"
  echo "3. Выполните: window.__DEBUG_STORES__.getHypothesisStore().activeHypothesis.id"
  echo ""
  exit 1
fi

PROJECT_ID=$1
HYPOTHESIS_ID=$2

echo "Project ID: $PROJECT_ID"
echo "Hypothesis ID: $HYPOTHESIS_ID"
echo ""

export TEST_PROJECT_ID=$PROJECT_ID
export TEST_HYPOTHESIS_ID=$HYPOTHESIS_ID

npx tsx scripts/testGenerateIdeas.ts "$PROJECT_ID" "$HYPOTHESIS_ID"
