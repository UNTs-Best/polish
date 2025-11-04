import Document from "../models/document.model.js";

/**
 * Create metadata record after upload
 */
export async function createDocumentMeta(data) {
  return await Document.create(data);
}

/**
 * Fetch all docs for a specific user
 */
export async function getUserDocuments(ownerId) {
  return await Document.find({ ownerId }).sort({ updatedAt: -1 });
}

/**
 * Update metadata (rename, version bump, etc.)
 */
export async function updateDocument(id, updates) {
  return await Document.findByIdAndUpdate(id, updates, { new: true });
}

/**
 * Delete metadata record
 */
export async function deleteDocument(id) {
  return await Document.findByIdAndDelete(id);
}