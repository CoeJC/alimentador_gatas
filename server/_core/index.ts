import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";

import { registerOAuthRoutes } from "./oauth";

// ajuste se seu menu estiver em outro lugar
import MenuRouter from "../menu";

export async function startServer() {
  const app = express();
  const server = createServer(app);

  // =========================
  // MIDDLEWARES
  // =========================
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS simples (evita erro no frontend)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // =========================
  // OAUTH (mantido como já existe)
  // =========================
  registerOAuthRoutes(app);

  // =========================
  // API DO SEU PROJETO
  // =========================
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/menu", MenuRouter);

  // =========================
  // FRONTEND (CLIENT HTML)
  // =========================
  const clientPath = path.join(process.cwd(), "client");

  app.use(express.static(clientPath));

  // rota principal
  app.get("/", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

  // fallback SPA (evita erro ao atualizar página)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

  // =========================
  // START SERVER
  // =========================
  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`🐱 Alimentador rodando na porta ${PORT}`);
  });
}

startServer().catch(console.error);
