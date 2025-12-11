# Исследование системы лимитов и подписок TRYGO

**Дата**: 2025-12-11  
**Цель**: Изучить существующую систему лимитов и подписок для интеграции Traffic Channels Generator

---

## Обзор системы подписок

### Типы подписок

TRYGO использует три типа планов:

1. **FREE** - Бесплатный план (по умолчанию для новых пользователей)
2. **STARTER** - Стартовый платный план
3. **PRO** - Профессиональный платный план

### Статусы подписки

```typescript
enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',              // Активная подписка
  TRIALING = 'TRIALING',          // Пробный период
  PAST_DUE = 'PAST_DUE',          // Просрочен платеж
  UNPAID = 'UNPAID',              // Не оплачено
  CANCELED = 'CANCELED',          // Отменена
  INCOMPLETE = 'INCOMPLETE',      // Не завершена
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED', // Не завершена и истекла
  OPEN = 'OPEN',                  // Открыта
  INACTIVE = 'INACTIVE'           // Неактивна
}
```

**Активные статусы** (дают доступ к функциям):
- `ACTIVE` - полный доступ
- `TRIALING` - доступ во время пробного периода

---

## Лимиты по планам

### Таблица лимитов

| Лимит | FREE | STARTER | PRO |
|-------|------|---------|-----|
| **maxMessages** | 10 | 50 | 300 |
| **maxProjects** | 1 | 1 | 50 |
| **maxHypotheses** | 3 | 5 | 50 |
| **hasFullAccess** | ❌ false | ✅ true | ✅ true |
| **hasIcpFullAccess** | ❌ false | ✅ true | ✅ true |
| **hasValidationAnalysis** | ❌ false | ❌ false | ✅ true |
| **hasGtmChannelAccess** | ❌ false | ✅ true | ✅ true |
| **hasResearchAccess** | ❌ false | ❌ false | ✅ true |
| **hasPackingAccess** | ❌ false | ✅ true | ✅ true |

### Детальное описание лимитов

#### 1. Лимиты сообщений (maxMessages)
- **FREE**: 10 сообщений ассистенту
- **STARTER**: 50 сообщений
- **PRO**: 300 сообщений

**Использование**: Отслеживается через `assistantMessages` коллекцию, проверяется через `canSendMessage()`.

#### 2. Лимиты проектов (maxProjects)
- **FREE**: 1 проект
- **STARTER**: 1 проект
- **PRO**: 50 проектов

**Проверка**: `checkIfProjectGenerationAllowed()` в `TRYGO-Backend/src/utils/subscription/checkIfProjectGenerationAllowed.ts`

```typescript
if (subscription?.type === SubscriptionType.Starter) {
    projectsAllowed = numberOfProjects < 1;
} else if (subscription?.type === SubscriptionType.Pro) {
    projectsAllowed = numberOfProjects < 50;
} else {
    projectsAllowed = numberOfProjects < 1; // FREE
}
```

#### 3. Лимиты гипотез (maxHypotheses)
- **FREE**: 3 гипотезы
- **STARTER**: 5 гипотез
- **PRO**: 50 гипотез

**Проверка**: `canCreateHypothesis(currentHypothesesCount)` в `subscriptionStore.ts`

#### 4. Доступ к функциям (Feature Flags)

**hasFullAccess**:
- FREE: ❌
- STARTER: ✅
- PRO: ✅

**hasIcpFullAccess** (полный доступ к ICP):
- FREE: ❌
- STARTER: ✅
- PRO: ✅

**hasValidationAnalysis** (анализ валидации):
- FREE: ❌
- STARTER: ❌
- PRO: ✅

**hasGtmChannelAccess** (доступ к GTM каналам):
- FREE: ❌
- STARTER: ✅
- PRO: ✅

**hasResearchAccess** (доступ к исследованию рынка):
- FREE: ❌
- STARTER: ❌
- PRO: ✅

**hasPackingAccess** (доступ к упаковке продукта):
- FREE: ❌
- STARTER: ✅
- PRO: ✅

---

## Архитектура проверки подписок

### Frontend (React/Zustand)

**Store**: `TRYGO-Front/src/store/subscriptionStore.ts`

**Ключевые методы**:
```typescript
getCurrentPlan(): PlanType
canSendMessage(): boolean
canCreateProject(currentProjectsCount: number): boolean
canCreateHypothesis(currentHypothesesCount: number): boolean
hasFeatureAccess(feature: 'icp' | 'validation' | 'gtm-channel' | 'research' | 'packing'): boolean
isSubscriptionActive(): boolean
```

**Пример использования**:
```typescript
const { hasGtmChannelAccess, getCurrentPlan } = useSubscriptionStore();

if (!hasGtmChannelAccess) {
  // Показать upgrade prompt
}
```

### Backend (Node.js/GraphQL)

**Service**: `TRYGO-Backend/src/services/subscription/SubscriptionService.ts`

**Ключевые методы**:
```typescript
getSubscription(userId: string): Promise<Subscription | null>
checkIfSubscriptionIsActive(userId: string): Promise<void>
checkIfSubscriptionExists(userId: string): Promise<void>
```

**GraphQL Schema**: `TRYGO-Backend/src/typeDefs/subscriptionTypeDefs.graphql`

**Queries**:
- `getSubscription: Subscription`
- `getSubscriptionStripeSession: String`
- `getPromoCodeInfo(code: String!): PromoCodeInfo!`

**Mutations**:
- `createSubscriptionCheckout(type: SubscriptionType): String`
- `changeSubscription(type: SubscriptionType): String`
- `activatePromoCode(code: String!): ActivatePromoCodeResponse!`

---

## Система промокодов

### Функционал промокодов

**Service**: `TRYGO-Backend/src/services/promoCode/PromoCodeService.ts`

**Возможности**:
1. Активация промокода без Stripe (без карты)
2. Создание подписки через промокод
3. Обновление существующей подписки
4. Проверка валидности промокода

**Параметры промокода**:
- `code`: Код промокода
- `subscriptionType`: Тип подписки (STARTER/PRO)
- `durationMonths`: Длительность в месяцах (по умолчанию 12)
- `maxUses`: Максимальное количество использований
- `expiresAt`: Дата истечения
- `isActive`: Активен ли промокод

**Процесс активации**:
1. Проверка существования промокода
2. Проверка активности и срока действия
3. Проверка количества использований
4. Создание или обновление подписки
5. Увеличение счетчика использований

**Важно**: Промокоды создают подписку со статусом `ACTIVE` и `price: 0`, без привязки к Stripe.

---

## Интеграция с Stripe

### Процесс оплаты

1. **Создание checkout сессии**: `createSubscriptionCheckout(type)`
2. **Обработка успешной оплаты**: Webhook от Stripe
3. **Создание подписки**: `createSubscriptionModel()`
4. **Обновление статуса**: При изменении подписки в Stripe

### Webhook события

- `invoice.paid` - обновление статуса на `ACTIVE`
- `invoice.payment_failed` - обновление статуса на `UNPAID`
- `customer.subscription.updated` - обновление типа/статуса подписки
- `customer.subscription.deleted` - обновление статуса на `CANCELED`

---

## Текущая реализация ограничений GTM

### Проверка доступа к GTM каналам

**Frontend**: `TRYGO-Front/src/components/GtmTable.tsx`

```typescript
const hasGtmChannelAccess = hasFeatureAccess('gtm-channel');

if (!hasGtmChannelAccess) {
  // Показать upgrade modal
}
```

**Логика**:
- FREE: ❌ Нет доступа к GTM каналам
- STARTER: ✅ Есть доступ
- PRO: ✅ Есть доступ

**Проблема**: Сейчас все GTM планы заблокированы для FREE пользователей, что создает барьер для конверсии.

---

## Рекомендации для Traffic Channels Generator

### 1. Бесплатный просмотр первого канала

**Требование**: В Beginner Mode первый канал должен быть доступен бесплатно.

**Реализация**:
- Добавить проверку режима (Beginner Mode)
- Если Beginner Mode + первый канал → показать без ограничений
- Если не первый канал → показать upgrade prompt

**Код**:
```typescript
const isBeginnerMode = useModeStore(state => state.mode === 'beginner');
const currentPlan = useSubscriptionStore(state => state.getCurrentPlan());
const channelIndex = channels.indexOf(channel);

const canViewChannel = 
  (isBeginnerMode && channelIndex === 0) || // Первый канал в Beginner Mode
  (currentPlan !== PlanType.FREE); // Или платная подписка
```

### 2. Интеграция с системой лимитов

**Новый флаг доступа**: `hasGtmChannelAccess` уже существует, но нужно добавить логику для Beginner Mode.

**Обновление PLAN_LIMITS**:
```typescript
// Не нужно менять, так как Beginner Mode - это UI режим, не план
// Но нужно добавить проверку режима в hasFeatureAccess
```

### 3. Upgrade prompts

**Места для upgrade prompts**:
1. При попытке просмотреть канал после первого (Beginner Mode)
2. При попытке создать GTM стратегию с более чем 1 каналом (FREE)
3. При попытке использовать Pro Mode функции (FREE/STARTER)

**Текст upgrade prompt**:
```
"Unlock All Channels"
"Upgrade to [STARTER/PRO] to access all GTM channel plans"
"Get [X] more channels with [STARTER/PRO] plan"
```

### 4. Проверка подписки на бэкенде

**Нужно добавить**:
- Проверку режима пользователя (Beginner Mode)
- Логику для первого канала в Beginner Mode
- Ограничение для остальных каналов

**Пример**:
```typescript
async canViewGtmChannel(
  userId: string, 
  channelIndex: number, 
  isBeginnerMode: boolean
): Promise<boolean> {
  const subscription = await subscriptionService.getSubscription(userId);
  const currentPlan = getCurrentPlan(subscription);
  
  // Первый канал в Beginner Mode - всегда доступен
  if (isBeginnerMode && channelIndex === 0) {
    return true;
  }
  
  // Проверка доступа через hasGtmChannelAccess
  return PLAN_LIMITS[currentPlan].hasGtmChannelAccess;
}
```

---

## Схема данных подписки

### Subscription Model (MongoDB)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  stripeSubscriptionId: String,
  customerId: String,
  startDate: Date,
  endDate: Date,
  price: Number,
  status: SubscriptionStatus, // ACTIVE, TRIALING, etc.
  type: SubscriptionType,    // STARTER, PRO
  createdAt: Date,
  updatedAt: Date
}
```

### PlanLimits (Frontend Type)

```typescript
interface PlanLimits {
  maxMessages: number;
  maxProjects: number;
  maxHypotheses: number;
  hasFullAccess: boolean;
  hasIcpFullAccess: boolean;
  hasValidationAnalysis: boolean;
  hasGtmChannelAccess: boolean;
  hasResearchAccess: boolean;
  hasPackingAccess: boolean;
}
```

---

## Процесс перехода на платную подписку

### 1. Инициация подписки

**Frontend**:
```typescript
const checkoutUrl = await createCheckout('STARTER' | 'PRO');
window.location.href = checkoutUrl; // Redirect to Stripe
```

**Backend**:
- Создание Stripe Checkout Session
- Возврат URL для редиректа

### 2. Успешная оплата

**Stripe Webhook** → Backend:
1. Получение данных подписки из Stripe
2. Определение типа подписки по `priceId`
3. Создание записи в MongoDB
4. Установка статуса `ACTIVE`

### 3. Обновление UI

**Frontend**:
- Автоматическое обновление `subscriptionStore` после успешной оплаты
- Разблокировка функций согласно новому плану

---

## Важные моменты для реализации

### 1. Beginner Mode vs Subscription

**Важно**: Beginner Mode - это UI режим, не план подписки. Пользователь может быть в Beginner Mode с любым планом (FREE, STARTER, PRO).

**Логика**:
- Beginner Mode + FREE → Первый канал бесплатно
- Beginner Mode + STARTER/PRO → Все каналы доступны
- Pro Mode + любой план → Стандартные ограничения плана

### 2. Проверка на бэкенде

**Критично**: Все проверки доступа должны дублироваться на бэкенде для безопасности.

**Подход**:
- Frontend проверяет для UX (показывает/скрывает элементы)
- Backend проверяет для безопасности (блокирует запросы)

### 3. Кэширование подписки

**Текущая реализация**: `subscriptionStore` кэширует данные подписки.

**Рекомендация**: Обновлять кэш после:
- Успешной оплаты
- Изменения подписки
- Активации промокода

### 4. Обработка истечения подписки

**Текущая логика**: При истечении подписки статус меняется на `INACTIVE` или `CANCELED`.

**Рекомендация**: 
- Показывать предупреждение за 7 дней до истечения
- Блокировать функции после истечения
- Предлагать продление

---

## Выводы

1. **Система лимитов существует** и хорошо структурирована
2. **GTM каналы уже имеют флаг доступа** (`hasGtmChannelAccess`)
3. **Нужно добавить логику для Beginner Mode** - первый канал бесплатно
4. **Промокоды работают без Stripe** - можно использовать для бесплатных периодов
5. **Проверки должны быть на фронте и бэке** для безопасности

---

## Следующие шаги

1. ✅ Добавить проверку Beginner Mode в `hasFeatureAccess`
2. ✅ Обновить логику просмотра GTM каналов для первого канала
3. ✅ Добавить upgrade prompts для остальных каналов
4. ✅ Реализовать проверки на бэкенде
5. ✅ Обновить спецификацию с учетом системы лимитов




