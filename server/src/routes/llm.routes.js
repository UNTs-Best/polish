import express from "express";
import { checkJwt } from "../middleware/auth0.middleware.js";
import {
  generateSuggestions,
  applySuggestions,
  summarizeDocument,
  checkContentQuality,
  updateDocumentContent,
} from "../controllers/llm.controller.js";

const router = express.Router();

// All LLM routes require authentication
router.use(checkJwt);

// Generate suggestions for document content
router.post("/documents/:documentId/suggestions", generateSuggestions);

// Apply suggestions to document
router.post("/documents/:documentId/apply-suggestions", applySuggestions);

// Summarize document content
router.get("/documents/:documentId/summary", summarizeDocument);

// Check document content quality
router.get("/documents/:documentId/quality", checkContentQuality);

// Update document content directly
router.put("/documents/:documentId/content", updateDocumentContent);

export default router;


