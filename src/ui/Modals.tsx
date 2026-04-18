import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: any;
  onClose: () => void;
}) {
  return (
    <div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button className="modalClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

export function EmergencyGuide({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  return (
    <ModalShell title={t.emergencyGuide} onClose={onClose}>
      <div className="alert alertInfo">
        Pause First™ is a preparation tool for non-emergency vet visits. It helps you organize
        information about symptoms that started gradually or seem mild. Always trust your instincts
        — when in doubt, call your vet or the nearest emergency clinic immediately.
      </div>

      <h3>Common Signs of a Veterinary Emergency</h3>
      <ul className="list">
        <li><strong>Difficulty breathing or choking</strong> — Labored, shallow, or rapid breathing</li>
        <li><strong>Loss of consciousness or collapse</strong> — Unresponsiveness or sudden falling</li>
        <li><strong>Severe trauma</strong> — Hit by car, deep wounds, or major injuries</li>
        <li><strong>Inability to urinate or defecate</strong> — Straining without producing waste</li>
        <li><strong>Suspected poisoning or toxin exposure</strong> — Known ingestion of toxic substances</li>
        <li><strong>Uncontrollable vomiting or diarrhea with blood</strong> — Persistent or bloody discharge</li>
        <li><strong>Eye injury or sudden eye problem</strong> — Squinting, pawing, redness, swelling, discharge, cloudy/blue appearance</li>
        <li><strong>Signs of severe pain</strong> — Whimpering, aggression, or inability to move</li>
        <li><strong>Pale or blue gums</strong> — Poor circulation or respiratory distress</li>
        <li><strong>Heat stroke symptoms</strong> — Excessive drooling, panting, or lethargy</li>
        <li><strong>Inability to move or paralysis</strong> — Loss of limb function or coordination</li>
        <li><strong>Seizures</strong> — Uncontrolled convulsions or muscle spasms</li>
      </ul>

      <p className="muted">When in doubt, contact your vet or the nearest emergency clinic immediately.</p>

      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>{t.close}</button>
      </div>
    </ModalShell>
  );
}

export function MedicalDisclaimer({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  return (
    <ModalShell title={t.medicalDisclaimer} onClose={onClose}>
      <p>
        Pause First™ is a preparation tool only—not a substitute for veterinary advice. Always
        consult your veterinarian. In emergencies, contact your vet or animal clinic immediately.
      </p>
      <p className="muted">
        This tool is designed to help you organize your thoughts and observations before a vet
        visit. It does not diagnose, treat, or replace professional veterinary medical advice,
        diagnosis, or treatment.
      </p>

      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>{t.close}</button>
      </div>
    </ModalShell>
  );
}
