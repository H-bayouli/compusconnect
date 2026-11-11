
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RequestAuthor {
  _id: string;
  username: string;
  specialty?: string;
  studyLevel?: string;
}

interface HelpRequest {
  _id: string;
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  availability: string;
  status: "open" | "accepted" | "completed";
  createdBy: RequestAuthor;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  _id: string;
  username: string;
  role: "student" | "admin";
}

interface Proposal {
  _id: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  proposedBy: {
    _id: string;
    username: string;
    specialty?: string;
    studyLevel?: string;
    skills?: string[];
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailsPage({ params }: PageProps) {
  const router = useRouter();

  const [requestId, setRequestId] = useState<string | null>(null);

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [proposals, setProposals] = useState<Proposal[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [processingProposal, setProcessingProposal] = useState<string | null>(
    null
  );

  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalError, setProposalError] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState(false);

  const [error, setError] = useState("");

  // Resolve dynamic route parameters.
  useEffect(() => {
    let active = true;

    params
      .then(({ id }) => {
        if (active) setRequestId(id);
      })
      .catch(() => {
        if (active) {
          setError("Invalid request URL.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params]);

  // Fetch request and authenticated user.
  useEffect(() => {
    if (!requestId) return;

    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const [requestResponse, userResponse] = await Promise.all([
          fetch(`/api/requests/${requestId}`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),

          fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (
          requestResponse.status === 401 ||
          userResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (requestResponse.status === 404) {
          setError("This request does not exist.");
          return;
        }

        if (!requestResponse.ok) {
          throw new Error("Unable to load request details.");
        }

        if (!userResponse.ok) {
          throw new Error("Unable to load your user information.");
        }

        const requestData = await requestResponse.json();
        const userData = await userResponse.json();

        if (!requestData.request) {
          throw new Error("Invalid request response.");
        }

        setRequest(requestData.request);
        setCurrentUser(userData.user ?? userData);

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => controller.abort();
  }, [requestId, router]);

  // Check request ownership.
  const isOwner =
    request !== null &&
    currentUser !== null &&
    request.createdBy?._id === currentUser._id;

  // Load incoming proposals for the request owner.
  useEffect(() => {
  if (!request || !currentUser || !isOwner) return;

  const requestId = request._id;
  const controller = new AbortController();

  async function fetchProposals() {
    try {
      setLoadingProposals(true);
      setProposalError("");

      const response = await fetch(
        `/api/requests/${requestId}/proposals`,
        {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load proposals.");
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setProposalError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingProposals(false);
      }
    }
  }

  fetchProposals();

  return () => controller.abort();
}, [request?._id, currentUser?._id, isOwner]);

  // Delete request.
  async function handleDelete() {
    if (!requestId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this request?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete request.");
      }

      router.push("/requests");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setDeleting(false);
    }
  }

  // Submit a proposal.
  async function handleSubmitProposal(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!requestId) return;

    if (proposalMessage.trim().length < 10) {
      setProposalError(
        "Your message must contain at least 10 characters."
      );
      return;
    }

    try {
      setSubmittingProposal(true);
      setProposalError("");
      setProposalSuccess(false);

      const response = await fetch(
        `/api/requests/${requestId}/proposals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: proposalMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit proposal."
        );
      }

      setProposalSuccess(true);
      setProposalMessage("");

    } catch (err) {
      setProposalError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSubmittingProposal(false);
    }
  }

  // Accept or reject a proposal.
  async function handleProposalDecision(
    proposalId: string,
    status: "accepted" | "rejected"
  ) {
    if (!requestId) return;

    try {
      setProcessingProposal(proposalId);
      setProposalError("");

      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process proposal."
        );
      }

      if (status === "accepted") {
        setRequest((previous) =>
          previous
            ? { ...previous, status: "accepted" }
            : previous
        );
      }

      // Reload proposals after the decision.
      const proposalsResponse = await fetch(
        `/api/requests/${requestId}/proposals`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!proposalsResponse.ok) {
        throw new Error("Decision saved, but proposals could not refresh.");
      }

      const proposalsData = await proposalsResponse.json();

      setProposals(proposalsData.proposals || []);

    } catch (err) {
      setProposalError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setProcessingProposal(null);
    }
  }

  const statusStyles = {
    open: "bg-green-100 text-green-700",
    accepted: "bg-blue-100 text-blue-700",
    completed: "bg-gray-100 text-gray-700",
  };

  // Loading state.
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading request details...
        </p>
      </main>
    );
  }

  // Error state.
  if (error && !request) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm">
          <p className="text-red-600 mb-4">{error}</p>

          <Link
            href="/requests"
            className="text-indigo-600 hover:underline"
          >
            Back to requests
          </Link>
        </div>
      </main>
    );
  }

  if (!request) return null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Back navigation */}
        <Link
          href="/requests"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to requests
        </Link>

        {/* General error */}
        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

          {/* Request header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <div>
              <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                {request.subject}
              </span>

              <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
                {request.title}
              </h1>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium capitalize ${
                statusStyles[request.status]
              }`}
            >
              {request.status}
            </span>

          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Description
            </h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-600">
              {request.description}
            </p>
          </section>

          {/* Request information */}
          <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-y border-gray-100 py-6">

            <div>
              <p className="text-sm text-gray-500">
                Study level
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {request.studyLevel}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Availability
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {request.availability}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Published by
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {request.createdBy?.username ?? "Unknown"}
              </p>

              {request.createdBy?.specialty && (
                <p className="text-sm text-gray-500">
                  {request.createdBy.specialty}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Publication date
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

          </section>

          {/* Actions */}
          <section className="mt-8">

            {isOwner ? (
              <div>
                <p className="font-medium text-gray-900">
                  You published this request.
                </p>

                {request.status === "open" && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete request"}
                  </button>
                )}

                {request.status !== "open" && (
                  <p className="mt-3 text-sm text-gray-500">
                    This request can no longer be modified or deleted.
                  </p>
                )}

                {/* Incoming proposals */}
                <div className="mt-10 border-t border-gray-100 pt-8">

                  <h2 className="text-xl font-bold text-gray-900">
                    Incoming proposals
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review students who want to help you.
                  </p>

                  {proposalError && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {proposalError}
                    </div>
                  )}

                  {loadingProposals ? (
                    <p className="mt-5 text-gray-500">
                      Loading proposals...
                    </p>
                  ) : proposals.length === 0 ? (
                    <div className="mt-5 rounded-lg bg-gray-50 p-6 text-center">
                      <p className="font-medium text-gray-700">
                        No proposals yet.
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Proposals from other students will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">

                      {proposals.map((proposal) => (
                        <div
                          key={proposal._id}
                          className="rounded-xl border border-gray-200 p-5"
                        >

                          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">

                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {proposal.proposedBy?.username || "Unknown student"}
                              </h3>

                              <p className="text-sm text-gray-500">
                                {proposal.proposedBy?.specialty || "No specialty specified"}
                              </p>

                              {proposal.proposedBy?.studyLevel && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {proposal.proposedBy.studyLevel}
                                </p>
                              )}
                            </div>

                            <span
                              className={`h-fit w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${
                                proposal.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : proposal.status === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {proposal.status}
                            </span>

                          </div>

                          <div className="mt-4 rounded-lg bg-gray-50 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {proposal.message}
                            </p>
                          </div>

                          <p className="mt-3 text-xs text-gray-400">
                            Submitted on{" "}
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </p>

                          {proposal.status === "pending" &&
                            request.status === "open" && (
                              <div className="mt-4 flex flex-wrap gap-3">

                                <button
                                  onClick={() =>
                                    handleProposalDecision(
                                      proposal._id,
                                      "accepted"
                                    )
                                  }
                                  disabled={processingProposal !== null}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processingProposal === proposal._id
                                    ? "Processing..."
                                    : "Accept"}
                                </button>

                                <button
                                  onClick={() =>
                                    handleProposalDecision(
                                      proposal._id,
                                      "rejected"
                                    )
                                  }
                                  disabled={processingProposal !== null}
                                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>

                              </div>
                            )}

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              </div>

            ) : request.status === "open" ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Interested in helping?
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Introduce yourself and explain how you can help this student.
                </p>

                {proposalSuccess ? (
                  <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="font-medium text-green-800">
                      Proposal submitted successfully!
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      The request owner can now review your proposal.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitProposal}
                    className="mt-5 space-y-4"
                  >

                    <div>
                      <label
                        htmlFor="proposalMessage"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Your message
                      </label>

                      <textarea
                        id="proposalMessage"
                        value={proposalMessage}
                        onChange={(e) =>
                          setProposalMessage(e.target.value)
                        }
                        rows={5}
                        maxLength={1000}
                        placeholder="Explain how you can help..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        required
                      />

                      <p className="mt-1 text-right text-xs text-gray-500">
                        {proposalMessage.length}/1000 characters
                      </p>
                    </div>

                    {proposalError && (
                      <p className="text-sm text-red-600">
                        {proposalError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={
                        submittingProposal ||
                        proposalMessage.trim().length < 10
                      }
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingProposal
                        ? "Submitting..."
                        : "Submit proposal"}
                    </button>

                  </form>
                )}
              </div>

            ) : (
              <p className="text-sm text-gray-600">
                This request is no longer accepting proposals.
              </p>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}
