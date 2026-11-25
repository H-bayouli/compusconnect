import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Proposal from "../models/HelpProposal.js";

export const getDashboard: AuthenticatedHandler = async (_req, res) => {
  const user = res.locals.user;
  const [
    publishedRequests,
    proposalsSent,
    authoredCompletedRequests,
    acceptedProposals,
  ] = await Promise.all([
    HelpRequest.countDocuments({ createdBy: user._id }),
    Proposal.countDocuments({ proposedBy: user._id }),
    HelpRequest.find({ createdBy: user._id, status: "completed" })
      .select("_id")
      .lean(),
    Proposal.find({ proposedBy: user._id, status: "accepted" })
      .select("requestId")
      .lean(),
  ]);

  const completedRequestIds = [
    ...authoredCompletedRequests.map((request) => request._id),
    ...acceptedProposals.map((proposal) => proposal.requestId),
  ];
  const completedSessions = await HelpRequest.countDocuments({
    _id: { $in: completedRequestIds },
    status: "completed",
  });

  res.json({
    stats: { publishedRequests, proposalsSent, completedSessions },
  });
};
