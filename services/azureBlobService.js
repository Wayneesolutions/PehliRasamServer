const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

const uploadToAzure = async (file) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Check if the container exists, if not create it
  const exists = await containerClient.exists();
  if (!exists) {
    console.log(`Container ${containerName} does not exist. Creating it.`);
    await blobServiceClient.createContainer(containerName);
  }

  const blobName = `${uuidv4()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype
    }
  });

  return blockBlobClient.url;
};

module.exports = uploadToAzure;
