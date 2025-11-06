import fs from "fs";
import { uploadFileToBlob } from "../utils/azureBlob.js";
import {
  createDocumentMeta,
  getUserDocuments,
  updateDocument,
  deleteDocument,
} from "../services/document.service.js";

/**
 * Upload a file -> Azure Blob -> save metadata in Mongo
 */
export const uploadDocument = async (req, res) => {
  try {
    const { file } = req;
    const { title } = req.body;
    const ownerId = req.user?.sub || "anonymous"; // from Auth middleware

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const blobResult = await uploadFileToBlob(file.path, file.originalname);

    const docMeta = await createDocumentMeta({
      title: title || file.originalname,
      ownerId,
      blobName: blobResult.blobName,
      blobUrl: blobResult.url,
      size: file.size,
      mimeType: file.mimetype,
    });

    fs.unlinkSync(file.path); // cleanup temp file
    res.status(201).json(docMeta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all documents for logged-in user
 */
export const getDocuments = async (req, res) => {
  try {
    const ownerId = req.user?.sub || "anonymous";
    const docs = await getUserDocuments(ownerId);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: 'Database unavailable' });
  }
};

/**
 * Update document metadata
 */
export const renameDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateDocument(id, updates);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: 'Database unavailable' });
  }
};

/**
 * Delete document metadata
 */
export const removeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDocument(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: 'Database unavailable' });
  }
};