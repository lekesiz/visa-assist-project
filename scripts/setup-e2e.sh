#!/bin/bash

# E2E Testing Setup Script
# This script sets up the E2E testing environment for the Visa Assist project

set -e

echo "🚀 Setting up E2E Testing Infrastructure..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Install system dependencies for Playwright
echo "🔧 Installing system dependencies..."
npx playwright install-deps

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p e2e-results/screenshots
mkdir -p e2e-results/videos
mkdir -p e2e-results/traces
mkdir -p e2e/storage-states

# Set up environment files
if [ ! -f ".env.local" ]; then
    echo "⚙️ Setting up environment file..."
    cp .env.e2e .env.local
    echo "📝 Please update .env.local with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Make scripts executable
chmod +x scripts/*.sh

# Create test data files if they don't exist
echo "📋 Setting up test data..."

# Create a sample image file for testing
if [ ! -f "e2e/fixtures/uploads/test-photo.jpg" ]; then
    # Create a minimal valid JPEG file (1x1 pixel)
    echo -en '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x27 ,#\x1c\x1c(7),01444\x1f\x27=9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xb2\xc0\x07\xff\xd9' > e2e/fixtures/uploads/test-photo.jpg
    echo "✅ Created test photo file"
fi

# Verify Playwright installation
echo "🧪 Verifying Playwright installation..."
if npx playwright --version > /dev/null 2>&1; then
    echo "✅ Playwright $(npx playwright --version) is ready"
else
    echo "❌ Playwright installation failed"
    exit 1
fi

# Check if application can be built
echo "🏗️ Verifying application build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Application builds successfully"
else
    echo "⚠️ Application build failed - E2E tests may not work properly"
fi

# Create a quick test to verify everything works
echo "🧪 Running a quick test to verify setup..."
if npx playwright test --grep "should display home page correctly" > /dev/null 2>&1; then
    echo "✅ E2E setup verification passed"
else
    echo "⚠️ E2E setup verification failed - check configuration"
fi

echo ""
echo "🎉 E2E Testing Infrastructure setup complete!"
echo ""
echo "📚 Quick Start:"
echo "  npm run test:e2e           # Run all E2E tests"
echo "  npm run test:e2e:ui        # Run tests in UI mode"
echo "  npm run test:e2e:debug     # Debug mode"
echo "  npm run test:e2e:chrome    # Chrome only"
echo "  npm run test:e2e:mobile    # Mobile tests"
echo ""
echo "📖 For more information, see e2e/README.md"
echo ""

# Optional: Open the test UI
read -p "Would you like to open the Playwright Test UI? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🖥️ Opening Playwright Test UI..."
    npm run test:e2e:ui
fi