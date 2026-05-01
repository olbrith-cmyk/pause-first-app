import { useEffect, useRef } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

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
  onMyVisits
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
}) {
  const t = useTranslation(lang);
  const menuRef = useRef<HTMLDivElement>(null);

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
    window.open(
      "https://chatgpt.com/g/g-695a7a9e17d08191bd88b76d39f9e54f-pause-firsttm",
      "_blank"
    );
  };

  const items = [
    {
      icon: "pets",
      title: t.myPets,
      hint: lang === "da" ? "Profiler og noter" : "Profiles and notes",
      onClick: onMyPets
    },
    {
      icon: "event_note",
      title: lang === "da" ? "Mine besøg" : "My visits",
      hint: lang === "da" ? "Kladder, Visit Briefs og noter" : "Drafts, Visit Briefs, and notes",
      onClick: onMyVisits
    },
    {
      icon: "auto_awesome",
      title: t.aiAssistant,
      hint: lang === "da" ? "Åbner i en ny fane" : "Opens in a new tab",
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
              <span className="menuTitle">{t.logout}</span>
              <span className="menuHint">
                {lang === "da" ? "Log ud af appen" : "Sign out of the app"}
              </span>
            </span>
          </button>

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
        </div>
      </aside>
    </>
  );
}
