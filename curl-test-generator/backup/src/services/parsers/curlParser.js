import * as curlconverter from 'curlconverter';

export class CurlParser {
  constructor() {
    this.maxFieldLength = 128;
  }

  async parseCurl(curlText) {
    try {
      console.log('🔄 Parsing curl command...');

      const jsonString = curlconverter.toJsonString(curlText);
      const parsed = JSON.parse(jsonString);

      if (parsed.raw_url) {
        parsed.raw_url = parsed.raw_url.replace(/^['"]|['"]$/g, '');
      }

      return {
        url: parsed.raw_url || parsed.url,
        method: parsed.method || 'GET',
        headers: parsed.headers || {},
        body: parsed.data || parsed.json || null,
        cookies: parsed.cookies || {},
      };
    } catch (error) {
      console.error('❌ Error parsing curl:', error);
      throw new Error(`Failed to parse curl command: ${error.message}`);
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
