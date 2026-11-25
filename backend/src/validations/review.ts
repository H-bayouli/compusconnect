import { z } from "zod";

export const createReviewSchema = z.object({
  requestId: z.string().min(1, "La demande est obligatoire."),
  rating: z
    .number()
    .int("La note doit être un nombre entier.")
    .min(1, "La note minimale est 1.")
    .max(5, "La note maximale est 5."),
  comment: z
    .string()
    .trim()
    .max(1000, "Le commentaire ne peut pas dépasser 1 000 caractères.")
    .default(""),
});
