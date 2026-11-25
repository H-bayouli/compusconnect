"use client";

import Image from "next/image";
import StudentIllustration from "@/components/common/StudentIllustration";
import { useAppLanguage } from "@/components/layout/AppShell";

interface AuthCampusSceneProps {
  animationCycle: number;
  onReplay: () => void;
}

export default function AuthCampusScene({
  animationCycle,
  onReplay,
}: AuthCampusSceneProps) {
  const { translate } = useAppLanguage();

  return (
    <section
      className={`auth-visual auth-cycle-${animationCycle % 2 === 0 ? "a" : "b"}`}
      aria-label={translate("Animation du campus")}
    >
      <span className="hero-kicker">
        <i />
        CAMPUSCONNECT
      </span>
      <div className="auth-orbit" aria-hidden="true" />
      <div className="auth-campus-path" aria-hidden="true" />
      <Image
        className="auth-campus-image"
        src="/campus-study.svg"
        alt=""
        width={240}
        height={185}
        priority
      />
      <StudentIllustration className="auth-student" />
      <button
        className="auth-replay"
        type="button"
        onClick={onReplay}
        aria-label={translate("Rejouer l’animation du campus")}
      >
        ↻ {translate("Rejouer l’animation")}
      </button>
    </section>
  );
}
