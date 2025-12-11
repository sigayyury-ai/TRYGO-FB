import type { WordPressConnection } from "./apiClient";
import FormData from "form-data";

/**
 * Upload an image to WordPress and return the media ID
 * @param imageUrl - URL or data URI (base64) of the image to upload
 * @param connection - WordPress connection settings
 * @returns Media ID if successful, null otherwise
 */
export async function uploadImageToWordPress(
  imageUrl: string,
  connection: WordPressConnection
): Promise<number | null> {
  try {
    console.log(`[uploadImageToWordPress] Загрузка изображения: ${imageUrl.substring(0, 100)}...`);
    
    let imageBuffer: Buffer;
    let contentType: string;
    let filename: string;
    
    // Handle data URI (base64) images
    if (imageUrl.startsWith('data:')) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error(`[uploadImageToWordPress] ❌ Неверный формат data URI`);
        return null;
      }
      contentType = matches[1];
      const base64Data = matches[2];
      imageBuffer = Buffer.from(base64Data, 'base64');
      filename = `image.${contentType.split('/')[1] || 'jpg'}`;
      console.log(`[uploadImageToWordPress] Обработка base64 изображения, тип: ${contentType}`);
    } else {
      // Fetch the image from URL (using global fetch available in Node.js 18+)
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`[uploadImageToWordPress] ❌ Не удалось загрузить изображение: ${imageResponse.status}`);
        return null;
      }
      
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Get filename from URL
      const urlParts = imageUrl.split('/');
      filename = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
    }
    
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename,
      contentType
    });
    
    // Upload to WordPress media library
    const uploadUrl = `${connection.baseUrl}/wp-json/wp/v2/media`;
    const authHeader = `Basic ${Buffer.from(`${connection.username}:${connection.appPassword}`).toString('base64')}`;
    
    // Use node-fetch for FormData support in Node.js
    const nodeFetch = (await import('node-fetch')).default;
    const uploadResponse = await nodeFetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        ...formData.getHeaders()
      },
      body: formData as any // node-fetch accepts FormData directly
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[uploadImageToWordPress] ❌ Ошибка загрузки в WordPress: ${uploadResponse.status}`, errorText);
      return null;
    }
    
    const mediaData = await uploadResponse.json() as any;
    
    if (!mediaData.id) {
      console.error(`[uploadImageToWordPress] ❌ WordPress не вернул media ID`);
      return null;
    }
    
    console.log(`[uploadImageToWordPress] ✅ Изображение загружено, media ID: ${mediaData.id}`);
    return mediaData.id;
  } catch (error: any) {
    console.error(`[uploadImageToWordPress] ❌ Ошибка загрузки изображения:`, error.message);
    return null;
  }
}
