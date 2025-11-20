import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, getUserbyEmail } from "../services/user.service.js";

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export const register = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const existing = await getUserbyEmail(email);
    if (existing) return res.status(409).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ email, password: hashed });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await getUserbyEmail(email);
    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const me = async (req, res) => {
  try {
    const auth = req.auth;
    if (!auth) return res.status(401).json({ message: "Unauthorized" });
    return res.json({ user: { id: auth.id, email: auth.email } });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};
