#!/usr/bin/env node

/**
 * Performance Audit Tools
 * Comprehensive performance testing and optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class PerformanceAuditor {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'performance-reports');
    this.auditConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance', 'best-practices'],
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    };
  }

  async runFullAudit(urls = ['http://localhost:3000']) {
    console.log('🚀 Starting comprehensive performance audit...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const auditResults = {
      timestamp: new Date().toISOString(),
      urls: {},
      summary: {},
      recommendations: []
    };

    // Run Lighthouse audits
    for (const url of urls) {
      console.log(`📊 Auditing ${url}...`);
      try {
        const result = await this.runLighthouseAudit(url);
        auditResults.urls[url] = result;
      } catch (error) {
        console.error(`❌ Failed to audit ${url}:`, error.message);
        auditResults.urls[url] = { error: error.message };
      }
    }

    // Analyze bundle
    console.log('📦 Analyzing bundle...');
    const bundleAnalysis = await this.analyzeBundleSize();
    auditResults.bundle = bundleAnalysis;

    // Check for performance issues
    console.log('🔍 Checking for performance issues...');
    const performanceIssues = await this.detectPerformanceIssues();
    auditResults.issues = performanceIssues;

    // Generate recommendations
    auditResults.recommendations = this.generateRecommendations(auditResults);
    auditResults.summary = this.generateSummary(auditResults);

    // Save results
    const reportPath = path.join(this.outputDir, 'performance-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(auditResults);

    console.log('✅ Performance audit completed!');
    console.log(`📊 Reports saved to: ${this.outputDir}`);

    return auditResults;
  }

  async runLighthouseAudit(url) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...this.auditConfig.settings
      }, this.auditConfig);

      await chrome.kill();

      const { lhr } = runnerResult;
      
      return {
        performanceScore: Math.round(lhr.categories.performance.score * 100),
        metrics: {
          firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
          firstInputDelay: lhr.audits['max-potential-fid'].numericValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
          speedIndex: lhr.audits['speed-index'].numericValue,
          timeToInteractive: lhr.audits['interactive'].numericValue,
          totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
        },
        opportunities: lhr.audits,
        diagnostics: this.extractDiagnostics(lhr.audits),
        filmstrip: lhr.audits.screenshot ? lhr.audits.screenshot.details : null
      };
    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }

  extractDiagnostics(audits) {
    const diagnosticAudits = [
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'uses-webp-images',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript',
      'preload-lcp-image',
      'total-byte-weight',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'uses-text-compression',
      'uses-rel-preconnect',
      'uses-rel-preload',
      'critical-request-chains'
    ];

    const diagnostics = {};
    
    diagnosticAudits.forEach(auditId => {
      if (audits[auditId]) {
        diagnostics[auditId] = {
          score: audits[auditId].score,
          numericValue: audits[auditId].numericValue,
          displayValue: audits[auditId].displayValue,
          details: audits[auditId].details
        };
      }
    });

    return diagnostics;
  }

  async analyzeBundleSize() {
    try {
      // Run bundle analyzer
      execSync('npm run analyze', { stdio: 'pipe' });
      
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      if (!fs.existsSync(staticDir)) {
        return { error: 'Bundle not found. Run npm run build first.' };
      }

      const analysis = {
        chunks: {},
        totalSize: 0,
        assets: {}
      };

      // Analyze chunks
      const chunksDir = path.join(staticDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const chunkFiles = fs.readdirSync(chunksDir);
        
        for (const file of chunkFiles) {
          if (file.endsWith('.js')) {
            const filePath = path.join(chunksDir, file);
            const stats = fs.statSync(filePath);
            
            analysis.chunks[file] = {
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size)
            };
            
            analysis.totalSize += stats.size;
          }
        }
      }

      return analysis;
    } catch (error) {
      return { error: error.message };
    }
  }

  async detectPerformanceIssues() {
    const issues = [];

    // Check for large images
    const imageIssues = await this.checkImageOptimization();
    issues.push(...imageIssues);

    // Check for unused dependencies
    const dependencyIssues = await this.checkUnusedDependencies();
    issues.push(...dependencyIssues);

    // Check for performance anti-patterns
    const codeIssues = await this.checkCodePatterns();
    issues.push(...codeIssues);

    return issues;
  }

  async checkImageOptimization() {
    const issues = [];
    const publicDir = path.join(process.cwd(), 'public');
    
    if (fs.existsSync(publicDir)) {
      const images = this.findFiles(publicDir, /\.(jpg|jpeg|png|gif)$/i);
      
      for (const imagePath of images) {
        const stats = fs.statSync(imagePath);
        
        if (stats.size > 500 * 1024) { // 500KB
          issues.push({
            type: 'large-image',
            severity: 'warning',
            file: imagePath.replace(process.cwd(), ''),
            size: this.formatBytes(stats.size),
            recommendation: 'Consider optimizing or converting to WebP/AVIF format'
          });
        }
      }
    }

    return issues;
  }

  async checkUnusedDependencies() {
    const issues = [];
    
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      
      const dependencies = Object.keys(packageJson.dependencies || {});
      const usedDependencies = new Set();

      // Scan source files for imports
      const sourceFiles = this.findFiles(
        path.join(process.cwd(), 'app'),
        /\.(js|jsx|ts|tsx)$/
      ).concat(
        this.findFiles(
          path.join(process.cwd(), 'components'),
          /\.(js|jsx|ts|tsx)$/
        )
      ).concat(
        this.findFiles(
          path.join(process.cwd(), 'lib'),
          /\.(js|jsx|ts|tsx)$/
        )
      );

      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        dependencies.forEach(dep => {
          if (content.includes(`from '${dep}'`) || 
              content.includes(`require('${dep}')`)) {
            usedDependencies.add(dep);
          }
        });
      }

      const unusedDependencies = dependencies.filter(dep => 
        !usedDependencies.has(dep) && 
        !dep.startsWith('@types/') &&
        dep !== 'react' &&
        dep !== 'react-dom' &&
        dep !== 'next'
      );

      unusedDependencies.forEach(dep => {
        issues.push({
          type: 'unused-dependency',
          severity: 'info',
          dependency: dep,
          recommendation: `Consider removing unused dependency: ${dep}`
        });
      });

    } catch (error) {
      console.warn('Failed to check unused dependencies:', error.message);
    }

    return issues;
  }

  async checkCodePatterns() {
    const issues = [];
    
    const sourceFiles = this.findFiles(
      path.join(process.cwd()),
      /\.(js|jsx|ts|tsx)$/
    ).filter(file => 
      !file.includes('node_modules') && 
      !file.includes('.next') &&
      !file.includes('dist')
    );

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for console.log statements
        if (content.includes('console.log') && !file.includes('test')) {
          issues.push({
            type: 'console-statements',
            severity: 'info',
            file: file.replace(process.cwd(), ''),
            recommendation: 'Remove console.log statements from production code'
          });
        }

        // Check for large inline styles
        const inlineStyleMatches = content.match(/style=\{[^}]+\}/g);
        if (inlineStyleMatches && inlineStyleMatches.some(match => match.length > 200)) {
          issues.push({
            type: 'large-inline-styles',
            severity: 'warning',
            file: file.replace(process.cwd(), ''),
            recommendation: 'Extract large inline styles to CSS classes'
          });
        }

        // Check for missing key props in lists
        if (content.includes('.map(') && !content.includes('key=')) {
          issues.push({
            type: 'missing-keys',
            severity: 'warning',
            file: file.replace(process.cwd(), ''),
            recommendation: 'Add key props to list items for better performance'
          });
        }

      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error.message);
      }
    }

    return issues;
  }

  generateRecommendations(auditResults) {
    const recommendations = [];

    // Performance score recommendations
    Object.entries(auditResults.urls).forEach(([url, result]) => {
      if (result.performanceScore < 90) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          title: `Improve performance score for ${url}`,
          description: `Current score: ${result.performanceScore}/100`,
          actions: this.getPerformanceActions(result)
        });
      }
    });

    // Bundle size recommendations
    if (auditResults.bundle && auditResults.bundle.totalSize > 1024 * 1024) { // 1MB
      recommendations.push({
        priority: 'medium',
        category: 'bundle-size',
        title: 'Reduce bundle size',
        description: `Current size: ${this.formatBytes(auditResults.bundle.totalSize)}`,
        actions: [
          'Implement code splitting',
          'Remove unused dependencies',
          'Use dynamic imports for large components',
          'Enable tree shaking'
        ]
      });
    }

    // Issue-based recommendations
    if (auditResults.issues) {
      auditResults.issues.forEach(issue => {
        recommendations.push({
          priority: issue.severity === 'warning' ? 'medium' : 'low',
          category: issue.type,
          title: issue.recommendation,
          description: issue.file || issue.dependency || '',
          actions: [issue.recommendation]
        });
      });
    }

    return recommendations;
  }

  getPerformanceActions(result) {
    const actions = [];

    if (result.metrics.firstContentfulPaint > 2000) {
      actions.push('Optimize First Contentful Paint');
    }
    
    if (result.metrics.largestContentfulPaint > 2500) {
      actions.push('Optimize Largest Contentful Paint');
    }
    
    if (result.metrics.cumulativeLayoutShift > 0.1) {
      actions.push('Reduce Cumulative Layout Shift');
    }
    
    if (result.metrics.totalBlockingTime > 300) {
      actions.push('Reduce Total Blocking Time');
    }

    return actions;
  }

  generateSummary(auditResults) {
    const summary = {
      overallScore: 0,
      totalIssues: 0,
      criticalIssues: 0,
      recommendations: auditResults.recommendations.length
    };

    // Calculate overall score
    const scores = Object.values(auditResults.urls)
      .filter(result => result.performanceScore)
      .map(result => result.performanceScore);
    
    if (scores.length > 0) {
      summary.overallScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
    }

    // Count issues
    if (auditResults.issues) {
      summary.totalIssues = auditResults.issues.length;
      summary.criticalIssues = auditResults.issues.filter(
        issue => issue.severity === 'warning'
      ).length;
    }

    return summary;
  }

  async generateHTMLReport(auditResults) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #666; margin-top: 5px; }
        .score-good { color: #28a745; }
        .score-warning { color: #ffc107; }
        .score-poor { color: #dc3545; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .table th { background: #f8f9fa; font-weight: 600; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 6px; }
        .recommendation.high { background: #fff5f5; border-left: 4px solid #e53e3e; }
        .recommendation.medium { background: #fffbeb; border-left: 4px solid #d69e2e; }
        .recommendation.low { background: #f0f9ff; border-left: 4px solid #3182ce; }
        .actions { margin-top: 10px; }
        .actions li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Performance Audit Report</h1>
        <p><strong>Generated:</strong> ${new Date(auditResults.timestamp).toLocaleString()}</p>
        
        <h2>Summary</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value ${this.getScoreClass(auditResults.summary.overallScore)}">${auditResults.summary.overallScore}</div>
                <div class="metric-label">Overall Performance Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">${auditResults.summary.totalIssues}</div>
                <div class="metric-label">Total Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">${auditResults.summary.criticalIssues}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric">
                <div class="metric-value">${auditResults.summary.recommendations}</div>
                <div class="metric-label">Recommendations</div>
            </div>
        </div>

        <h2>URL Performance</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Performance Score</th>
                    <th>FCP</th>
                    <th>LCP</th>
                    <th>CLS</th>
                    <th>TTI</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(auditResults.urls).map(([url, result]) => `
                    <tr>
                        <td>${url}</td>
                        <td class="${this.getScoreClass(result.performanceScore || 0)}">${result.performanceScore || 'Error'}</td>
                        <td>${result.metrics ? Math.round(result.metrics.firstContentfulPaint) + 'ms' : '-'}</td>
                        <td>${result.metrics ? Math.round(result.metrics.largestContentfulPaint) + 'ms' : '-'}</td>
                        <td>${result.metrics ? result.metrics.cumulativeLayoutShift.toFixed(3) : '-'}</td>
                        <td>${result.metrics ? Math.round(result.metrics.timeToInteractive) + 'ms' : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Bundle Analysis</h2>
        ${auditResults.bundle && !auditResults.bundle.error ? `
            <p><strong>Total Bundle Size:</strong> ${this.formatBytes(auditResults.bundle.totalSize)}</p>
            <table class="table">
                <thead>
                    <tr>
                        <th>Chunk</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(auditResults.bundle.chunks || {})
                      .sort(([,a], [,b]) => b.size - a.size)
                      .map(([name, info]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${info.sizeFormatted}</td>
                        </tr>
                      `).join('')}
                </tbody>
            </table>
        ` : `<p>Bundle analysis not available. ${auditResults.bundle?.error || ''}</p>`}

        <h2>Recommendations</h2>
        ${auditResults.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                <div class="actions">
                    <strong>Actions:</strong>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}

        <h2>Issues Found</h2>
        ${auditResults.issues && auditResults.issues.length > 0 ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>File/Dependency</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditResults.issues.map(issue => `
                        <tr>
                            <td>${issue.type}</td>
                            <td>${issue.severity}</td>
                            <td>${issue.file || issue.dependency || '-'}</td>
                            <td>${issue.recommendation}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p>No issues found.</p>'}
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(this.outputDir, 'performance-audit.html');
    fs.writeFileSync(htmlPath, htmlContent);
  }

  getScoreClass(score) {
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-warning';
    return 'score-poor';
  }

  findFiles(dir, pattern) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFiles(fullPath, pattern));
      } else if (stat.isFile() && pattern.test(item)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  const urls = process.argv.slice(2);
  
  auditor.runFullAudit(urls.length > 0 ? urls : undefined)
    .then(() => {
      console.log('Performance audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Performance audit failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceAuditor;