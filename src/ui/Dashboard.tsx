import { logOut } from "../auth";
import { deleteUserAccount } from "../firestore";
import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "./Modals";
import { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import type { Mode } from "./VisitsScreen";

type Tab = "pets" | "myVisits" | "prepare" | "notes" | "document";

export default function Dashboard({
  lang,
  userId,
  email
}: {
  lang: Lang;
  userId: string;
  email: string;
}) {
  const t = useTranslation(lang);
  const [tab, setTab] = useState<Tab>("pets");
  const [showEmergency, setShowEmergency] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "pets" as const, label: t.myPets },
      { id: "myVisits" as const, label: (t as any).myVisits ?? "My Visits" },
      { id: "prepare" as const, label: t.prepareVisit },
      { id: "notes" as const, label: t.visitNotes },
      { id: "document" as const, label: t.viewDocument }
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

  return (
    <main className="card">
      {/* Discreet top links (like your old app) */}
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

        <span className="topLinksSpacer" />

        <button className="topLink" onClick={() => logOut()}>
          {t.logout}
        </button>
        <button className="topLink topLinkDanger" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>

      {/* Optional: keep signed-in text small and out of the way */}
      <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
        Signed in as: {email}
      </div>

      <div className="tabs">
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

        {(tab === "myVisits" ||
          tab === "prepare" ||
          tab === "notes" ||
          tab === "document") && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode={tab}
            goToTab={(next: Mode) => setTab(next)}
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
