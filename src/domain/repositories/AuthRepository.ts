
import type { User } from "../entities/User";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  specialty: string;
  studyLevel: string;
  skills: string[];
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<void>;

  register(credentials: RegisterCredentials): Promise<void>;

  getCurrentUser(): Promise<User>;
}
