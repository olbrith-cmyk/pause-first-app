import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "./Modals";
import { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { logOut } from "../auth";

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
    if (
      !confirm(
        "Are you sure? This will permanently delete your account and all data. This cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Call a delete function (we'll create this in auth.ts)
      await deleteUserAccount(userId);
      alert("Account deleted successfully. Redirecting...");
      logOut();
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

  return (
    <main className="card">
      <div className="topRow">
        <div className="row">
          <button className="btn btnSecondary" onClick={() => setShowEmergency(true)}>
            {t.emergencyGuide}
          </button>
          <button className="btn btnSecondary" onClick={() => setShowDisclaimer(true)}>
            {t.medicalDisclaimer}
          </button>
          <button className="btn btnSecondary" onClick={() => setShowPrivacy(true)}>
            Privacy Policy
          </button>
        </div>
        <div className="muted">Signed in as: {email}</div>
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
        {tab === "pets" && <PetsScreen lang={lang} userId={userId} />}
        {(tab === "myVisits" || tab === "prepare" || tab === "notes" || tab === "document") && (
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

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div className="row rowWrap">
          <button className="btn btnSecondary" onClick={() => logOut()}>
            {t.logout}
          </button>
          <button className="btn btnDanger" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>
    </main>
  );
}

// Placeholder function (we'll add this to auth.ts)
async function deleteUserAccount(userId: string) {
  // This will be implemented in auth.ts
  throw new Error("deleteUserAccount not yet implemented");
}
