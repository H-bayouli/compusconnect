
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const user = await User.create({
      username: "student_test",
      email: "student@test.com",
      password: "temporary-test-password",
      specialty: "Computer Science",
      studyLevel: "L3",
      skills: ["React", "Python"],
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "User creation failed" },
      { status: 500 }
    );
  }
}
