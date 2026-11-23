import { LoginUser } from "@/src/application/use-cases/LoginUser";
import { RegisterUser } from "@/src/application/use-cases/RegisterUser";
import { HttpAuthRepository } from "@/src/infrastructure/repositories/HttpAuthRepository";

const authRepository = new HttpAuthRepository();

export const loginUser = new LoginUser(authRepository);

export const registerUser = new RegisterUser(authRepository);