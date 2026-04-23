import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "./ui/Modals";
import { EmergencyGuide, MedicalDisclaimer } from "./ui/Modals";
import HamburgerMenu from "./ui/HamburgerMenu";
import { useEffect, useState } from "react";
import type { Lang } from "./i18n";
import { useTranslation } from "./i18n";
import { onAuthChange, logOut, deleteCurrentUser } from "./auth";
import type { User } from "firebase/auth";

import AuthScreen from "./ui/AuthScreen";
import Dashboard from "./ui/Dashboard";

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = useTranslation(lang);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);
const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#333",
            marginRight: "16px"
          }}
        >
          ☰
        </button>
        <div>
          <h1 className="brand">{t.appTitle}</h1>
          <p className="subtitle">{t.appSubtitle}</p>
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "da" : "en")}
          style={{
            background: "none",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
            color: "#0066cc",
            fontWeight: "bold"
          }}
        >
          {lang === "en" ? "DA" : "EN"}
        </button>
      </header>

      {!user ? (
        <AuthScreen lang={lang} />
      ) : (
        <Dashboard
  lang={lang}
  userId={user.uid}
  email={user.email ?? ""}
  onLangChange={setLang}
  onLogout={logOut}
  onDeleteAccount={deleteCurrentUser}
/>
      )}
            <HamburgerMenu
  lang={lang}
  isOpen={menuOpen}
  onClose={() => setMenuOpen(false)}
  onLogout={logOut}
  onDeleteAccount={deleteCurrentUser}
  onEmergencyGuide={() => setShowEmergencyGuide(true)}
  onMedicalDisclaimer={() => setShowMedicalDisclaimer(true)}
  onPrivacyPolicy={() => setShowPrivacyPolicy(true)}       
/>
            {showEmergencyGuide && (
        <EmergencyGuide lang={lang} onClose={() => setShowEmergencyGuide(false)} />
      )}

      {showMedicalDisclaimer && (
        <MedicalDisclaimer lang={lang} onClose={() => setShowMedicalDisclaimer(false)} />
      )}
      {showPrivacyPolicy && (
  <PrivacyPolicy lang={lang} onClose={() => setShowPrivacyPolicy(false)} />
)}
    </div>
  );
}
