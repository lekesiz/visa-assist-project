#!/usr/bin/env node

/**
 * Performance CI Integration
 * Automated performance checks for CI/CD pipelines
 */

const fs = require('fs');
const path = require('path');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

class PerformanceCI {
  constructor(options = {}) {
    this.thresholds = {
      performance: options.performanceThreshold || 90,
      fcp: options.fcpThreshold || 2000,
      lcp: options.lcpThreshold || 2500,
      cls: options.clsThreshold || 0.1,
      tti: options.ttiThreshold || 5000,
      bundleSize: options.bundleSizeThreshold || 1024 * 1024, // 1MB
      ...options.thresholds
    };
    
    this.config = {
      ci: true,
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      ...options.config
    };
  }

  async runPerformanceCheck(url = 'http://localhost:3000') {
    console.log(`🔍 Running performance check for ${url}...`);
    
    const results = {
      url,
      timestamp: new Date().toISOString(),
      passed: true,
      failures: [],
      metrics: {},
      score: 0
    };

    try {
      // Run Lighthouse audit
      const lighthouseResult = await this.runLighthouseAudit(url);
      results.metrics = lighthouseResult.metrics;
      results.score = lighthouseResult.score;

      // Check thresholds
      this.checkPerformanceThresholds(results, lighthouseResult);
      
      // Check bundle size
      await this.checkBundleSize(results);
      
      // Generate CI report
      await this.generateCIReport(results);
      
      // Log results
      this.logResults(results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
      results.passed = false;
      results.failures.push({
        type: 'audit-error',
        message: error.message
      });
      return results;
    }
  }

  async runLighthouseAudit(url) {
    const chrome = await chromeLauncher.launch({ 
      chromeFlags: this.config.chromeFlags 
    });
    
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        onlyCategories: ['performance'],
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      });

      await chrome.kill();

      const { lhr } = runnerResult;
      
      return {
        score: Math.round(lhr.categories.performance.score * 100),
        metrics: {
          firstContentfulPaint: lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lhr.audits['largest-contentful-paint'].numericValue,
          cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].numericValue,
          timeToInteractive: lhr.audits['interactive'].numericValue,
          speedIndex: lhr.audits['speed-index'].numericValue,
          totalBlockingTime: lhr.audits['total-blocking-time'].numericValue
        }
      };
    } catch (error) {
      await chrome.kill();
      throw error;
    }
  }

  checkPerformanceThresholds(results, lighthouseResult) {
    const checks = [
      {
        name: 'Performance Score',
        value: lighthouseResult.score,
        threshold: this.thresholds.performance,
        operator: '>='
      },
      {
        name: 'First Contentful Paint',
        value: lighthouseResult.metrics.firstContentfulPaint,
        threshold: this.thresholds.fcp,
        operator: '<='
      },
      {
        name: 'Largest Contentful Paint',
        value: lighthouseResult.metrics.largestContentfulPaint,
        threshold: this.thresholds.lcp,
        operator: '<='
      },
      {
        name: 'Cumulative Layout Shift',
        value: lighthouseResult.metrics.cumulativeLayoutShift,
        threshold: this.thresholds.cls,
        operator: '<='
      },
      {
        name: 'Time to Interactive',
        value: lighthouseResult.metrics.timeToInteractive,
        threshold: this.thresholds.tti,
        operator: '<='
      }
    ];

    checks.forEach(check => {
      const passed = this.evaluateThreshold(check.value, check.threshold, check.operator);
      
      if (!passed) {
        results.passed = false;
        results.failures.push({
          type: 'performance-threshold',
          metric: check.name,
          value: check.value,
          threshold: check.threshold,
          operator: check.operator
        });
      }
    });
  }

  async checkBundleSize(results) {
    try {
      const nextDir = path.join(process.cwd(), '.next');
      const staticDir = path.join(nextDir, 'static');
      
      if (!fs.existsSync(staticDir)) {
        results.failures.push({
          type: 'bundle-check',
          message: 'Build not found. Bundle size check skipped.'
        });
        return;
      }

      let totalSize = 0;
      
      // Calculate total size of JavaScript chunks
      const chunksDir = path.join(staticDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir);
        
        files.forEach(file => {
          if (file.endsWith('.js')) {
            const filePath = path.join(chunksDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        });
      }

      results.metrics.bundleSize = totalSize;
      
      if (totalSize > this.thresholds.bundleSize) {
        results.passed = false;
        results.failures.push({
          type: 'bundle-size',
          value: totalSize,
          threshold: this.thresholds.bundleSize,
          message: `Bundle size (${this.formatBytes(totalSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize)})`
        });
      }
      
    } catch (error) {
      results.failures.push({
        type: 'bundle-check',
        message: `Bundle size check failed: ${error.message}`
      });
    }
  }

  evaluateThreshold(value, threshold, operator) {
    switch (operator) {
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value == threshold;
      default: return false;
    }
  }

  async generateCIReport(results) {
    const reportDir = path.join(process.cwd(), 'performance-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // JSON report
    const jsonPath = path.join(reportDir, 'ci-performance-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

    // JUnit XML report for CI systems
    const junitXml = this.generateJUnitXML(results);
    const junitPath = path.join(reportDir, 'performance-junit.xml');
    fs.writeFileSync(junitPath, junitXml);

    // GitHub Actions summary
    if (process.env.GITHUB_ACTIONS) {
      await this.generateGitHubSummary(results);
    }
  }

  generateJUnitXML(results) {
    const failures = results.failures.map(failure => `
    <failure message="${this.escapeXml(failure.message || failure.metric)}" type="${failure.type}">
      ${this.escapeXml(JSON.stringify(failure, null, 2))}
    </failure>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite 
  name="Performance Tests" 
  tests="${Object.keys(results.metrics).length}" 
  failures="${results.failures.length}" 
  time="0">
  <testcase name="Performance Score" classname="lighthouse">
    ${results.score < this.thresholds.performance ? failures : ''}
  </testcase>
  <testcase name="Bundle Size" classname="webpack">
    ${results.failures.find(f => f.type === 'bundle-size') ? failures : ''}
  </testcase>
</testsuite>`;
  }

  async generateGitHubSummary(results) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryFile) return;

    const status = results.passed ? '✅ PASSED' : '❌ FAILED';
    const scoreEmoji = results.score >= 90 ? '🟢' : results.score >= 50 ? '🟡' : '🔴';
    
    const summary = `
# Performance Check Results ${status}

## Summary
- **Performance Score**: ${scoreEmoji} ${results.score}/100
- **URL**: ${results.url}
- **Timestamp**: ${results.timestamp}

## Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|---------|
| Performance Score | ${results.score} | ≥ ${this.thresholds.performance} | ${results.score >= this.thresholds.performance ? '✅' : '❌'} |
| First Contentful Paint | ${Math.round(results.metrics.firstContentfulPaint)}ms | ≤ ${this.thresholds.fcp}ms | ${results.metrics.firstContentfulPaint <= this.thresholds.fcp ? '✅' : '❌'} |
| Largest Contentful Paint | ${Math.round(results.metrics.largestContentfulPaint)}ms | ≤ ${this.thresholds.lcp}ms | ${results.metrics.largestContentfulPaint <= this.thresholds.lcp ? '✅' : '❌'} |
| Cumulative Layout Shift | ${results.metrics.cumulativeLayoutShift.toFixed(3)} | ≤ ${this.thresholds.cls} | ${results.metrics.cumulativeLayoutShift <= this.thresholds.cls ? '✅' : '❌'} |
| Time to Interactive | ${Math.round(results.metrics.timeToInteractive)}ms | ≤ ${this.thresholds.tti}ms | ${results.metrics.timeToInteractive <= this.thresholds.tti ? '✅' : '❌'} |
${results.metrics.bundleSize ? `| Bundle Size | ${this.formatBytes(results.metrics.bundleSize)} | ≤ ${this.formatBytes(this.thresholds.bundleSize)} | ${results.metrics.bundleSize <= this.thresholds.bundleSize ? '✅' : '❌'} |` : ''}

${results.failures.length > 0 ? `
## Failures
${results.failures.map(failure => `- **${failure.type}**: ${failure.message || failure.metric}`).join('\n')}
` : ''}
`;

    fs.appendFileSync(summaryFile, summary);
  }

  logResults(results) {
    console.log('\n📊 Performance Check Results:');
    console.log(`URL: ${results.url}`);
    console.log(`Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Performance Score: ${results.score}/100`);
    
    console.log('\n📈 Metrics:');
    console.log(`  FCP: ${Math.round(results.metrics.firstContentfulPaint)}ms`);
    console.log(`  LCP: ${Math.round(results.metrics.largestContentfulPaint)}ms`);
    console.log(`  CLS: ${results.metrics.cumulativeLayoutShift.toFixed(3)}`);
    console.log(`  TTI: ${Math.round(results.metrics.timeToInteractive)}ms`);
    
    if (results.metrics.bundleSize) {
      console.log(`  Bundle Size: ${this.formatBytes(results.metrics.bundleSize)}`);
    }

    if (results.failures.length > 0) {
      console.log('\n❌ Failures:');
      results.failures.forEach(failure => {
        console.log(`  - ${failure.type}: ${failure.message || failure.metric}`);
      });
    }

    console.log(`\n📁 Reports saved to: ${path.join(process.cwd(), 'performance-reports')}`);
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
  const url = process.argv[2] || 'http://localhost:3000';
  
  // Parse CLI options
  const options = {};
  process.argv.slice(3).forEach(arg => {
    if (arg.startsWith('--performance-threshold=')) {
      options.performanceThreshold = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--bundle-size-threshold=')) {
      options.bundleSizeThreshold = parseInt(arg.split('=')[1]);
    }
  });

  const ci = new PerformanceCI(options);
  
  ci.runPerformanceCheck(url)
    .then((results) => {
      process.exit(results.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Performance CI check failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceCI;