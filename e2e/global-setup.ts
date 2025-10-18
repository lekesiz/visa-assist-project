import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the server to be ready
    console.log(`📡 Checking server availability at ${baseURL}...`);
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Check if the homepage loads properly
    const title = await page.title();
    console.log(`✅ Server is ready. Page title: ${title}`);

    // Create a test user for authenticated tests
    const testUser = {
      email: `e2e-test-user-${Date.now()}@example.com`,
      password: 'E2ETestPassword123!',
      firstName: 'E2E',
      lastName: 'TestUser'
    };

    // Navigate to registration page
    await page.goto('/register');
    
    // Fill out registration form
    await page.fill('#firstName', testUser.firstName);
    await page.fill('#lastName', testUser.lastName);
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    await page.fill('#confirmPassword', testUser.password);
    await page.check('#terms');

    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for either success page or demo mode redirect
    try {
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('✅ Registration completed - redirected to login');
    } catch {
      // Check if we're in demo mode with success page
      if (await page.locator('text=Registration Successful').isVisible()) {
        console.log('✅ Registration completed - demo mode success');
        await page.click('text=Go to Login');
      }
    }

    // Login with the test user
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for successful login (dashboard or redirect)
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    console.log('✅ Test user logged in successfully');

    // Save authentication state
    await page.context().storageState({ 
      path: path.join(__dirname, 'storage-states', 'user.json') 
    });

    // Store test user info for tests
    process.env.E2E_TEST_USER_EMAIL = testUser.email;
    process.env.E2E_TEST_USER_PASSWORD = testUser.password;

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;