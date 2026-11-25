import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Le nom doit contenir au moins 3 caractères.")
    .max(30, "Le nom ne peut pas dépasser 30 caractères."),
  specialty: z
    .string()
    .trim()
    .min(2, "La spécialité doit contenir au moins 2 caractères.")
    .max(80, "La spécialité ne peut pas dépasser 80 caractères."),
  studyLevel: z.enum(["Bachelor", "Engineering", "Master", "Doctorate"], {
    message: "Choisis ton niveau d’études.",
  }),
  skills: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(
          z
            .string()
            .min(1)
            .max(60, "Une compétence ne peut pas dépasser 60 caractères."),
        )
        .max(30, "Tu peux ajouter au maximum 30 compétences."),
    ),
  avatar: z
    .string()
    .max(1_400_000, "L’image doit faire 1 Mo maximum.")
    .optional()
    .default(""),
});

export interface ProfileFormInput {
  username: string;
  specialty: string;
  studyLevel: string;
  skills: string;
  avatar: string;
}
