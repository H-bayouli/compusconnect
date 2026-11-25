"use client";

import { apiFetch } from "@/services/api";
import { useAppLanguage } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";

interface PublicStats {
  requests: number;
  completedSessions: number;
}

export default function AnimatedStats() {
  const { language, translate } = useAppLanguage();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [counts, setCounts] = useState<PublicStats>({
    requests: 0,
    completedSessions: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/api/stats")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les statistiques.",
          );
        if (active) setStats(data.stats as PublicStats);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger les statistiques.",
          );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stats) return;
    const targetStats = stats;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const startedAt = performance.now();
    const duration = reducedMotion ? 1 : 900;
    let frameId = 0;

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCounts({
        requests: Math.round(targetStats.requests * eased),
        completedSessions: Math.round(targetStats.completedSessions * eased),
      });
      if (progress < 1) frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [stats]);

  return (
    <section
      className="landing-stats"
      aria-label={translate("CampusConnect en chiffres")}
    >
      <div>
        <strong>
          {stats
            ? counts.requests.toLocaleString(
                language === "fr"
                  ? "fr-FR"
                  : language === "ar"
                    ? "ar"
                    : "en-US",
              )
            : "—"}
        </strong>
        <span>{translate("Demandes publiées")}</span>
      </div>
      <div>
        <strong>
          {stats
            ? counts.completedSessions.toLocaleString(
                language === "fr"
                  ? "fr-FR"
                  : language === "ar"
                    ? "ar"
                    : "en-US",
              )
            : "—"}
        </strong>
        <span>{translate("Séances terminées")}</span>
      </div>
      {error && <p className="landing-stats-error">{translate(error)}</p>}
    </section>
  );
}
