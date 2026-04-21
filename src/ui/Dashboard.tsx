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
  const [showMenu, setShowMenu] = useState(false);

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
      <div className="topRow" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0", fontSize: "28px" }}>{t.appTitle}</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--textMuted)" }}>{t.appSubtitle}</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "var(--textMuted)" }}>Signed in as: {email}</p>
        </div>
        <button className="btn btnSecondary" onClick={() => setShowMenu(true)} style={{ whiteSpace: "nowrap" }}>
          ☰ Menu
        </button>
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

      {showMenu && (
        <div className="modal" onClick={() => setShowMenu(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Menu</h3>
              <button className="btnClose" onClick={() => setShowMenu(false)}>✕</button>
            </div>
            <div className="modalBody">
              <button
                className="menuItem"
                onClick={() => {
                  setShowEmergency(true);
                  setShowMenu(false);
                }}
              >
                {t.emergencyGuide}
              </button>
              <button
                className="menuItem"
                onClick={() => {
                  setShowDisclaimer(true);
                  setShowMenu(false);
                }}
              >
                {t.medicalDisclaimer}
              </button>
              <button
                className="menuItem"
                onClick={() => {
                  setShowPrivacy(true);
                  setShowMenu(false);
                }}
              >
                Privacy Policy
              </button>

              <hr className="hr" style={{ margin: "12px 0" }} />

              <button
                className="menuItem"
                onClick={() => {
                  logOut();
                  setShowMenu(false);
                }}
              >
                {t.logout}
              </button>

              <button
                className="menuItem menuItemDanger"
                onClick={() => {
                  handleDeleteAccount();
                  setShowMenu(false);
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
