import LLMService from "../services/llm.service.js";
import DocumentService from "../services/document.service.js";

/**
 * Generate suggestions for document content
 */
export const generateSuggestions = async (req, res) => {
  try {
    const { documentId } = req.params;
    const {
      action = 'improve',
      tone = 'professional',
      length = 'maintain',
      language = 'en',
      additionalInstructions = ''
    } = req.body;

    const ownerId = req.user?.sub || "anonymous";

    // Get document content
    const documentService = new DocumentService();
    const document = await documentService.getDocumentbyId(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Generate suggestions using LLM
    const llmService = new LLMService();

    if (!llmService.isConfigured()) {
      return res.status(503).json({
        message: "LLM service not configured",
        suggestions: [],
        summary: "AI suggestions are not available at this time"
      });
    }

    const suggestions = await llmService.generateSuggestions(document.content || '', {
      action,
      tone,
      length,
      language,
      additionalInstructions
    });

    res.json({
      documentId,
      suggestions: suggestions.suggestions,
      summary: suggestions.summary,
      timestamp: suggestions.timestamp
    });

  } catch (err) {
    console.error('Generate suggestions error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Apply suggestions to document
 */
export const applySuggestions = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { suggestions, createVersion = true } = req.body;

    const ownerId = req.user?.sub || "anonymous";

    // Get document
    const documentService = new DocumentService();
    const document = await documentService.getDocumentbyId(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Apply suggestions
    const llmService = new LLMService();
    const result = llmService.applySuggestions(document.content || '', suggestions);

    // Update document
    const updateData = {
      content: result.modifiedContent,
      updatedAt: new Date().toISOString()
    };

    const updatedDocument = await documentService.updateDocument(
      documentId,
      updateData,
      ownerId
    );

    res.json({
      document: updatedDocument,
      changes: result.changes,
      originalContent: result.originalContent,
      modifiedContent: result.modifiedContent
    });

  } catch (err) {
    console.error('Apply suggestions error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Summarize document content
 */
export const summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { maxLength = 100 } = req.query;

    const ownerId = req.user?.sub || "anonymous";

    // Get document
    const documentService = new DocumentService();
    const document = await documentService.getDocumentbyId(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Generate summary
    const llmService = new LLMService();

    if (!llmService.isConfigured()) {
      return res.status(503).json({
        message: "LLM service not configured",
        summary: "AI summary is not available at this time"
      });
    }

    const summary = await llmService.summarizeContent(document.content || '', maxLength);

    res.json({
      documentId,
      summary: summary.summary,
      timestamp: summary.timestamp
    });

  } catch (err) {
    console.error('Summarize document error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Check document content quality
 */
export const checkContentQuality = async (req, res) => {
  try {
    const { documentId } = req.params;

    const ownerId = req.user?.sub || "anonymous";

    // Get document
    const documentService = new DocumentService();
    const document = await documentService.getDocumentbyId(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check content quality
    const llmService = new LLMService();
    const quality = await llmService.checkContent(document.content || '');

    res.json({
      documentId,
      quality: quality.score,
      issues: quality.issues,
      strengths: quality.strengths,
      timestamp: quality.timestamp
    });

  } catch (err) {
    console.error('Check content quality error:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update document content directly
 */
export const updateDocumentContent = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content, title } = req.body;

    const ownerId = req.user?.sub || "anonymous";

    // Get document
    const documentService = new DocumentService();
    const document = await documentService.getDocumentbyId(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.ownerId !== ownerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update document
    const updateData = {
      content: content !== undefined ? content : document.content,
      title: title !== undefined ? title : document.title,
      updatedAt: new Date().toISOString()
    };

    const updatedDocument = await documentService.updateDocument(
      documentId,
      updateData,
      ownerId
    );

    res.json(updatedDocument);

  } catch (err) {
    console.error('Update document content error:', err);
    res.status(500).json({ message: err.message });
  }
};
