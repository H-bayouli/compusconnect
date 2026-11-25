"use client";

import { apiFetch } from "@/services/api";
import { requestStatusLabels, studyLevelLabels } from "@/types/labels";
import { createProposalSchema } from "@/types/validations/proposal";
import { createRequestSchema } from "@/types/validations/request";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { HelpProposal, ProposalDecision } from "@/types/proposal";
import type { StudentSummary } from "@/types/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

type Student = StudentSummary & {
  role?: "student" | "admin";
};

type RequestItem = {
  _id: string;
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  availability: string;
  status: string;
  createdAt: string;
  createdBy: Student;
  acceptedHelper: Student | null;
  reviewedByMe: boolean;
};

type RequestForm = Pick<
  RequestItem,
  "title" | "description" | "subject" | "studyLevel" | "availability"
>;

export default function RequestDetail() {
  const { language, translate } = useAppLanguage();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<RequestItem | null>(null);
  const [proposals, setProposals] = useState<HelpProposal[]>([]);
  const [user, setUser] = useState<Student | null>(null);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<RequestForm | null>(null);

  async function load() {
    const [requestResponse, userResponse] = await Promise.all([
      apiFetch(`/api/requests/${id}`),
      apiFetch("/api/auth/me"),
    ]);
    if (userResponse.status === 401) {
      router.push("/login");
      return;
    }
    const [requestData, userData] = await Promise.all([
      requestResponse.json(),
      userResponse.json(),
    ]);
    if (!requestResponse.ok || !userResponse.ok) {
      throw new Error(
        requestData.message ||
          userData.message ||
          "Impossible de charger cette demande.",
      );
    }

    const request: RequestItem = {
      ...requestData.request,
      acceptedHelper: requestData.acceptedHelper,
      reviewedByMe: requestData.reviewedByMe,
    };
    setItem(request);
    setEditForm({
      title: request.title,
      description: request.description,
      subject: request.subject,
      studyLevel: request.studyLevel,
      availability: request.availability,
    });
    setUser(userData.user);

    if (String(request.createdBy?._id) === String(userData.user?._id)) {
      const proposalsResponse = await apiFetch(`/api/proposals/request/${id}`);
      const proposalsData = await proposalsResponse.json();
      if (!proposalsResponse.ok) {
        throw new Error(
          proposalsData.message || "Impossible de charger les propositions.",
        );
      }
      setProposals(proposalsData.proposals || []);
    } else {
      setProposals([]);
    }
  }

  useEffect(() => {
    apiFetch(`/api/requests/${id}`)
      .then(async (requestResponse) => {
        if (requestResponse.status === 401) {
          router.push("/login");
          return null;
        }
        const [requestData, userResponse] = await Promise.all([
          requestResponse.json(),
          apiFetch("/api/auth/me"),
        ]);
        if (userResponse.status === 401) {
          router.push("/login");
          return null;
        }
        const userData = await userResponse.json();
        if (!requestResponse.ok || !userResponse.ok) {
          throw new Error(
            requestData.message ||
              userData.message ||
              "Impossible de charger cette demande.",
          );
        }
        const request: RequestItem = {
          ...requestData.request,
          acceptedHelper: requestData.acceptedHelper,
          reviewedByMe: requestData.reviewedByMe,
        };
        if (String(request.createdBy?._id) === String(userData.user?._id)) {
          const proposalsResponse = await apiFetch(
            `/api/proposals/request/${id}`,
          );
          const proposalsData = await proposalsResponse.json();
          if (!proposalsResponse.ok)
            throw new Error(
              proposalsData.message ||
                "Impossible de charger les propositions.",
            );
          setProposals(proposalsData.proposals || []);
        }
        setItem(request);
        setEditForm({
          title: request.title,
          description: request.description,
          subject: request.subject,
          studyLevel: request.studyLevel,
          availability: request.availability,
        });
        setUser(userData.user);
        return null;
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de charger cette demande.",
        ),
      );
  }, [id, router]);

  async function action(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<boolean> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(url, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "L’action n’a pas pu être effectuée.");
      setNotice(data.message || "Action effectuée.");
      await load();
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Une erreur est survenue.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm) return;
    const validation = createRequestSchema.safeParse(editForm);
    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ||
          "Vérifie les informations saisies.",
      );
      return;
    }
    if (await action(`/api/requests/${id}`, "PATCH", validation.data))
      setEditing(false);
  }

  function sendProposal() {
    const validation = createProposalSchema.safeParse({ message });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Vérifie ton message.");
      return;
    }
    void action(`/api/proposals/request/${id}`, "POST", validation.data);
  }

  if (!item) {
    return error ? (
      <div className="error" role="alert">
        {translate(error)}
      </div>
    ) : (
      <div className="loading" role="status">
        {translate("Chargement de la demande…")}
      </div>
    );
  }

  const isOwner = String(item.createdBy?._id) === String(user?._id);
  const isHelper = String(item.acceptedHelper?._id) === String(user?._id);
  const isParticipant = isOwner || isHelper;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("DÉTAILS DE LA DEMANDE")}</div>
          <h1 className="page-title">{translate("Demande d’aide")}</h1>
          <p className="page-subtitle">
            {translate(
              "Découvre le besoin et échange avec l’étudiant·e qui l’a publié.",
            )}
          </p>
        </div>
        <Link href="/requests" className="btn btn-outline">
          {translate("← Explorer les demandes")}
        </Link>
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

      <div className="detail-layout">
        <div className="card">
          <div className="request-meta">
            <span className="pill pill-teal">{item.subject}</span>
            <span className="pill">
              {translate(studyLevelLabels[item.studyLevel] || item.studyLevel)}
            </span>
            <span
              className={`pill ${item.status === "open" ? "pill-gold" : "pill-teal"}`}
            >
              {translate(requestStatusLabels[item.status] || item.status)}
            </span>
          </div>
          <h2 className="detail-title">{item.title}</h2>
          <p
            style={{
              lineHeight: 1.8,
              color: "#607485",
              whiteSpace: "pre-wrap",
            }}
          >
            {item.description}
          </p>
          <div className="divider" />
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", marginTop: 20 }}
          >
            <div>
              <div className="eyebrow">{translate("PUBLIÉE PAR")}</div>
              <b>{item.createdBy?.username}</b>
              <p className="help-text">
                {item.createdBy?.specialty} ·{" "}
                {translate(
                  studyLevelLabels[item.createdBy?.studyLevel || ""] ||
                    item.createdBy?.studyLevel ||
                    "",
                )}
              </p>
            </div>
            <div>
              <div className="eyebrow">{translate("DISPONIBILITÉS")}</div>
              <b>{item.availability}</b>
              <p className="help-text">
                {translate("Publiée le")}{" "}
                {new Date(item.createdAt).toLocaleDateString(
                  language === "fr"
                    ? "fr-FR"
                    : language === "ar"
                      ? "ar"
                      : "en-US",
                )}
              </p>
            </div>
          </div>

          {isOwner ? (
            <>
              {item.status === "open" && (
                <div style={{ marginTop: 18 }}>
                  <button
                    className="small-btn"
                    type="button"
                    onClick={() => setEditing(!editing)}
                  >
                    {editing
                      ? translate("Annuler la modification")
                      : translate("✎ Modifier la demande")}
                  </button>
                  {editing && editForm && (
                    <form
                      className="card form-illustrated"
                      style={{ marginTop: 12 }}
                      onSubmit={saveEdit}
                    >
                      <div className="form-grid">
                        <div className="form-group full">
                          <label htmlFor="edit-title">
                            {translate("Titre")}
                          </label>
                          <input
                            className="field"
                            id="edit-title"
                            required
                            minLength={5}
                            maxLength={100}
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                title: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group full">
                          <label htmlFor="edit-description">
                            {translate("Description")}
                          </label>
                          <textarea
                            className="field"
                            id="edit-description"
                            rows={4}
                            required
                            minLength={20}
                            maxLength={2000}
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                description: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="edit-subject">
                            {translate("Matière")}
                          </label>
                          <input
                            className="field"
                            id="edit-subject"
                            required
                            maxLength={80}
                            value={editForm.subject}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                subject: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="edit-level">
                            {translate("Niveau d’études")}
                          </label>
                          <select
                            className="field"
                            id="edit-level"
                            value={editForm.studyLevel}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                studyLevel: event.target.value,
                              })
                            }
                          >
                            <option value="Bachelor">
                              {translate("Licence")}
                            </option>
                            <option value="Engineering">
                              {translate("Cycle ingénieur")}
                            </option>
                            <option value="Master">
                              {translate("Master")}
                            </option>
                            <option value="Doctorate">
                              {translate("Doctorat")}
                            </option>
                          </select>
                        </div>
                        <div className="form-group full">
                          <label htmlFor="edit-availability">
                            {translate("Disponibilités")}
                          </label>
                          <input
                            className="field"
                            id="edit-availability"
                            required
                            maxLength={120}
                            value={editForm.availability}
                            onChange={(event) =>
                              setEditForm({
                                ...editForm,
                                availability: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={busy}
                        >
                          {translate("Enregistrer les modifications")}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              <section
                style={{
                  borderTop: "1px solid var(--line)",
                  marginTop: 20,
                  paddingTop: 20,
                }}
              >
                <div className="section-head">
                  <h2>
                    {translate("Propositions d’aide")} ({proposals.length})
                  </h2>
                </div>
                {proposals.length === 0 ? (
                  <p className="page-subtitle">
                    {translate("Aucun étudiant n’a encore proposé son aide.")}
                  </p>
                ) : (
                  proposals.map((proposal) => (
                    <ProposalCard
                      key={proposal._id}
                      proposal={proposal}
                      canDecide={item.status === "open"}
                      busy={busy}
                      onDecision={(decision: ProposalDecision) =>
                        void action(`/api/proposals/${proposal._id}`, "PATCH", {
                          status: decision,
                        })
                      }
                    />
                  ))
                )}
              </section>
              {item.status === "open" && (
                <div style={{ marginTop: 18 }}>
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          translate("Supprimer cette demande d’aide ?"),
                        )
                      )
                        void action(`/api/requests/${id}`, "DELETE");
                    }}
                  >
                    {translate("Supprimer la demande")}
                  </button>
                </div>
              )}
            </>
          ) : item.status === "open" && user?.role === "student" ? (
            <section
              style={{
                borderTop: "1px solid var(--line)",
                paddingTop: 20,
                marginTop: 20,
              }}
            >
              <h3>{translate("Proposer ton aide")}</h3>
              <p className="page-subtitle" style={{ marginBottom: 12 }}>
                {translate(
                  "Explique comment tu peux accompagner cet·te étudiant·e.",
                )}
              </p>
              <label className="help-text" htmlFor="proposal-message">
                {translate("Ton message (10 à 1 000 caractères)")}
              </label>
              <textarea
                id="proposal-message"
                className="field"
                rows={4}
                minLength={10}
                maxLength={1000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={translate(
                  "Je peux t’aider sur ce sujet, notamment…",
                )}
              />
              <p className="help-text" aria-live="polite">
                {message.trim().length} /{" "}
                {language === "en" ? "1,000" : "1 000"}{" "}
                {translate("caractères · 10 minimum")}
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                disabled={busy || message.trim().length < 10}
                onClick={sendProposal}
              >
                {translate("Envoyer ma proposition →")}
              </button>
            </section>
          ) : item.status === "open" ? (
            <div className="notice" style={{ marginTop: 20 }}>
              {translate(
                "L’envoi de propositions est réservé aux comptes étudiants.",
              )}
              <div style={{ marginTop: 12 }}>
                <Link className="btn btn-primary" href="/register">
                  {translate("Créer un compte étudiant")}
                </Link>
              </div>
            </div>
          ) : item.status === "accepted" && isParticipant ? (
            <div className="notice" style={{ marginTop: 20 }}>
              {translate(
                "Un étudiant a été choisi. Organisez votre séance, puis clôturez la demande une fois l’aide apportée.",
              )}
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    action(`/api/requests/${id}/complete`, "PATCH")
                  }
                >
                  {translate("Marquer la séance comme terminée")}
                </button>
              </div>
            </div>
          ) : (
            <div className="notice" style={{ marginTop: 20 }}>
              {translate("Cette demande n’accepte plus de propositions.")}
            </div>
          )}
        </div>

        <div className="grid">
          <section className="card">
            <div className="eyebrow">{translate("SUIVI DE LA DEMANDE")}</div>
            <h3 style={{ margin: "10px 0 18px" }}>{translate("Étapes")}</h3>
            {[
              ["01", "Ouverte", "La demande est publiée"],
              ["02", "Aide acceptée", "Un étudiant a été choisi"],
              ["03", "Terminée", "La séance est clôturée"],
            ].map(([number, title, description], index) => (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 17,
                  opacity:
                    (item.status === "open" && index > 0) ||
                    (item.status === "accepted" && index > 1)
                      ? 0.45
                      : 1,
                }}
                key={number}
              >
                <span className="stat-icon">{number}</span>
                <div>
                  <b>{translate(title)}</b>
                  <div className="help-text">{translate(description)}</div>
                </div>
              </div>
            ))}
          </section>
          <section className="card">
            <div className="eyebrow">{translate("RESPECT ET CONFIANCE")}</div>
            <h3>{translate("Échangeons avec bienveillance")}</h3>
            <p className="page-subtitle">
              {translate(
                "Respecte le temps de chacun et garde les échanges centrés sur l’apprentissage.",
              )}
            </p>
            <button
              className="small-btn"
              onClick={() => {
                const reason = window.prompt(
                  translate("Pourquoi souhaites-tu signaler cette demande ?"),
                );
                if (reason?.trim())
                  void action("/api/reports", "POST", {
                    requestId: id,
                    reason,
                  });
              }}
            >
              {translate("⚑ Signaler cette publication")}
            </button>
          </section>
          {item.status === "completed" && isParticipant && (
            <section className="card">
              <h3>{translate("Évaluer la séance")}</h3>
              {item.reviewedByMe ? (
                <div className="success" role="status">
                  {translate(
                    "Tu as déjà évalué cette séance. Merci pour ton retour !",
                  )}
                </div>
              ) : (
                <>
                  <p className="page-subtitle">
                    {translate(
                      "Seuls les participants peuvent évaluer une séance terminée.",
                    )}
                  </p>
                  <label className="help-text" htmlFor="rating">
                    {translate("Ta note")}
                  </label>
                  <select
                    id="rating"
                    className="field"
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option value={value} key={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                  <label
                    className="help-text"
                    htmlFor="review-comment"
                    style={{ display: "block", marginTop: 10 }}
                  >
                    {translate("Ton commentaire (facultatif)")}
                  </label>
                  <textarea
                    id="review-comment"
                    className="field"
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={translate("Partage ton expérience…")}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 10 }}
                    disabled={busy}
                    onClick={() =>
                      action("/api/reviews", "POST", {
                        requestId: id,
                        rating: Number(rating),
                        comment,
                      })
                    }
                  >
                    {translate("Envoyer mon évaluation")}
                  </button>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
