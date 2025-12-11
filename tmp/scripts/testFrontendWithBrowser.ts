import { chromium } from 'playwright';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Автоматический тест фронтенда с использованием браузера
 * Открывает страницу, авторизуется, проверяет отображение идей, читает логи
 */

async function generateToken(userId: string): Promise<string> {
  try {
    // Пробуем импортировать jwt
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.warn("⚠️ JWT_SECRET не установлен, проверяю .env файл");
      // Пробуем найти секрет в других местах
      const possibleSecrets = [
        'your-secret-key',
        'trygo-secret-key',
        'dev-secret-key'
      ];
      
      for (const possibleSecret of possibleSecrets) {
        try {
          const testToken = jwt.default.sign({ id: userId }, possibleSecret, { expiresIn: '7d' });
          console.log(`✅ Использую секрет: ${possibleSecret.substring(0, 10)}...`);
          return testToken;
        } catch {
          continue;
        }
      }
      
      throw new Error("Не удалось найти валидный JWT_SECRET");
    }
    
    return jwt.default.sign(
      { id: userId },
      secret,
      { expiresIn: '7d' }
    );
  } catch (error: any) {
    console.error("❌ Ошибка генерации токена:", error.message);
    throw error;
  }
}

async function testFrontendWithBrowser() {
  let browser: any = null;
  
  try {
    console.log("=".repeat(70));
    console.log("🌐 АВТОМАТИЧЕСКИЙ ТЕСТ ФРОНТЕНДА С БРАУЗЕРОМ");
    console.log("=".repeat(70));
    console.log();

    // 1. Получаем данные из БД
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
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    // Проверяем, существует ли пользователь
    const user = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!user) {
      console.warn("⚠️ Пользователь не найден в БД, но продолжаем с userId из проекта");
    } else {
      console.log(`✅ Пользователь найден: ${user.email || 'N/A'}`);
    }
    
    console.log("✅ Данные из БД:");
    console.log(`   Project: ${project.title} (${projectId})`);
    console.log(`   Hypothesis: ${hypothesis.title} (${hypothesisId})`);
    console.log(`   User ID: ${userId}`);
    console.log();

    // 2. Генерируем токен для авторизации
    console.log("2️⃣ ГЕНЕРАЦИЯ ТОКЕНА");
    console.log("-".repeat(70));
    const token = await generateToken(userId);
    console.log(`✅ Токен сгенерирован: ${token.substring(0, 20)}...`);
    console.log();

    // 3. Запускаем браузер
    console.log("3️⃣ ЗАПУСК БРАУЗЕРА");
    console.log("-".repeat(70));
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    
    // Устанавливаем cookies с токеном
    await context.addCookies([
      {
        name: 'token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'activeProjectId',
        value: projectId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'activeHypothesisId',
        value: hypothesisId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
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

    console.log("✅ Браузер запущен с авторизацией");
    console.log();

    // 4. Открываем страницу
    console.log("4️⃣ ОТКРЫТИЕ СТРАНИЦЫ");
    console.log("-".repeat(70));
    const url = "http://localhost:8080/seo-agent#content";
    console.log(`Открываю: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log("✅ Страница загружена");
    console.log();

    // 5. Ждем загрузки контента
    console.log("5️⃣ ОЖИДАНИЕ ЗАГРУЗКИ КОНТЕНТА");
    console.log("-".repeat(70));
    await page.waitForTimeout(8000);
    
    // Проверяем, загрузилась ли страница
    const pageTitle = await page.title();
    console.log(`Заголовок страницы: ${pageTitle}`);
    
    // Проверяем URL
    const currentUrl = page.url();
    console.log(`Текущий URL: ${currentUrl}`);
    console.log();

    // 6. Проверяем, что видно на странице
    console.log("6️⃣ ДИАГНОСТИКА СТРАНИЦЫ");
    console.log("-".repeat(70));
    
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasSeoAgent = bodyText.includes('SEO Agent') || bodyText.includes('Content Production');
      const hasLoader = !!document.querySelector('.loader, [class*="spinner"], [class*="loading"]');
      const hasError = bodyText.includes('Error') || bodyText.includes('error');
      const hasNoProjects = bodyText.includes('No projects') || bodyText.includes('create a project');
      const hasNoHypothesis = bodyText.includes('No hypotheses') || bodyText.includes('create a hypothesis');
      const hasContentPanel = !!document.querySelector('[class*="SeoContentPanel"], [class*="content-ideas"]');
      const hasTabs = !!document.querySelector('[role="tablist"], [class*="tabs"]');
      const hasIdeas = bodyText.includes('suggestion') || bodyText.includes('Как преодолеть') || bodyText.includes('PAINS');
      
      return {
        hasSeoAgent,
        hasLoader,
        hasError,
        hasNoProjects,
        hasNoHypothesis,
        hasContentPanel,
        hasTabs,
        hasIdeas,
        bodyTextPreview: bodyText.substring(0, 1000)
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
    console.log("Текст страницы (первые 1000 символов):");
    console.log(pageInfo.bodyTextPreview);
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
      seoContentPanelLogs.slice(-5).forEach(log => console.log(`   ${log}`));
    }
    if (seoAgentClientLogs.length > 0) {
      console.log("Последние логи seoAgentClient:");
      seoAgentClientLogs.slice(-3).forEach(log => console.log(`   ${log}`));
    }
    console.log();

    // 8. Проверяем наличие идей на странице
    console.log("8️⃣ ПРОВЕРКА ОТОБРАЖЕНИЯ ИДЕЙ");
    console.log("-".repeat(70));
    
    // Проверяем наличие секций категорий
    const categorySections = await page.$$('.idea-section[data-category]');
    console.log(`Найдено секций категорий: ${categorySections.length}`);
    
    // Проверяем наличие карточек идей
    const ideaCards = await page.$$('.idea-card, [data-idea-id], [class*="idea-card"]');
    console.log(`Найдено карточек идей: ${ideaCards.length}`);
    
    // Проверяем наличие сообщения "No ideas"
    const hasNoIdeasText = pageInfo.bodyTextPreview.includes('No ideas') || pageInfo.bodyTextPreview.includes('No content ideas');
    console.log(`Есть сообщение 'No ideas': ${hasNoIdeasText}`);
    console.log();

    // 9. Проверяем количество идей через JavaScript
    console.log("9️⃣ ПРОВЕРКА ЧЕРЕЗ JAVASCRIPT");
    console.log("-".repeat(70));
    const ideasCount = await page.evaluate(() => {
      // Ищем все секции с идеями
      const sections = document.querySelectorAll('.idea-section[data-category]');
      let totalIdeas = 0;
      const categoryCounts: Record<string, number> = {};
      
      sections.forEach(section => {
        const category = section.getAttribute('data-category');
        const ideas = section.querySelectorAll('.idea-card, [data-idea-id], [class*="idea-card"]');
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
        'Как ограниченный бюджет'
      ];
      const foundTitles = ideaTitles.filter(title => bodyText.includes(title));
      
      return { 
        totalIdeas, 
        categoryCounts, 
        sectionsCount: sections.length,
        foundTitles: foundTitles.length
      };
    });
    
    console.log(`Всего идей на странице: ${ideasCount.totalIdeas}`);
    console.log(`Секций категорий: ${ideasCount.sectionsCount}`);
    console.log(`Найдено заголовков идей в тексте: ${ideasCount.foundTitles}`);
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
    
    if (ideasCount.totalIdeas > 0 || ideasCount.foundTitles > 0) {
      console.log("✅ ИДЕИ ОТОБРАЖАЮТСЯ НА СТРАНИЦЕ!");
      console.log(`   Найдено идей: ${ideasCount.totalIdeas}`);
      console.log(`   Найдено заголовков в тексте: ${ideasCount.foundTitles}`);
      console.log(`   Секций: ${ideasCount.sectionsCount}`);
    } else {
      console.log("❌ ИДЕИ НЕ ОТОБРАЖАЮТСЯ!");
      console.log();
      console.log("🔍 ДИАГНОСТИКА:");
      console.log(`   Логов SeoContentPanel: ${seoContentPanelLogs.length}`);
      console.log(`   Логов ContentIdeasList: ${contentIdeasListLogs.length}`);
      console.log(`   Логов seoAgentClient: ${seoAgentClientLogs.length}`);
      console.log(`   Секций категорий: ${categorySections.length}`);
      console.log(`   Карточек идей: ${ideaCards.length}`);
      console.log(`   Сообщение 'No ideas': ${hasNoIdeasText}`);
      console.log(`   Content Panel элемент: ${pageInfo.hasContentPanel}`);
      console.log(`   Tabs элемент: ${pageInfo.hasTabs}`);
      
      if (seoContentPanelLogs.length === 0) {
        console.log("   ⚠️ Нет логов SeoContentPanel - компонент может не загружаться");
      }
      if (contentIdeasListLogs.length === 0) {
        console.log("   ⚠️ Нет логов ContentIdeasList - компонент может не рендериться");
      }
      if (seoAgentClientLogs.length === 0) {
        console.log("   ⚠️ Нет логов seoAgentClient - запросы могут не отправляться");
      }
      if (!pageInfo.hasContentPanel && !pageInfo.hasTabs) {
        console.log("   ⚠️ Компоненты SEO Agent не найдены на странице");
      }
    }
    console.log();

    await mongoose.connection.close();
    
    // Оставляем браузер открытым на 5 секунд для визуальной проверки
    console.log("⏳ Оставляю браузер открытым на 5 секунд для визуальной проверки...");
    await page.waitForTimeout(5000);
    
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

testFrontendWithBrowser().catch(async (error) => {
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
