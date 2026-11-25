"use client";

import { requestStatusLabels, studyLevelLabels } from "@/types/labels";
import type { RequestCardData } from "@/types/request";
import Link from "next/link";
import { useAppLanguage } from "@/components/layout/AppShell";

interface RequestCardProps {
  item: RequestCardData;
  actionLabel?: string;
}

export default function RequestCard({
  item,
  actionLabel = "Voir la demande →",
}: RequestCardProps) {
  const { language, translate } = useAppLanguage();
  const statusClass =
    item.status === "open"
      ? "pill-gold"
      : item.status === "completed"
        ? ""
        : "pill-teal";

  return (
    <article className="card request-card">
      <div className="request-meta">
        <span className="pill pill-teal">{item.subject}</span>
        <span className="pill">
          {translate(studyLevelLabels[item.studyLevel] || item.studyLevel)}
        </span>
        <span className={`pill ${statusClass}`}>
          {translate(requestStatusLabels[item.status] || item.status)}
        </span>
      </div>
      <h3>{item.title}</h3>
      <p>
        {item.description.slice(0, 145)}
        {item.description.length > 145 ? "…" : ""}
      </p>
      <div className="request-foot">
        <span>
          {item.createdBy?.username
            ? `◉ ${item.createdBy.username} · `
            : `${translate("Publiée le")} `}
          {new Date(item.createdAt).toLocaleDateString(
            language === "fr" ? "fr-FR" : language === "ar" ? "ar" : "en-US",
          )}
        </span>
        <Link href={`/requests/${item._id}`} className="text-link">
          {translate(actionLabel)}
        </Link>
      </div>
    </article>
  );
}
