import express from "express";
import jwtDecode from "jwt-decode";
import { checkJwt } from "../middleware/auth0.middleware.js";

const router = express.Router();

/**
 *  @route   POST /api/auth/register
 *  @desc    registers a new user in Auth0
 */
router.post("/register", (req, res) => {
  res.status(501).json({
    message: "Registration handled by Auth0 Universal Login on frontend.",
  });
});

/**
 *  @route   POST /api/auth/login
 *  @desc    Verifies Auth0-issued access token and returns user info
 */
router.post("/login", checkJwt, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing token" });

    const token = authHeader.split(" ")[1];
    const decoded = jwtDecode(token);

    res.json({
      message: "authenticated with Auth0",
      user: {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;