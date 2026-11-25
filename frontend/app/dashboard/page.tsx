"use client";

import Image from "next/image";
import { apiFetch } from "@/services/api";
import { useAppLanguage } from "@/components/layout/AppShell";
import { requestStatusLabels, studyLevelLabels } from "@/types/labels";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RequestItem = {
  _id: string;
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  status: string;
  createdAt: string;
  createdBy: { _id: string; username: string };
};

type Student = { skills?: string[] };
type DashboardStats = {
  publishedRequests: number;
  proposalsSent: number;
  completedSessions: number;
};

export default function Dashboard() {
  const { language, translate } = useAppLanguage();
  const copy = {
    fr: {
      space: "MON ESPACE CAMPUS",
      title: "Tableau de bord",
      subtitle:
        "Retrouve tes demandes et les occasions de partager tes compétences.",
      publish: "＋ Publier une demande",
      loading: "Chargement du tableau de bord…",
      heroTitle: (
        <>
          Le savoir grandit
          <br />
          quand il est partagé.
        </>
      ),
      heroDescription:
        "Découvre les demandes, propose ton aide et progresse ensemble.",
      explore: "Explorer les demandes →",
      stats: [
        "Demandes publiées",
        "Aides proposées",
        "Séances réalisées",
        "Demandes ouvertes",
      ],
      matched: "Demandes correspondant à tes compétences",
      suggestions: "Suggestions",
      skills: "Compétences recherchées",
      requestedBy: "Demandée par",
      student: "un·e étudiant·e",
      offerHelp: "Proposer ton aide →",
      recent: "Demandes récentes",
      viewAll: "Tout afficher →",
      community: "La communauté t’attend",
      emptyDescription:
        "Publie une demande pour commencer à échanger avec d’autres étudiants.",
      details: "Voir les détails →",
    },
    en: {
      space: "MY CAMPUS SPACE",
      title: "Dashboard",
      subtitle: "Find your requests and opportunities to share your skills.",
      publish: "＋ Post a request",
      loading: "Loading dashboard…",
      heroTitle: (
        <>
          Knowledge grows
          <br />
          when it is shared.
        </>
      ),
      heroDescription: "Explore requests, offer your help, and grow together.",
      explore: "Explore requests →",
      stats: [
        "Requests published",
        "Offers made",
        "Sessions completed",
        "Open requests",
      ],
      matched: "Requests matching your skills",
      suggestions: "Suggestions",
      skills: "Skills requested",
      requestedBy: "Requested by",
      student: "a student",
      offerHelp: "Offer help →",
      recent: "Recent requests",
      viewAll: "View all →",
      community: "The community is waiting",
      emptyDescription: "Post a request to start sharing with other students.",
      details: "View details →",
    },
    ar: {
      space: "مساحة الحرم الجامعي",
      title: "لوحة التحكم",
      subtitle: "تابع طلباتك والفرص المتاحة لمشاركة مهاراتك.",
      publish: "＋ نشر طلب",
      loading: "جارٍ تحميل لوحة التحكم…",
      heroTitle: (
        <>
          المعرفة تنمو
          <br />
          عندما نتشاركها.
        </>
      ),
      heroDescription: "اكتشف الطلبات، وقدّم المساعدة، وتقدّموا معًا.",
      explore: "استكشاف الطلبات ←",
      stats: [
        "الطلبات المنشورة",
        "المساعدات المقدمة",
        "الجلسات المكتملة",
        "الطلبات المفتوحة",
      ],
      matched: "طلبات تناسب مهاراتك",
      suggestions: "اقتراحات",
      skills: "المهارات المطلوبة",
      requestedBy: "طلبه",
      student: "طالب",
      offerHelp: "قدّم المساعدة ←",
      recent: "الطلبات الأخيرة",
      viewAll: "عرض الكل ←",
      community: "المجتمع بانتظارك",
      emptyDescription: "انشر طلبًا لتبدأ التواصل مع الطلاب الآخرين.",
      details: "عرض التفاصيل ←",
    },
  }[language];
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [user, setUser] = useState<Student | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    publishedRequests: 0,
    proposalsSent: 0,
    completedSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/auth/me"),
      apiFetch("/api/requests"),
      apiFetch("/api/dashboard"),
    ])
      .then(async ([userResponse, requestResponse, statsResponse]) => {
        if (userResponse.status === 401) {
          router.push("/login");
          return;
        }
        const [userData, requestData, statsData] = await Promise.all([
          userResponse.json(),
          requestResponse.json(),
          statsResponse.json(),
        ]);
        if (!userResponse.ok || !requestResponse.ok || !statsResponse.ok) {
          throw new Error(
            userData.message ||
              requestData.message ||
              statsData.message ||
              "Impossible de charger le tableau de bord.",
          );
        }
        setUser(userData.user);
        setRequests(requestData.requests || []);
        setStats(
          statsData.stats || {
            publishedRequests: 0,
            proposalsSent: 0,
            completedSessions: 0,
          },
        );
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger le tableau de bord.",
        ),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const openRequests = requests.filter((request) => request.status === "open");
  const recommended = openRequests.filter((request) =>
    (user?.skills || []).some((skill) =>
      `${request.subject} ${request.title} ${request.description}`
        .toLocaleLowerCase("fr")
        .includes(skill.toLocaleLowerCase("fr")),
    ),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{copy.space}</div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.subtitle}</p>
        </div>
        <Link className="btn btn-primary" href="/requests/new">
          {copy.publish}
        </Link>
      </div>
      {loading ? (
        <div className="loading" role="status">
          {copy.loading}
        </div>
      ) : error ? (
        <div className="error" role="alert">
          {translate(error)}
        </div>
      ) : (
        <>
          <section className="hero">
            <div>
              <div className="eyebrow" style={{ color: "#b8e7df" }}>
                CAMPUSCONNECT
              </div>
              <h1>{copy.heroTitle}</h1>
              <p>{copy.heroDescription}</p>
              <Link href="/requests" className="btn">
                {copy.explore}
              </Link>
            </div>
            <Image
              className="hero-art"
              src="/campus-study.svg"
              alt=""
              width={250}
              height={192}
            />
          </section>
          <div className="grid stats-grid">
            {[
              [copy.stats[0], stats.publishedRequests, "＋"],
              [copy.stats[1], stats.proposalsSent, "↗"],
              [copy.stats[2], stats.completedSessions, "✓"],
              [copy.stats[3], openRequests.length, "⌕"],
            ].map(([label, count, icon]) => (
              <div className="card stat-card" key={String(label)}>
                <div className="stat-top">
                  <span>{label}</span>
                  <span className="stat-icon">{icon}</span>
                </div>
                <div className="stat-number">{count}</div>
              </div>
            ))}
          </div>
          {recommended.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 28 }}>
                <h2>{copy.matched}</h2>
                <span className="pill pill-teal">{copy.suggestions}</span>
              </div>
              <div className="grid request-grid">
                {recommended.slice(0, 2).map((request) => (
                  <article
                    className="card request-card"
                    key={`suggestion-${request._id}`}
                  >
                    <div className="request-meta">
                      <span className="pill pill-teal">{copy.skills}</span>
                      <span className="pill">{request.subject}</span>
                    </div>
                    <h3>{request.title}</h3>
                    <p>
                      {request.description.slice(0, 115)}
                      {request.description.length > 115 ? "…" : ""}
                    </p>
                    <div className="request-foot">
                      <span>
                        {copy.requestedBy}{" "}
                        {request.createdBy?.username || copy.student}
                      </span>
                      <Link
                        className="text-link"
                        href={`/requests/${request._id}`}
                      >
                        {copy.offerHelp}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="section-head">
            <h2>{copy.recent}</h2>
            <Link href="/requests" className="text-link">
              {copy.viewAll}
            </Link>
          </div>
          {requests.length === 0 ? (
            <div className="card empty">
              <div className="empty-icon" aria-hidden="true">
                ✦
              </div>
              <h3>{copy.community}</h3>
              <p>{copy.emptyDescription}</p>
              <Link href="/requests/new" className="btn btn-primary">
                {copy.publish}
              </Link>
            </div>
          ) : (
            <div className="grid request-grid">
              {requests.slice(0, 4).map((request) => (
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
                    {request.description.slice(0, 115)}
                    {request.description.length > 115 ? "…" : ""}
                  </p>
                  <div className="request-foot">
                    <span>
                      {copy.requestedBy}{" "}
                      {request.createdBy?.username || copy.student}
                    </span>
                    <Link
                      className="text-link"
                      href={`/requests/${request._id}`}
                    >
                      {copy.details}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
