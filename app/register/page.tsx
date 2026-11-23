"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    registerSchema,
    RegisterInput,
} from "@/lib/validations/auth";

import { z } from "zod";


export default function RegisterPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<
        z.input<typeof registerSchema>,
        unknown,
        RegisterInput
    >({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            specialty: "",
            studyLevel: "",
            skills: [],
        },
    });

    const onSubmit = async (data: RegisterInput) => {
        setLoading(true);
        setServerError("");

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setServerError(
                    result.message || "Registration failed. Please try again."
                );
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setServerError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100";

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Join CampusConnect
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Create your student account and start helping others.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            {...register("username")}
                            placeholder="Enter your username"
                            className={inputClass}
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.username.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            {...register("email")}
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            {...register("password")}
                            placeholder="At least 8 characters"
                            className={inputClass}
                        />
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Specialty
                        </label>
                        <input
                            {...register("specialty")}
                            placeholder="e.g. Computer Science"
                            className={inputClass}
                        />
                        {errors.specialty && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.specialty.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Study level
                        </label>
                        <select {...register("studyLevel")} className={inputClass}>
                            <option value="">Select your study level</option>
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Skills
                        </label>
                        <input
                            placeholder="e.g. React, Python, Docker"
                            className={inputClass}
                            {...register("skills", {
                                setValueAs: (value: string | string[]) =>
                                    typeof value === "string"
                                        ? value
                                            .split(",")
                                            .map((skill) => skill.trim())
                                            .filter(Boolean)
                                        : value,
                            })}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Separate skills with commas.
                        </p>
                    </div>

                    {serverError && (
                        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-indigo-600 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}