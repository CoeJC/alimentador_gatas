import "dotenv/config";
import express from "express";
import { createServer } from "http";

import { registerOAuthRoutes } from "./oauth";

// 🔥 CORREÇÃO: ajustar caminho REAL do menu
// No seu projeto, ele provavelmente está fora de _core
import MenuRouter from "../menu"; // 👈 FIX PRINCIPAL

export async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS básico
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // OAuth
  registerOAuthRoutes(app);

  // Healthcheck
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // 🔥 ROTAS DO ALIMENTADOR
  app.use("/api/menu", MenuRouter);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
