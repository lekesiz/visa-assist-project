import { Page, Locator, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateAndWait(url: string) {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, options?: { timeout?: number }) {
    const field = this.page.locator(selector);
    await expect(field).toBeVisible(options);
    await field.clear();
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Click element with wait
   */
  async clickAndWait(selector: string, waitFor?: { url?: string; timeout?: number }) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await element.click();
    
    if (waitFor?.url) {
      await this.page.waitForURL(waitFor.url, { timeout: waitFor.timeout || 10000 });
    }
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      await expect(element).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible({ timeout });
    return element;
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join('e2e-results', 'screenshots', `${name}-${timestamp}.png`);
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  /**
   * Generate test file for uploads
   */
  createTestFile(filename: string, mimeType: string, sizeMB: number = 1): Buffer {
    const sizeBytes = sizeMB * 1024 * 1024;
    const content = Buffer.alloc(sizeBytes, 'test-content');
    return content;
  }

  /**
   * Save test file to fixtures directory
   */
  async saveTestFile(filename: string, content: Buffer): Promise<string> {
    const fixturesDir = path.join(__dirname, '..', 'fixtures', 'uploads');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    const filepath = path.join(fixturesDir, filename);
    fs.writeFileSync(filepath, content);
    return filepath;
  }

  /**
   * Upload file using file input
   */
  async uploadFile(fileInputSelector: string, filename: string, content?: Buffer) {
    let filepath: string;
    
    if (content) {
      filepath = await this.saveTestFile(filename, content);
    } else {
      // Use existing test file
      filepath = path.join(__dirname, '..', 'fixtures', filename);
    }
    
    const fileInput = this.page.locator(fileInputSelector);
    await fileInput.setInputFiles(filepath);
    
    return filepath;
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string, method = 'POST') {
    return this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && 
      response.request().method() === method
    );
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string, response: any, status = 200) {
    await this.page.route(`**/${urlPattern}`, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Get current URL path
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(selector: string) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Generate random email for testing
   */
  generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `e2e-test-${timestamp}-${random}@example.com`;
  }

  /**
   * Generate test user data
   */
  generateTestUser() {
    const timestamp = Date.now();
    return {
      firstName: 'Test',
      lastName: 'User',
      email: this.generateTestEmail(),
      password: 'TestPassword123!',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-01'
    };
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for loading spinners to disappear
    const loadingSpinner = this.page.locator('[data-testid="loading"], .animate-spin, text=Loading');
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeHidden({ timeout: 15000 });
    }
  }

  /**
   * Check for error messages
   */
  async hasErrorMessage(): Promise<boolean> {
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-red-600',
      '.text-red-800',
      'text=Error',
      'text=Failed'
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-red-600',
      '.text-red-800'
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector)) {
        return await this.page.locator(selector).textContent();
      }
    }
    return null;
  }

  /**
   * Assert no errors on page
   */
  async assertNoErrors() {
    const hasError = await this.hasErrorMessage();
    if (hasError) {
      const errorMessage = await this.getErrorMessage();
      throw new Error(`Unexpected error on page: ${errorMessage}`);
    }
  }

  /**
   * Clear all cookies and storage
   */
  async clearBrowserData() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}