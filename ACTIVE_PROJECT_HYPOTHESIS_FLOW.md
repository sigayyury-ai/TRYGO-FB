# Поток передачи активного проекта и гипотезы

## Обзор архитектуры

Система использует **cookie-based state management** для хранения активного проекта и гипотезы. Это заменяет Zustand stores для глобального состояния.

## Начальная точка: Dashboard

### Dashboard.tsx

```typescript
const Dashboard: FC = () => {
  // 1. Получаем активный проект через хук
  const { activeProject, projects, loading: projectsLoading, loadProjects } = useProjects();
  
  // 2. Получаем активную гипотезу для активного проекта
  const { error: hypothesesError } = useHypotheses({ 
    projectId: activeProject?.id, 
    projects 
  });
  
  // 3. Загружаем проекты при монтировании
  useEffect(() => {
    await loadProjects();
  }, []);
  
  // 4. Передаем данные в компоненты
  return <LeanCanvas />;
};
```

## Хуки для управления состоянием

### 1. useProjects() - Управление проектами

**Файл:** `TRYGO-Front/src/hooks/useProjects.ts`

**Как работает:**

1. **Загрузка проектов:**
   ```typescript
   const loadProjects = async () => {
     const loadedProjects = await getProjectsQuery();
     
     // Восстанавливаем из cookies
     const savedProjectId = getActiveProjectId();
     let foundActiveProject = null;
     
     if (savedProjectId) {
       foundActiveProject = loadedProjects.find(p => p.id === savedProjectId);
       if (!foundActiveProject) {
         setActiveProjectId(null); // Очищаем если не найден
       }
     }
     
     // Если нет в cookies, берем первый проект
     if (!foundActiveProject && loadedProjects.length > 0) {
       foundActiveProject = loadedProjects[0];
       setActiveProjectId(foundActiveProject.id); // Сохраняем в cookies
     }
     
     setActiveProject(foundActiveProject);
   };
   ```

2. **Установка активного проекта:**
   ```typescript
   const setActive = (projectId: string) => {
     const project = projects.find((p) => p.id === projectId);
     if (project) {
       setActiveProjectId(projectId); // Сохраняем в cookies
       setActiveProject(project);     // Обновляем локальное состояние
     }
   };
   ```

3. **Реактивное обновление:**
   ```typescript
   // Используем хук для реактивного чтения ID из cookies
   const activeProjectIdFromCookie = useActiveProjectId();
   
   useEffect(() => {
     // Обновляем activeProject когда изменяется ID в cookies
     if (activeProjectIdFromCookie && activeProjectIdFromCookie !== prevId) {
       const found = projects.find(p => p.id === activeProjectIdFromCookie);
       if (found) {
         setActiveProject(found);
       }
     }
   }, [activeProjectIdFromCookie, projects]);
   ```

**Возвращает:**
- `projects` - массив всех проектов
- `activeProject` - активный проект (объект)
- `loading` - состояние загрузки
- `error` - ошибка загрузки
- `loadProjects` - функция загрузки
- `setActiveProject` - функция установки активного проекта

### 2. useHypotheses() - Управление гипотезами

**Файл:** `TRYGO-Front/src/hooks/useHypotheses.ts`

**Как работает:**

1. **Загрузка гипотез:**
   ```typescript
   const loadHypotheses = async (targetProjectId: string) => {
     const loadedHypotheses = await getProjectHypothesesQuery(targetProjectId);
     
     // Восстанавливаем из cookies
     const savedHypothesisId = getActiveHypothesisId();
     let foundActiveHypothesis = null;
     
     if (savedHypothesisId) {
       // Проверяем, что гипотеза принадлежит текущему проекту
       const found = loadedHypotheses.find(
         h => h.id === savedHypothesisId && h.projectId === targetProjectId
       );
       if (found) {
         foundActiveHypothesis = found;
       } else {
         setActiveHypothesisId(null); // Очищаем если не найдена или другой проект
       }
     }
     
     // Если нет в cookies, берем первую гипотезу
     if (!foundActiveHypothesis && loadedHypotheses.length > 0) {
       foundActiveHypothesis = loadedHypotheses[0];
       setActiveHypothesisId(foundActiveHypothesis.id); // Сохраняем в cookies
     }
     
     setActiveHypothesis(foundActiveHypothesis);
   };
   ```

2. **Автоматическая загрузка при изменении проекта:**
   ```typescript
   useEffect(() => {
     if (projectId) {
       loadHypotheses(projectId);
     } else {
       setHypotheses([]);
       setActiveHypothesis(null);
     }
   }, [projectId]);
   ```

3. **Установка активной гипотезы:**
   ```typescript
   const setActive = (hypothesisId: string) => {
     const hypothesis = hypotheses.find((h) => h.id === hypothesisId);
     if (hypothesis) {
       setActiveHypothesisId(hypothesisId); // Сохраняем в cookies
       setActiveHypothesis(hypothesis);     // Обновляем локальное состояние
     }
   };
   ```

**Возвращает:**
- `hypotheses` - массив всех гипотез проекта
- `activeHypothesis` - активная гипотеза (объект)
- `loading` - состояние загрузки
- `error` - ошибка загрузки
- `loadHypotheses` - функция загрузки
- `setActiveHypothesis` - функция установки активной гипотезы

## Утилиты для работы с cookies

### activeState.ts

**Файл:** `TRYGO-Front/src/utils/activeState.ts`

**Основные функции:**

```typescript
// Чтение из cookies
getActiveProjectId(): string | null
getActiveHypothesisId(): string | null
getActiveIds(): { projectId: string | null; hypothesisId: string | null }

// Запись в cookies
setActiveProjectId(projectId: string | null): void
setActiveHypothesisId(hypothesisId: string | null): void
setActiveIds(projectId: string | null, hypothesisId: string | null): void

// Очистка
clearActiveIds(): void
```

**Особенности:**
- Использует библиотеку `js-cookie`
- При изменении диспатчит событие `cookiechange` для реактивности
- Cookies хранятся 365 дней

### useActiveIds.ts - Реактивные хуки

**Файл:** `TRYGO-Front/src/hooks/useActiveIds.ts`

**Как работает:**

```typescript
export function useActiveProjectId(): string | null {
  const [projectId, setProjectId] = useState(() => getActiveProjectId());
  
  useEffect(() => {
    const checkCookies = () => {
      const currentId = getActiveProjectId();
      setProjectId(prevId => currentId !== prevId ? currentId : prevId);
    };
    
    // Проверяем каждую секунду
    const interval = setInterval(checkCookies, 1000);
    
    // Слушаем события изменения cookies
    window.addEventListener('cookiechange', checkCookies);
    window.addEventListener('storage', checkCookies);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cookiechange', checkCookies);
      window.removeEventListener('storage', checkCookies);
    };
  }, []);
  
  return projectId;
}
```

## Использование в компонентах

### Header.tsx

**Как получает данные:**
```typescript
const Header: FC = () => {
  // Получаем проекты и активный проект
  const { activeProject, projects, setActiveProject } = useProjects();
  
  // Получаем гипотезы и активную гипотезу для активного проекта
  const {
    hypotheses,
    activeHypothesis,
    setActiveHypothesis,
    loadHypotheses,
  } = useHypotheses({ projectId: activeProject?.id, projects });
  
  // Автоматически выбираем первый проект, если нет активного
  useEffect(() => {
    if (projects && projects.length > 0 && !activeProject) {
      setActiveProject(projects[0].id);
    }
  }, [projects, activeProject, setActiveProject]);
  
  // Загружаем гипотезы при изменении активного проекта
  useEffect(() => {
    if (activeProject?.id) {
      loadHypotheses(activeProject.id);
    }
  }, [activeProject?.id, loadHypotheses]);
  
  // Обработчик смены проекта
  const handleProjectChange = (value: string) => {
    if (value === "create-new-project") {
      setIsGenerateProjectOpen(true);
    } else {
      setActiveProject(value); // Сохраняет в cookies и обновляет состояние
    }
  };
  
  // Обработчик смены гипотезы
  const handleSetActive = (id: string) => {
    setActiveHypothesis(id); // Сохраняет в cookies и обновляет состояние
  };
};
```

### LeanCanvas.tsx

**Как получает данные:**
```typescript
const LeanCanvas: FC = () => {
  // Получаем активный проект
  const { activeProject } = useProjects();
  
  // Получаем активную гипотезу для активного проекта
  const { activeHypothesis } = useHypotheses({ 
    projectId: activeProject?.id 
  });
  
  // Загружаем coreData для активной гипотезы
  useEffect(() => {
    if (activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesCore]);
  
  // Используем activeHypothesis для отображения
  return (
    <div>
      {activeHypothesis && (
        <div>
          Active Hypothesis: {activeHypothesis.title}
        </div>
      )}
      {/* ... остальной контент ... */}
    </div>
  );
};
```

### Person.tsx

**Как получает данные:**
```typescript
const Person = () => {
  // Получаем активный проект
  const { activeProject } = useProjects();
  
  // Получаем активную гипотезу для активного проекта
  const { activeHypothesis } = useHypotheses({ 
    projectId: activeProject?.id 
  });
  
  // Загружаем coreData для активной гипотезы
  useEffect(() => {
    if (activeHypothesis?.id) {
      getHypothesesCore(activeHypothesis.id);
    }
  }, [activeHypothesis?.id, getHypothesesCore]);
};
```

## Поток данных

### 1. Инициализация (Dashboard загружается)

```
Dashboard монтируется
  ↓
useProjects() вызывается
  ↓
loadProjects() выполняется
  ↓
getProjectsQuery() → API запрос
  ↓
getActiveProjectId() → читает из cookies
  ↓
Если найден в cookies → использует его
Если нет → берет первый проект
  ↓
setActiveProjectId() → сохраняет в cookies
  ↓
setActiveProject() → обновляет локальное состояние
  ↓
activeProject доступен в компоненте
```

### 2. Загрузка гипотез

```
activeProject установлен
  ↓
useHypotheses({ projectId: activeProject?.id }) вызывается
  ↓
useEffect срабатывает на projectId
  ↓
loadHypotheses(projectId) выполняется
  ↓
getProjectHypothesesQuery(projectId) → API запрос
  ↓
getActiveHypothesisId() → читает из cookies
  ↓
Проверяет, что гипотеза принадлежит текущему проекту
  ↓
Если найдена и принадлежит проекту → использует её
Если нет → берет первую гипотезу
  ↓
setActiveHypothesisId() → сохраняет в cookies
  ↓
setActiveHypothesis() → обновляет локальное состояние
  ↓
activeHypothesis доступен в компоненте
```

### 3. Смена проекта (через Header)

```
Пользователь выбирает проект в dropdown
  ↓
handleProjectChange(value) вызывается
  ↓
setActiveProject(value) вызывается
  ↓
setActiveProjectId(value) → сохраняет в cookies
  ↓
dispatchCookieChange() → диспатчит событие 'cookiechange'
  ↓
useActiveProjectId() → реагирует на событие
  ↓
useProjects() → обновляет activeProject
  ↓
useHypotheses() → видит изменение projectId
  ↓
loadHypotheses(newProjectId) → загружает гипотезы нового проекта
  ↓
Все компоненты получают обновленные данные
```

### 4. Смена гипотезы (через Header)

```
Пользователь выбирает гипотезу в dropdown
  ↓
handleSetActive(id) вызывается
  ↓
setActiveHypothesis(id) вызывается
  ↓
setActiveHypothesisId(id) → сохраняет в cookies
  ↓
dispatchCookieChange() → диспатчит событие 'cookiechange'
  ↓
useActiveHypothesisId() → реагирует на событие
  ↓
useHypotheses() → обновляет activeHypothesis
  ↓
Все компоненты получают обновленную гипотезу
```

## Ключевые особенности

### 1. Cookie-based persistence
- Состояние сохраняется в cookies и переживает перезагрузку страницы
- Cookies автоматически восстанавливаются при следующем визите

### 2. Реактивность
- Используются события `cookiechange` для синхронизации между компонентами
- Хуки `useActiveProjectId()` и `useActiveHypothesisId()` проверяют изменения каждую секунду

### 3. Валидация
- При загрузке проверяется, что сохраненный проект/гипотеза существуют в API
- Если не найдены, выбирается первый доступный
- Гипотеза проверяется на принадлежность текущему проекту

### 4. Автоматический выбор
- Если нет активного проекта → выбирается первый
- Если нет активной гипотезы → выбирается первая

### 5. Очистка при смене проекта
- При смене проекта гипотеза из cookies проверяется на принадлежность новому проекту
- Если не принадлежит → очищается и выбирается первая гипотеза нового проекта

## Примеры использования в других компонентах

### SeoAgentPage.tsx
```typescript
const { activeProject } = useProjects();
const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
```

### GTM.tsx
```typescript
const { activeProject } = useProjects();
const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
```

### Validation.tsx
```typescript
const { activeProject } = useProjects();
const { activeHypothesis } = useHypotheses({ projectId: activeProject?.id });
```

## Важные моменты

1. **Всегда передавайте `projectId` в `useHypotheses()`:**
   ```typescript
   // ✅ Правильно
   useHypotheses({ projectId: activeProject?.id })
   
   // ❌ Неправильно - гипотезы не загрузятся
   useHypotheses()
   ```

2. **Проверяйте наличие данных перед использованием:**
   ```typescript
   // ✅ Правильно
   if (activeHypothesis?.id) {
     getHypothesesCore(activeHypothesis.id);
   }
   ```

3. **Используйте опциональный chaining:**
   ```typescript
   // ✅ Правильно
   projectId: activeProject?.id
   
   // ❌ Может вызвать ошибку
   projectId: activeProject.id
   ```

4. **Не забывайте передавать `projects` в `useHypotheses()`:**
   ```typescript
   // ✅ Правильно - для проверки возраста проекта
   useHypotheses({ projectId: activeProject?.id, projects })
   ```
