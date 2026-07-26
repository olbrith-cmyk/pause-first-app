import { useEffect, useState } from "react";
import logo from "../assets/pausefirst-logo.png";
import dogSil from "../assets/silhouettes/dog.png";
import birdSil from "../assets/silhouettes/bird.png";
import catSil from "../assets/silhouettes/cat.png";
import cowSil from "../assets/silhouettes/cow.png";

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

type DashboardProps = {
  lang: Lang;
  userId: string;
  email?: string;
  onLangChange?: (next: Lang) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
};

export default function Dashboard({
  lang,
  userId,
  email,
  onLangChange,
  onLogout,
  onDeleteAccount,
}: DashboardProps) {
  const t = useTranslation(lang);

  const [mode, setMode] = useState<DashboardMode>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [showEmergencyGuide, setShowEmergencyGuide] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showMedicalDisclaimer, setShowMedicalDisclaimer] = useState(false);

  // Tracks PrepareWizard open state (even when launched from My Visits)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [animalsStartInAddMode, setAnimalsStartInAddMode] = useState(false);

  // NEW: track whether a visit detail is open inside VisitsScreen
  const [openVisitIdFromVisits, setOpenVisitIdFromVisits] = useState<string | null>(null);

    // NEW: signal to VisitsScreen to "go back" (close open visit)
  const [backSignal, setBackSignal] = useState(0);

  // NEW: queue nav requests when wizard is open
  const [pendingNav, setPendingNav] = useState<null | "pets" | "myVisits">(null);

  const anyModalOpen = showEmergencyGuide || showPrivacyPolicy || showMedicalDisclaimer;

  const hideBottomDock =
    mode === "home" || mode === "prepare" || anyModalOpen || menuOpen || wizardOpen;

  const handlePrepareClick = () => setMode("prepare");

  const goToAnimals = (openForm?: boolean) => {
    setAnimalsStartInAddMode(!!openForm);
    setMode("pets");
  };

  const toggleLang = () => {
    if (!onLangChange) return;
    onLangChange(lang === "en" ? "da" : "en");
  };

  // Make `.keyboardOpen .bottomDock { display:none; }` work when wizard is open
  useEffect(() => {
    if (wizardOpen) document.body.classList.add("keyboardOpen");
    else document.body.classList.remove("keyboardOpen");

    return () => {
      document.body.classList.remove("keyboardOpen");
    };
  }, [wizardOpen]);

  // NEW: unified handler for the footer "My visits" button
  const handleMyVisitsNav = () => {
    // If we're already on My Visits AND a visit detail is open, act like Back
    if (mode === "myVisits" && openVisitIdFromVisits) {
      setBackSignal((n) => n + 1);
      return;
    }
    setMode("myVisits");
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
            <section className="homeHero homeHeroV2">
              {/* Background silhouettes */}
              <div className="homeSilhouettes" aria-hidden="true">
                <img src={dogSil} className="homeSilhouette homeSilhouetteDog" alt="" />
                <img src={birdSil} className="homeSilhouette homeSilhouetteBird" alt="" />
              </div>

              {/* Pause logo */}
              <div className="homeIcon homeIconV2" aria-hidden="true">
                <img
                  src={logo}
                  alt=""
                  style={{ width: 110, height: 110, display: "block", objectFit: "contain" }}
                />
              </div>

              <h2 className="homeTitle homeTitleV2">
                {lang === "da" ? "Lad os gøre jer klar" : "Let’s get ready"}
              </h2>

              <p className="homeLead homeLeadV2">
                {lang === "da"
                  ? "Vælg et dyr (eller tilføj et) og skriv dine observationer ned. Gå ind til besøget rolig, klar og forberedt."
                  : "Choose an animal (or add one) and write down your observations. Walk into the visit calm, clear, and prepared."}
              </p>

              <div className="homeActions homeActionsV2">
                <button
                  onClick={handlePrepareClick}
                  className="btn btnPrimary btnLg homeCtaHero"
                >
                  <span
                    className="material-symbols-outlined homeCtaHeroIcon"
                    aria-hidden="true"
                  >
                    assignment
                  </span>

                  <div className="homeCtaHeroText">
                    <div className="homeCtaHeroMain">
                      {lang === "da" ? "Lav en besøgsforberedelse" : "Prepare a Visit Brief"}
                    </div>
                    <div className="homeCtaHeroSub">
                      {lang === "da" ? "5–10 minutter" : "5–10 minutes"}
                    </div>
                  </div>

                  <span className="homeCtaHeroGo" aria-hidden="true">
                    ›
                  </span>
                </button>

                <div className="homeSecondaryRow">
                  <button
                    onClick={() => goToAnimals(false)}
                    className="btn btnSecondary homeSecondaryPill"
                  >
                    {lang === "da" ? "Mine dyr" : "My animals"}
                  </button>

                  <button
                    onClick={() => setMode("myVisits")}
                    className="btn btnSecondary homeSecondaryPill"
                  >
                    {lang === "da" ? "Mine besøg" : "My Visits"}
                  </button>
                </div>
              </div>

              <div className="homeBottomSilhouettes" aria-hidden="true">
                <img src={cowSil} className="homeSilhouette homeBottomSilhouetteCow" alt="" />
                <img src={catSil} className="homeSilhouette homeBottomSilhouetteCat" alt="" />
              </div>
            </section>
          </div>
        )}

        {mode === "pets" && (
          <PetsScreen
            lang={lang}
            userId={userId}
            startInAddMode={animalsStartInAddMode}
            onEnteredAddMode={() => setAnimalsStartInAddMode(false)}
            onGoHome={() => setMode("home")}
          />
        )}

               {mode === "myVisits" && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode="myVisits"
            onWizardOpenChange={(open) => setWizardOpen(open)}
            onGoToAnimals={() => goToAnimals(true)}
            onGoHome={() => setMode("home")}
            onModeChange={(m) => setMode(m)}   // IMPORTANT so VisitsScreen can switch mode
            onOpenVisitChange={setOpenVisitIdFromVisits}
            backSignal={backSignal}

            pendingNav={pendingNav}
            onPendingNavHandled={() => setPendingNav(null)}
          />
        )} 

        {mode === "prepare" && (
          <VisitsScreen
            lang={lang}
            userId={userId}
            mode="prepare"
            onWizardOpenChange={(open) => setWizardOpen(open)}
            onGoToAnimals={() => goToAnimals(true)}
            onGoHome={() => setMode("home")}
            onModeChange={(m) => setMode(m)}
            onOpenVisitChange={setOpenVisitIdFromVisits}
            backSignal={backSignal}

            pendingNav={pendingNav}
            onPendingNavHandled={() => setPendingNav(null)}
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
              <button
  onClick={() => {
    if (wizardOpen) {
      setPendingNav("pets");
      return;
    }
    goToAnimals(false);
  }}
  className="btn btnSecondary"
>
  {t.myPets}
</button>

<button
  onClick={() => {
    if (wizardOpen) {
      setPendingNav("myVisits");
      return;
    }
    handleMyVisitsNav();
  }}
  className="btn btnSecondary"
>
  {lang === "da" ? "Mine besøg" : "My visits"}
</button>

              <button
                onClick={() => setMode("home")}
                className="btn btnSecondary bottomDockHome"
              >
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
