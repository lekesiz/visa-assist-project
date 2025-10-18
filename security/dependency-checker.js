#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

class DependencyChecker {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.vulnerabilities = [];
    this.outdatedPackages = [];
    this.licenses = [];
    
    // Known vulnerability databases
    this.vulnerabilityDB = {
      'lodash': {
        '< 4.17.21': 'Prototype pollution vulnerability',
        '< 4.17.20': 'Command injection vulnerability'
      },
      'minimist': {
        '< 1.2.6': 'Prototype pollution vulnerability'
      },
      'kind-of': {
        '< 6.0.3': 'Function constructor injection'
      },
      'axios': {
        '< 0.21.2': 'Server-side request forgery'
      },
      'node-forge': {
        '< 1.3.0': 'Signature verification bypass'
      },
      'express': {
        '< 4.17.3': 'Open redirect vulnerability'
      },
      'cors': {
        '< 2.8.5': 'Configuration bypass vulnerability'
      },
      'cookie-parser': {
        '< 1.4.6': 'Cookie parsing vulnerability'
      },
      'jsonwebtoken': {
        '< 8.5.1': 'Algorithm confusion attack'
      },
      'multer': {
        '< 1.4.4': 'File upload vulnerability'
      }
    };
    
    // Risky packages that should be reviewed
    this.riskyPackages = [
      'eval',
      'vm2',
      'serialize-javascript',
      'node-serialize',
      'funcster',
      'safe-eval'
    ];
    
    // Packages with known license issues
    this.problematicLicenses = [
      'GPL-3.0',
      'AGPL-3.0',
      'LGPL-3.0',
      'CC-BY-NC',
      'UNLICENSED'
    ];
  }

  async check() {
    console.log('🔍 Starting dependency security check...\n');
    
    await this.checkPackageJson();
    await this.checkPackageLock();
    await this.checkForRiskyPackages();
    await this.checkLicenses();
    await this.generateReport();
  }

  async checkPackageJson() {
    const packagePath = path.join(this.projectPath, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {},
      ...packageJson.peerDependencies || {},
      ...packageJson.optionalDependencies || {}
    };

    console.log(`📦 Checking ${Object.keys(allDeps).length} dependencies...\n`);

    // Check each dependency against vulnerability database
    Object.entries(allDeps).forEach(([pkg, version]) => {
      this.checkPackageVulnerability(pkg, version);
      this.checkPackageAge(pkg, version);
    });
  }

  async checkPackageLock() {
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    let lockFile = null;
    
    for (const file of lockFiles) {
      const filePath = path.join(this.projectPath, file);
      if (fs.existsSync(filePath)) {
        lockFile = file;
        break;
      }
    }

    if (!lockFile) {
      this.addVulnerability({
        package: 'lockfile',
        severity: 'MEDIUM',
        description: 'No package lock file found',
        recommendation: 'Use npm install, yarn install, or pnpm install to generate a lock file'
      });
      return;
    }

    console.log(`🔒 Lock file found: ${lockFile}`);
    
    // Additional checks for npm package-lock.json
    if (lockFile === 'package-lock.json') {
      await this.checkNpmLockFile();
    }
  }

  async checkNpmLockFile() {
    const lockPath = path.join(this.projectPath, 'package-lock.json');
    const lockJson = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    
    // Check for integrity issues
    if (lockJson.lockfileVersion < 2) {
      this.addVulnerability({
        package: 'package-lock.json',
        severity: 'LOW',
        description: 'Old lockfile version detected',
        recommendation: 'Update to npm 7+ for better security features'
      });
    }

    // Check nested dependencies
    if (lockJson.packages) {
      const packageCount = Object.keys(lockJson.packages).length;
      console.log(`🔍 Scanning ${packageCount} packages (including nested dependencies)...`);
      
      Object.entries(lockJson.packages).forEach(([pkgPath, pkgInfo]) => {
        if (pkgPath === '') return; // Root package
        
        const pkgName = pkgPath.split('node_modules/').pop();
        if (pkgInfo.version) {
          this.checkPackageVulnerability(pkgName, pkgInfo.version);
        }
      });
    }
  }

  checkPackageVulnerability(packageName, version) {
    const vulnInfo = this.vulnerabilityDB[packageName];
    if (!vulnInfo) return;

    Object.entries(vulnInfo).forEach(([versionRange, description]) => {
      if (this.isVersionVulnerable(version, versionRange)) {
        this.addVulnerability({
          package: packageName,
          version: version,
          severity: 'HIGH',
          description: description,
          versionRange: versionRange,
          recommendation: `Update ${packageName} to a version outside the vulnerable range`
        });
      }
    });
  }

  checkPackageAge(packageName, version) {
    // This is a simplified check - in a real implementation, 
    // you would query npm registry for package information
    const versionClean = version.replace(/[^0-9.]/g, '');
    const parts = versionClean.split('.');
    const major = parseInt(parts[0] || '0');
    
    // Flag very old major versions as potentially outdated
    if (major === 0) {
      this.outdatedPackages.push({
        package: packageName,
        version: version,
        severity: 'MEDIUM',
        description: 'Package is in pre-1.0 version',
        recommendation: 'Consider if this package is still maintained'
      });
    }
  }

  async checkForRiskyPackages() {
    const packagePath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };

    this.riskyPackages.forEach(riskyPkg => {
      if (allDeps[riskyPkg]) {
        this.addVulnerability({
          package: riskyPkg,
          version: allDeps[riskyPkg],
          severity: 'HIGH',
          description: 'Potentially dangerous package that can execute arbitrary code',
          recommendation: `Review usage of ${riskyPkg} and consider safer alternatives`
        });
      }
    });
  }

  async checkLicenses() {
    console.log('📄 Checking package licenses...\n');
    
    // This is simplified - in a real implementation, you would
    // traverse node_modules and read package.json files to get actual licenses
    const packagePath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check project license
    if (packageJson.license) {
      if (this.problematicLicenses.includes(packageJson.license)) {
        this.licenses.push({
          package: packageJson.name || 'project',
          license: packageJson.license,
          severity: 'MEDIUM',
          description: 'Potentially problematic license for commercial use'
        });
      }
    } else {
      this.licenses.push({
        package: packageJson.name || 'project',
        license: 'Unknown',
        severity: 'LOW',
        description: 'No license specified'
      });
    }
  }

  isVersionVulnerable(currentVersion, vulnerableRange) {
    // Simplified version comparison
    // Real implementation would use semver library
    const cleanCurrent = currentVersion.replace(/[^0-9.]/g, '');
    const cleanRange = vulnerableRange.replace(/[<>=\s]/g, '');
    
    if (vulnerableRange.startsWith('<')) {
      return this.compareVersions(cleanCurrent, cleanRange) < 0;
    }
    
    return false;
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  addVulnerability(vuln) {
    this.vulnerabilities.push(vuln);
  }

  async generateReport() {
    console.log('📊 DEPENDENCY SECURITY REPORT');
    console.log('='.repeat(50));
    console.log(`Vulnerabilities Found: ${this.vulnerabilities.length}`);
    console.log(`Outdated Packages: ${this.outdatedPackages.length}`);
    console.log(`License Issues: ${this.licenses.length}`);
    console.log('='.repeat(50));

    // Vulnerabilities
    if (this.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILITIES');
      console.log('-'.repeat(30));
      
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.package}@${vuln.version || 'unknown'}`);
        console.log(`   Severity: ${vuln.severity}`);
        console.log(`   Issue: ${vuln.description}`);
        if (vuln.versionRange) {
          console.log(`   Vulnerable Range: ${vuln.versionRange}`);
        }
        console.log(`   Fix: ${vuln.recommendation}`);
        console.log('');
      });
    }

    // Outdated packages
    if (this.outdatedPackages.length > 0) {
      console.log('\n📅 OUTDATED PACKAGES');
      console.log('-'.repeat(30));
      
      this.outdatedPackages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.package}@${pkg.version}`);
        console.log(`   Issue: ${pkg.description}`);
        console.log(`   Recommendation: ${pkg.recommendation}`);
        console.log('');
      });
    }

    // License issues
    if (this.licenses.length > 0) {
      console.log('\n📄 LICENSE ISSUES');
      console.log('-'.repeat(30));
      
      this.licenses.forEach((license, index) => {
        console.log(`${index + 1}. ${license.package}`);
        console.log(`   License: ${license.license}`);
        console.log(`   Issue: ${license.description}`);
        console.log('');
      });
    }

    // Generate recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(25));
    console.log('1. Run "npm audit" for additional vulnerability scanning');
    console.log('2. Use "npm audit fix" to automatically fix issues');
    console.log('3. Consider using "npm outdated" to check for updates');
    console.log('4. Implement Dependabot or similar for automated updates');
    console.log('5. Regular security audits of dependencies');
    console.log('6. Use lock files to ensure consistent installations');
    console.log('7. Review licenses for compliance with your project');

    // Save detailed report
    await this.saveReport();
  }

  async saveReport() {
    const report = {
      scanDate: new Date().toISOString(),
      summary: {
        vulnerabilities: this.vulnerabilities.length,
        outdatedPackages: this.outdatedPackages.length,
        licenseIssues: this.licenses.length
      },
      vulnerabilities: this.vulnerabilities,
      outdatedPackages: this.outdatedPackages,
      licenses: this.licenses,
      recommendations: [
        'Update vulnerable packages immediately',
        'Implement automated dependency scanning',
        'Regular security audits',
        'Use lock files for consistent builds',
        'Monitor for new vulnerabilities'
      ]
    };

    const reportPath = path.join(this.projectPath, 'security', 'dependency-report.json');
    
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
  const checker = new DependencyChecker(projectPath);
  checker.check().catch(console.error);
}

module.exports = DependencyChecker;