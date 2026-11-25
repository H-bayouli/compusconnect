import mongoose, { Schema, Document, Model } from "mongoose";
export interface IReport extends Document {
  requestId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: string;
  status: "open" | "resolved" | "dismissed" | "removed";
  createdAt: Date;
  updatedAt: Date;
}
const ReportSchema = new Schema<IReport>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed", "removed"],
      default: "open",
    },
  },
  { timestamps: true },
);
const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
export default Report;
