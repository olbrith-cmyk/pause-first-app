import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import HamburgerMenu from "./HamburgerMenu";

import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "../ui/Modals";

type DashboardMode = "home" | "myVisits" | "prepare" | "pets";

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

  const [mode, setMode] = useState<DashboardMode>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false);

  const handlePrepareClick = () => setMode("prepare");

  const toggleLang = () => {
    if (!onLangChange) return;
    onLangChange(lang === "en" ? "da" : "en");
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
      {/* TOP HEADER (Dashboard owns the menu + navigation) */}
      <header
        className="header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #eee"
        }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#333"
          }}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{t.appTitle}</div>
          <div style={{ fontSize: 12, color: "var(--textMuted)", lineHeight: 1.2 }}>
            {t.appSubtitle}
          </div>
        </div>

        {onLangChange && (
          <button
            onClick={toggleLang}
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
        )}
      </header>

      {/* CONTENT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0",
          paddingBottom: mode === "home" ? "40px" : "96px",
          width: "100%"
        }}
      >
        {/* HOME PAGE */}
        {mode === "home" && (
          <div className="pageContent">
            <div className="stack" style={{ textAlign: "center", marginTop: "40px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>🐾</div>
              <h2 style={{ margin: "0 0 12px 0", fontSize: "28px", fontWeight: "bold" }}>
                Walk in Prepared
              </h2>
              <p
                style={{
                  margin: "0 0 24px 0",
                  color: "var(--textMuted)",
                  fontSize: "16px",
                  lineHeight: "1.6"
                }}
              >
                Choose a pet (or add one) and start gathering your observations. Partner with your
                vet by preparing for the visit.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={handlePrepareClick}
                  className="btn btnPrimary"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 800,
                    minHeight: "44px"
                  }}
                >
                  {lang === "da" ? "Forbered besøg" : "Prepare Visit"}
                </button>

                <button
                  onClick={() => setMode("pets")}
                  className="btn btnSecondary"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    minHeight: "40px"
                  }}
                >
                  {t.myPets}
                </button>

                <button
                  onClick={() => setMode("myVisits")}
                  className="btn btnSecondary"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    minHeight: "40px"
                  }}
                >
                  {lang === "da" ? "Mine besøg" : "My Visits"}
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === "myVisits" && <VisitsScreen lang={lang} userId={userId} mode="myVisits" />}
        {mode === "prepare" && <VisitsScreen lang={lang} userId={userId} mode="prepare" />}
        {mode === "pets" && <PetsScreen lang={lang} userId={userId} />}
      </div>

      {/* BOTTOM NAV (only show if NOT on home) */}
      {mode !== "home" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#e8f0f7",
            borderTop: "1px solid #d0e0f0",
            padding: "10px 12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <button
              onClick={handlePrepareClick}
              className="btn btnPrimary"
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 800,
                minHeight: "44px"
              }}
            >
              {lang === "da" ? "Forbered besøg" : "Prepare Visit"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                onClick={() => setMode("pets")}
                className="btn btnSecondary"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  minHeight: "40px"
                }}
              >
                {t.myPets}
              </button>

              <button
                onClick={() => setMode("myVisits")}
                className="btn btnSecondary"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  minHeight: "40px"
                }}
              >
                {lang === "da" ? "Mine besøg" : "My Visits"}
              </button>

              <button
                onClick={() => setMode("home")}
                className="btn btnSecondary"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  minHeight: "40px",
                  gridColumn: "1 / span 2"
                }}
              >
                {lang === "da" ? "Hjem" : "Home"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HAMBURGER MENU */}
      <HamburgerMenu
        lang={lang}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        onEmergencyGuide={() => {
          setMenuOpen(false);
          setShowEmergencyGuide(true);
        }}
        onMedicalDisclaimer={() => {
          setMenuOpen(false);
          setShowMedicalDisclaimer(true);
        }}
        onPrivacyPolicy={() => {
          setMenuOpen(false);
          setShowPrivacyPolicy(true);
        }}
        onMyPets={() => {
          setMode("pets");
          setMenuOpen(false);
        }}
        onMyVisits={() => {
          setMode("myVisits");
          setMenuOpen(false);
        }}
      />

      {/* REAL MODALS (restored) */}
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
