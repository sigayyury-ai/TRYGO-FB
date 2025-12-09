# Система промокодов

## Обзор

Система промокодов позволяет активировать PRO или STARTER подписки без использования Stripe. Промокоды можно использовать в настройках приложения.

---

## Для пользователей

### Использование в приложении

1. Откройте **Settings** в приложении
2. Найдите секцию **"Promo Code"**
3. Введите код промокода (например, `PRO1`)
4. Нажмите **"Check"** для проверки валидности
5. Если промокод валиден, нажмите **"Activate"**
6. Подписка активируется автоматически

### UI Функционал

- **Ввод промокода**: Поле автоматически переводит в верхний регистр, можно нажать Enter для проверки
- **Проверка промокода**: Кнопка "Check" проверяет валидность и показывает информацию
- **Активация промокода**: Кнопка "Activate" активирует промокод и обновляет подписку

---

## Для администраторов

### Создание промокодов

#### Через скрипт (Рекомендуется)

```bash
cd TRYGO-Backend
node create-promo-code.js <код> <тип> [месяцы] [использований] [дата_истечения]
```

**Примеры:**
```bash
# PRO подписка на 12 месяцев, 100 использований
node create-promo-code.js PRO2024 PRO 12 100

# PRO подписка на 1 месяц, многоразовый
node create-promo-code.js PRO1 PRO 1 1000

# PRO подписка с датой истечения
node create-promo-code.js PRO2024 PRO 12 100 "2025-12-31"

# STARTER подписка на 6 месяцев
node create-promo-code.js STARTER2024 STARTER 6 50
```

#### Через GraphQL

```graphql
mutation {
  createPromoCode(
    code: "PRO2024"
    subscriptionType: PRO
    durationMonths: 12
    maxUses: 100
    expiresAt: "2025-12-31"
    description: "Промокод для бета-тестеров"
  ) {
    id
    code
    subscriptionType
    durationMonths
    maxUses
    usedCount
    isActive
    expiresAt
  }
}
```

#### Напрямую через MongoDB

```javascript
db.promocodes.insertOne({
  code: "PRO2024",
  subscriptionType: "PRO",
  durationMonths: 12,
  maxUses: 100,
  usedCount: 0,
  isActive: true,
  expiresAt: new Date("2025-12-31"),
  description: "Промокод для бета-тестеров",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Обновление промокодов

```bash
cd TRYGO-Backend
node update-promo-code.js <код> [maxUses] [isActive] [expiresAt]
```

**Примеры:**
```bash
# Увеличить количество использований
node update-promo-code.js PRO1 1000

# Деактивировать промокод
node update-promo-code.js PRO1 1000 false

# Установить дату истечения
node update-promo-code.js PRO1 1000 true "2025-12-31"
```

### Проверка промокодов

#### Через GraphQL

```graphql
query {
  getAllPromoCodes {
    id
    code
    subscriptionType
    durationMonths
    maxUses
    usedCount
    isActive
    expiresAt
  }
}
```

#### Через MongoDB

```javascript
// Все промокоды
db.promocodes.find().pretty()

// Активные промокоды
db.promocodes.find({ isActive: true }).pretty()

// Промокоды с истекшим сроком
db.promocodes.find({ 
  expiresAt: { $lt: new Date() } 
}).pretty()

// Промокоды, которые использованы полностью
db.promocodes.find({ 
  $expr: { $gte: ["$usedCount", "$maxUses"] }
}).pretty()
```

### Деактивация промокода

```javascript
db.promocodes.updateOne(
  { code: "PRO2024" },
  { $set: { isActive: false } }
)
```

### Удаление промокода

```javascript
db.promocodes.deleteOne({ code: "PRO2024" })
```

---

## API

### Проверка промокода (без активации)

```graphql
query {
  getPromoCodeInfo(code: "PRO1") {
    code
    subscriptionType
    durationMonths
    isValid
    message
  }
}
```

### Активация промокода

```graphql
mutation {
  activatePromoCode(code: "PRO1") {
    success
    message
  }
}
```

---

## Структура данных

### Промокод

```typescript
{
  code: string;              // Код промокода (уникальный, uppercase)
  subscriptionType: "PRO" | "STARTER";
  durationMonths: number;    // Длительность подписки в месяцах
  maxUses: number;           // Максимальное количество использований
  usedCount: number;         // Количество использований
  isActive: boolean;         // Активен ли промокод
  expiresAt?: Date;          // Дата истечения (опционально)
  description?: string;      // Описание (опционально)
  createdBy?: ObjectId;      // ID создателя (опционально)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Валидация

Промокод считается валидным, если:
- ✅ Промокод существует в базе
- ✅ `isActive === true`
- ✅ Не истек срок действия (если указан `expiresAt`)
- ✅ `usedCount < maxUses`

---

## Поведение при активации

1. **Если у пользователя нет подписки:**
   - Создается новая подписка с типом из промокода
   - Статус: `ACTIVE`
   - Цена: `0` (бесплатно)
   - Срок действия: текущая дата + `durationMonths`

2. **Если у пользователя уже есть подписка:**
   - Существующая подписка обновляется
   - Тип меняется на тип из промокода
   - Статус: `ACTIVE`
   - Срок действия продлевается на `durationMonths` месяцев

3. **После активации:**
   - `usedCount` увеличивается на 1
   - Если `usedCount >= maxUses`, промокод больше нельзя использовать

---

## Примеры использования

### Создать промокод для бета-тестеров
```bash
node create-promo-code.js BETATEST2024 PRO 12 50
```

### Создать одноразовый промокод для конкретного пользователя
```bash
node create-promo-code.js USER123 PRO 6 1
```

### Создать промокод с ограниченным сроком действия
```bash
node create-promo-code.js NEWYEAR2025 PRO 12 1000 "2025-01-31"
```

---

## Интеграция с фронтендом

### Файлы

- `TRYGO-Front/src/api/activatePromoCode.ts` - активация промокода
- `TRYGO-Front/src/api/getPromoCodeInfo.ts` - проверка промокода
- `TRYGO-Front/src/pages/Settings.tsx` - UI компонент

### Расположение UI

Промокод секция добавлена в `Settings.tsx` между секциями:
- Subscription & Plan
- **Promo Code** ← новая секция
- AI Assistant Configuration

### Пример использования

```typescript
import { activatePromoCode } from '@/api/activatePromoCode';
import { getPromoCodeInfo } from '@/api/getPromoCodeInfo';

// Проверка промокода
const info = await getPromoCodeInfo('PRO1');

// Активация промокода
const result = await activatePromoCode('PRO1');
```

---

## Безопасность

- ✅ Промокоды проверяются на валидность перед активацией
- ✅ Один промокод может быть использован ограниченное количество раз
- ✅ Промокоды могут иметь срок действия
- ⚠️ TODO: Добавить проверку ADMIN роли для создания промокодов через GraphQL
- ⚠️ TODO: Добавить логирование активаций промокодов

---

## Примечания

- Промокоды создают подписки без связи со Stripe
- `stripeSubscriptionId` и `customerId` генерируются автоматически с префиксом `promo_`
- Цена подписки всегда `0` при активации через промокод
- Если у пользователя уже есть подписка, она будет обновлена, а не создана новая

---

## Связанные файлы

### Backend
- `TRYGO-Backend/src/models/PromoCodeModel.ts` - модель промокода
- `TRYGO-Backend/src/services/promoCode/PromoCodeService.ts` - сервис
- `TRYGO-Backend/src/resolvers/promoCode/` - GraphQL резолверы
- `TRYGO-Backend/create-promo-code.js` - скрипт для создания промокодов
- `TRYGO-Backend/update-promo-code.js` - скрипт для обновления промокодов

### Frontend
- `TRYGO-Front/src/api/activatePromoCode.ts` - API активации
- `TRYGO-Front/src/api/getPromoCodeInfo.ts` - API проверки
- `TRYGO-Front/src/pages/Settings.tsx` - UI компонент

---

## Текущие промокоды

- **PRO1** - PRO подписка, 1 месяц, 1000 использований
- **PRO2024** - PRO подписка, 12 месяцев, 100 использований

