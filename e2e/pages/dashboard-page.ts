import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  // Navigation elements
  private readonly applicationsTab = this.page.locator('text=Applications, text=Başvurular');
  private readonly documentsTab = this.page.locator('text=Documents, text=Belgeler');
  private readonly appointmentsTab = this.page.locator('text=Appointments, text=Randevular');
  private readonly paymentsTab = this.page.locator('text=Payments, text=Ödemeler');
  private readonly profileTab = this.page.locator('text=Profile, text=Profil');

  // Dashboard elements
  private readonly welcomeMessage = this.page.locator('text=Welcome, text=Hoş geldiniz');
  private readonly newApplicationButton = this.page.locator('text=New Application, text=Yeni Başvuru');
  private readonly quickActionsSection = this.page.locator('[data-testid="quick-actions"], .quick-actions');
  private readonly dashboardStats = this.page.locator('[data-testid="dashboard-stats"], .dashboard-stats');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async isCurrentPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/dashboard');
  }

  // Navigation methods
  async goToApplications() {
    await this.helpers.clickAndWait('text=Applications, text=Başvurular', { 
      url: '**/dashboard/applications' 
    });
  }

  async goToDocuments() {
    await this.helpers.clickAndWait('text=Documents, text=Belgeler', { 
      url: '**/dashboard/documents' 
    });
  }

  async goToAppointments() {
    await this.helpers.clickAndWait('text=Appointments, text=Randevular', { 
      url: '**/dashboard/appointments' 
    });
  }

  async goToPayments() {
    await this.helpers.clickAndWait('text=Payments, text=Ödemeler', { 
      url: '**/dashboard/payments' 
    });
  }

  async goToProfile() {
    await this.helpers.clickAndWait('text=Profile, text=Profil', { 
      url: '**/dashboard/profile' 
    });
  }

  async createNewApplication() {
    await this.helpers.clickAndWait('text=New Application, text=Yeni Başvuru', { 
      url: '**/dashboard/applications/new' 
    });
  }

  // Verification methods
  async verifyDashboardElements() {
    // Check main dashboard elements are visible
    await expect(this.applicationsTab).toBeVisible();
    await expect(this.documentsTab).toBeVisible();
    await expect(this.appointmentsTab).toBeVisible();
    await expect(this.newApplicationButton).toBeVisible();
  }

  async verifyUserIsLoggedIn() {
    expect(await this.isLoggedIn()).toBe(true);
    
    // Check for user-specific elements
    const userElements = [
      this.welcomeMessage,
      'text=Dashboard',
      '[data-testid="user-menu"]'
    ];

    let found = false;
    for (const element of userElements) {
      if (typeof element === 'string') {
        if (await this.helpers.isElementVisible(element)) {
          found = true;
          break;
        }
      } else {
        if (await element.isVisible()) {
          found = true;
          break;
        }
      }
    }
    
    expect(found).toBe(true);
  }

  async verifyDashboardStats() {
    if (await this.dashboardStats.isVisible()) {
      // Check for stats cards
      const statsElements = [
        'text=Total Applications',
        'text=Pending',
        'text=Completed',
        'text=Documents'
      ];

      for (const stat of statsElements) {
        await this.helpers.waitForElement(stat);
      }
    }
  }

  async verifyQuickActions() {
    if (await this.quickActionsSection.isVisible()) {
      await expect(this.newApplicationButton).toBeVisible();
      
      // Check for other quick action buttons
      const quickActions = [
        'text=Upload Document',
        'text=Schedule Appointment',
        'text=View Status'
      ];

      for (const action of quickActions) {
        if (await this.helpers.isElementVisible(action)) {
          await expect(this.page.locator(action)).toBeVisible();
        }
      }
    }
  }

  async verifyApplicationsList() {
    await this.goToApplications();
    
    // Check if applications list is loaded
    const applicationsElements = [
      'text=Your Applications',
      'text=No applications',
      '[data-testid="application-card"]',
      '.application-item'
    ];

    let found = false;
    for (const element of applicationsElements) {
      if (await this.helpers.isElementVisible(element)) {
        found = true;
        break;
      }
    }
    
    expect(found).toBe(true);
  }

  async verifyDocumentsList() {
    await this.goToDocuments();
    
    // Check if documents list is loaded
    const documentsElements = [
      'text=Your Documents',
      'text=No documents',
      'text=Upload Document',
      '[data-testid="document-card"]',
      '.document-item'
    ];

    let found = false;
    for (const element of documentsElements) {
      if (await this.helpers.isElementVisible(element)) {
        found = true;
        break;
      }
    }
    
    expect(found).toBe(true);
  }

  async getApplicationsCount(): Promise<number> {
    await this.goToApplications();
    
    const applicationCards = this.page.locator('[data-testid="application-card"], .application-item');
    return await applicationCards.count();
  }

  async getDocumentsCount(): Promise<number> {
    await this.goToDocuments();
    
    const documentCards = this.page.locator('[data-testid="document-card"], .document-item');
    return await documentCards.count();
  }

  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile navigation is working
    await expect(this.applicationsTab).toBeVisible();
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.newApplicationButton).toBeVisible();
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async verifyRecentActivity() {
    // Check for recent activity section
    if (await this.helpers.isElementVisible('text=Recent Activity, text=Son Aktiviteler')) {
      const activityItems = this.page.locator('[data-testid="activity-item"], .activity-item');
      const count = await activityItems.count();
      
      if (count > 0) {
        // Verify activity items have proper structure
        const firstActivity = activityItems.first();
        await expect(firstActivity).toBeVisible();
      }
    }
  }

  async verifyNotifications() {
    // Check for notifications section
    const notificationElements = [
      'text=Notifications',
      'text=No notifications',
      '[data-testid="notification"]',
      '.notification-item'
    ];

    for (const element of notificationElements) {
      if (await this.helpers.isElementVisible(element)) {
        return true;
      }
    }
    return false;
  }

  async checkForWelcomeFlow() {
    // Check if this is a new user with welcome flow
    const welcomeElements = [
      'text=Welcome to Visa Assist',
      'text=Get Started',
      'text=Complete your profile',
      '[data-testid="welcome-tour"]'
    ];

    for (const element of welcomeElements) {
      if (await this.helpers.isElementVisible(element)) {
        return true;
      }
    }
    return false;
  }

  async skipWelcomeFlow() {
    if (await this.checkForWelcomeFlow()) {
      const skipButtons = [
        'text=Skip',
        'text=Skip Tour',
        'text=Maybe Later',
        '[data-testid="skip-welcome"]'
      ];

      for (const button of skipButtons) {
        if (await this.helpers.isElementVisible(button)) {
          await this.helpers.clickAndWait(button);
          break;
        }
      }
    }
  }
}