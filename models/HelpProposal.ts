
import mongoose, { Schema, Document, Model } from "mongoose";

export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface IProposal extends Document {
  requestId: mongoose.Types.ObjectId;
  proposedBy: mongoose.Types.ObjectId;
  message: string;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
      index: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// A student can submit only one proposal per request.
ProposalSchema.index(
  { requestId: 1, proposedBy: 1 },
  { unique: true }
);

const Proposal: Model<IProposal> =
  mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;
