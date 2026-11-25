import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";
import Review from "../models/Review.js";

type NotificationActor = {
  _id: mongoose.Types.ObjectId;
  username: string;
};

type NotificationRequest = {
  _id: mongoose.Types.ObjectId;
  title: string;
  status: string;
  createdBy: NotificationActor;
};

type ReviewNotificationRequest = {
  _id: mongoose.Types.ObjectId;
  title: string;
};

export const listNotifications: AuthenticatedHandler = async (_req, res) => {
  const userId = res.locals.user._id;
  const requests = await HelpRequest.find({ createdBy: userId })
    .select("_id")
    .lean();
  const requestIds = requests.map((request) => request._id);

  const [
    incomingProposals,
    decisions,
    reviews,
    unreadIncoming,
    unreadDecisions,
    unreadReviews,
  ] = await Promise.all([
    Proposal.find({
      requestId: { $in: requestIds },
      status: "pending",
    })
      .populate<{ proposedBy: NotificationActor }>("proposedBy", "username")
      .populate<{ requestId: NotificationRequest }>("requestId", "title")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Proposal.find({
      proposedBy: userId,
      status: { $in: ["accepted", "rejected"] },
    })
      .populate<{ requestId: NotificationRequest }>({
        path: "requestId",
        select: "title status createdBy",
        populate: { path: "createdBy", select: "username" },
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    Review.find({ reviewedStudent: userId })
      .populate<{ reviewer: NotificationActor }>("reviewer", "username")
      .populate<{ requestId: ReviewNotificationRequest }>("requestId", "title")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Proposal.countDocuments({
      requestId: { $in: requestIds },
      status: "pending",
      ownerViewedAt: null,
    }),
    Proposal.countDocuments({
      proposedBy: userId,
      status: { $in: ["accepted", "rejected"] },
      proposerViewedAt: null,
    }),
    Review.countDocuments({
      reviewedStudent: userId,
      reviewedStudentViewedAt: null,
    }),
  ]);

  const notifications = [
    ...incomingProposals.map((proposal) => ({
      id: proposal._id,
      kind: "proposal_received" as const,
      actor: proposal.proposedBy,
      request: proposal.requestId,
      status: proposal.status,
      createdAt: proposal.createdAt,
      readAt: proposal.ownerViewedAt,
    })),
    ...decisions.map((proposal) => ({
      id: proposal._id,
      kind:
        proposal.status === "rejected" &&
        proposal.requestId.status === "accepted"
          ? ("proposal_not_selected" as const)
          : proposal.status === "accepted"
            ? ("proposal_accepted" as const)
            : ("proposal_rejected" as const),
      actor: proposal.requestId.createdBy,
      request: proposal.requestId,
      status: proposal.status,
      createdAt: proposal.updatedAt,
      readAt: proposal.proposerViewedAt,
    })),
    ...reviews
      .filter((review) => review.reviewer && review.requestId)
      .map((review) => ({
        id: review._id,
        kind: "review_received" as const,
        actor: review.reviewer,
        request: review.requestId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        readAt: review.reviewedStudentViewedAt,
      })),
  ].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );

  res.json({
    notifications: notifications.slice(0, 100),
    unreadCount: unreadIncoming + unreadDecisions + unreadReviews,
  });
};

export const markNotificationRead: AuthenticatedHandler = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Identifiant de notification invalide." });
    return;
  }

  const review = await Review.findById(id);
  if (review) {
    if (!review.reviewedStudent.equals(res.locals.user._id)) {
      res.status(403).json({
        message: "Cette notification ne t’est pas destinée.",
      });
      return;
    }

    if (!review.reviewedStudentViewedAt) {
      review.reviewedStudentViewedAt = new Date();
      await review.save();
    }
    res.json({ message: "Notification consultée." });
    return;
  }

  const proposal = await Proposal.findById(id);
  if (!proposal) {
    res.status(404).json({ message: "Notification introuvable." });
    return;
  }

  const request = await HelpRequest.findById(proposal.requestId).select(
    "createdBy",
  );
  if (!request) {
    res.status(404).json({ message: "Demande associée introuvable." });
    return;
  }

  const isOwner = request.createdBy.equals(res.locals.user._id);
  const isProposer = proposal.proposedBy.equals(res.locals.user._id);
  if (!isOwner && !isProposer) {
    res.status(403).json({
      message: "Cette notification ne t’est pas destinée.",
    });
    return;
  }

  if (isOwner && proposal.status === "pending" && !proposal.ownerViewedAt) {
    proposal.ownerViewedAt = new Date();
    await proposal.save();
  } else if (
    isProposer &&
    proposal.status !== "pending" &&
    !proposal.proposerViewedAt
  ) {
    proposal.proposerViewedAt = new Date();
    await proposal.save();
  }

  res.json({ message: "Notification consultée." });
};
