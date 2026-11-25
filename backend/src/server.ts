import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import notificationsRoutes from "./routes/notifications.js";
import proposalRoutes from "./routes/proposals.js";
import reportRoutes from "./routes/reports.js";
import requestRoutes from "./routes/requests.js";
import reviewRoutes from "./routes/reviews.js";
import sessionRoutes from "./routes/sessions.js";
import statsRoutes from "./routes/stats.js";

const port = Number(process.env.PORT ?? 4000);
const app = express();
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Vérification MongoDB impossible.", error);
    res.status(500).json({ ok: false, database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/requests", sessionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route introuvable." });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res
      .status(413)
      .json({ message: "La requête dépasse la taille autorisée." });
    return;
  }

  console.error("Erreur API non traitée.", error);
  res.status(500).json({ message: "Une erreur est survenue sur le serveur." });
};

app.use(errorHandler);

async function startServer(): Promise<void> {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 32) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères.");
  }

  await connectDB();
  app.listen(port, () => {
    console.log(`CampusConnect API disponible sur http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Démarrage de l’API impossible.", error);
  process.exitCode = 1;
});
