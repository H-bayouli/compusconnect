import { Router } from "express";
import { completeSession } from "../controllers/sessions.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.patch("/:id/complete", requireAuth, completeSession);

export default router;
