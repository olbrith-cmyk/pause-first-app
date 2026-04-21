import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { useTranslation } from "./i18n";
import { onAuthChange } from "./auth";
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
      </header>

      {!user ? (
        <AuthScreen lang={lang} />
      ) : (
        <Dashboard
          lang={lang}
          userId={user.uid}
          email={user.email ?? ""}
          onLangChange={setLang}
        />
      )}
    </div>
  );
}
