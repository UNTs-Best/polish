import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  uploadDocument,
  getDocuments,
  renameDocument,
  removeDocument,
} from "../controllers/document.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", requireAuth, getDocuments);
router.post("/", requireAuth, upload.single("file"), uploadDocument);
router.put("/:id", requireAuth, renameDocument);
router.delete("/:id", requireAuth, removeDocument);

export default router;