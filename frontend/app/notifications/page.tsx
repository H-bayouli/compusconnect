"use client";

import { apiFetch } from "@/services/api";
import { proposalStatusLabels } from "@/types/labels";
import { getNotificationMessage } from "@/components/common/notificationText";
import type { NotificationItem } from "@/types/notification";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

export default function NotificationsPage() {
  const { language, translate } = useAppLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");

  useEffect(() => {
    apiFetch("/api/notifications")
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les notifications.",
          );
        return data.notifications as NotificationItem[];
      })
      .then((data) => {
        if (data) setNotifications(data);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les notifications.",
        ),
      )
      .finally(() => setLoading(false));
  }, [router]);

  async function openNotification(notification: NotificationItem) {
    if (!notification.request?._id) {
      setError(
        "La demande associée à cette notification n’est plus disponible.",
      );
      return;
    }

    setOpeningId(notification.id);
    setError("");
    try {
      const response = await apiFetch(
        `/api/notifications/${notification.id}/read`,
        { method: "PATCH" },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Impossible d’ouvrir cette notification.",
        );
      router.push(`/requests/${notification.request._id}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible d’ouvrir cette notification.",
      );
    } finally {
      setOpeningId("");
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("TES ÉCHANGES")}</div>
          <h1 className="page-title">{translate("Notifications")}</h1>
          <p className="page-subtitle">
            {translate(
              "Suis les propositions envoyées et les réponses à tes demandes.",
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
          {translate("Chargement des notifications…")}
        </div>
      ) : notifications.length === 0 ? (
        <section className="card empty">
          <div className="empty-icon" aria-hidden="true">
            🔔
          </div>
          <h2>{translate("Aucune notification pour le moment")}</h2>
          <p>
            {translate(
              "Les nouvelles propositions et leurs réponses apparaîtront ici.",
            )}
          </p>
        </section>
      ) : (
        <section className="card">
          <div className="section-head">
            <h2>{translate("Historique des notifications")}</h2>
            <span className="pill">
              {unreadCount}{" "}
              {translate(
                unreadCount === 1
                  ? "notification non lue"
                  : "notifications non lues",
              )}
            </span>
          </div>
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`notification-item ${notification.readAt ? "" : "notification-unread"}`}
                key={notification.id}
              >
                <div className="notification-item-copy">
                  <span className="notification-dot" aria-hidden="true" />
                  <div>
                    <span>
                      {getNotificationMessage(notification, language)}
                    </span>
                    {notification.kind === "review_received" && (
                      <div className="notification-item-meta">
                        <strong>
                          {translate("Note")}: {notification.rating ?? "—"}/5
                        </strong>
                        <p>
                          {notification.comment?.trim() ||
                            translate("Aucun commentaire.")}
                        </p>
                      </div>
                    )}
                    <div className="notification-item-meta">
                      {notification.kind === "review_received"
                        ? translate("Évaluation reçue")
                        : notification.kind === "proposal_not_selected"
                          ? translate("Proposition non retenue")
                          : notification.status
                            ? translate(
                                proposalStatusLabels[notification.status],
                              )
                            : ""}
                      {" · "}
                      {new Date(notification.createdAt).toLocaleString(
                        language === "fr"
                          ? "fr-FR"
                          : language === "ar"
                            ? "ar"
                            : "en-US",
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={
                    openingId === notification.id || !notification.request?._id
                  }
                  onClick={() => openNotification(notification)}
                >
                  {openingId === notification.id
                    ? translate("Ouverture…")
                    : translate("Voir la demande")}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
