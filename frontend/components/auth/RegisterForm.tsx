"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCampusScene from "@/components/auth/AuthCampusScene";
import AvatarImagePicker from "@/components/common/AvatarImagePicker";
import { useAppLanguage } from "@/components/layout/AppShell";
import { registerUser } from "@/services/auth";
import {
  registerSchema,
  type RegisterFormValues,
  type RegisterInput,
} from "@/types/validations/auth";

export default function RegisterForm() {
  const { translate } = useAppLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [avatar, setAvatar] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      specialty: "",
      studyLevel: undefined,
      skills: "",
      avatar: "",
    },
  });

  async function submit(data: RegisterInput) {
    setLoading(true);
    setError("");
    try {
      await registerUser({ ...data, avatar });
      router.push("/login?registered=true");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Inscription impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-stage">
      <AuthCampusScene
        animationCycle={animationCycle}
        onReplay={() => setAnimationCycle((cycle) => cycle + 1)}
      />

      <section
        className={`card auth-card auth-cycle-${animationCycle % 2 === 0 ? "a" : "b"}`}
      >
        <h1>{translate("Créer mon compte")}</h1>
        <p>{translate("Rejoins la communauté d’entraide étudiante.")}</p>
        {error && (
          <div className="error" role="alert">
            {translate(error)}
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
          <AvatarImagePicker value={avatar} onChange={setAvatar} />
          <div>
            <label htmlFor="username">{translate("Nom ou pseudonyme")}</label>
            <input
              id="username"
              autoComplete="nickname"
              placeholder={translate("Ton prénom ou pseudo")}
              {...register("username")}
            />
            {errors.username && (
              <span className="help-text">
                {translate(errors.username.message ?? "")}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="email">{translate("Adresse e-mail")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="etudiant@campus.tn"
              {...register("email")}
            />
            {errors.email && (
              <span className="help-text">
                {translate(errors.email.message ?? "")}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="password">{translate("Mot de passe")}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={translate("8 caractères minimum")}
              {...register("password")}
            />
            {errors.password && (
              <span className="help-text">
                {translate(errors.password.message ?? "")}
              </span>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="specialty">{translate("Spécialité")}</label>
              <input
                id="specialty"
                placeholder={translate("Génie logiciel")}
                {...register("specialty")}
              />
              {errors.specialty && (
                <span className="help-text">
                  {translate(errors.specialty.message ?? "")}
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="studyLevel">{translate("Niveau d’études")}</label>
              <select
                id="studyLevel"
                defaultValue=""
                {...register("studyLevel")}
              >
                <option value="" disabled>
                  {translate("Choisir un niveau")}
                </option>
                <option value="Bachelor">{translate("Licence")}</option>
                <option value="Engineering">
                  {translate("Cycle ingénieur")}
                </option>
                <option value="Master">{translate("Master")}</option>
                <option value="Doctorate">{translate("Doctorat")}</option>
              </select>
              {errors.studyLevel && (
                <span className="help-text">
                  {translate(errors.studyLevel.message ?? "")}
                </span>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="skills">{translate("Compétences")}</label>
            <input
              id="skills"
              placeholder={translate("React, Python, bases de données…")}
              {...register("skills")}
            />
            <span className="help-text">
              {translate("Sépare les compétences par des virgules.")}
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? translate("Création du compte…")
              : translate("Créer mon compte →")}
          </button>
        </form>
        <div className="auth-bottom">
          {translate("Déjà inscrit·e ?")}{" "}
          <Link href="/login">{translate("Se connecter")}</Link>
        </div>
      </section>
    </div>
  );
}
