# Система промокодов

## Обзор

Система промокодов позволяет активировать PRO или STARTER подписки без использования Stripe. Промокоды можно использовать в настройках приложения.

## Использование

### Для пользователей

1. **В настройках приложения** найдите раздел "Промокод" или "Promo Code"
2. Введите код промокода
3. Нажмите "Активировать"
4. Подписка будет активирована автоматически

### GraphQL запросы

**Проверить промокод (без активации):**
```graphql
query {
  getPromoCodeInfo(code: "PRO2024") {
    code
    subscriptionType
    durationMonths
    isValid
    message
  }
}
```

**Активировать промокод:**
```graphql
mutation {
  activatePromoCode(code: "PRO2024") {
    success
    message
  }
}
```

## Создание промокодов

### Через скрипт (Рекомендуется)

```bash
cd TRYGO-Backend
node create-promo-code.js <code> <type> [durationMonths] [maxUses] [expiresAt]
```

**Примеры:**
```bash
# PRO подписка на 12 месяцев, одноразовый
node create-promo-code.js PRO2024 PRO 12 1

# PRO подписка на 12 месяцев, 100 использований
node create-promo-code.js PRO2024 PRO 12 100

# PRO подписка с датой истечения
node create-promo-code.js PRO2024 PRO 12 1 "2025-12-31"

# STARTER подписка на 6 месяцев
node create-promo-code.js STARTER2024 STARTER 6 50
```

### Через GraphQL (для админов)

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

### Напрямую через MongoDB

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

## Структура промокода

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

## Валидация промокодов

Промокод считается валидным, если:
- ✅ Промокод существует в базе
- ✅ `isActive === true`
- ✅ Не истек срок действия (если указан `expiresAt`)
- ✅ `usedCount < maxUses`

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

## Проверка промокодов

### Через GraphQL
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

### Через MongoDB
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

## Деактивация промокода

```javascript
db.promocodes.updateOne(
  { code: "PRO2024" },
  { $set: { isActive: false } }
)
```

## Удаление промокода

```javascript
db.promocodes.deleteOne({ code: "PRO2024" })
```

## Интеграция с фронтендом

На фронтенде нужно добавить:
1. Поле ввода промокода в настройках
2. Кнопку "Активировать"
3. Запрос `activatePromoCode` mutation
4. Отображение результата (успех/ошибка)

Пример компонента (React):
```typescript
const [promoCode, setPromoCode] = useState('');
const [loading, setLoading] = useState(false);

const handleActivate = async () => {
  setLoading(true);
  try {
    const { data } = await client.mutate({
      mutation: ACTIVATE_PROMO_CODE,
      variables: { code: promoCode },
    });
    // Показать успешное сообщение
    // Обновить информацию о подписке
  } catch (error) {
    // Показать ошибку
  } finally {
    setLoading(false);
  }
};
```

## Безопасность

- ✅ Промокоды проверяются на валидность перед активацией
- ✅ Один промокод может быть использован ограниченное количество раз
- ✅ Промокоды могут иметь срок действия
- ⚠️ TODO: Добавить проверку ADMIN роли для создания промокодов через GraphQL
- ⚠️ TODO: Добавить логирование активаций промокодов

## Примечания

- Промокоды создают подписки без связи со Stripe
- `stripeSubscriptionId` и `customerId` генерируются автоматически с префиксом `promo_`
- Цена подписки всегда `0` при активации через промокод
- Если у пользователя уже есть подписка, она будет обновлена, а не создана новая

