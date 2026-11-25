import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusConnect — Entraide étudiante",
  description: "Plateforme d’entraide et de partage entre étudiants.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="campusconnect-preferences" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("campusconnect-theme");var l=localStorage.getItem("campusconnect-language");var lang=l==="en"||l==="ar"?l:"fr";document.documentElement.dataset.theme=t==="dark"?"dark":"light";document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr"}catch(e){}})();`}
        </Script>
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
