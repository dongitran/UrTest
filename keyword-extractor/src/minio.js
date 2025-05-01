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

async function downloadKeywordsFile(outputPath) {
  try {
    const response = await axios.get(process.env.KEYWORDS_URL);

    await fs.writeJson(outputPath, response.data, { spaces: 2 });
    return response.data;
  } catch (error) {
    console.error("Error downloading keywords file:", error.message);
    throw error;
  }
}

async function uploadKeywordsFile(filePath, fileName) {
  try {
    const minioClient = createMinioClient();

    await minioClient.fPutObject(process.env.MINIO_BUCKET, fileName, filePath, {
      "Content-Type": "application/json",
    });

    return `https://${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${fileName}`;
  } catch (error) {
    console.error("Error uploading file to Minio:", error.message);
    throw error;
  }
}

async function uploadHistoryFile(filePath) {
  try {
    const minioClient = createMinioClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const historyFileName = `history/robotFrameworkKeywords_${timestamp}.json`;

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
    existingKeywords.forEach((keyword) => {
      existingKeywordsMap.set(keyword.label, keyword);
    });

    let addedCount = 0;
    for (const newKeyword of newKeywords) {
      if (!existingKeywordsMap.has(newKeyword.label)) {
        existingKeywords.push(newKeyword);
        existingKeywordsMap.set(newKeyword.label, newKeyword);
        addedCount++;
      }
    }
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
