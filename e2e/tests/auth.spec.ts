import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import { RegistrationPage } from '../pages/registration-page';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display home page correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.goto();
    expect(await homePage.isCurrentPage()).toBe(true);
    
    await homePage.verifyPageElements();
    await homePage.verifyFeaturesSection();
    await homePage.verifyHowItWorksSection();
  });

  test('should navigate from home to registration', async ({ page }) => {
    const homePage = new HomePage(page);
    const registrationPage = new RegistrationPage(page);
    
    await homePage.goto();
    await homePage.clickGetStarted();
    
    expect(await registrationPage.isCurrentPage()).toBe(true);
    await registrationPage.verifyPageElements();
  });

  test('should register a new user successfully', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const testUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: `test-${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      acceptTerms: true,
      subscribeNewsletter: false
    };
    
    await registrationPage.goto();
    await registrationPage.register(testUser);
    
    // Verify successful registration
    const success = await registrationPage.verifySuccessfulRegistration();
    expect(success).toBe(true);
    
    const result = await registrationPage.verifyRegistrationSuccess();
    expect(['login_redirect', 'dashboard_redirect', 'success_page']).toContain(result);
  });

  test('should validate registration form properly', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    
    await registrationPage.goto();
    
    // Test empty form validation
    await registrationPage.verifyFormValidation();
    
    // Test email validation
    await registrationPage.verifyEmailValidation();
    
    // Test password validation
    await registrationPage.verifyPasswordValidation();
    
    // Test terms acceptance validation
    await registrationPage.verifyTermsValidation();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const existingEmail = process.env.E2E_TEST_USER_EMAIL || 'existing@example.com';
    
    const testUser = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: existingEmail,
      password: 'StrongPassword123!',
      acceptTerms: true
    };
    
    await registrationPage.goto();
    await registrationPage.register(testUser);
    
    // Should show error for duplicate email
    const hasDuplicateError = await registrationPage.checkForDuplicateEmailError();
    expect(hasDuplicateError).toBe(true);
  });

  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.verifyPageElements();
    
    // Use test user created in global setup
    const success = await loginPage.loginWithTestUser();
    expect(success).toBe(true);
  });

  test('should reject invalid login credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.verifyInvalidCredentials();
  });

  test('should validate login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Test empty form
    await loginPage.verifyFormValidation();
    
    // Test invalid email format
    await loginPage.verifyEmailValidation();
    
    // Test missing password
    await loginPage.verifyPasswordRequirement();
  });

  test('should navigate between login and registration', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registrationPage = new RegistrationPage(page);
    
    // Start at login page
    await loginPage.goto();
    await loginPage.clickRegisterLink();
    
    expect(await registrationPage.isCurrentPage()).toBe(true);
    
    // Go back to login
    await registrationPage.clickLoginLink();
    expect(await loginPage.isCurrentPage()).toBe(true);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await loginPage.goto();
    const success = await loginPage.loginWithTestUser();
    expect(success).toBe(true);
    
    // Should be redirected to dashboard
    expect(await dashboardPage.isCurrentPage()).toBe(true);
    await dashboardPage.verifyUserIsLoggedIn();
    await dashboardPage.verifyDashboardElements();
  });

  test('should handle loading states during authentication', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    
    // Test registration loading state
    await registrationPage.goto();
    const regLoading = await registrationPage.verifyLoadingState();
    
    // Test login loading state  
    await loginPage.goto();
    const loginLoading = await loginPage.verifyLoadingState();
    
    // At least one should show loading state (depending on implementation)
    expect(regLoading || loginLoading).toBe(true);
  });

  test('should verify form accessibility', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    
    // Test registration form accessibility
    await registrationPage.goto();
    await registrationPage.verifyAccessibility();
    
    // Test login form accessibility
    await loginPage.goto();
    await loginPage.verifyAccessibility();
  });

  test('should logout user properly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.loginWithTestUser();
    
    // Verify logged in
    expect(await dashboardPage.isCurrentPage()).toBe(true);
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    
    // Logout
    await dashboardPage.logout();
    
    // Should be redirected to login
    expect(await loginPage.isCurrentPage()).toBe(true);
    expect(await dashboardPage.isLoggedIn()).toBe(false);
  });
});

test.describe('Authentication Security', () => {
  test('should verify password field security', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registrationPage = new RegistrationPage(page);
    
    await loginPage.goto();
    await loginPage.verifySecurityFeatures();
    
    await registrationPage.goto();
    await registrationPage.verifyFormFieldRequirements();
  });

  test('should verify external links in registration', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    
    await registrationPage.goto();
    await registrationPage.verifyExternalLinks();
  });

  test('should detect demo mode if active', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    const isDemoMode = await loginPage.verifyDemoMode();
    
    // Log demo mode status for debugging
    console.log(`Demo mode detected: ${isDemoMode}`);
  });
});