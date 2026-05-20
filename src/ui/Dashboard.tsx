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
    <section className="homeHero homeHeroV2">
  {/* Background silhouettes */}
  <div className="homeSilhouettes" aria-hidden="true">
  <svg
    className="homeSilhouettesSvg"
    viewBox="0 0 390 740"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {/* One opacity for all silhouettes */}
    <g className="silGroup">
      {/* Dog (left) */}
      <path
        d="M70 310
           C55 300, 48 285, 52 270
           C57 250, 78 240, 98 244
           C112 220, 140 214, 160 226
           C175 238, 180 258, 172 274
           C190 282, 200 300, 196 320
           C192 344, 170 360, 145 358
           C130 372, 110 380, 92 372
           C80 366, 74 352, 76 340
           C62 334, 54 322, 70 310 Z"
      />

      {/* Bird (top right) */}
      <path
        d="M292 160
           C310 142, 335 138, 356 150
           C338 152, 322 160, 308 172
           C326 168, 346 172, 360 186
           C338 182, 318 188, 300 202
           C292 192, 286 178, 292 160 Z"
      />

      {/* Cat (right) */}
      <path
        d="M285 330
           C272 320, 268 304, 274 290
           C280 276, 296 268, 312 272
           C320 252, 340 240, 360 246
           C352 262, 352 278, 360 294
           C368 312, 362 334, 346 346
           C332 356, 314 358, 300 350
           C294 366, 280 376, 264 372
           C268 360, 270 346, 266 332
           C270 334, 276 336, 285 330 Z"
      />

      {/* Cow (bottom left / large) */}
      <path
        d="M-10 650
           C30 600, 92 580, 150 596
           C170 570, 210 560, 242 578
           C270 594, 282 624, 270 652
           C292 668, 300 700, 280 722
           C260 744, 220 748, 194 730
           C168 748, 128 746, 104 724
           C78 700, 80 666, 104 648
           C70 634, 28 634, -10 650 Z"
      />
    </g>
  </svg>
</div>

  {/* Your existing pause logo (keep this) */}
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
    <button onClick={handlePrepareClick} className="btn btnPrimary btnLg homeCtaHero">
      <span className="material-symbols-outlined homeCtaHeroIcon" aria-hidden="true">
        assignment
      </span>

      <div className="homeCtaHeroText">
        <div className="homeCtaHeroMain">
          {lang === "da" ? "Start en Visit Brief" : "Start a Visit Brief"}
        </div>
        <div className="homeCtaHeroSub">
          {lang === "da" ? "5–10 minutter" : "5–10 minutes"}
        </div>
      </div>

      <span className="homeCtaHeroGo" aria-hidden="true">›</span>
    </button>

    <div className="homeSecondaryRow">
      <button onClick={() => setMode("pets")} className="btn btnSecondary homeSecondaryPill">
        {lang === "da" ? "Mine dyr" : "My animals"}
      </button>

      <button onClick={() => setMode("myVisits")} className="btn btnSecondary homeSecondaryPill">
        {lang === "da" ? "Visit briefs" : "Visit briefs"}
      </button>
    </div>
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
