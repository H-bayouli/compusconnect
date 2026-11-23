
import { z } from "zod";

export const createProposalSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Your message must contain at least 10 characters")
    .max(1000, "Your message cannot exceed 1000 characters"),
});

export const updateProposalSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export type CreateProposalInput = z.infer<
  typeof createProposalSchema
>;

export type UpdateProposalInput = z.infer<
  typeof updateProposalSchema
>;
