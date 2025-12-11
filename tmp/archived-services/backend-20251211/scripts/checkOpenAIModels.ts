import "dotenv/config";
import OpenAI from "openai";

async function checkOpenAIModels() {
  console.log("🔍 ПРОВЕРКА ДОСТУПНЫХ МОДЕЛЕЙ OPENAI API");
  console.log("=" .repeat(80));
  console.log();

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY не найден в переменных окружения");
    console.log("\n💡 Установите OPENAI_API_KEY в .env или .env.local");
    process.exit(1);
  }

  try {
    console.log("📡 Подключение к OpenAI API...");
    const client = new OpenAI({ apiKey });

    console.log("📋 Получение списка доступных моделей...");
    const models = await client.models.list();
    
    console.log(`\n✅ Получено ${models.data.length} моделей\n`);
    console.log("=" .repeat(80));
    console.log("📊 ДОСТУПНЫЕ МОДЕЛИ:");
    console.log("=" .repeat(80));
    console.log();

    // Фильтруем только GPT модели
    const gptModels = models.data
      .filter(m => m.id.includes('gpt'))
      .sort((a, b) => b.created - a.created); // Сортируем по дате создания (новые первыми)

    console.log(`🤖 GPT модели (${gptModels.length}):\n`);
    
    gptModels.forEach((model, index) => {
      const date = new Date(model.created * 1000).toISOString().split('T')[0];
      const isLatest = index === 0;
      console.log(`${isLatest ? '⭐' : '  '} ${model.id}`);
      console.log(`   Создана: ${date}`);
      console.log(`   Владелец: ${model.owned_by}`);
      if (model.id.includes('gpt-5')) {
        console.log(`   ✅ GPT-5 НАЙДЕНА!`);
      }
      console.log();
    });

    // Проверяем наличие GPT-5
    const hasGpt5 = gptModels.some(m => m.id.includes('gpt-5'));
    
    console.log("=" .repeat(80));
    if (hasGpt5) {
      console.log("✅ GPT-5 ДОСТУПНА через API!");
      const gpt5Models = gptModels.filter(m => m.id.includes('gpt-5'));
      console.log(`\nДоступные варианты GPT-5:`);
      gpt5Models.forEach(m => {
        console.log(`   - ${m.id}`);
      });
    } else {
      console.log("❌ GPT-5 НЕ НАЙДЕНА в списке доступных моделей");
      console.log("\n💡 Самая новая доступная модель:");
      if (gptModels.length > 0) {
        console.log(`   ⭐ ${gptModels[0].id}`);
        console.log(`   Создана: ${new Date(gptModels[0].created * 1000).toISOString().split('T')[0]}`);
      }
    }

    // Показываем все модели для справки
    console.log("\n" + "=" .repeat(80));
    console.log("📋 ВСЕ МОДЕЛИ (первые 20):");
    console.log("=" .repeat(80));
    models.data.slice(0, 20).forEach(model => {
      console.log(`   ${model.id} (${model.owned_by})`);
    });
    if (models.data.length > 20) {
      console.log(`   ... и еще ${models.data.length - 20} моделей`);
    }

  } catch (error: any) {
    console.error("\n❌ Ошибка при получении списка моделей:");
    console.error(`   ${error.message}`);
    
    if (error.status === 401) {
      console.error("\n💡 Проверьте правильность OPENAI_API_KEY");
    } else if (error.status === 429) {
      console.error("\n💡 Превышен лимит запросов, попробуйте позже");
    }
    
    process.exit(1);
  }
}

checkOpenAIModels();




