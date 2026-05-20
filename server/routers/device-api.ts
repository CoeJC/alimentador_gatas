import { Router } from "express";

const router = Router();

// Armazenamento em memória temporário
let deviceStatusCache: any = {
  meal1Completed: 0,
  meal2Completed: 0,
  currentTime: "--:--",
  isOnline: 0,
  lastUpdate: null,
};

let feedingHistory: any[] = [];
let pendingCommands: any[] = [];

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
    const { meal1Completed, meal2Completed, currentTime, isOnline } = req.body;

    if (meal1Completed !== undefined)
  deviceStatusCache.meal1Completed = meal1Completed;

if (meal2Completed !== undefined)
  deviceStatusCache.meal2Completed = meal2Completed;

if (currentTime !== undefined)
  deviceStatusCache.currentTime = currentTime;

if (isOnline !== undefined)
  deviceStatusCache.isOnline = isOnline;

// IMPORTANTE
deviceStatusCache.lastUpdate = new Date().toISOString();

    console.log("[DEVICE] Status atualizado:", deviceStatusCache);

    res.json({
      success: true,
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
 */
router.post("/record-feeding", (req, res) => {
  console.log("[DEVICE] Record feeding recebido:", req.body);
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const { mealNumber, type } = req.body;

    const feeding = {
      id: feedingHistory.length + 1,
      mealNumber,
      type,
      timestamp: new Date().toISOString(),
    };

    feedingHistory.push(feeding);

    console.log("[DEVICE] Alimentação registrada:", feeding);

    res.json({
      success: true,
      data: feeding,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao registrar alimentação:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar alimentação" });
  }
});

/**
 * POST /device/feed-manual
 * Cria um comando de alimentação manual
 */
router.post("/feed-manual", (req, res) => {
  console.log("[DEVICE] Feed manual recebido:", req.body);
  try {
    const { mealNumber } = req.body;

    const command = {
      type: "feed_meal_" + mealNumber,
      timestamp: new Date().toISOString(),
    };

    pendingCommands.push(command);

    console.log("[DEVICE] Comando adicionado à fila:", command);

    res.json({
      success: true,
      data: command,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao criar comando:", error);
    res.status(500).json({ success: false, error: "Erro ao criar comando" });
  }
});

/**
 * GET /device/status
 * Retorna o status atual do dispositivo
 */
router.get("/status", (req, res) => {

  const now = Date.now();

  const lastUpdate = deviceStatusCache.lastUpdate || 0;

  // considera offline após 40 segundos sem atualização
  if (now - lastUpdate > 40000) {
    deviceStatusCache.isOnline = 0;
  }

  try {

    res.json({
      success: true,
      data: deviceStatusCache,
    });

  } catch (error) {

    console.error("[DEVICE] Erro ao obter status:", error);

    res.status(500).json({
      success: false,
      error: "Erro ao obter status"
    });
  }
});

/**
 * GET /device/history
 * Retorna o histórico de alimentações
 */
router.get("/history", (req, res) => {
  console.log("[DEVICE] History recebido");
  try {
    res.json({
      success: true,
      data: feedingHistory,
    });
  } catch (error) {
    console.error("[DEVICE] Erro ao obter histórico:", error);
    res.status(500).json({ success: false, error: "Erro ao obter histórico" });
  }
});

export default router;
