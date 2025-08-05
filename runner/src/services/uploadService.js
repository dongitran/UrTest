const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const config = require("../config");

exports.uploadFile = async (filePath, objectName) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const pathParts = objectName.split("/");
    const filename = pathParts.pop();
    const folder = pathParts.join("/") || "default";

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("filename", filename);
    form.append("folder", folder);

    const response = await axios({
      method: "POST",
      url: config.UPLOAD_API_URL,
      headers: {
        "api-key": config.UPLOAD_API_KEY,
        ...form.getHeaders(),
      },
      data: form,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("Upload response status:", response.status);

    const result = response.data;

    console.log("File uploaded successfully via API:", {
      filename: result.filename,
      url: result.url,
    });

    return {
      bucket: folder,
      object: result.fullPath,
      url: result.url,
    };
  } catch (error) {
    console.error(
      "Error uploading file via API:",
      error.response?.data || error.message
    );
    throw error;
  }
};
