const fs = require("fs-extra");
const path = require("path");
const config = require("../config/default.json");
const {
  extractKeywords,
  extractKeywordsForProject,
  findProjects,
} = require("./extractor");
const { formatForMonaco } = require("./formatter");
const {
  downloadKeywordsFile,
  uploadKeywordsFile,
  uploadHistoryFile,
  mergeKeywords,
} = require("./minio");

async function processKeywords(repoDir, outputDir, projectName) {
  try {
    const projectLabel = projectName || "global";
    console.log(`Processing keywords for ${projectLabel}...`);

    const projectOutputDir = projectName
      ? path.join(outputDir, projectName)
      : outputDir;
    await fs.ensureDir(projectOutputDir);

    const keywords = projectName
      ? await extractKeywordsForProject(
          repoDir,
          config.directories,
          projectName
        )
      : await extractKeywords(repoDir, config.directories);

    const formattedKeywords = formatForMonaco(keywords);

    const extractedKeywordsFile = path.join(
      projectOutputDir,
      "extracted_keywords.json"
    );
    await fs.writeJson(extractedKeywordsFile, formattedKeywords, { spaces: 2 });

    const existingKeywordsFile = path.join(
      projectOutputDir,
      "existing_keywords.json"
    );
    const existingKeywords = await downloadKeywordsFile(
      existingKeywordsFile,
      projectName
    );

    const mergedKeywords = await mergeKeywords(
      existingKeywords,
      formattedKeywords
    );

    const mergedKeywordsFile = path.join(projectOutputDir, config.output.file);
    await fs.writeJson(mergedKeywordsFile, mergedKeywords, { spaces: 2 });

    const uploadedUrl = await uploadKeywordsFile(
      mergedKeywordsFile,
      config.output.file,
      projectName
    );

    const historyUrl = await uploadHistoryFile(mergedKeywordsFile, projectName);

    console.log(`Successfully processed keywords for ${projectLabel}`);
    console.log(`Uploaded to: ${uploadedUrl}`);
    if (historyUrl) {
      console.log(`History: ${historyUrl}`);
    }
  } catch (error) {
    console.error(
      `Error processing keywords for ${projectName || "global"}:`,
      error
    );
  }
}

module.exports = {
  processKeywords,
  findProjects,
};
