import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class RegistrationPage extends BasePage {
  // Form field locators
  private readonly firstNameField = this.page.locator('#firstName');
  private readonly lastNameField = this.page.locator('#lastName');
  private readonly emailField = this.page.locator('#email');
  private readonly passwordField = this.page.locator('#password');
  private readonly confirmPasswordField = this.page.locator('#confirmPassword');
  private readonly termsCheckbox = this.page.locator('#terms');
  private readonly newsletterCheckbox = this.page.locator('#newsletter');
  private readonly submitButton = this.page.locator('button[type="submit"]');

  // Page elements
  private readonly pageTitle = this.page.locator('text=Create Your Account');
  private readonly loginLink = this.page.locator('text=Sign in');
  private readonly privacyPolicyLink = this.page.locator('text=Privacy Policy');
  private readonly termsOfServiceLink = this.page.locator('text=Terms of Service');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.waitForPageLoad();
  }

  async isCurrentPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/register');
  }

  // Form actions
  async fillRegistrationForm(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    subscribeNewsletter?: boolean;
  }) {
    await this.helpers.fillField('#firstName', userData.firstName);
    await this.helpers.fillField('#lastName', userData.lastName);
    await this.helpers.fillField('#email', userData.email);
    await this.helpers.fillField('#password', userData.password);
    await this.helpers.fillField('#confirmPassword', userData.confirmPassword || userData.password);

    if (userData.acceptTerms !== false) {
      await this.termsCheckbox.check();
    }

    if (userData.subscribeNewsletter) {
      await this.newsletterCheckbox.check();
    }
  }

  async submitForm() {
    await this.submitButton.click();
    await this.waitForFormSubmission();
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    subscribeNewsletter?: boolean;
  }) {
    await this.fillRegistrationForm(userData);
    await this.submitForm();
  }

  async clickLoginLink() {
    await this.helpers.clickAndWait('text=Sign in', { url: '**/login' });
  }

  // Validation methods
  async verifyPageElements() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.firstNameField).toBeVisible();
    await expect(this.lastNameField).toBeVisible();
    await expect(this.emailField).toBeVisible();
    await expect(this.passwordField).toBeVisible();
    await expect(this.confirmPasswordField).toBeVisible();
    await expect(this.termsCheckbox).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }

  async verifyFormValidation() {
    // Try submitting empty form
    await this.submitButton.click();
    
    // Check for validation errors
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyEmailValidation() {
    await this.helpers.fillField('#email', 'invalid-email');
    await this.submitButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
    
    // Clear and try valid email
    await this.helpers.fillField('#email', 'valid@example.com');
  }

  async verifyPasswordValidation() {
    // Test short password
    await this.helpers.fillField('#password', '123');
    await this.helpers.fillField('#confirmPassword', '123');
    await this.submitButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
    
    // Test password mismatch
    await this.helpers.fillField('#password', 'ValidPassword123!');
    await this.helpers.fillField('#confirmPassword', 'DifferentPassword123!');
    await this.submitButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyTermsValidation() {
    const userData = this.helpers.generateTestUser();
    await this.fillRegistrationForm({
      ...userData,
      acceptTerms: false
    });
    
    await this.submitButton.click();
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifySuccessfulRegistration() {
    // Check for success page or redirect
    try {
      // Wait for either success message or redirect
      await Promise.race([
        this.page.waitForSelector('text=Registration Successful', { timeout: 10000 }),
        this.page.waitForURL('**/login', { timeout: 10000 }),
        this.page.waitForURL('**/dashboard', { timeout: 10000 })
      ]);
      
      return true;
    } catch {
      return false;
    }
  }

  async verifyRegistrationSuccess() {
    const currentUrl = this.getCurrentUrl();
    
    if (currentUrl.includes('/login')) {
      // Redirected to login page
      await expect(this.page.locator('text=Login, text=Sign In')).toBeVisible();
      return 'login_redirect';
    } else if (currentUrl.includes('/dashboard')) {
      // Directly logged in and redirected to dashboard
      await expect(this.page.locator('text=Dashboard')).toBeVisible();
      return 'dashboard_redirect';
    } else {
      // Success page
      await expect(this.page.locator('text=Registration Successful')).toBeVisible();
      return 'success_page';
    }
  }

  async checkForDuplicateEmailError() {
    return await this.page.locator('text=email already exists, text=already registered').isVisible();
  }

  async verifyFormFieldRequirements() {
    // Check required attributes
    await expect(this.firstNameField).toHaveAttribute('required');
    await expect(this.lastNameField).toHaveAttribute('required');
    await expect(this.emailField).toHaveAttribute('required');
    await expect(this.passwordField).toHaveAttribute('required');
    await expect(this.confirmPasswordField).toHaveAttribute('required');
    
    // Check input types
    await expect(this.emailField).toHaveAttribute('type', 'email');
    await expect(this.passwordField).toHaveAttribute('type', 'password');
    await expect(this.confirmPasswordField).toHaveAttribute('type', 'password');
  }

  async verifyExternalLinks() {
    // Check that terms and privacy policy links exist
    await expect(this.termsOfServiceLink).toBeVisible();
    await expect(this.privacyPolicyLink).toBeVisible();
    
    // Verify they have proper href attributes
    const termsHref = await this.termsOfServiceLink.getAttribute('href');
    const privacyHref = await this.privacyPolicyLink.getAttribute('href');
    
    expect(termsHref).toContain('/terms');
    expect(privacyHref).toContain('/privacy');
  }

  async verifyAccessibility() {
    // Check form labels
    await expect(this.page.locator('label[for="firstName"]')).toBeVisible();
    await expect(this.page.locator('label[for="lastName"]')).toBeVisible();
    await expect(this.page.locator('label[for="email"]')).toBeVisible();
    await expect(this.page.locator('label[for="password"]')).toBeVisible();
    await expect(this.page.locator('label[for="confirmPassword"]')).toBeVisible();
    
    // Check aria attributes
    const submitButtonText = await this.submitButton.textContent();
    expect(submitButtonText).toContain('Create Account');
  }

  async verifyLoadingState() {
    const userData = this.helpers.generateTestUser();
    await this.fillRegistrationForm(userData);
    
    // Submit and immediately check for loading state
    await this.submitButton.click();
    
    // Check if button shows loading state
    const isLoading = await this.page.locator('button:has-text("Creating Account"), .animate-spin').isVisible();
    
    // Wait for form submission to complete
    await this.waitForFormSubmission();
    
    return isLoading;
  }
}