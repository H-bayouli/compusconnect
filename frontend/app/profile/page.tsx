"use client";

import Image from "next/image";
import { apiFetch } from "@/services/api";
import AvatarImagePicker from "@/components/common/AvatarImagePicker";
import { roleLabels, studyLevelLabels } from "@/types/labels";
import {
  updateProfileSchema,
  type ProfileFormInput,
} from "@/types/validations/profile";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAppLanguage } from "@/components/layout/AppShell";

type ProfileData = {
  username: string;
  email: string;
  role: "student" | "admin";
  specialty: string;
  studyLevel: string;
  skills: string[];
  avatar?: string;
};

const initialForm: ProfileFormInput = {
  username: "",
  specialty: "",
  studyLevel: "",
  skills: "",
  avatar: "",
};

export default function Profile() {
  const { translate } = useAppLanguage();
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileFormInput>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/api/auth/me?includeAvatar=true")
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger le profil.");
        }
        return data.user as ProfileData;
      })
      .then((profile) => {
        if (!active || !profile) return;
        setUser(profile);
        setForm({
          username: profile.username,
          specialty: profile.specialty,
          studyLevel: profile.studyLevel,
          skills: profile.skills.join(", "),
          avatar: profile.avatar || "",
        });
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Impossible de charger le profil.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  function cancelEdit() {
    if (!user) return;
    setForm({
      username: user.username,
      specialty: user.specialty,
      studyLevel: user.studyLevel,
      skills: user.skills.join(", "),
      avatar: user.avatar || "",
    });
    setEditing(false);
    setError("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const parsed = updateProfileSchema.safeParse(form);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message || "Vérifie les champs du profil.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de mettre à jour le profil.",
        );
      }

      const updatedProfile = data.user as ProfileData;
      setUser(updatedProfile);
      window.dispatchEvent(
        new CustomEvent("campusconnect:avatar-updated", {
          detail: { avatar: updatedProfile.avatar || "" },
        }),
      );
      setForm({
        username: updatedProfile.username,
        specialty: updatedProfile.specialty,
        studyLevel: updatedProfile.studyLevel,
        skills: updatedProfile.skills.join(", "),
        avatar: updatedProfile.avatar || "",
      });
      setEditing(false);
      setSuccess("Profil mis à jour.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de mettre à jour le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status">
        {translate("Chargement…")}
      </div>
    );
  }
  if (error && !user) {
    return (
      <div className="error" role="alert">
        {translate(error)}
      </div>
    );
  }
  if (!user)
    return <div className="empty">{translate("Profil indisponible.")}</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{translate("MON IDENTITÉ ÉTUDIANTE")}</div>
          <h1 className="page-title">{translate("Mon profil")}</h1>
          <p className="page-subtitle">
            {translate(
              "Présente ta spécialité, ton niveau et tes compétences à la communauté.",
            )}
          </p>
        </div>
        {!editing && (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setEditing(true);
              setSuccess("");
            }}
          >
            {translate("Modifier le profil")}
          </button>
        )}
      </div>

      <section className="card profile-card">
        <div className="profile-head">
          <div className="profile-avatar">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={`${translate("Photo de profil")} — ${user.username}`}
                width={66}
                height={66}
                unoptimized
              />
            ) : (
              <span aria-hidden="true">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="profile-name">{user.username}</h2>
            <p className="page-subtitle">{user.email}</p>
            <span className="pill pill-teal">
              {translate(roleLabels[user.role])}
            </span>
          </div>
          <Image
            className="profile-illustration"
            src="/campus-study.svg"
            alt=""
            width={156}
            height={120}
          />
        </div>

        {error && (
          <div className="error" role="alert">
            {translate(error)}
          </div>
        )}
        {success && (
          <div className="success" role="status">
            {translate(success)}
          </div>
        )}

        {editing ? (
          <form className="profile-form" onSubmit={saveProfile} noValidate>
            <div className="form-grid">
              <div className="form-group full">
                <AvatarImagePicker
                  value={form.avatar}
                  onChange={(avatar) => setForm({ ...form, avatar })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">
                  {translate("Nom ou pseudonyme")}
                </label>
                <input
                  className="field"
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="specialty">{translate("Spécialité")}</label>
                <input
                  className="field"
                  id="specialty"
                  value={form.specialty}
                  onChange={(event) =>
                    setForm({ ...form, specialty: event.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="studyLevel">
                  {translate("Niveau d’études")}
                </label>
                <select
                  className="field"
                  id="studyLevel"
                  value={form.studyLevel}
                  onChange={(event) =>
                    setForm({ ...form, studyLevel: event.target.value })
                  }
                >
                  <option value="">{translate("Choisir un niveau")}</option>
                  <option value="Bachelor">{translate("Licence")}</option>
                  <option value="Engineering">
                    {translate("Cycle ingénieur")}
                  </option>
                  <option value="Master">{translate("Master")}</option>
                  <option value="Doctorate">{translate("Doctorat")}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="skills">{translate("Compétences")}</label>
                <input
                  className="field"
                  id="skills"
                  value={form.skills}
                  placeholder={translate("React, Python, bases de données…")}
                  onChange={(event) =>
                    setForm({ ...form, skills: event.target.value })
                  }
                />
                <span className="help-text">
                  {translate("Sépare les compétences par des virgules.")}
                </span>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn btn-outline"
                type="button"
                onClick={cancelEdit}
                disabled={saving}
              >
                {translate("Annuler")}
              </button>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? translate("Enregistrement…")
                  : translate("Enregistrer")}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid two-col profile-details">
              <div>
                <div className="eyebrow">{translate("SPÉCIALITÉ")}</div>
                <h3>{user.specialty || translate("Non renseignée")}</h3>
              </div>
              <div>
                <div className="eyebrow">{translate("NIVEAU D’ÉTUDES")}</div>
                <h3>
                  {translate(
                    studyLevelLabels[user.studyLevel] ||
                      user.studyLevel ||
                      "Non renseigné",
                  )}
                </h3>
              </div>
            </div>
            <div className="profile-skills">
              <div className="eyebrow">{translate("COMPÉTENCES")}</div>
              <div className="skill-list">
                {user.skills.length ? (
                  user.skills.map((skill) => (
                    <span className="skill" key={skill}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="page-subtitle">
                    {translate("Aucune compétence ajoutée.")}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
