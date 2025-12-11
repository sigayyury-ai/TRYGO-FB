import { chromium } from 'playwright';
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

const AUTH_DATA_FILE = join(__dirname, "..", "..", "tmp", "browser-auth-data.json");

/**
 * Сохраняет данные авторизации и использует их для тестирования
 */

async function saveAuthAndTest() {
  let browser: any = null;
  
  try {
    console.log("=".repeat(70));
    console.log("🌐 СОХРАНЕНИЕ АВТОРИЗАЦИИ И ТЕСТИРОВАНИЕ");
    console.log("=".repeat(70));
    console.log();

    // 1. Получаем правильные данные из БД
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

    const correctProjectId = project._id.toString();
    const correctHypothesisId = hypothesis._id.toString();
    
    console.log("✅ Правильные данные из БД:");
    console.log(`   Project: ${project.title} (${correctProjectId})`);
    console.log(`   Hypothesis: ${hypothesis.title} (${correctHypothesisId})`);
    console.log();

    // 2. Проверяем, есть ли сохраненные данные
    let savedAuth: any = null;
    if (fs.existsSync(AUTH_DATA_FILE)) {
      try {
        savedAuth = JSON.parse(fs.readFileSync(AUTH_DATA_FILE, 'utf-8'));
        console.log("✅ Найдены сохраненные данные авторизации");
        console.log(`   Токен: ${savedAuth.token?.substring(0, 30)}...`);
        console.log(`   Сохранено: ${new Date(savedAuth.savedAt).toLocaleString()}`);
        console.log();
      } catch (e) {
        console.warn("⚠️ Не удалось прочитать сохраненные данные");
      }
    }

    // 3. Запускаем браузер
    console.log("3️⃣ ЗАПУСК БРАУЗЕРА");
    console.log("-".repeat(70));
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 100
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

    page.on('pageerror', error => {
      console.error(`[BROWSER ERROR] ${error.message}`);
    });

    console.log("✅ Браузер запущен");
    console.log();

    // 4. Если есть сохраненные данные - используем их, иначе ждем авторизации
    if (savedAuth && savedAuth.token) {
      console.log("4️⃣ ИСПОЛЬЗОВАНИЕ СОХРАНЕННЫХ ДАННЫХ");
      console.log("-".repeat(70));
      
      // Устанавливаем cookies
      await context.addCookies([
        {
          name: 'token',
          value: savedAuth.token,
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax'
        },
        {
          name: 'activeProjectId',
          value: correctProjectId, // Используем правильный projectId
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax'
        },
        {
          name: 'activeHypothesisId',
          value: correctHypothesisId, // Используем правильный hypothesisId
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax'
        }
      ]);
      
      console.log("✅ Cookies установлены с правильными ID");
      console.log(`   Project ID: ${correctProjectId}`);
      console.log(`   Hypothesis ID: ${correctHypothesisId}`);
      console.log();
    } else {
      console.log("4️⃣ ОЖИДАНИЕ АВТОРИЗАЦИИ");
      console.log("-".repeat(70));
      console.log("Открываю главную страницу...");
      console.log("💡 ПОЖАЛУЙСТА, АВТОРИЗУЙТЕСЬ В БРАУЗЕРЕ!");
      console.log();
      
      await page.goto("http://localhost:8080", { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      console.log("⏳ Ожидаю авторизации...");
      let tokenFound = false;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (!tokenFound && attempts < maxAttempts) {
        await page.waitForTimeout(2000);
        attempts++;
        
        const cookies = await context.cookies();
        const tokenCookie = cookies.find(c => c.name === 'token');
        
        if (tokenCookie && tokenCookie.value) {
          tokenFound = true;
          console.log(`✅ Токен найден! (попытка ${attempts})`);
          
          // Сохраняем все cookies
          const allCookies = await context.cookies();
          const authData = {
            token: tokenCookie.value,
            cookies: allCookies,
            savedAt: new Date().toISOString()
          };
          
          // Создаем директорию если нет
          const dir = dirname(AUTH_DATA_FILE);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          fs.writeFileSync(AUTH_DATA_FILE, JSON.stringify(authData, null, 2));
          console.log(`✅ Данные авторизации сохранены в: ${AUTH_DATA_FILE}`);
          savedAuth = authData;
          break;
        }
        
        if (attempts % 5 === 0) {
          console.log(`   Проверка ${attempts}/${maxAttempts}...`);
        }
      }
      
      if (!tokenFound) {
        throw new Error("Токен не найден за 2 минуты");
      }
      console.log();
    }

    // 5. Очищаем все cookies и устанавливаем правильные ПЕРЕД загрузкой страницы
    console.log("5️⃣ УСТАНОВКА ПРАВИЛЬНЫХ COOKIES");
    console.log("-".repeat(70));
    
    // Очищаем все cookies
    await context.clearCookies();
    console.log("✅ Все cookies очищены");
    
    // Устанавливаем правильные cookies ПЕРЕД загрузкой страницы
    await context.addCookies([
      {
        name: 'token',
        value: savedAuth.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'activeProjectId',
        value: correctProjectId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'activeHypothesisId',
        value: correctHypothesisId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);
    
    console.log("✅ Правильные cookies установлены ДО загрузки страницы:");
    console.log(`   Project ID: ${correctProjectId}`);
    console.log(`   Hypothesis ID: ${correctHypothesisId}`);
    console.log();

    // 6. Переходим на страницу SEO Agent с правильными cookies
    console.log("6️⃣ ПЕРЕХОД НА СТРАНИЦУ SEO AGENT");
    console.log("-".repeat(70));
    const url = "http://localhost:8080/seo-agent#content";
    console.log(`Открываю: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log("✅ Страница загружена");
    console.log();
    
    // Очищаем localStorage от старых значений
    await page.evaluate(({ projectId, hypothesisId }) => {
      // Очищаем старые значения из localStorage
      localStorage.removeItem('activeProjectId');
      localStorage.removeItem('activeHypothesisId');
      localStorage.removeItem('seoAgent_selectedProjectId');
      localStorage.removeItem('seoAgent_selectedHypothesisId');
      
      console.log('[TEST] localStorage очищен');
    }, { projectId: correctProjectId, hypothesisId: correctHypothesisId });
    
    console.log("✅ localStorage очищен от старых значений");
    console.log();
    
    // Проверяем cookies и localStorage
    const currentState = await page.evaluate(() => {
      return {
        cookies: {
          projectId: document.cookie.split(';').find(c => c.includes('activeProjectId'))?.split('=')[1]?.trim(),
          hypothesisId: document.cookie.split(';').find(c => c.includes('activeHypothesisId'))?.split('=')[1]?.trim()
        },
        localStorage: {
          projectId: localStorage.getItem('activeProjectId'),
          hypothesisId: localStorage.getItem('activeHypothesisId')
        }
      };
    });
    
    console.log("Текущее состояние:");
    console.log(`   Cookies - projectId: ${currentState.cookies.projectId || 'НЕ НАЙДЕН'}`);
    console.log(`   Cookies - hypothesisId: ${currentState.cookies.hypothesisId || 'НЕ НАЙДЕН'}`);
    console.log(`   localStorage - projectId: ${currentState.localStorage.projectId || 'НЕ НАЙДЕН'}`);
    console.log(`   localStorage - hypothesisId: ${currentState.localStorage.hypothesisId || 'НЕ НАЙДЕН'}`);
    console.log();
    
    // Принудительно перезагружаем stores через JavaScript
    await page.evaluate(async ({ projectId, hypothesisId }) => {
      // Ждем пока stores будут доступны
      let attempts = 0;
      while (attempts < 20 && !(window as any).__DEBUG_STORES__) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if ((window as any).__DEBUG_STORES__) {
        console.log('[TEST] Stores доступны, перезагружаю...');
        
        // Получаем доступ к stores через require (если возможно)
        try {
          // Используем eval для динамического импорта в браузерном контексте
          const stores = (window as any).__DEBUG_STORES__;
          
          // Вызываем getProjects для перезагрузки
          if (stores.getProjectStore) {
            const projectStore = stores.getProjectStore();
            if (projectStore.getProjects) {
              await projectStore.getProjects();
              console.log('[TEST] Projects reloaded');
              
              // После загрузки проектов, устанавливаем правильный проект
              if (projectStore.setActiveProject) {
                projectStore.setActiveProject(projectId);
                console.log(`[TEST] Active project set to: ${projectId}`);
              }
              
              // Загружаем гипотезы
              const hypothesisStore = stores.getHypothesisStore();
              if (hypothesisStore && hypothesisStore.getHypotheses) {
                await hypothesisStore.getHypotheses(projectId);
                console.log('[TEST] Hypotheses reloaded');
                
                // Устанавливаем правильную гипотезу
                if (hypothesisStore.setActiveHypothesis) {
                  hypothesisStore.setActiveHypothesis(hypothesisId);
                  console.log(`[TEST] Active hypothesis set to: ${hypothesisId}`);
                }
              }
            }
          }
        } catch (e) {
          console.error('[TEST] Ошибка при перезагрузке stores:', e);
        }
      } else {
        console.warn('[TEST] Stores не доступны через __DEBUG_STORES__');
      }
    }, { projectId: correctProjectId, hypothesisId: correctHypothesisId });
    
    console.log("✅ Stores перезагружены через JavaScript");
    console.log();
    
    // Перезагружаем страницу чтобы компоненты обновились
    await page.reload({ waitUntil: 'domcontentloaded' });
    console.log("✅ Страница перезагружена");
    console.log();

    // 7. Ждем загрузки контента
    console.log("6️⃣ ОЖИДАНИЕ ЗАГРУЗКИ КОНТЕНТА");
    console.log("-".repeat(70));
    await page.waitForTimeout(10000);
    console.log();

    // 8. Проверяем логи
    console.log("7️⃣ ПРОВЕРКА ЛОГОВ");
    console.log("-".repeat(70));
    const seoContentPanelLogs = consoleMessages.filter(msg => msg.includes('[SeoContentPanel]'));
    const seoAgentClientLogs = consoleMessages.filter(msg => msg.includes('[seoAgentClient]'));
    
    console.log(`Логов [SeoContentPanel]: ${seoContentPanelLogs.length}`);
    console.log(`Логов [seoAgentClient]: ${seoAgentClientLogs.length}`);
    
    // Ищем логи с projectId и hypothesisId
    const logsWithIds = seoContentPanelLogs.filter(msg => 
      msg.includes(correctProjectId) || msg.includes(correctHypothesisId)
    );
    const logsWithOldIds = seoContentPanelLogs.filter(msg => 
      msg.includes('686774b6773b5947fed60a78') || msg.includes('686774c1773b5947fed60a7a')
    );
    
    console.log(`Логов с правильными ID: ${logsWithIds.length}`);
    console.log(`Логов со старыми ID: ${logsWithOldIds.length}`);
    
    if (logsWithOldIds.length > 0) {
      console.warn("⚠️ Обнаружены запросы со старыми ID!");
      logsWithOldIds.slice(0, 3).forEach(log => console.log(`   ${log.substring(0, 100)}...`));
    }
    console.log();

    // 9. Проверяем количество идей
    console.log("8️⃣ ПРОВЕРКА ИДЕЙ");
    console.log("-".repeat(70));
    const ideasCount = await page.evaluate(() => {
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
      
      const bodyText = document.body.innerText || '';
      const foundTitles = [
        'Как преодолеть',
        'Трудности в масштабировании',
        'Как ограниченный бюджет',
        'Articles by pains'
      ].filter(title => bodyText.includes(title));
      
      return { 
        totalIdeas, 
        categoryCounts, 
        sectionsCount: sections.length,
        foundTitles: foundTitles.length
      };
    });
    
    console.log(`Всего идей: ${ideasCount.totalIdeas}`);
    console.log(`Секций: ${ideasCount.sectionsCount}`);
    console.log(`Найдено заголовков: ${ideasCount.foundTitles}`);
    console.log("По категориям:", ideasCount.categoryCounts);
    console.log();

    // 10. Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    
    if (ideasCount.totalIdeas > 0 || ideasCount.foundTitles > 0) {
      console.log("✅✅✅ ИДЕИ ОТОБРАЖАЮТСЯ! ✅✅✅");
    } else {
      console.log("❌ ИДЕИ НЕ ОТОБРАЖАЮТСЯ");
      console.log();
      console.log("🔍 ПРОБЛЕМА:");
      if (logsWithOldIds.length > 0) {
        console.log("   ⚠️ Используются СТАРЫЕ ID из cookies!");
        console.log(`   Старый projectId: 686774b6773b5947fed60a78 (удален)`);
        console.log(`   Старый hypothesisId: 686774c1773b5947fed60a7a (удален)`);
        console.log(`   Правильный projectId: ${correctProjectId}`);
        console.log(`   Правильный hypothesisId: ${correctHypothesisId}`);
        console.log();
        console.log("💡 РЕШЕНИЕ:");
        console.log("   Cookies обновлены, но возможно нужно очистить старые в браузере");
      } else {
        console.log("   Проверьте логи выше для деталей");
      }
    }
    console.log();

    await mongoose.connection.close();
    
    console.log("⏳ Оставляю браузер открытым на 15 секунд...");
    await page.waitForTimeout(15000);
    
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

saveAuthAndTest();

