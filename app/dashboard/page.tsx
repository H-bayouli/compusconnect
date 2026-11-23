
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  Link from "next/link";

interface User {
  _id: string;
  username: string;
  email: string;
  specialty: string;
  studyLevel: string;
  skills: string[];
  role: "student" | "admin";
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Retrieve the authenticated user
  useEffect(() => {
    const controller = new AbortController();

    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load your profile.");
        }

        // Supports either { user: {...} } or a direct user object.
        const currentUser = result.user ?? result;

        setUser(currentUser);
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

    fetchUser();

    return () => controller.abort();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logout failed."
      );
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Browse requests", href: "/requests" },
    { label: "My requests", href: "/my-requests" },
    { label: "My proposals", href: "/my-proposals" },
    { label: "My profile", href: "/profile" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white p-6 md:flex">

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-indigo-600">
            CampusConnect
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Student community platform
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                item.active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-5">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">

        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">

          <div>
            <p className="text-sm text-gray-500">
              CampusConnect / Dashboard
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {user.username}
              </p>
              <p className="text-xs capitalize text-gray-500">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 text-sm text-red-600 hover:underline md:hidden"
            >
              Log out
            </button>
          </div>
        </header>

        <div className="space-y-8 p-6 lg:p-10">

          {/* Welcome section */}
          <section>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.username}!
            </h1>
            <p className="mt-2 text-gray-500">
              Connect with other students, share your knowledge,
              and get help with your studies.
            </p>
          </section>

          {/* Statistics placeholders */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Your activity
            </h3>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {[
                "Published requests",
                "Active proposals",
                "Completed sessions",
              ].map((title) => (
                <div
                  key={title}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-500">{title}</p>
                  <p className="mt-3 text-2xl font-bold text-gray-300">
                    --
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Available when activity tracking is implemented
                  </p>
                </div>
              ))}

            </div>
          </section>

          {/* Quick actions */}
          <section>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Quick actions
            </h3>

            <div className="grid gap-5 sm:grid-cols-2">

              <Link
                href="/requests/new"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <h4 className="font-semibold text-gray-900">
                  Create a help request
                </h4>
                <p className="mt-2 text-sm text-gray-500">
                  Need help with a subject? Publish a request
                  and connect with another student.
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-indigo-600">
                  Create request →
                </span>
              </Link>

              <Link
                href="/requests"
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <h4 className="font-semibold text-gray-900">
                  Browse help requests
                </h4>
                <p className="mt-2 text-sm text-gray-500">
                  Discover requests from other students
                  and find opportunities to help.
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-indigo-600">
                  Explore requests →
                </span>
              </Link>

            </div>
          </section>

          {/* Student profile */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              Your student profile
            </h3>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 font-medium text-gray-900">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Specialty</p>
                <p className="mt-1 font-medium text-gray-900">
                  {user.specialty}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Study level</p>
                <p className="mt-1 font-medium text-gray-900">
                  {user.studyLevel}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="mt-1 font-medium capitalize text-gray-900">
                  {user.role}
                </p>
              </div>

            </div>

            <div className="mt-5">
              <p className="text-sm text-gray-500">Skills</p>

              <div className="mt-2 flex flex-wrap gap-2">
                {user.skills?.length ? (
                  user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    No skills added yet.
                  </span>
                )}
              </div>
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
