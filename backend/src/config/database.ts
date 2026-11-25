import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI n’est pas configurée.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(uri);
}
