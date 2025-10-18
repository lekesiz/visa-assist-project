#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class APISecurityChecker {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.apiRoutes = [];
    this.vulnerabilities = [];
    this.warnings = [];
    
    // Security patterns specific to API routes
    this.securityChecks = {
      authentication: {
        patterns: [
          /getUser\(\)/,
          /auth\.user/,
          /req\.user/,
          /headers\['authorization'\]/,
          /headers\.authorization/
        ],
        required: true,
        description: 'Authentication check'
      },
      inputValidation: {
        patterns: [
          /\.parse\(/,
          /\.safeParse\(/,
          /validate\(/,
          /schema\./,
          /zod\./
        ],
        required: true,
        description: 'Input validation'
      },
      rateLimiting: {
        patterns: [
          /rateLimit/,
          /rate-limit/,
          /throttle/,
          /limit\(/
        ],
        required: false,
        description: 'Rate limiting'
      },
      errorHandling: {
        patterns: [
          /try\s*{/,
          /catch\s*\(/,
          /\.catch\(/,
          /NextResponse\.json.*error/
        ],
        required: true,
        description: 'Error handling'
      },
      cors: {
        patterns: [
          /cors/,
          /Access-Control/,
          /origin/
        ],
        required: false,
        description: 'CORS configuration'
      },
      sanitization: {
        patterns: [
          /sanitize/,
          /escape/,
          /DOMPurify/,
          /xss/
        ],
        required: false,
        description: 'Input sanitization'
      }
    };

    // Dangerous patterns to flag
    this.dangerousPatterns = [
      {
        pattern: /eval\s*\(/,
        severity: 'CRITICAL',
        description: 'Code injection via eval()',
        category: 'code-injection'
      },
      {
        pattern: /Function\s*\(/,
        severity: 'HIGH',
        description: 'Code injection via Function constructor',
        category: 'code-injection'
      },
      {
        pattern: /exec\s*\(/,
        severity: 'CRITICAL',
        description: 'Command injection via exec()',
        category: 'command-injection'
      },
      {
        pattern: /spawn\s*\(/,
        severity: 'HIGH',
        description: 'Potential command injection via spawn()',
        category: 'command-injection'
      },
      {
        pattern: /process\.env\[.*\]/,
        severity: 'MEDIUM',
        description: 'Dynamic environment variable access',
        category: 'configuration'
      },
      {
        pattern: /SQL.*\$\{.*\}/,
        severity: 'HIGH',
        description: 'Potential SQL injection via template literals',
        category: 'sql-injection'
      },
      {
        pattern: /req\.query\.\w+.*query/,
        severity: 'HIGH',
        description: 'Unsanitized query parameter used in database query',
        category: 'sql-injection'
      },
      {
        pattern: /req\.body\.\w+.*query/,
        severity: 'HIGH',
        description: 'Unsanitized body parameter used in database query',
        category: 'sql-injection'
      },
      {
        pattern: /\.innerHTML\s*=/,
        severity: 'MEDIUM',
        description: 'Potential XSS via innerHTML',
        category: 'xss'
      },
      {
        pattern: /dangerouslySetInnerHTML/,
        severity: 'HIGH',
        description: 'Potential XSS via dangerouslySetInnerHTML',
        category: 'xss'
      }
    ];

    // HTTP methods and their typical security requirements
    this.methodRequirements = {
      'GET': ['authentication', 'rateLimiting'],
      'POST': ['authentication', 'inputValidation', 'rateLimiting', 'errorHandling'],
      'PUT': ['authentication', 'inputValidation', 'rateLimiting', 'errorHandling'],
      'DELETE': ['authentication', 'rateLimiting', 'errorHandling'],
      'PATCH': ['authentication', 'inputValidation', 'rateLimiting', 'errorHandling']
    };
  }

  async check() {
    console.log('🔍 Starting API security check...\n');
    
    await this.discoverAPIRoutes();
    await this.checkEachRoute();
    await this.checkMiddleware();
    await this.checkConfiguration();
    await this.generateReport();
  }

  async discoverAPIRoutes() {
    const apiDir = path.join(this.projectPath, 'app', 'api');
    if (!fs.existsSync(apiDir)) {
      console.log('⚠️  No API directory found');
      return;
    }

    this.findRouteFiles(apiDir);
    console.log(`📡 Found ${this.apiRoutes.length} API routes\n`);
  }

  findRouteFiles(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const newBasePath = basePath ? `${basePath}/${item}` : item;
        this.findRouteFiles(fullPath, newBasePath);
      } else if (item === 'route.ts' || item === 'route.js') {
        const routePath = `/api/${basePath}`;
        this.apiRoutes.push({
          path: routePath,
          filePath: fullPath,
          relativePath: path.relative(this.projectPath, fullPath)
        });
      }
    }
  }

  async checkEachRoute() {
    for (const route of this.apiRoutes) {
      await this.checkRoute(route);
    }
  }

  async checkRoute(route) {
    try {
      const content = fs.readFileSync(route.filePath, 'utf8');
      const methods = this.extractHTTPMethods(content);
      
      console.log(`🔍 Checking ${route.path}...`);
      
      // Check each HTTP method in the route
      for (const method of methods) {
        await this.checkMethodSecurity(route, method, content);
      }
      
      // Check for dangerous patterns
      await this.checkDangerousPatterns(route, content);
      
    } catch (error) {
      this.warnings.push(`Could not analyze route ${route.path}: ${error.message}`);
    }
  }

  extractHTTPMethods(content) {
    const methods = [];
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      if (content.includes(`export async function ${method}`) || 
          content.includes(`export function ${method}`)) {
        methods.push(method);
      }
    }
    
    return methods;
  }

  async checkMethodSecurity(route, method, content) {
    const requirements = this.methodRequirements[method] || [];
    
    for (const requirement of requirements) {
      const check = this.securityChecks[requirement];
      if (!check) continue;
      
      const hasPattern = check.patterns.some(pattern => pattern.test(content));
      
      if (check.required && !hasPattern) {
        this.addVulnerability({
          route: route.path,
          method: method,
          file: route.relativePath,
          severity: this.getSeverityForMissingCheck(requirement),
          category: 'missing-security-control',
          description: `Missing ${check.description} for ${method} method`,
          recommendation: this.getRecommendationForCheck(requirement),
          evidence: `No ${requirement} patterns found`
        });
      } else if (!hasPattern) {
        this.warnings.push(`${route.path} ${method}: Consider implementing ${check.description}`);
      }
    }
  }

  async checkDangerousPatterns(route, content) {
    for (const pattern of this.dangerousPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        const lineNumber = this.getLineNumber(content, matches[0]);
        this.addVulnerability({
          route: route.path,
          file: route.relativePath,
          line: lineNumber,
          severity: pattern.severity,
          category: pattern.category,
          description: pattern.description,
          evidence: matches[0].slice(0, 100),
          recommendation: this.getRecommendationForDangerousPattern(pattern.category)
        });
      }
    }
  }

  async checkMiddleware() {
    const middlewarePath = path.join(this.projectPath, 'middleware.ts');
    if (!fs.existsSync(middlewarePath)) {
      this.addVulnerability({
        route: 'global',
        file: 'middleware.ts',
        severity: 'HIGH',
        category: 'missing-security-control',
        description: 'No global middleware found',
        recommendation: 'Implement middleware for authentication and security headers'
      });
      return;
    }

    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    // Check for essential middleware components
    const middlewareChecks = [
      {
        pattern: /getUser|auth/,
        name: 'Authentication',
        severity: 'HIGH'
      },
      {
        pattern: /headers/,
        name: 'Security headers',
        severity: 'MEDIUM'
      },
      {
        pattern: /rateLimit|throttle/,
        name: 'Rate limiting',
        severity: 'MEDIUM'
      },
      {
        pattern: /cors/,
        name: 'CORS configuration',
        severity: 'LOW'
      }
    ];

    for (const check of middlewareChecks) {
      if (!check.pattern.test(content)) {
        this.addVulnerability({
          route: 'global',
          file: 'middleware.ts',
          severity: check.severity,
          category: 'missing-security-control',
          description: `Missing ${check.name} in middleware`,
          recommendation: `Implement ${check.name} in global middleware`
        });
      }
    }
  }

  async checkConfiguration() {
    // Check Next.js configuration
    const nextConfigPath = path.join(this.projectPath, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      await this.checkNextConfig(nextConfigPath);
    }
    
    // Check environment configuration
    await this.checkEnvironmentConfig();
  }

  async checkNextConfig(configPath) {
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Check for security headers
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];

    for (const header of securityHeaders) {
      if (!content.includes(header)) {
        this.addVulnerability({
          route: 'global',
          file: 'next.config.js',
          severity: header === 'Content-Security-Policy' ? 'HIGH' : 'MEDIUM',
          category: 'missing-security-control',
          description: `Missing security header: ${header}`,
          recommendation: `Add ${header} to Next.js security headers configuration`
        });
      }
    }

    // Check for dangerous configurations
    if (content.includes('dangerouslyAllowSVG: true')) {
      this.addVulnerability({
        route: 'global',
        file: 'next.config.js',
        severity: 'MEDIUM',
        category: 'configuration',
        description: 'SVG uploads allowed without proper CSP',
        recommendation: 'Ensure proper Content Security Policy when allowing SVG uploads'
      });
    }
  }

  async checkEnvironmentConfig() {
    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(this.projectPath, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        
        // Check for insecure configurations
        if (content.includes('NODE_TLS_REJECT_UNAUTHORIZED=0')) {
          this.addVulnerability({
            route: 'global',
            file: envFile,
            severity: 'HIGH',
            category: 'configuration',
            description: 'TLS certificate validation disabled',
            recommendation: 'Remove NODE_TLS_REJECT_UNAUTHORIZED=0 or use proper certificates'
          });
        }
        
        // Check for development settings in production files
        if (envFile.includes('production') && content.includes('NODE_ENV=development')) {
          this.addVulnerability({
            route: 'global',
            file: envFile,
            severity: 'HIGH',
            category: 'configuration',
            description: 'Development mode enabled in production environment',
            recommendation: 'Set NODE_ENV=production for production deployments'
          });
        }
      }
    }
  }

  getSeverityForMissingCheck(checkType) {
    const severityMap = {
      'authentication': 'CRITICAL',
      'inputValidation': 'HIGH',
      'errorHandling': 'MEDIUM',
      'rateLimiting': 'MEDIUM',
      'cors': 'LOW',
      'sanitization': 'MEDIUM'
    };
    
    return severityMap[checkType] || 'MEDIUM';
  }

  getRecommendationForCheck(checkType) {
    const recommendations = {
      'authentication': 'Implement user authentication check using middleware or route-level validation',
      'inputValidation': 'Use schema validation libraries like Zod or Joi to validate inputs',
      'errorHandling': 'Implement proper try-catch blocks and return appropriate error responses',
      'rateLimiting': 'Implement rate limiting to prevent abuse and DoS attacks',
      'cors': 'Configure CORS headers to control cross-origin access',
      'sanitization': 'Sanitize user inputs to prevent XSS and injection attacks'
    };
    
    return recommendations[checkType] || 'Implement proper security controls';
  }

  getRecommendationForDangerousPattern(category) {
    const recommendations = {
      'code-injection': 'Never use eval() or Function constructor with user input. Use safer alternatives',
      'command-injection': 'Validate and sanitize all inputs before executing system commands',
      'sql-injection': 'Use parameterized queries or ORM methods instead of string concatenation',
      'xss': 'Sanitize all user inputs and use proper output encoding',
      'configuration': 'Review configuration settings and use secure defaults'
    };
    
    return recommendations[category] || 'Follow security best practices';
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
    this.vulnerabilities.push(vuln);
  }

  async generateReport() {
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    const high = this.vulnerabilities.filter(v => v.severity === 'HIGH');
    const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM');
    const low = this.vulnerabilities.filter(v => v.severity === 'LOW');

    console.log('\n📊 API SECURITY SCAN RESULTS');
    console.log('='.repeat(50));
    console.log(`API Routes Scanned: ${this.apiRoutes.length}`);
    console.log(`Security Issues Found: ${this.vulnerabilities.length}`);
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
          console.log(`   Route: ${issue.route || 'N/A'}`);
          console.log(`   Method: ${issue.method || 'N/A'}`);
          console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
          console.log(`   Category: ${issue.category}`);
          if (issue.evidence) {
            console.log(`   Evidence: ${issue.evidence}`);
          }
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

    // API-specific recommendations
    console.log('\n💡 API SECURITY BEST PRACTICES');
    console.log('-'.repeat(35));
    console.log('1. Implement authentication for all protected endpoints');
    console.log('2. Use input validation and sanitization');
    console.log('3. Implement rate limiting to prevent abuse');
    console.log('4. Use HTTPS for all API communications');
    console.log('5. Implement proper error handling without information disclosure');
    console.log('6. Use parameterized queries to prevent SQL injection');
    console.log('7. Implement CORS policies appropriately');
    console.log('8. Log security events for monitoring');
    console.log('9. Use security headers in responses');
    console.log('10. Regular security testing and code reviews');

    // Save detailed report
    await this.saveReport();
  }

  async saveReport() {
    const report = {
      scanDate: new Date().toISOString(),
      summary: {
        routesScanned: this.apiRoutes.length,
        totalIssues: this.vulnerabilities.length,
        critical: this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        high: this.vulnerabilities.filter(v => v.severity === 'HIGH').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        low: this.vulnerabilities.filter(v => v.severity === 'LOW').length
      },
      routes: this.apiRoutes,
      vulnerabilities: this.vulnerabilities,
      warnings: this.warnings,
      recommendations: [
        'Implement comprehensive input validation',
        'Add authentication to all protected endpoints',
        'Use rate limiting to prevent abuse',
        'Implement proper error handling',
        'Add security headers to all responses',
        'Use HTTPS for all communications',
        'Regular security audits and penetration testing'
      ]
    };

    const reportPath = path.join(this.projectPath, 'security', 'api-security-report.json');
    
    // Ensure security directory exists
    const securityDir = path.dirname(reportPath);
    if (!fs.existsSync(securityDir)) {
      fs.mkdirSync(securityDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the checker
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const checker = new APISecurityChecker(projectPath);
  checker.check().catch(console.error);
}

module.exports = APISecurityChecker;