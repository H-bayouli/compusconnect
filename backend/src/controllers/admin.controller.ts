import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";
import Report from "../models/Report.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import {
  updateReportSchema,
  updateUserStatusSchema,
} from "../validations/admin.js";

type NotificationActor = {
  _id: mongoose.Types.ObjectId;
  username: string;
};

type NotificationRequest = {
  _id: mongoose.Types.ObjectId;
  title: string;
  status: string;
  createdBy: NotificationActor | null;
};

type AdminNotification = {
  id: string;
  kind:
    | "proposal_received"
    | "proposal_accepted"
    | "proposal_rejected"
    | "proposal_not_selected"
    | "review_received";
  actor: NotificationActor;
  recipient: NotificationActor;
  request: { _id: string; title: string };
  status?: "pending" | "accepted" | "rejected";
  rating?: number;
  comment?: string;
  createdAt: string;
  readAt: string | null;
};

async function removeRequestData(requestId: mongoose.Types.ObjectId) {
  await Promise.all([
    Proposal.deleteMany({ requestId }),
    Review.deleteMany({ requestId }),
  ]);
  await HelpRequest.findByIdAndDelete(requestId);
}

export const listReports: AuthenticatedHandler = async (_req, res) => {
  const reports = await Report.find()
    .populate("requestId", "title")
    .populate("reportedBy", "username")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ reports });
};

export const updateReport: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de signalement invalide." });
    return;
  }

  const parsed = updateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Choisis une action valide pour ce signalement.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const report = await Report.findById(id);
  if (!report) {
    res.status(404).json({ message: "Signalement introuvable." });
    return;
  }

  if (parsed.data.status === "removed") {
    await removeRequestData(report.requestId);
  }

  report.status = parsed.data.status;
  await report.save();
  res.json({ message: "Signalement traité.", report });
};

export const listAdminRequests: AuthenticatedHandler = async (_req, res) => {
  const requests = await HelpRequest.find()
    .populate("createdBy", "username")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ requests });
};

export const deleteAdminRequest: AuthenticatedHandler = async (req, res) => {
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

  await removeRequestData(request._id);
  res.json({ message: "Demande supprimée." });
};

export const listUsers: AuthenticatedHandler = async (_req, res) => {
  const users = await User.find({ role: "student" })
    .select("username email role isActive createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({
    users: users.map((user) => ({
      ...user,
      isActive: user.isActive !== false,
    })),
  });
};

export const updateUserStatus: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant d’utilisateur invalide." });
    return;
  }

  const parsed = updateUserStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Choisis un état de compte valide." });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  if (user.role !== "student") {
    res.status(403).json({
      message: "Les comptes administrateur ne peuvent pas être modifiés ici.",
    });
    return;
  }

  user.isActive = parsed.data.isActive;
  await user.save();
  res.json({
    message: parsed.data.isActive ? "Compte réactivé." : "Compte désactivé.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
};

export const deleteUser: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant d’utilisateur invalide." });
    return;
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "Utilisateur introuvable." });
    return;
  }
  if (user.role !== "student" || user._id.equals(res.locals.user._id)) {
    res.status(403).json({
      message: "Ce compte ne peut pas être supprimé depuis cet espace.",
    });
    return;
  }

  const ownedRequests = await HelpRequest.find({ createdBy: user._id })
    .select("_id")
    .lean();
  const ownedRequestIds = ownedRequests.map((request) => request._id);
  const acceptedProposals = await Proposal.find({
    proposedBy: user._id,
    status: "accepted",
  })
    .select("requestId")
    .lean();
  const acceptedRequestIds = acceptedProposals.map(
    (proposal) => proposal.requestId,
  );

  await Promise.all([
    HelpRequest.deleteMany({ createdBy: user._id }),
    HelpRequest.updateMany(
      { _id: { $in: acceptedRequestIds }, status: "accepted" },
      { $set: { status: "open" } },
    ),
    Proposal.deleteMany({
      $or: [{ proposedBy: user._id }, { requestId: { $in: ownedRequestIds } }],
    }),
    Review.deleteMany({
      $or: [
        { reviewer: user._id },
        { reviewedStudent: user._id },
        { requestId: { $in: ownedRequestIds } },
      ],
    }),
  ]);
  await user.deleteOne();

  res.json({ message: "Compte utilisateur supprimé." });
};

export const listAdminNotifications: AuthenticatedHandler = async (
  _req,
  res,
) => {
  const [proposals, reviews] = await Promise.all([
    Proposal.find({
      status: { $in: ["pending", "accepted", "rejected"] },
    })
      .populate<{ proposedBy: NotificationActor | null }>(
        "proposedBy",
        "username",
      )
      .populate<{ requestId: NotificationRequest | null }>({
        path: "requestId",
        select: "title status createdBy",
        populate: { path: "createdBy", select: "username" },
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    Review.find()
      .populate<{ reviewer: NotificationActor | null }>("reviewer", "username")
      .populate<{ reviewedStudent: NotificationActor | null }>(
        "reviewedStudent",
        "username",
      )
      .populate<{
        requestId: { _id: mongoose.Types.ObjectId; title: string } | null;
      }>("requestId", "title")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const notifications: AdminNotification[] = proposals.flatMap((proposal) => {
    const request = proposal.requestId;
    const proposer = proposal.proposedBy;
    const owner = request?.createdBy;
    if (!request || !proposer || !owner) return [];

    const isIncoming = proposal.status === "pending";
    const kind = isIncoming
      ? "proposal_received"
      : proposal.status === "rejected" && request.status === "accepted"
        ? "proposal_not_selected"
        : proposal.status === "accepted"
          ? "proposal_accepted"
          : "proposal_rejected";

    return [
      {
        id: proposal._id.toString(),
        kind,
        actor: isIncoming ? proposer : owner,
        recipient: isIncoming ? owner : proposer,
        request: { _id: request._id.toString(), title: request.title },
        status: proposal.status,
        createdAt: (isIncoming
          ? proposal.createdAt
          : proposal.updatedAt
        ).toISOString(),
        readAt: isIncoming
          ? (proposal.ownerViewedAt?.toISOString() ?? null)
          : (proposal.proposerViewedAt?.toISOString() ?? null),
      },
    ];
  });
  notifications.push(
    ...reviews.flatMap((review) => {
      const request = review.requestId;
      const reviewer = review.reviewer;
      const recipient = review.reviewedStudent;
      if (!request || !reviewer || !recipient) return [];

      return [
        {
          id: review._id.toString(),
          kind: "review_received" as const,
          actor: reviewer,
          recipient,
          request: { _id: request._id.toString(), title: request.title },
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          readAt: review.reviewedStudentViewedAt?.toISOString() ?? null,
        },
      ];
    }),
  );
  notifications.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );

  res.json({ notifications: notifications.slice(0, 100) });
};
