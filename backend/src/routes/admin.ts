import { Router } from "express";
import {
  deleteAdminRequest,
  deleteUser,
  listAdminNotifications,
  listAdminRequests,
  listReports,
  listUsers,
  updateReport,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/dashboard", listReports);
router.patch("/reports/:id", updateReport);
router.get("/requests", listAdminRequests);
router.delete("/requests/:id", deleteAdminRequest);
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/notifications", listAdminNotifications);

export default router;
