#!/bin/bash

# Visa Assist AI - Production Deployment Script
# This script deploys the application to production environment on Vercel

set -e  # Exit on any error

echo "🚀 Starting production deployment for Visa Assist AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="visa-assist-ai"
PRODUCTION_BRANCH="main"
CURRENT_BRANCH=$(git branch --show-current)
PRODUCTION_DOMAIN="visaassist.ai"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Please install it first:"
        echo "npm i -g vercel"
        exit 1
    fi
    
    # Check if logged into Vercel
    if ! vercel whoami &> /dev/null; then
        log_error "Not logged into Vercel. Please login first:"
        echo "vercel login"
        exit 1
    fi
    
    # Check if Node.js and npm are available
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Check git status and branch
check_git_status() {
    log_info "Checking git status..."
    
    # Check if we're on the production branch
    if [ "$CURRENT_BRANCH" != "$PRODUCTION_BRANCH" ]; then
        log_error "Not on production branch ($PRODUCTION_BRANCH). Current branch: $CURRENT_BRANCH"
        log_info "Please switch to the production branch first:"
        echo "git checkout $PRODUCTION_BRANCH"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_error "You have uncommitted changes. Please commit them first."
        echo "Uncommitted files:"
        git status --porcelain
        exit 1
    fi
    
    # Check if local branch is up to date with remote
    git fetch origin $PRODUCTION_BRANCH
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/$PRODUCTION_BRANCH)
    
    if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
        log_error "Local branch is not up to date with remote. Please pull latest changes:"
        echo "git pull origin $PRODUCTION_BRANCH"
        exit 1
    fi
    
    log_success "Git status check passed"
}

# Confirmation prompt for production deployment
confirm_production_deployment() {
    log_warning "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION ⚠️"
    echo
    echo "You are about to deploy to PRODUCTION environment!"
    echo "Domain: $PRODUCTION_DOMAIN"
    echo "Branch: $CURRENT_BRANCH"
    echo "This will affect live users."
    echo
    
    read -p "Are you absolutely sure you want to proceed? Type 'yes' to continue: " -r
    echo
    
    if [ "$REPLY" != "yes" ]; then
        log_info "Production deployment cancelled"
        exit 0
    fi
    
    log_info "Production deployment confirmed"
}

# Run comprehensive tests
run_comprehensive_tests() {
    log_info "Running comprehensive test suite..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Run linting
    log_info "Running linter..."
    npm run lint
    
    # Run type checking
    log_info "Running type check..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test
    
    # Run component tests with coverage
    log_info "Running component tests with coverage..."
    npm run test:components:coverage
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Run E2E tests (if available)
    if npm run test:e2e --silent > /dev/null 2>&1; then
        log_info "Running E2E tests..."
        npm run test:e2e
    else
        log_warning "E2E tests not available or not configured"
    fi
    
    log_success "All tests passed"
}

# Build application with production optimizations
build_application() {
    log_info "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build the application
    npm run build
    
    # Run bundle analysis if configured
    if npm run analyze --silent > /dev/null 2>&1; then
        log_info "Running bundle analysis..."
        npm run analyze
    fi
    
    log_success "Application built successfully"
}

# Set environment variables for production
set_production_env_vars() {
    log_info "Setting up production environment variables..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found. Please create it based on .env.production.example"
        log_info "Production deployment requires all environment variables to be configured"
        exit 1
    fi
    
    # Read environment variables from .env.production and set them in Vercel
    log_info "Reading environment variables from .env.production..."
    
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ $key =~ ^#.*$ ]] || [[ -z "$key" ]]; then
            continue
        fi
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        # Check for empty values (which might indicate missing configuration)
        if [[ -z "$value" ]] || [[ "$value" == "your-"* ]]; then
            log_error "Environment variable $key appears to be not configured (empty or placeholder value)"
            log_info "Please configure all environment variables in .env.production"
            exit 1
        fi
        
        # Set environment variable in Vercel for production environment
        log_info "Setting $key for production environment..."
        echo "$value" | vercel env add "$key" production --force > /dev/null 2>&1 || true
        
    done < .env.production
    
    log_success "Environment variables configured for production"
}

# Create deployment backup
create_deployment_backup() {
    log_info "Creating deployment backup..."
    
    # Create backup directory with timestamp
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment info (if exists)
    if vercel ls > /dev/null 2>&1; then
        vercel ls --json > "$BACKUP_DIR/previous_deployments.json" 2>/dev/null || true
    fi
    
    # Backup current environment variables
    vercel env ls production --json > "$BACKUP_DIR/env_variables.json" 2>/dev/null || true
    
    # Create backup info file
    cat > "$BACKUP_DIR/backup_info.txt" << EOF
Deployment Backup Information
============================
Date: $(date)
Branch: $CURRENT_BRANCH
Commit: $(git rev-parse HEAD)
Commit Message: $(git log -1 --pretty=%B)
User: $(whoami)
Vercel User: $(vercel whoami 2>/dev/null || echo "Unknown")
EOF

    log_success "Deployment backup created in $BACKUP_DIR"
}

# Deploy to Vercel production
deploy_to_vercel() {
    log_info "Deploying to Vercel production..."
    
    # Deploy to production
    DEPLOYMENT_URL=$(vercel --prod --confirm)
    
    if [ $? -eq 0 ]; then
        log_success "Production deployment successful!"
        log_info "Production URL: $DEPLOYMENT_URL"
        log_info "Domain: https://$PRODUCTION_DOMAIN"
        
    else
        log_error "Production deployment failed!"
        exit 1
    fi
}

# Run post-deployment tests and monitoring
run_post_deployment_monitoring() {
    log_info "Running post-deployment monitoring..."
    
    # Wait for deployment to be fully ready
    log_info "Waiting for deployment to be ready..."
    sleep 30
    
    # Test production domain
    log_info "Testing production domain..."
    if curl -f "https://$PRODUCTION_DOMAIN/api/health" > /dev/null 2>&1; then
        log_success "Production health check passed"
    else
        log_error "Production health check failed!"
        log_info "Please check the deployment manually"
    fi
    
    # Test homepage
    log_info "Testing homepage..."
    if curl -f "https://$PRODUCTION_DOMAIN" > /dev/null 2>&1; then
        log_success "Homepage accessible"
    else
        log_error "Homepage not accessible!"
    fi
    
    # Check SSL certificate
    log_info "Checking SSL certificate..."
    if openssl s_client -connect "$PRODUCTION_DOMAIN:443" -servername "$PRODUCTION_DOMAIN" < /dev/null 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
        log_success "SSL certificate is valid"
    else
        log_warning "Could not verify SSL certificate"
    fi
}

# Tag release
tag_release() {
    log_info "Tagging release..."
    
    # Generate version tag based on current date and time
    VERSION_TAG="v$(date +%Y.%m.%d-%H%M%S)"
    
    # Create git tag
    git tag -a "$VERSION_TAG" -m "Production release $VERSION_TAG"
    
    # Push tag to remote
    git push origin "$VERSION_TAG"
    
    log_success "Release tagged as $VERSION_TAG"
}

# Send notifications
send_notifications() {
    log_info "Sending deployment notifications..."
    
    # Create deployment summary
    DEPLOYMENT_SUMMARY="
🚀 Production Deployment Successful!
===================================
Project: $PROJECT_NAME
Environment: Production
Domain: https://$PRODUCTION_DOMAIN
Branch: $CURRENT_BRANCH
Commit: $(git rev-parse --short HEAD)
Version: $VERSION_TAG
Timestamp: $(date)
User: $(whoami)
===================================
"
    
    echo "$DEPLOYMENT_SUMMARY"
    
    # Send to Slack (if webhook is configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"$DEPLOYMENT_SUMMARY\"}" \
          "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
        log_success "Slack notification sent"
    fi
    
    # Send email notification (if configured)
    if [ ! -z "$EMAIL_NOTIFICATION" ]; then
        echo "$DEPLOYMENT_SUMMARY" | mail -s "Production Deployment Successful - $PROJECT_NAME" "$EMAIL_NOTIFICATION" > /dev/null 2>&1 || true
        log_success "Email notification sent"
    fi
}

# Rollback function (in case of issues)
rollback_deployment() {
    log_error "Rollback requested..."
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(vercel ls --json | jq -r '.[1].url' 2>/dev/null || echo "")
    
    if [ ! -z "$PREVIOUS_DEPLOYMENT" ] && [ "$PREVIOUS_DEPLOYMENT" != "null" ]; then
        log_info "Rolling back to previous deployment: $PREVIOUS_DEPLOYMENT"
        vercel alias "$PREVIOUS_DEPLOYMENT" "$PRODUCTION_DOMAIN"
        log_success "Rollback completed"
    else
        log_error "Could not find previous deployment for rollback"
    fi
}

# Main execution
main() {
    echo "🏭 Visa Assist AI - Production Deployment"
    echo "========================================"
    
    check_prerequisites
    check_git_status
    confirm_production_deployment
    run_comprehensive_tests
    build_application
    set_production_env_vars
    create_deployment_backup
    deploy_to_vercel
    run_post_deployment_monitoring
    tag_release
    send_notifications
    
    log_success "🎉 Production deployment completed successfully!"
    log_info "Your application is now live at: https://$PRODUCTION_DOMAIN"
    log_info "Monitor the application closely for the next few minutes"
}

# Trap for handling interruptions
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Execute main function
main "$@"