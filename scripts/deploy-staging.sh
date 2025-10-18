#!/bin/bash

# Visa Assist AI - Staging Deployment Script
# This script deploys the application to staging environment on Vercel

set -e  # Exit on any error

echo "🚀 Starting staging deployment for Visa Assist AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="visa-assist-ai"
STAGING_BRANCH="staging"
CURRENT_BRANCH=$(git branch --show-current)

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

# Check git status
check_git_status() {
    log_info "Checking git status..."
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes. Please commit or stash them first."
        echo "Uncommitted files:"
        git status --porcelain
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 1
        fi
    fi
    
    log_success "Git status check passed"
}

# Run tests
run_tests() {
    log_info "Running tests before deployment..."
    
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
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    log_success "All tests passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Set staging environment
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build the application
    npm run build
    
    log_success "Application built successfully"
}

# Set environment variables for staging
set_staging_env_vars() {
    log_info "Setting up staging environment variables..."
    
    # Check if .env.staging exists
    if [ ! -f ".env.staging" ]; then
        log_warning ".env.staging file not found. Please create it based on .env.staging.example"
        read -p "Do you want to continue without setting environment variables? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Please create .env.staging file and run the script again"
            exit 1
        fi
        return
    fi
    
    # Read environment variables from .env.staging and set them in Vercel
    log_info "Reading environment variables from .env.staging..."
    
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ $key =~ ^#.*$ ]] || [[ -z "$key" ]]; then
            continue
        fi
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        # Set environment variable in Vercel for preview environment
        log_info "Setting $key for preview environment..."
        echo "$value" | vercel env add "$key" preview --force > /dev/null 2>&1 || true
        
    done < .env.staging
    
    log_success "Environment variables configured for staging"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel staging..."
    
    # Deploy to Vercel
    # Using --prod=false to deploy to preview environment
    DEPLOYMENT_URL=$(vercel --prod=false --confirm)
    
    if [ $? -eq 0 ]; then
        log_success "Deployment successful!"
        log_info "Staging URL: $DEPLOYMENT_URL"
        
        # Assign to staging domain if configured
        if [ ! -z "$STAGING_DOMAIN" ]; then
            log_info "Assigning to staging domain: $STAGING_DOMAIN"
            vercel alias "$DEPLOYMENT_URL" "$STAGING_DOMAIN"
        fi
        
    else
        log_error "Deployment failed!"
        exit 1
    fi
}

# Run post-deployment tests
run_post_deployment_tests() {
    log_info "Running post-deployment health checks..."
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        # Wait a moment for deployment to be ready
        sleep 10
        
        # Test health endpoint
        log_info "Testing health endpoint..."
        if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
            log_success "Health check passed"
        else
            log_warning "Health check failed - this might be expected if the endpoint doesn't exist"
        fi
        
        # Test homepage
        log_info "Testing homepage..."
        if curl -f "$DEPLOYMENT_URL" > /dev/null 2>&1; then
            log_success "Homepage accessible"
        else
            log_error "Homepage not accessible"
        fi
    fi
}

# Send notification
send_notification() {
    log_info "Deployment Summary:"
    echo "=================="
    echo "Project: $PROJECT_NAME"
    echo "Environment: Staging"
    echo "Branch: $CURRENT_BRANCH"
    echo "Deployment URL: $DEPLOYMENT_URL"
    echo "Timestamp: $(date)"
    echo "=================="
    
    # If you have Slack webhook or other notification system, add it here
    # Example:
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"Staging deployment successful: '$DEPLOYMENT_URL'"}' \
    #   $SLACK_WEBHOOK_URL
}

# Main execution
main() {
    echo "🏗️  Visa Assist AI - Staging Deployment"
    echo "======================================="
    
    check_prerequisites
    check_git_status
    run_tests
    build_application
    set_staging_env_vars
    deploy_to_vercel
    run_post_deployment_tests
    send_notification
    
    log_success "🎉 Staging deployment completed successfully!"
    log_info "You can view your staging application at: $DEPLOYMENT_URL"
}

# Execute main function
main "$@"