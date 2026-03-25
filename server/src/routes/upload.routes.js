import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// TODO: implement file storage (S3-compatible) in TypeScript rewrite
router.post("/", requireAuth, (req, res) => {
  res.status(501).json({ message: "File upload not implemented — pending storage integration" });
});

export default router;
