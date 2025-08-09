export class JsonExtractor {
  constructor() {
    this.maxFieldLength = 128;
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
}
