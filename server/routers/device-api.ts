import express from "express";

const router = express.Router();

// =====================================================
// MEMÓRIA TEMPORÁRIA
// =====================================================

let pendingCommand: string | null = null;

let deviceStatus = {
  completedMeals: [] as number[],
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

  deviceStatus = {
    completedMeals: body.completedMeals || [],
    currentTime: body.currentTime || "--:--",
    isOnline: body.isOnline || 0,
    lastUpdate: new Date().toISOString(),
  };

  console.log("[STATUS]", deviceStatus);

  res.json({
    success: true,
  });
});

router.get("/status", (req, res) => {

  res.json({
    success: true,
    data: deviceStatus,
  });
});

// =====================================================
// HISTÓRICO
// =====================================================

router.post("/record-feeding", (req, res) => {

  const body = req.body;

  const registro = {
    id: Date.now(),
    mealNumber: body.mealNumber,
    type: body.type,
    timestamp: new Date().toISOString(),
  };

  feedingHistory.push(registro);

  // marca refeição como concluída
  if (
    !deviceStatus.completedMeals.includes(body.mealNumber)
  ) {
    deviceStatus.completedMeals.push(body.mealNumber);
  }

  console.log("[HISTORICO]", registro);

  res.json({
    success: true,
  });
});

router.get("/history", (req, res) => {

  res.json({
    success: true,
    data: feedingHistory,
  });
});

// =====================================================
// COMANDO MANUAL
// =====================================================

router.post("/feed-manual", (req, res) => {

  const body = req.body;

  pendingCommand = `feed_meal_${body.mealNumber}`;

  console.log("[COMANDO]", pendingCommand);

  res.json({
    success: true,
  });
});

// =====================================================
// ESP POLLING
// =====================================================

router.get("/pending-command", (req, res) => {

  if (!pendingCommand) {

    return res.json({
      success: true,
      data: null,
    });
  }

  const command = pendingCommand;

  pendingCommand = null;

  res.json({
    success: true,
    data: {
      type: command,
      timestamp: new Date().toISOString(),
    },
  });
});

// =====================================================
// RESET REFEIÇÕES
// =====================================================

router.post("/reset-meals", (req, res) => {

  deviceStatus.completedMeals = [];

  res.json({
    success: true,
  });
});

export default router;
