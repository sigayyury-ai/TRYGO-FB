# Быстрое добавление PRO подписки

## Самый простой способ:

```bash
cd TRYGO-Backend
node add-pro-subscription.js ваш-email@example.com
```

Готово! ✅

---

## Что делает скрипт:

1. ✅ Находит вашего пользователя по email
2. ✅ Создает или обновляет подписку на PRO
3. ✅ Устанавливает статус ACTIVE
4. ✅ Устанавливает срок на 1 год

---

## Удаление подписки:

```bash
node add-pro-subscription.js ваш-email@example.com --remove
```

---

## Важно:

- **PRO подписка ≠ ADMIN роль**
- Для доступа к функционалу PRO нужна именно подписка `type: "PRO"`
- ADMIN роль дает только административные права

---

## Проверка:

После выполнения скрипта, войдите в приложение и проверьте доступ к PRO функциям.

Или через GraphQL:
```graphql
query {
  getSubscription {
    type
    status
  }
}
```

---

Подробная инструкция: см. `ADD_PRO_SUBSCRIPTION.md`






