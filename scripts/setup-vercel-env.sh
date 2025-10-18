#!/bin/bash

# Visa Assist AI - Vercel Environment Variables Setup Script
# This script helps set up environment variables in Vercel for different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Show usage information
show_usage() {
    echo "Usage: $0 [environment]"
    echo
    echo "Environments:"
    echo "  development  - Set up development environment variables"
    echo "  staging      - Set up staging/preview environment variables"
    echo "  production   - Set up production environment variables"
    echo "  all          - Set up all environments"
    echo
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production"
    echo "  $0 all"
}

# Check prerequisites
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
    
    log_success "Prerequisites check passed"
}

# Set environment variables from file
set_env_vars_from_file() {
    local env_file=$1
    local vercel_env=$2
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file $env_file not found"
        return 1
    fi
    
    log_info "Setting environment variables from $env_file for $vercel_env environment..."
    
    local count=0
    local errors=0
    
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ $key =~ ^#.*$ ]] || [[ -z "$key" ]]; then
            continue
        fi
        
        # Remove quotes from value if present
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        # Skip placeholder values
        if [[ "$value" == "your-"* ]] || [[ "$value" == "sk-"* && ${#value} -lt 20 ]]; then
            log_warning "Skipping $key (appears to be a placeholder value)"
            continue
        fi
        
        # Set environment variable in Vercel
        log_info "Setting $key..."
        if echo "$value" | vercel env add "$key" "$vercel_env" --force > /dev/null 2>&1; then
            ((count++))
        else
            log_error "Failed to set $key"
            ((errors++))
        fi
        
    done < "$env_file"
    
    log_success "Set $count environment variables for $vercel_env environment"
    
    if [ $errors -gt 0 ]; then
        log_warning "$errors environment variables failed to set"
        return 1
    fi
    
    return 0
}

# Set up development environment
setup_development() {
    log_info "Setting up development environment..."
    
    if [ -f ".env.local" ]; then
        set_env_vars_from_file ".env.local" "development"
    elif [ -f ".env.example" ]; then
        log_warning ".env.local not found, using .env.example"
        set_env_vars_from_file ".env.example" "development"
    else
        log_error "No development environment file found"
        return 1
    fi
    
    log_success "Development environment setup completed"
}

# Set up staging environment
setup_staging() {
    log_info "Setting up staging environment..."
    
    if [ -f ".env.staging" ]; then
        set_env_vars_from_file ".env.staging" "preview"
    elif [ -f ".env.staging.example" ]; then
        log_warning ".env.staging not found, using .env.staging.example"
        log_warning "Please create .env.staging with actual values"
        set_env_vars_from_file ".env.staging.example" "preview"
    else
        log_error "No staging environment file found"
        return 1
    fi
    
    log_success "Staging environment setup completed"
}

# Set up production environment
setup_production() {
    log_info "Setting up production environment..."
    
    log_warning "⚠️  Setting up PRODUCTION environment variables!"
    echo "This will affect your live application."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Production setup cancelled"
        return 0
    fi
    
    if [ -f ".env.production" ]; then
        set_env_vars_from_file ".env.production" "production"
    elif [ -f ".env.production.example" ]; then
        log_error ".env.production not found. Using example file is not safe for production!"
        log_info "Please create .env.production with actual production values"
        return 1
    else
        log_error "No production environment file found"
        return 1
    fi
    
    log_success "Production environment setup completed"
}

# List current environment variables
list_env_vars() {
    local env=$1
    
    log_info "Current environment variables for $env:"
    vercel env ls "$env" || true
}

# Validate environment variables
validate_env_vars() {
    local env=$1
    
    log_info "Validating environment variables for $env..."
    
    # Define required variables
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    local missing_vars=()
    
    # Get current environment variables
    local current_vars=$(vercel env ls "$env" --json 2>/dev/null | jq -r '.[].key' 2>/dev/null || echo "")
    
    for var in "${required_vars[@]}"; do
        if ! echo "$current_vars" | grep -q "^$var$"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_success "All required environment variables are set for $env"
    else
        log_warning "Missing required environment variables for $env:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
    fi
}

# Interactive setup
interactive_setup() {
    echo "🔧 Interactive Environment Variables Setup"
    echo "=========================================="
    
    echo "What would you like to do?"
    echo "1) Set up development environment"
    echo "2) Set up staging environment"
    echo "3) Set up production environment"
    echo "4) Set up all environments"
    echo "5) List current environment variables"
    echo "6) Validate environment variables"
    echo "7) Exit"
    
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            setup_development
            ;;
        2)
            setup_staging
            ;;
        3)
            setup_production
            ;;
        4)
            setup_development
            setup_staging
            setup_production
            ;;
        5)
            echo "Select environment to list:"
            echo "1) Development"
            echo "2) Preview/Staging"
            echo "3) Production"
            read -p "Enter choice (1-3): " env_choice
            case $env_choice in
                1) list_env_vars "development" ;;
                2) list_env_vars "preview" ;;
                3) list_env_vars "production" ;;
                *) log_error "Invalid choice" ;;
            esac
            ;;
        6)
            echo "Select environment to validate:"
            echo "1) Development"
            echo "2) Preview/Staging"
            echo "3) Production"
            read -p "Enter choice (1-3): " env_choice
            case $env_choice in
                1) validate_env_vars "development" ;;
                2) validate_env_vars "preview" ;;
                3) validate_env_vars "production" ;;
                *) log_error "Invalid choice" ;;
            esac
            ;;
        7)
            log_info "Goodbye!"
            exit 0
            ;;
        *)
            log_error "Invalid choice"
            interactive_setup
            ;;
    esac
}

# Main execution
main() {
    local environment=${1:-""}
    
    echo "🔧 Visa Assist AI - Vercel Environment Setup"
    echo "============================================"
    
    check_prerequisites
    
    case $environment in
        "development")
            setup_development
            ;;
        "staging")
            setup_staging
            ;;
        "production")
            setup_production
            ;;
        "all")
            setup_development
            setup_staging
            setup_production
            ;;
        "")
            interactive_setup
            ;;
        *)
            log_error "Invalid environment: $environment"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"