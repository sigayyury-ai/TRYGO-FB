# Инструкция: Добавление PRO подписки

## Вариант 1: Через скрипт (Рекомендуется)

### Шаги:

1. **Убедитесь, что у вас есть email пользователя**

2. **Запустите скрипт:**
   ```bash
   cd TRYGO-Backend
   node add-pro-subscription.js <ваш-email>
   ```

   Пример:
   ```bash
   node add-pro-subscription.js user@example.com
   ```

3. **Скрипт автоматически:**
   - Найдет пользователя по email
   - Создаст или обновит подписку на PRO
   - Установит статус ACTIVE
   - Установит срок действия на 1 год вперед

---

## Вариант 2: Напрямую через MongoDB

### Шаги:

1. **Подключитесь к MongoDB:**
   ```bash
   mongosh "ваш-mongo-uri"
   ```

2. **Найдите ID пользователя:**
   ```javascript
   use your-database-name
   db.users.findOne({ email: "ваш-email@example.com" })
   // Запомните _id пользователя
   ```

3. **Создайте или обновите подписку:**

   **Если подписки нет:**
   ```javascript
   db.subscriptions.insertOne({
     userId: ObjectId("ID_ПОЛЬЗОВАТЕЛЯ"),
     type: "PRO",
     status: "ACTIVE",
     price: 0,
     startDate: new Date(),
     endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 год
     stripeSubscriptionId: "manual_" + Date.now(),
     customerId: "manual_customer_" + Date.now(),
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   **Если подписка уже есть:**
   ```javascript
   db.subscriptions.updateOne(
     { userId: ObjectId("ID_ПОЛЬЗОВАТЕЛЯ") },
     {
       $set: {
         type: "PRO",
         status: "ACTIVE",
         price: 0,
         startDate: new Date(),
         endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
         updatedAt: new Date()
       }
     }
   )
   ```

---

## Разница между ADMIN ролью и PRO подпиской

### ADMIN роль (`role: "ADMIN"`)
- **Назначение**: Административные права в системе
- **Использование**: Управление системой, доступ к админ-панели
- **Хранится в**: `users.role`
- **Не связана с функционалом PRO тарифа**

### PRO подписка (`type: "PRO"`)
- **Назначение**: Доступ к премиум функционалу приложения
- **Использование**: Расширенные возможности (SEO Agent, больше проектов, etc.)
- **Хранится в**: `subscriptions.type`
- **Связана со Stripe** (но можно создать вручную)

### Вывод:
**Для доступа к функционалу PRO тарифа нужна именно PRO подписка, а не ADMIN роль.**

ADMIN роль дает административные права, но не дает доступ к премиум функционалу приложения.

---

## Проверка подписки

После добавления подписки, вы можете проверить её через GraphQL:

```graphql
query {
  getSubscription {
    id
    type
    status
    endDate
    price
  }
}
```

Или через MongoDB:
```javascript
db.subscriptions.findOne({ userId: ObjectId("ID_ПОЛЬЗОВАТЕЛЯ") })
```

---

## Важные замечания

1. **Stripe поля**: Скрипт создает фиктивные `stripeSubscriptionId` и `customerId` для совместимости. Если позже вы захотите подключить реальный Stripe, эти поля можно будет обновить.

2. **Срок действия**: По умолчанию подписка устанавливается на 1 год. Вы можете изменить это в скрипте или при ручном создании.

3. **Статусы подписки**: 
   - `ACTIVE` - активная подписка (работает)
   - `TRIALING` - пробный период
   - `CANCELED` - отменена
   - `UNPAID` - не оплачена

4. **Типы подписки**:
   - `STARTER` - базовый тариф
   - `PRO` - премиум тариф

---

## Откат изменений

Если нужно удалить подписку:

```javascript
db.subscriptions.deleteOne({ userId: ObjectId("ID_ПОЛЬЗОВАТЕЛЯ") })
```

Или через скрипт (можно добавить опцию `--remove`):
```bash
node add-pro-subscription.js user@example.com --remove
```






