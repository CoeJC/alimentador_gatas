import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import deviceApiRouter from "../routers/device-api";

import { registerOAuthRoutes } from "./oauth";
import MenuRouter from "../menu";

export async function startServer() {
  const app = express();
  const server = createServer(app);

  // ======================
  // MIDDLEWARES
  // ======================
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // ======================
  // API PRIMEIRO (IMPORTANTE)
  // ======================
  registerOAuthRoutes(app);

  app.use("/device", deviceApiRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/device/pending-command", (_req, res) => {
    res.json({ command: null });
  });

  app.use("/api/menu", MenuRouter);

  // ======================
  // FRONTEND CORRETO (VITE BUILD)
  // ======================
  const frontendPath = path.join(process.cwd(), "dist/public");

  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    // não intercepta API
    if (req.path.startsWith("/api") || req.path.startsWith("/device")) {
      return res.status(404).json({ error: "Not found" });
    }

    res.sendFile(path.join(frontendPath, "index.html"));
  });

  // ======================
  // START
  // ======================
  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`🐱 Alimentador rodando na porta ${PORT}`);
  });
}

startServer().catch(console.error);
