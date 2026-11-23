import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";


export async function verifyAuthToken(token: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  if (!payload || !payload.sub) {
    return null;
  }

  await connectDB();

  return User.findById(payload.sub);
}

export function hasRole(
  user: { role: string },
  allowedRoles: string[]
) {
  return allowedRoles.includes(user.role);
}