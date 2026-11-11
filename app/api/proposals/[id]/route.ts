
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

import Proposal from "@/models/HelpProposal";
import HelpRequest from "@/models/HelpRequest";

import { updateProposalSchema } from "@/lib/validations/proposal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
        { message: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateProposalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid proposal status" },
        { status: 400 }
      );
    }

    await connectDB();

    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposal not found" },
        { status: 404 }
      );
    }

    const helpRequest = await HelpRequest.findById(
      proposal.requestId
    );

    if (!helpRequest) {
      return NextResponse.json(
        { message: "Associated request not found" },
        { status: 404 }
      );
    }

    // Only the request owner can decide.
    if (helpRequest.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { message: "Only the request owner can manage proposals" },
        { status: 403 }
      );
    }

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { message: "This proposal has already been processed" },
        { status: 400 }
      );
    }

    if (helpRequest.status !== "open") {
      return NextResponse.json(
        { message: "This request is no longer open" },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    if (status === "rejected") {
      const rejectedProposal = await Proposal.findOneAndUpdate(
        { _id: id, status: "pending" },
        { $set: { status: "rejected" } },
        { new: true }
      );

      if (!rejectedProposal) {
        return NextResponse.json(
          { message: "This proposal has already been processed" },
          { status: 409 }
        );
      }

      return NextResponse.json({
        message: "Proposal rejected successfully",
        proposal: rejectedProposal,
      });
    }

    // Atomically claim the request so only one proposal can be accepted.
    const claimedRequest = await HelpRequest.findOneAndUpdate(
      { _id: helpRequest._id, status: "open" },
      { $set: { status: "accepted" } },
      { new: true }
    );

    if (!claimedRequest) {
      return NextResponse.json(
        { message: "Another proposal has already been accepted" },
        { status: 409 }
      );
    }

    const acceptedProposal = await Proposal.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "accepted" } },
      { new: true }
    );

    if (!acceptedProposal) {
      // Restore the request if the proposal could not be updated.
      await HelpRequest.updateOne(
        { _id: helpRequest._id, status: "accepted" },
        { $set: { status: "open" } }
      );

      return NextResponse.json(
        { message: "Proposal could not be accepted. Please retry." },
        { status: 409 }
      );
    }

    // Other pending proposals can no longer be accepted.
    await Proposal.updateMany(
      {
        requestId: helpRequest._id,
        _id: { $ne: acceptedProposal._id },
        status: "pending",
      },
      { $set: { status: "rejected" } }
    );

    return NextResponse.json({
      message: "Proposal accepted successfully",
      proposal: acceptedProposal,
      request: claimedRequest,
    });

  } catch (error) {
    console.error("PATCH proposal error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
