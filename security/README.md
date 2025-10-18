# Security Tools and Documentation

This directory contains comprehensive security tools and documentation for the Visa Assist project.

## 📁 Directory Contents

### Security Analysis Tools
- **`security-scanner.js`** - Comprehensive code security scanner
- **`dependency-checker.js`** - Dependency vulnerability and license checker  
- **`api-security-checker.js`** - API endpoint security analyzer

### Security Implementation
- **`security-fixes.ts`** - Reference implementations for security fixes
- **`SECURITY_AUDIT_REPORT.md`** - Complete security audit report with findings and recommendations

### Generated Reports
- **`security-report.json`** - Detailed security scan results
- **`dependency-report.json`** - Dependency analysis results
- **`api-security-report.json`** - API security assessment results

## 🔍 Running Security Scans

### Prerequisites
Ensure you have Node.js installed and all project dependencies:
```bash
npm install
```

### Individual Scans

#### 1. Comprehensive Security Scan
Scans all source code for security vulnerabilities, sensitive data exposure, and dangerous patterns:
```bash
node security/security-scanner.js
```

**What it detects:**
- Hardcoded secrets and API keys
- XSS vulnerabilities (dangerouslySetInnerHTML, eval, etc.)
- SQL injection patterns
- Command injection risks
- Weak cryptographic algorithms
- Path traversal vulnerabilities
- Insecure configurations

#### 2. Dependency Security Check
Analyzes project dependencies for known vulnerabilities and license issues:
```bash
node security/dependency-checker.js
```

**What it checks:**
- Known vulnerabilities in dependencies
- Outdated packages
- License compliance issues
- Package integrity verification

#### 3. API Security Analysis
Examines API routes for security best practices:
```bash
node security/api-security-checker.js
```

**What it validates:**
- Authentication implementation
- Input validation coverage
- Rate limiting presence
- Error handling security
- CORS configuration
- Security headers

### Automated Security Suite
Create a script to run all security checks:

```bash
# Add to package.json scripts
"scripts": {
  "security:scan": "npm run security:code && npm run security:deps && npm run security:api",
  "security:code": "node security/security-scanner.js",
  "security:deps": "node security/dependency-checker.js", 
  "security:api": "node security/api-security-checker.js"
}
```

Then run:
```bash
npm run security:scan
```

## 🛠️ Security Fixes Implementation

### Quick Start
The `security-fixes.ts` file contains ready-to-use implementations for all identified security issues:

```typescript
import {
  withValidation,
  withRateLimit,
  withSecurityHeaders,
  verifyStripeWebhook,
  createPaymentSchema
} from './security/security-fixes'

// Example: Secure API route
export const POST = withSecurityHeaders(
  withRateLimit('api')(
    withValidation(createPaymentSchema)(
      async (req, validatedData) => {
        // Your secure API logic here
        return NextResponse.json({ success: true })
      }
    )
  )
)
```

### Critical Fixes Required

#### 1. Webhook Authentication
**File:** `app/api/payments/webhooks/stripe/route.ts`
```typescript
import { verifyStripeWebhook } from '@/security/security-fixes'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature || !verifyStripeWebhook(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process webhook...
}
```

#### 2. Input Validation
**Apply to all API routes:**
```typescript
import { withValidation, analyzeDocumentSchema } from '@/security/security-fixes'

export const POST = withValidation(analyzeDocumentSchema)(
  async (req, validatedData) => {
    // validatedData is now type-safe and validated
    const { documentId, documentType } = validatedData
    // ... rest of your logic
  }
)
```

#### 3. Rate Limiting
**Update middleware.ts:**
```typescript
import { rateLimit, rateLimitConfigs } from '@/security/security-fixes'

export async function middleware(request: NextRequest) {
  // Apply rate limiting based on route
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const result = await rateLimit(request, rateLimitConfigs.auth)
    if (!result.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
  }
  
  // ... existing middleware logic
}
```

## 📊 Security Metrics Dashboard

### Current Status
Run the security scans to get current metrics:

```bash
npm run security:scan > security-results.txt
```

### Key Metrics to Monitor
- **Critical Vulnerabilities:** 0 (Target)
- **High Severity Issues:** < 5 (Target) 
- **Input Validation Coverage:** > 95% (Target)
- **API Authentication Coverage:** 100% (Required)
- **Dependency Vulnerabilities:** 0 (Target)

### Monitoring Commands
```bash
# Quick security check (exit code indicates issues)
node security/security-scanner.js --ci

# Dependency audit
npm audit --audit-level high

# Check for outdated packages
npm outdated
```

## 🔒 Security Best Practices

### Code Review Checklist
Before merging any PR, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] All user inputs are validated with Zod schemas
- [ ] Authentication is properly implemented
- [ ] Rate limiting is applied to public endpoints
- [ ] Error messages don't leak sensitive information
- [ ] File uploads are properly validated
- [ ] Database queries use parameterized statements

### Environment Security
- [ ] All sensitive data in environment variables
- [ ] Different secrets for staging/production
- [ ] Regular secret rotation
- [ ] Secure secret storage (not in code repositories)

### Deployment Security
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Content Security Policy implemented
- [ ] Regular security updates applied

## 🚨 Incident Response

### Security Issue Reporting
1. **Internal Issues:** Create GitHub issue with "security" label
2. **External Reports:** security@visaassist.ai
3. **Critical Issues:** Immediate team notification

### Response Procedure
1. **Assess Impact** - Determine severity and scope
2. **Contain Issue** - Implement immediate mitigations
3. **Fix Root Cause** - Develop and test proper fix
4. **Deploy Fix** - Coordinated deployment
5. **Post-Incident** - Review and improve processes

## 📈 Continuous Security

### Automated Monitoring
Set up automated security checks in CI/CD:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run security:scan
      - run: npm audit --audit-level high
```

### Regular Reviews
- **Weekly:** Dependency updates and vulnerability checks
- **Monthly:** Full security scan and metrics review
- **Quarterly:** External security assessment
- **Annually:** Comprehensive penetration testing

## 📚 Additional Resources

### Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

### Tools and Libraries
- [Zod](https://zod.dev/) - TypeScript schema validation
- [Helmet](https://helmetjs.github.io/) - Security headers
- [Rate Limiter](https://github.com/animir/node-rate-limiter-flexible)

### Contact Information
- **Security Team:** security@visaassist.ai
- **Documentation:** [Internal Wiki](link-to-internal-docs)
- **Emergency Contact:** +1-xxx-xxx-xxxx

---

**Last Updated:** January 18, 2025  
**Version:** 1.0  
**Next Review:** February 18, 2025