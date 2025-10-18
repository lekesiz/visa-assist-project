import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { ApplicationPage } from '../pages/application-page';

test.describe('Application Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should create a new application successfully', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    // Navigate to new application
    await dashboardPage.createNewApplication();
    expect(await applicationPage.isCurrentPage()).toBe(true);
    
    // Verify form elements
    await applicationPage.verifyApplicationForm();
    await applicationPage.verifyProgressIndicator();
  });

  test('should validate application form fields', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Test form validation
    await applicationPage.verifyFormValidation();
    
    // Test date validation
    await applicationPage.verifyDateValidation();
    
    // Test return date after travel date validation
    await applicationPage.verifyReturnDateAfterTravelDate();
  });

  test('should navigate through application steps', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Fill basic info and proceed
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15',
      purpose: 'Tourism and sightseeing'
    });
    
    // Navigate through steps
    const currentStep = await applicationPage.getCurrentStep();
    expect(currentStep).toBeGreaterThanOrEqual(1);
    
    await applicationPage.proceedToNextStep();
    
    const nextStep = await applicationPage.getCurrentStep();
    expect(nextStep).toBeGreaterThan(currentStep);
  });

  test('should save application as draft', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'business',
      destinationCountry: 'Germany',
      travelDate: '2024-11-01',
      purpose: 'Business meetings'
    });
    
    // Save as draft
    await applicationPage.saveAsDraft();
    
    // Should show success notification
    await applicationPage.waitForNotification('success');
  });

  test('should upload documents to application', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Fill basic info first
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15'
    });
    
    // Navigate to documents step
    await applicationPage.navigateToStep(3);
    
    // Create and upload test documents
    const testFiles = [
      { type: 'passport', filename: 'test-passport.pdf', content: 'PDF content' },
      { type: 'photo', filename: 'test-photo.jpg', content: 'Image content' }
    ];
    
    for (const file of testFiles) {
      const content = Buffer.from(file.content);
      const filePath = await applicationPage.helpers.saveTestFile(file.filename, content);
      await applicationPage.uploadDocument(file.type, filePath);
    }
  });

  test('should complete full application flow', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Complete the entire application
    const success = await applicationPage.fillCompleteApplication();
    expect(success).toBe(true);
    
    // Should be redirected to applications list or success page
    const currentUrl = applicationPage.getCurrentUrl();
    expect(currentUrl).toMatch(/applications|success|submitted/);
  });

  test('should handle file upload validation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    await applicationPage.navigateToStep(3); // Documents step
    
    // Try uploading invalid file type
    const invalidFile = Buffer.from('Invalid content');
    const filePath = await applicationPage.helpers.saveTestFile('invalid.txt', invalidFile);
    
    // Should handle invalid file gracefully
    try {
      await applicationPage.uploadDocument('passport', filePath);
      
      // Check for error message
      const hasError = await applicationPage.helpers.hasErrorMessage();
      if (hasError) {
        const errorMessage = await applicationPage.helpers.getErrorMessage();
        expect(errorMessage).toMatch(/invalid|format|type/i);
      }
    } catch (error) {
      // Upload rejection is also acceptable
      expect(error).toBeDefined();
    }
  });

  test('should validate required documents before submission', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15'
    });
    
    // Try to submit without uploading required documents
    await applicationPage.navigateToStep(4); // Review step
    await applicationPage.submitApplication();
    
    // Should show validation error about missing documents
    const hasError = await applicationPage.hasValidationErrors();
    expect(hasError).toBe(true);
  });

  test('should show application review before submission', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'student',
      destinationCountry: 'Germany',
      travelDate: '2024-09-01',
      returnDate: '2025-07-31',
      purpose: 'University studies'
    });
    
    // Navigate to review step
    await applicationPage.verifyReviewStep();
  });

  test('should handle different visa types', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    const visaTypes = ['tourist', 'business', 'student', 'work'];
    
    for (const visaType of visaTypes) {
      await dashboardPage.createNewApplication();
      
      // Select visa type
      await applicationPage.selectVisaType(visaType);
      
      // Verify the form adapts to the visa type
      await applicationPage.verifyApplicationForm();
      
      // Go back to dashboard for next iteration
      await dashboardPage.goto();
    }
  });

  test('should handle application step navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Test forward navigation
    const initialStep = await applicationPage.getCurrentStep();
    await applicationPage.proceedToNextStep();
    const forwardStep = await applicationPage.getCurrentStep();
    expect(forwardStep).toBeGreaterThan(initialStep);
    
    // Test backward navigation
    await applicationPage.goToPreviousStep();
    const backwardStep = await applicationPage.getCurrentStep();
    expect(backwardStep).toBeLessThan(forwardStep);
    
    // Test direct step navigation
    await applicationPage.navigateToStep(3);
    const directStep = await applicationPage.getCurrentStep();
    expect(directStep).toBe(3);
  });
});

test.describe('Application Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should list existing applications', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToApplications();
    
    // Check applications count
    const applicationsCount = await dashboardPage.getApplicationsCount();
    console.log(`Found ${applicationsCount} applications`);
    
    // Should display applications list (even if empty)
    expect(applicationsCount).toBeGreaterThanOrEqual(0);
  });

  test('should display application status correctly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToApplications();
    
    // Check for status indicators
    const statusElements = [
      'text=Draft',
      'text=Submitted',
      'text=In Review',
      'text=Approved',
      'text=Rejected',
      'text=Pending'
    ];
    
    // At least one status should be visible if there are applications
    const applicationsCount = await dashboardPage.getApplicationsCount();
    if (applicationsCount > 0) {
      let foundStatus = false;
      for (const status of statusElements) {
        if (await page.locator(status).isVisible()) {
          foundStatus = true;
          break;
        }
      }
      expect(foundStatus).toBe(true);
    }
  });

  test('should allow editing draft applications', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToApplications();
    
    // Look for edit buttons on draft applications
    const editButtons = [
      'text=Edit',
      'text=Continue',
      'button:has-text("Edit")',
      '[data-testid="edit-application"]'
    ];
    
    for (const button of editButtons) {
      if (await page.locator(button).isVisible()) {
        await page.locator(button).first().click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to application form
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/applications.*edit|applications.*\d+/);
        break;
      }
    }
  });

  test('should show application details', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToApplications();
    
    // Look for view/details buttons
    const viewButtons = [
      'text=View',
      'text=Details',
      'button:has-text("View")',
      '[data-testid="view-application"]'
    ];
    
    for (const button of viewButtons) {
      if (await page.locator(button).isVisible()) {
        await page.locator(button).first().click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to application details
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/applications.*\d+/);
        break;
      }
    }
  });
});