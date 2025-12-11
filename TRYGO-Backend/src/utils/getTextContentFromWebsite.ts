import axios from "axios";
import * as cheerio from "cheerio";

export const getTextContentFromWebsite = async (url: string) => {
    try {
        // Перевіряємо чи URL має протокол, якщо ні - додаємо https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        const { data } = await axios.get(url, {
            timeout: 15000, // 15 seconds timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(data);
        // Видаляємо всі невидимі та службові теги
        $("script, style, head, meta, noscript").remove();
        // Витягуємо текст з body, видаляємо зайві пробіли
        const text = $("body").text().replace(/\s+/g, " ").trim();
        return text;
    } catch (error: any) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.error('Request timeout error:', error.message);
            throw new Error('Request timeout: Unable to fetch website, please check the url');
        }
        console.error(error);
        throw error;
    }
};