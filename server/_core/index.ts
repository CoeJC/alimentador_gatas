import "dotenv/config";
import express from "express";
import { createServer } from "http";

import { registerOAuthRoutes } from "./oauth";

// 👇 IMPORTANTE: aqui deve vir um Router REAL (não objeto)
import MenuRouter from "./menu"; // ajuste o caminho se necessário

export async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middlewares básicos
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS simples (opcional mas recomendado)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  // OAuth routes
  registerOAuthRoutes(app);

  // Healthcheck
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // 🔥 ROTAS CORRETAS (AQUI estava seu erro)
  app.use("/api/menu", MenuRouter);

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
