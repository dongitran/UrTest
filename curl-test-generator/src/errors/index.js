import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, details);
  }
}

export class CurlParsingError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.CURL_PARSING_ERROR, details);
  }
}

export class AiProcessingError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.AI_PROCESSING_ERROR, details);
  }
}

export class TestExecutionError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.TEST_EXECUTION_ERROR, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND_ERROR', details);
  }
}
