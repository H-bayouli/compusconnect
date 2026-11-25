import { z } from "zod";

export const updateReportSchema = z.object({
  status: z.enum(["resolved", "dismissed", "removed"], {
    message: "Choisis une action valide pour ce signalement.",
  }),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
