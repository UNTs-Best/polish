import express from "express";
import multer from "multer";
import fs from "fs";
import { uploadFileToBlob } from "../utils/azureBlob.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp folder

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const result = await uploadFileToBlob(file.path, file.originalname);
    res.json({
      message: "File uploaded successfully",
      url: result.url,
    });

    // optionally delete temp file
    fs.unlinkSync(file.path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;