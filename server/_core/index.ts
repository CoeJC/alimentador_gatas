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
  // SERVIDOR HTTP PARA ESP8266 (porta 3001)
  // ======================
  const httpApp = express();
  httpApp.use(express.json({ limit: "50mb" }));
  httpApp.use(express.urlencoded({ extended: true }));

  // Rota de health check
  httpApp.get("/device/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Rota de pending command
  httpApp.get("/device/pending-command", (_req, res) => {
    res.set("Content-Type", "application/json");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    // Repassa para o router do device-api
    deviceApiRouter((_req as any), res);
  });

  // Rota de record feeding
  httpApp.post("/device/record-feeding", (req, res) => {
    // Repassa para o router do device-api
    deviceApiRouter(req as any, res);
  });

  // Rota de update status
  httpApp.post("/device/update-status", (req, res) => {
    // Repassa para o router do device-api
    deviceApiRouter(req as any, res);
  });

  // Rota de feed manual
  httpApp.post("/device/feed-manual", (req, res) => {
    // Repassa para o router do device-api
    deviceApiRouter(req as any, res);
  });

  const HTTP_PORT = 3001;
  const httpServer = createServer(httpApp);
  httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
    console.log(`🐱 Servidor HTTP para ESP8266 rodando na porta ${HTTP_PORT}`);
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
