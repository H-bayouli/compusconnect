import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";
import Review from "../models/Review.js";
import { isDuplicateKeyError } from "../utils/errors.js";
import { createReviewSchema } from "../validations/review.js";

export const createReview: AuthenticatedHandler = async (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie la note et le commentaire.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  if (!mongoose.isValidObjectId(parsed.data.requestId)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const request = await HelpRequest.findById(parsed.data.requestId);
  if (!request) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }
  if (request.status !== "completed") {
    res
      .status(400)
      .json({ message: "L’évaluation est possible après la séance." });
    return;
  }

  const acceptedProposal = await Proposal.findOne({
    requestId: request._id,
    status: "accepted",
  });
  if (!acceptedProposal) {
    res
      .status(409)
      .json({ message: "Aucun aidant n’a été accepté pour cette séance." });
    return;
  }

  const isOwner = request.createdBy.equals(res.locals.user._id);
  const isHelper = acceptedProposal.proposedBy.equals(res.locals.user._id);
  if (!isOwner && !isHelper) {
    res.status(403).json({
      message: "Seuls les participants peuvent évaluer cette séance.",
    });
    return;
  }

  try {
    const review = await Review.create({
      requestId: request._id,
      reviewer: res.locals.user._id,
      reviewedStudent: isOwner
        ? acceptedProposal.proposedBy
        : request.createdBy,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    res.status(201).json({ message: "Merci pour ton évaluation.", review });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ message: "Tu as déjà évalué cette séance." });
      return;
    }
    throw error;
  }
};
