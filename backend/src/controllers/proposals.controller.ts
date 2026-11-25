import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";
import { isDuplicateKeyError } from "../utils/errors.js";
import {
  createProposalSchema,
  updateProposalSchema,
} from "../validations/proposal.js";

export const listRequestProposals: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const request = await HelpRequest.findById(id);
  if (!request) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }
  if (!request.createdBy.equals(res.locals.user._id)) {
    res
      .status(403)
      .json({ message: "Seul l’auteur peut voir les propositions." });
    return;
  }

  const proposals = await Proposal.find({ requestId: request._id })
    .populate("proposedBy", "username specialty studyLevel skills")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ proposals, count: proposals.length });
};

export const createProposal: AuthenticatedHandler = async (req, res) => {
  if (res.locals.user.role !== "student") {
    res
      .status(403)
      .json({ message: "L’envoi de propositions est réservé aux étudiants." });
    return;
  }

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie le message de ta proposition.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const request = await HelpRequest.findById(id);
  if (!request) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }
  if (request.createdBy.equals(res.locals.user._id)) {
    res.status(403).json({
      message: "Tu ne peux pas proposer ton aide à ta propre demande.",
    });
    return;
  }
  if (request.status !== "open") {
    res
      .status(400)
      .json({ message: "Cette demande n’accepte plus de propositions." });
    return;
  }

  try {
    const proposal = await Proposal.create({
      requestId: request._id,
      proposedBy: res.locals.user._id,
      message: parsed.data.message,
    });
    res.status(201).json({ message: "Proposition envoyée.", proposal });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res
        .status(409)
        .json({ message: "Tu as déjà proposé ton aide à cette demande." });
      return;
    }
    throw error;
  }
};

export const updateProposalStatus: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de proposition invalide." });
    return;
  }

  const parsed = updateProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Choisis d’accepter ou de refuser la proposition.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    res.status(404).json({ message: "Proposition introuvable." });
    return;
  }

  const request = await HelpRequest.findById(proposal.requestId);
  if (!request) {
    res.status(404).json({ message: "Demande associée introuvable." });
    return;
  }
  if (!request.createdBy.equals(res.locals.user._id)) {
    res
      .status(403)
      .json({ message: "Seul l’auteur de la demande peut décider." });
    return;
  }
  if (proposal.status !== "pending" || request.status !== "open") {
    res
      .status(400)
      .json({ message: "Cette proposition ne peut plus être traitée." });
    return;
  }

  if (parsed.data.status === "rejected") {
    proposal.status = "rejected";
    await proposal.save();
    res.json({ message: "Proposition refusée.", proposal });
    return;
  }

  const claimedRequest = await HelpRequest.findOneAndUpdate(
    { _id: request._id, status: "open" },
    { $set: { status: "accepted" } },
    { new: true },
  );
  if (!claimedRequest) {
    res
      .status(409)
      .json({ message: "Une autre proposition a déjà été acceptée." });
    return;
  }

  proposal.status = "accepted";
  await proposal.save();
  await Proposal.updateMany(
    { requestId: request._id, _id: { $ne: proposal._id }, status: "pending" },
    { $set: { status: "rejected" } },
  );

  res.json({
    message: "Proposition acceptée.",
    proposal,
    request: claimedRequest,
  });
};
