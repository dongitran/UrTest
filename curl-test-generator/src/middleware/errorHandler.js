import { AppError } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { HTTP_STATUS } from '../constants/index.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: config.isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
      timestamp: err.timestamp
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Database error',
      errorCode: 'DATABASE_ERROR',
      error: config.isDevelopment() ? err.message : 'Internal server error'
    });
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
    errorCode: 'UNKNOWN_ERROR',
    error: config.isDevelopment() ? err.stack : undefined
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
