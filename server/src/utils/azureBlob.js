import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

dotenv.config();

const containerName = process.env.AZURE_CONTAINER_NAME;
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const publicBaseUrl = process.env.AZURE_STORAGE_URL; // optional: e.g. https://<account>.blob.core.windows.net

if (!connectionString) {
  console.warn("AZURE_STORAGE_CONNECTION_STRING not set; Azure Blob operations will fail.");
}

const blobServiceClient = connectionString
  ? BlobServiceClient.fromConnectionString(connectionString)
  : null;

export async function uploadFileToBlob(filePath, originalName) {
  try {
    if (!blobServiceClient) throw new Error("BlobServiceClient not configured");
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}-${path.basename(originalName)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
    console.log(`✅ File uploaded to Azure Blob: ${blobName}`);
    return {
      blobName,
      url: publicBaseUrl ? `${publicBaseUrl}/${containerName}/${blobName}` : blockBlobClient.url,
      etag: uploadBlobResponse.etag,
    };
  } catch (err) {
    console.error("Azure Blob upload failed:", err.message);
    throw err;
  }
}