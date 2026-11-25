"use client";

import { useEffect, useState } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";
import { apiFetch } from "@/services/api";

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: "student" | "admin";
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { language, translate } = useAppLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/users")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les utilisateurs.",
          );
        setUsers(data.users || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les utilisateurs.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function setUserStatus(user: AdminUser) {
    const nextIsActive = !user.isActive;
    if (
      !nextIsActive &&
      !window.confirm(
        translate(
          "Désactiver ce compte ? L’utilisateur ne pourra plus se connecter.",
        ),
      )
    ) {
      return;
    }

    setUpdating(user._id);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/api/admin/users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextIsActive }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Impossible de modifier ce compte.");
      setUsers((current) =>
        current.map((item) =>
          item._id === user._id ? { ...item, isActive: nextIsActive } : item,
        ),
      );
      setNotice(data.message || "Compte utilisateur mis à jour.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de modifier ce compte.",
      );
    } finally {
      setUpdating("");
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmation = translate(
      "Supprimer définitivement le compte de {{username}} ? Ses demandes, propositions et évaluations seront aussi supprimées.",
    ).replace("{{username}}", user.username);
    if (!window.confirm(confirmation)) return;

    setUpdating(user._id);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Impossible de supprimer ce compte.");
      setUsers((current) => current.filter((item) => item._id !== user._id));
      setNotice(data.message || "Compte utilisateur supprimé.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de supprimer ce compte.",
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
          <h1 className="page-title">{translate("Utilisateurs")}</h1>
          <p className="page-subtitle">
            {translate(
              "Consulte les comptes étudiants, désactive-les ou supprime-les.",
            )}
          </p>
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {translate(error)}
        </div>
      )}
      {notice && (
        <div className="success" role="status">
          {translate(notice)}
        </div>
      )}
      {loading ? (
        <div className="loading" role="status">
          {translate("Chargement des utilisateurs…")}
        </div>
      ) : users.length === 0 ? (
        <section className="card empty">
          <h2>{translate("Aucun compte étudiant à afficher.")}</h2>
        </section>
      ) : (
        <section className="card">
          <div className="section-head">
            <h2>{translate("Comptes étudiants")}</h2>
            <span className="pill">{users.length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{translate("Nom")}</th>
                  <th>{translate("Adresse e-mail")}</th>
                  <th>{translate("État du compte")}</th>
                  <th>{translate("Inscription")}</th>
                  <th>{translate("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`pill ${user.isActive ? "pill-teal" : "pill-gold"}`}
                      >
                        {translate(user.isActive ? "Actif" : "Désactivé")}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString(
                        language === "fr"
                          ? "fr-FR"
                          : language === "ar"
                            ? "ar"
                            : "en-US",
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="small-btn"
                          type="button"
                          disabled={updating === user._id}
                          onClick={() => void setUserStatus(user)}
                        >
                          {translate(
                            user.isActive ? "Désactiver" : "Réactiver",
                          )}
                        </button>
                        <button
                          className="small-btn"
                          type="button"
                          disabled={updating === user._id}
                          onClick={() => void deleteUser(user)}
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
        </section>
      )}
    </>
  );
}
