# Исправление генерации контента для идей из беклога

## 🔍 Найденная проблема

**Ошибка**: `Enum "ContentCategory" cannot represent value: "PAIN"`

### Причина
В функции `mapContentItem` использовался `toUpperEnum(doc.category)`, который просто преобразует категорию из базы данных в верхний регистр:
- База данных: `"pain"` → `toUpperEnum()` → `"PAIN"`
- GraphQL схема ожидает: `"PAINS"` (множественное число)

### Несоответствие схемы и данных

**GraphQL схема** (`ContentCategory` enum):
- `PAINS` (множественное число)
- `GOALS`
- `TRIGGERS`
- `PRODUCT_FEATURES`
- `BENEFITS`
- `FAQS`
- `INFORMATIONAL`

**База данных** (SeoContentItem.category):
- `pain` (единственное число)
- `goal`
- `trigger`
- `feature`
- `benefit`
- `faq`
- `info`

## ✅ Исправление

Обновлена функция `mapContentItem` для правильного маппинга категорий:

```typescript
const mapContentItem = (doc: SeoContentItemDoc) => {
  // Map category from database format to GraphQL enum format
  const categoryMap: Record<string, string> = {
    pain: "PAINS",
    goal: "GOALS",
    trigger: "TRIGGERS",
    feature: "PRODUCT_FEATURES",
    benefit: "BENEFITS",
    faq: "FAQS",
    info: "INFORMATIONAL"
  };
  const category = categoryMap[doc.category] || toUpperEnum(doc.category);

  return {
    // ... остальные поля
    category,
    // ...
  };
};
```

## 🎯 Результат

✅ Генерация контента для идей из беклога теперь работает корректно
✅ Категории правильно маппятся из базы данных в GraphQL enum
✅ Ошибка `Enum "ContentCategory" cannot represent value: "PAIN"` исправлена

## 📝 Дополнительные проверки

1. ✅ Frontend Logger работает и отправляет логи на бэкенд
2. ✅ Загрузка настроек исправлена (ошибка 400)
3. ✅ SEO Agent backend запущен на порту 4100
4. ✅ Маппинг категорий исправлен




