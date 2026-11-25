"use client";

import Link from "next/link";
import StudentIllustration from "@/components/common/StudentIllustration";
import AnimatedStats from "@/components/common/AnimatedStats";
import { useAppLanguage } from "@/components/layout/AppShell";

export default function Home() {
  const { translate } = useAppLanguage();

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <i /> {translate("ENTRAIDE ÉTUDIANTE")}
          </span>
          <h1>
            {translate("Un campus où")}
            <br />
            <em>{translate("personne n’apprend seul.")}</em>
          </h1>
          <p>
            {translate(
              "Demande de l’aide, partage tes compétences et trouve un partenaire pour réviser et progresser ensemble.",
            )}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" href="/register">
              {translate("Rejoindre CampusConnect")}{" "}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="ghost-link" href="/requests">
              {translate("Explorer les demandes")}
            </Link>
          </div>
          <div className="hero-proof">
            <span className="avatar-stack" aria-hidden="true">
              <b>Y</b>
              <b>M</b>
              <b>S</b>
              <b>+</b>
            </span>
            <span>{translate("Une communauté pensée pour les étudiants")}</span>
          </div>
        </div>
        <div className="campus-scene" aria-hidden="true">
          <div className="sun" />
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="building building-a">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="building building-b">
            <span />
            <span />
            <span />
          </div>
          <div className="ground" />
          <div className="path" />
          <StudentIllustration />
          <div className="bag-card">
            <div className="bag-icon">✦</div>
            <strong>{translate("Un coup de main à donner ?")}</strong>
            <span>{translate("Une demande t’attend peut-être.")}</span>
            <div className="mini-chip">
              {translate("Programmation · Maths · Langues")}
            </div>
          </div>
        </div>
      </section>
      <section
        className="value-strip"
        id="fonctionnement"
        aria-label={translate("Comment ça marche")}
      >
        <div>
          <b>01</b>
          <span>{translate("Demander")}</span>
          <small>{translate("Explique ton besoin")}</small>
        </div>
        <div>
          <b>02</b>
          <span>{translate("Se rencontrer")}</span>
          <small>{translate("Trouve la bonne compétence")}</small>
        </div>
        <div>
          <b>03</b>
          <span>{translate("Partager")}</span>
          <small>{translate("Apprends et aide à ton tour")}</small>
        </div>
        <div className="strip-cta">
          <span>{translate("Prêt·e à commencer ?")}</span>
          <Link href="/register">{translate("Créer mon compte →")}</Link>
        </div>
      </section>
      <AnimatedStats />
      <section className="subject-section" aria-labelledby="subjects-title">
        <div>
          <div className="eyebrow">{translate("RÉVISER ENSEMBLE")}</div>
          <h2 id="subjects-title">{translate("Explore par matière")}</h2>
          <p>
            {translate(
              "Choisis un domaine pour découvrir les demandes associées.",
            )}
          </p>
        </div>
        <div className="subject-cards">
          {[
            ["⌘", "Programmation", "Coder et résoudre des problèmes"],
            ["∑", "Mathématiques", "Revoir les notions et les exercices"],
            ["文", "Langues", "Pratiquer et progresser à plusieurs"],
          ].map(([icon, subject, description]) => (
            <Link
              className="subject-card"
              href={`/requests?subject=${encodeURIComponent(subject)}`}
              key={subject}
            >
              <span className="subject-icon" aria-hidden="true">
                {icon}
              </span>
              <strong>{translate(subject)}</strong>
              <span>{translate(description)}</span>
              <span className="subject-link">
                {translate("Voir les demandes →")}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
