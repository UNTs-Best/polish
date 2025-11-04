import express from "express";
import multer from "multer";
import { checkJwt } from "../middleware/auth0.middleware.js"; // or Azure B2C middleware
import {
  uploadDocument,
  getDocuments,
  renameDocument,
  removeDocument,
} from "../controllers/document.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", checkJwt, getDocuments);
router.post("/", checkJwt, upload.single("file"), uploadDocument);
router.put("/:id", checkJwt, renameDocument);
router.delete("/:id", checkJwt, removeDocument);

export default router;