import { Router } from "express";
import { createReview } from "../controllers/reviews.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, createReview);

export default router;
