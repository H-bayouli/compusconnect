export type NotificationKind =
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_rejected"
  | "proposal_not_selected"
  | "review_received";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  actor?: { username: string };
  recipient?: { username: string };
  request?: { _id: string; title: string };
  status?: "pending" | "accepted" | "rejected";
  rating?: number;
  comment?: string;
  createdAt: string;
  readAt: string | null;
}
