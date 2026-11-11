
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface RequestAuthor {
  _id?: string;
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
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRequests() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (search.trim()) params.set("search", search.trim());
        if (subject.trim()) params.set("subject", subject.trim());
        if (studyLevel) params.set("studyLevel", studyLevel);
        if (status) params.set("status", status);

        const response = await fetch(
          `/api/requests?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to retrieve requests."
          );
        }

        setRequests(result.requests || []);
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

    fetchRequests();

    return () => controller.abort();
  }, [search, subject, studyLevel, status]);

  const resetFilters = () => {
    setSearch("");
    setSubject("");
    setStudyLevel("");
    setStatus("");
  };

  const statusStyle = (requestStatus: HelpRequest["status"]) => {
    switch (requestStatus) {
      case "open":
        return "bg-green-100 text-green-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:underline"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Browse help requests
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Discover students who need your knowledge and support.
            </p>
          </div>

          <Link
            href="/requests/new"
            className="rounded-lg bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            + Create request
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Search and filters */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <h2 className="mb-4 font-semibold text-gray-900">
            Search and filter
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Subject
              </label>

              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Web Development"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="studyLevel"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Study level
              </label>

              <select
                id="studyLevel"
                value={studyLevel}
                onChange={(e) => setStudyLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-600"
              >
                <option value="">All levels</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Engineering">Engineering</option>
                <option value="Master">Master</option>
                <option value="Doctorate">Doctorate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-600"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Clear filters
              </button>
            </div>

          </div>
        </section>

        {/* Results heading */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Available requests
          </h2>

          {!loading && !error && (
            <span className="text-sm text-gray-500">
              {requests.length} {requests.length === 1 ? "request" : "requests"} found
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && !error && (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-500">Loading help requests...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && requests.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              No requests found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your filters or create a new help request.
            </p>

            <Link
              href="/requests/new"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create a request
            </Link>
          </div>
        )}

        {/* Request cards */}
        {!loading && !error && requests.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {requests.map((request) => (
              <article
                key={request._id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >

                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {request.subject}
                  </span>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(request.status)}`}
                  >
                    {request.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {request.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                  {request.description.length > 150
                    ? `${request.description.slice(0, 150)}...`
                    : request.description}
                </p>

                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">

                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">
                      Author:
                    </span>{" "}
                    {request.createdBy?.username || "Unknown"}
                  </p>

                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">
                      Study level:
                    </span>{" "}
                    {request.studyLevel}
                  </p>

                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">
                      Availability:
                    </span>{" "}
                    {request.availability}
                  </p>

                  <p className="text-xs text-gray-400">
                    Published{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>

                </div>

                <Link
                  href={`/requests/${request._id}`}
                  className="mt-5 block rounded-lg border border-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  View details →
                </Link>

              </article>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}
