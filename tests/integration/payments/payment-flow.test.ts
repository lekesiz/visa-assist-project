import { testHelper } from '../../utils/integration-helpers';
import { POST as CreatePayment } from '../../../app/api/payments/create/route';
import { POST as ConfirmPayment } from '../../../app/api/payments/confirm/route';
import { POST as RefundPayment } from '../../../app/api/payments/refund/route';
import { POST as StripeWebhook } from '../../../app/api/payments/webhooks/stripe/route';

describe('Payment Flow Integration Tests', () => {
  let testUser: any;
  let authSession: any;
  let testApplication: any;

  beforeEach(async () => {
    testUser = await testHelper.createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });

    const loginResult = await testHelper.loginTestUser(testUser.email, testUser.password);
    authSession = loginResult.session;

    testApplication = await testHelper.createTestApplication(testUser.id, {
      type: 'tourist',
      status: 'review_required',
    });
  });

  afterEach(async () => {
    await testHelper.cleanupTestData();
    if (testUser) {
      await testHelper.deleteTestUser(testUser.id);
    }
  });

  describe('POST /api/payments/create', () => {
    it('should create payment intent for valid application', async () => {
      const paymentData = {
        applicationId: testApplication.id,
        amount: 10000, // €100.00 in cents
        currency: 'EUR',
        paymentMethod: 'stripe',
        description: 'Tourist visa application fee',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.payment).toBeDefined();
      expect(responseData.payment.id).toBeDefined();
      expect(responseData.payment.amount).toBe(10000);
      expect(responseData.payment.currency).toBe('EUR');
      expect(responseData.payment.status).toBe('pending');
      expect(responseData.clientSecret).toBeDefined();
      expect(responseData.publishableKey).toBeDefined();
    });

    it('should reject payment creation without authentication', async () => {
      const paymentData = {
        applicationId: testApplication.id,
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Authentication required');
    });

    it('should validate payment amount and currency', async () => {
      const invalidPaymentData = {
        applicationId: testApplication.id,
        amount: -100, // Invalid negative amount
        currency: 'INVALID',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        invalidPaymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    it('should prevent duplicate payments for the same application', async () => {
      // Create first payment
      await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
      });

      const paymentData = {
        applicationId: testApplication.id,
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Payment already exists for this application');
    });

    it('should validate application ownership before creating payment', async () => {
      // Create another user and their application
      const otherUser = await testHelper.createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      });
      const otherApplication = await testHelper.createTestApplication(otherUser.id);

      const paymentData = {
        applicationId: otherApplication.id, // Different user's application
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Access denied');
    });

    it('should calculate correct fees based on visa type', async () => {
      // Create business visa application (higher fee)
      const businessApplication = await testHelper.createTestApplication(testUser.id, {
        type: 'business',
        status: 'review_required',
      });

      const paymentData = {
        applicationId: businessApplication.id,
        amount: 15000, // €150.00 for business visa
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.payment.amount).toBe(15000);
      expect(responseData.payment.metadata.visa_type).toBe('business');
      expect(responseData.payment.metadata.base_fee).toBeDefined();
      expect(responseData.payment.metadata.service_fee).toBeDefined();
    });

    it('should support PayPal payment method', async () => {
      const paymentData = {
        applicationId: testApplication.id,
        amount: 10000,
        currency: 'EUR',
        paymentMethod: 'paypal',
        description: 'Tourist visa application fee',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.payment.provider).toBe('paypal');
      expect(responseData.paypalOrderId).toBeDefined();
      expect(responseData.approvalUrl).toBeDefined();
    });
  });

  describe('POST /api/payments/confirm', () => {
    let testPayment: any;

    beforeEach(async () => {
      testPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
        provider: 'stripe',
        provider_payment_id: 'pi_test_123',
      });
    });

    it('should confirm successful Stripe payment', async () => {
      const confirmData = {
        paymentId: testPayment.id,
        paymentIntentId: testPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.payment.status).toBe('completed');
      expect(responseData.payment.confirmed_at).toBeDefined();
      expect(responseData.receiptUrl).toBeDefined();
    });

    it('should confirm successful PayPal payment', async () => {
      // Update payment to PayPal
      await global.testUtils.supabase
        .from('payments')
        .update({
          provider: 'paypal',
          provider_payment_id: 'paypal_order_123',
        })
        .eq('id', testPayment.id);

      const confirmData = {
        paymentId: testPayment.id,
        paypalOrderId: 'paypal_order_123',
        provider: 'paypal',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.payment.status).toBe('completed');
    });

    it('should update application status after successful payment', async () => {
      const confirmData = {
        paymentId: testPayment.id,
        paymentIntentId: testPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      expect(response.status).toBe(200);

      // Check application status was updated
      const { data: updatedApplication } = await global.testUtils.supabase
        .from('applications')
        .select('status, payment_status')
        .eq('id', testApplication.id)
        .single();

      expect(updatedApplication.payment_status).toBe('paid');
      expect(updatedApplication.status).toBe('paid');
    });

    it('should send payment confirmation email', async () => {
      const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
      jest.doMock('../../../lib/email/sendgrid', () => ({
        sendEmail: sendEmailMock,
      }));

      const confirmData = {
        paymentId: testPayment.id,
        paymentIntentId: testPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      expect(response.status).toBe(200);

      // Verify confirmation email was sent
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: testUser.email,
        subject: 'Payment Confirmation',
        templateId: 'payment_confirmation',
        templateData: {
          firstName: testUser.firstName,
          amount: testPayment.amount,
          currency: testPayment.currency,
          paymentId: testPayment.id,
          receiptUrl: expect.any(String),
        },
      });
    });

    it('should handle failed payment confirmation', async () => {
      // Mock Stripe to return failed payment
      jest.doMock('../../../lib/payments/stripe', () => ({
        confirmPaymentIntent: jest.fn().mockResolvedValue({
          status: 'payment_failed',
          last_payment_error: {
            message: 'Your card was declined.',
          },
        }),
      }));

      const confirmData = {
        paymentId: testPayment.id,
        paymentIntentId: testPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Payment failed');
      expect(responseData.paymentError).toBeDefined();
    });

    it('should prevent confirming already confirmed payment', async () => {
      // First confirmation
      const confirmData = {
        paymentId: testPayment.id,
        paymentIntentId: testPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request1 = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response1 = await ConfirmPayment(request1);
      expect(response1.status).toBe(200);

      // Second confirmation attempt
      const request2 = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response2 = await ConfirmPayment(request2);
      const responseData2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(responseData2.success).toBe(false);
      expect(responseData2.error).toContain('Payment already confirmed');
    });
  });

  describe('POST /api/payments/refund', () => {
    let testPayment: any;

    beforeEach(async () => {
      testPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'completed',
        provider: 'stripe',
        provider_payment_id: 'pi_test_123',
        confirmed_at: new Date().toISOString(),
      });
    });

    it('should process refund for completed payment', async () => {
      const refundData = {
        paymentId: testPayment.id,
        reason: 'customer_request',
        amount: testPayment.amount, // Full refund
        description: 'Customer requested cancellation',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.refund).toBeDefined();
      expect(responseData.refund.amount).toBe(testPayment.amount);
      expect(responseData.refund.status).toBe('succeeded');
      expect(responseData.refund.id).toBeDefined();
    });

    it('should process partial refund', async () => {
      const partialAmount = Math.floor(testPayment.amount * 0.5); // 50% refund
      
      const refundData = {
        paymentId: testPayment.id,
        reason: 'processing_delay',
        amount: partialAmount,
        description: 'Partial refund for processing delay',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.refund.amount).toBe(partialAmount);
    });

    it('should reject refund for non-completed payment', async () => {
      // Create pending payment
      const pendingPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
      });

      const refundData = {
        paymentId: pendingPayment.id,
        reason: 'customer_request',
        amount: pendingPayment.amount,
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Cannot refund payment that is not completed');
    });

    it('should validate refund amount', async () => {
      const refundData = {
        paymentId: testPayment.id,
        reason: 'customer_request',
        amount: testPayment.amount + 1000, // More than original payment
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Refund amount cannot exceed original payment');
    });

    it('should update application status after refund', async () => {
      const refundData = {
        paymentId: testPayment.id,
        reason: 'customer_request',
        amount: testPayment.amount,
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      expect(response.status).toBe(200);

      // Check application status was updated
      const { data: updatedApplication } = await global.testUtils.supabase
        .from('applications')
        .select('status, payment_status')
        .eq('id', testApplication.id)
        .single();

      expect(updatedApplication.payment_status).toBe('refunded');
      expect(updatedApplication.status).toBe('cancelled');
    });

    it('should send refund notification email', async () => {
      const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
      jest.doMock('../../../lib/email/sendgrid', () => ({
        sendEmail: sendEmailMock,
      }));

      const refundData = {
        paymentId: testPayment.id,
        reason: 'customer_request',
        amount: testPayment.amount,
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/refund',
        refundData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await RefundPayment(request);
      expect(response.status).toBe(200);

      // Verify refund email was sent
      expect(sendEmailMock).toHaveBeenCalledWith({
        to: testUser.email,
        subject: 'Refund Processed',
        templateId: 'refund_notification',
        templateData: {
          firstName: testUser.firstName,
          amount: testPayment.amount,
          currency: testPayment.currency,
          refundId: expect.any(String),
          reason: refundData.reason,
        },
      });
    });
  });

  describe('POST /api/payments/webhooks/stripe', () => {
    it('should handle successful payment webhook', async () => {
      const testPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
        provider: 'stripe',
        provider_payment_id: 'pi_test_webhook_123',
      });

      const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook_123',
            status: 'succeeded',
            amount: testPayment.amount,
            currency: testPayment.currency,
          },
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/webhooks/stripe',
        webhookPayload,
        {
          'stripe-signature': 'test-signature',
        }
      );

      const response = await StripeWebhook(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify payment was updated
      const { data: updatedPayment } = await global.testUtils.supabase
        .from('payments')
        .select('status')
        .eq('provider_payment_id', 'pi_test_webhook_123')
        .single();

      expect(updatedPayment.status).toBe('completed');
    });

    it('should handle failed payment webhook', async () => {
      const testPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
        provider: 'stripe',
        provider_payment_id: 'pi_test_webhook_failed',
      });

      const webhookPayload = {
        id: 'evt_test_webhook_failed',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_webhook_failed',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined.',
            },
          },
        },
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/webhooks/stripe',
        webhookPayload,
        {
          'stripe-signature': 'test-signature',
        }
      );

      const response = await StripeWebhook(request);
      expect(response.status).toBe(200);

      // Verify payment was updated to failed
      const { data: updatedPayment } = await global.testUtils.supabase
        .from('payments')
        .select('status')
        .eq('provider_payment_id', 'pi_test_webhook_failed')
        .single();

      expect(updatedPayment.status).toBe('failed');
    });

    it('should verify webhook signature', async () => {
      const webhookPayload = {
        id: 'evt_test_invalid_signature',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {},
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/webhooks/stripe',
        webhookPayload,
        {
          'stripe-signature': 'invalid-signature',
        }
      );

      const response = await StripeWebhook(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid webhook signature');
    });
  });

  describe('Payment Security and Validation', () => {
    it('should validate payment amounts match application fees', async () => {
      const paymentData = {
        applicationId: testApplication.id,
        amount: 1000, // Too low for tourist visa
        currency: 'EUR',
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Payment amount does not match application fee');
    });

    it('should prevent payment manipulation through currency arbitrage', async () => {
      const paymentData = {
        applicationId: testApplication.id,
        amount: 10000, // €100 but claiming it's USD
        currency: 'USD', // Different from application currency
        paymentMethod: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/create',
        paymentData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await CreatePayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Currency mismatch');
    });

    it('should handle rate limiting for payment attempts', async () => {
      // Attempt multiple payments quickly
      const promises = Array.from({ length: 10 }, () => {
        const paymentData = {
          applicationId: testApplication.id,
          amount: 10000,
          currency: 'EUR',
          paymentMethod: 'stripe',
        };

        return testHelper.createMockRequest(
          'POST',
          '/api/payments/create',
          paymentData,
          { Authorization: `Bearer ${authSession.access_token}` }
        );
      });

      const responses = await Promise.all(
        promises.map(request => CreatePayment(request))
      );

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        response => response.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate payment timeouts', async () => {
      const expiredPayment = await testHelper.createTestPayment(testUser.id, testApplication.id, {
        status: 'pending',
        provider: 'stripe',
        provider_payment_id: 'pi_test_expired',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      });

      const confirmData = {
        paymentId: expiredPayment.id,
        paymentIntentId: expiredPayment.provider_payment_id,
        provider: 'stripe',
      };

      const request = testHelper.createMockRequest(
        'POST',
        '/api/payments/confirm',
        confirmData,
        {
          Authorization: `Bearer ${authSession.access_token}`,
        }
      );

      const response = await ConfirmPayment(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Payment session has expired');
    });
  });
});