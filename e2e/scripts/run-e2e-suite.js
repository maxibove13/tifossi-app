#!/usr/bin/env node

/**
 * Comprehensive E2E Test Suite Runner for Tifossi
 *
 * This script orchestrates the complete E2E test suite execution
 * with proper setup, cleanup, and reporting.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
  constructor() {
    this.config = {
      testSuites: [
        {
          name: 'App Stability',
          file: 'app-stability.test.js',
          timeout: 300000, // 5 minutes
          critical: true,
          description: 'Cold starts, warm starts, memory management, crash recovery',
        },
        {
          name: 'Authentication Flow',
          file: 'auth.test.js',
          timeout: 240000, // 4 minutes
          critical: true,
          description: 'Login, registration, biometrics, session management',
        },
        {
          name: 'Shopping Flow',
          file: 'shopping.test.js',
          timeout: 300000, // 5 minutes
          critical: true,
          description: 'Product browsing, cart, favorites, search functionality',
        },
        {
          name: 'Checkout Process',
          file: 'checkout.test.js',
          timeout: 360000, // 6 minutes
          critical: true,
          description: 'Full checkout flow, payment, order placement',
        },
        {
          name: 'Deep Linking',
          file: 'deep-linking.test.js',
          timeout: 180000, // 3 minutes
          critical: false,
          description: 'Product links, auth links, promotional campaigns',
        },
        {
          name: 'Push Notifications',
          file: 'push-notifications.test.js',
          timeout: 240000, // 4 minutes
          critical: false,
          description: 'Notification delivery, permissions, interaction',
        },
        {
          name: 'Performance Testing',
          file: 'performance.test.js',
          timeout: 480000, // 8 minutes
          critical: false,
          description: 'Startup time, navigation speed, memory usage',
        },
        {
          name: 'Network Conditions',
          file: 'network-conditions.test.js',
          timeout: 420000, // 7 minutes
          critical: false,
          description: 'Offline support, slow network, network interruption',
        },
        {
          name: 'Device Compatibility',
          file: 'device-compatibility.test.js',
          timeout: 300000, // 5 minutes
          critical: false,
          description: 'Orientations, screen sizes, platform differences',
        },
      ],
      platforms: ['ios.sim.debug', 'android.emu.debug'],
      retryCount: 2,
      reportDir: './e2e/reports',
      artifactDir: './e2e/artifacts',
    };

    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      startTime: null,
      endTime: null,
      totalDuration: 0,
    };
  }

  async run(options = {}) {
    const {
      suites = null, // Run specific suites only
      platforms = this.config.platforms,
      criticalOnly = false,
      skipCleanup = false,
      generateReport = true,
    } = options;

    console.log('🚀 Starting Tifossi E2E Test Suite');
    console.log('=====================================');

    this.results.startTime = new Date();

    try {
      // Setup test environment
      await this.setupEnvironment();

      // Determine which test suites to run
      const suitesToRun = this.getSuitesToRun(suites, criticalOnly);

      console.log(
        `\n📋 Running ${suitesToRun.length} test suites on ${platforms.length} platform(s)`
      );

      // Run tests on each platform
      for (const platform of platforms) {
        console.log(`\n🎯 Testing on ${platform}`);
        console.log('─'.repeat(50));

        await this.runPlatformTests(platform, suitesToRun);
      }

      this.results.endTime = new Date();
      this.results.totalDuration = this.results.endTime - this.results.startTime;

      // Generate reports
      if (generateReport) {
        await this.generateReports();
      }

      // Cleanup
      if (!skipCleanup) {
        await this.cleanup();
      }

      // Print summary
      this.printSummary();

      // Exit with appropriate code
      const hasFailures = this.results.failed.length > 0;
      const hasCriticalFailures = this.results.failed.some((f) => f.critical);

      if (hasCriticalFailures) {
        console.log('\n❌ Critical test failures detected!');
        process.exit(1);
      } else if (hasFailures) {
        console.log('\n⚠️  Some non-critical tests failed');
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed successfully!');
        process.exit(0);
      }
    } catch (error) {
      console.error('\n💥 Test suite execution failed:', error.message);
      process.exit(1);
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up test environment...');

    // Ensure report directories exist
    this.ensureDirectoryExists(this.config.reportDir);
    this.ensureDirectoryExists(this.config.artifactDir);

    // Check if Detox is properly configured
    this.validateDetoxSetup();

    // Build apps if needed
    await this.buildAppsIfNeeded();

    console.log('✅ Environment setup complete');
  }

  getSuitesToRun(suiteNames, criticalOnly) {
    let suites = this.config.testSuites;

    if (criticalOnly) {
      suites = suites.filter((s) => s.critical);
    }

    if (suiteNames && suiteNames.length > 0) {
      suites = suites.filter((s) =>
        suiteNames.some(
          (name) => s.name.toLowerCase().includes(name.toLowerCase()) || s.file.includes(name)
        )
      );
    }

    return suites;
  }

  async runPlatformTests(platform, testSuites) {
    for (const suite of testSuites) {
      console.log(`\n📝 Running: ${suite.name}`);
      console.log(`   📄 File: ${suite.file}`);
      console.log(`   ⏱️  Timeout: ${suite.timeout / 1000}s`);
      console.log(`   🔥 Critical: ${suite.critical ? 'Yes' : 'No'}`);
      console.log(`   📖 ${suite.description}`);

      const result = await this.runSingleTest(platform, suite);

      if (result.success) {
        console.log(`   ✅ PASSED (${result.duration / 1000}s)`);
        this.results.passed.push({
          ...suite,
          platform,
          duration: result.duration,
          output: result.output,
        });
      } else {
        console.log(`   ❌ FAILED (${result.duration / 1000}s)`);
        console.log(`   Error: ${result.error}`);

        this.results.failed.push({
          ...suite,
          platform,
          duration: result.duration,
          error: result.error,
          output: result.output,
        });

        // If it's a critical test, consider stopping
        if (suite.critical && process.env.FAIL_FAST === 'true') {
          throw new Error(`Critical test failed: ${suite.name}`);
        }
      }
    }
  }

  async runSingleTest(platform, suite) {
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount <= this.config.retryCount) {
      try {
        const output = await this.executeDetoxTest(platform, suite);

        return {
          success: true,
          duration: Date.now() - startTime,
          output,
          retryCount,
        };
      } catch (error) {
        retryCount++;

        if (retryCount <= this.config.retryCount) {
          console.log(`   🔄 Retry ${retryCount}/${this.config.retryCount}`);

          // Clean up before retry
          await this.cleanupForRetry(platform);
        } else {
          return {
            success: false,
            duration: Date.now() - startTime,
            error: error.message,
            output: error.output || '',
            retryCount: retryCount - 1,
          };
        }
      }
    }
  }

  async executeDetoxTest(platform, suite) {
    return new Promise((resolve, reject) => {
      const testPath = path.join('e2e/tests', suite.file);

      const detoxCommand = [
        'detox',
        'test',
        '--configuration',
        platform,
        '--testNamePattern',
        `"${suite.name}"`,
        '--maxWorkers',
        '1',
        '--forceExit',
        '--detectOpenHandles',
        testPath,
      ];

      const proc = spawn('npx', detoxCommand, {
        stdio: 'pipe',
        timeout: suite.timeout,
      });

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          const error = new Error(`Test failed with exit code ${code}`);
          error.output = output + errorOutput;
          reject(error);
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new Error(`Test timed out after ${suite.timeout / 1000}s`));
      }, suite.timeout);

      proc.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  async buildAppsIfNeeded() {
    console.log('🏗️  Building apps if needed...');

    // Check if builds exist and are recent
    const buildPaths = {
      'ios.sim.debug': 'ios/build/Build/Products/Debug-iphonesimulator/tifossi.app',
      'android.emu.debug': 'android/app/build/outputs/apk/debug/app-debug.apk',
    };

    for (const [platform, buildPath] of Object.entries(buildPaths)) {
      if (!fs.existsSync(buildPath) || this.isBuildStale(buildPath)) {
        console.log(`   Building ${platform}...`);

        try {
          execSync(`npx detox build --configuration ${platform}`, {
            stdio: 'inherit',
            timeout: 600000, // 10 minutes
          });
        } catch (error) {
          throw new Error(`Failed to build ${platform}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${platform} build is up to date`);
      }
    }
  }

  isBuildStale(buildPath) {
    try {
      const buildTime = fs.statSync(buildPath).mtime;
      const currentTime = new Date();
      const hoursSinceBuild = (currentTime - buildTime) / (1000 * 60 * 60);

      // Consider build stale if older than 24 hours
      return hoursSinceBuild > 24;
    } catch (error) {
      return true; // If we can't check, assume stale
    }
  }

  async cleanupForRetry(platform) {
    console.log('   🧹 Cleaning up for retry...');

    try {
      // Reset app state
      execSync(`npx detox reset-locks`, { stdio: 'pipe' });

      // Clean up simulator/emulator
      if (platform.includes('ios')) {
        execSync('xcrun simctl shutdown all', { stdio: 'pipe' });
        execSync('xcrun simctl erase all', { stdio: 'pipe' });
      } else if (platform.includes('android')) {
        execSync('adb shell pm clear com.tifossi', { stdio: 'pipe' });
      }
    } catch (error) {
      console.log(`     Warning: Cleanup failed: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');

    try {
      // Shutdown simulators/emulators
      execSync('xcrun simctl shutdown all', { stdio: 'pipe' });

      // Clean up Detox
      execSync('npx detox reset-locks', { stdio: 'pipe' });
    } catch (error) {
      console.log(`Warning: Cleanup failed: ${error.message}`);
    }
  }

  async generateReports() {
    console.log('📊 Generating test reports...');

    const reportData = {
      summary: {
        total:
          this.results.passed.length + this.results.failed.length + this.results.skipped.length,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        skipped: this.results.skipped.length,
        duration: this.results.totalDuration,
        startTime: this.results.startTime,
        endTime: this.results.endTime,
      },
      results: {
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
      },
    };

    // Generate JSON report
    const jsonReportPath = path.join(this.config.reportDir, 'e2e-results.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(reportData);

    console.log(`✅ Reports generated in ${this.config.reportDir}`);
  }

  async generateHtmlReport(reportData) {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Tifossi E2E Test Report</title>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #666; font-size: 12px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .suite-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd; }
        .suite-name { font-weight: bold; margin-bottom: 5px; }
        .suite-description { color: #666; font-size: 14px; }
        .test-result { padding: 10px 15px; border-left: 4px solid; }
        .test-result.passed { border-color: #28a745; background: #f8fff9; }
        .test-result.failed { border-color: #dc3545; background: #fff8f8; }
        .test-details { font-size: 12px; color: #666; margin-top: 5px; }
        .error-message { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Tifossi E2E Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${reportData.summary.total}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value passed">${reportData.summary.passed}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${reportData.summary.failed}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(reportData.summary.duration / 1000 / 60).toFixed(1)}m</div>
            <div class="metric-label">Duration</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${this.generateSuiteResults(reportData.results)}
</body>
</html>`;

    const htmlReportPath = path.join(this.config.reportDir, 'e2e-report.html');
    fs.writeFileSync(htmlReportPath, htmlTemplate);
  }

  generateSuiteResults(results) {
    const allResults = [...results.passed, ...results.failed, ...results.skipped];
    const suiteGroups = this.groupByTestSuite(allResults);

    return Object.entries(suiteGroups)
      .map(([suiteName, tests]) => {
        const suite = this.config.testSuites.find((s) => s.name === suiteName);
        const hasFailures = tests.some((t) => results.failed.includes(t));

        return `
        <div class="test-suite">
            <div class="suite-header">
                <div class="suite-name">${suiteName}</div>
                <div class="suite-description">${suite?.description || ''}</div>
            </div>
            ${tests
              .map(
                (test) => `
                <div class="test-result ${results.failed.includes(test) ? 'failed' : 'passed'}">
                    <strong>${test.platform}</strong>
                    <div class="test-details">
                        Duration: ${(test.duration / 1000).toFixed(1)}s
                        ${test.retryCount ? `| Retries: ${test.retryCount}` : ''}
                    </div>
                    ${test.error ? `<div class="error-message">${test.error}</div>` : ''}
                </div>
            `
              )
              .join('')}
        </div>
      `;
      })
      .join('');
  }

  groupByTestSuite(results) {
    return results.reduce((groups, result) => {
      const suiteName = result.name;
      if (!groups[suiteName]) {
        groups[suiteName] = [];
      }
      groups[suiteName].push(result);
      return groups;
    }, {});
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${this.results.passed.length + this.results.failed.length}`);
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`⏱️  Duration: ${(this.results.totalDuration / 1000 / 60).toFixed(1)} minutes`);

    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach((test) => {
        console.log(`   • ${test.name} (${test.platform})`);
        if (test.error) {
          console.log(`     Error: ${test.error.split('\n')[0]}`);
        }
      });
    }

    console.log(`\n📁 Reports available in: ${this.config.reportDir}`);
    console.log(`📁 Artifacts available in: ${this.config.artifactDir}`);
  }

  validateDetoxSetup() {
    const detoxConfigPath = path.join(process.cwd(), '.detoxrc.js');
    if (!fs.existsSync(detoxConfigPath)) {
      throw new Error('Detox configuration not found. Please ensure .detoxrc.js exists.');
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--suites':
        options.suites = args[++i].split(',');
        break;
      case '--platforms':
        options.platforms = args[++i].split(',');
        break;
      case '--critical-only':
        options.criticalOnly = true;
        break;
      case '--skip-cleanup':
        options.skipCleanup = true;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--help':
        console.log(`
Tifossi E2E Test Suite Runner

Usage: node run-e2e-suite.js [options]

Options:
  --suites <list>       Comma-separated list of test suites to run
  --platforms <list>    Comma-separated list of platforms (ios.sim.debug,android.emu.debug)
  --critical-only       Run only critical test suites
  --skip-cleanup        Skip cleanup after tests
  --no-report          Skip report generation
  --help               Show this help message

Examples:
  node run-e2e-suite.js --critical-only
  node run-e2e-suite.js --suites "auth,checkout" --platforms "ios.sim.debug"
  node run-e2e-suite.js --suites "performance" --skip-cleanup
        `);
        process.exit(0);
    }
  }

  const runner = new E2ETestRunner();
  runner.run(options).catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner;
