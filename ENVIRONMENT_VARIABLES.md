# Environment Variables Configuration Guide

This document provides comprehensive information about configuring environment variables for the Visa Assist AI application across different environments.

## Overview

The application supports three main environments:
- **Development** (`.env.local`)
- **Staging** (`.env.staging.example`)
- **Production** (`.env.production.example`)

## Required Environment Variables

### Database Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ | `eyJhbGciOiJIUzI1NiIs...` |

### AI Provider Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | ✅ | `sk-proj-abc123...` |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | ✅ | `sk-ant-api03-abc123...` |
| `GOOGLE_AI_KEY` | Google AI API key | ⚠️ | `AIzaSyAbc123...` |

### Payment Provider Configuration

#### Stripe
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ | `sk_test_abc123...` (test) / `sk_live_abc123...` (prod) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ | `whsec_abc123...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ | `pk_test_abc123...` (test) / `pk_live_abc123...` (prod) |

#### PayPal
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PAYPAL_CLIENT_ID` | PayPal client ID | ✅ | `AYabc123...` |
| `PAYPAL_SECRET` | PayPal secret | ✅ | `ELabc123...` |
| `PAYPAL_MODE` | PayPal environment | ✅ | `sandbox` / `live` |

### Email Service Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | ✅ | `SG.abc123...` |
| `EMAIL_FROM` | Default sender email | ✅ | `noreply@visaassist.ai` |
| `EMAIL_REPLY_TO` | Reply-to email | ✅ | `support@visaassist.ai` |
| `EMAIL_ADMIN` | Admin notification email | ✅ | `admin@visaassist.ai` |

### File Storage Configuration (AWS S3)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AWS_S3_BUCKET` | S3 bucket name | ✅ | `visa-assist-documents` |
| `AWS_ACCESS_KEY_ID` | AWS access key ID | ✅ | `AKIA123...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | ✅ | `abc123...` |
| `AWS_REGION` | AWS region | ✅ | `eu-central-1` |
| `AWS_CLOUDFRONT_DOMAIN` | CloudFront domain (optional) | ❌ | `d123.cloudfront.net` |

### Security Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXTAUTH_SECRET` | NextAuth.js secret (32+ chars) | ✅ | `your-super-secure-secret...` |
| `NEXTAUTH_URL` | Application base URL | ✅ | `https://visaassist.ai` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ | `your-jwt-secret...` |
| `ENCRYPTION_KEY` | Data encryption key (32 chars) | ✅ | `your32characterencryptionkey123` |

### External API Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `ARBEITSAGENTUR_API_KEY` | German job market API | ⚠️ | `abc123...` |
| `INDEED_API_KEY` | Indeed job search API | ⚠️ | `abc123...` |
| `STEPSTONE_API_KEY` | StepStone job search API | ⚠️ | `abc123...` |

### Integration Configuration

#### Calendar Integrations
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GOOGLE_CLIENT_ID` | Google Calendar OAuth ID | ⚠️ | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth secret | ⚠️ | `GOCSPX-abc123...` |
| `MICROSOFT_CLIENT_ID` | Microsoft Calendar OAuth ID | ⚠️ | `abc123-def456...` |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Calendar OAuth secret | ⚠️ | `abc123...` |

#### E-Signature Integration
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DOCUSIGN_INTEGRATION_KEY` | DocuSign integration key | ⚠️ | `abc123-def456...` |
| `DOCUSIGN_USER_ID` | DocuSign user ID | ⚠️ | `abc123-def456...` |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account ID | ⚠️ | `abc123-def456...` |

### Monitoring & Analytics

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SENTRY_DSN` | Sentry error tracking DSN | ⚠️ | `https://abc123@sentry.io/123` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | ⚠️ | `G-ABC123DEF` |
| `NEXT_PUBLIC_HOTJAR_ID` | Hotjar tracking ID | ❌ | `123456` |
| `NEXT_PUBLIC_INTERCOM_APP_ID` | Intercom app ID | ❌ | `abc123` |

## Environment-Specific Setup

### Development Environment

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in required variables for local development
3. Use test/sandbox credentials for payment providers
4. Point to development Supabase project

### Staging Environment

1. Use `.env.staging.example` as reference
2. Configure staging-specific resources:
   - Separate Supabase project
   - Test payment credentials
   - Staging email templates
   - Debug logging enabled

### Production Environment

1. Use `.env.production.example` as reference
2. Configure production resources:
   - Production Supabase project
   - Live payment credentials
   - Production email settings
   - Error monitoring enabled

## Vercel Deployment Configuration

### Setting Environment Variables in Vercel

1. **Via Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add each variable with appropriate environment scope

2. **Via Vercel CLI:**
   ```bash
   # Add production variable
   vercel env add OPENAI_API_KEY production
   
   # Add staging variable
   vercel env add OPENAI_API_KEY preview
   
   # Add development variable
   vercel env add OPENAI_API_KEY development
   ```

3. **Environment-specific variables:**
   - **Production**: `production` environment
   - **Staging**: `preview` environment (preview deployments)
   - **Development**: `development` environment

### Bulk Environment Variable Setup

Use the provided deployment scripts to set up environment variables in bulk:

```bash
# Set up staging environment
npm run deploy:staging:env

# Set up production environment
npm run deploy:production:env
```

## Security Best Practices

### 1. Environment Variable Security
- ✅ Never commit actual `.env` files to version control
- ✅ Use different keys for different environments
- ✅ Rotate keys regularly (quarterly recommended)
- ✅ Use least-privilege principle for API keys
- ✅ Monitor key usage and set up alerts

### 2. Key Management
- ✅ Store sensitive keys in secure password managers
- ✅ Use environment-specific key prefixes
- ✅ Document key purposes and renewal dates
- ✅ Set up key rotation schedules

### 3. Access Control
- ✅ Limit team access to production keys
- ✅ Use separate AWS IAM users for different environments
- ✅ Enable MFA for service accounts
- ✅ Audit key access regularly

## Validation and Testing

### Environment Variable Validation

The application includes runtime validation for critical environment variables:

```typescript
// lib/env-validation.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'NEXTAUTH_SECRET'
];
```

### Testing Environment Variables

```bash
# Test environment variable loading
npm run test:env

# Validate required variables
npm run validate:env

# Check environment-specific configuration
npm run check:env:staging
npm run check:env:production
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Check Vercel dashboard for missing variables
   - Verify variable names match exactly (case-sensitive)
   - Ensure variables are set for correct environment

2. **Invalid API Keys**
   - Verify key format and validity
   - Check key permissions and scopes
   - Ensure keys haven't expired

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check database connection limits
   - Ensure RLS policies are configured

4. **Payment Integration Issues**
   - Verify Stripe/PayPal mode settings
   - Check webhook endpoint configuration
   - Ensure test vs. live key consistency

### Debug Commands

```bash
# Check environment variable loading
npm run debug:env

# Test database connection
npm run test:db

# Validate API keys
npm run validate:keys

# Test payment integrations
npm run test:payments
```

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/local-development)

## Support

For environment configuration issues:
1. Check this documentation first
2. Review Vercel deployment logs
3. Contact the development team
4. Create an issue in the project repository