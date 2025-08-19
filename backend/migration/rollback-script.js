#!/usr/bin/env node

/**
 * Rollback Script
 * Emergency rollback procedures for the migration process
 * 
 * Usage:
 *   node rollback-script.js --type=emergency --reason="Critical API failures"
 *   node rollback-script.js --type=controlled --percentage=50
 *   node rollback-script.js --type=progressive --target=0
 *   node rollback-script.js --type=validate
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class RollbackScript {
  constructor() {
    this.strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    this.strapiToken = process.env.STRAPI_API_TOKEN;
    this.appUrl = process.env.APP_URL || 'https://api.tifossi.app';
    this.configServiceUrl = process.env.CONFIG_SERVICE_URL || 'https://config.tifossi.app';
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    
    this.rollbackLog = {
      timestamp: new Date().toISOString(),
      type: null,
      reason: null,
      steps: [],
      success: false,
      duration: 0
    };
  }

  async initialize() {
    console.log('🚨 Initializing Rollback Script...');
    console.log(`📡 Strapi URL: ${this.strapiUrl}`);
    console.log(`🏠 App URL: ${this.appUrl}`);
    console.log(`⚙️ Config Service: ${this.configServiceUrl}`);
    console.log(`💾 Backup Directory: ${this.backupDir}`);
  }

  async emergencyRollback(reason) {
    console.log('🚨 EXECUTING EMERGENCY ROLLBACK');
    console.log(`📝 Reason: ${reason}`);
    
    this.rollbackLog.type = 'emergency';
    this.rollbackLog.reason = reason;
    const startTime = Date.now();

    try {
      // Step 1: Immediate feature flag cutover (30 seconds)
      await this.executeStep('Feature Flag Cutover', async () => {
        await this.disableStrapi();
        await this.enableLocalData();
        await this.enableEmergencyMode();
      });

      // Step 2: Clear Strapi cache (15 seconds)
      await this.executeStep('Clear Strapi Cache', async () => {
        await this.clearStrapiCache();
      });

      // Step 3: Force app refresh for all users (30 seconds)
      await this.executeStep('Force App Refresh', async () => {
        await this.broadcastAppRefresh('Emergency maintenance in progress...');
      });

      // Step 4: Notify team (15 seconds)
      await this.executeStep('Team Notification', async () => {
        await this.sendEmergencyNotification(reason);
      });

      // Step 5: Database rollback (if requested)
      if (process.env.ROLLBACK_DATABASE === 'true') {
        await this.executeStep('Database Rollback', async () => {
          await this.rollbackDatabase();
        });
      }

      // Step 6: Validate rollback success
      await this.executeStep('Validate Rollback', async () => {
        await this.validateRollbackSuccess();
      });

      this.rollbackLog.success = true;
      this.rollbackLog.duration = Date.now() - startTime;

      console.log(`✅ Emergency rollback completed in ${this.rollbackLog.duration}ms`);
      await this.logRollback();

    } catch (error) {
      this.rollbackLog.success = false;
      this.rollbackLog.duration = Date.now() - startTime;
      this.rollbackLog.error = error.message;

      console.error('❌ Emergency rollback failed:', error.message);
      await this.logRollback();
      
      // Send critical failure alert
      await this.sendCriticalFailureAlert(error.message);
      throw error;
    }
  }

  async controlledRollback(targetPercentage = 0) {
    console.log('⏪ EXECUTING CONTROLLED ROLLBACK');
    console.log(`🎯 Target Percentage: ${targetPercentage}%`);
    
    this.rollbackLog.type = 'controlled';
    this.rollbackLog.reason = `Reducing Strapi traffic to ${targetPercentage}%`;
    const startTime = Date.now();

    try {
      const currentPercentage = await this.getCurrentRolloutPercentage();
      console.log(`📊 Current rollout: ${currentPercentage}%`);

      if (currentPercentage <= targetPercentage) {
        console.log('✅ Already at or below target percentage');
        return;
      }

      // Calculate rollback steps
      const steps = Math.max(1, Math.floor((currentPercentage - targetPercentage) / 10));
      
      for (let i = 0; i < steps; i++) {
        const newPercentage = Math.max(
          targetPercentage,
          currentPercentage - ((i + 1) * 10)
        );

        await this.executeStep(`Reduce to ${newPercentage}%`, async () => {
          await this.updateRolloutPercentage(newPercentage);
          
          // Monitor for 2 minutes
          await this.monitorForDuration(120000, newPercentage);
          
          const metrics = await this.collectHealthMetrics();
          if (metrics.errorRate > 0.02) {
            console.warn(`⚠️ Error rate still high at ${newPercentage}%`);
          } else {
            console.log(`✅ Stable at ${newPercentage}%`);
          }
        });
      }

      this.rollbackLog.success = true;
      this.rollbackLog.duration = Date.now() - startTime;

      console.log(`✅ Controlled rollback completed in ${(this.rollbackLog.duration / 1000).toFixed(1)}s`);
      await this.logRollback();

    } catch (error) {
      this.rollbackLog.success = false;
      this.rollbackLog.duration = Date.now() - startTime;
      this.rollbackLog.error = error.message;

      console.error('❌ Controlled rollback failed:', error.message);
      await this.logRollback();
      throw error;
    }
  }

  async progressiveRollback(targetPercentage = 0) {
    console.log('📉 EXECUTING PROGRESSIVE ROLLBACK');
    console.log(`🎯 Target: ${targetPercentage}%`);

    this.rollbackLog.type = 'progressive';
    this.rollbackLog.reason = `Progressive reduction to ${targetPercentage}%`;
    const startTime = Date.now();

    try {
      const currentPercentage = await this.getCurrentRolloutPercentage();
      const reductionSteps = [
        { from: 100, to: 75, duration: 300000 }, // 5 minutes
        { from: 75, to: 50, duration: 300000 },  // 5 minutes
        { from: 50, to: 25, duration: 300000 },  // 5 minutes
        { from: 25, to: 0, duration: 300000 }    // 5 minutes
      ];

      for (const step of reductionSteps) {
        if (currentPercentage > step.from && step.to >= targetPercentage) {
          const actualTarget = Math.max(targetPercentage, step.to);
          
          await this.executeStep(`Progressive ${step.from}% → ${actualTarget}%`, async () => {
            await this.updateRolloutPercentage(actualTarget);
            
            // Monitor during transition
            await this.monitorForDuration(step.duration, actualTarget);
            
            // Health check
            const health = await this.performHealthCheck();
            if (!health.healthy) {
              throw new Error(`Health check failed at ${actualTarget}%: ${health.issues.join(', ')}`);
            }
          });

          if (actualTarget === targetPercentage) {
            break;
          }
        }
      }

      this.rollbackLog.success = true;
      this.rollbackLog.duration = Date.now() - startTime;

      console.log(`✅ Progressive rollback completed in ${(this.rollbackLog.duration / 60000).toFixed(1)} minutes`);
      await this.logRollback();

    } catch (error) {
      this.rollbackLog.success = false;
      this.rollbackLog.duration = Date.now() - startTime;
      this.rollbackLog.error = error.message;

      console.error('❌ Progressive rollback failed:', error.message);
      await this.logRollback();
      throw error;
    }
  }

  async executeStep(stepName, stepFunction) {
    console.log(`🔄 ${stepName}...`);
    const stepStart = Date.now();

    try {
      await stepFunction();
      const stepDuration = Date.now() - stepStart;
      
      this.rollbackLog.steps.push({
        name: stepName,
        duration: stepDuration,
        success: true,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ ${stepName} completed (${stepDuration}ms)`);
    } catch (error) {
      const stepDuration = Date.now() - stepStart;
      
      this.rollbackLog.steps.push({
        name: stepName,
        duration: stepDuration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.error(`❌ ${stepName} failed: ${error.message}`);
      throw error;
    }
  }

  async disableStrapi() {
    await this.updateFeatureFlag('use_strapi_backend', false);
    await this.updateFeatureFlag('strapi_rollout_percentage', 0);
    console.log('🚫 Strapi backend disabled');
  }

  async enableLocalData() {
    await this.updateFeatureFlag('use_local_data', true);
    await this.updateFeatureFlag('enable_local_fallback', true);
    console.log('📁 Local data enabled');
  }

  async enableEmergencyMode() {
    await this.updateFeatureFlag('emergency_mode', true);
    await this.updateFeatureFlag('bypass_cache', true);
    console.log('🚨 Emergency mode enabled');
  }

  async updateFeatureFlag(flagName, value) {
    try {
      await axios.put(`${this.configServiceUrl}/flags/${flagName}`, 
        { value },
        {
          headers: {
            'Authorization': `Bearer ${process.env.CONFIG_SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
    } catch (error) {
      console.warn(`⚠️ Could not update feature flag ${flagName}: ${error.message}`);
      // Continue with rollback even if feature flag update fails
    }
  }

  async getCurrentRolloutPercentage() {
    try {
      const response = await axios.get(`${this.configServiceUrl}/flags/strapi_rollout_percentage`, {
        headers: {
          'Authorization': `Bearer ${process.env.CONFIG_SERVICE_TOKEN}`
        },
        timeout: 5000
      });
      return response.data.value || 0;
    } catch (error) {
      console.warn('⚠️ Could not get current rollout percentage, assuming 0');
      return 0;
    }
  }

  async updateRolloutPercentage(percentage) {
    await this.updateFeatureFlag('strapi_rollout_percentage', percentage);
    console.log(`📊 Rollout percentage updated to ${percentage}%`);
  }

  async clearStrapiCache() {
    try {
      // Clear application cache
      await axios.post(`${this.appUrl}/api/cache/clear`, {}, {
        headers: {
          'Authorization': `Bearer ${process.env.APP_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('🗑️ Strapi cache cleared');
    } catch (error) {
      console.warn(`⚠️ Could not clear cache: ${error.message}`);
    }
  }

  async broadcastAppRefresh(message) {
    try {
      await axios.post(`${this.appUrl}/api/broadcast/refresh`, 
        { 
          message,
          force: true,
          priority: 'high'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.APP_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('📱 App refresh broadcast sent');
    } catch (error) {
      console.warn(`⚠️ Could not broadcast refresh: ${error.message}`);
    }
  }

  async rollbackDatabase() {
    console.log('🗄️ Starting database rollback...');
    
    try {
      // Find latest backup
      const backupFiles = await fs.readdir(this.backupDir);
      const sqlBackups = backupFiles
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse();

      if (sqlBackups.length === 0) {
        throw new Error('No database backups found');
      }

      const latestBackup = sqlBackups[0];
      const backupPath = path.join(this.backupDir, latestBackup);
      
      console.log(`📥 Restoring from backup: ${latestBackup}`);

      // Execute database restore
      const { spawn } = require('child_process');
      const restore = spawn('psql', [process.env.DATABASE_URL], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const backupContent = await fs.readFile(backupPath, 'utf8');
      restore.stdin.write(backupContent);
      restore.stdin.end();

      await new Promise((resolve, reject) => {
        restore.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Database restore failed with code ${code}`));
          }
        });
      });

      console.log('✅ Database rollback completed');
      
    } catch (error) {
      console.error('❌ Database rollback failed:', error.message);
      throw error;
    }
  }

  async validateRollbackSuccess() {
    console.log('✅ Validating rollback success...');
    
    const validationTests = [
      {
        name: 'Feature flags updated',
        test: async () => {
          const useStrapi = await this.getFeatureFlag('use_strapi_backend');
          const useLocal = await this.getFeatureFlag('use_local_data');
          return !useStrapi && useLocal;
        }
      },
      {
        name: 'API responding',
        test: async () => {
          const response = await axios.get(`${this.appUrl}/api/health`, { timeout: 5000 });
          return response.status === 200;
        }
      },
      {
        name: 'Local data accessible',
        test: async () => {
          const response = await axios.get(`${this.appUrl}/api/products?source=local`, { timeout: 5000 });
          return response.data && response.data.length > 0;
        }
      }
    ];

    const results = [];
    
    for (const test of validationTests) {
      try {
        const success = await test.test();
        results.push({ name: test.name, success });
        console.log(`${success ? '✅' : '❌'} ${test.name}`);
      } catch (error) {
        results.push({ name: test.name, success: false, error: error.message });
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    const allPassed = results.every(r => r.success);
    
    if (!allPassed) {
      throw new Error('Rollback validation failed');
    }

    console.log('✅ Rollback validation passed');
    return results;
  }

  async getFeatureFlag(flagName) {
    try {
      const response = await axios.get(`${this.configServiceUrl}/flags/${flagName}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CONFIG_SERVICE_TOKEN}`
        },
        timeout: 5000
      });
      return response.data.value;
    } catch (error) {
      console.warn(`⚠️ Could not get feature flag ${flagName}`);
      return null;
    }
  }

  async monitorForDuration(duration, percentage) {
    console.log(`👀 Monitoring for ${duration / 1000}s at ${percentage}%...`);
    
    const startTime = Date.now();
    const checkInterval = 30000; // 30 seconds
    
    while (Date.now() - startTime < duration) {
      const metrics = await this.collectHealthMetrics();
      
      if (metrics.errorRate > 0.05) {
        throw new Error(`High error rate detected: ${(metrics.errorRate * 100).toFixed(1)}%`);
      }
      
      if (metrics.responseTime > 5000) {
        throw new Error(`High response time detected: ${metrics.responseTime}ms`);
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('✅ Monitoring period completed successfully');
  }

  async collectHealthMetrics() {
    try {
      const response = await axios.get(`${this.appUrl}/api/metrics/health`, {
        headers: {
          'Authorization': `Bearer ${process.env.APP_API_TOKEN}`
        },
        timeout: 5000
      });
      
      return {
        errorRate: response.data.errorRate || 0,
        responseTime: response.data.avgResponseTime || 0,
        activeUsers: response.data.activeUsers || 0
      };
    } catch (error) {
      console.warn(`⚠️ Could not collect health metrics: ${error.message}`);
      return { errorRate: 0, responseTime: 0, activeUsers: 0 };
    }
  }

  async performHealthCheck() {
    const healthChecks = [
      {
        name: 'API Health',
        check: async () => {
          const response = await axios.get(`${this.appUrl}/api/health`, { timeout: 5000 });
          return response.status === 200;
        }
      },
      {
        name: 'Database Health',
        check: async () => {
          const response = await axios.get(`${this.appUrl}/api/db/health`, { timeout: 5000 });
          return response.status === 200;
        }
      },
      {
        name: 'Local Data Health',
        check: async () => {
          const response = await axios.get(`${this.appUrl}/api/products?source=local`, { timeout: 5000 });
          return response.data && response.data.length > 0;
        }
      }
    ];

    const results = [];
    const issues = [];

    for (const healthCheck of healthChecks) {
      try {
        const healthy = await healthCheck.check();
        results.push({ name: healthCheck.name, healthy });
        
        if (!healthy) {
          issues.push(healthCheck.name);
        }
      } catch (error) {
        results.push({ name: healthCheck.name, healthy: false, error: error.message });
        issues.push(`${healthCheck.name}: ${error.message}`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues,
      details: results
    };
  }

  async sendEmergencyNotification(reason) {
    const notification = {
      title: '🚨 EMERGENCY ROLLBACK EXECUTED',
      message: `Rollback initiated due to: ${reason}`,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      channels: ['slack', 'email', 'sms']
    };

    try {
      await axios.post(`${this.appUrl}/api/notifications/emergency`, notification, {
        headers: {
          'Authorization': `Bearer ${process.env.APP_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('📢 Emergency notification sent');
    } catch (error) {
      console.warn(`⚠️ Could not send emergency notification: ${error.message}`);
    }
  }

  async sendCriticalFailureAlert(error) {
    const alert = {
      title: '💥 ROLLBACK FAILED - CRITICAL',
      message: `Rollback procedure failed: ${error}`,
      severity: 'critical',
      requiresImmediate: true,
      timestamp: new Date().toISOString()
    };

    try {
      await axios.post(`${this.appUrl}/api/alerts/critical`, alert, {
        headers: {
          'Authorization': `Bearer ${process.env.APP_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('🚨 Critical failure alert sent');
    } catch (alertError) {
      console.error(`💥 Could not send critical alert: ${alertError.message}`);
    }
  }

  async logRollback() {
    try {
      const logPath = path.join(__dirname, `rollback-log-${Date.now()}.json`);
      await fs.writeFile(logPath, JSON.stringify(this.rollbackLog, null, 2));
      console.log(`📄 Rollback log saved to: ${logPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save rollback log: ${error.message}`);
    }
  }

  async validateRollbackCapability() {
    console.log('🧪 Validating rollback capability...');
    
    const checks = [
      {
        name: 'Feature flags service accessible',
        check: async () => {
          const response = await axios.get(`${this.configServiceUrl}/health`, { timeout: 5000 });
          return response.status === 200;
        }
      },
      {
        name: 'App API accessible',
        check: async () => {
          const response = await axios.get(`${this.appUrl}/api/health`, { timeout: 5000 });
          return response.status === 200;
        }
      },
      {
        name: 'Backup files available',
        check: async () => {
          const backupFiles = await fs.readdir(this.backupDir);
          return backupFiles.some(file => file.endsWith('.sql'));
        }
      },
      {
        name: 'Local data source available',
        check: async () => {
          const localDataPath = path.join(__dirname, '../../app/_data/products.ts');
          await fs.access(localDataPath);
          return true;
        }
      }
    ];

    const results = [];
    
    for (const check of checks) {
      try {
        const success = await check.check();
        results.push({ name: check.name, success });
        console.log(`${success ? '✅' : '❌'} ${check.name}`);
      } catch (error) {
        results.push({ name: check.name, success: false, error: error.message });
        console.log(`❌ ${check.name}: ${error.message}`);
      }
    }

    const readiness = results.filter(r => r.success).length / results.length;
    console.log(`\\n📊 Rollback readiness: ${(readiness * 100).toFixed(1)}%`);
    
    if (readiness < 1.0) {
      console.warn('⚠️ Rollback capability compromised');
      const failures = results.filter(r => !r.success);
      failures.forEach(failure => {
        console.warn(`  - ${failure.name}: ${failure.error || 'Failed'}`);
      });
    } else {
      console.log('✅ Rollback capability validated');
    }

    return { readiness, results };
  }

  async run(type, options = {}) {
    try {
      await this.initialize();
      
      console.log(`\\n🚨 Starting rollback type: ${type}`);
      
      switch (type) {
        case 'emergency':
          const reason = options.reason || 'Emergency rollback requested';
          await this.emergencyRollback(reason);
          break;
          
        case 'controlled':
          const percentage = options.percentage || 0;
          await this.controlledRollback(percentage);
          break;
          
        case 'progressive':
          const target = options.target || 0;
          await this.progressiveRollback(target);
          break;
          
        case 'validate':
          await this.validateRollbackCapability();
          break;
          
        default:
          throw new Error(`Unknown rollback type: ${type}`);
      }
      
      console.log('\\n✅ Rollback operation completed successfully!');
      
    } catch (error) {
      console.error('\\n❌ Rollback operation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => arg.startsWith('--type='));
  const reasonArg = args.find(arg => arg.startsWith('--reason='));
  const percentageArg = args.find(arg => arg.startsWith('--percentage='));
  const targetArg = args.find(arg => arg.startsWith('--target='));
  
  const type = typeArg ? typeArg.split('=')[1] : 'validate';
  const options = {};
  
  if (reasonArg) {
    options.reason = reasonArg.split('=')[1];
  }
  
  if (percentageArg) {
    options.percentage = parseInt(percentageArg.split('=')[1]);
  }
  
  if (targetArg) {
    options.target = parseInt(targetArg.split('=')[1]);
  }
  
  const rollback = new RollbackScript();
  rollback.run(type, options);
}

module.exports = RollbackScript;