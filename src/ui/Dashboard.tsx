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

  const [mode, setMode] = useState<DashboardMode>("prepare");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);
  const [prepareWizardTrigger, setPrepareWizardTrigger] = useState(0);

  const goToTab = (nextMode: DashboardMode) => {
    setMode(nextMode);
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
          paddingBottom: "100px",
          width: "100%"
        }}
      >
        {mode === "visits" && (
          <VisitsScreen lang={lang} userId={userId} mode="myVisits" />
        )}

        {mode === "prepare" && <VisitsScreen lang={lang} userId={userId} mode={mode} />}

        {mode === "pets" && <PetsScreen lang={lang} userId={userId} />}
      </div>

      {/* BOTTOM NAV */}
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
  {/* Single Center Button */}
  <button
    onClick={() => setMode("pets")}
    className="btn btnPrimary"
    style={{
      width: "100%",
      maxWidth: "320px",
      padding: "16px 20px",
      fontSize: "15px",
      fontWeight: "bold",
      minHeight: "50px"
    }}
  >
    {t.myPets}
  </button>
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
            <button
              onClick={() => setShowEmergencyGuide(false)}
              className="btn btnPrimary"
              style={{ marginTop: "16px" }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
