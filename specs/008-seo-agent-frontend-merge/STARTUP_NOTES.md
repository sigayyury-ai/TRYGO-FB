# Запуск TRYGO Frontend - Заметки

## Статус

✅ **Frontend сервер запущен**
- URL: http://localhost:8080
- Статус: Running

## Что можно проверить в браузере

### 1. Проверка авторизации
- Откройте http://localhost:8080
- Должна открыться страница авторизации (Auth page)
- Можно попробовать войти через Google OAuth или email/password

### 2. Проверка навигации
После авторизации проверьте:
- **Sidebar**: Левое меню с секциями (Understand, Define, Prototype, Deliver)
- **Текущая структура меню**:
  - Understand: Core, ICP
  - Define: Research, Validation
  - Prototype: Packing, Branding ← **Сюда добавим SEO Agent**
  - Deliver: GTM, Pitch Materials

### 3. Проверка маршрутов
- `/dashboard` - главная страница
- `/person` - ICP профили
- `/research` - исследования
- `/validation` - валидация
- `/packing` - упаковка
- `/branding` - брендинг (заглушка)
- `/gtm` - Go-to-Market

### 4. Проверка Apollo Client
- Откройте DevTools (F12) → Network tab
- Выполните любые действия (переключение между страницами)
- Проверьте что GraphQL запросы уходят на `VITE_SERVER_URL`
- Проверьте что в headers запросов есть `authorization: Bearer <token>`

### 5. Проверка Stores (Zustand)
- Откройте DevTools → Application → Local Storage
- Проверьте наличие:
  - `useUserStore` - данные пользователя и токен
  - `projects-storage` - список проектов и активный проект
  - `hypothesis-storage` - гипотезы и активная гипотеза

## Что это дает для SEO Agent

### Понимание структуры
1. **Можно увидеть реальный Sidebar** - понять куда именно добавлять SEO Agent
2. **Проверить стили** - увидеть как выглядят активные/неактивные элементы
3. **Проверить Layout** - понять структуру Header + Sidebar + Content
4. **Проверить RequireProject** - увидеть как работает защита маршрутов

### Понимание данных
1. **Проверить stores** - увидеть структуру activeProject и activeHypothesis
2. **Проверить GraphQL запросы** - увидеть формат запросов и ответов
3. **Проверить авторизацию** - понять как работает token в cookies

### Понимание UI/UX
1. **Стили компонентов** - увидеть реальные цвета, размеры, отступы
2. **Поведение навигации** - понять как работает выделение активного пункта
3. **Адаптивность** - проверить как выглядит на разных размерах экрана

## Следующие шаги для SEO Agent

1. **Добавить маршрут** `/seo-agent` в `App.tsx`
2. **Добавить пункт меню** в Sidebar после "Branding"
3. **Создать базовую страницу** `SeoAgentPage.tsx`
4. **Проверить что все работает** - навигация, загрузка данных из stores

## Полезные команды

### Остановить сервер
```bash
# Найти процесс
lsof -ti:8080

# Остановить
kill $(lsof -ti:8080)
```

### Перезапустить
```bash
cd TRYGO-Front
npm run dev
```

### Проверить логи
Сервер запущен в фоне, логи можно посмотреть через:
- Браузер DevTools → Console
- Network tab для GraphQL запросов






