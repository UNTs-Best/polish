import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

dotenv.config();

const account = process.env.AZURE_STORAGE_ACCOUNT;
const key = process.env.AZURE_STORAGE_KEY;
const containerName = process.env.AZURE_CONTAINER_NAME;
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  new Azure.StorageSharedKeyCredential(account, key)
);

export async function uploadFileToBlob(filePath, originalName) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${uuidv4()}-${path.basename(originalName)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
    console.log(`✅ File uploaded to Azure Blob: ${blobName}`);
    return {
      blobName,
      url: `${process.env.AZURE_STORAGE_URL}/${containerName}/${blobName}`,
      etag: uploadBlobResponse.etag,
    };
  } catch (err) {
    console.error("Azure Blob upload failed:", err.message);
    throw err;
  }
}