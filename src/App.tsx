import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { useTranslation } from "./i18n";
import { onAuthChange, logOut } from "./auth";
import { deleteUserAccount } from "./firestore";
import type { User } from "firebase/auth";

import AuthScreen from "./ui/AuthScreen";
import Dashboard from "./ui/Dashboard";

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useTranslation(lang);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
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
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#fff"
      }}
    >
      {!user ? (
        <AuthScreen lang={lang} />
      ) : (
        <Dashboard
          lang={lang}
          userId={user.uid}
          email={user.email ?? ""}
          onLangChange={setLang}
          onLogout={logOut}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
