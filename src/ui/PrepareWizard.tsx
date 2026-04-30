import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { CurrentStatus, TriState, Visit } from "../firestore";
import { addVisit, getVisitById, updateVisit } from "../firestore";
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
  onComplete
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
            onClose();
            return;
          }

          setVisitId(visitIdProp);
          setDraft({
            ...existing,
            // ensure these are present for rendering
            userId,
            petId,
            currentStatus: existing.currentStatus ?? makeEmptyStatus(),
            otherDetails: (existing as any).otherDetails ?? "",
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
        title: lang === "da" ? "Mønstre eller triggere?" : "Patterns / triggers",
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
        title: lang === "da" ? "Andre detaljer til dyrlægen" : "Other details for the vet",
        desc:
          lang === "da"
            ? "Alt andet du vil sikre dig at nævne"
            : "Anything else you want to make sure you mention",
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
      // Finalize, but still editable later
      await updateVisit(visitId, { ...draft, status: "final" });
      if (onComplete) await onComplete();
      setMode("done");
      setSaving(false);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  const handleEmail = () => alert("Email feature coming soon!");
  const handlePdf = () => alert("PDF download feature coming soon!");

  const triLabel = (v: TriState) => {
    // TriState is: normal | changed | na
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

    const od = String((draft as any).otherDetails ?? "");
    if (od.trim()) {
      lines.push(lang === "da" ? "Andre detaljer til dyrlægen:" : "Other details for the vet:");
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

  const renderCurrentStatusRow = (
    label: string,
    key: keyof CurrentStatus,
    notesKey: keyof CurrentStatus
  ) => {
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

    const Row = ({
      label,
      value,
      notes
    }: {
      label: string;
      value: TriState;
      notes?: string;
    }) => {
      const hasNotes = !!notes && notes.trim() !== "";
      return (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
          <div style={{ fontSize: 14, marginTop: 2 }}>{triLabel(value)}</div>
          {hasNotes && (
            <div
              style={{
                fontSize: 13,
                color: "var(--textMuted)",
                marginTop: 2,
                whiteSpace: "pre-wrap"
              }}
            >
              {notes}
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        style={{
          backgroundColor: "var(--bgAlt)",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>{lang === "da" ? "Status lige nu" : "Current status"}</h4>

        <Row label={lang === "da" ? "Appetit" : "Appetite"} value={cs.appetite} notes={cs.appetiteNotes} />
        <Row label={lang === "da" ? "Drikker" : "Drinking"} value={cs.drinking} notes={cs.drinkingNotes} />
        <Row label={lang === "da" ? "Energi" : "Energy"} value={cs.energy} notes={cs.energyNotes} />
        <Row label={lang === "da" ? "Toiletvaner" : "Toileting"} value={cs.toileting} notes={cs.toiletingNotes} />
        <Row label={lang === "da" ? "Mave/tarm" : "GI"} value={cs.gi} notes={cs.giNotes} />
        <Row label={lang === "da" ? "Vejrtrækning" : "Breathing"} value={cs.breathing} notes={cs.breathingNotes} />
               <Row
          label={lang === "da" ? "Bevægelse/smerte" : "Mobility / pain"}
          value={cs.mobilityPain}
          notes={cs.mobilityPainNotes}
        />
        <Row label={lang === "da" ? "Hud/ører" : "Skin / ears"} value={cs.skinEars} notes={cs.skinEarsNotes} />

        {!!cs.otherNotes && cs.otherNotes.trim() !== "" && (
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--textMuted)", whiteSpace: "pre-wrap" }}>
            <strong>{lang === "da" ? "Andre noter:" : "Other notes:"}</strong> {cs.otherNotes}
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              {lang === "da" ? "Kæledyr:" : "Pet:"} <strong>{petName}</strong>
            </div>

            <label className="label">
              {lang === "da" ? "Besøgsdato" : "Visit date"}
              <input
                className="input"
                type="date"
                value={draft.visitDate}
                onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })}
              />
            </label>
          </>
        );

      case 1:
        return (
          <label className="label">
            {lang === "da" ? "Hovedbekymring" : "Main concern"}
            <textarea
              className="textarea"
              value={draft.mainConcern}
              onChange={(e) => setDraft({ ...draft, mainConcern: e.target.value })}
              placeholder={
                lang === "da"
                  ? "f.eks. halter, spiser ikke, opkast, adfærdsændring"
                  : "e.g., limping, not eating, vomiting, behavior change"
              }
              rows={4}
            />
          </label>
        );

      case 2:
        return (
          <label className="label">
            {lang === "da" ? "Hvornår startede det?" : "When did it start?"}
            <textarea
              className="textarea"
              value={draft.whenStart}
              onChange={(e) => setDraft({ ...draft, whenStart: e.target.value })}
              placeholder={lang === "da" ? "f.eks. for 3 dage siden, i morges" : "e.g., 3 days ago, this morning"}
              rows={4}
            />
          </label>
        );

      case 3:
        return (
          <label className="label">
            {lang === "da" ? "Hvordan udvikler det sig?" : "How is it changing?"}
            <textarea
              className="textarea"
              value={draft.howProgressing}
              onChange={(e) => setDraft({ ...draft, howProgressing: e.target.value })}
              placeholder={
                lang === "da"
                  ? "f.eks. bliver værre, det samme, bliver bedre"
                  : "e.g., getting worse, staying the same, improving"
              }
              rows={4}
            />
          </label>
        );

      case 4:
        return (
          <label className="label">
            {lang === "da" ? "Mønstre eller udløsende faktorer?" : "Patterns / triggers"}
            <textarea
              className="textarea"
              value={draft.patterns}
              onChange={(e) => setDraft({ ...draft, patterns: e.target.value })}
              placeholder={lang === "da" ? "f.eks. efter mad, værre om morgenen" : "e.g., happens after meals, worse in the morning"}
              rows={4}
            />
          </label>
        );

      case 5:
        return (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>
              {lang === "da"
                ? "Vælg det, der passer bedst. Tilføj en kort note hvis du vil."
                : "Choose what fits best. Add a short note if you want."}
            </div>

            {renderCurrentStatusRow(lang === "da" ? "Appetit" : "Appetite", "appetite", "appetiteNotes")}
            {renderCurrentStatusRow(lang === "da" ? "Drikker" : "Drinking", "drinking", "drinkingNotes")}
            {renderCurrentStatusRow(lang === "da" ? "Energi" : "Energy", "energy", "energyNotes")}
            {renderCurrentStatusRow(lang === "da" ? "Toiletvaner" : "Toileting", "toileting", "toiletingNotes")}
            {renderCurrentStatusRow(lang === "da" ? "Mave/tarm" : "GI (vomiting/diarrhea)", "gi", "giNotes")}
            {renderCurrentStatusRow(lang === "da" ? "Vejrtrækning" : "Breathing", "breathing", "breathingNotes")}
            {renderCurrentStatusRow(
              lang === "da" ? "Bevægelse/smerte" : "Mobility / pain",
              "mobilityPain",
              "mobilityPainNotes"
            )}
            {renderCurrentStatusRow(lang === "da" ? "Hud/ører" : "Skin / ears", "skinEars", "skinEarsNotes")}

            <label className="label" style={{ marginTop: 6 }}>
              {lang === "da" ? "Andre noter (valgfrit)" : "Other notes (optional)"}
              <textarea
                className="textarea"
                value={(draft.currentStatus?.otherNotes as string) ?? ""}
                onChange={(e) => {
                  const cs = draft.currentStatus ?? makeEmptyStatus();
                  setDraft({
                    ...draft,
                    currentStatus: {
                      ...cs,
                      otherNotes: e.target.value
                    }
                  });
                }}
                rows={3}
                placeholder={
                  lang === "da"
                    ? "Alt andet du synes er vigtigt lige nu..."
                    : "Anything else you think is important right now..."
                }
              />
            </label>
          </>
        );

      case 6:
        return (
          <label className="label">
            {lang === "da" ? "Hvad ellers er anderledes?" : "What else is different?"}
            <textarea
              className="textarea"
              value={draft.associatedSigns}
              onChange={(e) => setDraft({ ...draft, associatedSigns: e.target.value })}
              placeholder={
                lang === "da"
                  ? "f.eks. ændret appetit, adfærd, energi"
                  : "e.g., appetite changes, behavior changes, energy level"
              }
              rows={4}
            />
          </label>
        );

      case 7:
        return (
          <>
            <label className="label">
              {lang === "da" ? "Andre detaljer til dyrlægen" : "Other details for the vet"}
              <textarea
                className="textarea"
                value={String((draft as any).otherDetails ?? "")}
                onChange={(e) => setDraft({ ...(draft as any), otherDetails: e.target.value } as Visit)}
                placeholder={
                  lang === "da"
                    ? "f.eks. foderændringer, rejse, nye godbidder, løbetid, mulig eksponering, timing, videoer du har... (ikke spørgsmål, der kommer et trin til spørgsmål senere)
                    : "e.g., diet changes, travel, new treats, heat cycle, possible exposure, timing, videos you have... (not questions, there is a step for that later)
                }
                rows={4}
              />
            </label>

            <div className="muted" style={{ marginTop: 8 }}>
              {lang === "da"
                ? "Tip: Hvis du har et foto eller en video til dyrlægen, kan du tilføje det i Preview."
                : "Tip: If you have a photo or video to show your vet, you can add it in Preview."}
            </div>
          </>
        );

      case 8:
        return (
          <label className="label">
            {lang === "da" ? "Hvad har du prøvet allerede?" : "What have you tried already?"}
            <textarea
              className="textarea"
              value={draft.previousTreatment}
              onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })}
              placeholder={
                lang === "da"
                  ? "f.eks. hvad du har prøvet hjemme. Skriv desuden AL medicin/tilskud - også selvom det er for noget helt andet (allergimedicin, gigtmedicin, beroligende, vitaminer). Hvis du kan: dosis + hvornår det sidst blev givet."
                  : "e.g., what you tried at home. Also write ALL medication/supplements - even if it's for something else (allergy meds, arthritis meds, calming meds, vitamins). If you can: dose + when last given."
              }
              rows={4}
            />
          </label>
        );

      case 9:
        return (
          <label className="label">
            {lang === "da" ? "Topspørgsmål til dyrlægen" : "Top questions for the vet"}
            <textarea
              className="textarea"
              value={draft.questionsVet}
              onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })}
              placeholder={
                lang === "da"
                  ? "f.eks. Er operation nødvendig? Hvor lang tid tager det?"
                  : "e.g., Is surgery needed? How long will recovery take?"
              }
              rows={4}
            />
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        className="modalOverlay"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
      />
      <div
        className="modalContent"
        style={{
          position: "relative",
          zIndex: 10000,
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <div
          className="modalHeader"
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>
              {mode === "wizard" && (lang === "da" ? "Forbered besøg" : "Prepare for Visit")}
              {mode === "preview" && (lang === "da" ? "Preview" : "Preview")}
              {mode === "done" && (lang === "da" ? "Klar!" : "Your prep is ready!")}
            </h3>

            {mode === "wizard" && (
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--textMuted)" }}>
                {lang === "da" ? "Trin" : "Step"} {step + 1} {lang === "da" ? "af" : "of"} {stepData.length}
              </p>
            )}
          </div>

          <button
            className="btnClose"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <div className="modalBody" style={{ padding: "16px", overflowY: "auto", maxHeight: "calc(90vh - 120px)" }}>
          {/* MODE 1: WIZARD */}
          {mode === "wizard" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 6px 0" }}>{stepData[step].title}</h4>
                <p style={{ color: "var(--textMuted)", fontSize: 14, margin: 0 }}>{stepData[step].desc}</p>
              </div>
              {renderStep()}
            </>
          )}

          {/* MODE 2: PREVIEW */}
          {mode === "preview" && (
            <>
              <div
                style={{
                  backgroundColor: "var(--bgAlt)",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12
                }}
              >
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>{lang === "da" ? "Kæledyr:" : "Pet:"}</strong> {petName}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>{lang === "da" ? "Besøgsdato:" : "Visit date:"}</strong> {draft.visitDate}
                </p>
              </div>

              <button className="btn btnSecondary" onClick={handleCopy} style={{ width: "100%", marginBottom: 12 }}>
                {lang === "da" ? "Kopiér Visit Brief" : "Copy Visit Brief"}
              </button>

              {renderStatusReview()}

              <div
                style={{
                  backgroundColor: "var(--bgAlt)",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16
                }}
              >
                <ReviewLine label={lang === "da" ? "Hovedbekymring" : "Main concern"} value={draft.mainConcern} />
                <ReviewLine label={lang === "da" ? "Hvornår startede det?" : "When did it start?"} value={draft.whenStart} />
                <ReviewLine label={lang === "da" ? "Hvordan udvikler det sig?" : "How is it changing?"} value={draft.howProgressing} />
                <ReviewLine label={lang === "da" ? "Mønstre / triggere" : "Patterns / triggers"} value={draft.patterns} />
                <ReviewLine label={lang === "da" ? "Hvad ellers er anderledes?" : "What else is different?"} value={draft.associatedSigns} />
                <ReviewLine label={lang === "da" ? "Andre detaljer til dyrlægen" : "Other details for the vet"} value={String((draft as any).otherDetails ?? "")} />
                <ReviewLine label={lang === "da" ? "Hvad har du prøvet allerede?" : "What have you tried already?"} value={draft.previousTreatment} />
                <ReviewLine label={lang === "da" ? "Topspørgsmål til dyrlægen" : "Top questions for the vet"} value={draft.questionsVet} />
              </div>

              <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
                <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
                  {saving ? (lang === "da" ? "Gemmer..." : "Saving...") : lang === "da" ? "Gem besøg" : "Save visit"}
                </button>

                <button className="btn btnSecondary" onClick={handleEmail}>
                  {lang === "da" ? "Email til mig selv (kommer snart)" : "Email to myself (coming soon)"}
                </button>

                <button className="btn btnSecondary" onClick={handlePdf}>
                  {lang === "da" ? "Download som PDF (kommer snart)" : "Download as PDF (coming soon)"}
                </button>
              </div>
            </>
          )}

          {/* MODE 3: DONE */}
          {mode === "done" && (
            <>
              <div
                style={{
                  backgroundColor: "var(--bgAlt)",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16
                }}
              >
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>{lang === "da" ? "Gemt!" : "Saved!"}</strong>{" "}
                  {lang === "da" ? "Din forberedelse er gemt i appen." : "Your visit prep has been saved in the app."}
                </p>
                <p style={{ margin: 0, color: "var(--textMuted)", fontSize: 14 }}>
                  {lang === "da"
                    ? "Gå forberedt ind. Vær en partner i dit dyrs behandling."
                    : "Walk in prepared. Partner in your pet's care."}
                </p>
              </div>

              <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
                <button className="btn btnPrimary" onClick={onClose}>
                  {lang === "da" ? "Færdig" : "Done"} (Saved in app)
                </button>

                <button className="btn btnSecondary" onClick={handleEmail}>
                  {lang === "da" ? "Email til mig selv (kommer snart)" : "Email to myself (coming soon)"}
                </button>

                <button className="btn btnSecondary" onClick={handlePdf}>
                  {lang === "da" ? "Download som PDF (kommer snart)" : "Download as PDF (coming soon)"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          {(mode === "wizard" && step > 0) || mode === "preview" ? (
            <button className="btn btnSecondary" onClick={handleBack} style={{ flex: 0, minWidth: 80 }}>
              ← {lang === "da" ? "Tilbage" : "Back"}
            </button>
          ) : (
            <div style={{ flex: 0, minWidth: 80 }} />
          )}

          {mode === "wizard" && (
            <button className="btn btnPrimary" onClick={handleNext} disabled={!stepData[step].ok} style={{ flex: 1 }}>
              {isLastWizardStep ? (lang === "da" ? "Preview" : "Preview") : lang === "da" ? "Næste →" : "Next →"}
            </button>
          )}

          {mode === "preview" && (
            <button className="btn btnPrimary" onClick={onClose} style={{ flex: 1 }}>
              {lang === "da" ? "Luk" : "Close"}
            </button>
          )}

          {mode === "done" && (
            <button className="btn btnPrimary" onClick={onClose} style={{ flex: 1 }}>
              {lang === "da" ? "Luk" : "Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
                
