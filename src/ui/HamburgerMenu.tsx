import { useEffect, useRef } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const menuItems = [
    {
      icon: "🐾",
      label: t.myPets,
      onClick: onMyPets,
      color: "#0066cc"
    },
    {
      icon: "🗓️",
      label: lang === "da" ? "Mine besøg" : "My Visits",
      onClick: onMyVisits,
      color: "#0066cc"
    },
    {
      icon: "🤖",
      label: t.aiAssistant,
      onClick: () => {
        window.open(
          "https://chatgpt.com/g/g-695a7a9e17d08191bd88b76d39f9e54f-pause-firsttm",
          "_blank"
        );
        onClose();
      },
      color: "#388e3c"
    },
    {
      icon: "🚨",
      label: t.emergencyGuide,
      onClick: onEmergencyGuide,
      color: "#d32f2f"
    },
    {
      icon: "⚖️",
      label: t.medicalDisclaimer,
      onClick: onMedicalDisclaimer,
      color: "#1976d2"
    },
    {
      icon: "📋",
      label: lang === "da" ? "Privatlivspolitik" : "Privacy Policy",
      onClick: onPrivacyPolicy,
      color: "#1976d2"
    }
  ];

  const bottomItems = [
    {
      icon: "🚪",
      label: t.logout,
      onClick: onLogout,
      color: "#0066cc"
    },
    {
      icon: "❌",
      label: t.deleteAccount,
      onClick: onDeleteAccount,
      color: "#cc0000"
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="menuOverlay"
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 999
          }}
        />
      )}

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="menuPanel"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "70%",
          maxWidth: 280,
          height: "100vh",
          backgroundColor: "#fff",
          zIndex: 1000,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          overflowY: "auto",
          boxShadow: isOpen ? "2px 0 8px rgba(0, 0, 0, 0.15)" : "none",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Close Button */}
        <div style={{ padding: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#333"
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Menu Items */}
        <div style={{ flex: 1, padding: "0 16px" }}>
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                color: item.color,
                padding: "14px 12px",
                marginBottom: "8px",
                borderRadius: "6px",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

        {/* Bottom Menu Items */}
        <div style={{ padding: "0 16px 16px 16px" }}>
          {bottomItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                color: item.color,
                padding: "14px 12px",
                marginBottom: idx === bottomItems.length - 1 ? 0 : "8px",
                borderRadius: "6px",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
