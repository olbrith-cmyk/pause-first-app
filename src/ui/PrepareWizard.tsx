import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit } from "../firestore";
import { addVisit, getUserPets } from "../firestore";

type Props = {
  lang: Lang;
  userId: string;
  defaultPetId?: string;
  onCancel: () => void;
  onComplete: () => void;
};

export default function PrepareWizard({ lang, userId, defaultPetId, onCancel, onComplete }: Props) {
  const t = useTranslation(lang);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petName, setPetName] = useState("");
  const [mode, setMode] = useState<"wizard" | "save">("wizard");

  const [selectedPetId, setSelectedPetId] = useState(defaultPetId ?? "");
  const [petMode, setPetMode] = useState<"new" | "existing" | "unassigned">(
    defaultPetId ? "existing" : "existing"
  );

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

  // If defaultPetId is provided, pre-fill pet name too (nice UX)
  useEffect(() => {
    if (!defaultPetId) return;
    const p = pets.find((x) => x.id === defaultPetId);
    if (p?.name) setPetName(p.name);
  }, [defaultPetId, pets]);

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
        petId: petMode === "existing" ? selectedPetId : ""
      };
      await addVisit(visit);
      onComplete();
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
              onChange={(e)
