import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import HamburgerMenu from "./HamburgerMenu";

type DashboardMode = "visits" | "prepare" | "pets";

export default function Dashboard({
  lang,
  userId,
  email,
  onLangChange,
  onLogout,
  onDeleteAccount
}: {
  lang: Lang;
  userId: string;
  email?: string;
  onLangChange?: (next: Lang) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const t = useTranslation(lang);

  // Default to PREPARE (main purpose of the app)
  const [mode, setMode] = useState<DashboardMode>("prepare");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);

  // If later you want a “force open prepare wizard” trigger, we can wire this into VisitsScreen
  const [prepareWizardTrigger, setPrepareWizardTrigger] = useState(0);

  const goToTab = (nextMode: DashboardMode) => {
    setMode(nextMode);
  };

  const handlePrepareClick = () => {
    // Option A behavior will be implemented inside VisitsScreen:
    // - if no pets: guide user to add pet, then continue
    // - if pets exist: choose pet and start preparing
    setMode("prepare");
    setPrepareWizardTrigger((n) => n + 1);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5"
      }}
    >
      {/* CONTENT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0",
          paddingBottom: "120px",
          width: "100%"
        }}
      >
        {mode === "visits" && <VisitsScreen lang={lang} userId={userId} mode="myVisits" />}

        {mode === "prepare" && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode="prepare"
            // If VisitsScreen supports it later, we can use this to auto-open the wizard
            // prepareWizardTrigger={prepareWizardTrigger}
          />
        )}

        {mode === "pets" && <PetsScreen lang={lang} userId={userId} />}
      </div>

      {/* BOTTOM NAV (Primary = Prepare Visit, Secondary = My Pets) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#e8f0f7",
          borderTop: "1px solid #d0e0f0",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50
        }}
      >
        <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Big primary CTA */}
          <button
            onClick={handlePrepareClick}
            className="btn btnPrimary"
            style={{
              width: "100%",
              padding: "16px 20px",
              fontSize: "15px",
              fontWeight: "bold",
              minHeight: "52px"
            }}
          >
            {lang === "da" ? "Forbered besøg" : "Prepare Visit"}
          </button>

          {/* Smaller secondary */}
          <button
            onClick={() => setMode("pets")}
            className="btn btnSecondary"
            style={{
              width: "100%",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              minHeight: "46px"
            }}
          >
            {t.myPets}
          </button>
        </div>
      </div>

      {/* HAMBURGER MENU */}
      <HamburgerMenu
        lang={lang}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onEmergencyGuide={() => setShowEmergencyGuide(true)}
        onMedicalDisclaimer={() => alert(t.medicalDisclaimer)}
        onPrivacyPolicy={() => {}}
        onMyPets={() => {
          setMode("pets");
          setMenuOpen(false);
        }}
      />

      {/* EMERGENCY GUIDE MODAL */}
      {showEmergencyGuide && (
        <div
          className="modal"
          onClick={() => setShowEmergencyGuide(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div
            className="modalContent"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto"
            }}
          >
            <h2>{t.emergencyGuide}</h2>
            <p>
              <strong>This is not a substitute for professional veterinary care.</strong>
            </p>
            <p>
              If your pet is experiencing a life-threatening emergency, contact your veterinarian or emergency vet clinic immediately.
            </p>
            <h3>Signs of Emergency:</h3>
            <ul>
              <li>Difficulty breathing or choking</li>
              <li>Loss of consciousness or unresponsiveness</li>
              <li>Severe bleeding</li>
              <li>Inability to urinate or defecate</li>
              <li>Severe trauma or injury</li>
              <li>Seizures</li>
              <li>Severe vomiting or diarrhea</li>
              <li>Sudden paralysis</li>
            </ul>
            <button onClick={() => setShowEmergencyGuide(false)} className="btn btnPrimary" style={{ marginTop: "16px" }}>
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
