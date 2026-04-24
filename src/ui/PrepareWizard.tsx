import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit } from "../firestore";
import { addVisit, getUserPets } from "../firestore";

type Props = {
  lang: Lang;
  userId: string;
  onCancel: () => void;
  onComplete: () => void;
};

export default function PrepareWizard({ lang, userId, onCancel, onComplete }: Props) {
  const t = useTranslation(lang);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [petSaveMode, setPetSaveMode] = useState<"new" | "existing" | "unassigned" | null>(null);

  const [petName, setPetName] = useState("");

  const [draft, setDraft] = useState<Visit>({
    userId,
    petId: "",
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
    const loadPets = async () => {
      const list = await getUserPets(userId);
      setPets(list);
    };
    loadPets();
  }, [userId]);

  const steps = [
    {
      title: "Basics",
      description: "Tell us about your pet and today's visit",
      fields: (
        <>
          <label className="label">Pet's name</label>
          <input
            className="input"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="e.g., Luna, Fido"
          />
          <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            You can create a new pet or use an existing one at the end.
          </p>

          <label className="label" style={{ marginTop: 12 }}>
            Visit date
          </label>
          <input
            className="input"
            type="date"
            value={draft.visitDate}
            onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })}
          />

          <label className="label" style={{ marginTop: 12 }}>
            Main concern
          </label>
          <input
            className="input"
            value={draft.mainConcern}
            onChange={(e) => setDraft({ ...draft, mainConcern: e.target.value })}
            placeholder="e.g., limping, not eating, vomiting"
          />
        </>
      ),
      canContinue: () =>
        petName.trim().length > 0 &&
        draft.visitDate.trim().length > 0 &&
        draft.mainConcern.trim().length > 0
    },
    {
      title: "When did it start?",
      description: "Help your vet understand the timeline",
      fields: (
        <>
          <label className="label">When did it start?</label>
          <textarea
            className="textarea"
            value={draft.whenStart}
            onChange={(e) => setDraft({ ...draft, whenStart: e.target.value })}
            placeholder="e.g., 3 days ago, this morning"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    },
    {
      title: "How is it progressing?",
      description: "Is it getting better, worse, or staying the same?",
      fields: (
        <>
          <label className="label">How is it progressing?</label>
          <textarea
            className="textarea"
            value={draft.howProgressing}
            onChange={(e) => setDraft({ ...draft, howProgressing: e.target.value })}
            placeholder="Is it getting worse, better, or staying the same?"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    },
    {
      title: "Any patterns or triggers?",
      description: "Does it happen at certain times or after certain activities?",
      fields: (
        <>
          <label className="label">Any patterns or triggers?</label>
          <textarea
            className="textarea"
            value={draft.patterns}
            onChange={(e) => setDraft({ ...draft, patterns: e.target.value })}
            placeholder="e.g., time of day, after eating, during exercise"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    },
    {
      title: "What else is different?",
      description: "Any other changes you've noticed",
      fields: (
        <>
          <label className="label">What else is different?</label>
          <textarea
            className="textarea"
            value={draft.associatedSigns}
            onChange={(e) => setDraft({ ...draft, associatedSigns: e.target.value })}
            placeholder="e.g., behavior changes, appetite, energy level, bathroom habits"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    },
    {
      title: "Medications & home remedies",
      description: "What have you already tried?",
      fields: (
        <>
          <label className="label">Medications & home remedies</label>
          <textarea
            className="textarea"
            value={draft.previousTreatment}
            onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })}
            placeholder="e.g., name, dose, how often... or rest, diet change, supplements"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    },
    {
      title: "Questions for the vet",
      description: "What do you want to ask?",
      fields: (
        <>
          <label className="label">Questions for the vet</label>
          <textarea
            className="textarea"
            value={draft.questionsVet}
            onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })}
            placeholder="e.g., prognosis, diet changes, when to follow up"
            rows={3}
          />
        </>
      ),
      canContinue: () => true
    }
  ];

  const isLast = step === steps.length - 1;

  const goNext = () => {
    if (!steps[step].canContinue()) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    // On last step, show save confirmation
    setPetSaveMode("existing");
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalPetId = "";

      if (petSaveMode === "existing" && selectedPetId) {
        finalPetId = selectedPetId;
      }

      const visitData: Visit = {
        userId,
        petId: finalPetId,
        visitDate: draft.visitDate,
        mainConcern: draft.mainConcern,
        whenStart: draft.whenStart,
        howProgressing: draft.howProgressing,
        patterns: draft.patterns,
        associatedSigns: draft.associatedSigns,
        previousTreatment: draft.previousTreatment,
        questionsVet: draft.questionsVet
      };

      await addVisit(visitData);
      onComplete();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  // Save confirmation screen
  if (petSaveMode !== null) {
    return (
      <>
        <div
          onClick={onCancel}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            zIndex: 1999
          }}
        />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "92%",
            maxWidth: 520,
            maxHeight: "90vh",
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h3 style={{ margin: 0 }}>You're all set! ✨</h3>
            <button
              onClick={onCancel}
              disabled={saving}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#999"
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <p style={{ marginTop: 0 }}>Save this visit for {petName}?</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: petSaveMode === "new" ? "#f0f7ff" : "transparent"
                }}
              >
                <input
                  type="radio"
                  name="petMode"
                  checked={petSaveMode === "new"}
                  onChange={() => setPetSaveMode("new")}
                />
                <span>Create new pet profile (Save as new)</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: petSaveMode === "existing" ? "#f0f7ff" : "transparent"
                }}
              >
                <input
                  type="radio"
                  name="petMode"
                  checked={petSaveMode === "existing"}
                  onChange={() => setPetSaveMode("existing")}
                />
                <span>Add to existing pet</span>
              </label>

              {petSaveMode === "existing" && pets.length > 0 && (
                <select
                  className="input"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  style={{ marginLeft: 36 }}
                >
                  <option value="">— Choose a pet —</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: petSaveMode === "unassigned" ? "#f0f7ff" : "transparent"
                }}
              >
                <input
                  type="radio"
                  name="petMode"
                  checked={petSaveMode === "unassigned"}
                  onChange={() => setPetSaveMode("unassigned")}
                />
                <span>Save without pet (Unassigned visit)</span>
              </label>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              gap: 10
            }}
          >
            <button
              className="btnSecondary"
              onClick={() => {
                setPetSaveMode(null);
                setStep(steps.length - 1);
              }}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Back to edit
            </button>

            <button
              className="btnPrimary"
              onClick={handleSave}
              disabled={
                saving ||
                (petSaveMode === "existing" && !selectedPetId)
              }
            >
              {saving ? "Saving..." : "Save visit"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Wizard steps
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          zIndex: 1999
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          maxWidth: 520,
          maxHeight: "90vh",
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{t.prepareVisit}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Step {step + 1} of {steps.length}
            </div>
          </div>

          <button
            className="btn btnSecondary"
            onClick={onCancel}
            disabled={saving}
            type="button"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16, overflowY
