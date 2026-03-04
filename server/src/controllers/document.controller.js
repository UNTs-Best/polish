import fs from "fs";
import { uploadFileToSupabase } from "../utils/supabaseStorage.js";
import DocumentService from "../services/document.service.js";

const documentService = new DocumentService();

/**
 * Upload a file -> Supabase Storage -> save metadata in Supabase
 */
export const uploadDocument = async (req, res) => {
  try {
    const { file } = req;
    const { title } = req.body;
    const ownerId = req.auth?.id || "anonymous";

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const storageResult = await uploadFileToSupabase(file.path, file.originalname, ownerId);

    const doc = await documentService.createDocument({
      title: title || file.originalname,
      ownerId,
      blobName: storageResult.fileName,
      blobUrl: storageResult.url,
      size: file.size,
      mimeType: file.mimetype,
    });

    fs.unlinkSync(file.path); // cleanup temp file
    res.status(201).json(doc);
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
    const ownerId = req.auth?.id || "anonymous";
    const docs = await documentService.getUserDocuments(ownerId);
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
    const updatedBy = req.auth?.id || null;
    const updated = await documentService.updateDocument(id, updates, updatedBy);
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
    await documentService.deleteDocument(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: 'Database unavailable' });
  }
};
