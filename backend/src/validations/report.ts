import { z } from "zod";

export const createReportSchema = z.object({
  requestId: z.string().min(1, "La demande à signaler est obligatoire."),
  reason: z
    .string()
    .trim()
    .min(5, "Le motif doit contenir au moins 5 caractères.")
    .max(500, "Le motif ne peut pas dépasser 500 caractères."),
});
