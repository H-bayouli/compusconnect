"use client";

import { apiFetch } from "@/services/api";
import { getNotificationMessage } from "@/components/common/notificationText";
import type { NotificationItem } from "@/types/notification";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

export default function NotificationBell() {
  const { language, translate } = useAppLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const previousUnreadCount = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await apiFetch("/api/notifications");
        if (response.status === 401) {
          if (active) {
            previousUnreadCount.current = 0;
            setUnreadCount(0);
            setError("");
          }
          return;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les notifications.",
          );
        if (active) {
          const currentUnreadCount = data.unreadCount ?? 0;
          const previousCount = previousUnreadCount.current;
          if (previousCount !== null && currentUnreadCount > previousCount) {
            const latestUnread = (
              data.notifications as NotificationItem[]
            ).find((notification) => !notification.readAt);
            if (latestUnread) {
              setToast(getNotificationMessage(latestUnread, language));
              if (toastTimer.current !== null)
                window.clearTimeout(toastTimer.current);
              toastTimer.current = window.setTimeout(() => setToast(""), 6000);
            }
          }
          previousUnreadCount.current = currentUnreadCount;
          setUnreadCount(currentUnreadCount);
          setError("");
        }
      } catch (reason) {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les notifications.",
          );
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, [language, pathname]);

  const label = error
    ? `${translate("Notifications")} — ${translate(error)}`
    : unreadCount > 0
      ? `${translate("Notifications")}, ${unreadCount} ${translate(
          unreadCount === 1 ? "notification non lue" : "notifications non lues",
        )}`
      : translate("Notifications");

  return (
    <>
      <Link
        className="btn btn-outline notification-bell"
        href="/notifications"
        aria-label={label}
        title={label}
      >
        <span aria-hidden="true">🔔</span>
        <span>{translate("Notifications")}</span>
        {unreadCount > 0 && (
          <span className="notification-count" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
      {toast && (
        <Link
          className="notification-toast"
          href="/notifications"
          role="status"
          aria-live="polite"
          onClick={() => setToast("")}
        >
          {toast}
        </Link>
      )}
    </>
  );
}
