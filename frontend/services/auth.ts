import { apiFetch } from "@/services/api";
import type { LoginInput, RegisterInput } from "@/types/validations/auth";

async function submitCredentials(
  endpoint: string,
  credentials: LoginInput | RegisterInput,
  defaultMessage: string,
): Promise<void> {
  const response = await apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || defaultMessage);
  }
}

export async function loginUser(
  credentials: LoginInput,
): Promise<{ role: "student" | "admin" }> {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Adresse e-mail ou mot de passe incorrect.";
    throw new Error(message);
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("user" in result) ||
    typeof result.user !== "object" ||
    result.user === null ||
    !("role" in result.user) ||
    (result.user.role !== "student" && result.user.role !== "admin")
  ) {
    throw new Error("Réponse de connexion invalide.");
  }

  return { role: result.user.role };
}

export function registerUser(credentials: RegisterInput): Promise<void> {
  return submitCredentials(
    "/api/auth/register",
    credentials,
    "Impossible de créer le compte.",
  );
}
