"use client";

import { useEffect, useState } from "react";
import { getNotificationMessage } from "@/components/common/notificationText";
import { useAppLanguage } from "@/components/layout/AppShell";
import { apiFetch } from "@/services/api";
import type { NotificationItem } from "@/types/notification";

interface AdminNotification extends NotificationItem {
  recipient: { username: string };
}

export default function AdminNotificationsPage() {
  const { language, translate } = useAppLanguage();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/notifications")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les notifications.",
          );
        setNotifications(data.notifications || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les notifications.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("ESPACE ADMINISTRATEUR")}</div>
          <h1 className="page-title">{translate("Notifications")}</h1>
          <p className="page-subtitle">
            {translate(
              "Consulte les notifications générées par les propositions et les évaluations des étudiants.",
            )}
          </p>
        </div>
      </div>
      <div className="notice" role="note">
        {translate(
          "Consultation uniquement : les notifications reflètent les propositions et les évaluations.",
        )}
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
          <h2>{translate("Aucune notification pour le moment")}</h2>
        </section>
      ) : (
        <section className="card">
          <div className="section-head">
            <h2>{translate("Notifications récentes")}</h2>
            <span className="pill">{notifications.length}</span>
          </div>
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className="notification-item"
                key={`${notification.id}-${notification.kind}`}
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
                      {translate("Destinataire")}:{" "}
                      {notification.recipient.username} ·{" "}
                      {translate(notification.readAt ? "Lue" : "Non lue")} ·{" "}
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
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
