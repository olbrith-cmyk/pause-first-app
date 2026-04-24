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
  const [petName, setPetName] = useState("");
  const [mode, setMode] = useState<"wizard" | "save">("wizard");
  const [selectedPetId, setSelectedPetId] = useState("");
  const [petMode, setPetMode] = useState<"new" | "existing" | "unassigned">("existing");

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
      const visit: Visit = { ...draft, userId, petId: petMode === "existing" ? selectedPetId : "" };
      await addVisit(visit);
      onComplete();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  if (mode === "save") {
    return (
      <>
        <div onClick={onCancel} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 1999 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "92%", maxWidth: 800, backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.2)", zIndex: 2000, padding: 16 }}>
          <h3>Save visit for {petName}?</h3>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" name="mode" checked={petMode === "new"} onChange={() => setPetMode("new")} />
              Create new pet profile
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" name="mode" checked={petMode === "existing"} onChange={() => setPetMode("existing")} />
              Add to existing pet
            </label>
            {petMode === "existing" && (
              <select className="input" value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)}>
                <option value="">— Choose a pet —</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" name="mode" checked={petMode === "unassigned"} onChange={() => setPetMode("unassigned")} />
              Save without pet
            </label>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="btn btnSecondary" onClick={() => setMode("wizard")} disabled={saving}>
              Back
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btnPrimary" onClick={handleSave} disabled={saving || (petMode === "existing" && !selectedPetId)}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </>
    );
  }
 
        const steps = useMemo(
  () => [
    {
      title: "Basics",
      description: "Tell us about your pet and today's visit",
      canContinue: true,
      body: (
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
        </>
      )
    },
    {
      title: "What's the main concern?",
      description: "Tell us what brought you to the vet today",
      canContinue: true,
      body: (
        <label className="label">
          Main concern
          <textarea
            className="textarea"
            value={draft.mainConcern}
            onChange={(e) => setDraft({ ...draft, mainConcern: e.target.value })}
            placeholder="e.g., limping, not eating, vomiting, behavior change"
            rows={6}
          />
        </label>
      )
    },
    {
      title: "When did it start?",
      description: "Help your vet understand the timeline",
      canContinue: true,
      body: (
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
      )
    },
    // ... rest of steps stay the same
      case 2:
        return (
          <label className="label">
            How is it progressing?
            <textarea className="textarea" value={draft.howProgressing} onChange={(e) => setDraft({ ...draft, howProgressing: e.target.value })} placeholder="Getting worse, better, or same?" rows={4} />
          </label>
        );
      case 3:
        return (
          <label className="label">
            Any patterns or triggers?
            <textarea className="textarea" value={draft.patterns} onChange={(e) => setDraft({ ...draft, patterns: e.target.value })} placeholder="e.g., after eating, during exercise" rows={4} />
          </label>
        );
      case 4:
        return (
          <label className="label">
            What else is different?
            <textarea className="textarea" value={draft.associatedSigns} onChange={(e) => setDraft({ ...draft, associatedSigns: e.target.value })} placeholder="Behavior, appetite, energy, bathroom habits" rows={4} />
          </label>
        );
      case 5:
        return (
          <label className="label">
            Medications & home remedies
            <textarea className="textarea" value={draft.previousTreatment} onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })} placeholder="Name, dose, frequency..." rows={4} />
          </label>
        );
      case 6:
        return (
          <label className="label">
            Questions for the vet
            <textarea className="textarea" value={draft.questionsVet} onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })} placeholder="e.g., prognosis, diet changes" rows={4} />
          </label>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 1999 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "92%", maxWidth: 520, maxHeight: "90vh", backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.2)", zIndex: 2000, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{t.prepareVisit}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Step {step + 1} of {stepData.length}
            </div>
          </div>
          <button className="btn btnSecondary" onClick={onCancel} disabled={saving} style={{ padding: "6px 12px" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
          <div className="panel">
            <div className="panelHeader">
              <h4 style={{ margin: 0 }}>{stepData[step].title}</h4>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>{stepData[step].desc}</p>
            <div style={{ marginTop: 12 }}>{renderStep()}</div>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #e0e0e0", display: "flex", gap: 10 }}>
          <button className="btn btnSecondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || saving}>
            Back
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btnPrimary" onClick={handleNext} disabled={!stepData[step].ok || saving}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
