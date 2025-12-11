# Анализ интеграции SEO Agent в TRYGO Frontend

## Текущая архитектура TRYGO Frontend

### Авторизация и инициализация
- **Авторизация**: Google OAuth через `@react-oauth/google`
- **Токен хранения**: Cookies (`js-cookie`), ключ `token`
- **Инициализация**: В `App.tsx` при загрузке вызывается:
  - `initializeAuth()` - проверяет токен через `getUserByTokenQuery()`
  - `getProjects()` - загружает проекты пользователя

### State Management (Zustand Stores)
1. **useUserStore** (`src/store/useUserStore.ts`):
   - `userData` - данные пользователя
   - `isAuthenticated` - статус авторизации
   - `token` - токен из cookies
   - `initializeAuth()` - инициализация авторизации

2. **useProjectStore** (`src/store/useProjectStore.ts`):
   - `projects` - список проектов
   - `activeProject` - текущий активный проект
   - `getProjects()` - загрузка проектов через GraphQL

3. **useHypothesisStore** (`src/store/useHypothesisStore.ts`):
   - `hypotheses` - список гипотез
   - `activeHypothesis` - текущая активная гипотеза
   - `getHypotheses(projectId)` - загрузка гипотез для проекта

### API и GraphQL
- **GraphQL Client**: Apollo Client
- **Endpoint**: `VITE_SERVER_URL` из `.env` (по умолчанию `https://ailaunchkit-backend-production.onrender.com/graphql`)
- **Запросы**: Все в `src/api/*.ts`
- **Токен**: Передается через Apollo Client headers (из cookies)

### Получение данных после авторизации
```typescript
// В App.tsx
useEffect(() => {
  initializeAuth();      // Проверяет токен
  getProjects();         // Загружает проекты
}, []);

useEffect(() => {
  if (activeProject?.id) {
    getHypotheses(activeProject.id);  // Загружает гипотезы для активного проекта
  }
}, [activeProject?.id]);
```

## Рекомендации по интеграции SEO Agent

### 1. Использование общих API и базы данных

✅ **SEO Agent должен использовать:**
- Тот же GraphQL endpoint (`VITE_SERVER_URL`)
- Тот же Apollo Client instance
- Те же stores для проектов и гипотез
- Те же механизмы авторизации

✅ **Не требуется:**
- Отдельный API endpoint
- Отдельная база данных
- Хардкод projectId в URL (`/dashboard/:projectId/seo-agent`)

### 2. Получение контекста проекта

**Вместо хардкода projectId в маршруте:**
```typescript
// ❌ НЕ ТАК
<Route path="/dashboard/:projectId/seo-agent" />

// ✅ ПРАВИЛЬНО
<Route path="/seo-agent" />
```

**Использование активного проекта из store:**
```typescript
// В SeoAgentPage.tsx
import { useProjectStore } from '@/store/useProjectStore';
import { useHypothesisStore } from '@/store/useHypothesisStore';

const SeoAgentPage = () => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
  
  // Если нет активного проекта - показываем ошибку или редирект
  if (!activeProject) {
    return <Navigate to="/dashboard" />;
  }
  
  // Используем activeProject.id и activeHypothesis?.id для запросов
};
```

### 3. GraphQL запросы для SEO Agent

**Создать новые запросы в `src/api/`:**
- `getSeoAgentContext.ts` - получает контекст (project, hypothesis, Lean Canvas, ICP)
- `getSeoAgentClusters.ts` - кластеры ключевых слов
- `getSeoAgentBacklog.ts` - backlog идей
- `getSeoAgentContentQueue.ts` - очередь контента
- И т.д.

**Все запросы должны:**
- Использовать `activeProject.id` из store
- Использовать `activeHypothesis?.id` из store (опционально)
- Использовать тот же `QUERY` helper из `@/config/apollo/client`
- Передавать токен через существующий механизм Apollo Client

### 4. Структура маршрута

**Маршрут должен быть:**
```typescript
// В App.tsx
<Route
  path="/seo-agent"
  element={
    <RequireProject>  {/* Проверяет наличие активного проекта */}
      <Layout>
        <SeoAgentPage />
      </Layout>
    </RequireProject>
  }
/>
```

**RequireProject уже существует** и проверяет наличие активного проекта, перенаправляет на `/dashboard` если проекта нет.

### 5. Обновление спецификации

Спецификация в `spec.md` должна быть обновлена:
- **FR-002**: Маршрут `/seo-agent` (без `:projectId`)
- **FR-004**: Использование `activeProject` и `activeHypothesis` из stores
- Добавить требование о использовании общего GraphQL endpoint
- Добавить требование о использовании общих stores

## Пример реализации SeoAgentPage

```typescript
// src/pages/SeoAgentPage.tsx
import { useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useHypothesisStore } from '@/store/useHypothesisStore';
import { useUserStore } from '@/store/useUserStore';
import { SeoAgentConsole } from '@/components/seo-agent/SeoAgentConsole';
import { SubscriptionBanner } from '@/components/seo-agent/SubscriptionBanner';

export const SeoAgentPage = () => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
  const userData = useUserStore((state) => state.userData);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Проверка авторизации
  if (!isAuthenticated || !userData) {
    return <Navigate to="/auth" />;
  }

  // Проверка активного проекта
  if (!activeProject) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="seo-agent-workspace">
      <SubscriptionBanner userId={userData.id} />
      <SeoAgentConsole 
        projectId={activeProject.id}
        hypothesisId={activeHypothesis?.id}
      />
    </div>
  );
};
```

## Выводы

1. ✅ SEO Agent использует **общий GraphQL endpoint** через Apollo Client
2. ✅ SEO Agent использует **общие stores** (useProjectStore, useHypothesisStore)
3. ✅ SEO Agent **не требует хардкода projectId** - использует activeProject из store
4. ✅ SEO Agent **подхватывает данные после авторизации** через существующие механизмы
5. ✅ Все данные из **общей базы данных** через общий backend API

## Следующие шаги

1. Обновить спецификацию `spec.md` с учетом использования общих API
2. Создать GraphQL запросы в `src/api/` для SEO Agent
3. Реализовать SeoAgentPage с использованием stores
4. Убедиться что все запросы используют активный проект из store






