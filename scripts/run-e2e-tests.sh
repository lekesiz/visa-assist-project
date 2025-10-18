#!/bin/bash

# E2E Test Runner Script
# This script provides various options for running E2E tests

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${2}${1}${NC}\n"
}

# Function to show help
show_help() {
    echo "E2E Test Runner for Visa Assist"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -a, --all               Run all E2E tests"
    echo "  -b, --browser BROWSER   Run tests on specific browser (chromium, firefox, webkit)"
    echo "  -m, --mobile            Run mobile tests only"
    echo "  -f, --file FILE         Run specific test file"
    echo "  -g, --grep PATTERN      Run tests matching pattern"
    echo "  -d, --debug             Run in debug mode"
    echo "  -u, --ui                Run in UI mode"
    echo "  -h, --headed            Run in headed mode (visible browser)"
    echo "  -p, --parallel          Run tests in parallel"
    echo "  -s, --shard N/M         Run tests in shard N of M"
    echo "  -r, --retry N           Set number of retries"
    echo "  -t, --timeout N         Set timeout in milliseconds"
    echo "  --update-snapshots      Update visual snapshots"
    echo "  --reporter TYPE         Set reporter (list, dot, json, html)"
    echo "  --project PROJECT       Run specific project"
    echo ""
    echo "Examples:"
    echo "  $0 --all                                # Run all tests"
    echo "  $0 --browser chromium                   # Run Chrome tests only"
    echo "  $0 --mobile                             # Run mobile tests"
    echo "  $0 --file auth.spec.ts                  # Run auth tests only"
    echo "  $0 --grep 'registration'                # Run tests with 'registration'"
    echo "  $0 --debug --file auth.spec.ts          # Debug auth tests"
    echo "  $0 --ui                                 # Open test UI"
    echo "  $0 --parallel --shard 1/4               # Run 1st shard of 4"
    echo ""
}

# Default values
BROWSER=""
MOBILE=false
FILE=""
GREP=""
DEBUG=false
UI=false
HEADED=false
PARALLEL=false
SHARD=""
RETRY=""
TIMEOUT=""
UPDATE_SNAPSHOTS=false
REPORTER=""
PROJECT=""
ALL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            ALL=true
            shift
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -m|--mobile)
            MOBILE=true
            shift
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -g|--grep)
            GREP="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -u|--ui)
            UI=true
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -s|--shard)
            SHARD="$2"
            shift 2
            ;;
        -r|--retry)
            RETRY="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --update-snapshots)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        --reporter)
            REPORTER="$2"
            shift 2
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        *)
            print_color "Unknown option: $1" $RED
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
    print_color "Playwright not found. Installing..." $YELLOW
    npm run test:e2e:install
fi

# Build the command
CMD="npx playwright test"

# Add options to command
if [ "$UI" = true ]; then
    CMD="$CMD --ui"
elif [ "$DEBUG" = true ]; then
    CMD="$CMD --debug"
fi

if [ "$HEADED" = true ]; then
    CMD="$CMD --headed"
fi

if [ "$BROWSER" != "" ]; then
    CMD="$CMD --project=$BROWSER"
fi

if [ "$MOBILE" = true ]; then
    CMD="$CMD --project='Mobile Chrome' --project='Mobile Safari'"
fi

if [ "$PROJECT" != "" ]; then
    CMD="$CMD --project='$PROJECT'"
fi

if [ "$FILE" != "" ]; then
    CMD="$CMD $FILE"
fi

if [ "$GREP" != "" ]; then
    CMD="$CMD --grep '$GREP'"
fi

if [ "$SHARD" != "" ]; then
    CMD="$CMD --shard=$SHARD"
fi

if [ "$RETRY" != "" ]; then
    CMD="$CMD --retries=$RETRY"
fi

if [ "$TIMEOUT" != "" ]; then
    CMD="$CMD --timeout=$TIMEOUT"
fi

if [ "$UPDATE_SNAPSHOTS" = true ]; then
    CMD="$CMD --update-snapshots"
fi

if [ "$REPORTER" != "" ]; then
    CMD="$CMD --reporter=$REPORTER"
fi

# Set environment variables
export E2E_BASE_URL=${E2E_BASE_URL:-"http://localhost:3000"}

# Check if application is running (if testing locally)
if [[ $E2E_BASE_URL == *"localhost"* ]]; then
    print_color "Checking if application is running at $E2E_BASE_URL..." $BLUE
    
    if ! curl -s "$E2E_BASE_URL" > /dev/null; then
        print_color "Application not running at $E2E_BASE_URL" $YELLOW
        print_color "Starting application..." $BLUE
        
        # Start the application in background
        npm run dev &
        APP_PID=$!
        
        # Wait for application to start
        print_color "Waiting for application to start..." $BLUE
        for i in {1..30}; do
            if curl -s "$E2E_BASE_URL" > /dev/null; then
                print_color "Application started successfully!" $GREEN
                break
            fi
            sleep 2
            if [ $i -eq 30 ]; then
                print_color "Application failed to start within 60 seconds" $RED
                kill $APP_PID 2>/dev/null || true
                exit 1
            fi
        done
    else
        print_color "Application is already running!" $GREEN
    fi
fi

# Show what will be executed
print_color "Executing: $CMD" $BLUE
print_color "Base URL: $E2E_BASE_URL" $BLUE

# Create results directory
mkdir -p e2e-results

# Execute the command
print_color "Starting E2E tests..." $GREEN
if eval $CMD; then
    print_color "✅ E2E tests completed successfully!" $GREEN
    
    # Show report if HTML reporter was used
    if [[ $CMD == *"--reporter=html"* ]] || [[ $REPORTER == "" ]]; then
        read -p "Would you like to view the HTML report? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run test:e2e:report
        fi
    fi
else
    EXIT_CODE=$?
    print_color "❌ E2E tests failed!" $RED
    
    print_color "Check the following for debugging:" $YELLOW
    print_color "- Screenshots: e2e-results/screenshots/" $YELLOW
    print_color "- Videos: e2e-results/videos/" $YELLOW
    print_color "- Traces: e2e-results/traces/" $YELLOW
    print_color "- HTML report: npm run test:e2e:report" $YELLOW
    
    # Clean up background process if we started it
    if [ ! -z ${APP_PID+x} ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    exit $EXIT_CODE
fi

# Clean up background process if we started it
if [ ! -z ${APP_PID+x} ]; then
    print_color "Stopping application..." $BLUE
    kill $APP_PID 2>/dev/null || true
fi

print_color "E2E test run completed!" $GREEN