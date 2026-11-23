import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  specialty: z.string().min(2),
  studyLevel: z.string().min(1),
  skills: z.array(z.string()).optional().default([]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;