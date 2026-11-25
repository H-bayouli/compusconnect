import type { RequestHandler } from "express";
import HelpRequest from "../models/HelpRequest.js";

export const getPublicStats: RequestHandler = async (_req, res) => {
  const [requests, completedSessions] = await Promise.all([
    HelpRequest.countDocuments(),
    HelpRequest.countDocuments({ status: "completed" }),
  ]);

  res.json({ stats: { requests, completedSessions } });
};
