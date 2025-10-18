import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should display dashboard correctly after login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    expect(await dashboardPage.isCurrentPage()).toBe(true);
    await dashboardPage.verifyUserIsLoggedIn();
    await dashboardPage.verifyDashboardElements();
  });

  test('should navigate to applications section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToApplications();
    await dashboardPage.verifyApplicationsList();
  });

  test('should navigate to documents section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToDocuments();
    await dashboardPage.verifyDocumentsList();
  });

  test('should navigate to appointments section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToAppointments();
    
    // Check if appointments page loads
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/appointments');
  });

  test('should navigate to payments section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToPayments();
    
    // Check if payments page loads
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/payments');
  });

  test('should navigate to profile section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToProfile();
    
    // Check if profile page loads
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/profile');
  });

  test('should display dashboard statistics', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.verifyDashboardStats();
  });

  test('should display quick actions', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.verifyQuickActions();
  });

  test('should create new application from dashboard', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Should redirect to new application form
    const currentUrl = dashboardPage.getCurrentUrl();
    expect(currentUrl).toContain('/applications/new');
  });

  test('should show recent activity', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.verifyRecentActivity();
  });

  test('should display notifications', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    const hasNotifications = await dashboardPage.verifyNotifications();
    // Notifications section should exist (even if empty)
    expect(typeof hasNotifications).toBe('boolean');
  });

  test('should handle welcome flow for new users', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    const hasWelcomeFlow = await dashboardPage.checkForWelcomeFlow();
    
    if (hasWelcomeFlow) {
      await dashboardPage.skipWelcomeFlow();
      // Verify we can still access dashboard features
      await dashboardPage.verifyDashboardElements();
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.verifyResponsiveDesign();
  });

  test('should count applications and documents', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    const applicationsCount = await dashboardPage.getApplicationsCount();
    const documentsCount = await dashboardPage.getDocumentsCount();
    
    // Should return valid numbers (including 0)
    expect(applicationsCount).toBeGreaterThanOrEqual(0);
    expect(documentsCount).toBeGreaterThanOrEqual(0);
    
    console.log(`User has ${applicationsCount} applications and ${documentsCount} documents`);
  });

  test('should maintain state when navigating between sections', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to applications and back
    await dashboardPage.goToApplications();
    await dashboardPage.goto(); // Back to main dashboard
    
    // Should still be logged in and functional
    await dashboardPage.verifyUserIsLoggedIn();
    await dashboardPage.verifyDashboardElements();
    
    // Navigate to documents and back
    await dashboardPage.goToDocuments();
    await dashboardPage.goto(); // Back to main dashboard
    
    await dashboardPage.verifyDashboardElements();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Check applications - should handle both empty and populated states
    await dashboardPage.goToApplications();
    const applicationsCount = await dashboardPage.getApplicationsCount();
    
    if (applicationsCount === 0) {
      // Should show empty state message
      const hasEmptyMessage = await page.locator('text=No applications, text=No data, text=Get started').isVisible();
      expect(hasEmptyMessage).toBe(true);
    }
    
    // Check documents - should handle both empty and populated states  
    await dashboardPage.goToDocuments();
    const documentsCount = await dashboardPage.getDocumentsCount();
    
    if (documentsCount === 0) {
      // Should show empty state message or upload prompt
      const hasEmptyMessage = await page.locator('text=No documents, text=Upload, text=Get started').isVisible();
      expect(hasEmptyMessage).toBe(true);
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should have working breadcrumb navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Navigate deep into the application
    await dashboardPage.goToApplications();
    
    // Check for breadcrumb or back navigation
    const breadcrumbElements = [
      'text=Dashboard',
      'text=Home',
      'text=Back',
      '[data-testid="breadcrumb"]',
      '.breadcrumb'
    ];
    
    let foundBreadcrumb = false;
    for (const element of breadcrumbElements) {
      if (await page.locator(element).isVisible()) {
        foundBreadcrumb = true;
        break;
      }
    }
    
    // Should have some form of navigation aid
    expect(foundBreadcrumb).toBe(true);
  });

  test('should maintain user session across page refreshes', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Verify logged in
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    
    // Refresh page
    await page.reload();
    await dashboardPage.waitForPageLoad();
    
    // Should still be logged in
    expect(await dashboardPage.isLoggedIn()).toBe(true);
    await dashboardPage.verifyDashboardElements();
  });

  test('should handle direct URL access to dashboard sections', async ({ page }) => {
    // Directly navigate to applications page
    await page.goto('/dashboard/applications');
    await page.waitForLoadState('networkidle');
    
    // Should be accessible and show applications
    const currentUrl = page.url();
    expect(currentUrl).toContain('/applications');
    
    // Should still show dashboard navigation
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardElements();
  });
});