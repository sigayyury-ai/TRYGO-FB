import "dotenv/config";
import { generateImage } from "../src/services/contentGeneration.js";

async function testImageGeneration() {
  console.log("🖼️  ТЕСТ ГЕНЕРАЦИИ ИЗОБРАЖЕНИЙ");
  console.log("=" .repeat(80));
  console.log();

  const testCases = [
    {
      title: "AI Marketing Tools for Solo Founders",
      description: "Modern workspace with AI tools helping solo founders scale their business"
    },
    {
      title: "Content Planning Dashboard",
      description: "Professional dashboard interface for content planning and scheduling"
    },
    {
      title: "SEO Strategy Visualization",
      description: "Infographic showing SEO strategy and keyword research process"
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Тест ${i + 1}/${testCases.length}: "${testCase.title}"`);
    console.log("-".repeat(80));
    
    try {
      const startTime = Date.now();
      const result = await generateImage({
        title: testCase.title,
        description: testCase.description
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ Успешно за ${duration}ms`);
      console.log(`   URL: ${result.imageUrl.substring(0, 100)}...`);
      
      if (result.imageUrl.startsWith("data:image")) {
        console.log("   📦 Формат: Base64 data URI");
        const sizeKB = Math.round(result.imageUrl.length * 0.75 / 1024);
        console.log(`   📊 Размер: ~${sizeKB} KB`);
      } else {
        console.log("   🌐 Формат: External URL");
      }
    } catch (error: any) {
      console.error(`❌ Ошибка: ${error.message}`);
      console.error(error);
    }
  }

  console.log("\n" + "=" .repeat(80));
  console.log("✅ Тестирование завершено");
}

testImageGeneration();




