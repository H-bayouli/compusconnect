
import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().trim().min(5, "Title must contain at least 5 characters").max(100),
  description: z.string().trim().min(20, "Description must contain at least 20 characters").max(2000),
  subject: z.string().trim().min(2, "Subject is required").max(80),
  studyLevel: z.enum(["Bachelor", "Engineering", "Master", "Doctorate"]),
  availability: z.string().trim().min(3, "Availability is required").max(120),
});

export const updateRequestSchema = createRequestSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one field must be provided" }
  );

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
