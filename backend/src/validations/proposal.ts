import { z } from "zod";

export const createProposalSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères.")
    .max(1000, "Le message ne peut pas dépasser 1 000 caractères."),
});

export const updateProposalSchema = z.object({
  status: z.enum(["accepted", "rejected"], {
    message: "Choisis d’accepter ou de refuser la proposition.",
  }),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
