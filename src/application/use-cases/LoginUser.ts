import type {
  AuthRepository,
  LoginCredentials,
} from "@/src/domain/repositories/AuthRepository";

export class LoginUser {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<void> {
    await this.authRepository.login(credentials);
  }
}