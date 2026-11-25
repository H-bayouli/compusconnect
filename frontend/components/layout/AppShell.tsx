"use client";

import { apiFetch } from "@/services/api";
import NotificationBell from "@/components/common/NotificationBell";
import type { SessionUser } from "@/types/auth";
import {
  translate as translateMessage,
  type Language,
} from "@/services/translations";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const links = [
  ["/dashboard", "dashboard", "⌂"],
  ["/requests", "requests", "⌕"],
  ["/my-requests", "myRequests", "▤"],
  ["/requests/new", "newRequest", "＋"],
] as const;

const adminLinks = [
  ["/admin", "adminReports", "⚑"],
  ["/admin/requests", "adminRequests", "▤"],
  ["/admin/users", "adminUsers", "◉"],
  ["/admin/notifications", "adminNotifications", "🔔"],
] as const;

const preferencesChangedEvent = "campusconnect:preferences-changed";

type Theme = "light" | "dark";

function getSavedLanguage(): Language {
  const savedLanguage = window.localStorage.getItem("campusconnect-language");
  return savedLanguage === "en" || savedLanguage === "ar"
    ? savedLanguage
    : "fr";
}

function getSavedTheme(): Theme {
  return window.localStorage.getItem("campusconnect-theme") === "dark"
    ? "dark"
    : "light";
}

function getServerLanguage(): Language {
  return "fr";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeToPreferences(onChange: () => void) {
  function syncPreferences() {
    const language = getSavedLanguage();
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = getSavedTheme();
    onChange();
  }

  window.addEventListener("storage", syncPreferences);
  window.addEventListener(preferencesChangedEvent, syncPreferences);
  return () => {
    window.removeEventListener("storage", syncPreferences);
    window.removeEventListener(preferencesChangedEvent, syncPreferences);
  };
}

const translations = {
  fr: {
    slogan: "Apprendre. Partager. Avancer.",
    dashboard: "Tableau de bord",
    requests: "Explorer les demandes",
    myRequests: "Mes demandes",
    newRequest: "Publier une demande",
    studentSpace: "ESPACE ÉTUDIANT",
    mySpace: "MON ESPACE",
    myProfile: "Mon profil",
    administration: "Administration",
    adminSpace: "ESPACE ADMINISTRATEUR",
    adminReports: "Publications signalées",
    adminRequests: "Demandes",
    adminUsers: "Utilisateurs",
    adminNotifications: "Notifications",
    logout: "Déconnexion",
    login: "Connexion",
    register: "Créer un compte",
    language: "Langue",
  },
  en: {
    slogan: "Learn. Share. Grow.",
    dashboard: "Dashboard",
    requests: "Explore requests",
    myRequests: "My requests",
    newRequest: "Post a request",
    studentSpace: "STUDENT SPACE",
    mySpace: "MY SPACE",
    myProfile: "My profile",
    administration: "Administration",
    adminSpace: "ADMINISTRATION",
    adminReports: "Reported posts",
    adminRequests: "Requests",
    adminUsers: "Users",
    adminNotifications: "Notifications",
    logout: "Log out",
    login: "Log in",
    register: "Create an account",
    language: "Language",
  },
  ar: {
    slogan: "تعلّم. شارك. تقدّم.",
    dashboard: "لوحة التحكم",
    requests: "استكشاف الطلبات",
    myRequests: "طلباتي",
    newRequest: "نشر طلب",
    studentSpace: "مساحة الطلاب",
    mySpace: "مساحتي",
    myProfile: "ملفي الشخصي",
    administration: "الإدارة",
    adminSpace: "مساحة الإدارة",
    adminReports: "المنشورات المبلّغ عنها",
    adminRequests: "الطلبات",
    adminUsers: "المستخدمون",
    adminNotifications: "الإشعارات",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    language: "اللغة",
  },
} satisfies Record<Language, Record<string, string>>;

type TranslationSet = (typeof translations)["fr"];

const LanguageContext = createContext<{
  language: Language;
  t: TranslationSet;
  translate: (message: string) => string;
}>({ language: "fr", t: translations.fr, translate: (message) => message });

export function useAppLanguage() {
  return useContext(LanguageContext);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const avatarLoaded = useRef(false);
  const language = useSyncExternalStore(
    subscribeToPreferences,
    getSavedLanguage,
    getServerLanguage,
  );
  const theme = useSyncExternalStore(
    subscribeToPreferences,
    getSavedTheme,
    getServerTheme,
  );
  const t = translations[language];
  const translate = (message: string) => translateMessage(language, message);
  const textDirection = language === "ar" ? "rtl" : "ltr";

  function changeLanguage(nextLanguage: Language) {
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("campusconnect-language", nextLanguage);
    window.dispatchEvent(new Event(preferencesChangedEvent));
  }

  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const title = translateMessage(
      language,
      "CampusConnect — Entraide étudiante",
    );
    const descriptionText = translateMessage(
      language,
      "Plateforme d’entraide et de partage entre étudiants.",
    );
    function syncMetadata() {
      if (document.title !== title) document.title = title;
      const description = document.querySelector('meta[name="description"]');
      if (description?.getAttribute("content") !== descriptionText) {
        description?.setAttribute("content", descriptionText);
      }
    }

    const observer = new MutationObserver(syncMetadata);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["content"],
    });
    syncMetadata();

    return () => observer.disconnect();
  }, [language, path]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("campusconnect-theme", nextTheme);
    window.dispatchEvent(new Event(preferencesChangedEvent));
  }

  useEffect(() => {
    let active = true;
    const includeAvatar = !avatarLoaded.current;
    apiFetch(includeAvatar ? "/api/auth/me?includeAvatar=true" : "/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        const nextUser = data?.user as SessionUser | undefined;
        if (!nextUser) {
          avatarLoaded.current = false;
          setUser(null);
          return;
        }
        if (includeAvatar) avatarLoaded.current = true;
        setUser((current) => ({
          ...nextUser,
          avatar: nextUser.avatar ?? current?.avatar,
        }));
      })
      .catch(() => {
        if (active) {
          avatarLoaded.current = false;
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    function handleAvatarUpdate(event: Event) {
      if (
        !(event instanceof CustomEvent) ||
        typeof event.detail?.avatar !== "string"
      ) {
        return;
      }

      avatarLoaded.current = true;
      setUser((current) =>
        current ? { ...current, avatar: event.detail.avatar } : current,
      );
    }

    window.addEventListener("campusconnect:avatar-updated", handleAvatarUpdate);
    return () =>
      window.removeEventListener(
        "campusconnect:avatar-updated",
        handleAvatarUpdate,
      );
  }, []);

  async function logout() {
    setLogoutError("");
    try {
      const response = await apiFetch("/api/auth/logout", { method: "POST" });
      if (!response.ok)
        throw new Error("La déconnexion n’a pas pu être effectuée.");
      avatarLoaded.current = false;
      setUser(null);
      router.push("/login");
    } catch (reason) {
      setLogoutError(
        reason instanceof Error
          ? reason.message
          : "La déconnexion n’a pas pu être effectuée.",
      );
    }
  }

  return (
    <LanguageContext.Provider value={{ language, t, translate }}>
      <div className="app-bg">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">C</span>
            <span>
              Campus<span className="brand-accent">Connect</span>
              <small>{t.slogan}</small>
            </span>
          </Link>
          <div className="top-actions">
            <label className="language-select">
              <span className="sr-only">{t.language}</span>
              <select
                aria-label={t.language}
                value={language}
                onChange={(event) => {
                  const nextLanguage = event.target.value;
                  if (
                    nextLanguage === "fr" ||
                    nextLanguage === "en" ||
                    nextLanguage === "ar"
                  ) {
                    changeLanguage(nextLanguage);
                  }
                }}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="ar">عربي</option>
              </select>
            </label>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "light"
                  ? translate("Activer le mode sombre")
                  : translate("Activer le mode clair")
              }
              title={
                theme === "light"
                  ? translate("Mode sombre")
                  : translate("Mode clair")
              }
            >
              <span className="theme-toggle-icon theme-sun" aria-hidden="true">
                ☀
              </span>
              <span className="theme-toggle-icon theme-moon" aria-hidden="true">
                ☾
              </span>
            </button>
            {ready && user ? (
              <>
                {user.role === "student" && <NotificationBell />}
                <Link
                  className="avatar"
                  href="/profile"
                  aria-label={`${translate("Profil")} ${user.username}`}
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                    />
                  ) : (
                    user.username.slice(0, 1).toUpperCase()
                  )}
                </Link>
                <button className="btn btn-quiet" onClick={logout}>
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/login">{t.login}</Link>
                <Link className="btn btn-primary" href="/register">
                  {t.register}
                </Link>
              </>
            )}
          </div>
        </header>
        {user && (
          <aside
            className="side-nav"
            aria-label={user.role === "admin" ? t.adminSpace : t.studentSpace}
          >
            {user.role === "admin" ? (
              <>
                <div className="side-label">{t.adminSpace}</div>
                {adminLinks.map(([href, label, icon]) => (
                  <Link
                    key={href}
                    className={path === href ? "side-active" : ""}
                    href={href}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {t[label]}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <div className="side-label">{t.studentSpace}</div>
                {links.map(([href, label, icon]) => (
                  <Link
                    key={href}
                    className={path === href ? "side-active" : ""}
                    href={href}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {t[label]}
                  </Link>
                ))}
                <div className="side-label side-spaced">{t.mySpace}</div>
                <Link
                  className={path === "/profile" ? "side-active" : ""}
                  href="/profile"
                >
                  <span aria-hidden="true">◉</span>
                  {t.myProfile}
                </Link>
              </>
            )}
          </aside>
        )}
        {logoutError && (
          <div className="error" role="alert">
            {translate(logoutError)}
          </div>
        )}
        <main
          className={user ? "main-with-sidebar" : "main-public"}
          dir={textDirection}
        >
          {children}
        </main>
        <footer className="footer">
          © {new Date().getFullYear()} CampusConnect ·
          {language === "fr"
            ? " Projet React / Next.js"
            : language === "en"
              ? " React / Next.js project"
              : " مشروع React / Next.js"}
        </footer>
      </div>
    </LanguageContext.Provider>
  );
}
