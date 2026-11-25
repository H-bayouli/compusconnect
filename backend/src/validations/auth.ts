import { z } from "zod";

const maxAvatarBytes = 1024 * 1024;
const avatarDataUrlPattern =
  /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

function isSupportedAvatar(value: string): boolean {
  if (!value) return true;

  const match = avatarDataUrlPattern.exec(value);
  if (!match) return false;

  const [, mimeType, encodedImage] = match;
  const image = Buffer.from(encodedImage, "base64");
  if (
    image.length === 0 ||
    image.length > maxAvatarBytes ||
    image.toString("base64") !== encodedImage
  ) {
    return false;
  }

  if (mimeType === "image/png") {
    return (
      image.length >= 33 &&
      image
        .subarray(0, 8)
        .equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        ) &&
      image.toString("ascii", 12, 16) === "IHDR" &&
      image.readUInt32BE(16) > 0 &&
      image.readUInt32BE(20) > 0 &&
      image
        .subarray(-12)
        .equals(
          Buffer.from([
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
            0x82,
          ]),
        )
    );
  }
  if (mimeType === "image/jpeg") {
    return (
      image.length >= 4 &&
      image[0] === 0xff &&
      image[1] === 0xd8 &&
      image[2] === 0xff &&
      image[image.length - 2] === 0xff &&
      image[image.length - 1] === 0xd9
    );
  }
  return (
    image.length >= 20 &&
    image.toString("ascii", 0, 4) === "RIFF" &&
    image.toString("ascii", 8, 12) === "WEBP" &&
    image.readUInt32LE(4) + 8 === image.length
  );
}

const avatarSchema = z
  .string()
  .max(1_400_000, "L’image doit faire 1 Mo maximum.")
  .refine(isSupportedAvatar, {
    message: "Choisis une image JPEG, PNG ou WebP valide de 1 Mo maximum.",
  });

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Le nom doit contenir au moins 3 caractères.")
    .max(30, "Le nom ne peut pas dépasser 30 caractères."),
  email: z.string().trim().email("Saisis une adresse e-mail valide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  specialty: z
    .string()
    .trim()
    .min(2, "La spécialité doit contenir au moins 2 caractères.")
    .max(80, "La spécialité ne peut pas dépasser 80 caractères."),
  studyLevel: z.enum(["Bachelor", "Engineering", "Master", "Doctorate"], {
    message: "Choisis un niveau d’études valide.",
  }),
  skills: z
    .array(z.string().trim().min(1).max(60))
    .max(30, "Tu peux ajouter au maximum 30 compétences.")
    .default([]),
  avatar: avatarSchema.default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Saisis une adresse e-mail valide."),
  password: z.string().min(1, "Saisis ton mot de passe."),
});

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
  studyLevel: registerSchema.shape.studyLevel,
  skills: registerSchema.shape.skills,
  avatar: avatarSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
