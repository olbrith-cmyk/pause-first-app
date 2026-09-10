import { useEffect, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { AiAssistantConsent } from "./Modals";
import { hasAiAssistantConsent, openChatGpt, setAiAssistantConsent } from "../utils/chatGptHandoff";

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined menuIcon" aria-hidden="true">
      {name}
    </span>
  );
}

export default function HamburgerMenu({
  lang,
  isOpen,
  onClose,
  onLogout,
  onDeleteAccount,
  onEmergencyGuide,
  onMedicalDisclaimer,
  onPrivacyPolicy,
  onMyPets,
  onMyVisits,
  onGoHome,
  isDemo
}: {
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onEmergencyGuide: () => void;
  onMedicalDisclaimer: () => void;
  onPrivacyPolicy: () => void;
  onMyPets: () => void;
  onMyVisits: () => void;
  onGoHome: () => void;
  isDemo?: boolean;
}) {
  const t = useTranslation(lang);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAiConsent, setShowAiConsent] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const openAiAssistant = () => {
    // Demo users get the consent/warning popup on every use — never skip it
    // via a remembered consent, matching the same rule in ViewDocument.tsx.
    if (!isDemo && hasAiAssistantConsent()) {
      openChatGpt(lang);
    } else {
      setShowAiConsent(true);
    }
  };

  const confirmAiAssistant = () => {
    if (!isDemo) setAiAssistantConsent();
    setShowAiConsent(false);
    openChatGpt(lang);
  };

  const items = [
    {
      icon: "home",
      title: lang === "da" ? "Hjem" : "Home",
      hint: lang === "da" ? "Gå til forsiden" : "Go to the home screen",
      onClick: onGoHome
    },
    {
      icon: "pets",
      title: t.myPets,
      hint: lang === "da" ? "Profiler og noter" : "Profiles and notes",
      onClick: onMyPets
    },
    {
      icon: "event_note",
      title: lang === "da" ? "Mine besøg" : "My visits",
      hint: lang === "da" ? "Kladder, besøgsforberedelser og noter" : "Drafts, Visit Briefs, and notes",
      onClick: onMyVisits
    },
    {
      icon: "auto_awesome",
      title: t.aiAssistant,
      hint: lang === "da" ? "Åbner ChatGPT i en ny fane" : "Opens ChatGPT in a new tab",
      onClick: openAiAssistant
    },
    {
      icon: "warning",
      title: t.emergencyGuide,
      hint: lang === "da" ? "Ved akut bekymring: kontakt klinikken" : "For urgent concerns: contact your clinic",
      onClick: onEmergencyGuide
    },
    {
      icon: "verified_user",
      title: t.medicalDisclaimer,
      hint: lang === "da" ? "Ingen diagnose eller medicinsk rådgivning" : "No diagnosis or medical advice",
      onClick: onMedicalDisclaimer
    },
    {
      icon: "lock",
      title: lang === "da" ? "Privatlivspolitik" : "Privacy policy",
      hint: lang === "da" ? "Hvordan data behandles" : "How data is handled",
      onClick: onPrivacyPolicy
    }
  ];

  return (
    <>
      {isOpen && <div className="menuOverlay" onClick={onClose} />}

      <aside
        ref={menuRef}
        className={`menuDrawer ${isOpen ? "menuDrawerOpen" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="menuTop">
          <div className="menuBrand">
            <div className="menuBrandTitle">Pause First™</div>
            <div className="menuBrandSub">
              {lang === "da"
                ? "Pause. Observer. Kommunikér."
                : "Pause. Observe. Communicate."}
            </div>
          </div>

          <button
            className="menuCloseBtn"
            onClick={onClose}
            aria-label={lang === "da" ? "Luk" : "Close"}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="menuList">
          {items.map((item) => (
            <button
              key={item.title}
              className="menuItem"
              onClick={() => {
                item.onClick();
                onClose();
              }}
            >
              <Icon name={item.icon} />
              <span className="menuText">
                <span className="menuTitle">{item.title}</span>
                <span className="menuHint">{item.hint}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="menuDivider" />

        <div className="menuBottom">
          <button
            className="menuItem"
            onClick={() => {
              onLogout();
              onClose();
            }}
          >
            <Icon name="logout" />
            <span className="menuText">
              <span className="menuTitle">{isDemo ? (lang === "da" ? "Afslut demo" : "Exit demo") : t.logout}</span>
              <span className="menuHint">
                {isDemo
                  ? lang === "da"
                    ? "Sletter demo-data og logger ud"
                    : "Deletes demo data and signs out"
                  : lang === "da"
                    ? "Log ud af appen"
                    : "Sign out of the app"}
              </span>
            </span>
          </button>

          {!isDemo && (
            <button
              className="menuItem menuItemDanger"
              onClick={() => {
                onDeleteAccount();
                onClose();
              }}
            >
              <Icon name="delete_forever" />
              <span className="menuText">
                <span className="menuTitle">{t.deleteAccount}</span>
                <span className="menuHint">
                  {lang === "da" ? "Sletter data permanent" : "Deletes data permanently"}
                </span>
              </span>
            </button>
          )}
        </div>
      </aside>

      {showAiConsent && (
        <AiAssistantConsent lang={lang} onConfirm={confirmAiAssistant} onClose={() => setShowAiConsent(false)} />
      )}
    </>
  );
}
