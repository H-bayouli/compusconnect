
import mongoose, { Schema, Document, Model } from "mongoose";

export type RequestStatus = "open" | "accepted" | "completed";

export interface IHelpRequest extends Document {
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  availability: string;
  status: RequestStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    studyLevel: {
      type: String,
      required: true,
      enum: ["Bachelor", "Engineering", "Master", "Doctorate"],
    },
    availability: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "accepted", "completed"],
      default: "open",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

HelpRequestSchema.index({ status: 1, subject: 1, studyLevel: 1 });

const HelpRequest: Model<IHelpRequest> =
  mongoose.models.HelpRequest ||
  mongoose.model<IHelpRequest>("HelpRequest", HelpRequestSchema);

export default HelpRequest;
