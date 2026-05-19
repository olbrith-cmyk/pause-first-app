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
  const [showCurrentStatus, setShowCurrentStatus] = useState(false);

  // Visit draft state
  const [visitId, setVisitId] = useState<string | null>(null);
  const didInit = useRef(false);
  const autosaveTimer = useRef<number | null>(null);

  const [draft, setDraft] = useState<Visit>(
   {
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
  status: "draft",

  // Step 7 additions (kept compatible even if Visit type isn't updated yet)
  ...( {
    medicationsSupplements: "",
    knownConditions: "",
    recentTests: ""
  } as any )
} );

  const isDraft = (draft.status ?? "final") === "draft";

  // Centralized close behavior (Choice #3)
  const closeToMyVisits = () => {
    onClose();
    onNavigateAfterClose?.("myVisits");
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
        title: lang === "da" ? "Tidslinje" : "Timeline",
        desc:
          lang === "da"
            ? "Hvornår startede det — og hvordan har det ændret sig?"
            : "When did it start — and how has it changed since then?",
        ok: true
      },
      {
        title: lang === "da" ? "Mønstre & triggere" : "Patterns & triggers",
        desc:
          lang === "da"
            ? "Sker det på bestemte tidspunkter eller i bestemte situationer?"
            : "Does it happen at certain times or in certain situations?",
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
        title: lang === "da" ? "Andre detaljer (fakta til dyrlægen)" : "Other details (facts for the vet)",
        desc:
          lang === "da"
            ? "Hjælpsomme observationer (ikke spørgsmål). Gem spørgsmål til næste trin."
            : "Helpful observations (not questions). Save questions for the next step.",
        ok: true
      },
      {
        title:
          lang === "da"
            ? "Medicin, tilstande, tests + hvad du har prøvet"
            : "Meds, conditions, tests + what you’ve tried",
        desc:
          lang === "da"
            ? "Skriv medicin/tilskud, kendte tilstande, nylige tests og hvad du allerede har prøvet hjemme."
            : "List meds/supplements, known conditions, recent tests, and anything you’ve already tried at home.",
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
    if (isLastWizardStep) {
  setShowCurrentStatus(false);
  setMode("preview");
}
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

  const [savingDraft, setSavingDraft] = useState(false);

const handleSaveDraftAndClose = async () => {
  if (!visitId) {
    alert(
      lang === "da"
        ? "Kladde oprettes stadig. Prøv igen om et øjeblik."
        : "Still preparing your draft. Please try again in a moment."
    );
    return;
  }

  setSavingDraft(true);
  try {
    // Force a write right now (even though autosave exists)
    await updateVisit(visitId, { ...draft, status: "draft" });

    // Close wizard and go to My Visits
    closeToMyVisits();
  } catch (e: any) {
    alert(t.error + ": " + (e?.message ?? String(e)));
  } finally {
    setSavingDraft(false);
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

const getStatusCounts = () => {
  const cs = draft.currentStatus ?? makeEmptyStatus();

  const keys: Array<keyof CurrentStatus> = [
    "appetite",
    "drinking",
    "energy",
    "toileting",
    "gi",
    "breathing",
    "mobilityPain",
    "skinEars"
  ];

  let different = 0;
  let notSure = 0;
  let asUsual = 0;

  for (const k of keys) {
    const v = (cs[k] as TriState) ?? "normal";
    if (v === "changed") different++;
    else if (v === "na") notSure++;
    else asUsual++;
  }

  return { different, notSure, asUsual };
};

const counts = getStatusCounts();
  
const buildVisitBriefText = () => {
  const cs = draft.currentStatus ?? makeEmptyStatus();

  const lines: string[] = [];

  // Header
  lines.push(lang === "da" ? "VISIT BRIEF (Ejer-observationer)" : "VISIT BRIEF (Owner observations)");
  lines.push(`${lang === "da" ? "Kæledyr" : "Pet"}: ${petName}`);
  if (draft.visitDate) lines.push(`${lang === "da" ? "Besøgsdato" : "Visit date"}: ${draft.visitDate}`);
  lines.push("");

  // ## Chief concern
  if (draft.mainConcern?.trim()) {
    lines.push(lang === "da" ? "## Hovedbekymring" : "## Chief concern");
    lines.push(draft.mainConcern.trim());
    lines.push("");
  }

  // ## Timeline / change (only show filled lines)
  const started = (draft.whenStart ?? "").trim();
  const change = (draft.howProgressing ?? "").trim();
  if (started || change) {
    lines.push(lang === "da" ? "## Tidslinje / ændring" : "## Timeline / change");
    if (started) lines.push(`**${lang === "da" ? "Start" : "Started"}:** ${started}`);
    if (change) lines.push(`**${lang === "da" ? "Udvikling" : "Change"}:** ${change}`);
    lines.push("");
  }

  // ## Current status (exceptions first)
  const statusItems: Array<{
    key: keyof CurrentStatus;
    labelDa: string;
    labelEn: string;
    notesKey: keyof CurrentStatus;
  }> = [
    { key: "appetite", labelDa: "Appetit", labelEn: "Appetite", notesKey: "appetiteNotes" },
    { key: "drinking", labelDa: "Drikker", labelEn: "Drinking", notesKey: "drinkingNotes" },
    { key: "energy", labelDa: "Energi", labelEn: "Energy", notesKey: "energyNotes" },
    { key: "toileting", labelDa: "Toiletvaner", labelEn: "Toileting", notesKey: "toiletingNotes" },
    { key: "gi", labelDa: "Mave/tarm", labelEn: "GI", notesKey: "giNotes" },
    { key: "breathing", labelDa: "Vejrtrækning", labelEn: "Breathing", notesKey: "breathingNotes" },
    { key: "mobilityPain", labelDa: "Bevægelse/smerte", labelEn: "Mobility/pain", notesKey: "mobilityPainNotes" },
    { key: "skinEars", labelDa: "Hud/ører", labelEn: "Skin/ears", notesKey: "skinEarsNotes" }
  ];

  const different: string[] = [];
  const notSure: string[] = [];
  const asUsual: string[] = [];

  for (const it of statusItems) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const label = lang === "da" ? it.labelDa : it.labelEn;

    const line = notes ? `- **${label}:** ${notes}` : `- **${label}**`;

    if (v === "changed") different.push(line);
    else if (v === "na") notSure.push(line);
    else asUsual.push(label);
  }

  const otherNotes = ((cs.otherNotes as string) ?? "").trim();

  // Only show section if anything exists (it usually will)
  if (different.length || notSure.length || asUsual.length || otherNotes) {
    lines.push(lang === "da" ? "## 3) Status lige nu (hurtigt tjek)" : "## 3) Current status (quick check)");

    if (different.length) {
      lines.push(lang === "da" ? "**Anderledes:**" : "**Different:**");
      lines.push(...different);
      lines.push("");
    }

    if (notSure.length) {
      lines.push(lang === "da" ? "**Ikke relevant / ved ikke:**" : "**N/A / not sure:**");
      lines.push(...notSure);
      lines.push("");
    }

    if (asUsual.length) {
      lines.push(
        `${lang === "da" ? "**Som normalt:**" : "**As usual:**"} ${asUsual.join(", ")}`
      );
      lines.push("");
    }
  }

 const additionalNotes = ((draft.currentStatus?.otherNotes as string) ?? "").trim();
if (additionalNotes) {
  lines.push(lang === "da" ? "## Yderligere noter (ejer-observationer)" : "## Additional notes (owner observations)");
  lines.push(additionalNotes);
  lines.push("");
} 
  
  // ## Patterns / triggers
  if (draft.patterns?.trim()) {
    lines.push(lang === "da" ? "##  Mønstre / triggere" : "##  Patterns / triggers");
    lines.push(draft.patterns.trim());
    lines.push("");
  }

  // ## Meds / supplements
  const meds = (((draft as any).medicationsSupplements as string) ?? "").trim();
  if (meds) {
    lines.push(lang === "da" ? "## Medicin / tilskud" : "## Meds / supplements");
    lines.push(meds);
    lines.push("");
  }

  // ## Known conditions (vet-diagnosed)
  const cond = (((draft as any).knownConditions as string) ?? "").trim();
  if (cond) {
    lines.push(lang === "da" ? "## Kendte tilstande (diagnosticeret)" : "## Known conditions (vet-diagnosed)");
    lines.push(cond);
    lines.push("");
  }

  // ## Recent tests/results
  const tests = (((draft as any).recentTests as string) ?? "").trim();
  if (tests) {
    lines.push(lang === "da" ? "## Nylige tests/resultater" : "## Recent tests/results");
    lines.push(tests);
    lines.push("");
  }

  // ## Other details (facts)
  const od = (draft.otherDetails ?? "").trim();
  if (od) {
    lines.push(lang === "da" ? "## Andre detaljer (fakta)" : "## Other details (facts)");
    lines.push(od);
    lines.push("");
  }

  // ## Top questions
  if (draft.questionsVet?.trim()) {
    lines.push(lang === "da" ? "## Topspørgsmål til dyrlægen" : "## Top questions for the vet");
    lines.push(draft.questionsVet.trim());
    lines.push("");
  }

  // Trust footer
  lines.push(
    lang === "da"
      ? "Ikke medicinsk rådgivning. Denne brief afspejler dine observationer. Dit dyrlægeteam guider diagnose og behandling."
      : "Not medical advice. This brief reflects your observations. Your veterinary team will guide diagnosis and treatment."
  );

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

      const ReviewLine = ({
  label,
  value,
  hideLabel
}: {
  label: string;
  value: string;
  hideLabel?: boolean;
}) => {
  if (!value || value.trim() === "") return null;

  return (
    <div style={{ marginBottom: 14 }}>
      {!hideLabel && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            color: "rgba(20,40,60,0.65)",
            fontWeight: 700,
            marginBottom: 6
          }}
        >
          {label}
        </div>
      )}

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          color: "rgba(15,25,35,0.92)"
        }}
      >
        {value}
      </div>
    </div>
  );
};
  
  // Notebook-professional preview styles
  const notebookPageStyle: any = {
    backgroundColor: "#fffdf7",
    border: "1px solid rgba(20, 40, 60, 0.12)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 24px rgba(20, 40, 60, 0.08)",
    position: "relative",
    overflow: "hidden"
  };

  const notebookLinesStyle: any = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    opacity: 0.18,
    backgroundImage:
      "repeating-linear-gradient(to bottom, rgba(40,70,110,0.18) 0px, rgba(40,70,110,0.18) 1px, transparent 1px, transparent 28px)"
  };

  const notebookMarginStyle: any = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 18,
    width: 2,
    background: "rgba(220, 80, 90, 0.22)",
    pointerEvents: "none"
  };

  const sectionLabelStyle: any = {
  fontSize: 12,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "rgba(20,40,60,0.72)",
  fontWeight: 900,
  margin: "18px 0 8px 0"
};
  
  const renderStatusReview = () => {
  const cs = draft.currentStatus ?? makeEmptyStatus();

  const items: Array<{
    key: keyof CurrentStatus;
    labelDa: string;
    labelEn: string;
    notesKey: keyof CurrentStatus;
  }> = [
    { key: "appetite", labelDa: "Appetit", labelEn: "Appetite", notesKey: "appetiteNotes" },
    { key: "drinking", labelDa: "Drikker", labelEn: "Drinking", notesKey: "drinkingNotes" },
    { key: "energy", labelDa: "Energi", labelEn: "Energy", notesKey: "energyNotes" },
    { key: "toileting", labelDa: "Toiletvaner", labelEn: "Toileting", notesKey: "toiletingNotes" },
    { key: "gi", labelDa: "Mave/tarm", labelEn: "GI", notesKey: "giNotes" },
    { key: "breathing", labelDa: "Vejrtrækning", labelEn: "Breathing", notesKey: "breathingNotes" },
    { key: "mobilityPain", labelDa: "Bevægelse/smerte", labelEn: "Mobility/pain", notesKey: "mobilityPainNotes" },
    { key: "skinEars", labelDa: "Hud/ører", labelEn: "Skin/ears", notesKey: "skinEarsNotes" }
  ];

  const different: Array<{ label: string; notes: string }> = [];
  const notSure: Array<{ label: string; notes: string }> = [];
  const asUsual: string[] = [];

  for (const it of items) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const label = lang === "da" ? it.labelDa : it.labelEn;

    if (v === "changed") different.push({ label, notes });
    else if (v === "na") notSure.push({ label, notes });
    else asUsual.push(label);
  }

  const Section = ({ title, children }: { title: string; children: any }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );

  const Bullet = ({ label, notes }: { label: string; notes?: string }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 14 }}>
        <strong>{label}</strong>
        {notes ? <span style={{ color: "rgba(15,25,35,0.92)" }}>: {notes}</span> : null}
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "rgba(20,40,60,0.04)",
        border: "1px solid rgba(20,40,60,0.10)",
        padding: 12,
        borderRadius: 12
      }}
    >
      {different.length > 0 && (
        <Section title={lang === "da" ? "Anderledes" : "Different"}>
          {different.map((x, idx) => (
            <Bullet key={`diff-${idx}`} label={x.label} notes={x.notes} />
          ))}
        </Section>
      )}

      {notSure.length > 0 && (
        <Section title={lang === "da" ? "Ikke relevant / ved ikke" : "N/A / not sure"}>
          {notSure.map((x, idx) => (
            <Bullet key={`na-${idx}`} label={x.label} notes={x.notes} />
          ))}
        </Section>
      )}

      {asUsual.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{lang === "da" ? "Som normalt" : "As usual"}</div>
          <div style={{ fontSize: 14, color: "rgba(15,25,35,0.92)" }}>{asUsual.join(", ")}</div>
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
          <>
            <label className="label">
              {lang === "da" ? "Hvornår lagde du først mærke til det?" : "When did you first notice this?"}
              <textarea
                className="textarea"
                value={draft.whenStart}
                onChange={(e) => setDraft({ ...draft, whenStart: e.target.value })}
                placeholder={
                  lang === "da"
                    ? "F.eks. i tirsdags efter en lang gåtur, i morges, for 2–3 dage siden..."
                    : "E.g., Tuesday evening after a long walk, this morning, 2–3 days ago..."
                }
                rows={4}
              />
            </label>

            <div style={{ height: 14 }} />

            <label className="label">
              {lang === "da" ? "Hvordan har det ændret sig siden da?" : "How has it changed since then?"}
              <textarea
                className="textarea"
                value={draft.howProgressing}
                onChange={(e) => setDraft({ ...draft, howProgressing: e.target.value })}
                placeholder={
                  lang === "da"
                    ? "F.eks. værre om morgenen, lidt bedre efter hvile, mere hyppigt..."
                    : "E.g., worse in the mornings, slightly better after rest, more frequent..."
                }
                rows={4}
              />
            </label>
          </>
        );

      case 3:
        return (
          <label className="label">
            {lang === "da" ? "Mønstre & triggere" : "Patterns & triggers"}
            <textarea
              className="textarea"
              value={draft.patterns}
              onChange={(e) => setDraft({ ...draft, patterns: e.target.value })}
              placeholder={
                lang === "da"
                  ? "F.eks. værre efter mad, kun på trapper, oftere om natten..."
                  : "E.g., worse after meals, only on stairs, more frequent at night..."
              }
              rows={4}
            />
            <div className="muted" style={{ marginTop: 8 }}>
              {lang === "da"
                ? "Hvis der ikke er nogen mønstre, kan du lade feltet stå tomt."
                : "If there are no patterns, you can leave this blank."}
            </div>
          </label>
        );

      case 4:
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
              {lang === "da" ? "Andre ændringer / noter (valgfrit)" : "Other changes / notes (optional)"}
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
                placeholder={lang === "da" ? "Andre ændringer du har lagt mærke til..." : "Any other changes you've noticed..."}
              />
            </label>
          </>
        );

      case 5:
        return (
          <>
            <label className="label">
              {lang === "da" ? "Andre detaljer (fakta til dyrlægen)" : "Other details (facts for the vet)"}
              <textarea
                className="textarea"
                value={draft.otherDetails ?? ""}
                onChange={(e) => setDraft({ ...draft, otherDetails: e.target.value })}
                placeholder={
                  lang === "da"
                    ? "F.eks. foderændringer, rejse, nye godbidder, løbetid, mulig eksponering, timing, videoer du har... (ikke spørgsmål)"
                    : "E.g., new food/treats, travel, boarding, heat cycle, possible exposure, timing, videos you have... (not questions)"
                }
                rows={4}
              />
            </label>

            <div className="muted" style={{ marginTop: 8 }}>
              {lang === "da" ? "Tip: Du kan tilføje fotos/videoer i Preview." : "Tip: You can attach photos/videos in Preview."}
            </div>
          </>
        );

      case 6:
        return (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              {lang === "da"
                ? "Husk: Inkludér al medicin/tilskud — også selvom det er for noget helt andet."
                : "Remember: Include all meds/supplements — even if it’s for something else."}
            </div>

            <label className="label">
              {lang === "da" ? "Medicin & tilskud" : "Meds & supplements"}
              <textarea
                className="textarea"
                value={((draft as any).medicationsSupplements as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, medicationsSupplements: e.target.value } as any)}
                placeholder={
                  lang === "da"
                    ? "Navn, dosis, hvor ofte, hvornår startet (inkl. vitaminer)"
                    : "Name, dose, how often, when started (include vitamins)"
                }
                rows={4}
              />
            </label>

            <div style={{ height: 14 }} />

            <label className="label">
              {lang === "da" ? "Kendte tilstande at nævne? (valgfrit)" : "Known conditions to mention? (optional)"}
              <div className="muted" style={{ marginTop: 6 }}>
                {lang === "da"
                  ? "Kun tilstande din dyrlæge har diagnosticeret (f.eks. gigt, diabetes)."
                  : "Only conditions your vet has diagnosed (e.g., arthritis, diabetes)."}
              </div>
              <input
                className="input"
                value={((draft as any).knownConditions as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, knownConditions: e.target.value } as any)}
                placeholder={lang === "da" ? "F.eks. Gigt (2019), allergi, CKD stadie 2" : "E.g., Arthritis (2019), allergies, CKD stage 2"}
              />
            </label>

            <div style={{ height: 14 }} />

            <label className="label">
              {lang === "da" ? "Nylige tests/resultater? (valgfrit)" : "Recent tests/results? (optional)"}
              <div className="muted" style={{ marginTop: 6 }}>
                {lang === "da"
                  ? "Blodprøver, røntgen, urinprøve, ultralyd — ca. dato hvis du kan."
                  : "Bloodwork, X-rays, urine tests, ultrasound — include approximate date if you can."}
              </div>
              <textarea
                className="textarea"
                value={((draft as any).recentTests as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, recentTests: e.target.value } as any)}
                placeholder={
                  lang === "da"
                    ? "F.eks. Blodprøver marts 2026 (normale), røntgen i sidste uge"
                    : "E.g., Bloodwork March 2026 (normal), X-rays last week"
                }
                rows={3}
              />
            </label>

            <div style={{ height: 14 }} />

            <h4 style={{ margin: "6px 0 8px 0" }}>
              {lang === "da" ? "Har du prøvet noget hjemme allerede?" : "Any home remedies or treatments already tried?"}
            </h4>

            <label className="label">
              {lang === "da" ? "Hvad har du prøvet allerede?" : "What have you tried already?"}
              <textarea
                className="textarea"
                value={draft.previousTreatment}
                onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })}
                placeholder={lang === "da" ? "F.eks. ro, diætændring, skånekost, hvile, varme/kulde..." : "E.g., rest, diet change, bland diet, heat/cold..."}
                rows={4}
              />
            </label>
          </>
        );

      case 7:
        return (
          <label className="label">
            {lang === "da" ? "Vigtigste spørgsmål til dyrlægen" : "Top questions for the vet"}
            <textarea
              className="textarea"
              value={draft.questionsVet}
              onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })}
              placeholder={
                lang === "da"
                  ? "F.eks. Hvad er den mest sandsynlige årsag? Hvad er næste skridt? Hvornår skal jeg kontakte jer igen?"
                  : "E.g., What’s the most likely cause? What’s the next step? When should I contact you again?"
              }
              rows={4}
            />
          </label>
        );
  
    default:
        return null;
    }
  };

  // Modal: use your global modal styles for consistent scrolling
  return (
    <div className="modalOverlay" onClick={closeToMyVisits}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ flex: 1 }}>
            <h3 className="modalTitle" style={{ margin: 0 }}>
              {mode === "wizard" && (lang === "da" ? "Forbered besøg" : "Prepare for Visit")}
              {mode === "preview" && (lang === "da" ? "Gennemse & gem" : "Review & save")}
              {mode === "done" && (lang === "da" ? "Klar!" : "Your prep is ready!")}
            </h3>

            {mode === "wizard" && (
              <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "var(--muted)" }}>
                {lang === "da" ? "Trin" : "Step"} {step + 1} {lang === "da" ? "af" : "of"} {stepData.length}
              </p>
            )}
          </div>

          <button className="modalClose" onClick={closeToMyVisits} aria-label={lang === "da" ? "Luk" : "Close"}>
            ✕
          </button>
        </div>

        <div className="modalBody">
          {/* MODE 1: WIZARD */}
          {mode === "wizard" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 6px 0" }}>{stepData[step].title}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{stepData[step].desc}</p>
              </div>
              {renderStep()}
            </>
          )}

          {/* MODE 2: PREVIEW */}
{mode === "preview" && (
  <>
    {/* Title + subheading (moment of value) */}
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 4px 0" }}>{lang === "da" ? "Visit Brief" : "Visit Brief"}</h3>
      <div className="muted" style={{ fontSize: 14 }}>
        {lang === "da"
          ? "Klar til at dele med dit dyrlægeteam."
          : "Ready to share with your veterinary team."}
      </div>
    </div>

    {/* Header strip */}
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid var(--border)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>
            {lang === "da" ? "Kæledyr" : "Pet"}
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{petName}</div>
        </div>

        <div style={{ textAlign: "right" as const }}>
          <div className="muted" style={{ fontSize: 12 }}>
            {lang === "da" ? "Besøgsdato" : "Visit date"}
          </div>
          <div style={{ fontWeight: 700 }}>{draft.visitDate || "—"}</div>
        </div>
      </div>
    </div>

    {/* Primary action */}
    <button className="btn btnSecondary" onClick={handleCopy} style={{ width: "100%", marginBottom: 12 }}>
      {lang === "da" ? "Kopiér Visit Brief" : "Copy Visit Brief"}
    </button>

    {/* Notebook-professional brief */}
    <div style={{ ...notebookPageStyle, marginBottom: 12 }}>
      <div style={notebookLinesStyle} />
      <div style={notebookMarginStyle} />

     <div style={{ position: "relative", paddingLeft: 14 }}>
  {/* MAIN CONCERN */}
  <div style={{ ...sectionLabelStyle, marginTop: 0 }}>
    {lang === "da" ? "Hovedbekymring" : "Main concern"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Hovedbekymring" : "Main concern"}
    value={(draft.mainConcern ?? "").trim()}
    hideLabel
  />

  {/* TIMELINE */}
  {(((draft.whenStart ?? "").trim() !== "") || ((draft.howProgressing ?? "").trim() !== "")) && (
    <>
      <div style={sectionLabelStyle}>{lang === "da" ? "Tidslinje" : "Timeline"}</div>
      <ReviewLine
        label={lang === "da" ? "Tidslinje" : "Timeline"}
        value={[
          (draft.whenStart ?? "").trim()
            ? `${lang === "da" ? "Start" : "Started"}: ${draft.whenStart}`
            : "",
          (draft.howProgressing ?? "").trim()
            ? `${lang === "da" ? "Udvikling" : "Change"}: ${draft.howProgressing}`
            : ""
        ]
          .filter(Boolean)
          .join("\n")}
hideLabel

      />
    </>
  )}

  <div style={{ height: 1, background: "rgba(20,40,60,0.10)", margin: "14px 0" }} />

  {/* CURRENT STATUS (collapsible) */}
  <div style={sectionLabelStyle}>{lang === "da" ? "Nuværende status" : "Current status"}</div>
  
       <div style={{ marginBottom: 6 }}>
    <button
      type="button"
      className="btn btnSecondary"
      onClick={() => setShowCurrentStatus((v) => !v)}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px"
      }}
    >
      <span style={{ fontWeight: 700 }}>
        {lang === "da" ? "Vis status" : "Show status"}
      </span>
      <span style={{ fontWeight: 700 }}>
  {lang === "da" ? "Se status-oversigt" : "View status summary"}
</span>
    </button>

   {!showCurrentStatus && (
  <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
    {lang === "da"
      ? `Anderledes: ${counts.different} • Ved ikke: ${counts.notSure} • Som normalt: ${counts.asUsual}`
      : `Different: ${counts.different} • Not sure: ${counts.notSure} • As usual: ${counts.asUsual}`}
  </div>
)} 

    {showCurrentStatus && <div style={{ marginTop: 10 }}>{renderStatusReview()}</div>}
  </div>

  <div style={{ height: 1, background: "rgba(20,40,60,0.10)", margin: "14px 0" }} />

  {/* PATTERNS / TRIGGERS */}
  <div style={sectionLabelStyle}>{lang === "da" ? "Mønstre / triggere" : "Patterns / triggers"}</div>
  <ReviewLine
    label={lang === "da" ? "Mønstre / triggere" : "Patterns / triggers"}
    value={(draft.patterns ?? "").trim()}
hideLabel

  />

  {/* OTHER OBSERVATIONS (FACTS) */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Andre observationer (fakta)" : "Other observations (facts)"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Andre observationer (fakta)" : "Other observations (facts)"}
    value={(draft.otherDetails ?? "").trim()}
hideLabel

  />

       {(() => {
  const additionalNotes = ((draft.currentStatus?.otherNotes as string) ?? "").trim();
  if (!additionalNotes) return null;

  return (
    <>
      <div style={sectionLabelStyle}>
        {lang === "da" ? "Yderligere noter (ejer-observationer)" : "Additional notes (owner observations)"}
      </div>
      <ReviewLine
        label={lang === "da" ? "Yderligere noter (ejer-observationer)" : "Additional notes (owner observations)"}
        value={additionalNotes}
        hideLabel
      />
    </>
  );
})()}

  {/* MEDS & SUPPLEMENTS (CURRENT) */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Medicin & tilskud (aktuelt)" : "Meds & supplements (current)"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Medicin & tilskud (aktuelt)" : "Meds & supplements (current)"}
    value={((((draft as any).medicationsSupplements as string) ?? "").trim())}
hideLabel

  />

  {/* KNOWN CONDITIONS (VET-DIAGNOSED) */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Kendte tilstande (diagnosticeret)" : "Known conditions (vet-diagnosed)"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Kendte tilstande (diagnosticeret)" : "Known conditions (vet-diagnosed)"}
    value={((((draft as any).knownConditions as string) ?? "").trim())}
hideLabel

  />

  {/* RECENT TESTS / RESULTS */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Nylige tests / resultater" : "Recent tests / results"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Nylige tests / resultater" : "Recent tests / results"}
    value={((((draft as any).recentTests as string) ?? "").trim())}
hideLabel

  />

  {/* WHAT YOU'VE TRIED AT HOME */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Hvad du har prøvet hjemme" : "What you’ve tried at home"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Hvad du har prøvet hjemme" : "What you’ve tried at home"}
    value={(draft.previousTreatment ?? "").trim()}
hideLabel

  />

  {/* QUESTIONS FOR THE VET */}
  <div style={sectionLabelStyle}>
    {lang === "da" ? "Spørgsmål til dyrlægen" : "Questions for the vet"}
  </div>
  <ReviewLine
    label={lang === "da" ? "Spørgsmål til dyrlægen" : "Questions for the vet"}
    value={(draft.questionsVet ?? "").trim()}
hideLabel

  />
</div>    
    </div>

    {/* Actions */}
    <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
      <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
        {saving ? (lang === "da" ? "Gemmer..." : "Saving...") : lang === "da" ? "Gem besøg" : "Save visit"}
      </button>

      {/* Only show delete draft if this is still a draft */}
      {isDraft && !!visitId && (
        <button
          className="btn btnSecondary"
          onClick={handleDeleteDraft}
          style={{ borderColor: "#d33", color: "#d33" }}
        >
          {lang === "da" ? "Slet kladde" : "Delete draft"}
        </button>
      )}

      {/* Replace multiple "coming soon" buttons with one calm line */}
      <div className="muted" style={{ textAlign: "center", fontSize: 13 }}>
        {lang === "da" ? "PDF + email eksport kommer snart." : "PDF + email export coming soon."}
      </div>
    </div>
  </>
)}

          {/* MODE 3: DONE */}
          {mode === "done" && (
            <>
              <div
                style={{
                  backgroundColor: "var(--lightGreen)",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16
                }}
              >
                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>{lang === "da" ? "Gemt!" : "Saved!"}</strong>{" "}
                  {lang === "da" ? "Din forberedelse er gemt i appen." : "Your visit prep has been saved in the app."}
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                  {lang === "da"
                    ? "Gå forberedt ind. Vær en partner i dit dyrs behandling."
                    : "Walk in prepared. Partner in your pet's care."}
                </p>
              </div>

              <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
                <button className="btn btnPrimary" onClick={closeToMyVisits}>
                  {lang === "da" ? "Færdig" : "Done"}
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
  <div style={{ display: "flex", gap: 8, flex: 1 }}>
    <button
      className="btn btnSecondary"
      onClick={handleSaveDraftAndClose}
      disabled={savingDraft}
      style={{ flex: 0, minWidth: 140 }}
    >
      {savingDraft
        ? lang === "da"
          ? "Gemmer..."
          : "Saving..."
        : lang === "da"
          ? "Gem & luk"
          : "Save & close"}
    </button>

    <button
      className="btn btnPrimary"
      onClick={handleNext}
      disabled={!stepData[step].ok}
      style={{ flex: 1, minWidth: 120 }}
    >
      {step === stepData.length - 1
        ? lang === "da"
          ? "Preview"
          : "Preview"
        : lang === "da"
          ? "Næste"
          : "Next"}
    </button>
  </div>
)}

          {mode === "done" && (
            <button className="btn btnPrimary" onClick={closeToMyVisits} style={{ flex: 1, minWidth: 120 }}>
              {lang === "da" ? "Luk" : "Close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
