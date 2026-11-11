
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailsPage({ params }: PageProps) {
  const router = useRouter();

  const [requestId, setRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Resolve the asynchronous route parameter.
  useEffect(() => {
    let active = true;

    params.then(({ id }) => {
      if (active) {
        setRequestId(id);
      }
    }).catch(() => {
      if (active) {
        setError("Invalid request URL.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [params]);

  // Fetch request and current user.
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
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

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

  // Check whether the logged-in user owns this request.
  const isOwner =
    request !== null &&
    currentUser !== null &&
    request.createdBy?._id === currentUser._id;

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
        throw new Error(
          data.message || "Failed to delete request."
        );
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

        {/* Error message */}
        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

          {/* Header */}
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

                {request.status === "open" ? (
                  <div className="mt-4 flex flex-wrap gap-3">

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Delete request"}
                    </button>

                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    This request can no longer be modified or deleted.
                  </p>
                )}
              </div>

            ) : request.status === "open" ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Interested in helping?
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  You can propose your help to the student who
                  published this request.
                </p>

                <button
                  disabled
                  className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-white opacity-60 cursor-not-allowed"
                >
                  Propose help (coming next)
                </button>
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
