import { config } from '../config/index.js';
import { AuthenticationError } from '../errors/index.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  const accessToken = req.headers.accesstoken;
  const expectedToken = config.get('auth.accessToken');

  if (!accessToken) {
    logger.warn('Access token missing', { ip: req.ip, path: req.path });
    throw new AuthenticationError('Access token is required');
  }

  if (accessToken !== expectedToken) {
    logger.warn('Invalid access token', { ip: req.ip, path: req.path });
    throw new AuthenticationError('Invalid access token');
  }

  next();
};
