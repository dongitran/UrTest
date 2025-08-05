require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY,
  
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  REPO_FOLDER: process.env.REPO_FOLDER || 'tests',
  
  MINIO_CONFIG: {
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  },
  MINIO_BUCKET: process.env.MINIO_BUCKET,
  
  UPLOAD_API_URL: process.env.UPLOAD_API_URL,
  UPLOAD_API_KEY: process.env.UPLOAD_API_KEY,
  UPLOAD_RESPONSE_URL: process.env.UPLOAD_RESPONSE_URL,
};
