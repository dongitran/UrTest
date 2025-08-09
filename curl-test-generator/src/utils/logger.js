import { config } from '../config/index.js';
import { LOG_LEVELS } from '../constants/index.js';

class Logger {
  constructor() {
    this.level = config.get('logging.level');
    this.format = config.get('logging.format');
    this.currentLevel = LOG_LEVELS[this.level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    if (this.format === 'json') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    }
    
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    const levelNum = LOG_LEVELS[level.toUpperCase()];
    if (levelNum <= this.currentLevel) {
      console.log(this.formatMessage(level, message, meta));
    }
  }

  error(message, meta = {}) {
    this.log('error', `❌ ${message}`, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', `⚠️ ${message}`, meta);
  }

  info(message, meta = {}) {
    this.log('info', `ℹ️ ${message}`, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', `🔍 ${message}`, meta);
  }

  success(message, meta = {}) {
    this.log('info', `✅ ${message}`, meta);
  }

  processing(message, meta = {}) {
    this.log('info', `🔄 ${message}`, meta);
  }
}

export const logger = new Logger();
