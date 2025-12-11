import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";

async function exportUsers() {
  console.log("📤 ЭКСПОРТ ПОЛЬЗОВАТЕЛЕЙ ИЗ БАЗЫ 'test'");
  console.log("=" .repeat(80));
  console.log();

  try {
    // Подключение к базе test
    await mongoose.connect(testUri);
    const db = mongoose.connection.db;
    console.log(`✅ Подключено к базе: ${db.databaseName}`);
    console.log();

    // Получение всех пользователей
    const users = await db.collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`📊 Найдено пользователей: ${users.length}`);
    console.log();

    // Преобразование в чистые JSON объекты
    const usersData = users.map(user => {
      const userObj: any = {
        _id: user._id.toString(),
        email: user.email || null,
        role: user.role || null,
        timeZoneOffset: user.timeZoneOffset || null,
        isProjectGenerationStarted: user.isProjectGenerationStarted || null,
        isProjectGenerated: user.isProjectGenerated || null,
        freeTrialDueTo: user.freeTrialDueTo ? user.freeTrialDueTo.toISOString() : null,
        createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
      };

      // Добавляем остальные поля, если есть
      if (user.passwordHash) {
        userObj.hasPassword = true;
        userObj.passwordHash = "***HIDDEN***";
      } else {
        userObj.hasPassword = false;
      }

      if (user.resetPassword) {
        userObj.hasResetPassword = true;
      }

      // Добавляем все остальные поля
      Object.keys(user).forEach(key => {
        if (!userObj.hasOwnProperty(key) && key !== "__v") {
          userObj[key] = user[key];
        }
      });

      return userObj;
    });

    // Создание директории для экспорта
    const exportDir = path.join(process.cwd(), "..", "logs", "exports");
    fs.mkdirSync(exportDir, { recursive: true });

    // Сохранение в JSON
    const jsonPath = path.join(exportDir, `users-export-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(usersData, null, 2), "utf-8");
    console.log(`💾 JSON файл сохранен: ${jsonPath}`);
    console.log(`   Размер: ${(fs.statSync(jsonPath).size / 1024).toFixed(2)} KB`);
    console.log();

    // Сохранение в CSV
    const csvPath = path.join(exportDir, `users-export-${Date.now()}.csv`);
    const csvHeaders = "_id,email,role,timeZoneOffset,isProjectGenerationStarted,isProjectGenerated,freeTrialDueTo,createdAt,updatedAt,hasPassword\n";
    const csvRows = usersData.map(user => {
      const escape = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };
      return [
        escape(user._id),
        escape(user.email),
        escape(user.role),
        escape(user.timeZoneOffset),
        escape(user.isProjectGenerationStarted),
        escape(user.isProjectGenerated),
        escape(user.freeTrialDueTo),
        escape(user.createdAt),
        escape(user.updatedAt),
        escape(user.hasPassword)
      ].join(",");
    }).join("\n");
    fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf-8");
    console.log(`💾 CSV файл сохранен: ${csvPath}`);
    console.log();

    // Создание читаемого текстового файла
    const txtPath = path.join(exportDir, `users-export-${Date.now()}.txt`);
    let txtContent = `ЭКСПОРТ ПОЛЬЗОВАТЕЛЕЙ ИЗ БАЗЫ 'test'\n`;
    txtContent += `Дата: ${new Date().toISOString()}\n`;
    txtContent += `Всего пользователей: ${users.length}\n\n`;
    txtContent += "=" .repeat(80) + "\n\n";

    usersData.forEach((user, index) => {
      txtContent += `ПОЛЬЗОВАТЕЛЬ ${index + 1} из ${users.length}\n`;
      txtContent += "-".repeat(80) + "\n";
      txtContent += `ID: ${user._id}\n`;
      txtContent += `Email: ${user.email || "N/A"}\n`;
      txtContent += `Role: ${user.role || "N/A"}\n`;
      txtContent += `Time Zone Offset: ${user.timeZoneOffset || "N/A"}\n`;
      txtContent += `Project Generation Started: ${user.isProjectGenerationStarted || false}\n`;
      txtContent += `Project Generated: ${user.isProjectGenerated || false}\n`;
      txtContent += `Free Trial Due To: ${user.freeTrialDueTo || "N/A"}\n`;
      txtContent += `Has Password: ${user.hasPassword ? "Да" : "Нет"}\n`;
      txtContent += `Created At: ${user.createdAt || "N/A"}\n`;
      txtContent += `Updated At: ${user.updatedAt || "N/A"}\n`;
      
      // Показываем все остальные поля
      const otherFields = Object.keys(user).filter(key => 
        !["_id", "email", "role", "timeZoneOffset", "isProjectGenerationStarted", 
          "isProjectGenerated", "freeTrialDueTo", "hasPassword", "createdAt", "updatedAt"].includes(key)
      );
      
      if (otherFields.length > 0) {
        txtContent += `\nДополнительные поля:\n`;
        otherFields.forEach(field => {
          txtContent += `  ${field}: ${JSON.stringify(user[field])}\n`;
        });
      }
      
      txtContent += "\n" + "=" .repeat(80) + "\n\n";
    });

    fs.writeFileSync(txtPath, txtContent, "utf-8");
    console.log(`💾 Текстовый файл сохранен: ${txtPath}`);
    console.log();

    // Статистика
    console.log("📊 СТАТИСТИКА:");
    console.log("-".repeat(80));
    const roles = usersData.reduce((acc, user) => {
      acc[user.role || "N/A"] = (acc[user.role || "N/A"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("Распределение по ролям:");
    Object.entries(roles).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log();

    const withPassword = usersData.filter(u => u.hasPassword).length;
    const withoutPassword = usersData.length - withPassword;
    console.log(`С паролем: ${withPassword}`);
    console.log(`Без пароля: ${withoutPassword}`);
    console.log();

    // Показываем первые 5 пользователей
    console.log("📋 ПРИМЕРЫ ПОЛЬЗОВАТЕЛЕЙ (первые 5):");
    console.log("-".repeat(80));
    usersData.slice(0, 5).forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email || "N/A"}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role || "N/A"}`);
      console.log(`   Created: ${user.createdAt || "N/A"}`);
    });
    console.log();

    // Поиск конкретного пользователя
    const targetUser = usersData.find(u => u.email === "sigayyury5@gmail.com");
    if (targetUser) {
      console.log("🎯 НАЙДЕН ЦЕЛЕВОЙ ПОЛЬЗОВАТЕЛЬ:");
      console.log("-".repeat(80));
      console.log(JSON.stringify(targetUser, null, 2));
      console.log();
    }

    await mongoose.disconnect();
    console.log("✅ Экспорт завершен");
    console.log();
    console.log("📁 Все файлы сохранены в:", exportDir);

  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportUsers();

