const Minio = require('minio');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const minioClient = new Minio.Client({
  ...config.MINIO_CONFIG,
  requestOptions: {
    timeout: 300000,
  }
});

const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(config.MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(config.MINIO_BUCKET);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
};

exports.uploadFile = async (filePath, objectName) => {
  try {
    await ensureBucket();

    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);

    const extension = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';

    if (extension === '.html') {
      contentType = 'text/html';
    } else if (extension === '.xml') {
      contentType = 'application/xml';
    }

    const uploadOptions = { 'Content-Type': contentType };
    
    if (fileStats.size > 50 * 1024 * 1024) {
      uploadOptions.partSize = 10 * 1024 * 1024;
    }

    await minioClient.putObject(
      config.MINIO_BUCKET,
      objectName,
      fileStream,
      fileStats.size,
      uploadOptions
    );

    return {
      bucket: config.MINIO_BUCKET,
      object: objectName
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw error;
  }
};
