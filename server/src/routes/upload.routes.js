import express from "express";
import multer from "multer";
import fs from "fs";
import { uploadFileToSupabase } from "../utils/supabaseStorage.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const userId = req.auth?.id || "anonymous";
    const result = await uploadFileToSupabase(file.path, file.originalname, userId);
    res.json({
      message: "File uploaded successfully",
      url: result.url,
      path: result.path,
    });

    fs.unlinkSync(file.path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;