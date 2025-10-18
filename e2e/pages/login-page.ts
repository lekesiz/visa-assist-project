import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  // Form field locators
  private readonly emailField = this.page.locator('input[type="email"]');
  private readonly passwordField = this.page.locator('input[type="password"]');
  private readonly loginButton = this.page.locator('button[type="submit"]');
  private readonly rememberMeCheckbox = this.page.locator('#rememberMe, input[type="checkbox"]');

  // Page elements
  private readonly pageTitle = this.page.locator('h1, h2').filter({ hasText: /login|sign in/i });
  private readonly registerLink = this.page.locator('text=Sign up, text=Create account, text=Register');
  private readonly forgotPasswordLink = this.page.locator('text=Forgot password, text=Reset password');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async isCurrentPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/login');
  }

  // Login actions
  async login(email: string, password: string, rememberMe = false) {
    await this.helpers.fillField('input[type="email"]', email);
    await this.helpers.fillField('input[type="password"]', password);
    
    if (rememberMe && await this.rememberMeCheckbox.isVisible()) {
      await this.rememberMeCheckbox.check();
    }
    
    await this.loginButton.click();
    await this.waitForFormSubmission();
  }

  async clickRegisterLink() {
    await this.helpers.clickAndWait('text=Sign up, text=Create account, text=Register', { 
      url: '**/register' 
    });
  }

  async clickForgotPassword() {
    if (await this.forgotPasswordLink.isVisible()) {
      await this.helpers.clickAndWait('text=Forgot password, text=Reset password', { 
        url: '**/reset-password' 
      });
    }
  }

  // Verification methods
  async verifyPageElements() {
    await expect(this.emailField).toBeVisible();
    await expect(this.passwordField).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.registerLink).toBeVisible();
  }

  async verifyFormValidation() {
    // Try submitting empty form
    await this.loginButton.click();
    
    // Check for validation errors
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyInvalidCredentials() {
    await this.login('invalid@example.com', 'wrongpassword');
    
    // Check for error message
    const hasError = await this.helpers.hasErrorMessage();
    expect(hasError).toBe(true);
    
    const errorMessage = await this.helpers.getErrorMessage();
    expect(errorMessage).toMatch(/invalid|incorrect|wrong|failed/i);
  }

  async verifySuccessfulLogin() {
    // Wait for redirect to dashboard or home page
    try {
      await Promise.race([
        this.page.waitForURL('**/dashboard**', { timeout: 15000 }),
        this.page.waitForURL('**/', { timeout: 15000 })
      ]);
      
      // Verify user is logged in
      return await this.isLoggedIn();
    } catch {
      return false;
    }
  }

  async verifyEmailValidation() {
    await this.helpers.fillField('input[type="email"]', 'invalid-email');
    await this.loginButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyPasswordRequirement() {
    await this.helpers.fillField('input[type="email"]', 'test@example.com');
    // Leave password empty
    await this.loginButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyLoadingState() {
    await this.helpers.fillField('input[type="email"]', 'test@example.com');
    await this.helpers.fillField('input[type="password"]', 'password');
    
    // Submit and immediately check for loading state
    await this.loginButton.click();
    
    // Check if button shows loading state
    const isLoading = await this.page.locator('button:has-text("Signing in"), .animate-spin').isVisible();
    
    // Wait for form submission to complete
    await this.waitForFormSubmission();
    
    return isLoading;
  }

  async verifyAccessibility() {
    // Check form labels
    const emailLabel = this.page.locator('label').filter({ hasText: /email/i });
    const passwordLabel = this.page.locator('label').filter({ hasText: /password/i });
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    
    // Check input attributes
    await expect(this.emailField).toHaveAttribute('type', 'email');
    await expect(this.passwordField).toHaveAttribute('type', 'password');
    await expect(this.emailField).toHaveAttribute('required');
    await expect(this.passwordField).toHaveAttribute('required');
  }

  async verifySecurityFeatures() {
    // Check password field is not visible
    const passwordValue = await this.passwordField.inputValue();
    const passwordType = await this.passwordField.getAttribute('type');
    expect(passwordType).toBe('password');
    
    // Check form uses POST method (if form element is present)
    const form = this.page.locator('form');
    if (await form.isVisible()) {
      const method = await form.getAttribute('method');
      if (method) {
        expect(method.toLowerCase()).toBe('post');
      }
    }
  }

  async verifyDemoMode() {
    // Check if demo mode is indicated on the page
    const demoIndicators = [
      'text=Demo Mode',
      'text=Demo',
      'text=Test Account',
      '[data-testid="demo-mode"]'
    ];
    
    for (const indicator of demoIndicators) {
      if (await this.helpers.isElementVisible(indicator)) {
        return true;
      }
    }
    return false;
  }

  async loginWithTestUser() {
    const testEmail = process.env.E2E_TEST_USER_EMAIL;
    const testPassword = process.env.E2E_TEST_USER_PASSWORD;
    
    if (!testEmail || !testPassword) {
      throw new Error('Test user credentials not found in environment');
    }
    
    await this.login(testEmail, testPassword);
    return await this.verifySuccessfulLogin();
  }
}