import express from "express";

const router = express.Router();

// =====================================================
// MEMÓRIA TEMPORÁRIA
// =====================================================

let pendingCommand: string | null = null;

let deviceStatus = {
  meal1Completed: 0,
  meal2Completed: 0,
  meal3Completed: 0,
  meal4Completed: 0,
  meal5Completed: 0,
  meal6Completed: 0,
  currentTime: "--:--",
  isOnline: 0,
  lastUpdate: null as string | null,
};

let feedingHistory: any[] = [];

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
  }

  const command = pendingCommand;
  pendingCommand = null;

  console.log("[COMMAND] Comando enviado:", command);

  res.json({ success: true, data: { command, timestamp: new Date().toISOString() } });
});

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
});

export default router;
