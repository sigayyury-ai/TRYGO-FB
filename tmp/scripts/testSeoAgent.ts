/**
 * Browser test for SEO Agent page
 * Tests that:
 * 1. SEO Agent page loads successfully
 * 2. Content tab shows content in each category
 */

import { chromium, Browser, Page } from 'playwright';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trygo';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function getTestData() {
  // Use the same test data as testCookieBasedState.ts
  const userId = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com
  const projectId = "686774b6773b5947fed60a78"; // AI-Powered MVP Builder
  const hypothesisId = "687fe5363c4cca83a3cc578d"; // Solo founders
  
  const db = mongoose.connection.db;
  
  const project = await db.collection("projects").findOne({ 
    _id: new mongoose.Types.ObjectId(projectId) 
  });
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const hypothesis = await db.collection("projectHypotheses").findOne({ 
    _id: new mongoose.Types.ObjectId(hypothesisId)
  });
  if (!hypothesis) {
    throw new Error(`Hypothesis not found: ${hypothesisId}`);
  }
  
  return {
    userId,
    projectId,
    hypothesisId,
    project,
    hypothesis,
  };
}

async function generateToken(userId: string): Promise<string> {
  try {
    const jwt = await import('jsonwebtoken');
    let secret = process.env.JWT_SECRET;
    
    // Если секрет не найден в backend/.env, попробуем загрузить из TRYGO-Backend/.env
    if (!secret) {
      const fs = await import('fs');
      const path = await import('path');
      const trygoBackendEnvPath = path.join(__dirname, '../../TRYGO-Backend/.env');
      if (fs.existsSync(trygoBackendEnvPath)) {
        const envContent = fs.readFileSync(trygoBackendEnvPath, 'utf-8');
        const match = envContent.match(/JWT_SECRET=(.+)/);
        if (match && match[1]) {
          secret = match[1].trim();
          console.log(`✅ Загружен JWT_SECRET из TRYGO-Backend/.env`);
        }
      }
    }
    
    if (!secret) {
      throw new Error("JWT_SECRET не найден ни в backend/.env, ни в TRYGO-Backend/.env");
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

async function testSeoAgentPageLoads(page: Page, projectId: string, hypothesisId: string): Promise<TestResult> {
  console.log('\n📄 Testing SEO Agent page load...');
  
  try {
    // Set cookies for active project and hypothesis
    await page.context().addCookies([
      {
        name: 'activeProjectId',
        value: projectId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'activeHypothesisId',
        value: hypothesisId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    
    // Navigate to SEO Agent page
    console.log(`   Navigating to ${FRONTEND_URL}/seo-agent...`);
    
    // Capture console logs before navigation
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('SeoAgentPage') || text.includes('SEO') || text.includes('Error') || text.includes('error')) {
        consoleLogs.push(`[${msg.type()}] ${text}`);
        console.log(`   [BROWSER] ${text}`);
      }
    });
    
    await page.goto(`${FRONTEND_URL}/seo-agent`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to load and React to hydrate
    await page.waitForTimeout(5000);
    
    // Check for loading spinner
    const loadingSpinner = await page.locator('[class*="LoaderSpinner"], [class*="spinner"]').first();
    const isLoading = await loadingSpinner.isVisible().catch(() => false);
    
    if (isLoading) {
      console.log('   ⏳ Page is still loading, waiting...');
      await page.waitForTimeout(5000);
    }
    
    // Check if we were redirected to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      return {
        success: false,
        message: 'Page redirected to dashboard',
        details: { currentUrl, expectedUrl: `${FRONTEND_URL}/seo-agent` },
      };
    }
    
    // Check for error messages
    const errorMessage = await page.locator('text=/error|Error|недоступен|unavailable/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      return {
        success: false,
        message: 'Error message found on page',
        details: { errorText },
      };
    }
    
    // Check for SEO Agent workspace title
    const workspaceTitle = await page.locator('text=/SEO Agent|seo agent/i').first();
    const hasTitle = await workspaceTitle.isVisible().catch(() => false);
    
    if (!hasTitle) {
      // Check console logs
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      });
      
      await page.waitForTimeout(2000);
      
      return {
        success: false,
        message: 'SEO Agent workspace not found',
        details: { 
          currentUrl,
          pageTitle: await page.title(),
          consoleLogs: consoleLogs.slice(-10),
        },
      };
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/seo-agent-page-loaded.png',
      fullPage: true 
    });
    console.log('   ✅ SEO Agent page loaded successfully');
    
    return {
      success: true,
      message: 'SEO Agent page loaded',
      details: { currentUrl },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to load SEO Agent page',
      details: { error: error.message, stack: error.stack },
    };
  }
}

async function testContentTab(page: Page): Promise<TestResult> {
  console.log('\n📝 Testing Content tab...');
  
  try {
    // Find and click Content tab
    const contentTab = page.locator('button, a, [role="tab"]').filter({ hasText: /content|Content|контент|Контент/i }).first();
    
    const tabExists = await contentTab.isVisible().catch(() => false);
    if (!tabExists) {
      // Try to find tab by data attribute or class
      const altTab = page.locator('[data-tab="content"], [data-testid="content-tab"], .tab-content').first();
      const altExists = await altTab.isVisible().catch(() => false);
      
      if (!altExists) {
        return {
          success: false,
          message: 'Content tab not found',
          details: { 
            availableTabs: await page.locator('button, a, [role="tab"]').allTextContents().catch(() => []),
          },
        };
      }
      
      await altTab.click();
    } else {
      await contentTab.click();
    }
    
    await page.waitForTimeout(2000);
    
    // Check for content categories
    const categories = [
      'PAIN', 'PAINS', 'GOAL', 'GOALS', 'TRIGGER', 'TRIGGERS',
      'FEATURE', 'FEATURES', 'BENEFIT', 'BENEFITS', 'FAQ', 'FAQS',
      'INFO', 'INFORMATIONAL',
    ];
    
    const foundCategories: string[] = [];
    const categoryContent: Record<string, number> = {};
    
    for (const category of categories) {
      const categoryElement = page.locator(`text=/${category}/i`).first();
      const exists = await categoryElement.isVisible().catch(() => false);
      
      if (exists) {
        foundCategories.push(category);
        
        // Try to find content items in this category
        const contentItems = await page.locator(`[data-category="${category}"], .category-${category.toLowerCase()}, [class*="${category.toLowerCase()}"]`).count();
        categoryContent[category] = contentItems;
      }
    }
    
    // Check for any content items
    const allContentItems = await page.locator('[class*="content"], [class*="idea"], [class*="card"], [data-testid*="content"]').count();
    
    if (allContentItems === 0 && foundCategories.length === 0) {
      // Take screenshot for debugging
      await page.screenshot({ 
        path: '/tmp/seo-agent-content-empty.png',
        fullPage: true 
      });
      
      return {
        success: false,
        message: 'No content found in Content tab',
        details: {
          allContentItems,
          foundCategories,
          pageText: (await page.textContent('body'))?.substring(0, 500),
        },
      };
    }
    
    console.log(`   ✅ Found ${foundCategories.length} categories with content`);
    console.log(`   ✅ Total content items: ${allContentItems}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/seo-agent-content-tab.png',
      fullPage: true 
    });
    
    return {
      success: true,
      message: 'Content tab loaded with content',
      details: {
        foundCategories,
        categoryContent,
        totalItems: allContentItems,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to test Content tab',
      details: { error: error.message },
    };
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('🧪 SEO AGENT BROWSER TEST');
  console.log('='.repeat(70));
  console.log();
  
  let browser: Browser | null = null;
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get test data
    const { userId, projectId, hypothesisId, project, hypothesis } = await getTestData();
    console.log(`✅ Test data loaded:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Project: ${project.title} (${projectId})`);
    console.log(`   Hypothesis: ${hypothesis.title} (${hypothesisId})`);
    console.log();
    
    // Generate token
    console.log('🔐 Generating authentication token...');
    const token = await generateToken(userId);
    console.log(`✅ Token generated: ${token.substring(0, 20)}...`);
    console.log();
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ 
      headless: true, // Run in headless mode for faster execution
      slowMo: 100,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('SeoAgentPage') || text.includes('SEO') || text.includes('Error') || text.includes('error')) {
        consoleLogs.push(`[${msg.type()}] ${text}`);
      }
    });
    
    // Capture errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error('❌ Page error:', error.message);
    });
    
    // Set cookies with token and active IDs
    await context.addCookies([
      {
        name: 'token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'activeProjectId',
        value: projectId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'activeHypothesisId',
        value: hypothesisId,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
    
    // Test 1: SEO Agent page loads
    const pageLoadResult = await testSeoAgentPageLoads(page, projectId, hypothesisId);
    console.log(`   ${pageLoadResult.success ? '✅' : '❌'} ${pageLoadResult.message}`);
    if (!pageLoadResult.success) {
      console.log('   Details:', JSON.stringify(pageLoadResult.details, null, 2));
      console.log('   Console logs:', consoleLogs.slice(-10));
      console.log('   Errors:', errors);
    }
    
    if (!pageLoadResult.success) {
      throw new Error(`Page load failed: ${pageLoadResult.message}`);
    }
    
    // Test 2: Content tab
    const contentResult = await testContentTab(page);
    console.log(`   ${contentResult.success ? '✅' : '❌'} ${contentResult.message}`);
    if (!contentResult.success) {
      console.log('   Details:', JSON.stringify(contentResult.details, null, 2));
    }
    
    // Final report
    console.log();
    console.log('='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Page Load: ${pageLoadResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Content Tab: ${contentResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log();
    
    const allPassed = pageLoadResult.success && contentResult.success;
    
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log();
      console.log('Console logs:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
      console.log();
      console.log('Errors:');
      errors.forEach(err => console.log(`   ${err}`));
    }
    
    // Keep browser open for 2 seconds
    await page.waitForTimeout(2000);
    
    await browser.close();
    await mongoose.connection.close();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    
    if (browser) {
      await browser.close();
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run test
runTest();

