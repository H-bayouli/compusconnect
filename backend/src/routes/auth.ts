import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", getCurrentUser);
router.post("/logout", logout);
router.patch("/profile", requireAuth, updateProfile);

export default router;
