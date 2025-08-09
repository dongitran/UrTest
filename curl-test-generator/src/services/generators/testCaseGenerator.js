import { GoogleGenAI } from '@google/genai';
import { AiProcessingError } from '../../errors/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export class TestCaseGenerator {
  constructor(jsonExtractor, processManager, aiInteractionManager) {
    this.jsonExtractor = jsonExtractor;
    this.processManager = processManager;
    this.aiInteractionManager = aiInteractionManager;
    this.maxFieldLength = config.get('processing.maxFieldLength');
    this.maxRetries = config.get('ai.maxRetries');

    logger.processing('Initializing Google AI client');

    if (!config.get('ai.geminiApiKey')) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    this.ai = new GoogleGenAI({
      apiKey: config.get('ai.geminiApiKey')
    });
  }

  async generateMultipleTestCases(curlData, processId) {
    let retryCount = 0;
    let lastError = null;

    while (retryCount <= this.maxRetries) {
      try {
        logger.processing(`Generating test cases (attempt ${retryCount + 1}/${this.maxRetries + 1})`, {
          processId,
          retryCount
        });

        if (retryCount > 0) {
          await this.processManager.updateProcessRetryCount(processId, retryCount);
        }

        const optimizedBody = this.optimizeBodyForPrompt(curlData.body);
        const prompt = this.buildPrompt(curlData, optimizedBody, retryCount);

        logger.processing('Calling Gemini API', { 
          promptLength: prompt.length,
          processId 
        });

        const response = await this.ai.models.generateContent({
          model: config.get('ai.model'),
          contents: prompt,
          generationConfig: {
            temperature: retryCount > 0 ? 0.1 + retryCount * 0.1 : config.get('ai.temperature'),
            maxOutputTokens: config.get('ai.maxOutputTokens')
          }
        });

        const responseText = response.text;
        logger.debug('AI response received', { 
          responseLength: responseText.length,
          processId 
        });

        await this.aiInteractionManager.saveAiInteraction(
          processId,
          prompt,
          responseText,
          config.get('ai.model'),
          retryCount,
          retryCount > 0
        );

        const jsonString = this.jsonExtractor.extractJsonFromAiResponse(responseText);

        let testCases;
        try {
          testCases = JSON.parse(jsonString);
        } catch (parseError) {
          logger.error(`JSON parse failed (attempt ${retryCount + 1})`, { 
            processId,
            error: parseError.message 
          });
          lastError = parseError;
          retryCount++;

          if (retryCount <= this.maxRetries) {
            logger.processing(`Retrying... (${retryCount}/${this.maxRetries})`, { processId });
            continue;
          } else {
            throw new AiProcessingError(
              `Failed to parse AI response after ${this.maxRetries} retries: ${parseError.message}`
            );
          }
        }

        if (!Array.isArray(testCases)) {
          logger.debug('Response is not an array, wrapping', { processId });
          testCases = [testCases];
        }

        if (testCases.length === 0) {
          const arrayError = new AiProcessingError('AI generated no test cases');
          lastError = arrayError;
          retryCount++;

          if (retryCount <= this.maxRetries) {
            logger.processing(`No test cases generated, retrying... (${retryCount}/${this.maxRetries})`, { 
              processId 
            });
            continue;
          } else {
            throw arrayError;
          }
        }

        logger.success(`Successfully parsed ${testCases.length} test cases on attempt ${retryCount + 1}`, {
          processId,
          testCaseCount: testCases.length
        });

        testCases.forEach((testCase, index) => {
          testCase.url = curlData.url;
          testCase.method = curlData.method;

          if (testCase.body && typeof testCase.body === 'object') {
            for (const [key, value] of Object.entries(testCase.body)) {
              if (typeof value === 'string' && value.length > this.maxFieldLength) {
                testCase.body[key] = this.limitFieldLength(value);
              }
            }
          }

          logger.debug(`Test case ${index + 1}: ${testCase.testCaseName}`, { processId });
        });

        if (retryCount > 0) {
          await this.processManager.updateProcessRetryCount(processId, retryCount);
        }

        return testCases;
      } catch (error) {
        logger.error(`Error on attempt ${retryCount + 1}`, { 
          processId,
          error: error.message 
        });
        lastError = error;
        retryCount++;

        if (retryCount <= this.maxRetries) {
          logger.processing(`Retrying due to error... (${retryCount}/${this.maxRetries})`, { 
            processId 
          });
          continue;
        }
      }
    }

    await this.processManager.updateProcessRetryCount(processId, this.maxRetries);
    throw new AiProcessingError(
      `Test case generation failed after ${this.maxRetries} retries. Last error: ${lastError?.message || 'Unknown error'}`
    );
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

  buildPrompt(curlData, optimizedBody, retryCount) {
    const basePrompt = `You are an expert API testing engineer. Analyze this API endpoint and create comprehensive test cases.

API Endpoint Analysis:
- URL: ${curlData.url}
- Method: ${curlData.method}
- Headers: ${JSON.stringify(curlData.headers, null, 2)}
- Request Body: ${optimizedBody ? JSON.stringify(optimizedBody, null, 2) : 'None'}

Please create a comprehensive set of test cases that cover:
- Happy path scenarios (2-3 different valid data sets)
- Validation testing (empty fields, missing required fields, invalid data types)
- Boundary testing (min/max values, edge cases, field length limits)
- Security testing (SQL injection, XSS, malicious input)
- Error handling (malformed data, invalid headers, unsupported content types)
- Edge cases and corner scenarios
- Performance considerations (reasonable payload sizes)
- Different data formats and character encodings

CRITICAL REQUIREMENTS:
- Your response must be ONLY a valid JSON array, no additional text
- Do NOT use any JavaScript functions like .repeat(), .join(), etc.
- Use actual literal string values for all test data
- For long string tests, write out actual long strings (max ${this.maxFieldLength} chars per field)
- For boundary testing, use realistic field lengths
- Ensure all JSON values are properly quoted and escaped

Generate as many relevant test cases as you think are necessary to thoroughly test this API endpoint. Be creative and think of real-world scenarios.

Return format:
[
  {
    "testCaseName": "descriptive name",
    "description": "what this test does", 
    "url": "${curlData.url}",
    "method": "${curlData.method}",
    "headers": {...},
    "body": {...},
    "expectedResponse": {
      "statusCode": 200,
      "contentType": "application/json",
      "description": "expected outcome"
    },
    "testPurpose": "why this test is important"
  }
]`;

    if (retryCount > 0) {
      return basePrompt + `

IMPORTANT: This is retry attempt ${retryCount}. Please ensure your response is STRICTLY valid JSON format only. Do not include any explanatory text, comments, or markdown formatting. Start immediately with [ and end with ].`;
    }

    return basePrompt;
  }
}
