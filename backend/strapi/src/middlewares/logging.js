'use strict';

/**
 * Enhanced logging middleware for the Tifossi API
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Configure Winston logger
const createLogger = (config) => {
  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ];

  // Add file logging if enabled
  if (process.env.LOG_FILE_ENABLED === 'true') {
    transports.push(
      new DailyRotateFile({
        filename: process.env.LOG_FILE_PATH || './logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '100m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );

    // Separate error log
    transports.push(
      new DailyRotateFile({
        filename: process.env.LOG_ERROR_FILE_PATH || './logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: process.env.LOG_MAX_SIZE || '100m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({
    level: config.level || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports,
  });
};

module.exports = (config, { strapi }) => {
  const logger = createLogger(config);

  return async (ctx, next) => {
    const start = Date.now();
    const { method, url, ip, headers } = ctx.request;

    // Generate request ID
    const requestId = ctx.headers['x-request-id'] || 
                     ctx.headers['x-correlation-id'] || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add request ID to context
    ctx.state.requestId = requestId;
    ctx.set('X-Request-ID', requestId);

    // Log request start
    const requestLog = {
      requestId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      contentLength: headers['content-length'],
      timestamp: new Date().toISOString(),
      type: 'request',
    };

    // Add user information if authenticated
    if (ctx.state.user) {
      requestLog.userId = ctx.state.user.id;
      requestLog.userEmail = ctx.state.user.email;
    }

    logger.info('HTTP Request', requestLog);

    try {
      await next();

      // Log successful response
      const duration = Date.now() - start;
      const responseLog = {
        requestId,
        method,
        url,
        status: ctx.status,
        duration: `${duration}ms`,
        responseSize: ctx.response.length || 0,
        timestamp: new Date().toISOString(),
        type: 'response',
      };

      // Log slow requests as warnings
      if (duration > 5000) {
        logger.warn('Slow HTTP Response', responseLog);
      } else {
        logger.info('HTTP Response', responseLog);
      }

    } catch (error) {
      // Log error response
      const duration = Date.now() - start;
      const errorLog = {
        requestId,
        method,
        url,
        status: ctx.status || 500,
        duration: `${duration}ms`,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
        type: 'error',
      };

      // Add user information if available
      if (ctx.state.user) {
        errorLog.userId = ctx.state.user.id;
        errorLog.userEmail = ctx.state.user.email;
      }

      logger.error('HTTP Error', errorLog);

      // Re-throw the error so Strapi can handle it
      throw error;
    }
  };
};

// Export logger instance for use in other parts of the application
module.exports.logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
});