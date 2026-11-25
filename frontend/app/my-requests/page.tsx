"use client";

import { apiFetch } from "@/services/api";
import RequestCard from "@/components/requests/RequestCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { RequestCardData } from "@/types/request";
import { useAppLanguage } from "@/components/layout/AppShell";

export default function MyRequests() {
  const { translate } = useAppLanguage();
  const router = useRouter();
  const [items, setItems] = useState<RequestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/api/auth/me"), apiFetch("/api/requests")])
      .then(async ([userResponse, requestsResponse]) => {
        if (userResponse.status === 401) {
          router.push("/login");
          return;
        }
        const [userData, requestsData] = await Promise.all([
          userResponse.json(),
          requestsResponse.json(),
        ]);
        if (!userResponse.ok || !requestsResponse.ok) {
          throw new Error(
            userData.message ||
              requestsData.message ||
              "Impossible de charger tes demandes.",
          );
        }
        setItems(
          (requestsData.requests || []).filter(
            (request: RequestCardData) =>
              String(request.createdBy?._id) === String(userData.user._id),
          ),
        );
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger tes demandes.",
        ),
      )
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("MON ACTIVITÉ")}</div>
          <h1 className="page-title">{translate("Mes demandes d’aide")}</h1>
          <p className="page-subtitle">
            {translate(
              "Consulte les propositions et suis l’avancement de tes demandes.",
            )}
          </p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          {translate("＋ Nouvelle demande")}
        </Link>
      </div>
      {loading ? (
        <div className="loading" role="status">
          {translate("Chargement de tes demandes…")}
        </div>
      ) : error ? (
        <div className="error" role="alert">
          {translate(error)}
        </div>
      ) : items.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">
            ▤
          </div>
          <h3>{translate("Aucune demande pour le moment")}</h3>
          <p>{translate("Tes demandes publiées apparaîtront ici.")}</p>
          <Link className="btn btn-primary" href="/requests/new">
            {translate("Publier ma première demande")}
          </Link>
        </div>
      ) : (
        <div className="grid request-grid">
          {items.map((item) => (
            <RequestCard item={item} actionLabel="Gérer →" key={item._id} />
          ))}
        </div>
      )}
    </>
  );
}
