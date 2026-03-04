import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refreshToken,
  logout,
  me,
  updateProfile,
  changePassword
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Strict rate limit on login/register to prevent brute force (5 attempts per 15 min per IP)
const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Looser limit for refresh so normal app use doesn't get blocked
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (with rate limiting)
router.post("/register", authStrictLimiter, register);
router.post("/login", authStrictLimiter, login);
router.post("/refresh", refreshLimiter, refreshToken);

// Protected routes
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.post("/logout", requireAuth, logout);

export default router;