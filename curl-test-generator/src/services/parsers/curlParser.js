import * as curlconverter from 'curlconverter';
import { CurlParsingError } from '../../errors/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export class CurlParser {
  constructor() {
    this.maxFieldLength = config.get('processing.maxFieldLength');
  }

  async parseCurl(curlText) {
    try {
      logger.processing('Parsing curl command');

      const jsonString = curlconverter.toJsonString(curlText);
      const parsed = JSON.parse(jsonString);

      if (parsed.raw_url) {
        parsed.raw_url = parsed.raw_url.replace(/^['"]|['"]$/g, '');
      }

      const result = {
        url: parsed.raw_url || parsed.url,
        method: parsed.method || 'GET',
        headers: parsed.headers || {},
        body: parsed.data || parsed.json || null,
        cookies: parsed.cookies || {}
      };

      logger.success('Curl command parsed successfully', { 
        url: result.url, 
        method: result.method 
      });

      return result;
    } catch (error) {
      logger.error('Failed to parse curl command', { error: error.message });
      throw new CurlParsingError(`Failed to parse curl command: ${error.message}`);
    }
  }

  limitFieldLength(value, maxLength = this.maxFieldLength) {
    if (typeof value === 'string' && value.length > maxLength) {
      return value.substring(0, maxLength - 3) + '...';
    }
    return value;
  }

  optimizeBodyForPrompt(body) {
    if (!body || typeof body !== 'object') return body;

    const optimized = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        optimized[key] = this.limitFieldLength(value, 50);
      } else {
        optimized[key] = value;
      }
    }
    return optimized;
  }
}
