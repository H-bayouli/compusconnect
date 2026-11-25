import type { StudentSummary } from "@/types/auth";

export type ProposalStatus = "pending" | "accepted" | "rejected";
export type ProposalDecision = "accepted" | "rejected";

export interface HelpProposal {
  _id: string;
  message: string;
  status: ProposalStatus;
  proposedBy: StudentSummary;
}
