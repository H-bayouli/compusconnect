import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { verifyAuthToken } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);

    if (!payload || !payload.sub) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(payload.sub);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        specialty: user.specialty,
        studyLevel: user.studyLevel,
        skills: user.skills,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Authentication error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}