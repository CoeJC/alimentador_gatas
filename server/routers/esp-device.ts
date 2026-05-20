import { Router } from "express";

const router = Router();

/**
 * GET /api/esp/health
 * Health check simples
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Armazenamento em memória temporário
let deviceStatusCache: any = {
  meal1Completed: 0,
  meal2Completed: 0,
  currentTime: "00:00",
  isOnline: 0,
};

let feedingHistory: any[] = [];

/**
 * GET /api/esp/status
 * Retorna o status atual do dispositivo
 */
router.get("/status", (req, res) => {
  try {
    res.json({
      success: true,
      data: deviceStatusCache,
    });
  } catch (error) {
    console.error("[ESP] Erro ao obter status:", error);
    res.status(500).json({ success: false, error: "Erro ao obter status" });
  }
});

/**
 * POST /api/esp/update-status
 * Atualiza o status do dispositivo (chamado pelo ESP8266)
 */
router.post("/update-status", (req, res) => {
  try {
    const { meal1Completed, meal2Completed, currentTime, isOnline } = req.body;

    if (meal1Completed !== undefined) deviceStatusCache.meal1Completed = meal1Completed;
    if (meal2Completed !== undefined) deviceStatusCache.meal2Completed = meal2Completed;
    if (currentTime !== undefined) deviceStatusCache.currentTime = currentTime;
    if (isOnline !== undefined) deviceStatusCache.isOnline = isOnline;

    console.log("[ESP] Status atualizado:", deviceStatusCache);

    res.json({
      success: true,
      data: deviceStatusCache,
    });
  } catch (error) {
    console.error("[ESP] Erro ao atualizar status:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar status" });
  }
});

/**
 * GET /api/esp/pending-command
 * Retorna um comando pendente para o ESP8266
 */
router.get("/pending-command", (req, res) => {
  try {
    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("[ESP] Erro ao obter comando pendente:", error);
    res.status(500).json({ success: false, error: "Erro ao obter comando" });
  }
});

/**
 * POST /api/esp/record-feeding
 * Registra uma alimentação (manual ou automática)
 */
router.post("/record-feeding", (req, res) => {
  try {
    const { mealNumber, type } = req.body;

    if (!mealNumber || (mealNumber !== 1 && mealNumber !== 2)) {
      return res.status(400).json({
        success: false,
        error: "mealNumber deve ser 1 ou 2",
      });
    }

    const feedingType = type === "manual" ? "manual" : "automatic";
    const feeding = {
      mealNumber,
      type: feedingType,
      timestamp: new Date().toISOString(),
    };
    feedingHistory.push(feeding);

    console.log("[ESP] Alimentação registrada:", feeding);

    res.json({
      success: true,
      message: "Alimentação registrada",
    });
  } catch (error) {
    console.error("[ESP] Erro ao registrar alimentação:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar" });
  }
});

/**
 * POST /api/esp/complete-command
 * Marca um comando como completado
 */
router.post("/complete-command", (req, res) => {
  try {
    const { commandId } = req.body;

    if (!commandId) {
      return res.status(400).json({
        success: false,
        error: "commandId é obrigatório",
      });
    }

    console.log("[ESP] Comando completado:", commandId);

    res.json({
      success: true,
      message: "Comando completado",
    });
  } catch (error) {
    console.error("[ESP] Erro ao completar comando:", error);
    res.status(500).json({ success: false, error: "Erro ao completar" });
  }
});

export default router;
