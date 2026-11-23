
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { updateRequestSchema } from "@/lib/validations/request";
import HelpRequest from "@/models/HelpRequest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/requests/:id
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid request ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const helpRequest = await HelpRequest.findById(id)
      .populate("createdBy", "username specialty studyLevel")
      .lean();

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: helpRequest });
  } catch (error) {
    console.error("GET request by ID error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve request" },
      { status: 500 }
    );
  }
}

// PATCH /api/requests/:id
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid request ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateRequestSchema.safeParse(body);

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

    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (helpRequest.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "You cannot edit this request" },
        { status: 403 }
      );
    }

    if (helpRequest.status !== "open") {
      return NextResponse.json(
        { message: "Only open requests can be edited" },
        { status: 400 }
      );
    }

    Object.assign(helpRequest, validation.data);

    await helpRequest.save();

    return NextResponse.json({
      message: "Request updated successfully",
      request: helpRequest,
    });
  } catch (error) {
    console.error("PATCH request error:", error);

    return NextResponse.json(
      { message: "Unable to update request" },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/:id
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid request ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (helpRequest.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "You cannot delete this request" },
        { status: 403 }
      );
    }

    if (helpRequest.status !== "open") {
      return NextResponse.json(
        { message: "Only open requests can be deleted" },
        { status: 400 }
      );
    }

    await HelpRequest.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("DELETE request error:", error);

    return NextResponse.json(
      { message: "Unable to delete request" },
      { status: 500 }
    );
  }
}
