const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Azure config
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const uploadFile = async (file) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    const blobName = `${uuidv4()}${path.extname(file.originalname)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Azure Blob Upload Error:", error.message);
    throw error;
  }
};

module.exports = { uploadFile };
