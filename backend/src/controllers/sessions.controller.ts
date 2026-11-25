import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";

export const completeSession: AuthenticatedHandler = async (req, res) => {
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
  if (request.status !== "accepted") {
    res
      .status(400)
      .json({ message: "Seule une séance acceptée peut être terminée." });
    return;
  }

  const acceptedProposal = await Proposal.findOne({
    requestId: request._id,
    status: "accepted",
  });
  if (!acceptedProposal) {
    res.status(409).json({ message: "Aucun aidant n’a été accepté." });
    return;
  }

  const isOwner = request.createdBy.equals(res.locals.user._id);
  const isHelper = acceptedProposal.proposedBy.equals(res.locals.user._id);
  if (!isOwner && !isHelper) {
    res
      .status(403)
      .json({ message: "Seuls les participants peuvent terminer la séance." });
    return;
  }

  const completedRequest = await HelpRequest.findOneAndUpdate(
    { _id: request._id, status: "accepted" },
    { $set: { status: "completed" } },
    { new: true },
  );
  if (!completedRequest) {
    res.status(409).json({ message: "Cette séance a déjà été terminée." });
    return;
  }

  res.json({ message: "Séance terminée.", request: completedRequest });
};
