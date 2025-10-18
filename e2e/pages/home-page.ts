import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class HomePage extends BasePage {
  // Locators
  private readonly loginButton = this.page.locator('text=Login');
  private readonly getStartedButton = this.page.locator('text=Get Started, text=Ücretsiz Başlat');
  private readonly heroTitle = this.page.locator('h2:has-text("Almanya Vize Sürecinde")');
  private readonly featuresSection = this.page.locator('#features');
  private readonly howItWorksSection = this.page.locator('text=Nasıl Çalışır?');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async isCurrentPage(): Promise<boolean> {
    return this.getCurrentUrl().endsWith('/') || this.getCurrentUrl().includes('localhost:3000');
  }

  // Actions
  async clickLogin() {
    await this.helpers.clickAndWait('text=Login', { url: '**/login' });
  }

  async clickGetStarted() {
    await this.helpers.clickAndWait('text=Get Started, text=Ücretsiz Başlat', { url: '**/register' });
  }

  async scrollToFeatures() {
    await this.helpers.scrollToElement('#features');
  }

  async scrollToHowItWorks() {
    await this.helpers.scrollToElement('text=Nasıl Çalışır?');
  }

  // Verifications
  async verifyPageElements() {
    // Check main hero elements
    await expect(this.heroTitle).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();

    // Check statistics section
    await expect(this.page.locator('text=95%')).toBeVisible();
    await expect(this.page.locator('text=10k+')).toBeVisible();
    await expect(this.page.locator('text=24/7')).toBeVisible();
  }

  async verifyFeaturesSection() {
    await this.scrollToFeatures();
    
    // Check feature cards
    await expect(this.page.locator('text=AI Destekli Analiz')).toBeVisible();
    await expect(this.page.locator('text=Otomatik Başvuru')).toBeVisible();
    await expect(this.page.locator('text=İş Bulma Desteği')).toBeVisible();
    await expect(this.page.locator('text=Güvenli & Hızlı')).toBeVisible();
  }

  async verifyHowItWorksSection() {
    await this.scrollToHowItWorks();
    
    // Check step indicators
    await expect(this.page.locator('text=1')).toBeVisible();
    await expect(this.page.locator('text=2')).toBeVisible();
    await expect(this.page.locator('text=3')).toBeVisible();
    await expect(this.page.locator('text=4')).toBeVisible();

    // Check step descriptions
    await expect(this.page.locator('text=Hesap Oluştur')).toBeVisible();
    await expect(this.page.locator('text=Belge Yükle')).toBeVisible();
    await expect(this.page.locator('text=AI İnceleme')).toBeVisible();
    await expect(this.page.locator('text=Başvuru Gönder')).toBeVisible();
  }

  async verifyResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.heroTitle).toBeVisible();
    await expect(this.loginButton).toBeVisible();

    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.heroTitle).toBeVisible();
    await expect(this.featuresSection).toBeVisible();

    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async verifyAccessibility() {
    // Check for proper heading structure
    const h1 = this.page.locator('h1');
    const h2 = this.page.locator('h2');
    
    await expect(h1).toBeVisible();
    await expect(h2).toBeVisible();

    // Check for alt text on images (if any)
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }

    // Check for proper link text
    const links = this.page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const linkText = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      expect(linkText || ariaLabel).toBeTruthy();
    }
  }

  async verifyPerformance() {
    // Check page load metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    // Assert reasonable load times (in milliseconds)
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds
    
    if (performanceMetrics.firstContentfulPaint > 0) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds
    }
  }
}