import { z } from "zod";

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères."),
  description: z
    .string()
    .trim()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(2000, "La description ne peut pas dépasser 2 000 caractères."),
  subject: z
    .string()
    .trim()
    .min(2, "La matière est obligatoire")
    .max(80, "La matière ne peut pas dépasser 80 caractères."),
  studyLevel: z.enum(["Bachelor", "Engineering", "Master", "Doctorate"], {
    message: "Choisis un niveau d’études valide.",
  }),
  availability: z
    .string()
    .trim()
    .min(3, "Les disponibilités sont obligatoires")
    .max(120, "Les disponibilités ne peuvent pas dépasser 120 caractères."),
});

export const updateRequestSchema = createRequestSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Renseigne au moins un champ à modifier.",
  });

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
