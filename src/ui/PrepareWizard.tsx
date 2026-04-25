import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Visit } from "../firestore";
import { addVisit } from "../firestore";

type Props = {
  lang: Lang;
  userId: string;
  petId: string;
  petName: string;
  onClose: () => void;
  onComplete?: () => void | Promise<void>;
};

export default function PrepareWizard({ lang, userId, petId, petName, onClose, onComplete }: Props) {
  const t = useTranslation(lang);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"wizard" | "save">("wizard");

  const [draft, setDraft] = useState<Visit>({
    userId,
    petId,
    visitDate: "",
    mainConcern: "",
    whenStart: "",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    previousTreatment: "",
    questionsVet: ""
  });

  const stepData = [
    { title: "Basics", desc: "Tell us about today's visit", ok: !!(draft.visitDate && draft.mainConcern) },
    { title: "When did it start?", desc: "Help your vet understand the timeline", ok: true },
    { title: "How is it progressing?", desc: "Better, worse, or the same?", ok: true },
    { title: "Any patterns or triggers?", desc: "Does it happen at certain times?", ok: true },
    { title: "What else is different?", desc: "Any other changes you've noticed", ok: true },
    { title: "Medications & home remedies", desc: "What have you already tried?", ok: true },
    { title: "Questions for the vet", desc: "What do you want to ask?", ok: true }
  ];

  const isLast = step === stepData.length - 1;

  const handleNext = () => {
    if (!stepData[step].ok) return;
    if (isLast) setMode("save");
    else setStep((s) => s + 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await addVisit(draft);
      if (onComplete) await onComplete();
      onClose();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              Pet: <strong>{petName}</strong>
            </div>

            <label className="label">
              Visit date
              <input
                className="input"
                type="date"
                value={draft.visitDate}
                onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })}
              />
            </label>

            <label className="label" style={{ marginTop: 12 }}>
              Main concern
              <textarea
                className="textarea"
                value={draft.mainConcern}
                onChange={(e) => setDraft({ ...draft, mainConcern: e.target.value })}
                placeholder="e.g., limping, not eating, vomiting, behavior change"
                rows={4}
              />
            </label>
          </>
        );

      case 1:
        return (
          <label className="label">
            When did it start?
            <textarea
              className="textarea"
              value={draft.whenStart}
              onChange={(e) => setDraft({ ...draft, whenStart: e.target.value })}
              placeholder="e.g., 3 days ago, this morning"
              rows={4}
            />
          </label>
        );

      case 2:
        return (
          <label className="label">
            How is it progressing?
            <textarea
              className="textarea"
              value={draft.howProgressing}
              onChange={(e) => setDraft({ ...draft, howProgressing: e.target.value })}
              placeholder="e.g., getting worse, staying the same, improving"
              rows={4}
            />
          </label>
        );

      case 3:
        return (
          <label className="label">
            Any patterns or triggers?
            <textarea
              className="textarea"
              value={draft.patterns}
              onChange={(e) => setDraft({ ...draft, patterns: e.target.value })}
              placeholder="e.g., happens after meals, worse in the morning"
              rows={4}
            />
          </label>
        );

      case 4:
        return (
          <label className="label">
            What else is different?
            <textarea
              className="textarea"
              value={draft.associatedSigns}
              onChange={(e) => setDraft({ ...draft, associatedSigns: e.target.value })}
              placeholder="e.g., appetite changes, behavior changes, energy level"
              rows={4}
            />
          </label>
        );

      case 5:
        return (
          <label className="label">
            Medications & home remedies
            <textarea
              className="textarea"
              value={draft.previousTreatment}
              onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })}
              placeholder="e.g., what you tried at home"
              rows={4}
            />
          </label>
        );

      case 6:
        return (
          <label className="label">
            Questions for the vet
            <textarea
              className="textarea"
              value={draft.questionsVet}
              onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })}
              placeholder="e.g., Is surgery needed? How long will recovery take?"
              rows={4}
            />
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modalOverlay" onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div className="modalContent" style={{ position: "relative", zIndex: 10000, backgroundColor: "white", borderRadius: "8px", maxWidth: "500px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div className="modalHeader" style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Prepare for Visit</h3>
          <button className="btnClose" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div className="modalBody" style={{ padding: "16px", overflowY: "auto", maxHeight: "calc(90vh - 80px)" }}>
          {mode === "wizard" ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 6px 0" }}>{stepData[step].title}</h4>
                <p style={{ color: "var(--textMuted)", fontSize: 14, margin: 0 }}>{stepData[step].desc}</p>
              </div>

              {renderStep()}

              <div className="row" style={{ marginTop: 20, gap: 8 }}>
                {step > 0 && (
                  <button className="btn btnSecondary" onClick={() => setStep((s) => s - 1)}>
                    ← Back
                  </button>
                )}
                <button className="btn btnPrimary" onClick={handleNext} disabled={!stepData[step].ok}>
                  {isLast ? "Review" : "Next →"}
                </button>
                <button className="btn btnSecondary" onClick={onClose}>
                  {t.cancel}
                </button>
              </div>
            </>
          ) : (
            <>
              <h4>Review & Save</h4>
              <div style={{ backgroundColor: "var(--bgAlt)", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Pet:</strong> {petName}
                </p>
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Visit Date:</strong> {draft.visitDate}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Main Concern:</strong> {draft.mainConcern}
                </p>
              </div>

              <div className="row" style={{ gap: 8 }}>
                <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Visit"}
                </button>
                <button className="btn btnSecondary" onClick={() => setMode("wizard")}>
                  Back to Edit
                </button>
                <button className="btn btnSecondary" onClick={onClose}>
                  {t.cancel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
