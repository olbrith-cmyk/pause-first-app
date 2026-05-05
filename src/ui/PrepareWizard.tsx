import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { CurrentStatus, TriState, Visit } from "../firestore";
import { addVisit, getVisitById, updateVisit, deleteVisitFully } from "../firestore";
import TriToggle from "./TriToggle";

type Props = {
  lang: Lang;
  userId: string;
  mode?: "prepare";
  petId: string;
  petName: string;
  visitId?: string; // if provided, edit this existing visit
  onClose: () => void;
  onComplete?: () => void | Promise<void>;

  // NEW: lets the wizard tell the parent where to go after close/delete/save
  onNavigateAfterClose?: (target: "home" | "myVisits") => void;
};

function makeEmptyStatus(): CurrentStatus {
  const normal: TriState = "normal";
  return {
    appetite: normal,
    drinking: normal,
    energy: normal,
    toileting: normal,
    gi: normal,
    breathing: normal,
    mobilityPain: normal,
    skinEars: normal,
    otherNotes: ""
  };
}

export default function PrepareWizard({
  lang,
  userId,
  petId,
  petName,
  visitId: visitIdProp,
  onClose,
  onComplete,
  onNavigateAfterClose
}: Props) {
  const t = useTranslation(lang);

  // Wizard state
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"wizard" | "preview" | "done">("wizard");

  // Visit draft state
  const [visitId, setVisitId] = useState<string | null>(null);
  const didInit = useRef(false);
  const autosaveTimer = useRef<number | null>(null);

  const [draft, setDraft] = useState<Visit>({
    userId,
    petId,
    visitDate: "",
    mainConcern: "",
    whenStart: "",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    otherDetails: "",
    previousTreatment: "",
    questionsVet: "",
    currentStatus: makeEmptyStatus(),
    status: "draft"
  });

  const isDraft = (draft.status ?? "final") === "draft";

  // Centralized close behavior (Choice #3)
  const closeToMyVisits = () => {
    onClose();
    onNavigateAfterClose?.("myVisits");
  };

  const closeToHome = () => {
    onClose();
    onNavigateAfterClose?.("home");
  };

  // Init: either load existing visit (edit) or create new draft (new)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      try {
        // EDIT EXISTING
        if (visitIdProp) {
          const existing = await getVisitById(userId, visitIdProp);
          if (!existing) {
            alert(lang === "da" ? "Kunne ikke finde besøget." : "Could not find that visit.");
            closeToMyVisits();
            return;
          }

          setVisitId(visitIdProp);
          setDraft({
            ...existing,
            userId,
            petId,
            currentStatus: existing.currentStatus ?? makeEmptyStatus(),
            otherDetails: existing.otherDetails ?? "",
            status: existing.status ?? "final"
          });
          return;
        }

        // NEW DRAFT
        const ref = await addVisit({ ...draft, status: "draft" });
        setVisitId(ref.id);
      } catch (e: any) {
        alert(t.error + ": " + (e?.message ?? String(e)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave (keep status as-is; do not force final -> draft)
  useEffect(() => {
    if (!visitId) return;

    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);

    autosaveTimer.current = window.setTimeout(async () => {
      try {
        const nextStatus = draft.status ?? "final";
        await updateVisit(visitId, { ...draft, status: nextStatus });
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 500);

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [draft, visitId]);

  // Step model (fixed flow + preview)
  const stepData = useMemo(
    () => [
      {
        title: lang === "da" ? "Besøgsdato" : "Visit date",
        desc:
          lang === "da"
            ? "Vælg datoen for besøget (kan ændres senere)"
            : "Choose the visit date (you can change it later)",
        ok: !!draft.visitDate
      },
      {
        title: lang === "da" ? "Hovedbekymring" : "Main concern",
        desc:
          lang === "da"
            ? "Hvad er den vigtigste grund til besøget?"
            : "What is the main reason for the visit?",
        ok: !!draft.mainConcern?.trim()
      },
      {
        title: lang === "da" ? "Hvornår startede det?" : "When did it start?",
        desc: lang === "da" ? "Hjælp dyrlægen med tidslinjen" : "Help your vet understand the timeline",
        ok: true
      },
      {
        title: lang === "da" ? "Hvordan udvikler det sig?" : "How is it changing?",
        desc: lang === "da" ? "Bedre, værre eller det samme?" : "Better, worse, or the same?",
        ok: true
      },
      {
        title: lang === "da" ? "Mønstre eller udløsende faktorer?" : "Patterns / triggers",
        desc: lang === "da" ? "Sker det på bestemte tidspunkter?" : "Does it happen at certain times?",
        ok: true
      },
      {
        title: lang === "da" ? "Status lige nu" : "How is your animal doing right now?",
        desc:
          lang === "da"
            ? "Vælg 'Som normalt', 'Anderledes' eller 'Ikke relevant/ved ikke' og tilføj evt. en kort note."
            : "Choose 'As usual', 'Different', or 'N/A / not sure' and optionally add a short note.",
        ok: true
      },
      {
        title: lang === "da" ? "Hvad ellers er anderledes?" : "What else is different?",
        desc:
          lang === "da"
            ? "Andre ændringer du har lagt mærke til"
            : "Any other changes you've noticed",
        ok: true
      },
      {
        title: lang === "da" ? "Andre detaljer (fakta til dyrlægen)" : "Other details (facts for the vet)",
        desc:
          lang === "da"
            ? "Hjælpsomme observationer (ikke spørgsmål). Gem spørgsmål til næste trin."
            : "Helpful observations (not questions). Save questions for the next step.",
        ok: true
      },
      {
        title: lang === "da" ? "Hvad har du prøvet allerede?" : "What have you tried already?",
        desc: lang === "da" ? "Medicin, tilskud, ændringer derhjemme" : "Medication, supplements, home changes",
        ok: true
      },
      {
        title: lang === "da" ? "Topspørgsmål til dyrlægen" : "Top questions for the vet",
        desc: lang === "da" ? "Hvad vil du gerne have svar på?" : "What do you want answered?",
        ok: true
      }
    ],
    [draft.visitDate, draft.mainConcern, lang]
  );

  const isLastWizardStep = step === stepData.length - 1;

  const handleNext = () => {
    if (!stepData[step].ok) return;
    if (isLastWizardStep) setMode("preview");
    else setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (mode === "preview") {
      setMode("wizard");
      setStep(stepData.length - 1);
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!visitId) {
      alert(
        lang === "da"
          ? "Kladde oprettes stadig. Prøv igen om et øjeblik."
          : "Still preparing your draft. Please try again in a moment."
      );
      return;
    }

    setSaving(true);
    try {
      await updateVisit(visitId, { ...draft, status: "final" });
      if (onComplete) await onComplete();
      setMode("done");
      setSaving(false);

      // After saving final: go to My Visits (choice #3)
      onNavigateAfterClose?.("myVisits");
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!visitId) return;

    const ok = window.confirm(
      lang === "da"
        ? "Vil du slette denne kladde? Dette kan ikke fortrydes."
        : "Delete this draft? This cannot be undone."
    );
    if (!ok) return;

    try {
      await deleteVisitFully(userId, visitId);
      // After delete: go to My Visits (choice #3)
      closeToMyVisits();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  const handleEmail = () => alert("Email feature coming soon!");
  const handlePdf = () => alert("PDF download feature coming soon!");

  const triLabel = (v: TriState) => {
    if (lang === "da") {
      if (v === "normal") return "Som normalt";
      if (v === "changed") return "Anderledes";
      return "Ikke relevant / ved ikke";
    }
    if (v === "normal") return "As usual";
    if (v === "changed") return "Different";
    return "N/A / not sure";
  };

  const buildVisitBriefText = () => {
    const cs = draft.currentStatus;

    const lines: string[] = [];
    lines.push(`${lang === "da" ? "Kæledyr" : "Pet"}: ${petName}`);
    if (draft.visitDate) lines.push(`${lang === "da" ? "Besøgsdato" : "Visit date"}: ${draft.visitDate}`);
    lines.push("");

    if (draft.mainConcern) {
      lines.push(lang === "da" ? "Hovedbekymring:" : "Main concern:");
      lines.push(draft.mainConcern);
      lines.push("");
    }

    if (draft.whenStart) {
      lines.push(lang === "da" ? "Hvornår startede det?" : "When did it start?");
      lines.push(draft.whenStart);
      lines.push("");
    }

    if (draft.howProgressing) {
      lines.push(lang === "da" ? "Hvordan udvikler det sig?" : "How is it changing?");
      lines.push(draft.howProgressing);
      lines.push("");
    }

    if (draft.patterns) {
      lines.push(lang === "da" ? "Mønstre / triggere:" : "Patterns / triggers:");
      lines.push(draft.patterns);
      lines.push("");
    }

    if (cs) {
      lines.push(lang === "da" ? "Status lige nu:" : "Current status:");
      lines.push(
        `${lang === "da" ? "Appetit" : "Appetite"}: ${triLabel(cs.appetite)}${
          cs.appetiteNotes ? ` — ${cs.appetiteNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Drikker" : "Drinking"}: ${triLabel(cs.drinking)}${
          cs.drinkingNotes ? ` — ${cs.drinkingNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Energi" : "Energy"}: ${triLabel(cs.energy)}${
          cs.energyNotes ? ` — ${cs.energyNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Toiletvaner" : "Toileting"}: ${triLabel(cs.toileting)}${
          cs.toiletingNotes ? ` — ${cs.toiletingNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Mave/tarm" : "GI"}: ${triLabel(cs.gi)}${cs.giNotes ? ` — ${cs.giNotes}` : ""}`
      );
      lines.push(
        `${lang === "da" ? "Vejrtrækning" : "Breathing"}: ${triLabel(cs.breathing)}${
          cs.breathingNotes ? ` — ${cs.breathingNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Bevægelse/smerte" : "Mobility/pain"}: ${triLabel(cs.mobilityPain)}${
          cs.mobilityPainNotes ? ` — ${cs.mobilityPainNotes}` : ""
        }`
      );
      lines.push(
        `${lang === "da" ? "Hud/ører" : "Skin/ears"}: ${triLabel(cs.skinEars)}${
          cs.skinEarsNotes ? ` — ${cs.skinEarsNotes}` : ""
        }`
      );
      if (cs.otherNotes) lines.push(`${lang === "da" ? "Andre noter" : "Other notes"}: ${cs.otherNotes}`);
      lines.push("");
    }

    if (draft.associatedSigns) {
      lines.push(lang === "da" ? "Hvad ellers er anderledes?" : "What else is different?");
      lines.push(draft.associatedSigns);
      lines.push("");
    }

    const od = draft.otherDetails ?? "";
    if (od.trim()) {
      lines.push(lang === "da" ? "Andre detaljer (fakta til dyrlægen):" : "Other details (facts for the vet):");
      lines.push(od);
      lines.push("");
    }

    if (draft.previousTreatment) {
      lines.push(lang === "da" ? "Hvad har du prøvet allerede?" : "What have you tried already?");
      lines.push(draft.previousTreatment);
      lines.push("");
    }

    if (draft.questionsVet) {
      lines.push(lang === "da" ? "Topspørgsmål til dyrlægen:" : "Top questions for the vet:");
      lines.push(draft.questionsVet);
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      const text = buildVisitBriefText();
      await navigator.clipboard.writeText(text);
      alert(lang === "da" ? "Kopieret!" : "Copied!");
    } catch {
      alert(lang === "da" ? "Kunne ikke kopiere på denne enhed." : "Could not copy on this device.");
    }
  };

  const renderCurrentStatusRow = (label: string, key: keyof CurrentStatus, notesKey: keyof CurrentStatus) => {
    const cs = draft.currentStatus ?? makeEmptyStatus();
    const value = (cs[key] as TriState) ?? "normal";
    const notesValue = (cs[notesKey] as string) ?? "";

    return (
      <div
        style={{
          padding: 12,
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 10,
          background: "white"
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>

        <TriToggle
          lang={lang}
          value={value}
          onChange={(next) => {
            setDraft({
              ...draft,
              currentStatus: {
                ...cs,
                [key]: next
              }
            });
          }}
        />

        <label className="label" style={{ marginTop: 10 }}>
          {lang === "da" ? "Noter (valgfrit)" : "Notes (optional)"}
          <textarea
            className="textarea"
            value={notesValue}
            onChange={(e) => {
              setDraft({
                ...draft,
                currentStatus: {
                  ...cs,
                  [notesKey]: e.target.value
                }
              });
            }}
            rows={2}
            placeholder={
              lang === "da"
                ? "Skriv kort hvis noget er anderledes..."
                : "Add a short note if something is different..."
            }
          />
        </label>
      </div>
    );
  };

  const ReviewLine = ({ label, value }: { label: string; value: string }) => {
    if (!value || value.trim() === "") return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: 14 }}>{label}</p>
        <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>{value}</p>
      </div>
    );
  };

  const renderStatusReview = () => {
    const cs = draft.currentStatus;
    if (!cs) return null;

    const Row = ({ label, value, notes }: { label
