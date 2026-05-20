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

  // ===== MIDDLEWARES =====
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS simples (evita erro no frontend)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // ===== OAUTH (já existe no seu projeto) =====
  registerOAuthRoutes(app);

  // ===== API =====
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/menu", MenuRouter);

  // ===== FRONTEND (VITE BUILD) =====
  const publicPath = path.join(process.cwd(), "dist/public");

  app.use(express.static(publicPath));

  // rota principal do site
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // fallback (React/Vite SPA)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });

  // ===== START SERVER =====
  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`🐱 Alimentador rodando na porta ${PORT}`);
  });
}

startServer().catch(console.error);
