"use client";

import { apiFetch } from "@/services/api";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

type ReportItem = {
  _id: string;
  requestId?: { title: string };
  reportedBy?: { username: string };
  reason: string;
  status: "open" | "resolved" | "dismissed" | "removed";
};

const reportStatusLabels: Record<ReportItem["status"], string> = {
  open: "À traiter",
  resolved: "Traité",
  dismissed: "Ignoré",
  removed: "Publication supprimée",
};

export default function Admin() {
  const { translate } = useAppLanguage();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");

  async function load() {
    const response = await apiFetch("/api/admin/dashboard");
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.message || "Impossible de charger l’espace d’administration.",
      );
    setReports(data.reports || []);
  }

  useEffect(() => {
    apiFetch("/api/admin/dashboard")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger l’espace d’administration.",
          );
        return data;
      })
      .then((data) => {
        setReports(data.reports || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger l’administration.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function resolve(id: string, status: ReportItem["status"]) {
    setUpdating(id);
    setError("");
    try {
      const response = await apiFetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Impossible de traiter le signalement.",
        );
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de traiter le signalement.",
      );
    } finally {
      setUpdating("");
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            {translate("MODÉRATION DE LA COMMUNAUTÉ")}
          </div>
          <h1 className="page-title">{translate("Administration")}</h1>
          <p className="page-subtitle">
            {translate(
              "Examine les signalements et veille au respect des échanges.",
            )}
          </p>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {translate(error)}
        </div>
      )}
      {loading ? (
        <div className="loading" role="status">
          {translate("Chargement de l’administration…")}
        </div>
      ) : (
        <section className="card">
          <div className="section-head">
            <h2>{translate("Publications signalées")}</h2>
            <span className="pill pill-gold">
              {reports.filter((report) => report.status === "open").length}
              {translate(" à traiter")}
            </span>
          </div>
          {reports.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" aria-hidden="true">
                ✓
              </div>
              <h3>{translate("Aucun signalement à examiner")}</h3>
              <p>
                {translate(
                  "Les nouvelles publications signalées apparaîtront ici.",
                )}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{translate("Publication")}</th>
                    <th>{translate("Signalée par")}</th>
                    <th>{translate("Motif")}</th>
                    <th>{translate("État")}</th>
                    <th>{translate("Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        {report.requestId?.title ||
                          translate("Demande supprimée")}
                      </td>
                      <td>
                        {report.reportedBy?.username || translate("Étudiant")}
                      </td>
                      <td>{report.reason}</td>
                      <td>
                        <span className="pill">
                          {translate(
                            reportStatusLabels[report.status] || report.status,
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button
                            className="small-btn"
                            disabled={
                              updating === report._id ||
                              report.status !== "open"
                            }
                            onClick={() => resolve(report._id, "resolved")}
                          >
                            {translate("Marquer comme traité")}
                          </button>
                          <button
                            className="small-btn"
                            disabled={
                              updating === report._id ||
                              report.status !== "open"
                            }
                            onClick={() => resolve(report._id, "dismissed")}
                          >
                            {translate("Ignorer")}
                          </button>
                          <button
                            className="small-btn"
                            disabled={
                              updating === report._id ||
                              report.status !== "open"
                            }
                            onClick={() => {
                              if (
                                window.confirm(
                                  translate(
                                    "Supprimer définitivement cette demande ?",
                                  ),
                                )
                              )
                                void resolve(report._id, "removed");
                            }}
                          >
                            {translate("Supprimer")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
