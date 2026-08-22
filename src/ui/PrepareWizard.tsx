import { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { CurrentStatus, Pet, TriState, Visit } from "../firestore";
import { addVisit, getVisitById, updateVisit, deleteVisitFully } from "../firestore";
import TriToggle from "./TriToggle";
import PetSnapshotCard from "./PetSnapshotCard";
import AttachmentManager from "./AttachmentManager";
import ViewDocument from "./ViewDocument";
import { shareWithVet } from "../utils/pdfExport";
import type { DurationUnit, Trend, Urgency } from "../utils/visitBrief";
import { durationUnitLabel, trendLabel, urgencyLabel } from "../utils/visitBrief";

type Props = {
  lang: Lang;
  userId: string;
  petId: string;
  petName: string;
  pet?: Pet | null;
  visitId?: string;
  mode?: "prepare";
  onClose: () => void;
  onComplete?: () => void | Promise<void>;
  onNavigateAfterClose?: (target: "home" | "myVisits") => void;
  onToast?: (message: string) => void;
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
  pet,
  visitId: visitIdProp,
  onClose,
  onComplete,
  onNavigateAfterClose,
  onToast,
}: Props) {
  const t = useTranslation(lang);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sharingFromDone, setSharingFromDone] = useState(false);
  const [mode, setMode] = useState<"wizard" | "preview" | "done">("wizard");
  // For routine visits, the 8-card Current Status checklist starts collapsed
  // behind a single "is everything normal?" question — set true once the
  // owner says something's different, so the full checklist stays open.
  const [statusExpanded, setStatusExpanded] = useState(false);
  // Meds/known conditions/recent tests/tried-at-home start collapsed behind
  // a single "anything to mention?" question, for every visit (not just
  // routine) — most visits have nothing to report here.
  const [medsExpanded, setMedsExpanded] = useState(false);

  const [visitId, setVisitId] = useState<string | null>(null);
  const didInit = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const stepContentRef = useRef<HTMLDivElement | null>(null);
  const scrollGateStep = useRef<number | null>(null);

  // FIX: removed redundant local `toast` state — toasts are dispatched via onToast prop only
  const [draft, setDraft] = useState<Visit>({
    userId,
    petId,
    visitDate: "",
    mainConcern: "",
    whenStart: "",
    durationValue: "",
    durationUnit: "days",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    otherDetails: "",
    previousTreatment: "",
    questionsVet: "",
    currentStatus: makeEmptyStatus(),
    status: "draft",
    // FIX: these fields are used throughout but were cast as `any`; typed here as string
    // so they can be removed from `as any` casts once added to the Visit type
    medicationsSupplements: "",
    knownConditions: "",
    recentTests: ""
  } as any);

  const isDraft = (draft.status ?? "final") === "draft";

  const closeToMyVisits = () => {
    onClose();
    onNavigateAfterClose?.("myVisits");
  };

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      try {
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
            durationUnit: existing.durationUnit ?? "days",
            status: existing.status ?? "final"
          });
          return;
        }

        const ref = await addVisit({ ...draft, status: "draft" });
        setVisitId(ref.id);
      } catch (e: any) {
        alert(t.error + ": " + (e?.message ?? String(e)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Each step (and each mode: wizard/preview/done) is its own "page" inside
  // the modal — start it scrolled to the top instead of carrying over
  // wherever the previous step happened to leave the scroll position.
  useEffect(() => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [step, mode]);

  // Routine visits skip Timeline (case 2), Patterns & triggers (case 3), and
  // Other details (case 5) — those are the ones most likely to be empty for
  // a quick checkup rather than a developing problem. `step` (position)
  // always indexes into this filtered sequence; `caseIndices[step]` maps
  // back to the fixed content identity that `renderStep()` switches on.
  // Urgency can only be changed while viewing position 1 (Main concern),
  // and position 1 is index 1 in both sequences, so switching urgency
  // mid-wizard never leaves `step` pointing past the end of the (possibly
  // shorter) sequence.
  const caseIndices = useMemo(() => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return draft.urgency === "routine" ? all.filter((i) => ![2, 3, 5].includes(i)) : all;
  }, [draft.urgency]);

  const allStepData = useMemo(
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
            : "Meds, conditions, tests + what you've tried",
        desc:
          lang === "da"
            ? "Skriv medicin/tilskud, kendte tilstande, nylige tests og hvad du allerede har prøvet hjemme."
            : "List meds/supplements, known conditions, recent tests, and anything you've already tried at home.",
        ok: true
      },
      {
        title: lang === "da" ? "Det ene, du har mest brug for svar på" : "The one thing you need answered",
        desc:
          lang === "da"
            ? "Hvilken beslutning skal dyrlægen hjælpe dig med?"
            : "What decision do you need the vet's help making?",
        ok: true
      },
      {
        title: lang === "da" ? "Foto, video & lyd" : "Photos, video & audio",
        desc:
          lang === "da"
            ? "Valgfrit: vedhæft et billede af det, der bekymrer dig, en kort video eller en lydoptagelse."
            : "Optional: attach a photo of what's concerning you, a short video, or an audio recording.",
        ok: true
      }
    ],
    [draft.visitDate, draft.mainConcern, lang]
  );

  const stepData = useMemo(() => caseIndices.map((i) => allStepData[i]), [caseIndices, allStepData]);

  const isLastWizardStep = step === stepData.length - 1;

  const handleNext = () => {
    if (!stepData[step].ok) return;

    // If there's more of this step below the fold, scroll it into view first
    // instead of jumping straight to the next step — so nothing on the
    // current step gets skipped just because it wasn't visible yet. Only
    // gate once per step (via scrollGateStep) so a flaky visibility
    // measurement can never block Next from working entirely — worst case
    // is one extra tap, not a stuck wizard.
    const body = modalBodyRef.current;
    const content = stepContentRef.current;
    if (body && content && content.lastElementChild && scrollGateStep.current !== step) {
      const bodyRect = body.getBoundingClientRect();
      const lastRect = content.lastElementChild.getBoundingClientRect();
      const hiddenBelow = lastRect.bottom - bodyRect.bottom;
      if (hiddenBelow > 4) {
        scrollGateStep.current = step;
        // "auto" (not "smooth") — smooth scrollTo is unreliable inside a
        // -webkit-overflow-scrolling: touch container on iOS Safari, where
        // it can silently fail to scroll at all.
        body.scrollTo({ top: body.scrollTop + hiddenBelow + 24, behavior: "auto" });
        return;
      }
    }

    if (isLastWizardStep) {
      setMode("preview");
    } else {
      setStep((s) => s + 1);
    }
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
      onNavigateAfterClose?.("myVisits");
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
      setSaving(false);
    }
  };

  const handleShareFromDone = async () => {
    if (!pet) return;
    setSharingFromDone(true);
    try {
      await shareWithVet({ visit: { ...draft, status: "final" }, pet, note: null, lang });
    } catch (e: any) {
      alert((lang === "da" ? "Fejl ved deling: " : "Error sharing: ") + (e?.message ?? String(e)));
    } finally {
      setSharingFromDone(false);
    }
  };

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
      await updateVisit(visitId, { ...draft, status: "draft" });
      // FIX: removed setToast (local state was unused/broken after unmount);
      // toast is correctly dispatched to parent via onToast prop only
      onToast?.(
        lang === "da"
          ? "Kladde gemt. Du kan fortsætte under Mine besøg."
          : "Draft saved. You can continue from My visits."
      );
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
      closeToMyVisits();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
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
            enterKeyHint="next"
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
                ? "Hvad er normalt, og hvad er anderledes lige nu?"
                : "What's normal, and what's different right now?"
            }
          />
        </label>
      </div>
    );
  };

  const renderStep = () => {
    switch (caseIndices[step]) {
      case 0:
        return (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              {lang === "da" ? "Dyr:" : "Pet:"} <strong>{petName}</strong>
            </div>

            <label className="label">
              {lang === "da" ? "Besøgsdato" : "Visit date"}
              <input
                className="input"
                enterKeyHint="next"
                type="date"
                value={draft.visitDate}
                onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })}
              />
            </label>
          </>
        );

      case 1:
        return (
          <>
            <div className="calloutBox calloutBoxCompact" style={{ marginTop: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)", marginBottom: 8 }}>
                {lang === "da" ? "Hvor bekymret er du?" : "How urgent does this feel to you?"}
              </div>
              <div className="row rowWrap" style={{ gap: 6 }}>
                {(["routine", "concerned", "very_worried"] as Urgency[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`btn btnChip ${draft.urgency === u ? "btnPrimary" : "btnSecondary"}`}
                    onClick={() => setDraft({ ...draft, urgency: u })}
                  >
                    {urgencyLabel(u, lang)}
                  </button>
                ))}
              </div>
              {draft.urgency === "routine" && (
                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  {lang === "da"
                    ? "Rutinebesøg bruger en kortere version af denne formular."
                    : "Routine visits use a shorter version of this form."}
                </div>
              )}
            </div>

            <div style={{ height: 14 }} />

            <label className="label">
              {lang === "da" ? "Hovedbekymring" : "Main concern"}
              <textarea
                className="textarea"
                enterKeyHint="next"
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

            {draft.urgency !== "routine" && (
              <>
                <div style={{ height: 14 }} />

                <label className="label">
                  {lang === "da" ? "Hvordan påvirker det hverdagen?" : "How is this affecting normal life?"}
                  <textarea
                    className="textarea"
                    enterKeyHint="next"
                    value={draft.functionalImpact ?? ""}
                    onChange={(e) => setDraft({ ...draft, functionalImpact: e.target.value })}
                    placeholder={
                      lang === "da"
                        ? "F.eks. spiser ikke, vil ikke gå tur, sover mere end normalt, leger ikke"
                        : "E.g., not eating, reluctant to walk, sleeping more than usual, not playing"
                    }
                    rows={3}
                  />
                </label>
              </>
            )}
          </>
        );

      case 2:
        return (
          <>
            <div className="calloutBox calloutBoxCompact" style={{ marginTop: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)", marginBottom: 8 }}>
                {lang === "da" ? "Hvor længe har det stået på?" : "How long has this been going on?"}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <input
                  className="input"
                  enterKeyHint="next"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={draft.durationValue ?? ""}
                  onChange={(e) => setDraft({ ...draft, durationValue: e.target.value })}
                  placeholder={lang === "da" ? "f.eks. 2" : "e.g., 2"}
                  style={{ maxWidth: 100 }}
                />
                <select
                  className="input"
                  value={draft.durationUnit ?? "days"}
                  onChange={(e) => setDraft({ ...draft, durationUnit: e.target.value as DurationUnit })}
                >
                  {(["hours", "days", "weeks", "months"] as DurationUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {durationUnitLabel(u, lang, 2)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ height: 10 }} />

              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)", marginBottom: 8 }}>
                {lang === "da" ? "Bliver det bedre eller værre?" : "Is it getting better or worse?"}
              </div>
              <div className="row rowWrap" style={{ gap: 6 }}>
                {(["worse", "same", "better"] as Trend[]).map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    className={`btn btnChip ${draft.trend === tr ? "btnPrimary" : "btnSecondary"}`}
                    onClick={() => setDraft({ ...draft, trend: tr })}
                  >
                    {trendLabel(tr, lang)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 14 }} />

            <label className="label">
              {lang === "da" ? "Hvornår lagde du først mærke til det?" : "When did you first notice this?"}
              <textarea
                className="textarea"
                enterKeyHint="next"
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
                enterKeyHint="next"
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
              enterKeyHint="next"
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

      case 4: {
        const cs = draft.currentStatus ?? makeEmptyStatus();
        const hasDeviation =
          cs.appetite !== "normal" ||
          !!cs.appetiteNotes?.trim() ||
          cs.drinking !== "normal" ||
          !!cs.drinkingNotes?.trim() ||
          cs.energy !== "normal" ||
          !!cs.energyNotes?.trim() ||
          cs.toileting !== "normal" ||
          !!cs.toiletingNotes?.trim() ||
          cs.gi !== "normal" ||
          !!cs.giNotes?.trim() ||
          cs.breathing !== "normal" ||
          !!cs.breathingNotes?.trim() ||
          cs.mobilityPain !== "normal" ||
          !!cs.mobilityPainNotes?.trim() ||
          cs.skinEars !== "normal" ||
          !!cs.skinEarsNotes?.trim() ||
          !!cs.otherNotes?.trim();

        // For routine visits, assume everything's normal (the checklist's
        // default) and skip straight past it unless the owner says
        // otherwise or there's already deviation data to review.
        if (draft.urgency === "routine" && !statusExpanded && !hasDeviation) {
          return (
            <div className="calloutBox calloutBoxCompact" style={{ marginTop: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)", marginBottom: 8 }}>
                {lang === "da" ? "Er alt normalt lige nu?" : "Is everything normal right now?"}
              </div>
              <div className="muted" style={{ marginBottom: 10 }}>
                {lang === "da"
                  ? `Antaget: appetit, energi, vejrtrækning m.m. er som normalt for ${petName || "dit dyr"}.`
                  : `Assumed: appetite, energy, breathing, etc. are all as usual for ${petName || "your pet"}.`}
              </div>
              <div className="row rowWrap" style={{ gap: 6 }}>
                <button type="button" className="btn btnChip btnPrimary" onClick={handleNext}>
                  {lang === "da" ? "Ja, fortsæt" : "Yes, continue"}
                </button>
                <button
                  type="button"
                  className="btn btnChip btnSecondary"
                  onClick={() => setStatusExpanded(true)}
                >
                  {lang === "da" ? "Nej, noget er anderledes" : "No, something's different"}
                </button>
              </div>
            </div>
          );
        }

        return (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>
              {lang === "da"
                ? `Dyrlæger læser dette ved at sammenligne med, hvad der er normalt for ${petName || "dit dyr"}. Vælg 'Anderledes', hvis det ikke er typisk lige nu.`
                : `Vets read this by comparing to what's normal for ${petName || "your pet"}. Choose 'Different' if today isn't typical.`}
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
                enterKeyHint="next"
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
      }

      case 5:
        return (
          <>
            <label className="label">
              {lang === "da" ? "Andre detaljer (fakta til dyrlægen)" : "Other details (facts for the vet)"}
              <textarea
                className="textarea"
                enterKeyHint="next"
                value={draft.otherDetails ?? ""}
                onChange={(e) => setDraft({ ...draft, otherDetails: e.target.value })}
                placeholder={
                  lang === "da"
                    ? "F.eks. foderændringer, rejse, nylig skade/fald, flåter/lopper, mulig forgiftning, løbetid, timing, videoer du har... (ikke spørgsmål)"
                    : "E.g., new food/treats, travel, recent injury or fall, ticks/fleas, possible toxin exposure, heat cycle, timing, videos you have... (not questions)"
                }
                rows={4}
              />
            </label>

            <div className="muted" style={{ marginTop: 8 }}>
              {lang === "da" ? "Tip: Du kan tilføje fotos/videoer i Preview." : "Tip: You can attach photos/videos in Preview."}
            </div>
          </>
        );

      case 6: {
        const medicationsSupplementsVal = ((draft as any).medicationsSupplements as string) ?? "";
        const knownConditionsVal = ((draft as any).knownConditions as string) ?? "";
        const recentTestsVal = ((draft as any).recentTests as string) ?? "";
        const hasMedsData =
          !!medicationsSupplementsVal.trim() ||
          !!knownConditionsVal.trim() ||
          !!recentTestsVal.trim() ||
          !!draft.previousTreatment?.trim();

        if (!medsExpanded && !hasMedsData) {
          return (
            <div className="calloutBox calloutBoxCompact" style={{ marginTop: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)", marginBottom: 6 }}>
                {lang === "da"
                  ? "Noget at nævne om medicin, tilstande, tests eller hjemmebehandling?"
                  : "Anything to mention on meds, conditions, tests, or home care?"}
              </div>
              <div className="muted" style={{ marginBottom: 10 }}>
                {lang === "da"
                  ? "Inkluderer recept-/håndkøbsmedicin, kosttilskud, kendte tilstande, testresultater og hjemmemidler du har prøvet (fx ro, diætændring, varme/kulde)."
                  : "Includes prescription/OTC medication, supplements, known conditions, test results, and home remedies you've tried (e.g. rest, diet change, heat/cold)."}
              </div>
              <div className="row rowWrap" style={{ gap: 6 }}>
                <button type="button" className="btn btnChip btnPrimary" onClick={handleNext}>
                  {lang === "da" ? "Nej, intet at nævne" : "No, nothing to mention"}
                </button>
                <button type="button" className="btn btnChip btnSecondary" onClick={() => setMedsExpanded(true)}>
                  {lang === "da" ? "Ja, tilføj detaljer" : "Yes, add details"}
                </button>
              </div>
            </div>
          );
        }

        return (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              {lang === "da"
                ? "Husk: Inkludér alt — recept, håndkøb, kosttilskud eller naturmedicin — også selvom det er for noget helt andet."
                : "Remember: Include everything — prescription, over-the-counter, supplements, or homeopathic remedies — even if it's for something else."}
            </div>

            <label className="label">
              {lang === "da" ? "Medicin & tilskud" : "Meds & supplements"}
              <textarea
                className="textarea"
                enterKeyHint="next"
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
                enterKeyHint="next"
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
                enterKeyHint="next"
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
                enterKeyHint="next"
                value={draft.previousTreatment}
                onChange={(e) => setDraft({ ...draft, previousTreatment: e.target.value })}
                placeholder={lang === "da" ? "F.eks. ro, diætændring, skånekost, hvile, varme/kulde..." : "E.g., rest, diet change, bland diet, heat/cold..."}
                rows={4}
              />
            </label>
          </>
        );
      }

      case 7:
        return (
          <label className="label">
            {lang === "da" ? "Det ene, du har mest brug for svar på" : "The one thing you need answered"}
            <div className="muted" style={{ marginTop: 6, marginBottom: 6, fontWeight: 400 }}>
              {lang === "da"
                ? "Ikke bare 'jeg er bekymret' — hvad skal dyrlægen hjælpe dig med at beslutte?"
                : "Not just \"I'm worried\" — what decision do you need the vet's help making?"}
            </div>
            <textarea
              className="textarea"
              enterKeyHint="next"
              value={draft.questionsVet}
              onChange={(e) => setDraft({ ...draft, questionsVet: e.target.value })}
              placeholder={
                lang === "da"
                  ? "F.eks. \"Jeg har brug for at vide, om dette er akut\" eller \"Jeg vil gerne vide, om vi skal teste for X\""
                  : "E.g., \"I need to know if this is urgent\" or \"I want to know if we should test for X\""
              }
              rows={4}
            />
          </label>
        );

      case 8:
        return visitId ? (
          <AttachmentManager
            lang={lang}
            userId={userId}
            scopeId={visitId}
            attachments={draft.attachments ?? []}
            onChange={(next) => setDraft({ ...draft, attachments: next })}
          />
        ) : (
          <div className="muted">{lang === "da" ? "Forbereder…" : "Getting ready…"}</div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modalOverlay">
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

          <button className="modalClose" onClick={handleSaveDraftAndClose} aria-label={lang === "da" ? "Luk" : "Close"}>
            ✕
          </button>
        </div>

        <div className="modalBody" ref={modalBodyRef}>
          {/* MODE 1: WIZARD */}
          {mode === "wizard" && (
            <>
              {pet && <PetSnapshotCard pet={pet} lang={lang} />}

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 6px 0" }}>{stepData[step].title}</h4>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{stepData[step].desc}</p>
              </div>
              <div
                ref={stepContentRef}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;

                  const target = e.target as HTMLElement;
                  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

                  e.preventDefault();

                  const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("input, textarea"));
                  const index = focusables.indexOf(target);

                  if (index >= 0 && index < focusables.length - 1) {
                    const next = focusables[index + 1];
                    next.focus();
                    // "auto" — smooth scrollIntoView is unreliable inside a
                    // -webkit-overflow-scrolling: touch container on iOS Safari.
                    next.scrollIntoView({ behavior: "auto", block: "center" });
                  } else {
                    handleNext();
                  }
                }}
              >
                {renderStep()}
              </div>
            </>
          )}

          {/* MODE 2: PREVIEW */}
          {mode === "preview" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: "0 0 4px 0" }}>{lang === "da" ? "Besøgsforberedelse" : "Visit Brief"}</h3>
                <div className="muted" style={{ fontSize: 14 }}>
                  {lang === "da"
                    ? "Klar til at dele med dit dyrlægeteam."
                    : "Ready to share with your veterinary team."}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <ViewDocument lang={lang} visit={draft} pet={pet ?? null} note={null} hideTitle />
              </div>

              {/* Actions */}
              <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
                <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
                  {saving ? (lang === "da" ? "Gemmer..." : "Saving...") : lang === "da" ? "Gem besøg" : "Save visit"}
                </button>

                {isDraft && !!visitId && (
                  <button
                    className="btn btnSecondary"
                    onClick={handleDeleteDraft}
                    style={{ borderColor: "#d33", color: "#d33" }}
                  >
                    {lang === "da" ? "Slet kladde" : "Delete draft"}
                  </button>
                )}
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
                  <strong>✔ {lang === "da" ? "Besøgsforberedelse gemt" : "Visit brief saved"}</strong>
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                  {lang === "da"
                    ? "Klar til at dele med din dyrlægeklinik."
                    : "Ready to share with your veterinary clinic."}
                </p>
              </div>

              <div className="row" style={{ gap: 8, flexDirection: "column" as const }}>
                {pet && (
                  <button className="btn btnPrimary" onClick={handleShareFromDone} disabled={sharingFromDone}>
                    {sharingFromDone
                      ? lang === "da"
                        ? "Deler…"
                        : "Sharing…"
                      : lang === "da"
                        ? "Del med dyrlæge"
                        : "Share with Vet"}
                  </button>
                )}
                <button className="btn btnSecondary" onClick={closeToMyVisits}>
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
            flexDirection: "column",
            gap: 8
          }}
        >
          {/* Top row: Back + Next */}
          {/* FIX: placeholder width matches button minWidth (90px) so Next button
              doesn't shift when Back appears/disappears */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(mode === "wizard" && step > 0) || mode === "preview" ? (
              <button className="btn btnSecondary" onClick={handleBack} style={{ minWidth: 90 }}>
                ← {lang === "da" ? "Tilbage" : "Back"}
              </button>
            ) : (
              <div style={{ minWidth: 90 }} />
            )}

            {mode === "wizard" ? (
              <button
                className="btn btnPrimary"
                onClick={handleNext}
                disabled={!stepData[step].ok}
                style={{ flex: 1 }}
              >
                {step === stepData.length - 1
                  ? lang === "da"
                    ? "Gennemse"
                    : "Preview"
                  : lang === "da"
                    ? "Næste"
                    : "Next"}
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>

          {/* Bottom row: Save & close (full width) */}
          {mode === "wizard" && (
            <button
              className="btn btnSecondary"
              onClick={handleSaveDraftAndClose}
              disabled={savingDraft}
              style={{ width: "100%" }}
            >
              {savingDraft
                ? lang === "da"
                  ? "Gemmer..."
                  : "Saving..."
                : lang === "da"
                  ? "Gem & luk"
                  : "Save & close"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
