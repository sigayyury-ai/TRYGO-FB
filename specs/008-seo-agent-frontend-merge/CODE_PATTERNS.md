# Ключевые паттерны и находки из анализа кода TRYGO Frontend

## Apollo Client конфигурация

### Расположение
`src/config/apollo/client/index.ts`

### Ключевые детали:
- **Автоматическая авторизация**: Token берется из cookies через `Cookies.get('token')` и автоматически добавляется в headers как `Bearer ${token}`
- **Экспорты**: `QUERY` и `MUTATE` экспортируются напрямую из client, используются во всех API файлах
- **Endpoint**: Использует `import.meta.env.VITE_SERVER_URL` из `.env` файла
- **Cache**: `InMemoryCache` с настройками по умолчанию

### Пример использования в API:
```typescript
import { QUERY } from '@/config/apollo/client';

export const getProjectsQuery = () => {
  return QUERY<GetProjectsResponse>({
    query: GET_PROJECTS,
    fetchPolicy: 'network-only',
  });
};
```

### Важно для SEO Agent:
- Все запросы SEO Agent должны использовать тот же паттерн `QUERY` и `MUTATE`
- Token передается автоматически, не нужно явно добавлять
- Использовать `fetchPolicy: 'network-only'` для актуальных данных

---

## Структура API файлов

### Паттерн файла API:
1. Импорты: `gql`, `QUERY` или `MUTATE`
2. GraphQL запрос/мутация определение
3. TypeScript интерфейсы для типов данных
4. Экспорт функции-обертки, которая использует QUERY/MUTATE

### Пример из getProjects.ts:
```typescript
import { gql } from '@apollo/client';
import { QUERY } from '@/config/apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    getProjects {
      id
      userId
      title
      generationStatus
    }
  }
`;

export interface ProjectDto {
  id: string;
  userId: string;
  title: string;
  generationStatus: GenerationStatus;
}

export interface GetProjectsResponse {
  getProjects: ProjectDto[];
}

export const getProjectsQuery = () => {
  return QUERY<GetProjectsResponse>({
    query: GET_PROJECTS,
    fetchPolicy: 'network-only',
  });
};
```

### Для SEO Agent:
- Все API файлы SEO Agent должны следовать этому же паттерну
- Использовать TypeScript интерфейсы для типизации
- Экспортировать функцию-обертку для использования в компонентах

---

## Sidebar структура

### Расположение
`src/components/Sidebar.tsx`

### Структура:
- Импорт иконок из `lucide-react`
- Секции с заголовками (Understand, Define, Prototype, Deliver)
- Использование `useLocation` для определения активного пути
- Функция `isActive` для проверки активного маршрута
- Стили: активный элемент - `bg-blue-100 text-gray-900`, неактивный - `text-gray-700 hover:bg-blue-100`

### Паттерн ссылки:
```typescript
<Link
  to="/branding"
  onClick={onNavigate}
  className={`flex items-center w-full rounded-md px-2 py-2 transition-colors
    ${
      isActive("/branding")
        ? "bg-blue-100 text-gray-900"
        : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
    }`}
>
  <Palette className="h-4 w-4 mr-2" />
  Branding
</Link>
```

### Для SEO Agent:
- Добавить ссылку в секцию "Prototype" после "Branding"
- Использовать иконку `Sparkles` или `Search` из lucide-react
- Следовать тому же паттерну стилей
- Добавить проверку entitlement для locked состояния

---

## Layout и RequireProject

### Layout (`src/components/Layout.tsx`):
- Обертка для всех страниц
- Включает Header и Sidebar
- Управляет мобильной версией сайдбара
- Использует `useUserStore` для проверки авторизации

### RequireProject (`src/components/RequireProject.tsx`):
- Защита маршрутов, требующих активного проекта
- Автоматически загружает проекты если их нет
- Показывает ошибку если загрузка не удалась
- Просто оборачивает children, не редиректит сам

### Паттерн использования в App.tsx:
```typescript
<Route
  path="/branding"
  element={
    <RequireProject>
      <Layout>
        <Branding />
      </Layout>
    </RequireProject>
  }
/>
```

### Для SEO Agent:
- Использовать ту же структуру обертки
- RequireProject гарантирует наличие проектов
- Layout обеспечивает общую структуру с сайдбаром

---

## Zustand Stores

### useProjectStore:
- `projects` - массив проектов
- `activeProject` - текущий активный проект
- `getProjects()` - загрузка проектов через GraphQL
- Использует `persist` middleware для сохранения в localStorage

### useHypothesisStore:
- `hypotheses` - массив гипотез
- `activeHypothesis` - текущая активная гипотеза
- `getHypotheses(projectId)` - загрузка гипотез для проекта
- Автоматически выбирает первую гипотезу при загрузке

### Паттерн использования:
```typescript
const activeProject = useProjectStore((state) => state.activeProject);
const activeHypothesis = useHypothesisStore((state) => state.activeHypothesis);
```

### Для SEO Agent:
- Использовать те же stores для получения projectId и hypothesisId
- Не создавать новые stores для данных, которые уже есть
- Использовать activeProject и activeHypothesis напрямую

---

## Стили и UI компоненты

### Используемые библиотеки:
- **shadcn/ui** - основные UI компоненты
- **Tailwind CSS** - стилизация
- **lucide-react** - иконки

### Паттерны стилей:
- Активный элемент: `bg-blue-100 text-gray-900`
- Неактивный: `text-gray-700 hover:bg-blue-100 hover:text-gray-900`
- Заголовки секций: `text-gray-400 text-xs px-2`
- Контейнеры: `flex flex-col gap-1`

### Для SEO Agent:
- Использовать те же компоненты shadcn/ui (Tabs, Button, Card, etc.)
- Следовать той же цветовой схеме
- Использовать те же размеры иконок (h-4 w-4)
- Сохранять консистентность с существующими страницами

---

## Environment Variables

### .env файл содержит:
- `VITE_SERVER_URL` - GraphQL endpoint (production: `https://ailaunchkit-backend-production.onrender.com/graphql`)
- `VITE_WS_SERVER_URL` - WebSocket endpoint
- `VITE_GOOGLE_CLIENT_ID` - для OAuth

### Для SEO Agent:
- Использовать тот же `VITE_SERVER_URL` для всех GraphQL запросов
- Не требуется новых переменных окружения

---

## Важные находки для реализации

1. **Авторизация работает автоматически** - не нужно явно передавать token, Apollo Client делает это через cookies

2. **Все API запросы используют QUERY/MUTATE** - единый паттерн для всех запросов

3. **Stores уже содержат нужные данные** - `activeProject` и `activeHypothesis` доступны через stores

4. **RequireProject не редиректит** - просто оборачивает children, редирект нужно делать в компоненте если нужно

5. **Стили консистентны** - использовать те же классы Tailwind и компоненты shadcn/ui

6. **Иконки из lucide-react** - все иконки используют эту библиотеку, размер h-4 w-4

7. **Маршруты без projectId** - текущие маршруты не используют projectId в URL, используют activeProject из store

---

## Рекомендации для задач

1. При создании API файлов SEO Agent использовать тот же паттерн что и существующие
2. При добавлении в Sidebar следовать той же структуре и стилям
3. Использовать существующие stores вместо создания новых
4. Использовать те же UI компоненты для консистентности
5. Все GraphQL запросы должны использовать activeProject.id и activeHypothesis?.id из stores






