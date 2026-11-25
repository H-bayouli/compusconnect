import { Router } from "express";
import {
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  updateRequest,
} from "../controllers/requests.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listRequests);
router.post("/", createRequest);
router.get("/:id", getRequest);
router.patch("/:id", updateRequest);
router.delete("/:id", deleteRequest);

export default router;
