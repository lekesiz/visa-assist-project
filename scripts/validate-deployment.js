#!/usr/bin/env node

/**
 * Deployment Validation Script
 * This script validates that all required configuration is in place for deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  const fileName = path.basename(filePath);
  
  if (exists) {
    log(`✅ ${fileName} exists`, 'green');
    return true;
  } else {
    if (required) {
      log(`❌ ${fileName} is missing (required)`, 'red');
    } else {
      log(`⚠️  ${fileName} is missing (optional)`, 'yellow');
    }
    return false;
  }
}

function checkEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach(varName => {
    const line = lines.find(l => l.startsWith(`${varName}=`));
    if (!line) {
      missingVars.push(varName);
    } else {
      const value = line.split('=')[1] || '';
      if (value.includes('your-') || value.includes('sk-test-') || value.length < 10) {
        placeholderVars.push(varName);
      }
    }
  });
  
  const fileName = path.basename(filePath);
  
  if (missingVars.length === 0 && placeholderVars.length === 0) {
    log(`✅ ${fileName} has all required variables configured`, 'green');
    return true;
  } else {
    if (missingVars.length > 0) {
      log(`❌ ${fileName} missing variables: ${missingVars.join(', ')}`, 'red');
    }
    if (placeholderVars.length > 0) {
      log(`⚠️  ${fileName} has placeholder values: ${placeholderVars.join(', ')}`, 'yellow');
    }
    return false;
  }
}

function checkPackageJson() {
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = [
    'build',
    'start',
    'dev',
    'lint',
    'test'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length === 0) {
    log('✅ package.json has all required scripts', 'green');
    return true;
  } else {
    log(`❌ package.json missing scripts: ${missingScripts.join(', ')}`, 'red');
    return false;
  }
}

function checkVercelConfig() {
  const hasVercelJson = fs.existsSync('vercel.json');
  const hasNextConfig = fs.existsSync('next.config.js');
  
  if (hasVercelJson) {
    log('✅ vercel.json configuration found', 'green');
  } else {
    log('⚠️  vercel.json not found', 'yellow');
  }
  
  if (hasNextConfig) {
    log('✅ next.config.js configuration found', 'green');
  } else {
    log('❌ next.config.js not found', 'red');
    return false;
  }
  
  return true;
}

function checkDeploymentScripts() {
  const scripts = [
    'scripts/deploy-staging.sh',
    'scripts/deploy-production.sh',
    'scripts/setup-vercel-env.sh'
  ];
  
  let allExist = true;
  
  scripts.forEach(script => {
    const exists = checkFileExists(script);
    if (exists) {
      // Check if script is executable
      try {
        fs.accessSync(script, fs.constants.X_OK);
        log(`✅ ${path.basename(script)} is executable`, 'green');
      } catch (error) {
        log(`⚠️  ${path.basename(script)} is not executable`, 'yellow');
        log(`   Run: chmod +x ${script}`, 'blue');
      }
    }
    allExist = allExist && exists;
  });
  
  return allExist;
}

function checkNodeModules() {
  if (fs.existsSync('node_modules')) {
    log('✅ node_modules directory exists', 'green');
    return true;
  } else {
    log('❌ node_modules not found - run npm install', 'red');
    return false;
  }
}

function checkBuildOutput() {
  if (fs.existsSync('.next')) {
    log('✅ .next build directory exists', 'green');
    return true;
  } else {
    log('⚠️  .next build directory not found - run npm run build', 'yellow');
    return false;
  }
}

function main() {
  log('🔍 Validating Deployment Configuration', 'blue');
  log('=====================================', 'blue');
  
  let validationPassed = true;
  
  // Check required files
  log('\n📁 Checking Required Files:', 'blue');
  validationPassed = checkFileExists('package.json') && validationPassed;
  validationPassed = checkFileExists('next.config.js') && validationPassed;
  checkFileExists('vercel.json', false);
  checkFileExists('tsconfig.json', false);
  checkFileExists('tailwind.config.ts', false);
  
  // Check environment files
  log('\n🔧 Checking Environment Configuration:', 'blue');
  checkFileExists('.env.example');
  checkEnvFile('.env.local');
  checkEnvFile('.env.staging');
  checkEnvFile('.env.production');
  
  // Check package.json scripts
  log('\n📦 Checking Package Configuration:', 'blue');
  validationPassed = checkPackageJson() && validationPassed;
  
  // Check Vercel configuration
  log('\n⚡ Checking Vercel Configuration:', 'blue');
  validationPassed = checkVercelConfig() && validationPassed;
  
  // Check deployment scripts
  log('\n🚀 Checking Deployment Scripts:', 'blue');
  validationPassed = checkDeploymentScripts() && validationPassed;
  
  // Check dependencies
  log('\n📚 Checking Dependencies:', 'blue');
  validationPassed = checkNodeModules() && validationPassed;
  
  // Check build output
  log('\n🏗️  Checking Build Output:', 'blue');
  checkBuildOutput();
  
  // Final result
  log('\n📊 Validation Summary:', 'blue');
  log('===================', 'blue');
  
  if (validationPassed) {
    log('✅ All critical validations passed!', 'green');
    log('🚀 Your project is ready for deployment', 'green');
    process.exit(0);
  } else {
    log('❌ Some validations failed', 'red');
    log('🔧 Please fix the issues above before deploying', 'red');
    process.exit(1);
  }
}

// Run the validation
main();