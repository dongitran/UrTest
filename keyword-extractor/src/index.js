require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const { fetchRobotFrameworkFiles } = require("./github");
const { extractKeywords } = require("./extractor");
const { formatForMonaco } = require("./formatter");
const {
  downloadKeywordsFile,
  uploadKeywordsFile,
  uploadHistoryFile,
  mergeKeywords,
} = require("./minio");
const config = require("../config/default.json");

async function main() {
  try {
    const tempDir = path.join(__dirname, "../temp");
    await fs.ensureDir(tempDir);

    const outputDir = path.join(__dirname, "../output");
    await fs.ensureDir(outputDir);

    const repoDir = await fetchRobotFrameworkFiles(tempDir);

    const keywords = await extractKeywords(repoDir, config.directories);

    const formattedKeywords = formatForMonaco(keywords);

    const extractedKeywordsFile = path.join(
      outputDir,
      "extracted_keywords.json"
    );
    await fs.writeJson(extractedKeywordsFile, formattedKeywords, { spaces: 2 });

    const existingKeywordsFile = path.join(outputDir, "existing_keywords.json");
    const existingKeywords = await downloadKeywordsFile(existingKeywordsFile);

    const mergedKeywords = await mergeKeywords(
      existingKeywords,
      formattedKeywords
    );

    const mergedKeywordsFile = path.join(outputDir, config.output.file);
    await fs.writeJson(mergedKeywordsFile, mergedKeywords, { spaces: 2 });

    const uploadedUrl = await uploadKeywordsFile(
      mergedKeywordsFile,
      config.output.file
    );

    const historyUrl = await uploadHistoryFile(mergedKeywordsFile);
    console.log(historyUrl, "historyUrl");
  } catch (error) {
    process.exit(1);
  }
}

main();
