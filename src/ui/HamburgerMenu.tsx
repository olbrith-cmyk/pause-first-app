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
  onMedicalDisclaimer
}: {
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onEmergencyGuide: () => void;
  onMedicalDisclaimer: () => void;
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
          boxShadow: isOpen ? "2px 0 8px rgba(0, 0, 0, 0.15)" : "none"
        }}
      >
        <div style={{ padding: "16px" }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              marginBottom: "16px",
              color: "#333"
            }}
          >
            ✕
          </button>

          {/* Menu Items */}
          <div className="stack" style={{ gap: "8px" }}>
            <button
              onClick={() => {
                onEmergencyGuide();
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                color: "#0066cc",
                textDecoration: "underline",
                padding: "12px 0"
              }}
            >
              {t.emergencyGuide}
            </button>

            <button
              onClick={() => {
                onMedicalDisclaimer();
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                color: "#0066cc",
                textDecoration: "underline",
                padding: "12px 0"
              }}
            >
              {t.medicalDisclaimer}
            </button>

            <a
              href="https://chatgpt.com/g/g-695a7a9e17d08191bd88b76d39f9e54f-pause-firsttm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              style={{
                display: "block",
                fontSize: "16px",
                color: "#0066cc",
                textDecoration: "underline",
                padding: "12px 0"
              }}
            >
              {t.aiAssistant}
            </a>

            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #ddd" }} />

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                color: "#0066cc",
                textDecoration: "underline",
                padding: "12px 0"
              }}
            >
              {t.logout}
            </button>

            <button
              onClick={() => {
                onDeleteAccount();
                onClose();
              }}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                color: "#cc0000",
                textDecoration: "underline",
                padding: "12px 0"
              }}
            >
              {t.deleteAccount}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
