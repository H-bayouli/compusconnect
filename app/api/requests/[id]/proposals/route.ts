
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

import HelpRequest from "@/models/HelpRequest";
import Proposal from "@/models/HelpProposal";

import { createProposalSchema } from "@/lib/validations/proposal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Only the request owner can view proposals.
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

    const helpRequest = await HelpRequest.findById(id);

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (helpRequest.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "Only the request owner can view proposals" },
        { status: 403 }
      );
    }

    const proposals = await Proposal.find({ requestId: id })
      .populate("proposedBy", "username specialty studyLevel skills")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      proposals,
      count: proposals.length,
    });

  } catch (error) {
    console.error("GET proposals error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Submit a proposal.
export async function POST(
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

    if (user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can submit proposals" },
        { status: 403 }
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
    const validation = createProposalSchema.safeParse(body);

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

    if (helpRequest.createdBy.toString() === user._id.toString()) {
      return NextResponse.json(
        { message: "You cannot propose help on your own request" },
        { status: 403 }
      );
    }

    if (helpRequest.status !== "open") {
      return NextResponse.json(
        { message: "This request is no longer accepting proposals" },
        { status: 400 }
      );
    }

    const proposal = await Proposal.create({
      requestId: id,
      proposedBy: user._id,
      message: validation.data.message,
    });

    return NextResponse.json(
      {
        message: "Proposal submitted successfully",
        proposal,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    // Handle the unique compound index.
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "You have already submitted a proposal for this request" },
        { status: 409 }
      );
    }

    console.error("POST proposal error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
