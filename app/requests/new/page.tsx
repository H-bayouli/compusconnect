
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createRequestSchema,
  CreateRequestInput,
} from "@/lib/validations/request";

export default function CreateRequestPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      studyLevel: "Engineering",
      availability: "",
    },
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700";

  const onSubmit = async (data: CreateRequestInput) => {
    setLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(
          result.message || "Unable to create your request."
        );
        return;
      }

      router.push("/requests?created=true");
      router.refresh();
    } catch {
      setServerError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600"
        >
          ← Back to dashboard
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create a help request
          </h1>

          <p className="mt-2 text-gray-500">
            Explain what you need help with and connect with
            students who can support you.
          </p>
        </div>

        {/* Form container */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >

            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Request title
              </label>

              <input
                id="title"
                type="text"
                placeholder="e.g. Need help understanding React hooks"
                className={inputClass}
                {...register("title")}
              />

              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>

              <textarea
                id="description"
                rows={5}
                placeholder="Describe the topic you need help with, what you have tried, and where you are having difficulties..."
                className={`${inputClass} resize-y`}
                {...register("description")}
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}

              <p className="mt-1 text-xs text-gray-400">
                Minimum 20 characters, maximum 2000.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className={labelClass}>
                Subject
              </label>

              <input
                id="subject"
                type="text"
                placeholder="e.g. Web Development, Mathematics, Databases"
                className={inputClass}
                {...register("subject")}
              />

              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subject.message}
                </p>
              )}
            </div>

            {/* Study level */}
            <div>
              <label htmlFor="studyLevel" className={labelClass}>
                Study level
              </label>

              <select
                id="studyLevel"
                className={inputClass}
                {...register("studyLevel")}
              >
                <option value="Bachelor">Bachelor</option>
                <option value="Engineering">Engineering</option>
                <option value="Master">Master</option>
                <option value="Doctorate">Doctorate</option>
              </select>

              {errors.studyLevel && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.studyLevel.message}
                </p>
              )}
            </div>

            {/* Availability */}
            <div>
              <label htmlFor="availability" className={labelClass}>
                Your availability
              </label>

              <input
                id="availability"
                type="text"
                placeholder="e.g. Weekdays after 16:00 or weekends"
                className={inputClass}
                {...register("availability")}
              />

              {errors.availability && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.availability.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

              <Link
                href="/dashboard"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Publishing..." : "Publish request"}
              </button>

            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Your request will be visible to other CampusConnect students.
        </p>

      </div>
    </main>
  );
}
