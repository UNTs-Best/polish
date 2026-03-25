import DocumentService from "../services/document.service.js";

const documentService = new DocumentService();

/**
 * Upload a file → storage → save metadata
 * TODO: wire up S3-compatible storage in TypeScript rewrite
 */
export const uploadDocument = async (req, res) => {
  res.status(501).json({ message: "File upload not implemented — pending storage integration" });
};

export const getDocuments = async (req, res) => {
  try {
    const ownerId = req.auth?.id || "anonymous";
    const docs = await documentService.getUserDocuments(ownerId);
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: "Database unavailable" });
  }
};

export const renameDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedBy = req.auth?.id || null;
    const updated = await documentService.updateDocument(id, updates, updatedBy);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: "Database unavailable" });
  }
};

export const removeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await documentService.deleteDocument(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: "Database unavailable" });
  }
};
