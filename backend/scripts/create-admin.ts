import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/config/database.js";
import User from "../src/models/User.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error(
    "Définis ADMIN_EMAIL et ADMIN_PASSWORD dans backend/.env avant de créer le compte administrateur.",
  );
}
if (password.length < 12) {
  throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères.");
}

await connectDB();
try {
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    {
      username: "Administrateur",
      email,
      password: hash,
      specialty: "Administration",
      studyLevel: "Engineering",
      skills: ["modération"],
      role: "admin",
    },
    { upsert: true, new: true },
  );
  console.log(`Compte administrateur prêt : ${email}`);
} finally {
  await mongoose.disconnect();
}
