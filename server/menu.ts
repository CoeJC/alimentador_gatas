import { Router } from "express";

const router = Router();

// exemplo de endpoint do alimentador
router.post("/feed", (req, res) => {
  console.log("Comando de alimentação recebido");
  res.json({ ok: true });
});

router.get("/status", (req, res) => {
  res.json({ status: "online" });
});

export default router;
