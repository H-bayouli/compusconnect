import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";
import Review from "../models/Review.js";
import {
  createRequestSchema,
  requestFiltersSchema,
  updateRequestSchema,
} from "../validations/request.js";

export const listRequests: AuthenticatedHandler = async (req, res) => {
  const parsed = requestFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Filtres de recherche invalides." });
    return;
  }

  const { subject, studyLevel, status, search } = parsed.data;
  const escapedSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    ...(subject ? { subject } : {}),
    ...(studyLevel ? { studyLevel } : {}),
    ...(status ? { status } : {}),
    ...(escapedSearch
      ? {
          $or: [
            { title: { $regex: escapedSearch, $options: "i" } },
            { description: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {}),
  };

  const requests = await HelpRequest.find(filter)
    .populate("createdBy", "username specialty studyLevel")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ requests, count: requests.length });
};

export const createRequest: AuthenticatedHandler = async (req, res) => {
  if (res.locals.user.role !== "student") {
    res
      .status(403)
      .json({ message: "Seuls les étudiants peuvent publier une demande." });
    return;
  }

  const parsed = createRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie les informations de la demande.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const request = await HelpRequest.create({
    ...parsed.data,
    createdBy: res.locals.user._id,
  });
  res.status(201).json({ message: "Demande publiée.", request });
};

export const getRequest: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const request = await HelpRequest.findById(id)
    .populate("createdBy", "username specialty studyLevel")
    .lean();
  if (!request) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }

  const [acceptedProposal, existingReview] = await Promise.all([
    Proposal.findOne({ requestId: id, status: "accepted" })
      .populate("proposedBy", "username specialty studyLevel skills")
      .lean(),
    Review.exists({ requestId: id, reviewer: res.locals.user._id }),
  ]);

  res.json({
    request,
    acceptedHelper: acceptedProposal?.proposedBy ?? null,
    reviewedByMe: Boolean(existingReview),
  });
};

export const updateRequest: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const parsed = updateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie les champs à modifier.",
      errors: parsed.error.flatten().fieldErrors,
    });
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
      .json({ message: "Seul l’auteur peut modifier cette demande." });
    return;
  }
  if (request.status !== "open") {
    res
      .status(400)
      .json({ message: "Seule une demande ouverte peut être modifiée." });
    return;
  }

  Object.assign(request, parsed.data);
  await request.save();
  res.json({ message: "Demande mise à jour.", request });
};

export const deleteRequest: AuthenticatedHandler = async (req, res) => {
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
      .json({ message: "Seul l’auteur peut supprimer cette demande." });
    return;
  }
  if (request.status !== "open") {
    res
      .status(400)
      .json({ message: "Seule une demande ouverte peut être supprimée." });
    return;
  }

  await Promise.all([
    Proposal.deleteMany({ requestId: request._id }),
    Review.deleteMany({ requestId: request._id }),
  ]);
  await request.deleteOne();
  res.json({ message: "Demande supprimée." });
};
