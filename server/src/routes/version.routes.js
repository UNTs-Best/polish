import express from "express";
import { checkJwt } from "../middleware/auth0.middleware.js";
import {
  getDocumentVersions,
  getVersion,
  getVersionHistory,
  restoreVersion,
  compareVersions,
} from "../controllers/version.controller.js";

const router = express.Router();

// All version routes require authentication
router.use(checkJwt);

// Get all versions for a document
router.get("/document/:documentId", getDocumentVersions);

// Get version history summary
router.get("/document/:documentId/history", getVersionHistory);

// Get a specific version
router.get("/:versionId", getVersion);

// Restore document to a specific version
router.post("/document/:documentId/restore/:versionId", restoreVersion);

// Compare two versions
router.get("/compare/:versionId1/:versionId2", compareVersions);

export default router;
