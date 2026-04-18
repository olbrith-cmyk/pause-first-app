import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

export function EmergencyGuide({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>{t.emergencyGuide}</h2>
          <button className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="alert alertWarn">
            Pause First™ is a preparation tool for non-emergency vet visits. It helps you
            organize information about symptoms that started gradually or seem mild. Always trust
            your instincts — when in doubt, call your vet or the nearest emergency clinic
            immediately.
          </div>

          <h3>Common Signs of a
