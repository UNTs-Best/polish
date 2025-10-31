import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import docRoutes from "./routes/document.routes.js";
import llmRoutes from "./routes/llm.routes.js";
import errorHandler from "./middleware/error.middleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/llm", llmRoutes);

app.use(errorHandler);

connectDB();

export default app;
