import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface EnvCheck {
  file: string;
  exists: boolean;
  mongoUri?: string;
  database?: string;
  status: "✅ OK" | "❌ TEST DB" | "⚠️  NOT FOUND" | "⚠️  UNKNOWN";
  notes: string[];
}

const services = [
  { name: "SEO Agent Backend", path: "backend" },
  { name: "TRYGO Backend", path: "TRYGO-Backend" },
  { name: "Semantics Service", path: "semantics-service" },
  { name: "Website Pages Service", path: "website-pages-service" },
  { name: "Images Service", path: "images-service" },
];

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#") && line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

function extractDatabaseFromUri(uri: string): string | null {
  try {
    // Формат: mongodb://host:port/database?options
    const match = uri.match(/mongodb[+srv]*:\/\/[^\/]+\/([^?]+)/);
    if (match) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

function checkService(servicePath: string): EnvCheck[] {
  const checks: EnvCheck[] = [];
  const basePath = resolve(process.cwd(), "..", servicePath);

  // Проверяем .env
  const envPath = resolve(basePath, ".env");
  const envExists = existsSync(envPath);
  const env = envExists ? parseEnvFile(envPath) : {};

  // Проверяем .env.local (имеет приоритет)
  const envLocalPath = resolve(basePath, ".env.local");
  const envLocalExists = existsSync(envLocalPath);
  const envLocal = envLocalExists ? parseEnvFile(envLocalPath) : {};

  // Объединяем (env.local имеет приоритет)
  const combinedEnv = { ...env, ...envLocal };

  // Ищем MONGODB_URI или MONGO_URI
  const mongoUri = combinedEnv.MONGODB_URI || combinedEnv.MONGO_URI;
  const database = mongoUri ? extractDatabaseFromUri(mongoUri) : null;

  // Проверка .env
  const envCheck: EnvCheck = {
    file: `${servicePath}/.env`,
    exists: envExists,
    status: "⚠️  NOT FOUND",
    notes: [],
  };

  if (envExists) {
    const uri = env.MONGODB_URI || env.MONGO_URI;
    if (uri) {
      envCheck.mongoUri = uri;
      const db = extractDatabaseFromUri(uri);
      envCheck.database = db || "unknown";
      if (db === "trygo") {
        envCheck.status = "✅ OK";
      } else if (db === "test") {
        envCheck.status = "❌ TEST DB";
        envCheck.notes.push("⚠️  Указывает на тестовую базу!");
      } else {
        envCheck.status = "⚠️  UNKNOWN";
        envCheck.notes.push(`Неизвестная база: ${db}`);
      }
    } else {
      envCheck.status = "⚠️  NOT FOUND";
      envCheck.notes.push("MONGODB_URI или MONGO_URI не найдены");
    }
  }

  checks.push(envCheck);

  // Проверка .env.local
  const envLocalCheck: EnvCheck = {
    file: `${servicePath}/.env.local`,
    exists: envLocalExists,
    status: "⚠️  NOT FOUND",
    notes: [],
  };

  if (envLocalExists) {
    const uri = envLocal.MONGODB_URI || envLocal.MONGO_URI;
    if (uri) {
      envLocalCheck.mongoUri = uri;
      const db = extractDatabaseFromUri(uri);
      envLocalCheck.database = db || "unknown";
      if (db === "trygo") {
        envLocalCheck.status = "✅ OK";
      } else if (db === "test") {
        envLocalCheck.status = "❌ TEST DB";
        envLocalCheck.notes.push("⚠️  Указывает на тестовую базу!");
      } else {
        envLocalCheck.status = "⚠️  UNKNOWN";
        envLocalCheck.notes.push(`Неизвестная база: ${db}`);
      }
    } else {
      envLocalCheck.status = "⚠️  NOT FOUND";
      envLocalCheck.notes.push("MONGODB_URI или MONGO_URI не найдены");
    }
  }

  checks.push(envLocalCheck);

  // Финальная проверка (с учетом приоритета .env.local)
  if (mongoUri) {
    const finalDb = extractDatabaseFromUri(mongoUri);
    if (finalDb === "test") {
      checks.forEach((check) => {
        if (check.status === "✅ OK") {
          check.status = "❌ TEST DB";
          check.notes.push("⚠️  .env.local переопределяет на test!");
        }
      });
    }
  }

  return checks;
}

async function checkAllEnvFiles() {
  console.log("🔍 ПРОВЕРКА ВСЕХ .env ФАЙЛОВ НА ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ");
  console.log("=" .repeat(80));
  console.log();

  const allChecks: Array<{ service: string; checks: EnvCheck[] }> = [];

  for (const service of services) {
    const checks = checkService(service.path);
    allChecks.push({ service: service.name, checks });
  }

  // Выводим результаты
  for (const { service, checks } of allChecks) {
    console.log(`📦 ${service}`);
    console.log("-".repeat(80));

    for (const check of checks) {
      console.log(`\n  ${check.file}`);
      console.log(`    Статус: ${check.status}`);
      if (check.exists) {
        if (check.mongoUri) {
          // Скрываем пароль в URI
          const safeUri = check.mongoUri.replace(/:([^:@]+)@/, ":****@");
          console.log(`    URI: ${safeUri}`);
        }
        if (check.database) {
          console.log(`    База данных: ${check.database}`);
        }
        if (check.notes.length > 0) {
          check.notes.forEach((note) => {
            console.log(`    ${note}`);
          });
        }
      } else {
        console.log(`    Файл не существует`);
      }
    }
    console.log();
  }

  // Итоговая сводка
  console.log("=" .repeat(80));
  console.log("📊 ИТОГОВАЯ СВОДКА:");
  console.log("=" .repeat(80));
  console.log();

  let hasTestDb = false;
  let hasUnknown = false;

  for (const { service, checks } of allChecks) {
    const finalCheck = checks.find((c) => c.exists && (c.mongoUri || c.database));
    if (finalCheck) {
      if (finalCheck.status === "❌ TEST DB") {
        hasTestDb = true;
        console.log(`❌ ${service}: Подключен к тестовой базе (${finalCheck.file})`);
      } else if (finalCheck.status === "⚠️  UNKNOWN") {
        hasUnknown = true;
        console.log(`⚠️  ${service}: Неизвестная база данных (${finalCheck.database})`);
      } else {
        console.log(`✅ ${service}: Подключен к продовой базе`);
      }
    } else {
      console.log(`⚠️  ${service}: Не найдена конфигурация MongoDB`);
    }
  }

  console.log();
  if (hasTestDb) {
    console.log("❌ ВНИМАНИЕ: Найдены сервисы, подключенные к тестовой базе!");
    console.log("   Необходимо исправить MONGODB_URI/MONGO_URI в соответствующих .env файлах.");
  } else if (hasUnknown) {
    console.log("⚠️  ВНИМАНИЕ: Найдены сервисы с неизвестной базой данных.");
  } else {
    console.log("✅ Все сервисы подключены к продовой базе данных 'trygo'.");
  }
}

checkAllEnvFiles();




