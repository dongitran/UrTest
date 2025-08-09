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
  }

  getDatabase() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
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

  extractJsonFromAiResponse(responseText) {
    console.log('🔍 Extracting JSON from AI response...');
    console.log('📝 Raw AI response length:', responseText.length);
    console.log('📝 First 300 chars:', responseText.substring(0, 300));

    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
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

    console.log('✅ Extracted JSON length:', extracted.length);
    console.log('📝 Extracted JSON preview:', extracted.substring(0, 200));

    try {
      JSON.parse(extracted);
      return extracted;
    } catch (e) {
      console.log('❌ Extracted JSON is invalid, cleaning up...');

      let cleaned = extracted
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      console.log('🔧 Cleaned JSON preview:', cleaned.substring(0, 200));
      return cleaned;
    }
  }

  async generateMultipleTestCases(curlData) {
    try {
      console.log('🤖 Generating multiple test cases using AI...');

      const prompt = `You are an expert API testing engineer. Analyze this API endpoint and create comprehensive test cases to thoroughly test all aspects of the API.

API Endpoint Analysis:
- URL: ${curlData.url}
- Method: ${curlData.method}
- Headers: ${JSON.stringify(curlData.headers, null, 2)}
- Request Body: ${
        curlData.body ? JSON.stringify(curlData.body, null, 2) : 'None'
      }

Please create a comprehensive set of test cases that cover:
- Happy path scenarios
- Validation testing (empty fields, missing fields, invalid data types)
- Boundary testing (min/max values, edge cases)
- Security testing (injection attacks, malicious input)
- Error handling (malformed data, invalid headers)
- Edge cases and corner scenarios
- Performance considerations (large payloads)
- Different data formats and encodings

CRITICAL: Your response must be pure JSON with actual data values. Do NOT use any JavaScript functions, expressions, or code like .repeat(), .join(), etc. All string values must be literal strings, not function calls.

For large string testing, provide actual long strings like:
- For testing long names: use actual long strings like "VeryLongFirstNameWithManyCharactersToTestBoundaryLimits"
- For testing very large payloads: use strings with hundreds of actual characters
- Do NOT use "A".repeat(1000) or any functions - write out actual long strings

Generate as many relevant test cases as you think are necessary to thoroughly test this API endpoint. Be creative and think of real-world scenarios that could break or stress the API.

Return your response as a JSON array only, no additional text. Ensure all values are valid JSON data types (string, number, boolean, null, object, array):

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

      console.log('🤖 Calling Gemini API for multiple test cases...');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      console.log('🤖 AI Response received:', JSON.stringify(response));

      const responseText = response.text;
      const jsonString = this.extractJsonFromAiResponse(responseText);

      let testCases;
      try {
        testCases = JSON.parse(jsonString);
      } catch (parseError) {
        console.log('❌ JSON parse failed, trying to fix common issues...');
        console.log('🔧 Parse error:', parseError.message);

        let fixedJson = jsonString
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/'/g, '"')
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
          .replace(/:\s*([^",\[\]{}\s]+)(\s*[,\]}])/g, ':"$1"$2')
          .trim();

        console.log('🔧 Fixed JSON preview:', fixedJson.substring(0, 300));

        try {
          testCases = JSON.parse(fixedJson);
        } catch (secondError) {
          console.log(
            '❌ Second parse failed, extracting individual test cases...'
          );

          testCases = [];

          // Strategy 1: Split by test case pattern and parse each one
          const testCasePattern = /"testCaseName"\s*:\s*"[^"]*"/g;
          const matches = jsonString.match(testCasePattern);

          if (matches && matches.length > 0) {
            console.log(
              `🔍 Found ${matches.length} potential test cases by pattern matching`
            );

            // Find the start positions of each test case
            const testCasePositions = [];
            let searchPos = 0;

            for (const match of matches) {
              const pos = jsonString.indexOf(match, searchPos);
              if (pos !== -1) {
                // Find the start of the object (go back to find '{')
                let objectStart = pos;
                while (objectStart > 0 && jsonString[objectStart] !== '{') {
                  objectStart--;
                }
                testCasePositions.push(objectStart);
                searchPos = pos + match.length;
              }
            }

            // Extract each test case object
            for (let i = 0; i < testCasePositions.length; i++) {
              const startPos = testCasePositions[i];
              const endPos =
                i < testCasePositions.length - 1
                  ? testCasePositions[i + 1]
                  : jsonString.length;

              let objectDepth = 0;
              let inString = false;
              let escaping = false;
              let objectEnd = startPos;

              for (let j = startPos; j < endPos && j < jsonString.length; j++) {
                const char = jsonString[j];

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
                const objectStr = jsonString.substring(startPos, objectEnd);

                try {
                  // Clean up the object string
                  let cleanObject = objectStr
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                  // Fix unquoted keys
                  cleanObject = cleanObject.replace(
                    /([{,]\s*)(\w+):/g,
                    '$1"$2":'
                  );

                  const testCase = JSON.parse(cleanObject);

                  if (
                    testCase.testCaseName &&
                    testCase.url &&
                    testCase.method
                  ) {
                    testCases.push(testCase);
                    console.log(
                      `✅ Extracted test case: ${testCase.testCaseName}`
                    );
                  } else {
                    console.log(
                      `⚠️ Invalid test case structure, missing required fields`
                    );
                  }
                } catch (objError) {
                  console.log(
                    `⚠️ Failed to parse test case ${i + 1}: ${objError.message}`
                  );
                  // Try to save what we can
                  const truncatedObj = objectStr.substring(
                    0,
                    Math.min(500, objectStr.length)
                  );
                  console.log(
                    `📝 Problematic object preview: ${truncatedObj}...`
                  );
                }
              } else {
                console.log(
                  `⚠️ Unmatched braces for test case ${i + 1}, skipping...`
                );
              }
            }
          }

          // Strategy 2: If strategy 1 didn't work well, try regex approach
          if (testCases.length === 0) {
            console.log('🔄 Trying regex-based extraction as fallback...');

            const simplePattern = /{[^{}]*?"testCaseName"[^{}]*?}/g;
            let match;
            while ((match = simplePattern.exec(jsonString)) !== null) {
              try {
                let cleanMatch = match[0]
                  .replace(/,\s*}/g, '}')
                  .replace(/'/g, '"')
                  .replace(/([{,]\s*)(\w+):/g, '$1"$2":');

                const testCase = JSON.parse(cleanMatch);
                if (testCase.testCaseName) {
                  testCases.push(testCase);
                  console.log(`✅ Regex extracted: ${testCase.testCaseName}`);
                }
              } catch (matchError) {
                console.log('⚠️ Failed to parse regex match, skipping...');
              }
            }
          }

          console.log(
            '✅ Successfully extracted',
            testCases.length,
            'test cases individually'
          );

          if (testCases.length === 0) {
            throw new Error('Failed to parse any test cases from AI response');
          }
        }
      }

      if (!Array.isArray(testCases)) {
        console.log('❌ Response is not an array, wrapping...');
        testCases = [testCases];
      }

      console.log('✅ Successfully parsed', testCases.length, 'test cases');

      testCases.forEach((testCase, index) => {
        testCase.url = curlData.url;
        testCase.method = curlData.method;
        console.log(`📋 Test case ${index + 1}: ${testCase.testCaseName}`);
      });

      return testCases;
    } catch (error) {
      console.error('❌ Error generating test cases:', error);
      console.error('❌ Error details:', error.message);

      console.log('🔄 Falling back to simple test cases...');
      return this.generateFallbackTestCases(curlData);
    }
  }

  generateFallbackTestCases(curlData) {
    console.log('🛠️ Generating fallback test cases...');

    const fallbackCases = [
      {
        testCaseName: 'Happy Path Test',
        description: 'Test with original valid data',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body,
        expectedResponse: {
          statusCode: 201,
          contentType: 'application/json',
          description: 'Successful creation',
        },
        testPurpose: 'Verify successful API call with valid data',
      },
      {
        testCaseName: 'Empty Field Validation',
        description: 'Test with empty firstName',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body ? { ...curlData.body, firstName: '' } : null,
        expectedResponse: {
          statusCode: 400,
          contentType: 'application/json',
          description: 'Validation error for empty field',
        },
        testPurpose: 'Test field validation',
      },
      {
        testCaseName: 'Missing Required Field',
        description: 'Test without lastName field',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body
          ? (() => {
              const { lastName, ...bodyWithoutLastName } = curlData.body;
              return bodyWithoutLastName;
            })()
          : null,
        expectedResponse: {
          statusCode: 400,
          contentType: 'application/json',
          description: 'Missing required field',
        },
        testPurpose: 'Test required field validation',
      },
      {
        testCaseName: 'Invalid Content Type',
        description: 'Test with wrong content type',
        url: curlData.url,
        method: curlData.method,
        headers: { ...curlData.headers, 'Content-Type': 'text/plain' },
        body: curlData.body,
        expectedResponse: {
          statusCode: 415,
          contentType: 'application/json',
          description: 'Unsupported media type',
        },
        testPurpose: 'Test content type validation',
      },
      {
        testCaseName: 'Boundary Value Test',
        description: 'Test with long telephone number',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body
          ? { ...curlData.body, telephone: '1'.repeat(30) }
          : null,
        expectedResponse: {
          statusCode: 400,
          contentType: 'application/json',
          description: 'Field length validation error',
        },
        testPurpose: 'Test field length boundaries',
      },
      {
        testCaseName: 'Special Characters Test',
        description: 'Test with special characters',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body
          ? { ...curlData.body, firstName: 'José', lastName: 'García' }
          : null,
        expectedResponse: {
          statusCode: 201,
          contentType: 'application/json',
          description: 'Should handle special characters',
        },
        testPurpose: 'Test special character support',
      },
      {
        testCaseName: 'SQL Injection Test',
        description: 'Test with SQL injection attempt',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body
          ? { ...curlData.body, firstName: "'; DROP TABLE users; --" }
          : null,
        expectedResponse: {
          statusCode: 400,
          contentType: 'application/json',
          description: 'Should prevent SQL injection',
        },
        testPurpose: 'Test security against SQL injection',
      },
      {
        testCaseName: 'XSS Injection Test',
        description: 'Test with XSS script injection',
        url: curlData.url,
        method: curlData.method,
        headers: curlData.headers,
        body: curlData.body
          ? { ...curlData.body, firstName: "<script>alert('xss')</script>" }
          : null,
        expectedResponse: {
          statusCode: 400,
          contentType: 'application/json',
          description: 'Should prevent XSS injection',
        },
        testPurpose: 'Test security against XSS attacks',
      },
    ];

    console.log('✅ Generated', fallbackCases.length, 'fallback test cases');
    return fallbackCases;
  }

  async executeTestCase(testCase) {
    try {
      console.log('🧪 Executing test case:', testCase.testCaseName);

      const config = {
        method: testCase.method.toLowerCase(),
        url: testCase.url,
        headers: testCase.headers,
        timeout: 10000,
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
        const testCases = await this.generateMultipleTestCases(curlData);

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
}