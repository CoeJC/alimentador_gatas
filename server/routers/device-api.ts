import { Router } from "express";
import { getDb } from "../db";
import { feedingHistory } from "../../drizzle/schema";

const router = Router();

// Cache compartilhado que será acessado pelo feeder router
export const deviceStatusCache: any = {
  meal1Completed: 0,
  meal2Completed: 0,
  meal3Completed: 0,
  meal4Completed: 0,
  meal5Completed: 0,
  meal6Completed: 0,
  currentTime: "00:00",
  isOnline: 0,
};

export let pendingCommands: any[] = [];

// Historico em memoria para nao depender do banco de dados
let feedingHistoryMemory: any[] = [];

/**
 * GET /device/health
 * Health check simples
 */
router.get("/health", (req, res) => {
  console.log("[DEVICE] Health check recebido");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /device/pending-command
 * Retorna o proximo comando pendente
 */
router.get("/pending-command", (req, res) => {
  console.log("[DEVICE] Pending command recebido");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    if (pendingCommands.length > 0) {
      const command = pendingCommands.shift();
      res.json({
        success: true,
        data: command,
      });
    } else {
      res.json({
        success: true,
        data: null,
      });
    }
  } catch (error) {
    console.error("[DEVICE] Erro ao obter comando:", error);
    res.status(500).json({ success: false, error: "Erro ao obter comando" });
  }
});

/**
 * POST /device/update-status
 * Atualiza o status do dispositivo (chamado pelo ESP8266)
 */
router.post("/update-status", (req, res) => {
  console.log("[DEVICE] Update status recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { meal1Completed, meal2Completed, meal3Completed, meal4Completed, meal5Completed, meal6Completed, currentTime, isOnline } = req.body;

    // Atualiza o cache compartilhado com suporte a 6 refeicoes
    if (meal1Completed !== undefined) deviceStatusCache.meal1Completed = meal1Completed;
    if (meal2Completed !== undefined) deviceStatusCache.meal2Completed = meal2Completed;
    if (meal3Completed !== undefined) deviceStatusCache.meal3Completed = meal3Completed;
    if (meal4Completed !== undefined) deviceStatusCache.meal4Completed = meal4Completed;
    if (meal5Completed !== undefined) deviceStatusCache.meal5Completed = meal5Completed;
    if (meal6Completed !== undefined) deviceStatusCache.meal6Completed = meal6Completed;
    if (currentTime !== undefined) deviceStatusCache.currentTime = currentTime;
    if (isOnline !== undefined) deviceStatusCache.isOnline = isOnline;

    console.log("[DEVICE] Status atualizado:", deviceStatusCache);

    res.json({
      success: true,
      message: "Status atualizado com sucesso",
      data: deviceStatusCache,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao atualizar status:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar status" });
  }
});

/**
 * POST /device/record-feeding
 * Registra uma alimentacao (chamado pelo ESP8266)
 * Salva em memoria temporaria (rapido, sem depender do banco de dados)
 */
router.post("/record-feeding", (req, res) => {
  console.log("[DEVICE] Record feeding recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { mealNumber, type } = req.body;

    if (!mealNumber || !type) {
      return res.status(400).json({ success: false, error: "mealNumber e type sao obrigatorios" });
    }

    const feeding = {
      mealNumber,
      type,
      timestamp: new Date().toISOString(),
    };

    // Salva em memoria
    feedingHistoryMemory.push(feeding);
    console.log("[DEVICE] Alimentacao registrada em memoria:", feeding);

    // Tenta salvar no banco de dados de forma assincrona (sem bloquear)
    if (global.getDb) {
      global.getDb().then((db: any) => {
        if (db) {
          db.insert(feedingHistory).values({
            mealNumber,
            type,
            timestamp: new Date(),
          }).catch((err: any) => {
            console.warn("[DEVICE] Erro ao salvar no BD (assincrono):", err);
          });
        }
      });
    }

    res.json({
      success: true,
      message: "Alimentacao registrada com sucesso",
      data: feeding,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao registrar alimentacao:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar alimentacao" });
  }
});

/**
 * GET /device/status
 * Retorna o status atual do dispositivo
 */
router.get("/status", (req, res) => {
  console.log("[DEVICE] Status recebido");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    success: true,
    data: deviceStatusCache,
  });
});

/**
 * POST /device/feed-manual
 * Aciona alimentacao manual (chamado pela interface web)
 */
router.post("/feed-manual", (req, res) => {
  console.log("[DEVICE] Feed manual recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { mealNumber } = req.body;

    if (!mealNumber || mealNumber < 1 || mealNumber > 6) {
      return res.status(400).json({ success: false, error: "mealNumber invalido (1-6)" });
    }

    // Cria um comando para o ESP8266
    const command = {
      command: `FEED_MANUAL:${mealNumber}`,
      timestamp: new Date().toISOString(),
    };

    pendingCommands.push(command);

    console.log("[DEVICE] Comando enfileirado:", command);

    res.json({
      success: true,
      message: "Alimentacao manual enfileirada",
      data: command,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao acionar alimentacao manual:", error);
    res.status(500).json({ success: false, error: "Erro ao acionar alimentacao manual" });
  }
});

/**
 * GET /device/history
 * Retorna o historico de alimentacoes
 */
router.get("/history", (req, res) => {
  console.log("[DEVICE] History recebido");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    res.json({
      success: true,
      data: feedingHistoryMemory,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao obter historico:", error);
    res.status(500).json({ success: false, error: "Erro ao obter historico" });
  }
});

export default router;
