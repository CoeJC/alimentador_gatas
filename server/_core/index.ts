import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";

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
  // OAUTH
  // ======================
  registerOAuthRoutes(app);

  // ======================
  // API (TEM QUE VIR ANTES DO FRONTEND)
  // ======================

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/device/pending-command", (_req, res) => {
    res.json({
      command: null
    });
  });

  app.use("/api/menu", MenuRouter);

  // ======================
  // FRONTEND
  // ======================
  const clientPath = path.join(process.cwd(), "client");

  app.use(express.static(clientPath));

  // ⚠️ IMPORTANTE: essa rota vem POR ÚLTIMO
  app.get("/", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

  // fallback só depois de tudo
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/device")) {
      return res.status(404).json({ error: "Not found" });
    }

    res.sendFile(path.join(clientPath, "index.html"));
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
