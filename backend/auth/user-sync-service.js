/**
 * User Synchronization Service
 * 
 * Manages bidirectional synchronization of user data between Firebase and Strapi.
 * Handles real-time updates, conflict resolution, and data consistency.
 * 
 * Features:
 * - Real-time user data synchronization
 * - Conflict detection and resolution
 * - Batch synchronization operations
 * - Data validation and integrity checks
 * - Audit logging and monitoring
 */

const EventEmitter = require('events');
const { firebaseAdmin } = require('./firebase-admin-setup');

class UserSyncService extends EventEmitter {
  constructor(strapi) {
    super();
    this.strapi = strapi;
    this.syncQueue = [];
    this.isProcessing = false;
    this.conflictResolver = new ConflictResolver();
    this.validator = new DataValidator();
    this.metrics = new SyncMetrics();
    
    this.config = {
      batchSize: 50,
      syncInterval: 5000, // 5 seconds
      maxRetries: 3,
      conflictStrategy: 'latest_wins', // 'firebase_wins', 'strapi_wins', 'latest_wins', 'manual'
    };

    this.setupEventListeners();
  }

  /**
   * Initialize sync service with Strapi instance
   * @param {Object} strapi - Strapi instance
   */
  static init(strapi) {
    return new UserSyncService(strapi);
  }

  /**
   * Setup event listeners for real-time synchronization
   */
  setupEventListeners() {
    // Firebase user change listeners would be setup here
    // In production, this would use Firebase Firestore listeners or Cloud Functions
    
    this.on('firebaseUserChanged', this.handleFirebaseUserChange.bind(this));
    this.on('strapiUserChanged', this.handleStrapiUserChange.bind(this));
    this.on('syncConflict', this.handleSyncConflict.bind(this));
  }

  /**
   * Start the synchronization service
   */
  async start() {
    console.log('Starting User Sync Service...');
    
    // Start periodic sync processing
    this.syncTimer = setInterval(() => {
      this.processSyncQueue();
    }, this.config.syncInterval);

    // Perform initial sync
    await this.performInitialSync();
    
    console.log('User Sync Service started successfully');
  }

  /**
   * Stop the synchronization service
   */
  async stop() {
    console.log('Stopping User Sync Service...');
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Process remaining queue items
    await this.processSyncQueue();
    
    console.log('User Sync Service stopped');
  }

  /**
   * Perform initial synchronization of all users
   */
  async performInitialSync() {
    try {
      console.log('Performing initial user synchronization...');
      
      const strapiUsers = await this.getAllStrapiUsers();
      const firebaseUsers = await this.getAllFirebaseUsers();

      // Create sync operations for each user
      const syncOperations = this.createInitialSyncOperations(strapiUsers, firebaseUsers);
      
      // Add to queue
      syncOperations.forEach(operation => {
        this.queueSyncOperation(operation);
      });

      console.log(`Queued ${syncOperations.length} initial sync operations`);
    } catch (error) {
      console.error('Initial sync failed:', error);
      throw error;
    }
  }

  /**
   * Queue a synchronization operation
   * @param {Object} operation - Sync operation
   */
  queueSyncOperation(operation) {
    operation.id = this.generateOperationId();
    operation.queuedAt = Date.now();
    operation.retryCount = 0;
    
    this.syncQueue.push(operation);
    this.emit('operationQueued', operation);
  }

  /**
   * Process the synchronization queue
   */
  async processSyncQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const batch = this.syncQueue.splice(0, this.config.batchSize);
      console.log(`Processing sync batch of ${batch.length} operations`);

      const results = await Promise.allSettled(
        batch.map(operation => this.executeSyncOperation(operation))
      );

      // Handle failed operations
      results.forEach((result, index) => {
        const operation = batch[index];
        
        if (result.status === 'rejected') {
          console.error(`Sync operation failed: ${operation.id}`, result.reason);
          
          if (operation.retryCount < this.config.maxRetries) {
            operation.retryCount++;
            operation.nextRetry = Date.now() + (1000 * Math.pow(2, operation.retryCount));
            this.syncQueue.push(operation);
          } else {
            this.handlePermanentFailure(operation, result.reason);
          }
        } else {
          this.metrics.recordSuccess(operation);
        }
      });

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single sync operation
   * @param {Object} operation - Sync operation
   */
  async executeSyncOperation(operation) {
    const startTime = Date.now();
    
    try {
      switch (operation.type) {
        case 'sync_firebase_to_strapi':
          await this.syncFirebaseToStrapi(operation);
          break;
          
        case 'sync_strapi_to_firebase':
          await this.syncStrapiToFirebase(operation);
          break;
          
        case 'validate_consistency':
          await this.validateUserConsistency(operation);
          break;
          
        case 'resolve_conflict':
          await this.resolveUserConflict(operation);
          break;
          
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordOperationTime(operation.type, duration);
      
      console.log(`Sync operation completed: ${operation.id} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordError(operation.type, error);
      
      console.error(`Sync operation failed: ${operation.id} (${duration}ms)`, error);
      throw error;
    }
  }

  /**
   * Sync Firebase user data to Strapi
   * @param {Object} operation - Sync operation
   */
  async syncFirebaseToStrapi(operation) {
    const { firebaseId, data } = operation;
    
    // Get current Firebase user data
    const firebaseUser = data || await firebaseAdmin.getUser(firebaseId);
    
    // Find corresponding Strapi user
    const strapiUser = await this.findStrapiUserByFirebaseId(firebaseId);
    
    if (!strapiUser) {
      throw new Error(`Strapi user not found for Firebase ID: ${firebaseId}`);
    }

    // Detect changes that need to be synced
    const changes = this.detectFirebaseChanges(firebaseUser, strapiUser);
    
    if (changes.length === 0) {
      console.log(`No changes to sync for user: ${firebaseId}`);
      return;
    }

    // Apply changes to Strapi
    const updates = this.buildStrapiUpdates(changes);
    
    if (Object.keys(updates).length > 0) {
      await this.strapi.query('plugin::users-permissions.user').update({
        where: { id: strapiUser.id },
        data: updates,
      });

      console.log(`Synced ${changes.length} changes from Firebase to Strapi for user: ${firebaseId}`);
      
      // Log sync event
      await this.logSyncEvent('firebase_to_strapi', {
        firebaseId,
        strapiId: strapiUser.id,
        changes: changes.map(c => c.field),
      });
    }
  }

  /**
   * Sync Strapi user data to Firebase
   * @param {Object} operation - Sync operation
   */
  async syncStrapiToFirebase(operation) {
    const { strapiId, data } = operation;
    
    // Get current Strapi user data
    const strapiUser = data || await this.strapi.query('plugin::users-permissions.user').findOne({
      where: { id: strapiId },
      populate: ['role'],
    });
    
    if (!strapiUser || !strapiUser.firebaseId) {
      throw new Error(`Invalid Strapi user or missing Firebase ID: ${strapiId}`);
    }

    // Get corresponding Firebase user
    let firebaseUser;
    try {
      firebaseUser = await firebaseAdmin.getUser(strapiUser.firebaseId);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Firebase user not found for Strapi user: ${strapiId}`);
        return;
      }
      throw error;
    }

    // Detect changes that need to be synced
    const changes = this.detectStrapiChanges(strapiUser, firebaseUser);
    
    if (changes.length === 0) {
      console.log(`No changes to sync for user: ${strapiId}`);
      return;
    }

    // Apply changes to Firebase
    const updates = this.buildFirebaseUpdates(changes);
    
    if (Object.keys(updates).length > 0) {
      await firebaseAdmin.updateUser(strapiUser.firebaseId, updates);

      console.log(`Synced ${changes.length} changes from Strapi to Firebase for user: ${strapiId}`);
      
      // Log sync event
      await this.logSyncEvent('strapi_to_firebase', {
        strapiId,
        firebaseId: strapiUser.firebaseId,
        changes: changes.map(c => c.field),
      });
    }
  }

  /**
   * Validate user data consistency between Firebase and Strapi
   * @param {Object} operation - Validation operation
   */
  async validateUserConsistency(operation) {
    const { firebaseId, strapiId } = operation;
    
    const [firebaseUser, strapiUser] = await Promise.all([
      firebaseAdmin.getUser(firebaseId),
      this.strapi.query('plugin::users-permissions.user').findOne({
        where: { id: strapiId },
        populate: ['role'],
      }),
    ]);

    const inconsistencies = this.findInconsistencies(firebaseUser, strapiUser);
    
    if (inconsistencies.length > 0) {
      console.warn(`Found ${inconsistencies.length} inconsistencies for user ${firebaseId}:`, inconsistencies);
      
      // Create conflict resolution operations
      inconsistencies.forEach(inconsistency => {
        this.queueSyncOperation({
          type: 'resolve_conflict',
          firebaseId,
          strapiId,
          conflict: inconsistency,
          strategy: this.config.conflictStrategy,
        });
      });
    }
  }

  /**
   * Resolve user data conflicts
   * @param {Object} operation - Conflict resolution operation
   */
  async resolveUserConflict(operation) {
    const { firebaseId, strapiId, conflict, strategy } = operation;
    
    const resolution = await this.conflictResolver.resolve(conflict, strategy);
    
    switch (resolution.action) {
      case 'update_firebase':
        await firebaseAdmin.updateUser(firebaseId, resolution.updates);
        break;
        
      case 'update_strapi':
        await this.strapi.query('plugin::users-permissions.user').update({
          where: { id: strapiId },
          data: resolution.updates,
        });
        break;
        
      case 'manual_review':
        await this.flagForManualReview(operation, resolution);
        break;
        
      default:
        throw new Error(`Unknown resolution action: ${resolution.action}`);
    }

    await this.logSyncEvent('conflict_resolved', {
      firebaseId,
      strapiId,
      conflict: conflict.field,
      strategy,
      action: resolution.action,
    });
  }

  /**
   * Handle Firebase user change events
   * @param {Object} event - User change event
   */
  async handleFirebaseUserChange(event) {
    console.log('Firebase user change detected:', event);
    
    this.queueSyncOperation({
      type: 'sync_firebase_to_strapi',
      firebaseId: event.uid,
      data: event.userData,
      priority: 'high',
    });
  }

  /**
   * Handle Strapi user change events
   * @param {Object} event - User change event
   */
  async handleStrapiUserChange(event) {
    console.log('Strapi user change detected:', event);
    
    this.queueSyncOperation({
      type: 'sync_strapi_to_firebase',
      strapiId: event.id,
      data: event.userData,
      priority: 'high',
    });
  }

  /**
   * Handle sync conflicts
   * @param {Object} event - Conflict event
   */
  async handleSyncConflict(event) {
    console.log('Sync conflict detected:', event);
    
    this.queueSyncOperation({
      type: 'resolve_conflict',
      firebaseId: event.firebaseId,
      strapiId: event.strapiId,
      conflict: event.conflict,
      strategy: this.config.conflictStrategy,
      priority: 'medium',
    });
  }

  /**
   * Detect changes between Firebase and Strapi user data
   * @param {Object} firebaseUser - Firebase user data
   * @param {Object} strapiUser - Strapi user data
   * @returns {Array} Array of detected changes
   */
  detectFirebaseChanges(firebaseUser, strapiUser) {
    const changes = [];

    // Email verification status
    if (firebaseUser.emailVerified !== strapiUser.confirmed) {
      changes.push({
        field: 'emailVerified',
        firebaseValue: firebaseUser.emailVerified,
        strapiValue: strapiUser.confirmed,
        type: 'verification',
      });
    }

    // Display name
    if (firebaseUser.displayName !== strapiUser.profile?.displayName) {
      changes.push({
        field: 'displayName',
        firebaseValue: firebaseUser.displayName,
        strapiValue: strapiUser.profile?.displayName,
        type: 'profile',
      });
    }

    // Account status
    if (firebaseUser.disabled !== strapiUser.blocked) {
      changes.push({
        field: 'accountStatus',
        firebaseValue: firebaseUser.disabled,
        strapiValue: strapiUser.blocked,
        type: 'status',
      });
    }

    // Email address
    if (firebaseUser.email !== strapiUser.email) {
      changes.push({
        field: 'email',
        firebaseValue: firebaseUser.email,
        strapiValue: strapiUser.email,
        type: 'critical',
      });
    }

    return changes;
  }

  /**
   * Detect changes from Strapi to Firebase
   * @param {Object} strapiUser - Strapi user data
   * @param {Object} firebaseUser - Firebase user data
   * @returns {Array} Array of detected changes
   */
  detectStrapiChanges(strapiUser, firebaseUser) {
    const changes = [];

    // Display name
    if (strapiUser.profile?.displayName !== firebaseUser.displayName) {
      changes.push({
        field: 'displayName',
        strapiValue: strapiUser.profile?.displayName,
        firebaseValue: firebaseUser.displayName,
        type: 'profile',
      });
    }

    // Account status
    if (strapiUser.blocked !== firebaseUser.disabled) {
      changes.push({
        field: 'accountStatus',
        strapiValue: strapiUser.blocked,
        firebaseValue: firebaseUser.disabled,
        type: 'status',
      });
    }

    return changes;
  }

  /**
   * Build Strapi updates from detected changes
   * @param {Array} changes - Array of changes
   * @returns {Object} Update object for Strapi
   */
  buildStrapiUpdates(changes) {
    const updates = {};

    changes.forEach(change => {
      switch (change.field) {
        case 'emailVerified':
          updates.confirmed = change.firebaseValue;
          updates.firebaseMetadata = {
            emailVerified: change.firebaseValue,
            lastSync: new Date(),
          };
          break;
          
        case 'displayName':
          updates.profile = {
            displayName: change.firebaseValue,
            firstName: this.extractFirstName(change.firebaseValue),
            lastName: this.extractLastName(change.firebaseValue),
          };
          break;
          
        case 'accountStatus':
          updates.blocked = change.firebaseValue;
          break;
          
        case 'email':
          updates.email = change.firebaseValue;
          break;
      }
    });

    return updates;
  }

  /**
   * Build Firebase updates from detected changes
   * @param {Array} changes - Array of changes
   * @returns {Object} Update object for Firebase
   */
  buildFirebaseUpdates(changes) {
    const updates = {};

    changes.forEach(change => {
      switch (change.field) {
        case 'displayName':
          updates.displayName = change.strapiValue;
          break;
          
        case 'accountStatus':
          updates.disabled = change.strapiValue;
          break;
      }
    });

    return updates;
  }

  /**
   * Find inconsistencies between Firebase and Strapi user data
   * @param {Object} firebaseUser - Firebase user data
   * @param {Object} strapiUser - Strapi user data
   * @returns {Array} Array of inconsistencies
   */
  findInconsistencies(firebaseUser, strapiUser) {
    const inconsistencies = [];

    // Check Firebase ID link
    if (strapiUser.firebaseId !== firebaseUser.uid) {
      inconsistencies.push({
        field: 'firebaseId',
        firebaseValue: firebaseUser.uid,
        strapiValue: strapiUser.firebaseId,
        severity: 'critical',
      });
    }

    // Check email consistency
    if (firebaseUser.email !== strapiUser.email) {
      inconsistencies.push({
        field: 'email',
        firebaseValue: firebaseUser.email,
        strapiValue: strapiUser.email,
        severity: 'high',
      });
    }

    // Check verification status consistency
    if (firebaseUser.emailVerified !== strapiUser.confirmed) {
      inconsistencies.push({
        field: 'emailVerified',
        firebaseValue: firebaseUser.emailVerified,
        strapiValue: strapiUser.confirmed,
        severity: 'medium',
      });
    }

    return inconsistencies;
  }

  /**
   * Get all Strapi users with Firebase IDs
   * @returns {Promise<Array>} Array of Strapi users
   */
  async getAllStrapiUsers() {
    try {
      return await this.strapi.query('plugin::users-permissions.user').findMany({
        where: {
          firebaseId: { $notNull: true },
        },
        populate: ['role'],
      });
    } catch (error) {
      console.error('Failed to get Strapi users:', error);
      return [];
    }
  }

  /**
   * Get all Firebase users
   * @returns {Promise<Array>} Array of Firebase users
   */
  async getAllFirebaseUsers() {
    try {
      const users = [];
      let pageToken;
      
      do {
        const result = await firebaseAdmin.listUsers(1000, pageToken);
        users.push(...result.users);
        pageToken = result.pageToken;
      } while (pageToken);
      
      return users;
    } catch (error) {
      console.error('Failed to get Firebase users:', error);
      return [];
    }
  }

  /**
   * Create initial sync operations
   * @param {Array} strapiUsers - Strapi users
   * @param {Array} firebaseUsers - Firebase users
   * @returns {Array} Array of sync operations
   */
  createInitialSyncOperations(strapiUsers, firebaseUsers) {
    const operations = [];
    
    // Create validation operations for users present in both systems
    strapiUsers.forEach(strapiUser => {
      const firebaseUser = firebaseUsers.find(fu => fu.uid === strapiUser.firebaseId);
      
      if (firebaseUser) {
        operations.push({
          type: 'validate_consistency',
          firebaseId: firebaseUser.uid,
          strapiId: strapiUser.id,
          priority: 'low',
        });
      }
    });

    return operations;
  }

  /**
   * Find Strapi user by Firebase ID
   * @param {string} firebaseId - Firebase user ID
   * @returns {Promise<Object|null>} Strapi user or null
   */
  async findStrapiUserByFirebaseId(firebaseId) {
    try {
      return await this.strapi.query('plugin::users-permissions.user').findOne({
        where: { firebaseId },
        populate: ['role'],
      });
    } catch (error) {
      console.error('Error finding Strapi user by Firebase ID:', error);
      return null;
    }
  }

  /**
   * Handle permanent operation failures
   * @param {Object} operation - Failed operation
   * @param {Error} error - Error that caused the failure
   */
  async handlePermanentFailure(operation, error) {
    console.error(`Permanent failure for operation ${operation.id}:`, error);
    
    await this.logSyncEvent('permanent_failure', {
      operationId: operation.id,
      operationType: operation.type,
      error: error.message,
      retryCount: operation.retryCount,
    });
  }

  /**
   * Flag operation for manual review
   * @param {Object} operation - Operation to flag
   * @param {Object} resolution - Resolution details
   */
  async flagForManualReview(operation, resolution) {
    console.log(`Flagging operation for manual review: ${operation.id}`);
    
    await this.logSyncEvent('manual_review_required', {
      operationId: operation.id,
      conflict: operation.conflict,
      resolution,
    });
  }

  /**
   * Log synchronization events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  async logSyncEvent(event, data) {
    try {
      // In production, this would log to a proper logging service
      console.log(`[SYNC EVENT] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log sync event:', error);
    }
  }

  /**
   * Generate unique operation ID
   * @returns {string} Operation ID
   */
  generateOperationId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Extract first name from display name
   * @param {string} displayName - Full display name
   * @returns {string|null} First name
   */
  extractFirstName(displayName) {
    if (!displayName) return null;
    return displayName.split(' ')[0] || null;
  }

  /**
   * Extract last name from display name
   * @param {string} displayName - Full display name
   * @returns {string|null} Last name
   */
  extractLastName(displayName) {
    if (!displayName) return null;
    const parts = displayName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : null;
  }

  /**
   * Get sync service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: !!this.syncTimer,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      metrics: this.metrics.getMetrics(),
      config: this.config,
    };
  }
}

/**
 * Conflict Resolver
 * Handles resolution of data conflicts between Firebase and Strapi
 */
class ConflictResolver {
  async resolve(conflict, strategy) {
    switch (strategy) {
      case 'firebase_wins':
        return this.resolveFirebaseWins(conflict);
        
      case 'strapi_wins':
        return this.resolveStrapiWins(conflict);
        
      case 'latest_wins':
        return this.resolveLatestWins(conflict);
        
      case 'manual':
        return this.resolveManual(conflict);
        
      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }

  resolveFirebaseWins(conflict) {
    return {
      action: 'update_strapi',
      updates: this.buildUpdatesFromFirebase(conflict),
    };
  }

  resolveStrapiWins(conflict) {
    return {
      action: 'update_firebase',
      updates: this.buildUpdatesFromStrapi(conflict),
    };
  }

  resolveLatestWins(conflict) {
    // Implementation would compare timestamps to determine latest
    return this.resolveFirebaseWins(conflict); // Fallback
  }

  resolveManual(conflict) {
    return {
      action: 'manual_review',
      conflict,
    };
  }

  buildUpdatesFromFirebase(conflict) {
    const updates = {};
    updates[conflict.field] = conflict.firebaseValue;
    return updates;
  }

  buildUpdatesFromStrapi(conflict) {
    const updates = {};
    updates[conflict.field] = conflict.strapiValue;
    return updates;
  }
}

/**
 * Data Validator
 * Validates user data consistency and integrity
 */
class DataValidator {
  validateUser(userData) {
    const errors = [];

    if (!userData.email) {
      errors.push('Email is required');
    }

    if (!userData.firebaseId) {
      errors.push('Firebase ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Sync Metrics
 * Tracks synchronization performance and statistics
 */
class SyncMetrics {
  constructor() {
    this.metrics = {
      operationsProcessed: 0,
      operationsSucceeded: 0,
      operationsFailed: 0,
      averageProcessingTime: 0,
      errorsByType: {},
      lastReset: Date.now(),
    };
  }

  recordSuccess(operation) {
    this.metrics.operationsProcessed++;
    this.metrics.operationsSucceeded++;
  }

  recordError(operationType, error) {
    this.metrics.operationsProcessed++;
    this.metrics.operationsFailed++;
    
    if (!this.metrics.errorsByType[operationType]) {
      this.metrics.errorsByType[operationType] = 0;
    }
    this.metrics.errorsByType[operationType]++;
  }

  recordOperationTime(operationType, duration) {
    // Update average processing time (simple moving average)
    const current = this.metrics.averageProcessingTime;
    const count = this.metrics.operationsProcessed;
    this.metrics.averageProcessingTime = (current * (count - 1) + duration) / count;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      operationsProcessed: 0,
      operationsSucceeded: 0,
      operationsFailed: 0,
      averageProcessingTime: 0,
      errorsByType: {},
      lastReset: Date.now(),
    };
  }
}

module.exports = {
  UserSyncService,
  ConflictResolver,
  DataValidator,
  SyncMetrics,
  
  // Factory function for creating sync service
  createUserSyncService: (strapi) => {
    return new UserSyncService(strapi);
  },
};