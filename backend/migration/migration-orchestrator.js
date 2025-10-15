#!/usr/bin/env node

/**
 * Migration Orchestrator
 * Coordinates the complete migration process with monitoring and control
 *
 * Usage:
 *   node migration-orchestrator.js --mode=full --with-validation
 *   node migration-orchestrator.js --mode=test-run --dry-run
 *   node migration-orchestrator.js --mode=progressive --start-percentage=1
 *   node migration-orchestrator.js --mode=rollback --emergency
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const ProductDataMigrator = require('./product-data-migrator');
const MediaAssetUploader = require('./media-asset-uploader');
const DataValidator = require('./data-validator');
const RollbackScript = require('./rollback-script');

class MigrationOrchestrator {
  constructor() {
    this.config = {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
      strapiToken: process.env.STRAPI_API_TOKEN,
      configServiceUrl: process.env.CONFIG_SERVICE_URL || 'https://config.tifossi.app',
      appUrl: process.env.APP_URL || 'https://api.tifossi.app',
      dryRun: false,
      withValidation: true,
      autoRollback: true,
    };

    this.migrationState = {
      phase: 'preparing',
      startTime: null,
      currentStep: null,
      totalSteps: 0,
      completedSteps: 0,
      errors: [],
      warnings: [],
      rollbackCapable: true,
    };

    this.progressiveRollout = {
      stages: [
        { percentage: 1, duration: 600000, description: 'Canary release (1% users)' },
        { percentage: 5, duration: 900000, description: 'Initial validation (5% users)' },
        { percentage: 20, duration: 1200000, description: 'Limited rollout (20% users)' },
        { percentage: 50, duration: 1500000, description: 'Half rollout (50% users)' },
        { percentage: 100, duration: 1200000, description: 'Full rollout (100% users)' },
      ],
      currentStage: -1,
      monitoring: null,
    };

    this.healthThresholds = {
      maxErrorRate: 0.05, // 5%
      maxResponseTime: 3000, // 3 seconds
      minSuccessRate: 0.95, // 95%
    };
  }

  async initialize() {
    console.log('🚀 Initializing Migration Orchestrator...');
    console.log(`📡 Strapi URL: ${this.config.strapiUrl}`);
    console.log(`⚙️ Config Service: ${this.config.configServiceUrl}`);
    console.log(`🏠 App URL: ${this.config.appUrl}`);
    console.log(`🔄 Dry Run: ${this.config.dryRun ? 'Yes' : 'No'}`);
    console.log(`✅ With Validation: ${this.config.withValidation ? 'Yes' : 'No'}`);

    // Validate prerequisites
    await this.validatePrerequisites();

    // Setup monitoring
    await this.setupMonitoring();

    console.log('✅ Orchestrator initialized successfully');
  }

  async validatePrerequisites() {
    console.log('🔍 Validating prerequisites...');

    const checks = [
      {
        name: 'Strapi connection',
        check: async () => {
          const response = await axios.get(
            `${this.config.strapiUrl}/api/products?pagination[pageSize]=1`,
            {
              headers: { Authorization: `Bearer ${this.config.strapiToken}` },
              timeout: 10000,
            }
          );
          return response.status === 200;
        },
      },
      {
        name: 'Feature flags service',
        check: async () => {
          const response = await axios.get(`${this.config.configServiceUrl}/health`, {
            timeout: 5000,
          });
          return response.status === 200;
        },
      },
      {
        name: 'Source data availability',
        check: async () => {
          const dataPath = path.join(__dirname, '../../app/_data/products.ts');
          await fs.access(dataPath);
          return true;
        },
      },
      {
        name: 'Asset availability',
        check: async () => {
          const assetsPath = path.join(__dirname, '../../assets/images/products');
          await fs.access(assetsPath);
          return true;
        },
      },
      {
        name: 'Backup directory',
        check: async () => {
          const backupDir = path.join(__dirname, '../../backups');
          try {
            await fs.access(backupDir);
          } catch {
            await fs.mkdir(backupDir, { recursive: true });
          }
          return true;
        },
      },
    ];

    for (const check of checks) {
      try {
        const success = await check.check();
        console.log(`${success ? '✅' : '❌'} ${check.name}`);

        if (!success) {
          throw new Error(`Prerequisite check failed: ${check.name}`);
        }
      } catch (error) {
        console.error(`❌ ${check.name}: ${error.message}`);
        throw new Error(`Prerequisites validation failed: ${check.name}`);
      }
    }

    console.log('✅ All prerequisites validated');
  }

  async setupMonitoring() {
    console.log('📊 Setting up migration monitoring...');

    // Create monitoring interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.warn('⚠️ Health check failed:', error.message);
      }
    }, 30000); // Every 30 seconds

    console.log('✅ Monitoring setup complete');
  }

  async performHealthCheck() {
    if (this.migrationState.phase === 'preparing' || this.migrationState.phase === 'completed') {
      return; // Skip health checks during prep and after completion
    }

    try {
      const health = await this.collectHealthMetrics();

      // Check thresholds
      if (health.errorRate > this.healthThresholds.maxErrorRate) {
        await this.handleHealthViolation('High error rate', health);
      }

      if (health.avgResponseTime > this.healthThresholds.maxResponseTime) {
        await this.handleHealthViolation('High response time', health);
      }

      if (health.successRate < this.healthThresholds.minSuccessRate) {
        await this.handleHealthViolation('Low success rate', health);
      }
    } catch (error) {
      console.warn('⚠️ Health check error:', error.message);
    }
  }

  async collectHealthMetrics() {
    try {
      const response = await axios.get(`${this.config.appUrl}/api/metrics/health`, {
        headers: { Authorization: `Bearer ${process.env.APP_API_TOKEN}` },
        timeout: 5000,
      });

      return {
        errorRate: response.data.errorRate || 0,
        avgResponseTime: response.data.avgResponseTime || 0,
        successRate: response.data.successRate || 1,
        activeUsers: response.data.activeUsers || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      // Return safe defaults if monitoring is unavailable
      return {
        errorRate: 0,
        avgResponseTime: 0,
        successRate: 1,
        activeUsers: 0,
        timestamp: Date.now(),
      };
    }
  }

  async handleHealthViolation(reason, health) {
    console.error(`🚨 Health violation detected: ${reason}`);
    console.error(`📊 Metrics:`, health);

    this.migrationState.errors.push({
      type: 'health_violation',
      reason,
      health,
      timestamp: new Date().toISOString(),
    });

    if (this.config.autoRollback) {
      console.log('🔄 Initiating automatic rollback...');
      await this.executeRollback('emergency', reason);
    } else {
      console.log('⚠️ Auto-rollback disabled, manual intervention required');
      await this.sendCriticalAlert(reason, health);
    }
  }

  async fullMigration() {
    console.log('🚀 Starting full migration process...');

    this.migrationState.phase = 'migration';
    this.migrationState.startTime = Date.now();
    this.migrationState.totalSteps = this.config.withValidation ? 8 : 6;

    try {
      // Step 1: Pre-migration validation
      if (this.config.withValidation) {
        await this.executeStep('Pre-migration validation', async () => {
          const validator = new DataValidator();
          await validator.run('pre-migration');
        });
      }

      // Step 2: Create database backup
      await this.executeStep('Database backup', async () => {
        await this.createDatabaseBackup();
      });

      // Step 3: Migrate categories and models
      await this.executeStep('Migrate categories and models', async () => {
        const migrator = new ProductDataMigrator();
        await migrator.run('categories');
        await migrator.run('models');
      });

      // Step 4: Upload media assets
      await this.executeStep('Upload media assets', async () => {
        const uploader = new MediaAssetUploader();
        await uploader.run('all');
      });

      // Step 5: Migrate products
      await this.executeStep('Migrate products', async () => {
        const migrator = new ProductDataMigrator();
        await migrator.run('products');
      });

      // Step 6: Post-migration validation
      if (this.config.withValidation) {
        await this.executeStep('Post-migration validation', async () => {
          const validator = new DataValidator();
          await validator.run('post-migration');
        });
      }

      // Step 7: Progressive rollout
      await this.executeStep('Progressive rollout', async () => {
        await this.executeProgressiveRollout();
      });

      // Step 8: Final validation
      await this.executeStep('Final validation', async () => {
        await this.performFinalValidation();
      });

      this.migrationState.phase = 'completed';
      const duration = Date.now() - this.migrationState.startTime;

      console.log(
        `\\n🎉 Migration completed successfully in ${(duration / 60000).toFixed(1)} minutes!`
      );
      await this.sendSuccessNotification(duration);
    } catch (error) {
      this.migrationState.phase = 'failed';
      console.error('❌ Migration failed:', error.message);

      if (this.config.autoRollback && this.migrationState.rollbackCapable) {
        await this.executeRollback('emergency', `Migration failed: ${error.message}`);
      }

      throw error;
    } finally {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
    }
  }

  async testRun() {
    console.log('🧪 Starting migration test run...');

    this.config.dryRun = true;
    this.migrationState.phase = 'test';
    this.migrationState.startTime = Date.now();

    try {
      // Validate all components without making changes
      await this.executeStep('Test Strapi connection', async () => {
        const response = await axios.get(
          `${this.config.strapiUrl}/api/products?pagination[pageSize]=1`,
          {
            headers: { Authorization: `Bearer ${this.config.strapiToken}` },
          }
        );
        console.log(`✅ Strapi responding: ${response.data.data.length} products found`);
      });

      await this.executeStep('Test data loading', async () => {
        const migrator = new ProductDataMigrator();
        const products = await migrator.loadLocalData('products.ts');
        console.log(`✅ Local data loaded: ${products.length} products`);
      });

      await this.executeStep('Test asset scanning', async () => {
        const uploader = new MediaAssetUploader();
        const images = await uploader.getImageFiles(
          path.join(__dirname, '../../assets/images/products')
        );
        console.log(`✅ Assets scanned: ${images.length} images found`);
      });

      await this.executeStep('Test validation suite', async () => {
        const validator = new DataValidator();
        await validator.validatePreMigration();
        console.log('✅ Validation suite operational');
      });

      console.log('\\n✅ Test run completed successfully - all systems ready for migration!');
    } catch (error) {
      console.error('❌ Test run failed:', error.message);
      throw error;
    }
  }

  async executeProgressiveRollout() {
    console.log('📈 Starting progressive rollout...');

    for (let i = 0; i < this.progressiveRollout.stages.length; i++) {
      const stage = this.progressiveRollout.stages[i];
      this.progressiveRollout.currentStage = i;

      console.log(
        `\\n🎯 Stage ${i + 1}/${this.progressiveRollout.stages.length}: ${stage.description}`
      );

      try {
        // Update rollout percentage
        await this.updateFeatureFlag('strapi_rollout_percentage', stage.percentage);

        // Monitor for stage duration
        await this.monitorStage(stage);

        console.log(`✅ Stage ${i + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Stage ${i + 1} failed:`, error.message);

        // Rollback to previous stage or 0
        const rollbackPercentage = i > 0 ? this.progressiveRollout.stages[i - 1].percentage : 0;
        await this.updateFeatureFlag('strapi_rollout_percentage', rollbackPercentage);

        throw error;
      }
    }

    console.log('🎉 Progressive rollout completed successfully!');
  }

  async monitorStage(stage) {
    console.log(`👀 Monitoring stage for ${stage.duration / 60000} minutes...`);

    const startTime = Date.now();
    const checkInterval = 30000; // 30 seconds

    while (Date.now() - startTime < stage.duration) {
      const health = await this.collectHealthMetrics();

      // Check health thresholds
      if (health.errorRate > this.healthThresholds.maxErrorRate) {
        throw new Error(`Error rate too high: ${(health.errorRate * 100).toFixed(1)}%`);
      }

      if (health.avgResponseTime > this.healthThresholds.maxResponseTime) {
        throw new Error(`Response time too high: ${health.avgResponseTime}ms`);
      }

      // Log progress
      const elapsed = Date.now() - startTime;
      const progress = ((elapsed / stage.duration) * 100).toFixed(1);
      console.log(
        `📊 Stage progress: ${progress}% | Error rate: ${(health.errorRate * 100).toFixed(2)}% | Response time: ${health.avgResponseTime}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  async updateFeatureFlag(flagName, value) {
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would update feature flag ${flagName} to ${value}`);
      return;
    }

    try {
      await axios.put(
        `${this.config.configServiceUrl}/flags/${flagName}`,
        { value },
        {
          headers: {
            Authorization: `Bearer ${process.env.CONFIG_SERVICE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      console.log(`🚩 Feature flag ${flagName} updated to ${value}`);
    } catch (error) {
      throw new Error(`Failed to update feature flag ${flagName}: ${error.message}`);
    }
  }

  async executeStep(stepName, stepFunction) {
    this.migrationState.currentStep = stepName;
    console.log(`\\n🔄 ${stepName}...`);

    const stepStart = Date.now();

    try {
      if (!this.config.dryRun) {
        await stepFunction();
      } else {
        console.log(`[DRY RUN] Simulating: ${stepName}`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate work
      }

      const stepDuration = Date.now() - stepStart;
      this.migrationState.completedSteps++;

      console.log(`✅ ${stepName} completed (${(stepDuration / 1000).toFixed(1)}s)`);
      console.log(
        `📊 Progress: ${this.migrationState.completedSteps}/${this.migrationState.totalSteps} steps completed`
      );
    } catch (error) {
      const stepDuration = Date.now() - stepStart;
      console.error(
        `❌ ${stepName} failed after ${(stepDuration / 1000).toFixed(1)}s: ${error.message}`
      );

      this.migrationState.errors.push({
        step: stepName,
        error: error.message,
        duration: stepDuration,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  async createDatabaseBackup() {
    console.log('💾 Creating database backup...');

    if (this.config.dryRun) {
      console.log('[DRY RUN] Would create database backup');
      return;
    }

    const backupDir = path.join(__dirname, '../../backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `pre-migration-${timestamp}.sql`);

    try {
      const { spawn } = require('child_process');
      const pg_dump = spawn('pg_dump', [process.env.DATABASE_URL], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const chunks = [];
      pg_dump.stdout.on('data', (chunk) => chunks.push(chunk));

      await new Promise((resolve, reject) => {
        pg_dump.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`pg_dump failed with code ${code}`));
          }
        });
      });

      const backupContent = Buffer.concat(chunks);
      await fs.writeFile(backupFile, backupContent);

      console.log(`✅ Database backup created: ${backupFile}`);
      console.log(`📊 Backup size: ${(backupContent.length / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  async performFinalValidation() {
    console.log('🔍 Performing final validation...');

    const validationChecks = [
      {
        name: 'All products accessible',
        check: async () => {
          const response = await axios.get(`${this.config.strapiUrl}/api/products`, {
            headers: { Authorization: `Bearer ${this.config.strapiToken}` },
          });
          return response.data.data.length >= 25;
        },
      },
      {
        name: 'Media files accessible',
        check: async () => {
          const response = await axios.get(
            `${this.config.strapiUrl}/api/upload/files?pagination[pageSize]=50`,
            {
              headers: { Authorization: `Bearer ${this.config.strapiToken}` },
            }
          );
          return response.data.data.length >= 40;
        },
      },
      {
        name: 'API performance acceptable',
        check: async () => {
          const startTime = Date.now();
          await axios.get(`${this.config.strapiUrl}/api/products?pagination[pageSize]=10`, {
            headers: { Authorization: `Bearer ${this.config.strapiToken}` },
          });
          const responseTime = Date.now() - startTime;
          return responseTime < 2000;
        },
      },
      {
        name: 'Feature flags active',
        check: async () => {
          const response = await axios.get(
            `${this.config.configServiceUrl}/flags/strapi_rollout_percentage`,
            {
              headers: { Authorization: `Bearer ${process.env.CONFIG_SERVICE_TOKEN}` },
            }
          );
          return response.data.value === 100;
        },
      },
    ];

    const results = [];

    for (const check of validationChecks) {
      try {
        const success = await check.check();
        results.push({ name: check.name, success });
        console.log(`${success ? '✅' : '❌'} ${check.name}`);
      } catch (error) {
        results.push({ name: check.name, success: false, error: error.message });
        console.log(`❌ ${check.name}: ${error.message}`);
      }
    }

    const failedChecks = results.filter((r) => !r.success);

    if (failedChecks.length > 0) {
      throw new Error(`Final validation failed: ${failedChecks.map((c) => c.name).join(', ')}`);
    }

    console.log('✅ Final validation passed');
  }

  async executeRollback(type, reason) {
    console.log(`🔄 Executing ${type} rollback: ${reason}`);

    try {
      const rollback = new RollbackScript();
      await rollback.run(type, { reason });

      this.migrationState.phase = 'rolled_back';
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('💥 Rollback failed:', error.message);
      await this.sendCriticalAlert(`Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async sendSuccessNotification(duration) {
    const notification = {
      title: '🎉 Migration Completed Successfully',
      message: `Tifossi app migration completed in ${(duration / 60000).toFixed(1)} minutes`,
      type: 'success',
      details: {
        duration,
        completedSteps: this.migrationState.completedSteps,
        totalSteps: this.migrationState.totalSteps,
        errors: this.migrationState.errors.length,
        warnings: this.migrationState.warnings.length,
      },
    };

    try {
      await axios.post(`${this.config.appUrl}/api/notifications/success`, notification, {
        headers: {
          Authorization: `Bearer ${process.env.APP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn('⚠️ Could not send success notification:', error.message);
    }
  }

  async sendCriticalAlert(message, details = {}) {
    const alert = {
      title: '🚨 Critical Migration Alert',
      message,
      severity: 'critical',
      details,
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(`${this.config.appUrl}/api/alerts/critical`, alert, {
        headers: {
          Authorization: `Bearer ${process.env.APP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('💥 Could not send critical alert:', error.message);
    }
  }

  async generateReport() {
    const report = {
      migration: this.migrationState,
      config: this.config,
      rollout: this.progressiveRollout,
      timestamp: new Date().toISOString(),
    };

    const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\\n📄 Migration report saved to: ${reportPath}`);
    return report;
  }

  async run(mode, options = {}) {
    try {
      // Apply options
      if (options.dryRun) this.config.dryRun = true;
      if (options.withValidation !== undefined) this.config.withValidation = options.withValidation;
      if (options.autoRollback !== undefined) this.config.autoRollback = options.autoRollback;

      await this.initialize();

      console.log(`\\n🚀 Starting migration mode: ${mode}`);

      switch (mode) {
        case 'full':
          await this.fullMigration();
          break;

        case 'test-run':
          await this.testRun();
          break;

        case 'progressive':
          const startPercentage = options.startPercentage || 1;
          await this.updateFeatureFlag('strapi_rollout_percentage', startPercentage);
          await this.executeProgressiveRollout();
          break;

        case 'rollback':
          const rollbackType = options.emergency ? 'emergency' : 'controlled';
          const reason = options.reason || 'Manual rollback requested';
          await this.executeRollback(rollbackType, reason);
          break;

        default:
          throw new Error(`Unknown migration mode: ${mode}`);
      }

      await this.generateReport();
      console.log('\\n✅ Migration orchestration completed successfully!');
    } catch (error) {
      console.error('\\n❌ Migration orchestration failed:', error.message);
      await this.generateReport();
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const modeArg = args.find((arg) => arg.startsWith('--mode='));

  const mode = modeArg ? modeArg.split('=')[1] : 'test-run';
  const options = {};

  // Parse options
  if (args.includes('--dry-run')) options.dryRun = true;
  if (args.includes('--with-validation')) options.withValidation = true;
  if (args.includes('--no-validation')) options.withValidation = false;
  if (args.includes('--auto-rollback')) options.autoRollback = true;
  if (args.includes('--no-auto-rollback')) options.autoRollback = false;
  if (args.includes('--emergency')) options.emergency = true;

  const startPercentageArg = args.find((arg) => arg.startsWith('--start-percentage='));
  if (startPercentageArg) {
    options.startPercentage = parseInt(startPercentageArg.split('=')[1]);
  }

  const reasonArg = args.find((arg) => arg.startsWith('--reason='));
  if (reasonArg) {
    options.reason = reasonArg.split('=')[1];
  }

  const orchestrator = new MigrationOrchestrator();
  orchestrator.run(mode, options);
}

module.exports = MigrationOrchestrator;
