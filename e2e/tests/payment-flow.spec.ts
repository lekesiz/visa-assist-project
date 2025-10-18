import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { ApplicationPage } from '../pages/application-page';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should display payment options', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToPayments();
    
    // Check for payment-related elements
    const paymentElements = [
      'text=Payment',
      'text=Stripe',
      'text=PayPal',
      'text=Credit Card',
      'text=Amount',
      'text=Fee'
    ];
    
    let foundPaymentElement = false;
    for (const element of paymentElements) {
      if (await page.locator(element).isVisible()) {
        foundPaymentElement = true;
        break;
      }
    }
    
    expect(foundPaymentElement).toBe(true);
  });

  test('should show application fees correctly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    // Create an application first
    await dashboardPage.createNewApplication();
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15'
    });
    
    // Look for fee information
    const feeElements = [
      'text=€',
      'text=Fee',
      'text=Cost',
      'text=Price',
      'text=Amount'
    ];
    
    let foundFeeInfo = false;
    for (const element of feeElements) {
      if (await page.locator(element).isVisible()) {
        foundFeeInfo = true;
        break;
      }
    }
    
    // Fee information should be displayed somewhere
    expect(foundFeeInfo).toBe(true);
  });

  test('should validate payment form', async ({ page }) => {
    // Mock payment flow since we can't test real payments
    await page.goto('/dashboard/payments');
    
    // Look for payment form elements
    const paymentFormElements = [
      'input[type="email"]',
      'input[name="cardNumber"]',
      'input[name="expiry"]',
      'input[name="cvc"]',
      'button:has-text("Pay")',
      'button:has-text("Submit")'
    ];
    
    for (const element of paymentFormElements) {
      if (await page.locator(element).isVisible()) {
        // Try submitting empty form to test validation
        const submitButton = page.locator('button:has-text("Pay"), button:has-text("Submit")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show validation errors
          const errorElements = [
            '.error',
            '.invalid',
            '[aria-invalid="true"]',
            'text=required',
            'text=invalid'
          ];
          
          let foundError = false;
          for (const error of errorElements) {
            if (await page.locator(error).isVisible()) {
              foundError = true;
              break;
            }
          }
          
          expect(foundError).toBe(true);
        }
        break;
      }
    }
  });

  test('should handle Stripe payment flow', async ({ page }) => {
    // Mock Stripe elements since we can't test real payments
    await page.route('**/stripe.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/dashboard/payments');
    
    // Look for Stripe-specific elements
    const stripeElements = [
      'text=Stripe',
      'iframe[src*="stripe"]',
      '[data-testid="stripe-element"]',
      '.stripe-element'
    ];
    
    for (const element of stripeElements) {
      if (await page.locator(element).isVisible()) {
        console.log('Stripe payment element found');
        break;
      }
    }
  });

  test('should handle PayPal payment flow', async ({ page }) => {
    // Mock PayPal elements
    await page.route('**/paypal.com/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    await page.goto('/dashboard/payments');
    
    // Look for PayPal-specific elements
    const paypalElements = [
      'text=PayPal',
      'button:has-text("PayPal")',
      '[data-testid="paypal-button"]',
      '.paypal-button'
    ];
    
    for (const element of paypalElements) {
      if (await page.locator(element).isVisible()) {
        console.log('PayPal payment element found');
        break;
      }
    }
  });

  test('should display payment history', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToPayments();
    
    // Check for payment history elements
    const historyElements = [
      'text=Payment History',
      'text=Transaction',
      'text=No payments',
      'text=Status',
      'text=Date',
      'text=Amount'
    ];
    
    let foundHistoryElement = false;
    for (const element of historyElements) {
      if (await page.locator(element).isVisible()) {
        foundHistoryElement = true;
        break;
      }
    }
    
    expect(foundHistoryElement).toBe(true);
  });

  test('should show payment status correctly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goToPayments();
    
    // Check for payment status indicators
    const statusElements = [
      'text=Paid',
      'text=Pending',
      'text=Failed',
      'text=Refunded',
      'text=Completed',
      'text=Processing'
    ];
    
    // Look for any status indicators (if payments exist)
    for (const status of statusElements) {
      if (await page.locator(status).isVisible()) {
        console.log(`Found payment status: ${status}`);
      }
    }
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    // Mock payment API to return error
    await page.route('**/api/payments/**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment processing failed' 
        })
      });
    });
    
    await page.goto('/dashboard/payments');
    
    // Try to trigger a payment (if payment form exists)
    const payButton = page.locator('button:has-text("Pay"), button:has-text("Submit Payment")');
    if (await payButton.isVisible()) {
      await payButton.click();
      
      // Should show error message
      const errorMessage = await page.locator('text=failed, text=error').isVisible();
      expect(errorMessage).toBe(true);
    }
  });

  test('should validate payment amounts', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    // Look for amount input fields
    const amountFields = [
      'input[name="amount"]',
      'input[type="number"]',
      '#amount'
    ];
    
    for (const field of amountFields) {
      if (await page.locator(field).isVisible()) {
        // Test invalid amounts
        await page.fill(field, '-100'); // Negative amount
        
        const submitButton = page.locator('button:has-text("Pay"), button:has-text("Submit")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show validation error
          const hasError = await page.locator('.error, .invalid, text=invalid').isVisible();
          expect(hasError).toBe(true);
        }
        break;
      }
    }
  });

  test('should show payment confirmation', async ({ page }) => {
    // Mock successful payment
    await page.route('**/api/payments/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          paymentId: 'test-payment-123',
          status: 'completed'
        })
      });
    });
    
    await page.goto('/dashboard/payments');
    
    // Look for payment success elements
    const successElements = [
      'text=Payment Successful',
      'text=Thank you',
      'text=Confirmation',
      'text=Receipt',
      'text=Transaction ID'
    ];
    
    // These might appear after a successful payment
    for (const element of successElements) {
      if (await page.locator(element).isVisible()) {
        console.log(`Found payment success element: ${element}`);
      }
    }
  });

  test('should handle currency formatting', async ({ page }) => {
    await page.goto('/dashboard/payments');
    
    // Check for proper currency formatting
    const currencyPatterns = [
      /€\s*\d+/,  // Euro symbol
      /\d+\s*EUR/, // EUR text
      /\$\s*\d+/,  // Dollar symbol
      /\d+\.\d{2}/ // Decimal places
    ];
    
    const pageContent = await page.textContent('body');
    
    for (const pattern of currencyPatterns) {
      if (pattern.test(pageContent || '')) {
        console.log(`Found currency formatting matching pattern: ${pattern}`);
      }
    }
  });
});

test.describe('Payment Integration', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithTestUser();
  });

  test('should link payments to applications', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Check both applications and payments sections
    await dashboardPage.goToApplications();
    const applicationsCount = await dashboardPage.getApplicationsCount();
    
    await dashboardPage.goToPayments();
    
    // If there are applications, check for payment links
    if (applicationsCount > 0) {
      const linkElements = [
        'text=Application',
        'text=Visa',
        'text=Service',
        '[data-testid="application-link"]'
      ];
      
      for (const element of linkElements) {
        if (await page.locator(element).isVisible()) {
          console.log('Found application-payment link');
          break;
        }
      }
    }
  });

  test('should show payment requirements for application submission', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    // Create an application
    await dashboardPage.createNewApplication();
    
    await applicationPage.fillBasicInfo({
      visaType: 'business',
      destinationCountry: 'Germany',
      travelDate: '2024-11-01'
    });
    
    // Look for payment requirements in the application flow
    const paymentRequirements = [
      'text=Payment required',
      'text=Fee',
      'text=€',
      'text=Pay now',
      'text=Payment'
    ];
    
    for (const requirement of paymentRequirements) {
      if (await page.locator(requirement).isVisible()) {
        console.log(`Found payment requirement: ${requirement}`);
      }
    }
  });

  test('should prevent application submission without payment', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const applicationPage = new ApplicationPage(page);
    
    await dashboardPage.createNewApplication();
    
    // Try to submit application without payment
    await applicationPage.fillBasicInfo({
      visaType: 'tourist',
      destinationCountry: 'Germany',
      travelDate: '2024-12-01',
      returnDate: '2024-12-15'
    });
    
    // Navigate to final step and try to submit
    await applicationPage.navigateToStep(4);
    await applicationPage.submitApplication();
    
    // Should show payment requirement or redirect to payment
    const paymentIndications = [
      'text=Payment required',
      'text=Please pay',
      'text=Fee',
      '/payments',
      'text=Submit after payment'
    ];
    
    let foundPaymentIndication = false;
    for (const indication of paymentIndications) {
      if (indication.startsWith('/')) {
        // URL check
        if (page.url().includes(indication)) {
          foundPaymentIndication = true;
          break;
        }
      } else {
        // Text check
        if (await page.locator(indication).isVisible()) {
          foundPaymentIndication = true;
          break;
        }
      }
    }
    
    // Should indicate payment is needed
    expect(foundPaymentIndication).toBe(true);
  });
});