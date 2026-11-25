import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import type { AuthenticatedHandler } from "../utils/http.js";
import User, { type IUser } from "../models/User.js";
import { currentUser } from "../middlewares/auth.js";
import { isDuplicateKeyError } from "../utils/errors.js";
import { signToken } from "../utils/token.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validations/auth.js";

function publicUser(user: IUser, includeAvatar = false) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    specialty: user.specialty,
    studyLevel: user.studyLevel,
    skills: user.skills,
    role: user.role,
    ...(includeAvatar ? { avatar: user.avatar || "" } : {}),
  };
}

export const register: RequestHandler = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie les informations du formulaire.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email })) {
    res
      .status(409)
      .json({ message: "Cette adresse e-mail est déjà utilisée." });
    return;
  }

  try {
    const user = await User.create({
      ...parsed.data,
      email,
      password: await bcrypt.hash(parsed.data.password, 12),
    });

    res.status(201).json({
      success: true,
      message: "Compte créé.",
      user: publicUser(user),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res
        .status(409)
        .json({ message: "Cette adresse e-mail est déjà utilisée." });
      return;
    }

    throw error;
  }
};

export const login: RequestHandler = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "E-mail ou mot de passe invalide." });
    return;
  }

  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
  }).select("+password");

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    res.status(401).json({ message: "E-mail ou mot de passe incorrect." });
    return;
  }

  if (user.isActive === false) {
    res.status(403).json({ message: "Ce compte est désactivé." });
    return;
  }

  const token = await signToken(user);
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86_400_000,
    path: "/",
  });
  res.json({
    success: true,
    message: "Connexion réussie.",
    user: publicUser(user),
  });
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  const includeAvatar = req.query.includeAvatar === "true";
  const user = await currentUser(req, includeAvatar);
  if (!user) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }

  res.json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      specialty: user.specialty,
      studyLevel: user.studyLevel,
      skills: user.skills,
      role: user.role,
      ...(includeAvatar ? { avatar: user.avatar || "" } : {}),
    },
  });
};

export const updateProfile: AuthenticatedHandler = async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie les informations du profil.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const user = await User.findById(res.locals.user._id).select("+avatar");
  if (!user) {
    res.status(404).json({ message: "Profil introuvable." });
    return;
  }

  const { avatar, ...profile } = parsed.data;
  Object.assign(user, profile);
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({
    message: "Profil mis à jour.",
    user: publicUser(user, true),
  });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ success: true, message: "Déconnexion réussie." });
};
