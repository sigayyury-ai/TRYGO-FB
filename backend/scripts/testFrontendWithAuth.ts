import { chromium } from 'playwright';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Автоматический тест фронтенда с ожиданием авторизации пользователя
 * Открывает браузер, ждет авторизации, затем проверяет отображение идей
 */

async function testFrontendWithAuth() {
  let browser: any = null;
  
  try {
    console.log("=".repeat(70));
    console.log("🌐 АВТОМАТИЧЕСКИЙ ТЕСТ ФРОНТЕНДА С АВТОРИЗАЦИЕЙ");
    console.log("=".repeat(70));
    console.log();

    // 1. Получаем данные из БД для проверки
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    if (!project) {
      throw new Error("Project not found");
    }

    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });
    if (!hypothesis) {
      throw new Error("Hypothesis not found");
    }

    const projectId = project._id.toString();
    const hypothesisId = hypothesis._id.toString();
    
    console.log("✅ Ожидаемые данные:");
    console.log(`   Project: ${project.title} (${projectId})`);
    console.log(`   Hypothesis: ${hypothesis.title} (${hypothesisId})`);
    console.log();

    // 2. Запускаем браузер
    console.log("2️⃣ ЗАПУСК БРАУЗЕРА");
    console.log("-".repeat(70));
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 100 // Замедляем для визуального наблюдения
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Перехватываем console.log
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('[SeoContentPanel]') || text.includes('[ContentIdeasList]') || text.includes('[seoAgentClient]')) {
        console.log(`[BROWSER CONSOLE] ${text}`);
      }
    });

    // Перехватываем ошибки
    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR] ${error.message}`);
    });

    console.log("✅ Браузер запущен");
    console.log();

    // 3. Открываем страницу авторизации или главную
    console.log("3️⃣ ОЖИДАНИЕ АВТОРИЗАЦИИ");
    console.log("-".repeat(70));
    console.log("Открываю главную страницу...");
    console.log("💡 ПОЖАЛУЙСТА, АВТОРИЗУЙТЕСЬ В БРАУЗЕРЕ!");
    console.log("   После авторизации нажмите Enter в этом терминале...");
    console.log();
    
    await page.goto("http://localhost:8080", { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log("✅ Страница открыта");
    console.log();
    
    // Ждем, пока пользователь авторизуется
    console.log("⏳ Ожидаю авторизации...");
    console.log("   Проверяю наличие токена в cookies каждые 2 секунды...");
    console.log();
    
    let tokenFound = false;
    let attempts = 0;
    const maxAttempts = 60; // 2 минуты максимум
    
    while (!tokenFound && attempts < maxAttempts) {
      await page.waitForTimeout(2000);
      attempts++;
      
      const cookies = await context.cookies();
      const tokenCookie = cookies.find(c => c.name === 'token');
      
      if (tokenCookie && tokenCookie.value) {
        tokenFound = true;
        console.log(`✅ Токен найден! (попытка ${attempts})`);
        console.log(`   Токен: ${tokenCookie.value.substring(0, 30)}...`);
        break;
      }
      
      if (attempts % 5 === 0) {
        console.log(`   Проверка ${attempts}/${maxAttempts}... (токен еще не найден)`);
      }
    }
    
    if (!tokenFound) {
      console.error("❌ Токен не найден за 2 минуты!");
      console.log("   Продолжаю без токена...");
    }
    console.log();

    // 4. Сохраняем cookies
    console.log("4️⃣ СОХРАНЕНИЕ COOKIES");
    console.log("-".repeat(70));
    const cookies = await context.cookies();
    console.log(`Найдено cookies: ${cookies.length}`);
    cookies.forEach(cookie => {
      if (cookie.name === 'token' || cookie.name === 'activeProjectId' || cookie.name === 'activeHypothesisId') {
        console.log(`   ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
      }
    });
    console.log();

    // 5. Переходим на страницу SEO Agent
    console.log("5️⃣ ПЕРЕХОД НА СТРАНИЦУ SEO AGENT");
    console.log("-".repeat(70));
    const url = "http://localhost:8080/seo-agent#content";
    console.log(`Открываю: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log("✅ Страница загружена");
    console.log();

    // 6. Ждем загрузки контента
    console.log("6️⃣ ОЖИДАНИЕ ЗАГРУЗКИ КОНТЕНТА");
    console.log("-".repeat(70));
    await page.waitForTimeout(10000); // Даем больше времени на загрузку
    
    const pageTitle = await page.title();
    console.log(`Заголовок страницы: ${pageTitle}`);
    console.log(`Текущий URL: ${page.url()}`);
    console.log();

    // 7. Проверяем логи консоли
    console.log("7️⃣ ПРОВЕРКА ЛОГОВ КОНСОЛИ");
    console.log("-".repeat(70));
    const seoContentPanelLogs = consoleMessages.filter(msg => msg.includes('[SeoContentPanel]'));
    const contentIdeasListLogs = consoleMessages.filter(msg => msg.includes('[ContentIdeasList]'));
    const seoAgentClientLogs = consoleMessages.filter(msg => msg.includes('[seoAgentClient]'));
    
    console.log(`Всего логов: ${consoleMessages.length}`);
    console.log(`Логов [SeoContentPanel]: ${seoContentPanelLogs.length}`);
    console.log(`Логов [ContentIdeasList]: ${contentIdeasListLogs.length}`);
    console.log(`Логов [seoAgentClient]: ${seoAgentClientLogs.length}`);
    console.log();
    
    if (seoContentPanelLogs.length > 0) {
      console.log("Последние логи SeoContentPanel:");
      seoContentPanelLogs.slice(-10).forEach(log => console.log(`   ${log}`));
    }
    if (seoAgentClientLogs.length > 0) {
      console.log("Последние логи seoAgentClient:");
      seoAgentClientLogs.slice(-5).forEach(log => console.log(`   ${log}`));
    }
    if (contentIdeasListLogs.length > 0) {
      console.log("Последние логи ContentIdeasList:");
      contentIdeasListLogs.slice(-5).forEach(log => console.log(`   ${log}`));
    }
    console.log();

    // 8. Проверяем, что видно на странице
    console.log("8️⃣ ДИАГНОСТИКА СТРАНИЦЫ");
    console.log("-".repeat(70));
    
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasSeoAgent = bodyText.includes('SEO Agent') || bodyText.includes('Content Production');
      const hasLoader = !!document.querySelector('.loader, [class*="spinner"], [class*="loading"]');
      const hasError = bodyText.includes('Error') || bodyText.includes('error');
      const hasNoProjects = bodyText.includes('No projects') || bodyText.includes('create a project');
      const hasNoHypothesis = bodyText.includes('No hypotheses') || bodyText.includes('create a hypothesis');
      const hasContentPanel = !!document.querySelector('[class*="content-ideas"], .idea-section');
      const hasTabs = !!document.querySelector('[role="tablist"], [class*="tabs"]');
      const hasIdeas = bodyText.includes('suggestion') || bodyText.includes('Как преодолеть') || bodyText.includes('PAINS') || bodyText.includes('Articles by pains');
      
      return {
        hasSeoAgent,
        hasLoader,
        hasError,
        hasNoProjects,
        hasNoHypothesis,
        hasContentPanel,
        hasTabs,
        hasIdeas,
        bodyTextPreview: bodyText.substring(0, 1500)
      };
    });
    
    console.log("Элементы на странице:");
    console.log(`   SEO Agent текст: ${pageInfo.hasSeoAgent}`);
    console.log(`   Loader: ${pageInfo.hasLoader}`);
    console.log(`   Error: ${pageInfo.hasError}`);
    console.log(`   No projects: ${pageInfo.hasNoProjects}`);
    console.log(`   No hypothesis: ${pageInfo.hasNoHypothesis}`);
    console.log(`   Content Panel: ${pageInfo.hasContentPanel}`);
    console.log(`   Tabs: ${pageInfo.hasTabs}`);
    console.log(`   Has ideas text: ${pageInfo.hasIdeas}`);
    console.log();

    // 9. Проверяем количество идей через JavaScript
    console.log("9️⃣ ПРОВЕРКА ИДЕЙ НА СТРАНИЦЕ");
    console.log("-".repeat(70));
    const ideasCount = await page.evaluate(() => {
      // Ищем все секции с идеями
      const sections = document.querySelectorAll('.idea-section[data-category]');
      let totalIdeas = 0;
      const categoryCounts: Record<string, number> = {};
      
      sections.forEach(section => {
        const category = section.getAttribute('data-category');
        const ideas = section.querySelectorAll('.idea-card, [data-idea-id], [class*="idea-card"], [class*="ContentIdeaCard"]');
        const count = ideas.length;
        totalIdeas += count;
        if (category) {
          categoryCounts[category] = count;
        }
      });
      
      // Также проверяем через текст
      const bodyText = document.body.innerText || '';
      const ideaTitles = [
        'Как преодолеть',
        'Трудности в масштабировании',
        'Как ограниченный бюджет',
        'Articles by pains',
        'suggestion'
      ];
      const foundTitles = ideaTitles.filter(title => bodyText.includes(title));
      
      return { 
        totalIdeas, 
        categoryCounts, 
        sectionsCount: sections.length,
        foundTitles: foundTitles.length,
        bodyTextLength: bodyText.length
      };
    });
    
    console.log(`Всего идей на странице: ${ideasCount.totalIdeas}`);
    console.log(`Секций категорий: ${ideasCount.sectionsCount}`);
    console.log(`Найдено заголовков идей в тексте: ${ideasCount.foundTitles}`);
    console.log(`Длина текста страницы: ${ideasCount.bodyTextLength} символов`);
    console.log("Идеи по категориям:", ideasCount.categoryCounts);
    console.log();

    // 10. Делаем скриншот
    console.log("🔟 СКРИНШОТ");
    console.log("-".repeat(70));
    await page.screenshot({ path: '/tmp/seo-agent-content-test.png', fullPage: true });
    console.log("✅ Скриншот сохранен: /tmp/seo-agent-content-test.png");
    console.log();

    // 11. Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    
    if (ideasCount.totalIdeas > 0 || ideasCount.foundTitles > 0 || pageInfo.hasIdeas) {
      console.log("✅✅✅ ИДЕИ ОТОБРАЖАЮТСЯ НА СТРАНИЦЕ! ✅✅✅");
      console.log(`   Найдено идей: ${ideasCount.totalIdeas}`);
      console.log(`   Найдено заголовков в тексте: ${ideasCount.foundTitles}`);
      console.log(`   Секций: ${ideasCount.sectionsCount}`);
      console.log(`   Content Panel найден: ${pageInfo.hasContentPanel}`);
    } else {
      console.log("❌ ИДЕИ НЕ ОТОБРАЖАЮТСЯ!");
      console.log();
      console.log("🔍 ДИАГНОСТИКА:");
      console.log(`   Логов SeoContentPanel: ${seoContentPanelLogs.length}`);
      console.log(`   Логов ContentIdeasList: ${contentIdeasListLogs.length}`);
      console.log(`   Логов seoAgentClient: ${seoAgentClientLogs.length}`);
      console.log(`   Секций категорий: ${ideasCount.sectionsCount}`);
      console.log(`   Content Panel элемент: ${pageInfo.hasContentPanel}`);
      console.log(`   Tabs элемент: ${pageInfo.hasTabs}`);
      console.log(`   Error: ${pageInfo.hasError}`);
      console.log(`   No projects: ${pageInfo.hasNoProjects}`);
      
      if (seoContentPanelLogs.length === 0) {
        console.log("   ⚠️ Нет логов SeoContentPanel - компонент может не загружаться");
      }
      if (contentIdeasListLogs.length === 0) {
        console.log("   ⚠️ Нет логов ContentIdeasList - компонент может не рендериться");
      }
      if (seoAgentClientLogs.length === 0) {
        console.log("   ⚠️ Нет логов seoAgentClient - запросы могут не отправляться");
      }
      if (pageInfo.hasNoProjects) {
        console.log("   ⚠️ Показывается 'No projects' - проекты не загружаются");
      }
    }
    console.log();

    await mongoose.connection.close();
    
    // Оставляем браузер открытым на 10 секунд для визуальной проверки
    console.log("⏳ Оставляю браузер открытым на 10 секунд для визуальной проверки...");
    await page.waitForTimeout(10000);
    
    await browser.close();
    
  } catch (error: any) {
    console.error("\n❌ Ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

testFrontendWithAuth().catch(async (error) => {
  if (error.message.includes('playwright') || error.message.includes('chromium')) {
    console.error("\n❌ Playwright не установлен!");
    console.log("\n💡 Установите Playwright:");
    console.log("   npm install -D playwright");
    console.log("   npx playwright install chromium");
  } else {
    console.error("\n❌ Ошибка:", error.message);
  }
  process.exit(1);
});


