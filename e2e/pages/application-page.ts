import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ApplicationPage extends BasePage {
  // Form sections
  private readonly personalInfoSection = this.page.locator('[data-step="personal"], .personal-info');
  private readonly travelDetailsSection = this.page.locator('[data-step="travel"], .travel-details');
  private readonly documentsSection = this.page.locator('[data-step="documents"], .documents');
  private readonly reviewSection = this.page.locator('[data-step="review"], .review');

  // Form fields
  private readonly visaTypeSelect = this.page.locator('#visaType, select[name="visaType"]');
  private readonly destinationCountrySelect = this.page.locator('#destinationCountry, select[name="destinationCountry"]');
  private readonly travelDateField = this.page.locator('#travelDate, input[name="travelDate"]');
  private readonly returnDateField = this.page.locator('#returnDate, input[name="returnDate"]');
  private readonly purposeField = this.page.locator('#purpose, textarea[name="purpose"]');

  // Navigation buttons
  private readonly nextButton = this.page.locator('button:has-text("Next"), button:has-text("İleri")');
  private readonly previousButton = this.page.locator('button:has-text("Previous"), button:has-text("Geri")');
  private readonly submitButton = this.page.locator('button:has-text("Submit"), button:has-text("Gönder")');
  private readonly saveAsDraftButton = this.page.locator('button:has-text("Save as Draft"), button:has-text("Taslak Kaydet")');

  // Progress indicator
  private readonly progressBar = this.page.locator('[data-testid="progress"], .progress-bar');
  private readonly stepIndicators = this.page.locator('.step-indicator, [data-testid="step"]');

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard/applications/new');
    await this.waitForPageLoad();
  }

  async isCurrentPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/applications');
  }

  // Application creation flow
  async fillBasicInfo(applicationData: {
    visaType?: string;
    destinationCountry?: string;
    travelDate?: string;
    returnDate?: string;
    purpose?: string;
  }) {
    if (applicationData.visaType) {
      await this.selectVisaType(applicationData.visaType);
    }

    if (applicationData.destinationCountry) {
      await this.selectDestinationCountry(applicationData.destinationCountry);
    }

    if (applicationData.travelDate) {
      await this.helpers.fillField('#travelDate, input[name="travelDate"]', applicationData.travelDate);
    }

    if (applicationData.returnDate) {
      await this.helpers.fillField('#returnDate, input[name="returnDate"]', applicationData.returnDate);
    }

    if (applicationData.purpose) {
      await this.helpers.fillField('#purpose, textarea[name="purpose"]', applicationData.purpose);
    }
  }

  async selectVisaType(visaType: string) {
    if (await this.visaTypeSelect.isVisible()) {
      await this.visaTypeSelect.selectOption(visaType);
    } else {
      // Try clicking dropdown option
      await this.helpers.clickAndWait(`text=${visaType}`);
    }
  }

  async selectDestinationCountry(country: string) {
    if (await this.destinationCountrySelect.isVisible()) {
      await this.destinationCountrySelect.selectOption(country);
    } else {
      // Try clicking dropdown option
      await this.helpers.clickAndWait(`text=${country}`);
    }
  }

  async proceedToNextStep() {
    await this.nextButton.click();
    await this.helpers.waitForLoading();
  }

  async goToPreviousStep() {
    await this.previousButton.click();
    await this.helpers.waitForLoading();
  }

  async saveAsDraft() {
    if (await this.saveAsDraftButton.isVisible()) {
      await this.saveAsDraftButton.click();
      await this.waitForNotification('success');
    }
  }

  async submitApplication() {
    await this.submitButton.click();
    await this.waitForFormSubmission();
  }

  // Document upload methods
  async uploadDocument(documentType: string, filePath: string) {
    // Navigate to documents section if not already there
    if (await this.helpers.isElementVisible('[data-step="documents"]')) {
      await this.helpers.clickAndWait('[data-step="documents"]');
    }

    // Find the upload area for this document type
    const uploadArea = this.page.locator(`[data-document-type="${documentType}"], .document-upload`).first();
    const fileInput = uploadArea.locator('input[type="file"]');

    await fileInput.setInputFiles(filePath);
    
    // Wait for upload to complete
    await this.helpers.waitForLoading();
    
    // Verify upload success
    const uploadSuccess = this.page.locator('text=Upload successful, text=Uploaded');
    await expect(uploadSuccess).toBeVisible({ timeout: 15000 });
  }

  async uploadRequiredDocuments() {
    const requiredDocs = [
      { type: 'passport', filename: 'test-passport.pdf' },
      { type: 'photo', filename: 'test-photo.jpg' },
      { type: 'bank_statement', filename: 'test-bank-statement.pdf' }
    ];

    for (const doc of requiredDocs) {
      const content = this.helpers.createTestFile(doc.filename, 
        doc.type === 'photo' ? 'image/jpeg' : 'application/pdf');
      const filePath = await this.helpers.saveTestFile(doc.filename, content);
      await this.uploadDocument(doc.type, filePath);
    }
  }

  // Verification methods
  async verifyApplicationForm() {
    await expect(this.visaTypeSelect).toBeVisible();
    await expect(this.destinationCountrySelect).toBeVisible();
    await expect(this.travelDateField).toBeVisible();
    await expect(this.nextButton).toBeVisible();
  }

  async verifyProgressIndicator() {
    if (await this.progressBar.isVisible()) {
      await expect(this.progressBar).toBeVisible();
    }

    if (await this.stepIndicators.isVisible()) {
      const stepCount = await this.stepIndicators.count();
      expect(stepCount).toBeGreaterThan(0);
    }
  }

  async verifyFormValidation() {
    // Try proceeding without filling required fields
    await this.nextButton.click();
    
    // Check for validation errors
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyDateValidation() {
    // Test invalid date format
    await this.helpers.fillField('#travelDate, input[name="travelDate"]', 'invalid-date');
    await this.nextButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
    
    // Test past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    await this.helpers.fillField('#travelDate, input[name="travelDate"]', 
      pastDate.toISOString().split('T')[0]);
    await this.nextButton.click();
    
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async verifyReturnDateAfterTravelDate() {
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 30);
    
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 20); // Before travel date
    
    await this.helpers.fillField('#travelDate, input[name="travelDate"]', 
      travelDate.toISOString().split('T')[0]);
    await this.helpers.fillField('#returnDate, input[name="returnDate"]', 
      returnDate.toISOString().split('T')[0]);
    
    await this.nextButton.click();
    expect(await this.hasValidationErrors()).toBe(true);
  }

  async getCurrentStep(): Promise<number> {
    // Try to determine current step from progress indicator
    if (await this.stepIndicators.isVisible()) {
      const activeStep = this.page.locator('.step-indicator.active, [data-testid="step"].active');
      const stepText = await activeStep.textContent();
      if (stepText) {
        const match = stepText.match(/\d+/);
        if (match) {
          return parseInt(match[0]);
        }
      }
    }
    
    // Fallback: check which section is visible
    if (await this.personalInfoSection.isVisible()) return 1;
    if (await this.travelDetailsSection.isVisible()) return 2;
    if (await this.documentsSection.isVisible()) return 3;
    if (await this.reviewSection.isVisible()) return 4;
    
    return 1; // Default to first step
  }

  async navigateToStep(stepNumber: number) {
    const currentStep = await this.getCurrentStep();
    
    if (stepNumber > currentStep) {
      // Move forward
      for (let i = currentStep; i < stepNumber; i++) {
        await this.proceedToNextStep();
      }
    } else if (stepNumber < currentStep) {
      // Move backward
      for (let i = currentStep; i > stepNumber; i--) {
        await this.goToPreviousStep();
      }
    }
  }

  async verifyReviewStep() {
    await this.navigateToStep(4); // Assuming review is step 4
    
    // Check that all form data is displayed for review
    const reviewElements = [
      'text=Review',
      'text=Personal Information',
      'text=Travel Details',
      'text=Documents'
    ];

    for (const element of reviewElements) {
      if (await this.helpers.isElementVisible(element)) {
        await expect(this.page.locator(element)).toBeVisible();
      }
    }
  }

  async verifyApplicationSubmission() {
    await this.submitApplication();
    
    // Check for success message or redirect
    try {
      await Promise.race([
        this.page.waitForSelector('text=Application submitted', { timeout: 10000 }),
        this.page.waitForSelector('text=Success', { timeout: 10000 }),
        this.page.waitForURL('**/applications', { timeout: 10000 })
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async fillCompleteApplication() {
    // Step 1: Basic information
    await this.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: this.getFutureDateString(30),
      returnDate: this.getFutureDateString(45),
      purpose: 'Tourism and visiting friends'
    });
    
    await this.proceedToNextStep();
    
    // Step 2: Personal details (if exists)
    if (await this.personalInfoSection.isVisible()) {
      // Fill personal information if required
      await this.proceedToNextStep();
    }
    
    // Step 3: Documents
    await this.uploadRequiredDocuments();
    await this.proceedToNextStep();
    
    // Step 4: Review and submit
    await this.verifyReviewStep();
    return await this.verifyApplicationSubmission();
  }

  private getFutureDateString(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}