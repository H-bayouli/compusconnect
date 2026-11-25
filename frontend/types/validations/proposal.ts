import { z } from "zod";

export const createProposalSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(1000, "Le message ne peut pas dépasser 1 000 caractères"),
});
