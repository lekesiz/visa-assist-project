# Visa Assist AI - Comprehensive Deployment Guide

This guide provides step-by-step instructions for deploying the Visa Assist AI application to Vercel across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)
9. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Tools

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** (latest version)
- **Vercel CLI** (latest version)

### Required Accounts

- **Vercel Account** with project access
- **Supabase Account** with database projects
- **OpenAI Account** with API access
- **Anthropic Account** with Claude API access
- **Stripe Account** (for payments)
- **SendGrid Account** (for emails)
- **AWS Account** (for file storage)

### Installation Commands

```bash
# Install Node.js dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel

# Install other global tools
npm install -g @supabase/cli
```

## Environment Setup

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-org/visa-assist-project.git
cd visa-assist-project

# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local
```

### 2. Configure Environment Variables

#### Development Environment

1. Copy `.env.example` to `.env.local`
2. Fill in the development-specific values:

```bash
# Database (Development/Local)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# AI Providers (Development keys)
OPENAI_API_KEY=sk-proj-your-dev-openai-key
ANTHROPIC_API_KEY=sk-ant-your-dev-anthropic-key

# Payments (Test keys)
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-test-key

# Other required variables...
```

#### Staging Environment

1. Copy `.env.staging.example` to `.env.staging`
2. Configure staging-specific values
3. Use the setup script:

```bash
npm run deploy:env:staging
```

#### Production Environment

1. Copy `.env.production.example` to `.env.production`
2. Configure production values (use live keys)
3. Use the setup script:

```bash
npm run deploy:env:production
```

### 3. Vercel Project Setup

```bash
# Login to Vercel
vercel login

# Link to existing project or create new one
vercel link

# Or create a new project
vercel --confirm
```

## Local Development

### Start Development Server

```bash
# Start the development server
npm run dev

# The application will be available at http://localhost:3000
```

### Run Tests Before Deployment

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:components
npm run test:integration
npm run test:e2e

# Run linting and type checking
npm run lint
npm run type-check
```

### Build Locally

```bash
# Build the application
npm run build

# Start production server locally
npm start
```

## Staging Deployment

### Automated Staging Deployment

Use the provided deployment script for a complete staging deployment:

```bash
# Run the staging deployment script
npm run deploy:staging

# Or run the script directly
./scripts/deploy-staging.sh
```

### Manual Staging Deployment

If you prefer manual control:

```bash
# 1. Ensure you're on the correct branch
git checkout staging  # or your staging branch

# 2. Run tests
npm run test
npm run lint
npm run type-check

# 3. Build the application
npm run build

# 4. Set up staging environment variables
npm run deploy:env:staging

# 5. Deploy to Vercel (preview environment)
vercel --prod=false

# 6. Assign to staging domain (if configured)
vercel alias your-deployment-url staging.visaassist.ai
```

### Staging Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Third-party integrations tested
- [ ] Performance metrics within acceptable range
- [ ] Security headers properly configured
- [ ] SSL certificate valid

### Staging Verification

After deployment, verify these endpoints:

```bash
# Health check
curl https://staging.visaassist.ai/api/health

# Homepage
curl https://staging.visaassist.ai

# Authentication
curl https://staging.visaassist.ai/api/auth/session

# API functionality
curl https://staging.visaassist.ai/api/applications
```

## Production Deployment

### Pre-Production Checklist

- [ ] All staging tests passed
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup strategy in place
- [ ] Rollback plan prepared
- [ ] Team notification sent
- [ ] Maintenance window scheduled (if needed)

### Automated Production Deployment

Use the production deployment script:

```bash
# Run the production deployment script
npm run deploy:production

# Or run the script directly
./scripts/deploy-production.sh
```

The script will:
1. Verify you're on the main branch
2. Check for uncommitted changes
3. Run comprehensive tests
4. Build with production optimizations
5. Set environment variables
6. Create deployment backup
7. Deploy to production
8. Run health checks
9. Tag the release
10. Send notifications

### Manual Production Deployment

For manual control over the production deployment:

```bash
# 1. Ensure you're on the main branch
git checkout main
git pull origin main

# 2. Verify no uncommitted changes
git status

# 3. Run comprehensive test suite
npm run test
npm run test:integration
npm run test:e2e
npm run lint
npm run type-check

# 4. Build with production optimizations
NODE_ENV=production npm run build

# 5. Set up production environment variables
npm run deploy:env:production

# 6. Create backup
# (Backup current deployment info and environment)

# 7. Deploy to production
vercel --prod

# 8. Verify deployment
curl https://visaassist.ai/api/health

# 9. Tag the release
git tag -a v$(date +%Y.%m.%d-%H%M%S) -m "Production release"
git push origin --tags
```

### Production Deployment Verification

After production deployment:

1. **Health Checks**
   ```bash
   curl https://visaassist.ai/api/health
   curl https://visaassist.ai
   ```

2. **SSL Certificate**
   ```bash
   openssl s_client -connect visaassist.ai:443 -servername visaassist.ai
   ```

3. **Performance Test**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Monitor response times

4. **Functionality Test**
   - User registration
   - Login/logout
   - Application creation
   - File upload
   - Payment processing

## Post-Deployment

### Immediate Post-Deployment Tasks

1. **Monitor Application Health**
   ```bash
   # Check application logs
   vercel logs

   # Monitor error rates
   # Check Sentry dashboard (if configured)
   # Review Google Analytics real-time data
   ```

2. **Performance Monitoring**
   - Monitor Core Web Vitals
   - Check API response times
   - Review database performance
   - Monitor CDN performance

3. **User Experience Validation**
   - Test critical user flows
   - Verify payment processing
   - Check email notifications
   - Test file uploads/downloads

### Long-term Monitoring

1. **Daily Monitoring**
   - Application health
   - Error rates
   - Performance metrics
   - User activity

2. **Weekly Reviews**
   - Performance trends
   - User feedback
   - Security updates
   - Dependency updates

3. **Monthly Maintenance**
   - Security patches
   - Performance optimization
   - Backup verification
   - Capacity planning

## Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures

**Symptom**: Build fails during deployment
```bash
Error: Build failed with exit code 1
```

**Solutions**:
```bash
# Check local build
npm run build

# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

#### 2. Environment Variable Issues

**Symptom**: Application fails with configuration errors

**Solutions**:
```bash
# Verify environment variables in Vercel
vercel env ls production

# Re-upload environment variables
npm run deploy:env:production

# Check for missing variables
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI key found' : 'OpenAI key missing')"
```

#### 3. Database Connection Issues

**Symptom**: 500 errors related to database connectivity

**Solutions**:
```bash
# Test database connection
npm run test:db

# Check Supabase status
# Verify connection strings
# Check database connection limits
```

#### 4. Performance Issues

**Symptom**: Slow loading times or timeouts

**Solutions**:
```bash
# Run performance analysis
npm run analyze

# Check Core Web Vitals
# Review bundle size
# Optimize images and assets
# Check CDN configuration
```

#### 5. SSL/Domain Issues

**Symptom**: SSL certificate errors or domain not resolving

**Solutions**:
```bash
# Check DNS configuration
dig visaassist.ai

# Verify SSL certificate
openssl s_client -connect visaassist.ai:443

# Check Vercel domain configuration
vercel domains
```

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Inspect build output
vercel inspect [deployment-url]

# Check environment variables
vercel env ls [environment]

# Test API endpoints
curl -i https://visaassist.ai/api/health
```

## Rollback Procedures

### Automatic Rollback

The production deployment script includes automatic rollback on failure:

```bash
# The script will automatically rollback if:
# - Health checks fail
# - Application doesn't start
# - Critical errors detected
```

### Manual Rollback

If you need to manually rollback:

```bash
# 1. Get previous deployment URL
vercel ls

# 2. Promote previous deployment
vercel alias [previous-deployment-url] visaassist.ai

# 3. Verify rollback
curl https://visaassist.ai/api/health

# 4. Notify team
# Send notification about rollback
```

### Emergency Rollback

For critical issues:

```bash
# Quick rollback to last known good deployment
vercel rollback

# Or manually alias previous deployment
vercel alias [last-good-deployment] visaassist.ai
```

### Post-Rollback Actions

1. **Investigate Issue**
   - Review logs
   - Identify root cause
   - Document findings

2. **Fix and Redeploy**
   - Apply fixes
   - Test thoroughly
   - Deploy again

3. **Communication**
   - Update stakeholders
   - Document lessons learned
   - Update procedures if needed

## Monitoring & Maintenance

### Health Monitoring

1. **Automated Health Checks**
   ```bash
   # Endpoint monitoring
   curl https://visaassist.ai/api/health

   # Application functionality
   curl https://visaassist.ai/dashboard
   ```

2. **Performance Monitoring**
   - Core Web Vitals tracking
   - API response time monitoring
   - Database performance metrics
   - Error rate tracking

### Regular Maintenance Tasks

#### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Check backup status

#### Weekly
- [ ] Review performance trends
- [ ] Check security alerts
- [ ] Update dependencies (if needed)
- [ ] Review user feedback

#### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup verification
- [ ] Capacity planning review
- [ ] Dependency updates

### Emergency Procedures

1. **High Error Rate**
   - Check application logs
   - Identify failing components
   - Apply immediate fixes or rollback
   - Communicate with users

2. **Performance Degradation**
   - Check resource usage
   - Identify bottlenecks
   - Scale resources if needed
   - Optimize slow queries

3. **Security Incidents**
   - Isolate affected components
   - Apply security patches
   - Review access logs
   - Notify stakeholders

## Best Practices

### Development
- Always test locally before deploying
- Use feature branches for new features
- Write comprehensive tests
- Follow coding standards
- Document changes

### Deployment
- Use automated deployment scripts
- Always deploy to staging first
- Run comprehensive tests
- Monitor post-deployment
- Have rollback plan ready

### Security
- Regularly update dependencies
- Use environment variables for secrets
- Enable security headers
- Monitor for security vulnerabilities
- Regular security audits

### Performance
- Monitor Core Web Vitals
- Optimize bundle size
- Use CDN for static assets
- Implement caching strategies
- Regular performance audits

## Support and Contacts

- **Development Team**: dev-team@visaassist.ai
- **Operations Team**: ops-team@visaassist.ai
- **Emergency Contact**: emergency@visaassist.ai
- **Documentation**: https://docs.visaassist.ai

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [Performance Best Practices](./PERFORMANCE.md)
- [Security Guidelines](./SECURITY.md)