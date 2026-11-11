
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { createRequestSchema } from "@/lib/validations/request";
import HelpRequest from "@/models/HelpRequest";

// GET /api/requests
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const subject = searchParams.get("subject");
    const studyLevel = searchParams.get("studyLevel");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (subject) filter.subject = subject;

    if (studyLevel) filter.studyLevel = studyLevel;

    if (status) {
      if (!["open", "accepted", "completed"].includes(status)) {
        return NextResponse.json(
          { message: "Invalid status filter" },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const requests = await HelpRequest.find(filter)
      .populate("createdBy", "username specialty studyLevel")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { requests, count: requests.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET requests error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve requests" },
      { status: 500 }
    );
  }
}

// POST /api/requests
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can create help requests" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validation = createRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const newRequest = await HelpRequest.create({
      ...validation.data,
      createdBy: user._id,
    });

    return NextResponse.json(
      {
        message: "Help request created successfully",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST request error:", error);

    return NextResponse.json(
      { message: "Unable to create help request" },
      { status: 500 }
    );
  }
}
