import dotenv from 'dotenv';
import { DEFAULT_CONFIG } from '../constants/index.js';

dotenv.config();

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      port: parseInt(process.env.PORT, 10) || 3050,
      nodeEnv: process.env.NODE_ENV || 'development',
      
      database: {
        uri: process.env.MONGODB_URI,
        options: {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      },

      ai: {
        geminiApiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
        maxRetries: DEFAULT_CONFIG.MAX_RETRIES,
        temperature: DEFAULT_CONFIG.AI_TEMPERATURE,
        maxOutputTokens: DEFAULT_CONFIG.MAX_OUTPUT_TOKENS
      },

      auth: {
        accessToken: process.env.ACCESS_TOKEN
      },

      processing: {
        maxFieldLength: DEFAULT_CONFIG.MAX_FIELD_LENGTH,
        requestTimeout: DEFAULT_CONFIG.REQUEST_TIMEOUT,
        maxCurlLength: DEFAULT_CONFIG.MAX_CURL_LENGTH,
        maxTestCases: DEFAULT_CONFIG.MAX_TEST_CASES
      },

      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
      },

      security: {
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          credentials: true
        },
        helmet: {
          contentSecurityPolicy: false
        }
      }
    };
  }

  validateConfig() {
    const required = [
      'database.uri',
      'ai.geminiApiKey', 
      'auth.accessToken'
    ];

    for (const path of required) {
      const value = this.getNestedValue(this.config, path);
      if (!value) {
        throw new Error(`Configuration error: ${path} is required`);
      }
    }

    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error('Configuration error: port must be between 1 and 65535');
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  get(path) {
    return this.getNestedValue(this.config, path) || this.config;
  }

  isDevelopment() {
    return this.config.nodeEnv === 'development';
  }

  isProduction() {
    return this.config.nodeEnv === 'production';
  }
}

export const config = new ConfigManager();
