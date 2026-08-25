import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { useTranslation } from "./i18n";
import { onAuthChange, logOut, startDemo } from "./auth";
import { deleteUserAccount } from "./firestore";
import { seedDemoData } from "./utils/demoSeed";
import type { User } from "firebase/auth";

import AuthScreen from "./ui/AuthScreen";
import Dashboard from "./ui/Dashboard";

const LANG_STORAGE_KEY = "pauseFirstLang";

function loadStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return stored === "da" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(loadStoredLang);
  const t = useTranslation(lang);

  const handleLangChange = (next: Lang) => {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore write failures (e.g., private browsing)
    }
  };

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Track the real visible height (visualViewport shrinks when the on-screen
  // keyboard opens; window.innerHeight/100vh often doesn't) so fixed-height
  // screens don't trap the focused field behind the keyboard on mobile.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const setAppHeight = () => {
      document.documentElement.style.setProperty("--app-vh", `${vv.height}px`);
    };

    setAppHeight();
    vv.addEventListener("resize", setAppHeight);
    return () => vv.removeEventListener("resize", setAppHeight);
  }, []);

  // Once the keyboard finishes animating in, make sure the focused field is
  // actually visible rather than just inside a now-correctly-sized container.
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") return;
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;

    const ok = window.confirm(
      lang === "da"
        ? "Slet din konto og alle data permanent? Dette kan ikke fortrydes."
        : "Permanently delete your account and all data? This cannot be undone."
    );
    if (!ok) return;

    try {
      await deleteUserAccount(user.uid);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  const isDemo = !!user?.isAnonymous;

  const handleStartDemo = async () => {
    const cred = await startDemo();
    await seedDemoData(cred.user.uid, lang);
  };

  // Demo accounts have nothing worth keeping, so exiting always wipes the
  // seeded data (and the anonymous auth user itself) instead of leaving it
  // behind — reuses the same cascade-delete as a real account deletion.
  const handleExitDemo = async () => {
    if (!user) return;
    try {
      await deleteUserAccount(user.uid);
    } catch (e) {
      console.error("Failed to clean up demo account", e);
      await logOut();
    }
  };

  if (!authReady) {
    return (
      <div className="page">
        <div className="card">{t.loading}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "var(--app-vh, 100vh)",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#fff"
      }}
    >
      {!user ? (
        <AuthScreen lang={lang} onLangChange={handleLangChange} onStartDemo={handleStartDemo} />
      ) : (
        <Dashboard
          lang={lang}
          userId={user.uid}
          email={user.email ?? ""}
          onLangChange={handleLangChange}
          onLogout={isDemo ? handleExitDemo : logOut}
          onDeleteAccount={handleDeleteAccount}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}
