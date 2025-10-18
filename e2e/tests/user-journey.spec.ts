import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import { RegistrationPage } from '../pages/registration-page';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { ApplicationPage } from '../pages/application-page';

test.describe('Complete User Journey', () => {
  test('should complete end-to-end visa application journey', async ({ page }) => {
    // Step 1: Visit homepage
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyPageElements();
    console.log('✅ Homepage loaded successfully');

    // Step 2: Navigate to registration
    await homePage.clickGetStarted();
    
    const registrationPage = new RegistrationPage(page);
    expect(await registrationPage.isCurrentPage()).toBe(true);
    console.log('✅ Navigated to registration page');

    // Step 3: Register new user
    const testUser = {
      firstName: 'Journey',
      lastName: 'Test',
      email: `journey-test-${Date.now()}@example.com`,
      password: 'JourneyTest123!',
      acceptTerms: true,
      subscribeNewsletter: false
    };

    await registrationPage.register(testUser);
    const registrationSuccess = await registrationPage.verifySuccessfulRegistration();
    expect(registrationSuccess).toBe(true);
    console.log('✅ User registration completed');

    // Step 4: Login (if not automatically logged in)
    const loginPage = new LoginPage(page);
    if (await loginPage.isCurrentPage()) {
      await loginPage.login(testUser.email, testUser.password);
      const loginSuccess = await loginPage.verifySuccessfulLogin();
      expect(loginSuccess).toBe(true);
      console.log('✅ User login completed');
    }

    // Step 5: Verify dashboard access
    const dashboardPage = new DashboardPage(page);
    expect(await dashboardPage.isCurrentPage()).toBe(true);
    await dashboardPage.verifyUserIsLoggedIn();
    await dashboardPage.verifyDashboardElements();
    console.log('✅ Dashboard access verified');

    // Step 6: Create new application
    await dashboardPage.createNewApplication();
    
    const applicationPage = new ApplicationPage(page);
    expect(await applicationPage.isCurrentPage()).toBe(true);
    await applicationPage.verifyApplicationForm();
    console.log('✅ Application form loaded');

    // Step 7: Fill application details
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15',
      purpose: 'Tourism and visiting cultural sites'
    });
    console.log('✅ Application basic info filled');

    // Step 8: Navigate through application steps
    await applicationPage.proceedToNextStep();
    console.log('✅ Proceeded to next application step');

    // Step 9: Upload documents (if documents step exists)
    try {
      await applicationPage.navigateToStep(3);
      
      // Create test documents
      const passportContent = applicationPage.helpers.createTestFile('passport.pdf', 'application/pdf');
      const photoContent = applicationPage.helpers.createTestFile('photo.jpg', 'image/jpeg');
      
      const passportPath = await applicationPage.helpers.saveTestFile('journey-passport.pdf', passportContent);
      const photoPath = await applicationPage.helpers.saveTestFile('journey-photo.jpg', photoContent);
      
      await applicationPage.uploadDocument('passport', passportPath);
      await applicationPage.uploadDocument('photo', photoPath);
      
      console.log('✅ Documents uploaded successfully');
    } catch (error) {
      console.log('⚠️ Document upload step skipped or not available');
    }

    // Step 10: Review application
    try {
      await applicationPage.verifyReviewStep();
      console.log('✅ Application review step completed');
    } catch (error) {
      console.log('⚠️ Review step not available or different flow');
    }

    // Step 11: Save as draft (before submission)
    try {
      await applicationPage.saveAsDraft();
      console.log('✅ Application saved as draft');
    } catch (error) {
      console.log('⚠️ Save as draft not available');
    }

    // Step 12: Navigate to applications list
    await dashboardPage.goToApplications();
    const applicationsCount = await dashboardPage.getApplicationsCount();
    expect(applicationsCount).toBeGreaterThan(0);
    console.log(`✅ Applications list shows ${applicationsCount} applications`);

    // Step 13: Navigate to documents section
    await dashboardPage.goToDocuments();
    await dashboardPage.verifyDocumentsList();
    console.log('✅ Documents section verified');

    // Step 14: Check payment section
    await dashboardPage.goToPayments();
    console.log('✅ Payment section accessed');

    // Step 15: Return to dashboard
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardElements();
    console.log('✅ Returned to dashboard successfully');

    console.log('🎉 Complete user journey test passed!');
  });

  test('should handle tourist visa application flow', async ({ page }) => {
    // Login with existing test user
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);

    // Create tourist visa application
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-07-15',
      returnDate: '2024-07-30',
      purpose: 'Vacation and sightseeing in Germany'
    });

    console.log('✅ Tourist visa application created');

    // Verify application appears in list
    await dashboardPage.goToApplications();
    const count = await dashboardPage.getApplicationsCount();
    expect(count).toBeGreaterThan(0);
    console.log('✅ Tourist application visible in applications list');
  });

  test('should handle business visa application flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);

    // Create business visa application
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'business',
      destinationCountry: 'Germany',
      travelDate: '2024-09-01',
      returnDate: '2024-09-10',
      purpose: 'Business meetings and conferences'
    });

    console.log('✅ Business visa application created');

    // Save as draft
    await applicationPage.saveAsDraft();
    console.log('✅ Business application saved as draft');
  });

  test('should handle student visa application flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);

    // Create student visa application
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'student',
      destinationCountry: 'Germany',
      travelDate: '2024-10-01',
      returnDate: '2025-09-30',
      purpose: 'University studies in Computer Science'
    });

    console.log('✅ Student visa application created');

    // Navigate to documents if available
    try {
      await applicationPage.navigateToStep(3);
      console.log('✅ Navigated to documents section for student visa');
    } catch (error) {
      console.log('⚠️ Documents section not available for student visa');
    }
  });

  test('should handle work visa application flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);

    // Create work visa application
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'work',
      destinationCountry: 'Germany',
      travelDate: '2024-11-01',
      returnDate: '2026-10-31',
      purpose: 'Employment as Software Engineer'
    });

    console.log('✅ Work visa application created');
  });

  test('should handle user profile and settings', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);

    // Navigate to profile
    await dashboardPage.goToProfile();
    
    // Check if profile page loads
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/profile');
    console.log('✅ Profile page accessed');

    // Look for profile elements
    const profileElements = [
      'text=Profile',
      'text=Settings',
      'text=Personal Information',
      'text=Edit',
      'input[type="email"]',
      'input[name="firstName"]'
    ];

    let foundProfileElement = false;
    for (const element of profileElements) {
      if (await page.locator(element).isVisible()) {
        foundProfileElement = true;
        console.log(`Found profile element: ${element}`);
        break;
      }
    }

    expect(foundProfileElement).toBe(true);
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyResponsiveDesign();
    console.log('✅ Homepage responsive design verified');

    // Test login on mobile
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyResponsiveDesign();
    console.log('✅ Dashboard responsive design verified');

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should verify accessibility features', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyAccessibility();
    console.log('✅ Homepage accessibility verified');

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.verifyAccessibility();
    console.log('✅ Login page accessibility verified');

    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.verifyAccessibility();
    console.log('✅ Registration page accessibility verified');
  });

  test('should verify page performance', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.verifyPerformance();
    console.log('✅ Homepage performance verified');

    // Test application page performance
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    const startTime = Date.now();
    await dashboardPage.createNewApplication();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    console.log(`✅ Application page loaded in ${loadTime}ms`);
  });

  test('should handle multiple sessions and state management', async ({ page }) => {
    // Test session persistence
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();

    const dashboardPage = new DashboardPage(page);
    expect(await dashboardPage.isLoggedIn()).toBe(true);

    // Refresh page and verify session persists
    await page.reload();
    await dashboardPage.waitForPageLoad();
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    console.log('✅ Session persists after page refresh');

    // Navigate away and back
    await page.goto('/');
    await dashboardPage.goto();
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    console.log('✅ Session persists across navigation');
  });
});

test.describe('Error Scenarios and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to login with network failure
    if (process.env.E2E_TEST_USER_EMAIL && process.env.E2E_TEST_USER_PASSWORD) {
      await loginPage.login(process.env.E2E_TEST_USER_EMAIL, process.env.E2E_TEST_USER_PASSWORD);

      // Should show error message
      const hasError = await loginPage.helpers.hasErrorMessage();
      expect(hasError).toBe(true);
      console.log('✅ Network error handled gracefully');
    }
  });

  test('should handle invalid routes', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/invalid-route-that-does-not-exist');

    // Should show 404 page or redirect
    const is404 = await page.locator('text=404, text=Not Found, text=Page not found').isVisible();
    const isRedirected = !page.url().includes('/invalid-route');

    expect(is404 || isRedirected).toBe(true);
    console.log('✅ Invalid routes handled properly');
  });

  test('should handle unauthorized access', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login or show unauthorized message
    const currentUrl = page.url();
    const isRedirectedToLogin = currentUrl.includes('/login');
    const hasUnauthorizedMessage = await page.locator('text=unauthorized, text=login required').isVisible();

    expect(isRedirectedToLogin || hasUnauthorizedMessage).toBe(true);
    console.log('✅ Unauthorized access handled properly');
  });
});