import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";

const userId = "686773b5773b5947fed60a68";

async function checkProjectsByMonth() {
  console.log("🔍 ПРОВЕРКА ПРОЕКТОВ ПО МЕСЯЦАМ В БАЗЕ 'test'");
  console.log("=" .repeat(80));
  console.log();

  try {
    await mongoose.connect(testUri);
    const db = mongoose.connection.db;
    
    // Получаем все проекты
    const allProjects = await db.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Всего проектов: ${allProjects.length}`);
    console.log();

    // Группируем по месяцам
    const projectsByMonth: Record<string, any[]> = {};
    const projectsByYearMonth: Record<string, any[]> = {};
    
    allProjects.forEach(project => {
      if (project.createdAt) {
        const date = new Date(project.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const monthName = date.toLocaleString('ru-RU', { month: 'long' });
        const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
        const key = `${year}-${monthName}`;
        
        if (!projectsByMonth[key]) {
          projectsByMonth[key] = [];
        }
        projectsByMonth[key].push(project);
        
        if (!projectsByYearMonth[yearMonth]) {
          projectsByYearMonth[yearMonth] = [];
        }
        projectsByYearMonth[yearMonth].push(project);
      } else {
        if (!projectsByMonth["Без даты"]) {
          projectsByMonth["Без даты"] = [];
        }
        projectsByMonth["Без даты"].push(project);
      }
    });

    // Статистика по месяцам
    console.log("📊 СТАТИСТИКА ПО МЕСЯЦАМ:");
    console.log("-".repeat(80));
    
    const sortedMonths = Object.keys(projectsByYearMonth).sort().reverse();
    sortedMonths.forEach(yearMonth => {
      const count = projectsByYearMonth[yearMonth].length;
      const [year, month] = yearMonth.split('-');
      const monthNames: Record<string, string> = {
        '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
        '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
        '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
      };
      console.log(`   ${year} ${monthNames[month]}: ${count} проектов`);
    });
    
    if (projectsByMonth["Без даты"]) {
      console.log(`   Без даты: ${projectsByMonth["Без даты"].length} проектов`);
    }
    console.log();

    // Детали по ноябрю
    const november2025 = projectsByYearMonth["2025-11"] || [];
    const november2024 = projectsByYearMonth["2024-11"] || [];
    const allNovember = [...november2025, ...november2024];
    
    console.log("📅 ПРОЕКТЫ ЗА НОЯБРЬ:");
    console.log("-".repeat(80));
    console.log(`Ноябрь 2025: ${november2025.length} проектов`);
    console.log(`Ноябрь 2024: ${november2024.length} проектов`);
    console.log(`Всего за ноябрь: ${allNovember.length} проектов`);
    console.log();

    if (allNovember.length > 0) {
      console.log("Проекты за ноябрь:");
      allNovember
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .forEach((project, i) => {
          const date = project.createdAt ? new Date(project.createdAt) : null;
          const pUserId = project.userId?.toString() || project.userId;
          const isUserProject = pUserId === userId;
          
          console.log(`\n${i + 1}. ${project.title || project._id} ${isUserProject ? "✅ (ваш)" : ""}`);
          console.log(`   ID: ${project._id}`);
          console.log(`   userId: ${pUserId}`);
          console.log(`   Created: ${date ? date.toISOString() : "N/A"}`);
          if (project.generationStatus) {
            console.log(`   Generation Status: ${project.generationStatus}`);
          }
        });
    } else {
      console.log("❌ Проектов за ноябрь не найдено");
    }
    console.log();

    // Проекты пользователя по месяцам
    console.log("👤 ПРОЕКТЫ ПОЛЬЗОВАТЕЛЯ ПО МЕСЯЦАМ:");
    console.log("-".repeat(80));
    
    const userProjects = allProjects.filter(p => {
      const pUserId = p.userId?.toString() || p.userId;
      return pUserId === userId;
    });
    
    console.log(`Всего проектов пользователя: ${userProjects.length}`);
    console.log();
    
    const userProjectsByMonth: Record<string, any[]> = {};
    userProjects.forEach(project => {
      if (project.createdAt) {
        const date = new Date(project.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthName = date.toLocaleString('ru-RU', { month: 'long' });
        const key = `${year}-${monthName}`;
        
        if (!userProjectsByMonth[key]) {
          userProjectsByMonth[key] = [];
        }
        userProjectsByMonth[key].push(project);
      }
    });
    
    Object.keys(userProjectsByMonth)
      .sort()
      .reverse()
      .forEach(key => {
        const projects = userProjectsByMonth[key];
        console.log(`   ${key}: ${projects.length} проектов`);
        projects.forEach(p => {
          console.log(`      - ${p.title || p._id} (${new Date(p.createdAt).toISOString().split('T')[0]})`);
        });
      });
    
    console.log();

    // Самые свежие проекты (всех пользователей)
    console.log("🆕 САМЫЕ СВЕЖИЕ ПРОЕКТЫ (последние 10):");
    console.log("-".repeat(80));
    
    allProjects
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .forEach((project, i) => {
        const date = new Date(project.createdAt);
        const pUserId = project.userId?.toString() || project.userId;
        const isUserProject = pUserId === userId;
        
        console.log(`\n${i + 1}. ${project.title || project._id} ${isUserProject ? "✅ (ваш)" : ""}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${pUserId}`);
        console.log(`   Created: ${date.toISOString()}`);
        console.log(`   Дата: ${date.toLocaleDateString('ru-RU')}`);
      });
    
    await mongoose.disconnect();
    console.log();
    console.log("✅ Проверка завершена");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkProjectsByMonth();

