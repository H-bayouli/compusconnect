import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import User from "../models/User.js";
import type { IUser } from "../models/User.js";
import { signToken } from "../utils/token.js";

export { signToken };

export async function currentUser(
  req: Request,
  includeAvatar = false,
): Promise<IUser | null> {
  const token = req.cookies?.auth_token;
  if (!token) {
    return null;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET n’est pas configuré.");
  }

  let subject: string;
  try {
    const result = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!result.payload.sub) {
      return null;
    }
    subject = result.payload.sub;
  } catch {
    return null;
  }

  const userQuery = User.findById(subject);
  if (includeAvatar) userQuery.select("+avatar");
  const user = await userQuery;
  return user?.isActive === false ? null : user;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await currentUser(req);

  if (!user) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  res.locals.user = user;
  next();
}

export function requireRole(...roles: IUser["role"][]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(res.locals.user?.role)) {
      res.status(403).json({ message: "Accès réservé à ce rôle." });
      return;
    }

    next();
  };
}
