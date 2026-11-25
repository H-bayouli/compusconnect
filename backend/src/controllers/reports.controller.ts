import mongoose from "mongoose";
import type { AuthenticatedHandler } from "../utils/http.js";
import HelpRequest from "../models/HelpRequest.js";
import Report from "../models/Report.js";
import { createReportSchema } from "../validations/report.js";

export const createReport: AuthenticatedHandler = async (req, res) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: "Vérifie le motif du signalement.",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  if (!mongoose.isValidObjectId(parsed.data.requestId)) {
    res.status(400).json({ message: "Identifiant de demande invalide." });
    return;
  }

  const requestExists = await HelpRequest.exists({
    _id: parsed.data.requestId,
  });
  if (!requestExists) {
    res.status(404).json({ message: "Demande introuvable." });
    return;
  }

  const report = await Report.create({
    requestId: parsed.data.requestId,
    reportedBy: res.locals.user._id,
    reason: parsed.data.reason,
  });
  res.status(201).json({ message: "Signalement envoyé.", report });
};
