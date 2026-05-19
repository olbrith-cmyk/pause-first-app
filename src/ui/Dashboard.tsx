import logo from "../assets/pausefirst-logo.png";
import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import HamburgerMenu from "./HamburgerMenu";

import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "../ui/Modals";

type DashboardMode = "home" | "myVisits" | "prepare" | "pets";

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined appIcon" aria-hidden="true">
      {name}
    </span>
  );
}

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

  // Tracks PrepareWizard open state (even when launched from My Visits)
  const [wizardOpen, setWizardOpen] = useState(false);

  const anyModalOpen = showEmergencyGuide || showPrivacyPolicy || showMedicalDisclaimer;

  const hideBottomDock =
    mode === "home" || mode === "prepare" || anyModalOpen || menuOpen || wizardOpen;

  const handlePrepareClick = () => setMode("prepare");

  const toggleLang = () => {
    if (!onLangChange) return;
    onLangChange(lang === "en" ? "da" : "en");
  };

  return (
    <div className="appShell">
      {/* TOP HEADER */}
      <header className="appHeader">
        <button
          onClick={() => setMenuOpen(true)}
          className="iconBtn"
          aria-label={lang === "da" ? "Åbn menu" : "Open menu"}
        >
          <Icon name="menu" />
        </button>

        <div className="appHeaderText">
          <div className="appTitle">{t.appTitle}</div>
          <div className="appSubtitle">{t.appSubtitle}</div>
        </div>

        {onLangChange && (
          <button onClick={toggleLang} className="langBtn" aria-label="Toggle language">
            {lang === "en" ? "DA" : "EN"}
          </button>
        )}
      </header>

      {/* CONTENT AREA */}
      <main className={`appMain ${mode === "home" ? "appMainHome" : ""}`}>
        {/* HOME PAGE */}
       {mode === "home" && (
  <div className="pageContent">
    <section className="homeHero">
      <div className="homeIcon" aria-hidden="true">
        <img
          src={logo}
          alt=""
          style={{ width: 96, height: 96, display: "block", objectFit: "contain" }}
        />
      </div>

      <h2 className="homeTitle">
        {lang === "da" ? "Lad os gøre jer klar" : "Let’s get ready"}
      </h2>

      <p className="homeLead">
        {lang === "da"
          ? "Vælg et dyr (eller tilføj et) og skriv dine observationer ned. Så kan du gå ind til besøget rolig og forberedt."
          : "Choose a pet (or add one) and write down your observations. Walk into the visit calm, clear, and prepared."}
      </p>

      <div className="homeActions">
        <button onClick={handlePrepareClick} className="btn btnPrimary btnLg homeCtaPill">
          <div className="homeCtaContent">
            <div className="homeCtaArt" aria-hidden="true">
              <svg className="homeCtaAnimals" viewBox="0 0 120 220" focusable="false">
                <path d="M18 22 C30 10, 55 10, 68 22 C78 31, 78 45, 64 52 C52 58, 40 56, 34 50 C28 44, 26 36, 30 30"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M30 30 C26 26, 22 24, 18 24"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                <path d="M22 60 C34 52, 56 52, 70 62 C80 70, 78 84, 64 90 C50 96, 36 94, 28 86 C22 80, 20 70, 26 66"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M62 58 L72 52"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                <path d="M26 108 C34 98, 52 98, 62 108 C70 116, 70 130, 58 136 C46 142, 34 140, 28 132 C22 126, 20 116, 26 112"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M58 104 C64 100, 70 100, 74 104"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                <path d="M28 148 C34 142, 44 140, 54 144 C64 148, 70 158, 66 168 C62 178, 50 184, 38 180 C28 176, 22 166, 26 156"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M38 144 L34 138"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M46 144 L50 138"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M64 170 C76 168, 82 176, 74 186"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                <path d="M30 194 C36 186, 50 184, 60 190 C70 196, 72 210, 62 216 C52 222, 38 220, 32 210 C28 204, 28 198, 30 194"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 186 C48 176, 54 170, 60 178"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M56 186 C58 176, 66 172, 68 182"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                <path d="M78 204 C92 194, 104 198, 108 210 C100 206, 92 210, 86 218 C84 212, 80 208, 78 204"
                  fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="homeCtaText">
              <div className="homeCtaMain">
                <span>{lang === "da" ? "Forbered besøg" : "Prepare visit"}</span>
              </div>
              <div className="homeCtaSubline">
                {lang === "da" ? "Lav en Visit Brief på 5–10 min" : "Create a Visit Brief in 5–10 min"}
              </div>
            </div>
          </div>

          <span className="homeCtaArrow" aria-hidden="true">→</span>
        </button>

        <button onClick={() => setMode("pets")} className="btn btnSecondary">
          {t.myPets}
        </button>

        <button onClick={() => setMode("myVisits")} className="btn btnSecondary">
          {lang === "da" ? "Mine besøg" : "My visits"}
        </button>
      </div>
    </section>
  </div>
)} 

        {mode === "pets" && <PetsScreen lang={lang} userId={userId} />}

        {mode === "myVisits" && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode="myVisits"
            onWizardOpenChange={setWizardOpen}
            onModeChange={(next) => setMode(next === "myVisits" ? "myVisits" : "prepare")}
          />
        )}

        {mode === "prepare" && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode="prepare"
            onWizardOpenChange={setWizardOpen}
            onModeChange={(next) => setMode(next === "myVisits" ? "myVisits" : "prepare")}
          />
        )}
      </main>

      {/* BOTTOM NAV (hide on home, and hide when any modal/menu/wizard is open) */}
      {!hideBottomDock && (
        <footer className="bottomDock">
          <div className="bottomDockInner">
            <button onClick={handlePrepareClick} className="btn btnPrimary btnLg">
              {lang === "da" ? "Forbered besøg" : "Prepare visit"}
            </button>

            <div className="bottomDockGrid">
              <button onClick={() => setMode("pets")} className="btn btnSecondary">
                {t.myPets}
              </button>

              <button onClick={() => setMode("myVisits")} className="btn btnSecondary">
                {lang === "da" ? "Mine besøg" : "My visits"}
              </button>

              <button onClick={() => setMode("home")} className="btn btnSecondary bottomDockHome">
                {lang === "da" ? "Hjem" : "Home"}
              </button>
            </div>
          </div>
        </footer>
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

      {/* REAL MODALS */}
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
