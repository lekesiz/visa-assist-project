#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes webpack bundles and generates performance reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'performance-reports');
    this.bundleDir = path.join(process.cwd(), '.next/analyze');
    this.reportFile = path.join(this.outputDir, 'bundle-analysis.json');
  }

  async analyze() {
    console.log('🔍 Starting bundle analysis...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    try {
      // Build with bundle analyzer
      console.log('📦 Building with bundle analyzer...');
      execSync('ANALYZE=true npm run build', { 
        stdio: 'inherit',
        env: { ...process.env, ANALYZE: 'true' }
      });

      // Analyze bundle sizes
      const analysis = await this.analyzeBundleSizes();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);
      
      // Create report
      const report = {
        timestamp: new Date().toISOString(),
        analysis,
        recommendations,
        summary: this.generateSummary(analysis)
      };

      // Save report
      fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
      
      // Generate HTML report
      await this.generateHTMLReport(report);
      
      console.log('✅ Bundle analysis complete!');
      console.log(`📊 Reports saved to: ${this.outputDir}`);
      
      return report;
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      throw error;
    }
  }

  async analyzeBundleSizes() {
    const nextDir = path.join(process.cwd(), '.next');
    const staticDir = path.join(nextDir, 'static');
    
    const analysis = {
      pages: {},
      chunks: {},
      assets: {},
      totalSize: 0
    };

    if (!fs.existsSync(staticDir)) {
      throw new Error('.next/static directory not found. Build the project first.');
    }

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
            sizeFormatted: this.formatBytes(stats.size),
            type: this.getChunkType(file)
          };
          
          analysis.totalSize += stats.size;
        }
      }
    }

    // Analyze pages
    const pagesDir = path.join(staticDir, 'webpack');
    if (fs.existsSync(pagesDir)) {
      this.analyzeDirectory(pagesDir, analysis, 'pages');
    }

    // Analyze CSS
    const cssDir = path.join(staticDir, 'css');
    if (fs.existsSync(cssDir)) {
      this.analyzeDirectory(cssDir, analysis, 'css');
    }

    // Analyze media
    const mediaDir = path.join(staticDir, 'media');
    if (fs.existsSync(mediaDir)) {
      this.analyzeDirectory(mediaDir, analysis, 'media');
    }

    return analysis;
  }

  analyzeDirectory(dir, analysis, type) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        analysis.assets[`${type}/${file}`] = {
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          type
        };
        
        analysis.totalSize += stats.size;
      } else if (stats.isDirectory()) {
        this.analyzeDirectory(filePath, analysis, `${type}/${file}`);
      }
    }
  }

  getChunkType(filename) {
    if (filename.includes('vendors')) return 'vendor';
    if (filename.includes('react')) return 'react';
    if (filename.includes('ui')) return 'ui';
    if (filename.includes('framework')) return 'framework';
    if (filename.includes('main')) return 'main';
    if (filename.includes('runtime')) return 'runtime';
    return 'other';
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Check for large chunks
    Object.entries(analysis.chunks).forEach(([file, info]) => {
      if (info.size > 500000) { // 500KB
        recommendations.push({
          type: 'warning',
          category: 'bundle-size',
          message: `Large chunk detected: ${file} (${info.sizeFormatted})`,
          suggestion: 'Consider code splitting or lazy loading this chunk',
          priority: 'high'
        });
      }
    });

    // Check total bundle size
    if (analysis.totalSize > 2000000) { // 2MB
      recommendations.push({
        type: 'error',
        category: 'total-size',
        message: `Total bundle size is large: ${this.formatBytes(analysis.totalSize)}`,
        suggestion: 'Implement aggressive code splitting and remove unused dependencies',
        priority: 'critical'
      });
    }

    // Check for duplicate chunks
    const chunkNames = Object.keys(analysis.chunks);
    const duplicates = this.findDuplicateChunks(chunkNames);
    
    if (duplicates.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'duplicates',
        message: `Potential duplicate chunks found: ${duplicates.join(', ')}`,
        suggestion: 'Review webpack configuration to prevent duplicate chunks',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  findDuplicateChunks(chunkNames) {
    const seen = new Set();
    const duplicates = [];
    
    chunkNames.forEach(name => {
      const normalized = name.replace(/\.[a-f0-9]+\./, '.').replace(/\.js$/, '');
      if (seen.has(normalized)) {
        duplicates.push(name);
      } else {
        seen.add(normalized);
      }
    });
    
    return duplicates;
  }

  generateSummary(analysis) {
    const chunkSizes = Object.values(analysis.chunks).map(c => c.size);
    
    return {
      totalSize: this.formatBytes(analysis.totalSize),
      totalChunks: Object.keys(analysis.chunks).length,
      largestChunk: this.formatBytes(Math.max(...chunkSizes, 0)),
      averageChunkSize: this.formatBytes(chunkSizes.length > 0 ? chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length : 0),
      recommendations: analysis.recommendations?.length || 0
    };
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
        .metric-label { color: #666; margin-top: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .table th { background: #f8f9fa; font-weight: 600; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 6px; }
        .recommendation.error { background: #fff5f5; border-left: 4px solid #e53e3e; }
        .recommendation.warning { background: #fffbeb; border-left: 4px solid #d69e2e; }
        .recommendation.info { background: #f0f9ff; border-left: 4px solid #3182ce; }
        .priority { padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .priority.critical { background: #e53e3e; color: white; }
        .priority.high { background: #d69e2e; color: white; }
        .priority.medium { background: #3182ce; color: white; }
        .priority.low { background: #38a169; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bundle Analysis Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        
        <h2>Summary</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.summary.totalSize}</div>
                <div class="metric-label">Total Bundle Size</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.totalChunks}</div>
                <div class="metric-label">Total Chunks</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.largestChunk}</div>
                <div class="metric-label">Largest Chunk</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.averageChunkSize}</div>
                <div class="metric-label">Average Chunk Size</div>
            </div>
        </div>

        <h2>Chunks Analysis</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Chunk</th>
                    <th>Size</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.analysis.chunks)
                  .sort(([,a], [,b]) => b.size - a.size)
                  .map(([name, info]) => `
                    <tr>
                        <td>${name}</td>
                        <td>${info.sizeFormatted}</td>
                        <td>${info.type}</td>
                    </tr>
                  `).join('')}
            </tbody>
        </table>

        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.type}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${rec.category.toUpperCase()}</strong>
                    <span class="priority ${rec.priority}">${rec.priority.toUpperCase()}</span>
                </div>
                <p>${rec.message}</p>
                <p><strong>Suggestion:</strong> ${rec.suggestion}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(this.outputDir, 'bundle-analysis.html');
    fs.writeFileSync(htmlPath, htmlContent);
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
  const analyzer = new BundleAnalyzer();
  
  analyzer.analyze()
    .then(() => {
      console.log('Bundle analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bundle analysis failed:', error);
      process.exit(1);
    });
}

module.exports = BundleAnalyzer;