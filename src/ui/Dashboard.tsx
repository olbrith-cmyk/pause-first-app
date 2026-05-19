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
              <svg
  className="homeCtaAnimals"
  viewBox="0 0 120 220"
  aria-hidden="true"
  focusable="false"
>
  {/* Silhouette stack: horse, cow, dog, cat, rabbit, bird */}
  <g fill="currentColor">
    {/* Horse */}
    <path d="M26 18c10-8 26-8 36 2 6 6 6 14 0 20-5 5-12 7-19 6l-6 8-10-2 7-10c-6-4-10-10-8-16 1-3 3-6 0-8z" />
    {/* Cow (slight overlap / bigger head) */}
    <path d="M24 54c10-7 28-7 40 2 7 5 8 14 2 20-6 7-18 9-30 6l-6 7-12-3 8-9c-5-4-8-9-6-14 1-4 3-6 4-9z" />
    {/* Dog */}
    <path d="M28 92c8-7 22-7 32 1 6 5 7 13 2 19-5 6-15 8-25 6l-5 6-10-2 6-7c-4-3-7-7-6-12 1-4 3-7 6-11z" />
    {/* Cat (below dog, clear ears + tail) */}
    <path d="M30 126c7-6 18-6 26-1 7 4 9 12 6 18-3 7-12 11-22 9-6-1-10-4-12-8-2-4-1-9 2-13z" />
    <path d="M64 146c10-2 16 6 10 14-2 3-6 6-10 7 4-6 3-10 0-12 2-3 2-6 0-9z" />
    {/* Rabbit */}
    <path d="M30 164c6-6 16-7 24-2 8 5 10 14 5 21-5 7-16 10-26 6-8-3-12-12-9-19 1-2 3-4 6-6z" />
    <path d="M52 158c-2-10 6-14 12-7 2 3 2 8 0 12-4-3-8-4-12-5z" />
    {/* Bird (iconic) */}
    <path d="M78 186c16-10 30-4 34 10-10-6-20-4-28 4-2-6-4-10-6-14z" />
  </g>
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
