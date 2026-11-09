
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    await mongoose.connection.db?.admin().ping();

    return NextResponse.json({
      success: true,
      message: "Next.js connected successfully to MongoDB!",
      database: mongoose.connection.name,
      status: "connected",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}
