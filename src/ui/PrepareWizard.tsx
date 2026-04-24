import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit } from "../firestore";
import { addVisit, getUserPets } from "../firestore";

type Props = {
  lang: Lang;
  userId: string;
  petId?: string;
  petName?: string;
  onClose: () => void;
  onComplete?: () => void | Promise<void>;
};

export default function PrepareWizard({ lang, userId, petId, petName: initialPetName, onClose, onComplete }: Props) {
  const t = useTranslation(lang);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petName, setPetName] = useState(initialPetName ?? "");
  const [mode, setMode] = useState<"wizard" | "save">("wizard");

  const [selectedPetId, setSelectedPetId] = useState(petId ?? "");

  const [draft, setDraft] = useState<Visit>({
    userId,
    petId: petId ?? "",
    visitDate: "",
    mainConcern: "",
    whenStart: "",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    previousTreatment: "",
    questionsVet: ""
  });

  useEffect(() => {
    getUserPets(userId).then(setPets);
  }, [userId]);

  const stepData = [
    {
      title: "Basics",
      desc: "Tell us about your pet and today's visit",
      ok: petName.trim() && draft.visitDate && draft.mainConcern
    },
    { title: "When did it start?", desc: "Help your vet understand the timeline", ok: true },
    { title: "How is it progressing?", desc: "Is it getting better, worse, or staying the same?", ok: true },
    { title: "Any patterns or triggers?", desc: "Does it happen at certain times?", ok: true },
    { title: "What else is different?", desc: "Any other changes you've noticed", ok: true },
    { title: "Medications & home remedies", desc: "What have you already tried?", ok: true },
    { title: "Questions for the vet", desc: "What do you want to ask?", ok: true }
  ];

  const isLast = step === stepData.length - 1;

  const handleNext = () => {
    if (!stepData[step].ok) return;
    if (isLast) setMode("save");
    else setStep(step + 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const visit: Visit = {
        ...draft,
        userId,
        petId: selectedPetId
      };
      await addVisit(visit);
      
      // Call onComplete if provided
      if (onComplete) {
        await onComplete();
      }
      
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
            <label className="label">
              Pet's name
              <input
                className="input"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="e.g., Luna"
              />
            </label>

            <label className="label" style={{ marginTop: 12 }}>
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
              placeholder="e.g., gave ibuprofen, tried rest, applied ice"
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
    return (
  <div className="modal" style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <div className="modalOverlay" onClick={onClose} />
      <div className="modalContent">
        <div className="modalHeader">
          <h3 style={{ margin: 0 }}>Prepare for Visit</h3>
          <button className="btnClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalBody">
          {mode === "wizard" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <h4>{stepData[step].title}</h4>
                <p style={{ color: "var(--textMuted)", fontSize: "14px" }}>{stepData[step].desc}</p>
              </div>

              {renderStep()}

              <div className="row" style={{ marginTop: 20, gap: "8px" }}>
                {step > 0 && (
                  <button className="btn btnSecondary" onClick={() => setStep(step - 1)}>
                    ← Back
                  </button>
                )}
                <button
                  className="btn btnPrimary"
                  onClick={handleNext}
                  disabled={!stepData[step].ok}
                >
                  {isLast ? "Review" : "Next →"}
                </button>
                <button className="btn btnSecondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {mode === "save" && (
            <>
              <h4>Review & Save</h4>
              <div style={{ backgroundColor: "var(--bgAlt)", padding: "12px", borderRadius: "8px", marginBottom: 16 }}>
                <p><strong>Pet:</strong> {petName}</p>
                <p><strong>Visit Date:</strong> {draft.visitDate}</p>
                <p><strong>Main Concern:</strong> {draft.mainConcern}</p>
              </div>

              <div className="row" style={{ gap: "8px" }}>
                <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Visit"}
                </button>
                <button className="btn btnSecondary" onClick={() => setMode("wizard")}>
                  Back to Edit
                </button>
                <button className="btn btnSecondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
