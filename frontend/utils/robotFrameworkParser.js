export function parseRobotFramework(fullContent) {
  const sections = {
    settings: "",
    variables: "",
    testCases: [],
    keywords: "",
    tasks: "",
  };

  const lines = fullContent.split("\n");
  let currentSectionKey = null;
  let currentBlockLines = [];

  const sectionRegex =
    /^\*\*\*\s*(Settings|Variables|Test Cases|Keywords|Tasks)\s*\*\*\*/i;

  const flushCurrentBlock = () => {
    if (!currentSectionKey || currentBlockLines.length === 0) {
      return;
    }
    sections[currentSectionKey] = currentBlockLines.join("\n").trimEnd();
    currentBlockLines = [];
  };

  let rawTestCasesSectionContent = [];
  let inTestCasesSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(sectionRegex);

    if (sectionMatch) {
      if (currentSectionKey && currentSectionKey !== "testcases") {
        flushCurrentBlock();
      }

      const newSectionName = sectionMatch[1].toLowerCase().replace(/\s/g, "");
      currentSectionKey = newSectionName;

      if (newSectionName === "testcases") {
        inTestCasesSection = true;
        if (rawTestCasesSectionContent.length > 0) {
          sections.testCases = parseIndividualTestCases(
            rawTestCasesSectionContent.join("\n")
          );
          rawTestCasesSectionContent = [];
        }
      } else {
        inTestCasesSection = false;
        if (rawTestCasesSectionContent.length > 0) {
          sections.testCases = parseIndividualTestCases(
            rawTestCasesSectionContent.join("\n")
          );
          rawTestCasesSectionContent = [];
        }
      }
      continue;
    }

    if (inTestCasesSection) {
      rawTestCasesSectionContent.push(line);
    } else if (currentSectionKey) {
      currentBlockLines.push(line);
    }
  }

  if (currentSectionKey && currentSectionKey !== "testcases") {
    flushCurrentBlock();
  } else if (inTestCasesSection && rawTestCasesSectionContent.length > 0) {
    sections.testCases = parseIndividualTestCases(
      rawTestCasesSectionContent.join("\n")
    );
  }

  for (const key of ["settings", "variables", "keywords", "tasks"]) {
    if (typeof sections[key] === "string") {
      sections[key] = sections[key].trimEnd();
    }
  }

  return sections;
}

function parseIndividualTestCases(testCasesSectionContent) {
  const testCases = [];
  const lines = testCasesSectionContent.split("\n");
  let currentTestCaseName = null;
  let currentTestCaseLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine !== "" && !line.startsWith(" ") && !line.startsWith("\t")) {
      if (currentTestCaseName !== null) {
        testCases.push({
          name: currentTestCaseName,
          content: currentTestCaseLines.join("\n").trimEnd(),
        });
      }
      currentTestCaseName = trimmedLine;
      currentTestCaseLines = [];
    } else if (currentTestCaseName !== null) {
      currentTestCaseLines.push(line);
    }
  }

  if (currentTestCaseName !== null) {
    testCases.push({
      name: currentTestCaseName,
      content: currentTestCaseLines.join("\n").trimEnd(),
    });
  }

  return testCases;
}

export function reconstructRobotFramework(parsedSections) {
  const parts = [];

  if (parsedSections.settings) {
    parts.push("*** Settings ***\n" + parsedSections.settings);
  }

  if (parsedSections.variables) {
    if (parts.length > 0) parts.push("");
    parts.push("*** Variables ***\n" + parsedSections.variables);
  }

  if (parsedSections.testCases && parsedSections.testCases.length > 0) {
    if (parts.length > 0) parts.push("");
    let tcContent = "*** Test Cases ***";
    parsedSections.testCases.forEach((tc, index) => {
      tcContent += "\n" + tc.name;
      if (tc.content) {
        tcContent += "\n" + tc.content;
      }
      if (index < parsedSections.testCases.length - 1) {
        tcContent += "\n";
      }
    });
    parts.push(tcContent);
  }

  if (parsedSections.keywords) {
    if (parts.length > 0) parts.push("");
    parts.push("*** Keywords ***\n" + parsedSections.keywords);
  }

  if (parsedSections.tasks) {
    if (parts.length > 0) parts.push("");
    parts.push("*** Tasks ***\n" + parsedSections.tasks);
  }

  return parts.join("\n\n").trim();
}
