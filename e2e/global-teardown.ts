import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Clean up storage state files
    const storageStatesDir = path.join(__dirname, 'storage-states');
    if (fs.existsSync(storageStatesDir)) {
      const files = fs.readdirSync(storageStatesDir);
      files.forEach(file => {
        const filePath = path.join(storageStatesDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed storage state: ${file}`);
        }
      });
    }

    // Clean up test environment variables
    delete process.env.E2E_TEST_USER_EMAIL;
    delete process.env.E2E_TEST_USER_PASSWORD;

    // Clean up test files if needed
    const testFilesDir = path.join(__dirname, 'fixtures', 'uploads');
    if (fs.existsSync(testFilesDir)) {
      const files = fs.readdirSync(testFilesDir);
      files.forEach(file => {
        if (file.startsWith('test-')) {
          const filePath = path.join(testFilesDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed test file: ${file}`);
        }
      });
    }

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

export default globalTeardown;