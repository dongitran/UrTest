import * as curlconverter from 'curlconverter';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { getDB } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

export class CurlService {
  constructor() {
    console.log('🔑 Initializing Google AI...');

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.db = null;
    this.maxFieldLength = 128;
    this.maxRetries = 3;
  }

  getDatabase() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
  }

  async saveAiInteraction(
    processId,
    prompt,
    response,
    model = 'gemini-2.5-flash',
    retryAttempt = 0,
    isRetry = false
  ) {
    try {
      const db = this.getDatabase();
      const aiCollection = db.collection('ai_interactions');

      const interactionDoc = {
        interactionId: uuidv4(),
        processId,
        prompt,
        response,
        model,
        retryAttempt,
        isRetry,
        createdAt: new Date(),
        promptLength: prompt.length,
        responseLength: response.length,
      };

      await aiCollection.insertOne(interactionDoc);
      console.log(
        `✅ AI interaction saved to database (retry: ${retryAttempt})`
      );
    } catch (error) {
      console.error('❌ Error saving AI interaction:', error);
    }
  }

  async updateProcessRetryCount(processId, retryCount) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            retryCount,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating retry count:', error);
    }
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

  extractJsonFromAiResponse(responseText) {
    console.log('🔍 Extracting JSON from AI response...');
    console.log('📝 Raw AI response length:', responseText.length);
    console.log('📝 First 200 chars:', responseText.substring(0, 200));

    let cleaned = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (
      firstBracket === -1 ||
      lastBracket === -1 ||
      lastBracket <= firstBracket
    ) {
      throw new Error('No valid JSON array found in AI response');
    }

    cleaned = cleaned.substring(firstBracket, lastBracket + 1);

    cleaned = cleaned
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('✅ Extracted JSON length:', cleaned.length);
    console.log('📝 Extracted JSON preview:', cleaned.substring(0, 300));

    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      console.log('❌ Simple extraction failed, trying complex parsing...');
      return this.complexJsonExtraction(responseText);
    }
  }

  complexJsonExtraction(responseText) {
    console.log('🔧 Using complex JSON extraction...');

    responseText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const firstBracket = responseText.indexOf('[');
    if (firstBracket === -1) {
      throw new Error('No JSON array found in AI response');
    }

    let depth = 0;
    let inString = false;
    let escaping = false;
    let extracted = '';

    for (let i = firstBracket; i < responseText.length; i++) {
      const currentChar = responseText[i];
      extracted += currentChar;

      if (escaping) {
        escaping = false;
        continue;
      }

      if (currentChar === '\\') {
        escaping = true;
        continue;
      }

      if (currentChar === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (currentChar === '[') {
        depth++;
      } else if (currentChar === ']') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }

    if (depth !== 0) {
      console.log('⚠️ Unmatched brackets, trying simple extraction...');
      const lastBracket = responseText.lastIndexOf(']');
      if (lastBracket > firstBracket) {
        extracted = responseText.substring(firstBracket, lastBracket + 1);
      }
    }

    let cleaned = extracted
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      console.log(
        '❌ Complex extraction also failed, trying individual parsing...'
      );
      return this.parseIndividualTestCases(responseText);
    }
  }

  parseIndividualTestCases(responseText) {
    console.log('🔄 Parsing individual test cases...');

    const testCases = [];
    const testCasePattern = /"testCaseName"\s*:\s*"[^"]*"/g;
    const matches = responseText.match(testCasePattern);

    if (!matches || matches.length === 0) {
      throw new Error('No test cases found in AI response');
    }

    console.log(`🔍 Found ${matches.length} potential test cases`);

    const testCasePositions = [];
    let searchPos = 0;

    for (const match of matches) {
      const pos = responseText.indexOf(match, searchPos);
      if (pos !== -1) {
        let objectStart = pos;
        while (objectStart > 0 && responseText[objectStart] !== '{') {
          objectStart--;
        }
        testCasePositions.push(objectStart);
        searchPos = pos + match.length;
      }
    }

    for (let i = 0; i < testCasePositions.length; i++) {
      const startPos = testCasePositions[i];
      const endPos =
        i < testCasePositions.length - 1
          ? testCasePositions[i + 1]
          : responseText.length;

      const objectStr = this.extractSingleObject(
        responseText,
        startPos,
        endPos
      );

      if (objectStr) {
        try {
          const testCase = JSON.parse(objectStr);
          if (testCase.testCaseName && testCase.url && testCase.method) {
            testCases.push(testCase);
            console.log(`✅ Extracted test case: ${testCase.testCaseName}`);
          }
        } catch (objError) {
          console.log(
            `⚠️ Failed to parse test case ${i + 1}: ${objError.message}`
          );
        }
      }
    }

    if (testCases.length === 0) {
      throw new Error('Failed to parse any test cases from AI response');
    }

    return JSON.stringify(testCases);
  }

  extractSingleObject(text, startPos, endPos) {
    let objectDepth = 0;
    let inString = false;
    let escaping = false;
    let objectEnd = startPos;

    for (let j = startPos; j < endPos && j < text.length; j++) {
      const char = text[j];

      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === '\\') {
        escaping = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        objectDepth++;
      } else if (char === '}') {
        objectDepth--;
        if (objectDepth === 0) {
          objectEnd = j + 1;
          break;
        }
      }
    }

    if (objectDepth === 0) {
      let objectStr = text.substring(startPos, objectEnd);

      objectStr = objectStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        .trim();

      return objectStr;
    }

    return null;
  }

  async generateMultipleTestCases(curlData, processId) {
    let retryCount = 0;
    let lastError = null;

    while (retryCount <= this.maxRetries) {
      try {
        console.log(
          `🤖 Generating test cases (attempt ${retryCount + 1}/${
            this.maxRetries + 1
          })...`
        );

        if (retryCount > 0) {
          await this.updateProcessRetryCount(processId, retryCount);
          console.log(
            `🔄 Retry attempt ${retryCount} for processId: ${processId}`
          );
        }

        const optimizedBody = this.optimizeBodyForPrompt(curlData.body);

        const prompt = this.buildPrompt(curlData, optimizedBody, retryCount);

        console.log('🤖 Calling Gemini API...');
        console.log('📏 Prompt length:', prompt.length);

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          generationConfig: {
            temperature: retryCount > 0 ? 0.1 + retryCount * 0.1 : 0.3,
            maxOutputTokens: 8192,
          },
        });

        const responseText = response.text;
        console.log('📝 AI response length:', responseText.length);

        await this.saveAiInteraction(
          processId,
          prompt,
          responseText,
          'gemini-2.5-flash',
          retryCount,
          retryCount > 0
        );

        const jsonString = this.extractJsonFromAiResponse(responseText);

        let testCases;
        try {
          testCases = JSON.parse(jsonString);
        } catch (parseError) {
          console.error(
            `❌ JSON parse failed (attempt ${retryCount + 1}):`,
            parseError.message
          );
          lastError = parseError;
          retryCount++;

          if (retryCount <= this.maxRetries) {
            console.log(`🔄 Retrying... (${retryCount}/${this.maxRetries})`);
            continue;
          } else {
            console.error('❌ Max retries reached, throwing error');
            throw new Error(
              `Failed to parse AI response after ${this.maxRetries} retries: ${parseError.message}`
            );
          }
        }

        if (!Array.isArray(testCases)) {
          console.log('❌ Response is not an array, wrapping...');
          testCases = [testCases];
        }

        if (testCases.length === 0) {
          const arrayError = new Error('AI generated no test cases');
          lastError = arrayError;
          retryCount++;

          if (retryCount <= this.maxRetries) {
            console.log(
              `🔄 No test cases generated, retrying... (${retryCount}/${this.maxRetries})`
            );
            continue;
          } else {
            throw arrayError;
          }
        }

        console.log(
          `✅ Successfully parsed ${testCases.length} test cases on attempt ${
            retryCount + 1
          }`
        );

        testCases.forEach((testCase, index) => {
          testCase.url = curlData.url;
          testCase.method = curlData.method;

          if (testCase.body && typeof testCase.body === 'object') {
            for (const [key, value] of Object.entries(testCase.body)) {
              if (
                typeof value === 'string' &&
                value.length > this.maxFieldLength
              ) {
                testCase.body[key] = this.limitFieldLength(value);
              }
            }
          }

          console.log(`📋 Test case ${index + 1}: ${testCase.testCaseName}`);
        });

        if (retryCount > 0) {
          await this.updateProcessRetryCount(processId, retryCount);
        }

        return testCases;
      } catch (error) {
        console.error(`❌ Error on attempt ${retryCount + 1}:`, error.message);
        lastError = error;
        retryCount++;

        if (retryCount <= this.maxRetries) {
          console.log(
            `🔄 Retrying due to error... (${retryCount}/${this.maxRetries})`
          );
          continue;
        }
      }
    }

    await this.updateProcessRetryCount(processId, this.maxRetries);
    throw new Error(
      `Test case generation failed after ${
        this.maxRetries
      } retries. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  buildPrompt(curlData, optimizedBody, retryCount) {
    const basePrompt = `You are an expert API testing engineer. Analyze this API endpoint and create comprehensive test cases.

API Endpoint Analysis:
- URL: ${curlData.url}
- Method: ${curlData.method}
- Headers: ${JSON.stringify(curlData.headers, null, 2)}
- Request Body: ${
      optimizedBody ? JSON.stringify(optimizedBody, null, 2) : 'None'
    }

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
- For long string tests, write out actual long strings (max ${
      this.maxFieldLength
    } chars per field)
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
      return (
        basePrompt +
        `

IMPORTANT: This is retry attempt ${retryCount}. Please ensure your response is STRICTLY valid JSON format only. Do not include any explanatory text, comments, or markdown formatting. Start immediately with [ and end with ].`
      );
    }

    return basePrompt;
  }

  async executeTestCase(testCase) {
    try {
      console.log('🧪 Executing test case:', testCase.testCaseName);

      const config = {
        method: testCase.method.toLowerCase(),
        url: testCase.url,
        headers: testCase.headers,
        timeout: 15000,
        validateStatus: () => true,
      };

      if (testCase.body && ['post', 'put', 'patch'].includes(config.method)) {
        config.data = testCase.body;
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();

      const result = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: endTime - startTime,
        success: response.status >= 200 && response.status < 400,
      };

      console.log(
        `✅ Test executed: ${testCase.testCaseName} - Status: ${result.statusCode} - Time: ${result.responseTime}ms`
      );

      return result;
    } catch (error) {
      console.error('❌ Error executing test case:', error.message);
      return {
        statusCode: null,
        statusText: 'ERROR',
        headers: {},
        data: null,
        responseTime: null,
        success: false,
        error: error.message,
      };
    }
  }

  async initializeProcess(curlText, processId) {
    try {
      const curlData = await this.parseCurl(curlText);

      const db = this.getDatabase();
      const processCollection = db.collection('curl_processes');

      const processDoc = {
        processId,
        originalCurl: curlData,
        originalCurlText: curlText,
        status: 'initialized',
        totalTestCases: 0,
        completedTestCases: 0,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await processCollection.insertOne(processDoc);
      console.log('✅ Process initialized in database');

      return {
        processId,
        status: 'initialized',
        message:
          'Process started, test cases are being generated in background',
      };
    } catch (error) {
      console.error('❌ Error initializing process:', error);
      throw new Error(`Failed to initialize process: ${error.message}`);
    }
  }

  async processInBackground(processId, curlText) {
    setImmediate(async () => {
      try {
        console.log(
          `🔄 Background processing started for processId: ${processId}`
        );

        await this.updateProcessStatus(processId, 'parsing_curl');
        const curlData = await this.parseCurl(curlText);

        await this.updateProcessStatus(processId, 'generating_test_cases');

        let testCases;
        try {
          testCases = await this.generateMultipleTestCases(curlData, processId);
        } catch (testGenError) {
          console.error(
            '❌ Test case generation failed:',
            testGenError.message
          );
          await this.updateProcessStatus(
            processId,
            'error',
            `Test generation failed: ${testGenError.message}`
          );
          return;
        }

        await this.updateProcessStatus(processId, 'executing_test_cases');
        await this.updateProcessTestCaseCount(processId, testCases.length);

        const db = this.getDatabase();
        const testCaseCollection = db.collection('test_cases');

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];

          console.log(
            `🧪 Processing test case ${i + 1}/${testCases.length}: ${
              testCase.testCaseName
            }`
          );

          const result = await this.executeTestCase(testCase);

          const testCaseDoc = {
            testCaseId: uuidv4(),
            processId,
            testCaseName: testCase.testCaseName,
            description: testCase.description,
            url: testCase.url,
            method: testCase.method,
            headers: testCase.headers,
            body: testCase.body,
            expectedResponse: testCase.expectedResponse,
            testPurpose: testCase.testPurpose,
            result: result,
            order: i + 1,
            createdAt: new Date(),
            executedAt: new Date(),
          };

          await testCaseCollection.insertOne(testCaseDoc);
          await this.updateCompletedTestCases(processId, i + 1);

          console.log(`✅ Test case ${i + 1} completed and saved`);
        }

        await this.updateProcessStatus(processId, 'completed');
        console.log(
          `🎉 Background processing completed for processId: ${processId}`
        );
      } catch (error) {
        console.error('❌ Error in background processing:', error);
        await this.updateProcessStatus(processId, 'error', error.message);
      }
    });
  }

  async updateProcessStatus(processId, status, errorMessage = null) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      const updateData = {
        status,
        updatedAt: new Date(),
      };

      if (errorMessage) {
        updateData.error = errorMessage;
      }

      await collection.updateOne({ processId }, { $set: updateData });
    } catch (error) {
      console.error('❌ Error updating process status:', error);
    }
  }

  async updateProcessTestCaseCount(processId, totalTestCases) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            totalTestCases,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating test case count:', error);
    }
  }

  async updateCompletedTestCases(processId, completedTestCases) {
    try {
      const db = this.getDatabase();
      const collection = db.collection('curl_processes');

      await collection.updateOne(
        { processId },
        {
          $set: {
            completedTestCases,
            updatedAt: new Date(),
          },
        }
      );
    } catch (error) {
      console.error('❌ Error updating completed test cases:', error);
    }
  }

  async getProcessWithTestCases(processId) {
    try {
      const db = this.getDatabase();
      const processCollection = db.collection('curl_processes');
      const testCaseCollection = db.collection('test_cases');

      const process = await processCollection.findOne({ processId });
      if (!process) {
        return null;
      }

      const testCases = await testCaseCollection
        .find({ processId })
        .sort({ order: 1 })
        .toArray();

      return {
        ...process,
        testCases: testCases,
      };
    } catch (error) {
      console.error('❌ Error getting process with test cases:', error);
      throw new Error(`Failed to get process: ${error.message}`);
    }
  }

  async getAiInteractions(processId) {
    try {
      const db = this.getDatabase();
      const aiCollection = db.collection('ai_interactions');

      const interactions = await aiCollection
        .find({ processId })
        .sort({ createdAt: 1 })
        .toArray();

      return interactions;
    } catch (error) {
      console.error('❌ Error getting AI interactions:', error);
      throw new Error(`Failed to get AI interactions: ${error.message}`);
    }
  }
}
