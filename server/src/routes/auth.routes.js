import express from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Local registration
router.post("/register", register);

// Local login -> issues JWT
router.post("/login", login);

// Current user from our JWT
router.get("/me", requireAuth, me);

export default router;