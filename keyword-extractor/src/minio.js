const Minio = require("minio");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

function createMinioClient() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
}

async function downloadKeywordsFile(outputPath, projectName = null) {
  try {
    const url = projectName
      ? `${process.env.KEYWORDS_URL_BASE}/${projectName}/robotFrameworkKeywords.json`
      : process.env.KEYWORDS_URL;

    try {
      const response = await axios.get(url);
      await fs.writeJson(outputPath, response.data, { spaces: 2 });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(
          `No existing keywords file found at ${url}, starting with empty array`
        );
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error("Error downloading keywords file:", error.message);
    return [];
  }
}

async function uploadKeywordsFile(filePath, fileName, projectName = null) {
  try {
    const minioClient = createMinioClient();

    const objectName = projectName ? `${projectName}/${fileName}` : fileName;

    await minioClient.fPutObject(
      process.env.MINIO_BUCKET,
      objectName,
      filePath,
      {
        "Content-Type": "application/json",
      }
    );

    return `https://${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${objectName}`;
  } catch (error) {
    console.error("Error uploading file to Minio:", error.message);
    throw error;
  }
}

async function uploadHistoryFile(filePath, projectName = null) {
  try {
    const minioClient = createMinioClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const historyFileName = projectName
      ? `history/${projectName}/robotFrameworkKeywords_${timestamp}.json`
      : `history/robotFrameworkKeywords_${timestamp}.json`;

    await minioClient.fPutObject(
      process.env.MINIO_BUCKET,
      historyFileName,
      filePath,
      { "Content-Type": "application/json" }
    );

    return `https://${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${historyFileName}`;
  } catch (error) {
    console.error("Error uploading history file to Minio:", error.message);
    return null;
  }
}

async function mergeKeywords(existingKeywords, newKeywords) {
  try {
    const existingKeywordsMap = new Map();

    if (existingKeywords && Array.isArray(existingKeywords)) {
      existingKeywords.forEach((keyword) => {
        existingKeywordsMap.set(keyword.label, keyword);
      });
    } else {
      console.log("No existing keywords found, starting with empty array");
      existingKeywords = [];
    }

    let addedCount = 0;
    for (const newKeyword of newKeywords) {
      if (!existingKeywordsMap.has(newKeyword.label)) {
        existingKeywords.push(newKeyword);
        existingKeywordsMap.set(newKeyword.label, newKeyword);
        addedCount++;
      }
    }

    console.log(`Added ${addedCount} new keywords`);
    return existingKeywords;
  } catch (error) {
    console.error("Error merging keywords:", error.message);
    throw error;
  }
}

module.exports = {
  downloadKeywordsFile,
  uploadKeywordsFile,
  uploadHistoryFile,
  mergeKeywords,
};
