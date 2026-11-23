
import type {
    AuthRepository,
    LoginCredentials,
    RegisterCredentials,
} from "@/src/domain/repositories/AuthRepository";

import type { User } from "@/src/domain/entities/User";

export class HttpAuthRepository implements AuthRepository {
    async register(credentials: RegisterCredentials): Promise<void> {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(credentials),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to create your account."
            );
        }
    }
    async login(credentials: LoginCredentials): Promise<void> {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(credentials),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Invalid email or password."
            );
        }
    }

    async getCurrentUser(): Promise<User> {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to retrieve current user."
            );
        }

        const user = result.user ?? result;

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            specialty: user.specialty,
            studyLevel: user.studyLevel,
            skills: user.skills ?? [],
            role: user.role,
        };
    }
}
