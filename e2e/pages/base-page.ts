import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export abstract class BasePage {
  protected helpers: TestHelpers;

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(page);
  }

  /**
   * Navigate to this page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad() {
    await this.helpers.waitForPageLoad();
  }

  /**
   * Check if we're on the correct page
   */
  abstract isCurrentPage(): Promise<boolean>;

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    return await this.helpers.takeScreenshot(name);
  }

  /**
   * Check for navigation/header elements
   */
  async hasNavigation(): Promise<boolean> {
    return await this.helpers.isElementVisible('header, nav, [role="navigation"]');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Check for common authenticated user indicators
    const indicators = [
      'text=Dashboard',
      'text=Logout',
      'text=Profile',
      '[data-testid="user-menu"]',
      '.user-avatar'
    ];

    for (const indicator of indicators) {
      if (await this.helpers.isElementVisible(indicator)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Logout user
   */
  async logout() {
    // Try common logout patterns
    const logoutSelectors = [
      'text=Logout',
      'text=Sign out',
      '[data-testid="logout"]',
      'button:has-text("Logout")'
    ];

    for (const selector of logoutSelectors) {
      if (await this.helpers.isElementVisible(selector)) {
        await this.helpers.clickAndWait(selector, { url: '**/login' });
        return;
      }
    }

    // If no logout button found, clear browser data
    await this.helpers.clearBrowserData();
    await this.page.goto('/login');
  }

  /**
   * Wait for toast/notification
   */
  async waitForNotification(type: 'success' | 'error' | 'info' = 'success', timeout = 10000) {
    const selectors = {
      success: '[role="alert"], .toast-success, .alert-success, text=Success',
      error: '[role="alert"], .toast-error, .alert-error, text=Error',
      info: '[role="alert"], .toast-info, .alert-info, text=Info'
    };

    await this.page.waitForSelector(selectors[type], { timeout });
  }

  /**
   * Get notification message
   */
  async getNotificationMessage(): Promise<string | null> {
    const notificationSelectors = [
      '[role="alert"]',
      '.toast',
      '.alert',
      '.notification'
    ];

    for (const selector of notificationSelectors) {
      if (await this.helpers.isElementVisible(selector)) {
        return await this.page.locator(selector).textContent();
      }
    }
    return null;
  }

  /**
   * Wait for form submission
   */
  async waitForFormSubmission() {
    // Wait for any loading indicators to disappear
    await this.helpers.waitForLoading();
    
    // Check for success/error states
    await this.page.waitForTimeout(1000); // Brief wait for state changes
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorSelectors = [
      '.field-error',
      '.form-error',
      '.invalid-feedback',
      '[aria-invalid="true"]',
      '.text-red-500',
      '.text-red-600'
    ];

    for (const selector of errorSelectors) {
      if (await this.helpers.isElementVisible(selector)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errorSelectors = [
      '.field-error',
      '.form-error',
      '.invalid-feedback',
      '.text-red-500',
      '.text-red-600'
    ];

    const errors: string[] = [];
    for (const selector of errorSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        const text = await elements.nth(i).textContent();
        if (text) {
          errors.push(text);
        }
      }
    }
    return errors;
  }
}