import { Router } from "express";
import {
  listNotifications,
  markNotificationRead,
} from "../controllers/notifications.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;
