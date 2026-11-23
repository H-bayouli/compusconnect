import type {
  AuthRepository,
  RegisterCredentials,
} from "@/src/domain/repositories/AuthRepository";

export class RegisterUser {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<void> {
    await this.authRepository.register(credentials);
  }
}
