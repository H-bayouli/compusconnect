import { Router } from "express";
import {
  createProposal,
  listRequestProposals,
  updateProposalStatus,
} from "../controllers/proposals.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/request/:id", listRequestProposals);
router.post("/request/:id", createProposal);
router.patch("/:id", updateProposalStatus);

export default router;
