import mongoose, { Schema, Document, Model } from "mongoose";
export interface IReview extends Document {
  requestId: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  reviewedStudent: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  reviewedStudentViewedAt: Date | null;
  createdAt: Date;
}
const ReviewSchema = new Schema<IReview>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
      index: true,
    },
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedStudent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
    reviewedStudentViewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
ReviewSchema.index({ requestId: 1, reviewer: 1 }, { unique: true });
const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
export default Review;
