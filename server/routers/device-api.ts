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
 * Retorna o próximo comando pendente
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

    // Atualiza o cache compartilhado com suporte a 6 refeições
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
 * Registra uma alimentação (chamado pelo ESP8266)
 * Salva no banco de dados
 */
router.post("/record-feeding", async (req, res) => {
  console.log("[DEVICE] Record feeding recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { mealNumber, type } = req.body;

    if (!mealNumber || !type) {
      return res.status(400).json({ success: false, error: "mealNumber e type são obrigatórios" });
    }

    // Salva no banco de dados
    const db = await getDb();
    if (db) {
      await db.insert(feedingHistory).values({
        mealNumber,
        type,
        timestamp: new Date(),
      });
      console.log("[DEVICE] Alimentação salva no banco de dados");
    } else {
      console.warn("[DEVICE] Banco de dados não disponível, alimentação não foi salva");
    }

    const feeding = {
      mealNumber,
      type,
      timestamp: new Date().toISOString(),
    };

    console.log("[DEVICE] Alimentação registrada:", feeding);

    res.json({
      success: true,
      message: "Alimentação registrada com sucesso",
      data: feeding,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao registrar alimentação:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar alimentação" });
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
 * Aciona alimentação manual (chamado pela interface web)
 */
router.post("/feed-manual", (req, res) => {
  console.log("[DEVICE] Feed manual recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { mealNumber } = req.body;

    if (!mealNumber || mealNumber < 1 || mealNumber > 6) {
      return res.status(400).json({ success: false, error: "mealNumber inválido (1-6)" });
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
      message: "Alimentação manual enfileirada",
      data: command,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao acionar alimentação manual:", error);
    res.status(500).json({ success: false, error: "Erro ao acionar alimentação manual" });
  }
});

/**
 * GET /device/history
 * Retorna o histórico de alimentações do banco de dados
 */
router.get("/history", async (req, res) => {
  console.log("[DEVICE] History recebido");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const db = await getDb();
    let history: any[] = [];

    if (db) {
      history = await db.select().from(feedingHistory).orderBy(feedingHistory.id);
      console.log("[DEVICE] Histórico obtido do banco de dados:", history.length, "registros");
    } else {
      console.warn("[DEVICE] Banco de dados não disponível");
    }

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao obter histórico:", error);
    res.status(500).json({ success: false, error: "Erro ao obter histórico" });
  }
});

export default router;
