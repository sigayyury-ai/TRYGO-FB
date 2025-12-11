# Как получить ID проекта и гипотезы для теста

## Способ 1: Из консоли браузера

1. Откройте приложение в браузере
2. Откройте консоль разработчика (F12)
3. Выполните следующие команды:

```javascript
// Получить ID проекта
window.__DEBUG_STORES__.getProjectStore().activeProject.id

// Получить ID гипотезы
window.__DEBUG_STORES__.getHypothesisStore().activeHypothesis.id
```

4. Скопируйте полученные ID и запустите тест:

```bash
cd backend
npx tsx scripts/testGenerateIdeas.ts <projectId> <hypothesisId>
```

## Способ 2: Использовать скрипт

```bash
cd backend
./scripts/runTestGenerateIdeas.sh <projectId> <hypothesisId>
```

## Способ 3: Переменные окружения

```bash
export TEST_PROJECT_ID="<projectId>"
export TEST_HYPOTHESIS_ID="<hypothesisId>"
npx tsx scripts/testGenerateIdeas.ts
```

## Пример

Если в браузере вы видите:
- Проект: "AI marketing copilot" (ID: 686774b6773b5947fed60a78)
- Гипотеза: "Solo founders" (ID: 686774c1773b5947fed60a7a)

Запустите:
```bash
npx tsx scripts/testGenerateIdeas.ts 686774b6773b5947fed60a78 686774c1773b5947fed60a7a
```
