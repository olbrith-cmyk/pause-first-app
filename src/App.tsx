import { useEffect, useMemo, useState } from "react";
import type { Lang } from "./i18n";
import { useTranslation } from "./i18n";
import { onAuthChange, logOut } from "./auth";
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

  const headerRight = useMemo(() => {
    return (
      <div className="headerRight">
        <button
          className="btn btnSecondary"
          onClick={() => setLang(lang === "en" ? "da" : "en")}
        >
          {lang === "en" ? "Dansk" : "English"}
        </button>

        {user && (
          <button className="btn btnSecondary" onClick={() => logOut()}>
            {t.logout}
          </button>
        )}
      </div>
    );
  }, [lang, t, user]);

  if (!authReady) {
    return (
      <div className="page">
        <div className="card">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="brand">{t.appTitle}</h1>
          <p className="subtitle">{t.appSubtitle}</p>
        </div>
        {headerRight}
      </header>

      {!user ? (
        <AuthScreen lang={lang} />
      ) : (
        <Dashboard lang={lang} userId={user.uid} email={user.email ?? ""} />
      )}
    </div>
  );
}
