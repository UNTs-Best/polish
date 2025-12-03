import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import oauthRoutes from "./routes/oauth.routes.js";
import docRoutes from "./routes/document.routes.js";
import llmRoutes from "./routes/llm.routes.js";
import versionRoutes from "./routes/version.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import uploadRoutes from "./routes/upload.routes.js";


dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/versions", versionRoutes);
app.use("/api/llm", llmRoutes);
app.use("/api/health", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.use("/version", versionRoutes);


app.use('/*', (req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use(errorHandler);

connectDB();

export default app;
