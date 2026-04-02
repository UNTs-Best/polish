import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

import { connectSupabase } from "./config/supabase.js";
import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import docRoutes from "./routes/document.routes.js";
import llmRoutes from "./routes/llm.routes.js";
import versionRoutes from "./routes/version.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import uploadRoutes from "./routes/upload.routes.js";


dotenv.config();


const app = express();

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled so Next/API can load; enable and tune for production

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/versions", versionRoutes);
app.use("/api/llm", llmRoutes);
app.use("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/version", versionRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use(errorHandler);

connectSupabase();

export default app;
