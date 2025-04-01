const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Validate environment variables
if (!AZURE_STORAGE_CONNECTION_STRING || !CONTAINER_NAME) {
    throw new Error("Missing Azure Storage environment variables");
}

// Create a Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

module.exports = { containerClient };
