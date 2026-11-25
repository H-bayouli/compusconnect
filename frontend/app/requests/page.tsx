"use client";

import { apiFetch } from "@/services/api";
import { requestStatusLabels, studyLevelLabels } from "@/types/labels";
import RequestCard from "@/components/requests/RequestCard";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RequestCardData } from "@/types/request";
import { useAppLanguage } from "@/components/layout/AppShell";

function RequestsContent() {
  const { language, translate } = useAppLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<RequestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("open");

  useEffect(() => {
    apiFetch("/api/requests")
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Impossible de charger les demandes.",
          );
        setItems(data.requests || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger les demandes.",
        ),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const subjects = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.subject))).sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [items],
  );
  const filtered = items.filter(
    (item) =>
      (!search ||
        `${item.title} ${item.description} ${item.subject}`
          .toLocaleLowerCase(language)
          .includes(search.toLocaleLowerCase(language))) &&
      (!subject || item.subject === subject) &&
      (!level || item.studyLevel === level) &&
      (!status || item.status === status),
  );

  function resetFilters() {
    setSearch("");
    setSubject("");
    setLevel("");
    setStatus("");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("ENTRAIDE ÉTUDIANTE")}</div>
          <h1 className="page-title">
            {translate("Explorer les demandes d’aide")}
          </h1>
          <p className="page-subtitle">
            {translate(
              "Trouve une matière à réviser ou une compétence à partager.",
            )}
          </p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          {translate("＋ Publier une demande")}
        </Link>
      </div>
      <section
        className="card"
        aria-label={translate("Recherche et filtres des demandes")}
      >
        <div className="filters">
          <input
            className="field"
            style={{ flex: 1, minWidth: 210 }}
            aria-label={translate("Rechercher une demande")}
            placeholder={translate("Rechercher par mot-clé…")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="field"
            aria-label={translate("Filtrer par matière")}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value="">{translate("Toutes les matières")}</option>
            {subjects.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            className="field"
            aria-label={translate("Filtrer par niveau")}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            <option value="">{translate("Tous les niveaux")}</option>
            {Object.entries(studyLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {translate(label)}
              </option>
            ))}
          </select>
          <select
            className="field"
            aria-label={translate("Filtrer par statut")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">{translate("Tous les statuts")}</option>
            {Object.entries(requestStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {translate(label)}
              </option>
            ))}
          </select>
        </div>
        <div className="section-head">
          <h2>
            {filtered.length}{" "}
            {translate(
              filtered.length === 1 ? "demande trouvée" : "demandes trouvées",
            )}
          </h2>
          <button className="small-btn" type="button" onClick={resetFilters}>
            {translate("Réinitialiser les filtres")}
          </button>
        </div>
        {loading ? (
          <div className="loading" role="status">
            {translate("Chargement des demandes…")}
          </div>
        ) : error ? (
          <div className="error" role="alert">
            {translate(error)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden="true">
              ⌕
            </div>
            <h3>{translate("Aucune demande correspondante")}</h3>
            <p>
              {translate(
                "Essaie d’autres filtres ou publie une nouvelle demande d’aide.",
              )}
            </p>
          </div>
        ) : (
          <div className="grid request-grid">
            {filtered.map((item) => (
              <RequestCard item={item} key={item._id} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function RequestsPage() {
  const { translate } = useAppLanguage();

  return (
    <Suspense
      fallback={
        <div className="loading" role="status">
          {translate("Chargement des demandes…")}
        </div>
      }
    >
      <RequestsContent />
    </Suspense>
  );
}
