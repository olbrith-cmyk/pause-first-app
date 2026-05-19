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
    style={{
      width: 96,
      height: 96,
      display: "block",
      objectFit: "contain"
    }}
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
               <button onClick={handlePrepareClick} className="btn btnPrimary btnLg homeCtaPrimary">
  <div className="homeCtaContent">
    <div className="homeCtaMain">
      <span className="material-symbols-outlined homeCtaIcon" aria-hidden="true">checklist</span>
      <span>{lang === "da" ? "Forbered besøg" : "Prepare visit"}</span>
    </div>

    <div className="homeCtaSubline">
      {lang === "da" ? "Lav en Visit Brief på ~5–10 min" : "Create a Visit Brief in ~5–10 min"}
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
