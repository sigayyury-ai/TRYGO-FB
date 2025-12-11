# Исправление проблемы с истекающими URL изображений DALL-E

## 🔍 Проблема

**Ошибка**: `403 (Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.)`

**Причина**: 
- OpenAI DALL-E возвращает временные URL из Azure Blob Storage с SAS токенами
- Эти URL имеют ограниченное время жизни (обычно 1 час)
- Когда фронтенд пытается загрузить изображение позже, токен уже истек

**URL формат**:
```
https://oaidalleapiprodscus.blob.core.windows.net/private/org-.../...?sv=...&sig=...
```

## ✅ Решение

Добавлен функционал для скачивания изображения от DALL-E и конвертации его в data URL для постоянного хранения:

```typescript
if (response.data && response.data[0]?.url) {
  const dallEUrl = response.data[0].url;
  
  // Download and save image to avoid expired Azure Blob Storage URLs
  try {
    const imageResponse = await fetch(dallEUrl, {
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (imageResponse.ok) {
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      // Convert to data URL for permanent storage
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${contentType};base64,${imageBase64}`;
      
      return {
        imageUrl: dataUrl
      };
    }
  } catch (downloadError) {
    // Fallback to original URL if download fails
    return {
      imageUrl: dallEUrl
    };
  }
}
```

## 🎯 Результат

✅ Изображения от DALL-E теперь скачиваются сразу после генерации
✅ Конвертируются в data URL (base64) для постоянного хранения
✅ Не зависят от истекающих токенов Azure Blob Storage
✅ Сохраняются в базе данных как постоянные data URL

## ⚠️ Предупреждение ReactQuill

**Предупреждение**: `[Deprecation] Listener added for a 'DOMNodeInserted' mutation event`

Это предупреждение от библиотеки `react-quill` о deprecated API. Не критично, но можно:
- Обновить `react-quill` до последней версии (если доступна)
- Игнорировать предупреждение (не влияет на функциональность)

## 📝 Дополнительные улучшения

В будущем можно:
1. Сохранять изображения в постоянное хранилище (S3, Cloudinary, etc.)
2. Использовать images-service для хранения изображений
3. Генерировать постоянные URL через CDN




