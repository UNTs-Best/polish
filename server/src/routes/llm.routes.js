import express from "express";
const router = express.Router();

router.post("/suggest", (req, res) => res.json({ message: "LLM route placeholder" }));

export default router;
