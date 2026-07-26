import type { ReactNode } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { CurrentStatus, Pet, TriState, Visit, VisitNote } from "../firestore";
import { exportToPDF, shareWithVet } from "../utils/pdfExport";
import { patientInfoRows } from "../utils/petInfo";
import AttachmentGallery from "./AttachmentGallery";

function currentStatusSummary(cs?: CurrentStatus) {
  if (!cs) return null;

  const items: Array<{ key: keyof CurrentStatus; label: string; notesKey: keyof CurrentStatus }> = [
    { key: "appetite", label: "Appetite", notesKey: "appetiteNotes" },
    { key: "drinking", label: "Drinking", notesKey: "drinkingNotes" },
    { key: "energy", label: "Energy", notesKey: "energyNotes" },
    { key: "toileting", label: "Toileting", notesKey: "toiletingNotes" },
    { key: "gi", label: "GI (vomiting/diarrhea)", notesKey: "giNotes" },
    { key: "breathing", label: "Breathing/coughing", notesKey: "breathingNotes" },
    { key: "mobilityPain", label: "Mobility/pain", notesKey: "mobilityPainNotes" },
    { key: "skinEars", label: "Skin/ears", notesKey: "skinEarsNotes" }
  ];

  const different: string[] = [];
  const notSure: string[] = [];
  const asUsual: string[] = [];

  for (const it of items) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const line = notes ? `${it.label}: ${notes}` : it.label;
    if (v === "changed") different.push(line);
    else if (v === "na") notSure.push(line);
    else asUsual.push(it.label);
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
  note
}: {
  lang: Lang;
  visit: Visit | null;
  pet: Pet | null;
  note: VisitNote | null;
}) {
  const t = useTranslation(lang);

  if (!visit || !pet) {
    return (
      <div className="stack">
        <h3>{t.viewDocument}</h3>
        <div className="muted">Select a visit to view the document.</div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      await exportToPDF({ visit, pet, note, lang });
    } catch (e: any) {
      alert("Error generating PDF: " + (e?.message ?? String(e)));
    }
  };

  const handleShareWithVet = async () => {
    try {
      await shareWithVet({ visit, pet, note, lang });
    } catch (e: any) {
      alert("Error sharing: " + (e?.message ?? String(e)));
    }
  };

  const patientRows = patientInfoRows(pet, lang);
  const statusSummary = currentStatusSummary(visit.currentStatus);
  const medicationsSupplements = visit.medicationsSupplements ?? "";
  const knownConditions = ((visit as any).knownConditions as string) ?? "";
  const recentTests = ((visit as any).recentTests as string) ?? "";

  return (
    <div className="stack">
      <h3>{t.viewDocument}</h3>

      <div id="document-content" className="panel" style={{ padding: "24px" }}>
        {/* Top accent bar for a bit of brand color at a glance */}
        <div style={{ height: 4, background: "var(--blue)", borderRadius: 4, marginBottom: "18px" }} />

        {/* Header */}
        <div style={{ marginBottom: "20px", paddingBottom: "12px", borderBottom: "2px solid var(--border)" }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "26px", fontWeight: 800, color: "var(--text)" }}>{pet.name}</h2>
          <p style={{ margin: "0", color: "var(--muted)", fontSize: "14px" }}>
            Visit Date: {visit.visitDate || "Not specified"}
          </p>
        </div>

        {/* Main Concern — the single most important line, so it comes first and stands out */}
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
              Main Concern
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 700, lineHeight: "1.5", color: "var(--text)" }}>
            {visit.mainConcern || "(Not provided)"}
          </p>
        </div>

        {/* Patient Info (from the pet's profile) */}
        {!!patientRows.length && (
          <Section title="Patient Info" icon="🐾">
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

        {/* When Did It Start */}
        {visit.whenStart && (
          <Section title="When Did This Start?" icon="📅">
            {visit.whenStart}
          </Section>
        )}

        {/* How Is It Progressing */}
        {visit.howProgressing && (
          <Section title="How Is It Progressing?" icon="📈">
            {visit.howProgressing}
          </Section>
        )}

        {/* Patterns */}
        {visit.patterns && (
          <Section title="Patterns or Triggers" icon="🔁">
            {visit.patterns}
          </Section>
        )}

        {/* Associated Signs */}
        {visit.associatedSigns && (
          <Section title="Associated Signs" icon="👀">
            {visit.associatedSigns}
          </Section>
        )}

        {/* Current Status */}
        {statusSummary && (
          <Section title="Current Status" icon="❤️">
            <StatusGroup label="Different" items={statusSummary.different} tone="changed" />
            <StatusGroup label="N/A / not sure" items={statusSummary.notSure} tone="notSure" />
            <StatusGroup label="As usual" items={statusSummary.asUsual} tone="asUsual" />
            {statusSummary.otherNotes && (
              <p style={{ margin: "4px 0 0 0", lineHeight: "1.6" }}>{statusSummary.otherNotes}</p>
            )}
          </Section>
        )}

        {/* Other Details */}
        {visit.otherDetails && (
          <Section title="Other Details" icon="📝">
            {visit.otherDetails}
          </Section>
        )}

        {/* Medications / Supplements */}
        {medicationsSupplements && (
          <Section title="Meds / Supplements" icon="💊">
            {medicationsSupplements}
          </Section>
        )}

        {/* Known Conditions */}
        {knownConditions && (
          <Section title="Known Conditions (Vet-Diagnosed)" icon="🏥">
            {knownConditions}
          </Section>
        )}

        {/* Recent Tests */}
        {recentTests && (
          <Section title="Recent Tests / Results" icon="🧪">
            {recentTests}
          </Section>
        )}

        {/* Previous Treatment */}
        {visit.previousTreatment && (
          <Section title="Previous Treatment" icon="📋">
            {visit.previousTreatment}
          </Section>
        )}

        {/* Questions for Vet */}
        {visit.questionsVet && (
          <Section title="Questions for Your Veterinarian" icon="❓">
            {visit.questionsVet}
          </Section>
        )}

        {/* Attachments */}
        {!!visit.attachments?.length && (
          <Section title="Photos, Video & Audio" icon="📎">
            <AttachmentGallery attachments={visit.attachments} />
          </Section>
        )}

        {/* Visit Notes Section */}
        {note && (
          <>
            <div style={{ height: 4, background: "var(--green)", borderRadius: 4, margin: "22px 0 16px 0" }} />

            <h3 style={{ margin: "0 0 14px 0", fontSize: "18px", color: "var(--green)", fontWeight: 800 }}>
              Visit Notes
            </h3>

            {note.vetName && (
              <Section title="Veterinarian" icon="👩‍⚕️" accent="var(--green)">
                {note.vetName}
              </Section>
            )}

            {note.diagnosis && (
              <Section title="Diagnosis / Findings" icon="🔍" accent="var(--green)">
                {note.diagnosis}
              </Section>
            )}

            {note.testsPerformed && (
              <Section title="Tests Performed" icon="🧪" accent="var(--green)">
                {note.testsPerformed}
              </Section>
            )}

            {note.treatmentMeds && (
              <Section title="Medications / Treatment" icon="💊" accent="var(--green)">
                {note.treatmentMeds}
              </Section>
            )}

            {note.homeInstructions && (
              <Section title="Instructions at Home" icon="🏠" accent="var(--green)">
                {note.homeInstructions}
              </Section>
            )}

            {note.followUp && (
              <Section title="Follow-up Plan" icon="🔔" accent="var(--green)">
                {note.followUp}
              </Section>
            )}

            {!!note.attachments?.length && (
              <Section title="Photos, Video & Audio" icon="📎" accent="var(--green)">
                <AttachmentGallery attachments={note.attachments} />
              </Section>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="row rowWrap" style={{ marginTop: "16px" }}>
        <button className="btn btnPrimary" onClick={handleDownloadPDF}>
          📥 Download as PDF
        </button>
        <button className="btn btnSecondary" onClick={handleShareWithVet}>
          📤 Share with Vet
        </button>
      </div>
    </div>
  );
}
