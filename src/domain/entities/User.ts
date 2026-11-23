export type UserRole = "student" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  specialty?: string;
  studyLevel?: string;
  skills: string[];
  role: UserRole;
}