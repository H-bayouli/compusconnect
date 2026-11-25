"use client";

import { apiFetch } from "@/services/api";
import { createRequestSchema } from "@/types/validations/request";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppLanguage } from "@/components/layout/AppShell";

type RequestForm = {
  title: string;
  description: string;
  subject: string;
  studyLevel: string;
  availability: string;
};

export default function NewRequest() {
  const { translate } = useAppLanguage();
  const router = useRouter();
  const [form, setForm] = useState<RequestForm>({
    title: "",
    description: "",
    subject: "",
    studyLevel: "Engineering",
    availability: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validation = createRequestSchema.safeParse(form);
    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ||
          translate("Vérifie les informations saisies."),
      );
      return;
    }

    setBusy(true);
    try {
      const response = await apiFetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Impossible de publier la demande.");
      router.push(`/requests/${data.request._id}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Une erreur est survenue pendant la publication.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("Demander à la communauté")}</div>
          <h1 className="page-title">
            {translate("Publier une demande d’aide")}
          </h1>
          <p className="page-subtitle">
            {translate(
              "Décris ton besoin pour permettre aux autres étudiants de te répondre.",
            )}
          </p>
        </div>
        <Link href="/requests" className="btn btn-outline">
          {translate("← Retour aux demandes")}
        </Link>
      </div>
      <div className="card form-card">
        <form className="form-illustrated" onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="form-group full">
              <label htmlFor="title">
                {translate("Titre de la demande *")}
              </label>
              <input
                className="field"
                id="title"
                name="title"
                value={form.title}
                onChange={change}
                maxLength={100}
                required
                placeholder={translate("Ex. Comprendre les hooks de React")}
              />
              <span className="help-text">
                {translate("Entre 5 et 100 caractères.")}
              </span>
            </div>
            <div className="form-group full">
              <label htmlFor="description">{translate("Description")} *</label>
              <textarea
                className="field"
                id="description"
                name="description"
                value={form.description}
                onChange={change}
                rows={5}
                maxLength={2000}
                required
                placeholder={translate(
                  "Explique ce que tu as déjà essayé et ce qui te pose difficulté.",
                )}
              />
              <span className="help-text">
                {translate("Entre 20 et 2 000 caractères.")}
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="subject">{translate("Matière ou cours *")}</label>
              <input
                className="field"
                id="subject"
                name="subject"
                value={form.subject}
                onChange={change}
                maxLength={80}
                required
                placeholder={translate("Ex. Développement web")}
              />
            </div>
            <div className="form-group">
              <label htmlFor="studyLevel">
                {translate("Niveau d’études")} *
              </label>
              <select
                className="field"
                id="studyLevel"
                name="studyLevel"
                value={form.studyLevel}
                onChange={change}
              >
                <option value="Bachelor">{translate("Licence")}</option>
                <option value="Engineering">
                  {translate("Cycle ingénieur")}
                </option>
                <option value="Master">{translate("Master")}</option>
                <option value="Doctorate">{translate("Doctorat")}</option>
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="availability">
                {translate("Disponibilités *")}
              </label>
              <input
                className="field"
                id="availability"
                name="availability"
                value={form.availability}
                onChange={change}
                maxLength={120}
                required
                placeholder={translate(
                  "Ex. En semaine après 16 h ou samedi matin",
                )}
              />
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {translate(error)}
            </div>
          )}
          <div className="form-actions">
            <Link className="btn btn-outline" href="/requests">
              {translate("Annuler")}
            </Link>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy
                ? translate("Publication…")
                : translate("Publier la demande →")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
