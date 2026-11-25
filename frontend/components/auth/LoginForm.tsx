"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthCampusScene from "@/components/auth/AuthCampusScene";
import { useAppLanguage } from "@/components/layout/AppShell";
import { loginUser } from "@/services/auth";
import { loginSchema, type LoginInput } from "@/types/validations/auth";

export default function LoginForm({ registered }: { registered: boolean }) {
  const { translate } = useAppLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    registered ? "Ton compte est créé. Tu peux maintenant te connecter." : "",
  );
  const [loading, setLoading] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(credentials: LoginInput) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const user = await loginUser(credentials);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "E-mail ou mot de passe incorrect.",
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
        <h1>{translate("Connexion à CampusConnect")}</h1>
        <p>{translate("Connecte-toi à ton espace étudiant.")}</p>
        {notice && (
          <div className="success" role="status">
            {translate(notice)}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {translate(error)}
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
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
              autoComplete="current-password"
              placeholder={translate("Saisis ton mot de passe")}
              {...register("password")}
            />
            {errors.password && (
              <span className="help-text">
                {translate(errors.password.message ?? "")}
              </span>
            )}
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? translate("Connexion…") : translate("Se connecter →")}
          </button>
        </form>
        <div className="auth-bottom">
          {translate("Pas encore de compte ?")}{" "}
          <Link href="/register">{translate("Créer mon compte")}</Link>
        </div>
      </section>
    </div>
  );
}
