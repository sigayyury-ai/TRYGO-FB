# Аудит кода: Ошибка "Hypothesis not found"

## Проблема
В логах видно использование проекта "TRYGO Remote IT Support" (686774b6773b5947fed60a78) с гипотезой 686774c1773b5947fed60a7a, но пользователь работает с проектом "AI marketing copilot" и гипотезой "Solo founders".

## Найденные проблемы

### 1. Frontend: SeoAgentPage.tsx

**Проблема #1: Автоматический выбор первого проекта**
```typescript
// Строка 52
let selectedProject = loadedProjects.find(p => p.id === savedProjectId) || loadedProjects[0];
```
**Проблема**: Если сохраненный проект не найден, автоматически выбирается ПЕРВЫЙ проект из списка, который может быть не тем, который нужен пользователю.

**Решение**: Нужно либо:
- Показывать селектор проектов всегда (даже если проект один)
- Или искать проект по названию, если ID не найден
- Или очищать localStorage и показывать выбор пользователю

**Проблема #2: Нет валидации при загрузке**
```typescript
// Строка 93
let selectedHypothesis = loadedHypotheses.find(h => h.id === savedHypothesisId && h.projectId === project.id);
```
**Проблема**: Если гипотеза не найдена, берется первая из списка без проверки, что она действительно существует в базе.

**Решение**: Добавить проверку существования гипотезы в базе перед использованием.

### 2. Backend: seoContext.ts

**Проблема #3: Запрос гипотезы без проверки принадлежности к проекту**
```typescript
// Строка 72-78
db.collection("projectHypotheses")
  .findOne({ _id: hypothesisObjectId })
```
**Проблема**: Запрос идет только по `_id`, без проверки `projectId`. Это может привести к использованию гипотезы из другого проекта.

**Решение**: Добавить проверку `projectId` в запрос:
```typescript
db.collection("projectHypotheses")
  .findOne({ 
    _id: hypothesisObjectId,
    projectId: projectObjectId  // Добавить эту проверку
  })
```

**Проблема #4: Нет информации о доступных гипотезах при ошибке**
```typescript
// Строка 144-148
if (!hypothesis) {
  throw new Error(`Hypothesis not found: ${hypothesisId} for project: ${projectId}`);
}
```
**Проблема**: При ошибке не выводится список доступных гипотез для этого проекта, что затрудняет отладку.

**Решение**: Добавить в ошибку список доступных гипотез:
```typescript
if (!hypothesis) {
  const availableHypotheses = await db.collection("projectHypotheses")
    .find({ projectId: projectObjectId })
    .toArray();
  const hypothesisIds = availableHypotheses.map(h => h._id.toString());
  throw new Error(
    `Hypothesis not found: ${hypothesisId} for project: ${projectId}. ` +
    `Available hypotheses: ${hypothesisIds.join(", ")}`
  );
}
```

### 3. Backend: resolvers.ts

**Проблема #5: Нет валидации перед вызовом loadSeoContext**
```typescript
// Строка 1146
const seoContext = await loadSeoContext(args.projectId, args.hypothesisId);
```
**Проблема**: `loadSeoContext` вызывается без предварительной проверки, что гипотеза существует и принадлежит проекту.

**Решение**: Добавить предварительную валидацию:
```typescript
// Проверить существование гипотезы перед загрузкой контекста
const hypothesis = await db.collection("projectHypotheses")
  .findOne({ 
    _id: new mongoose.Types.ObjectId(args.hypothesisId),
    projectId: new mongoose.Types.ObjectId(args.projectId)
  });

if (!hypothesis) {
  throw new Error(`Hypothesis ${args.hypothesisId} not found for project ${args.projectId}`);
}

const seoContext = await loadSeoContext(args.projectId, args.hypothesisId);
```

### 4. Frontend: getSeoAgentContentIdeas.ts

**Проблема #6: hypothesisId может быть пустой строкой**
```typescript
// Строка 70-72
if (hypothesisId && hypothesisId.trim() !== "") {
  variables.hypothesisId = hypothesisId;
}
```
**Проблема**: Проверка есть, но если `hypothesisId` передается как пустая строка или undefined, запрос все равно может уйти с невалидным ID.

**Решение**: Уже есть проверка, но можно улучшить:
```typescript
if (hypothesisId && hypothesisId.trim() !== "" && hypothesisId !== "undefined" && hypothesisId !== "null") {
  variables.hypothesisId = hypothesisId;
}
```

## Рекомендации по исправлению

1. **Исправить запрос гипотезы в seoContext.ts** - добавить проверку `projectId`
2. **Добавить валидацию в resolvers.ts** - проверять существование гипотезы перед `loadSeoContext`
3. **Улучшить обработку ошибок** - показывать доступные гипотезы при ошибке
4. **Исправить логику выбора проекта** - не выбирать автоматически первый проект
5. **Добавить очистку localStorage** - при невалидных данных

## Приоритет исправлений

1. **Критично**: Исправить запрос гипотезы в `seoContext.ts` (проблема #3)
2. **Критично**: Добавить валидацию в `resolvers.ts` (проблема #5)
3. **Важно**: Улучшить логику выбора проекта (проблема #1)
4. **Важно**: Улучшить обработку ошибок (проблема #4)

