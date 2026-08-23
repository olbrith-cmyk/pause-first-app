import { useState, type ReactNode } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { CurrentStatus, Pet, TriState, Visit, VisitNote } from "../firestore";
import { exportToPDF, shareWithVet } from "../utils/pdfExport";
import { patientInfoRows, signalmentLine } from "../utils/petInfo";
import { formatDuration, trendLabel, urgencyIcon, urgencyLabel, urgencyTone } from "../utils/visitBrief";
import { hasAiAssistantConsent, openChatGpt, setAiAssistantConsent } from "../utils/chatGptHandoff";
import AttachmentGallery from "./AttachmentGallery";
import { AiAssistantConsent } from "./Modals";

function currentStatusSummary(cs: CurrentStatus | undefined, lang: Lang) {
  if (!cs) return null;

  const items: Array<{ key: keyof CurrentStatus; labelEn: string; labelDa: string; notesKey: keyof CurrentStatus }> = [
    { key: "appetite", labelEn: "Appetite", labelDa: "Appetit", notesKey: "appetiteNotes" },
    { key: "drinking", labelEn: "Drinking", labelDa: "Drikker", notesKey: "drinkingNotes" },
    { key: "energy", labelEn: "Energy", labelDa: "Energi", notesKey: "energyNotes" },
    { key: "toileting", labelEn: "Toileting", labelDa: "Toiletvaner", notesKey: "toiletingNotes" },
    { key: "gi", labelEn: "GI (vomiting/diarrhea)", labelDa: "Mave/tarm (opkast/diarré)", notesKey: "giNotes" },
    { key: "breathing", labelEn: "Breathing/coughing", labelDa: "Vejrtrækning/hoste", notesKey: "breathingNotes" },
    { key: "mobilityPain", labelEn: "Mobility/pain", labelDa: "Bevægelse/smerte", notesKey: "mobilityPainNotes" },
    { key: "skinEars", labelEn: "Skin/ears", labelDa: "Hud/ører", notesKey: "skinEarsNotes" }
  ];

  const different: string[] = [];
  const notSure: string[] = [];
  const asUsual: string[] = [];

  for (const it of items) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const label = lang === "da" ? it.labelDa : it.labelEn;
    const line = notes ? `${label}: ${notes}` : label;
    if (v === "changed") different.push(line);
    else if (v === "na") notSure.push(line);
    else asUsual.push(line);
  }

  const otherNotes = (cs.otherNotes ?? "").trim();

  if (!different.length && !notSure.length && !asUsual.length && !otherNotes) return null;
  return { different, notSure, asUsual, otherNotes };
}

// --- Visual building blocks for a scannable, easy-on-the-eyes document ---

function Section({
  title,
  icon,
  accent = "var(--blue)",
  children
}: {
  title: string;
  icon?: string;
  accent?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: "12px 16px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10
      }}
    >
      <h4
        style={{
          margin: "0 0 8px 0",
          color: accent,
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.4px"
        }}
      >
        {icon ? `${icon}  ` : ""}
        {title}
      </h4>
      <div style={{ lineHeight: "1.6", fontSize: 15, color: "var(--text)" }}>{children}</div>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: "changed" | "asUsual" | "notSure" }) {
  const palette = {
    changed: { bg: "var(--lightRed)", fg: "var(--red)" },
    notSure: { bg: "var(--lightBlue)", fg: "var(--blue)" },
    asUsual: { bg: "var(--lightGreen)", fg: "var(--green)" }
  }[tone];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        margin: "0 6px 6px 0",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        background: palette.bg,
        color: palette.fg
      }}
    >
      {label}
    </span>
  );
}

function StatusGroup({ label, items, tone }: { label: string; items: string[]; tone: "changed" | "asUsual" | "notSure" }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          marginBottom: 4
        }}
      >
        {label}
      </div>
      <div>
        {items.map((it) => (
          <StatusChip key={it} label={it} tone={tone} />
        ))}
      </div>
    </div>
  );
}

export default function ViewDocument({
  lang,
  visit,
  pet,
  note,
  hideTitle,
  isDemo
}: {
  lang: Lang;
  visit: Visit | null;
  pet: Pet | null;
  note: VisitNote | null;
  hideTitle?: boolean;
  isDemo?: boolean;
}) {
  const t = useTranslation(lang);
  const tt = (en: string, da: string) => (lang === "da" ? da : en);
  const [showAiConsent, setShowAiConsent] = useState(false);

  if (!visit || !pet) {
    return (
      <div className="stack">
        {!hideTitle && <h3>{t.viewDocument}</h3>}
        <div className="muted">{tt("Select a visit to view the document.", "Vælg et besøg for at se dokumentet.")}</div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (isDemo) return;
    try {
      await exportToPDF({ visit, pet, note, lang });
    } catch (e: any) {
      alert(tt("Error generating PDF: ", "Fejl ved generering af PDF: ") + (e?.message ?? String(e)));
    }
  };

  const handleShareWithVet = async () => {
    if (isDemo) return;
    try {
      await shareWithVet({ visit, pet, note, lang });
    } catch (e: any) {
      alert(tt("Error sharing: ", "Fejl ved deling: ") + (e?.message ?? String(e)));
    }
  };

  const aiContext = { mainConcern: visit.mainConcern, question: visit.questionsVet };

  const handleAskAiAssistant = () => {
    // Demo users get the consent/warning popup on every use — never skip it
    // via a remembered consent, since a demo session isn't really "them"
    // having already agreed to it long-term.
    if (!isDemo && hasAiAssistantConsent()) {
      openChatGpt(lang, aiContext);
    } else {
      setShowAiConsent(true);
    }
  };

  const confirmAiAssistant = () => {
    if (!isDemo) setAiAssistantConsent();
    setShowAiConsent(false);
    openChatGpt(lang, aiContext);
  };

  const patientRows = patientInfoRows(pet, lang);
  const visitDateParsed = visit.visitDate ? new Date(visit.visitDate) : null;
  const signalmentAsOf = visitDateParsed && !Number.isNaN(visitDateParsed.getTime()) ? visitDateParsed : new Date();
  const signalment = signalmentLine(pet, lang, signalmentAsOf);
  const statusSummary = currentStatusSummary(visit.currentStatus, lang);
  const medicationsSupplements = visit.medicationsSupplements ?? "";
  const knownConditions = ((visit as any).knownConditions as string) ?? "";
  const recentTests = ((visit as any).recentTests as string) ?? "";
  const notAnswered = tt("Not answered", "Ikke besvaret");
  // Routine visits skip the Timeline/Patterns/Other details steps in the
  // wizard entirely (see PrepareWizard), so those questions were never
  // actually asked — show them only if there's real content, same as
  // before. Every other wizard question always renders, with a "Not
  // answered" fallback, so the vet can tell "asked, left blank" apart from
  // "never asked."
  const routineSkipsExtras = visit.urgency === "routine";

  // The meds/conditions/tests/tried-at-home step is collapsed behind a
  // "anything to mention?" gate for every visit (see PrepareWizard). If
  // every one of those fields is blank, that's virtually always because the
  // owner explicitly answered "No, nothing to mention" — not because the
  // question went unasked or was left blank — so show one clear "Nothing to
  // mention" line instead of "Not answered" four times over, which would
  // misrepresent an explicit "no" as unanswered. A partially-filled group
  // still gets the normal per-field fallback for whichever ones are blank.
  const medsGroupAllBlank = !medicationsSupplements && !knownConditions && !recentTests && !visit.previousTreatment;

  return (
    <div className="stack">
      {!hideTitle && <h3>{t.viewDocument}</h3>}

      <div id="document-content" className="panel" style={{ padding: "24px" }}>
        {/* Top accent bar for a bit of brand color at a glance */}
        <div style={{ height: 4, background: "var(--blue)", borderRadius: 4, marginBottom: "18px" }} />

        {/* Header — name + signalment (species/breed/age), so the vet knows what
            they're walking in to see before reading a single word further. */}
        <div style={{ marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "26px", fontWeight: 800, color: "var(--text)" }}>{pet.name}</h2>
          {signalment && (
            <p style={{ margin: "0 0 4px 0", color: "var(--text)", fontSize: "15px", fontWeight: 600 }}>{signalment}</p>
          )}
          <p style={{ margin: "0", color: "var(--muted)", fontSize: "14px" }}>
            {tt("Visit Date", "Besøgsdato")}: {visit.visitDate || tt("Not specified", "Ikke angivet")}
          </p>
        </div>

        {/* Main Concern — the single most important line, so it comes first and stands out.
            Duration/trend pills and an urgency badge sit right with it, so the vet gets the
            whole "what, how long, which direction, how worried" picture in one glance. */}
        <div
          style={{
            marginBottom: "18px",
            padding: "16px 18px",
            background: "var(--lightBlue)",
            border: "1px solid var(--blue)",
            borderRadius: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>🩺</span>
            <h3
              style={{
                margin: 0,
                color: "var(--blue)",
                fontSize: 13,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.4px"
              }}
            >
              {tt("Main Concern", "Hovedbekymring")}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 700, lineHeight: "1.5", color: "var(--text)" }}>
            {visit.mainConcern || notAnswered}
          </p>
          {(visit.urgency || visit.durationValue || visit.trend) && (
            <div style={{ marginTop: 10 }}>
              {visit.urgency && (
                <StatusChip
                  label={`${urgencyIcon(visit.urgency)} ${urgencyLabel(visit.urgency, lang)}`}
                  tone={urgencyTone(visit.urgency)!}
                />
              )}
              {formatDuration(visit.durationValue, visit.durationUnit, lang) && (
                <StatusChip label={formatDuration(visit.durationValue, visit.durationUnit, lang)} tone="notSure" />
              )}
              {visit.trend && (
                <StatusChip
                  label={trendLabel(visit.trend, lang)}
                  tone={visit.trend === "worse" ? "changed" : visit.trend === "better" ? "asUsual" : "notSure"}
                />
              )}
            </div>
          )}
        </div>

        {/* Functional Impact — severity framed as observable impact on daily
            life, rather than a false-precision 1-10 scale. Not asked for
            routine visits (e.g. a vaccination), so stays hidden unless
            there's content to show. */}
        {(visit.functionalImpact || !routineSkipsExtras) && (
          <Section title={tt("Impact on Daily Life", "Indvirkning på hverdagen")} icon="⚖️">
            {visit.functionalImpact || notAnswered}
          </Section>
        )}

        {/* When Did It Start */}
        {(visit.whenStart || !routineSkipsExtras) && (
          <Section title={tt("When Did This Start?", "Hvornår startede det?")} icon="📅">
            {visit.whenStart || notAnswered}
          </Section>
        )}

        {/* How Is It Progressing */}
        {(visit.howProgressing || !routineSkipsExtras) && (
          <Section title={tt("How Is It Progressing?", "Hvordan udvikler det sig?")} icon="📈">
            {visit.howProgressing || notAnswered}
          </Section>
        )}

        {/* Patterns */}
        {(visit.patterns || !routineSkipsExtras) && (
          <Section title={tt("Patterns or Triggers", "Mønstre eller udløsende faktorer")} icon="🔁">
            {visit.patterns || notAnswered}
          </Section>
        )}

        {/* Associated Signs */}
        {visit.associatedSigns && (
          <Section title={tt("Associated Signs", "Tilknyttede tegn")} icon="👀">
            {visit.associatedSigns}
          </Section>
        )}

        {/* Current Status */}
        {statusSummary && (
          <Section title={tt("Current Status (vs. Normal)", "Nuværende status (ift. normalt)")} icon="❤️">
            <StatusGroup label={tt("Different", "Anderledes")} items={statusSummary.different} tone="changed" />
            <StatusGroup
              label={tt("N/A / not sure", "Ikke relevant / ved ikke")}
              items={statusSummary.notSure}
              tone="notSure"
            />
            <StatusGroup label={tt("As usual", "Som normalt")} items={statusSummary.asUsual} tone="asUsual" />
            {statusSummary.otherNotes && (
              <p style={{ margin: "4px 0 0 0", lineHeight: "1.6" }}>{statusSummary.otherNotes}</p>
            )}
          </Section>
        )}

        {/* Other Details */}
        {(visit.otherDetails || !routineSkipsExtras) && (
          <Section title={tt("Other Details", "Andre detaljer")} icon="📝">
            {visit.otherDetails || notAnswered}
          </Section>
        )}

        {medsGroupAllBlank ? (
          <Section title={tt("Meds, Conditions, Tests & Tried", "Medicin, tilstande, tests & prøvet")} icon="💊">
            {tt("Nothing to mention", "Intet at nævne")}
          </Section>
        ) : (
          <>
            {/* Medications / Supplements */}
            <Section title={tt("Meds / Supplements", "Medicin / Tilskud")} icon="💊">
              {medicationsSupplements || notAnswered}
            </Section>

            {/* Known Conditions */}
            <Section title={tt("Known Conditions (Vet-Diagnosed)", "Kendte tilstande (dyrlæge-diagnosticeret)")} icon="🏥">
              {knownConditions || notAnswered}
            </Section>

            {/* Recent Tests */}
            <Section title={tt("Recent Tests / Results", "Nylige tests / resultater")} icon="🧪">
              {recentTests || notAnswered}
            </Section>

            {/* Previous Treatment */}
            <Section title={tt("Previous Treatment", "Tidligere behandling")} icon="📋">
              {visit.previousTreatment || notAnswered}
            </Section>
          </>
        )}

        {/* Questions for Vet */}
        <Section title={tt("Questions for Your Veterinarian", "Spørgsmål til din dyrlæge")} icon="❓">
          {visit.questionsVet || notAnswered}
        </Section>

        {/* Patient Info (from the pet's profile) — reference material, placed after the
            clinical story so it doesn't push today's history below the fold. */}
        {!!patientRows.length && (
          <Section title={tt("Patient Info", "Patientinfo")} icon="🐾">
            {patientRows.map((r, i) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "6px 8px",
                  background: i % 2 === 1 ? "var(--bg)" : "transparent",
                  borderRadius: 6
                }}
              >
                <div style={{ width: 160, flexShrink: 0, color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
                  {r.label}
                </div>
                <div>{r.value}</div>
              </div>
            ))}
          </Section>
        )}

        {/* Attachments */}
        {!!visit.attachments?.length && (
          <Section title={tt("Photos, Video & Audio", "Fotos, video & lyd")} icon="📎">
            <AttachmentGallery attachments={visit.attachments} />
          </Section>
        )}

        {/* Visit Notes Section */}
        {note && (
          <>
            <div style={{ height: 4, background: "var(--green)", borderRadius: 4, margin: "22px 0 16px 0" }} />

            <h3 style={{ margin: "0 0 14px 0", fontSize: "18px", color: "var(--green)", fontWeight: 800 }}>
              {tt("Visit Notes", "Besøgsnoter")}
            </h3>

            {note.vetName && (
              <Section title={tt("Veterinarian", "Dyrlæge")} icon="👩‍⚕️" accent="var(--green)">
                {note.vetName}
              </Section>
            )}

            {note.diagnosis && (
              <Section title={tt("Diagnosis / Findings", "Diagnose / Fund")} icon="🔍" accent="var(--green)">
                {note.diagnosis}
              </Section>
            )}

            {note.testsPerformed && (
              <Section title={tt("Tests Performed", "Udførte tests")} icon="🧪" accent="var(--green)">
                {note.testsPerformed}
              </Section>
            )}

            {note.treatmentMeds && (
              <Section title={tt("Medications / Treatment", "Medicin / Behandling")} icon="💊" accent="var(--green)">
                {note.treatmentMeds}
              </Section>
            )}

            {note.homeInstructions && (
              <Section title={tt("Instructions at Home", "Instruktioner derhjemme")} icon="🏠" accent="var(--green)">
                {note.homeInstructions}
              </Section>
            )}

            {note.followUp && (
              <Section title={tt("Follow-up Plan", "Opfølgningsplan")} icon="🔔" accent="var(--green)">
                {note.followUp}
              </Section>
            )}

            {!!note.attachments?.length && (
              <Section title={tt("Photos, Video & Audio", "Fotos, video & lyd")} icon="📎" accent="var(--green)">
                <AttachmentGallery attachments={note.attachments} />
              </Section>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="row rowWrap" style={{ marginTop: "16px" }}>
        <button className="btn btnPrimary" onClick={handleDownloadPDF} disabled={isDemo}>
          📥 {tt("Download as PDF", "Download som PDF")}
        </button>
        <button className="btn btnSecondary" onClick={handleShareWithVet} disabled={isDemo}>
          📤 {tt("Share with Vet", "Del med dyrlæge")}
        </button>
        <button className="btn btnSecondary" onClick={handleAskAiAssistant}>
          ✨ {t.aiAssistant}
        </button>
      </div>

      {isDemo && (
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          {tt(
            "Downloading and sharing aren't available in the demo — sign up to use them.",
            "Download og deling er ikke tilgængelige i demoen — opret en konto for at bruge dem."
          )}
        </div>
      )}

      {showAiConsent && (
        <AiAssistantConsent lang={lang} onConfirm={confirmAiAssistant} onClose={() => setShowAiConsent(false)} />
      )}
    </div>
  );
}
