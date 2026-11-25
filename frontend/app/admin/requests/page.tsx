"use client";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";
import { apiFetch } from "@/services/api";
import { requestStatusLabels, studyLevelLabels } from "@/types/labels";

interface AdminRequest {
  _id: string;
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  status: string;
  createdAt: string;
  createdBy?: { username?: string } | null;
}

export default function AdminRequestsPage() {
  const { language, translate } = useAppLanguage();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/requests")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les demandes.",
          );
        setRequests(data.requests || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les demandes.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function removeRequest(id: string) {
    if (!window.confirm(translate("Supprimer cette demande d’aide ?"))) return;

    setUpdating(id);
    setError("");
    try {
      const response = await apiFetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Impossible de supprimer la demande.");
      setRequests((current) => current.filter((request) => request._id !== id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de supprimer la demande.",
      );
    } finally {
      setUpdating("");
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("ESPACE ADMINISTRATEUR")}</div>
          <h1 className="page-title">{translate("Demandes")}</h1>
          <p className="page-subtitle">
            {translate(
              "Consulte et supprime les demandes publiées par les étudiants.",
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
          {translate("Chargement des demandes…")}
        </div>
      ) : requests.length === 0 ? (
        <section className="card empty">
          <h2>{translate("Aucune demande pour le moment")}</h2>
        </section>
      ) : (
        <section className="card">
          <div className="section-head">
            <h2>{translate("Demandes récentes")}</h2>
            <span className="pill">{requests.length}</span>
          </div>
          <div className="grid request-grid">
            {requests.map((request) => (
              <article className="card request-card" key={request._id}>
                <div className="request-meta">
                  <span className="pill pill-teal">{request.subject}</span>
                  <span className="pill">
                    {translate(
                      studyLevelLabels[request.studyLevel] ||
                        request.studyLevel,
                    )}
                  </span>
                  <span className="pill">
                    {translate(
                      requestStatusLabels[request.status] || request.status,
                    )}
                  </span>
                </div>
                <h3>{request.title}</h3>
                <p>
                  {request.description.slice(0, 180)}
                  {request.description.length > 180 ? "…" : ""}
                </p>
                <div className="request-foot">
                  <span>
                    {translate("Publié par")}{" "}
                    {request.createdBy?.username ||
                      translate("Utilisateur inconnu")}
                    {" · "}
                    {new Date(request.createdAt).toLocaleDateString(
                      language === "fr"
                        ? "fr-FR"
                        : language === "ar"
                          ? "ar"
                          : "en-US",
                    )}
                  </span>
                  <button
                    className="small-btn"
                    type="button"
                    disabled={updating === request._id}
                    onClick={() => void removeRequest(request._id)}
                  >
                    {translate("Supprimer")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
