import { logOut } from "../auth";
import { deleteUserAccount } from "../firestore";
import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "./Modals";
import { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import type { Mode } from "./VisitsScreen";

type Tab = "prepare" | "myVisits" | "pets";

export default function Dashboard({
  lang,
  userId,
  email,
  onLangChange
}: {
  lang: Lang;
  userId: string;
  email: string;
  onLangChange: (lang: Lang) => void;
}) {
  const t = useTranslation(lang);
  const [tab, setTab] = useState<Tab>("prepare");
  const [showEmergency, setShowEmergency] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "prepare" as const, label: t.prepareVisit },
      { id: "myVisits" as const, label: (t as any).myVisits ?? "My Visits" },
      { id: "pets" as const, label: t.myPets }
    ],
    [t]
  );

  const handleDeleteAccount = async () => {
    const ok = confirm(
      "Are you sure? This will permanently delete your account and all your data."
    );
    if (!ok) return;

    try {
      await deleteUserAccount(userId);
      alert("Account deleted successfully.");
      await logOut();
    } catch (error: any) {
      const message = error?.message ?? String(error);
      if (message.includes("requires-recent-login")) {
        alert(
          "For security, please log out and log in again, then try deleting your account."
        );
      } else {
        alert("Error deleting account: " + message);
      }
    }
  };

  const handleFirstPetSaved = () => {
    setTab("prepare");
  };

  const isDa = lang === "da";

  return (
    <main className="card">
      {/* Top bar: discreet links + language toggle */}
      <div className="topBar">
        <div className="topLinks">
          <button className="topLink" onClick={() => setShowEmergency(true)}>
            {t.emergencyGuide}
          </button>
          <button className="topLink" onClick={() => setShowDisclaimer(true)}>
            {t.medicalDisclaimer}
          </button>
          <button className="topLink" onClick={() => setShowPrivacy(true)}>
            Privacy Policy
          </button>
          <button className="topLink" onClick={() => logOut()}>
            {t.logout}
          </button>
          <button className="topLink topLinkDanger" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>

        {/* Small EN/DA slider toggle */}
        <div className="langSwitchWrap" aria-label="Language">
          <span className={`langLabel ${!isDa ? "langLabelActive" : ""}`}>EN</span>

          <button
            type="button"
            className={`langSwitch ${isDa ? "langSwitchOn" : ""}`}
            role="switch"
            aria-checked={isDa}
            onClick={() => onLangChange(isDa ? "en" : "da")}
            title={isDa ? "Switch to English" : "Skift til Dansk"}
          >
            <span className="langKnob" />
          </button>

          <span className={`langLabel ${isDa ? "langLabelActive" : ""}`}>DA</span>
        </div>
      </div>

      {/* Top-level tabs */}
      <div className="tabs" style={{ marginTop: 8 }}>
        {tabs.map((x) => (
          <button
            key={x.id}
            className={`tab ${tab === x.id ? "tabActive" : ""}`}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="panel">
        {tab === "pets" && (
          <PetsScreen
            lang={lang}
            userId={userId}
            onFirstPetSaved={handleFirstPetSaved}
          />
        )}

        {(tab === "prepare" || tab === "myVisits") && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode={tab as Mode} // "prepare" | "myVisits"
            goToTab={(next: Mode) => setTab(next === "myVisits" ? "myVisits" : "prepare")}
          />
        )}
      </div>

      {showEmergency && (
        <EmergencyGuide lang={lang} onClose={() => setShowEmergency(false)} />
      )}
      {showDisclaimer && (
        <MedicalDisclaimer lang={lang} onClose={() => setShowDisclaimer(false)} />
      )}
      {showPrivacy && (
        <PrivacyPolicy lang={lang} onClose={() => setShowPrivacy(false)} />
      )}
    </main>
  );
}
