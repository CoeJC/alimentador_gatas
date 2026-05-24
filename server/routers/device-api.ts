<<<<<<< Updated upstream
import express from "express";
=======
import { Router } from "express";
import { getDb } from "../db";
import { feedingHistory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
>>>>>>> Stashed changes

const router = express.Router();

<<<<<<< Updated upstream
// =====================================================
// MEMÓRIA TEMPORÁRIA
// =====================================================

let pendingCommand: string | null = null;

let deviceStatus = {
=======
// Cache compartilhado que será acessado pelo feeder router
export const deviceStatusCache: any = {
>>>>>>> Stashed changes
  meal1Completed: 0,
  meal2Completed: 0,
  meal3Completed: 0,
  meal4Completed: 0,
  meal5Completed: 0,
  meal6Completed: 0,
<<<<<<< Updated upstream
  currentTime: "--:--",
=======
  currentTime: "00:00",
>>>>>>> Stashed changes
  isOnline: 0,
  lastUpdate: null as string | null,
};

<<<<<<< Updated upstream
let feedingHistory: any[] = [];
=======
export let pendingCommands: any[] = [];
>>>>>>> Stashed changes

// =====================================================
// STATUS
// =====================================================

router.post("/update-status", (req, res) => {
  const body = req.body;

  // Aceita tanto o formato novo (meal1Completed, meal2Completed, etc)
  // quanto o formato antigo (completedMeals array)
  
  if (body.meal1Completed !== undefined) {
    // Novo formato com 6 refeições
    deviceStatus = {
      meal1Completed: body.meal1Completed || 0,
      meal2Completed: body.meal2Completed || 0,
      meal3Completed: body.meal3Completed || 0,
      meal4Completed: body.meal4Completed || 0,
      meal5Completed: body.meal5Completed || 0,
      meal6Completed: body.meal6Completed || 0,
      currentTime: body.currentTime || "--:--",
      isOnline: body.isOnline || 0,
      lastUpdate: new Date().toISOString(),
    };
  } else {
    // Formato antigo (compatibilidade)
    deviceStatus = {
      meal1Completed: 0,
      meal2Completed: 0,
      meal3Completed: 0,
      meal4Completed: 0,
      meal5Completed: 0,
      meal6Completed: 0,
      currentTime: body.currentTime || "--:--",
      isOnline: body.isOnline || 0,
      lastUpdate: new Date().toISOString(),
    };
  }

  console.log("[STATUS]", deviceStatus);

  res.json({ success: true });
});

<<<<<<< Updated upstream
router.get("/status", (req, res) => {
  res.json({
    success: true,
    data: deviceStatus,
  });
});

// =====================================================
// COMANDOS
// =====================================================

router.post("/send-command", (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command required" });
  }

  pendingCommand = command;

  console.log("[COMMAND] Comando pendente:", command);

  res.json({ success: true, message: "Comando enfileirado" });
});

router.get("/pending-command", (req, res) => {
  if (!pendingCommand) {
    return res.json({ success: true, data: null });
=======
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
>>>>>>> Stashed changes
  }

  const command = pendingCommand;
  pendingCommand = null;

  console.log("[COMMAND] Comando enviado:", command);

  res.json({ success: true, data: { command, timestamp: new Date().toISOString() } });
});

<<<<<<< Updated upstream
// =====================================================
// ALIMENTAÇÃO MANUAL (NOVO)
// =====================================================

router.post("/feed-manual", (req, res) => {
  const { mealNumber } = req.body;

  if (!mealNumber) {
    return res.status(400).json({ error: "mealNumber required" });
  }

  // Cria um comando para o ESP8266
  pendingCommand = `FEED_MANUAL:${mealNumber}`;

  console.log("[MANUAL FEED] Comando enviado:", pendingCommand);

  res.json({ success: true, message: "Alimentação manual enfileirada" });
});

// =====================================================
// HISTÓRICO
// =====================================================

router.post("/record-feeding", (req, res) => {
  const { mealNumber, type } = req.body;

  const entry = {
    mealNumber: mealNumber || 0,
    type: type || "unknown",
    timestamp: new Date().toISOString(),
  };

  feedingHistory.push(entry);

  // Manter apenas os últimos 100 registros
  if (feedingHistory.length > 100) {
    feedingHistory = feedingHistory.slice(-100);
  }

  console.log("[FEEDING]", entry);

  res.json({ success: true });
});

router.get("/feeding-history", (req, res) => {
  res.json({
    success: true,
    data: feedingHistory,
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    isDeviceOnline: deviceStatus.isOnline === 1,
    lastUpdate: deviceStatus.lastUpdate,
  });
=======
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
>>>>>>> Stashed changes
});

export default router;
