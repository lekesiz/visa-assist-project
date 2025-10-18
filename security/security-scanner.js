#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityScanner {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.vulnerabilities = [];
    this.warnings = [];
    this.info = [];
    
    // Security patterns to check
    this.patterns = {
      // Sensitive data patterns
      sensitiveData: [
        { pattern: /password\s*[:=]\s*['"]\w+['"]/, severity: 'HIGH', description: 'Hardcoded password found' },
        { pattern: /api[_-]?key\s*[:=]\s*['"]\w+['"]/, severity: 'HIGH', description: 'Hardcoded API key found' },
        { pattern: /secret\s*[:=]\s*['"]\w+['"]/, severity: 'HIGH', description: 'Hardcoded secret found' },
        { pattern: /token\s*[:=]\s*['"]\w+['"]/, severity: 'MEDIUM', description: 'Hardcoded token found' },
        { pattern: /private[_-]?key/, severity: 'HIGH', description: 'Private key reference found' },
        { pattern: /sk_live_\w+/, severity: 'CRITICAL', description: 'Stripe live secret key found' },
        { pattern: /sk_test_\w+/, severity: 'MEDIUM', description: 'Stripe test secret key found' },
        { pattern: /rk_live_\w+/, severity: 'CRITICAL', description: 'Stripe live restricted key found' },
        { pattern: /whsec_\w+/, severity: 'HIGH', description: 'Stripe webhook secret found' },
        { pattern: /AKIA[0-9A-Z]{16}/, severity: 'CRITICAL', description: 'AWS access key found' },
        { pattern: /eyJ[A-Za-z0-9_/+]*={0,2}\.eyJ[A-Za-z0-9_/+]*={0,2}/, severity: 'HIGH', description: 'JWT token found' }
      ],
      
      // XSS vulnerabilities
      xssVulnerabilities: [
        { pattern: /dangerouslySetInnerHTML/, severity: 'HIGH', description: 'Potential XSS via dangerouslySetInnerHTML' },
        { pattern: /innerHTML\s*=/, severity: 'MEDIUM', description: 'Potential XSS via innerHTML' },
        { pattern: /document\.write\s*\(/, severity: 'HIGH', description: 'Potential XSS via document.write' },
        { pattern: /eval\s*\(/, severity: 'CRITICAL', description: 'Code injection via eval()' },
        { pattern: /Function\s*\(/, severity: 'HIGH', description: 'Code injection via Function constructor' },
        { pattern: /window\[.*\]\s*\(/, severity: 'MEDIUM', description: 'Potential code injection via window object' }
      ],
      
      // SQL injection patterns
      sqlInjection: [
        { pattern: /query\s*\+\s*.*\+/, severity: 'HIGH', description: 'Potential SQL injection via string concatenation' },
        { pattern: /SELECT.*\$\{.*\}/, severity: 'HIGH', description: 'Potential SQL injection via template literals' },
        { pattern: /INSERT.*\$\{.*\}/, severity: 'HIGH', description: 'Potential SQL injection via template literals' },
        { pattern: /UPDATE.*\$\{.*\}/, severity: 'HIGH', description: 'Potential SQL injection via template literals' },
        { pattern: /DELETE.*\$\{.*\}/, severity: 'HIGH', description: 'Potential SQL injection via template literals' }
      ],
      
      // Insecure HTTP patterns
      insecureHttp: [
        { pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/, severity: 'MEDIUM', description: 'Insecure HTTP URL found' },
        { pattern: /fetch\s*\(\s*['"](http:\/\/[^'"]+)['"]/, severity: 'MEDIUM', description: 'Insecure HTTP request' }
      ],
      
      // Weak encryption
      weakCrypto: [
        { pattern: /MD5|SHA1|DES|RC4/, severity: 'HIGH', description: 'Weak cryptographic algorithm' },
        { pattern: /Math\.random\(\)/, severity: 'MEDIUM', description: 'Weak random number generation' },
        { pattern: /crypto\.createCipher\(/, severity: 'HIGH', description: 'Deprecated crypto method' }
      ],
      
      // File system vulnerabilities
      fileSystemVulns: [
        { pattern: /\.\.\//, severity: 'HIGH', description: 'Potential path traversal vulnerability' },
        { pattern: /process\.env\[.*\]/, severity: 'MEDIUM', description: 'Dynamic environment variable access' },
        { pattern: /exec\s*\(/, severity: 'CRITICAL', description: 'Command injection risk via exec()' },
        { pattern: /spawn\s*\(/, severity: 'HIGH', description: 'Command injection risk via spawn()' }
      ],
      
      // Configuration issues
      configIssues: [
        { pattern: /cors\s*:\s*true/, severity: 'MEDIUM', description: 'Overly permissive CORS configuration' },
        { pattern: /secure\s*:\s*false/, severity: 'HIGH', description: 'Insecure cookie configuration' },
        { pattern: /httpOnly\s*:\s*false/, severity: 'HIGH', description: 'Cookie not set to httpOnly' },
        { pattern: /sameSite\s*:\s*['"]none['"]/, severity: 'MEDIUM', description: 'Insecure SameSite cookie setting' }
      ]
    };
    
    this.fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.yaml', '.yml'];
    this.excludeDirs = ['node_modules', '.git', '.next', 'coverage', 'dist', 'build'];
  }

  async scan() {
    console.log('🔍 Starting security scan...\n');
    
    await this.scanFiles();
    await this.checkPackageVulnerabilities();
    await this.checkEnvironmentSecurity();
    await this.checkHeaders();
    await this.checkAuthentication();
    
    this.generateReport();
  }

  async scanFiles() {
    const files = this.getAllFiles(this.projectPath);
    
    for (const file of files) {
      await this.scanFile(file);
    }
  }

  getAllFiles(dir, files = []) {
    if (this.excludeDirs.some(excluded => dir.includes(excluded))) {
      return files;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else if (this.fileExtensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectPath, filePath);
      
      // Check all pattern categories
      Object.entries(this.patterns).forEach(([category, patterns]) => {
        patterns.forEach(({ pattern, severity, description }) => {
          const matches = content.match(new RegExp(pattern, 'gi'));
          if (matches) {
            matches.forEach(match => {
              const lineNumber = this.getLineNumber(content, match);
              this.addVulnerability({
                file: relativePath,
                line: lineNumber,
                severity,
                category,
                description,
                evidence: match.slice(0, 100),
                recommendation: this.getRecommendation(category, description)
              });
            });
          }
        });
      });
      
    } catch (error) {
      this.warnings.push(`Could not scan file: ${filePath} - ${error.message}`);
    }
  }

  getLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 1;
  }

  addVulnerability(vuln) {
    if (vuln.severity === 'CRITICAL') {
      this.vulnerabilities.unshift(vuln);
    } else {
      this.vulnerabilities.push(vuln);
    }
  }

  async checkPackageVulnerabilities() {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for known vulnerable packages
        const vulnerablePackages = {
          'lodash': '< 4.17.21',
          'minimist': '< 1.2.6',
          'kind-of': '< 6.0.3',
          'node-forge': '< 1.3.0',
          'axios': '< 0.21.2'
        };
        
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        Object.entries(allDeps).forEach(([pkg, version]) => {
          if (vulnerablePackages[pkg]) {
            this.addVulnerability({
              file: 'package.json',
              line: 1,
              severity: 'HIGH',
              category: 'dependency',
              description: `Potentially vulnerable package: ${pkg}@${version}`,
              evidence: `${pkg}: ${version}`,
              recommendation: `Update ${pkg} to ${vulnerablePackages[pkg]} or later`
            });
          }
        });
      }
    } catch (error) {
      this.warnings.push(`Could not check package vulnerabilities: ${error.message}`);
    }
  }

  async checkEnvironmentSecurity() {
    const envFiles = ['.env', '.env.local', '.env.example'];
    
    envFiles.forEach(envFile => {
      const envPath = path.join(this.projectPath, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        
        // Check for missing encryption
        if (!content.includes('ENCRYPTION_KEY')) {
          this.addVulnerability({
            file: envFile,
            line: 1,
            severity: 'HIGH',
            category: 'configuration',
            description: 'Missing encryption key configuration',
            evidence: 'ENCRYPTION_KEY not found',
            recommendation: 'Add ENCRYPTION_KEY for sensitive data encryption'
          });
        }
        
        // Check for weak JWT secrets
        const jwtMatch = content.match(/JWT_SECRET\s*=\s*(.+)/);
        if (jwtMatch && jwtMatch[1].length < 32) {
          this.addVulnerability({
            file: envFile,
            line: this.getLineNumber(content, jwtMatch[0]),
            severity: 'HIGH',
            category: 'configuration',
            description: 'Weak JWT secret',
            evidence: 'JWT_SECRET too short',
            recommendation: 'Use a JWT secret with at least 32 characters'
          });
        }
      }
    });
  }

  async checkHeaders() {
    const nextConfigPath = path.join(this.projectPath, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];
      
      requiredHeaders.forEach(header => {
        if (!content.includes(header)) {
          this.addVulnerability({
            file: 'next.config.js',
            line: 1,
            severity: 'MEDIUM',
            category: 'configuration',
            description: `Missing security header: ${header}`,
            evidence: `${header} not configured`,
            recommendation: `Add ${header} to security headers configuration`
          });
        }
      });
    }
  }

  async checkAuthentication() {
    const middlewarePath = path.join(this.projectPath, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      
      // Check for proper session validation
      if (!content.includes('getUser')) {
        this.addVulnerability({
          file: 'middleware.ts',
          line: 1,
          severity: 'HIGH',
          category: 'authentication',
          description: 'Missing user session validation',
          evidence: 'No user validation found',
          recommendation: 'Implement proper user session validation'
        });
      }
      
      // Check for proper error handling
      if (!content.includes('error')) {
        this.addVulnerability({
          file: 'middleware.ts',
          line: 1,
          severity: 'MEDIUM',
          category: 'authentication',
          description: 'Missing authentication error handling',
          evidence: 'No error handling found',
          recommendation: 'Add proper error handling for authentication failures'
        });
      }
    }
  }

  getRecommendation(category, description) {
    const recommendations = {
      'sensitiveData': 'Move sensitive data to environment variables and never commit them to version control',
      'xssVulnerabilities': 'Use proper input sanitization and output encoding. Consider using libraries like DOMPurify',
      'sqlInjection': 'Use parameterized queries or ORM methods instead of string concatenation',
      'insecureHttp': 'Use HTTPS for all external communications',
      'weakCrypto': 'Use strong cryptographic algorithms like AES-256 and proper random number generators',
      'fileSystemVulns': 'Validate and sanitize all file paths and user inputs',
      'configIssues': 'Review security configurations and follow security best practices'
    };
    
    return recommendations[category] || 'Review and address this security issue according to best practices';
  }

  generateReport() {
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    const high = this.vulnerabilities.filter(v => v.severity === 'HIGH');
    const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM');
    const low = this.vulnerabilities.filter(v => v.severity === 'LOW');

    console.log('📊 SECURITY SCAN RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Issues Found: ${this.vulnerabilities.length}`);
    console.log(`Critical: ${critical.length}`);
    console.log(`High: ${high.length}`);
    console.log(`Medium: ${medium.length}`);
    console.log(`Low: ${low.length}`);
    console.log('='.repeat(50));

    // Group by severity
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    severityOrder.forEach(severity => {
      const issues = this.vulnerabilities.filter(v => v.severity === severity);
      if (issues.length > 0) {
        console.log(`\n🚨 ${severity} SEVERITY (${issues.length} issues)`);
        console.log('-'.repeat(30));
        
        issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   File: ${issue.file}:${issue.line}`);
          console.log(`   Category: ${issue.category}`);
          console.log(`   Evidence: ${issue.evidence}`);
          console.log(`   Fix: ${issue.recommendation}`);
          console.log('');
        });
      }
    });

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS');
      console.log('-'.repeat(20));
      this.warnings.forEach(warning => console.log(`- ${warning}`));
    }

    // Summary recommendations
    console.log('\n💡 IMMEDIATE ACTIONS REQUIRED');
    console.log('-'.repeat(35));
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL: Address immediately before deployment');
    }
    if (high.length > 0) {
      console.log('🟠 HIGH: Fix before production release');
    }
    if (medium.length > 0) {
      console.log('🟡 MEDIUM: Address in next sprint');
    }

    // Write detailed report to file
    this.writeDetailedReport();
  }

  writeDetailedReport() {
    const report = {
      scanDate: new Date().toISOString(),
      summary: {
        totalIssues: this.vulnerabilities.length,
        critical: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        high: this.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        low: this.vulnerabilities.filter(v => v.severity === 'LOW').length
      },
      vulnerabilities: this.vulnerabilities,
      warnings: this.warnings,
      recommendations: this.generateSecurityRecommendations()
    };

    const reportPath = path.join(this.projectPath, 'security', 'security-report.json');
    
    // Ensure security directory exists
    const securityDir = path.dirname(reportPath);
    if (!fs.existsSync(securityDir)) {
      fs.mkdirSync(securityDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  generateSecurityRecommendations() {
    return [
      'Implement Content Security Policy (CSP) headers',
      'Enable HTTPS Strict Transport Security (HSTS)',
      'Use secure session management with httpOnly and secure flags',
      'Implement proper input validation and sanitization',
      'Use parameterized queries to prevent SQL injection',
      'Implement rate limiting for API endpoints',
      'Regular security audits and dependency updates',
      'Enable security monitoring and logging',
      'Implement proper error handling without information disclosure',
      'Use least privilege principle for user permissions'
    ];
  }
}

// Run the scanner
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const scanner = new SecurityScanner(projectPath);
  scanner.scan().catch(console.error);
}

module.exports = SecurityScanner;