import { SignJWT } from "jose";
import type { IUser } from "../models/User.js";

export async function signToken(
  user: Pick<IUser, "_id" | "email" | "role">,
): Promise<string> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET n’est pas configuré.");
  }

  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(secret));
}
