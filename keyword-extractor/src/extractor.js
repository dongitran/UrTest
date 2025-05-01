const fs = require("fs-extra");
const path = require("path");

async function findRobotFiles(baseDir, directories) {
  try {
    const robotFiles = [];

    for (const dir of directories) {
      const dirPath = path.join(baseDir, dir);

      if (!(await fs.pathExists(dirPath))) {
        continue;
      }

      await scanDirectory(dirPath, robotFiles, baseDir);
    }

    return robotFiles;
  } catch (error) {
    console.log("Error finding Robot Framework files:", error.message);
    throw error;
  }
}

async function scanDirectory(dir, files, baseDir) {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        await scanDirectory(itemPath, files, baseDir);
      } else if (item.name.endsWith(".robot")) {
        const relativePath = path.relative(baseDir, itemPath);
        const pathParts = relativePath.split(path.sep);

        // Include if:
        // 1. Not under tests/ directory, OR
        // 2. Under tests/(project)/resources/ directory
        const isUnderTests = pathParts[0] === "tests";
        const isUnderResources = pathParts.includes("resources");

        if (!isUnderTests || isUnderResources) {
          files.push(itemPath);
        } else {
          console.log(`Skipping test suite file: ${relativePath}`);
        }
      }
    }
  } catch (error) {
    console.log(`Error scanning directory ${dir}:`, error.message);
  }
}

async function extractKeywords(baseDir, directories) {
  try {
    const robotFiles = await findRobotFiles(baseDir, directories);
    const keywords = [];
    let fileCount = 0;

    for (const file of robotFiles) {
      fileCount++;
      console.log(
        `[${fileCount}/${robotFiles.length}] Processing file: ${file}`
      );
      try {
        const fileKeywords = await extractKeywordsFromFile(file, baseDir);
        keywords.push(...fileKeywords);
      } catch (error) {
        console.log(`Error extracting keywords from ${file}:`, error.message);
      }
    }

    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error.message);
    throw error;
  }
}

async function extractKeywordsFromFile(filePath, baseDir) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const relativePath = path.relative(baseDir, filePath);

    const keywordSectionMatches = content.match(
      /\*\*\* Keywords \*\*\*([\s\S]*?)(?=\*\*\*|$)/g
    );
    if (!keywordSectionMatches || keywordSectionMatches.length === 0) return [];

    const keywords = [];

    for (const keywordSectionMatch of keywordSectionMatches) {
      const keywordSection = keywordSectionMatch.replace(
        "*** Keywords ***",
        ""
      );

      const keywordBlocks = keywordSection
        .split(/(?=^[A-Za-z0-9].+$)/m)
        .filter((block) => block.trim() && !block.trim().startsWith("#"));

      for (const block of keywordBlocks) {
        const lines = block.split("\n");
        const nameMatch = lines[0].trim();
        if (!nameMatch) continue;

        const name = nameMatch;

        let args = [];
        let documentation = "";

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith("[Arguments]")) {
            const argsLine = line.replace("[Arguments]", "").trim();
            const initialArgs = argsLine
              .split(/\s{2,}|\t/)
              .filter((arg) => arg.trim());
            args.push(...initialArgs);

            let j = i + 1;
            while (j < lines.length) {
              const nextLine = lines[j].trim();
              if (
                nextLine &&
                !nextLine.startsWith("[") &&
                (nextLine.includes("${") ||
                  nextLine.includes("@{") ||
                  nextLine.includes("&{"))
              ) {
                const additionalArgs = nextLine
                  .split(/\s{2,}|\t/)
                  .filter(
                    (arg) =>
                      arg.trim() &&
                      (arg.includes("${") ||
                        arg.includes("@{") ||
                        arg.includes("&{"))
                  );
                args.push(...additionalArgs);
                j++;
              } else {
                break;
              }
            }
            i = j - 1;
          } else if (line.startsWith("[Documentation]")) {
            documentation = line.replace("[Documentation]", "").trim();

            let j = i + 1;
            while (j < lines.length) {
              const nextLine = lines[j].trim();
              if (
                nextLine &&
                !nextLine.startsWith("[") &&
                !(
                  nextLine.includes("${") ||
                  nextLine.includes("@{") ||
                  nextLine.includes("&{")
                )
              ) {
                documentation += " " + nextLine;
                j++;
              } else {
                break;
              }
            }
            i = j - 1;
          }
        }

        if (name) {
          keywords.push({
            name,
            args,
            documentation,
            source: relativePath,
          });
        }
      }
    }

    return keywords;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
    return [];
  }
}

module.exports = {
  extractKeywords,
};
