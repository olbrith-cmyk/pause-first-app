import type { ReactNode } from "react";
import type { Lang } from "../i18n";
import type { CurrentStatus, Pet, TriState, Visit, VisitNote } from "../firestore";
import { healthBackgroundRows, medicationsSummary, patientInfoBasicsRows, pdfSignalmentLine } from "../utils/petInfo";
import { durationText, trendLabel, urgencyLabel } from "../utils/visitBrief";
import AttachmentGallery from "./AttachmentGallery";

// This component exists only to be screenshotted (via html2canvas, one
// ".docPage" at a time) for the downloaded/shared PDF — see pdfExport.tsx.
// It is never mounted into the visible page, so it's fine for its layout
// and data formatting to differ from ViewDocument.tsx, the on-screen
// document, which stays exactly as it was.

type StatusFinding = { label: string; notes: string };

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

  const different: StatusFinding[] = [];
  const notSure: StatusFinding[] = [];
  const asUsual: string[] = [];

  for (const it of items) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const label = lang === "da" ? it.labelDa : it.labelEn;
    if (v === "changed") different.push({ label, notes });
    else if (v === "na") notSure.push({ label, notes });
    else asUsual.push(label);
  }

  const otherNotes = (cs.otherNotes ?? "").trim();

  if (!different.length && !notSure.length && !asUsual.length && !otherNotes) return null;
  return { different, notSure, asUsual, otherNotes };
}

const AMBER = "#9c6b2e";

function PauseMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="13" fill="none" stroke="var(--blue)" strokeWidth="2" />
      <rect x="10" y="8" width="2.6" height="12" rx="1" fill="var(--blue)" />
      <rect x="15.4" y="8" width="2.6" height="12" rx="1" fill="var(--blue)" />
    </svg>
  );
}

function DocHeader({ lang, subtitle }: { lang: Lang; subtitle: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        paddingBottom: 10,
        marginBottom: 16,
        borderBottom: "2px solid var(--blue)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PauseMark />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Pause First</div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
            {lang === "da" ? "Gå forberedt ind." : "Walk in prepared."}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", letterSpacing: "0.3px" }}>
          {lang === "da" ? "KOMPLET EJER-FORBEREDT BESØGSBRIEF" : "COMPLETE OWNER-PREPARED VISIT BRIEF"}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function DocFooter({ petName, lang, page, totalPages }: { petName: string; lang: Lang; page: number; totalPages: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginTop: 20,
        paddingTop: 10,
        borderTop: "1px solid var(--border)"
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
          {lang === "da" ? `Forberedt af ${petName}s ejer med Pause First.` : `Prepared by ${petName}'s owner using Pause First.`}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {lang === "da"
            ? "Kun ejer-rapporterede oplysninger. Ikke en diagnose, triagevurdering eller journal."
            : "Owner-reported information only. Not a diagnosis, triage assessment, or medical record."}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
        {page} / {totalPages}
      </div>
    </div>
  );
}

// A page is its own bordered sheet, screenshotted independently for the PDF
// export so pagination happens at these deliberate boundaries instead of an
// arbitrary pixel cut partway through a section.
function DocPage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px",
        marginBottom: 16
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, color = "var(--blue)" }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        margin: "18px 0 8px 0"
      }}
    >
      {children}
    </div>
  );
}

// A single labeled field, boxed and lightly shaded so a scanning eye can
// separate one answer from the next.
function FieldBox({ label, children, shaded, empty }: { label: string; children: ReactNode; shaded?: boolean; empty?: boolean }) {
  return (
    <div
      className="pdfBlock"
      style={{
        padding: "10px 14px",
        marginBottom: 8,
        background: shaded ? "var(--bg)" : "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, lineHeight: "1.5", color: empty ? AMBER : "var(--text)" }}>{children}</div>
    </div>
  );
}

// Two FieldBoxes side by side, collapsing to a single column when narrow.
function FieldPair({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function InfoTable({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null;
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="pdfBlock"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "8px 10px",
            background: i % 2 === 1 ? "var(--bg)" : "var(--card)",
            borderRadius: 6
          }}
        >
          <div style={{ width: 190, flexShrink: 0, color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{r.label}</div>
          <div style={{ fontSize: 14, color: "var(--text)" }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

// Same visual language as InfoTable, but for fields that are always asked
// (so a blank one is shown with the amber "not provided" placeholder,
// instead of being silently omitted like a blank profile field is).
function AskedInfoRow({ label, value, placeholder, shaded }: { label: string; value: string; placeholder: string; shaded?: boolean }) {
  const empty = !value.trim();
  return (
    <div
      className="pdfBlock"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        padding: "8px 10px",
        background: shaded ? "var(--bg)" : "var(--card)",
        borderRadius: 6
      }}
    >
      <div style={{ width: 190, flexShrink: 0, color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 14, color: empty ? AMBER : "var(--text)" }}>{empty ? placeholder : value}</div>
    </div>
  );
}

function ThreeUp({ items }: { items: { label: string; value: string }[] }) {
  const present = items.filter((i) => i.value.trim());
  if (!present.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
      {present.map((i) => (
        <div key={i.label} className="pdfBlock" style={{ padding: "8px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {i.label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{i.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function PdfVisitBriefDocument({
  lang,
  visit,
  pet,
  note
}: {
  lang: Lang;
  visit: Visit;
  pet: Pet;
  note: VisitNote | null;
}) {
  const tt = (en: string, da: string) => (lang === "da" ? da : en);

  const basicsRows = patientInfoBasicsRows(pet, lang);
  const healthRows = healthBackgroundRows(pet, lang);
  const visitDateParsed = visit.visitDate ? new Date(visit.visitDate) : null;
  const signalmentAsOf = visitDateParsed && !Number.isNaN(visitDateParsed.getTime()) ? visitDateParsed : new Date();
  const signalment = pdfSignalmentLine(pet, lang, signalmentAsOf);
  const statusSummary = currentStatusSummary(visit.currentStatus, lang);
  // The visit brief shows the fresher, per-visit "meds & supplements" answer
  // — falling back to the pet's standing profile list only if that wasn't
  // asked/answered, so real medication data is never hidden either way.
  const medsSupplements = (visit.medicationsSupplements ?? "").trim() || medicationsSummary(pet, lang);
  const knownConditions = ((visit as any).knownConditions as string) ?? "";
  const recentTests = ((visit as any).recentTests as string) ?? "";
  const notProvided = tt("Not provided by owner", "Ikke oplyst af ejeren");
  // Routine visits skip the Timeline/Patterns/Other details steps in the
  // wizard entirely (see PrepareWizard), so those questions were never
  // actually asked — show them only if there's real content, matching the
  // on-screen document's behavior.
  const routineSkipsExtras = visit.urgency === "routine";

  const totalPages = note ? 3 : 2;
  const petName = pet.name || tt("the pet", "dyret");
  const subtitle = tt("Owner information organised without clinical interpretation", "Ejerinformation organiseret uden klinisk fortolkning");

  const durationVal = durationText(visit.durationValue, visit.durationUnit, lang);

  return (
    <div>
      {/* ---------- PAGE 1: Visit Brief ---------- */}
      <DocPage className="docPage">
        <DocHeader lang={lang} subtitle={subtitle} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "var(--text)" }}>{pet.name}</h2>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
              {tt("Visit Date", "Besøgsdato")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {visit.visitDate || tt("Not specified", "Ikke angivet")}
            </div>
          </div>
        </div>
        {signalment && <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>{signalment}</div>}

        <div
          className="pdfBlock"
          style={{
            padding: "16px 18px",
            marginBottom: 14,
            background: "var(--lightBlue)",
            border: "1px solid var(--blue)",
            borderRadius: 12
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>
            {tt("Main Concern", "Hovedbekymring")}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, lineHeight: "1.5", color: "var(--text)" }}>
            {visit.mainConcern || notProvided}
          </div>
        </div>

        <ThreeUp
          items={[
            { label: tt("Owner Concern", "Ejerens bekymring"), value: urgencyLabel(visit.urgency, lang) },
            { label: tt("Duration", "Varighed"), value: durationVal },
            { label: tt("Owner-Described Course", "Ejerens beskrivelse af forløb"), value: trendLabel(visit.trend, lang) }
          ]}
        />

        <SectionLabel>{tt("History Provided by Owner", "Historik oplyst af ejeren")}</SectionLabel>

        {(visit.functionalImpact || !routineSkipsExtras) && (
          <FieldBox label={tt("Impact on Daily Life", "Indvirkning på hverdagen")} empty={!visit.functionalImpact}>
            {visit.functionalImpact || notProvided}
          </FieldBox>
        )}
        {(visit.whenStart || !routineSkipsExtras) && (
          <FieldBox label={tt("When Did This Start?", "Hvornår startede det?")} shaded empty={!visit.whenStart}>
            {visit.whenStart || notProvided}
          </FieldBox>
        )}
        {(visit.howProgressing || !routineSkipsExtras) && (
          <FieldBox label={tt("How Is It Progressing?", "Hvordan udvikler det sig?")} empty={!visit.howProgressing}>
            {visit.howProgressing || notProvided}
          </FieldBox>
        )}
        {(visit.patterns || visit.otherDetails || !routineSkipsExtras) && (
          <FieldPair>
            <FieldBox label={tt("Patterns or Triggers", "Mønstre eller udløsende faktorer")} shaded empty={!visit.patterns}>
              {visit.patterns || notProvided}
            </FieldBox>
            <FieldBox label={tt("Other Details", "Andre detaljer")} shaded empty={!visit.otherDetails}>
              {visit.otherDetails || notProvided}
            </FieldBox>
          </FieldPair>
        )}

        {statusSummary && (
          <>
            <SectionLabel color="var(--green)">
              {tt("Current Status Compared with Normal", "Nuværende status ift. normalt")}
            </SectionLabel>
            <div style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8 }}>
              {!!statusSummary.different.length && (
                <div style={{ marginBottom: statusSummary.notSure.length || statusSummary.asUsual.length ? 10 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
                    {tt("Different", "Anderledes")}
                  </div>
                  {statusSummary.different.map((f) => (
                    <div key={f.label} className="pdfBlock" style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 14, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{f.label}</span>
                      {f.notes && <span style={{ color: "var(--text)" }}>{f.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
              {!!statusSummary.notSure.length && (
                <div style={{ marginBottom: statusSummary.asUsual.length ? 10 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>
                    {tt("N/A / Not Sure", "Ikke relevant / ved ikke")}
                  </div>
                  {statusSummary.notSure.map((f) => (
                    <div key={f.label} className="pdfBlock" style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 14, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{f.label}</span>
                      {f.notes && <span style={{ color: "var(--text)" }}>{f.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
              {!!statusSummary.asUsual.length && (
                <div className="pdfBlock" style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 800, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.3px", marginRight: 6 }}>
                    {tt("As Usual", "Som normalt")}
                  </span>
                  <span style={{ color: "var(--muted)" }}>{statusSummary.asUsual.join(" | ")}</span>
                </div>
              )}
              {statusSummary.otherNotes && (
                <p className="pdfBlock" style={{ margin: "8px 0 0 0", fontSize: 14, lineHeight: "1.6" }}>{statusSummary.otherNotes}</p>
              )}
            </div>
          </>
        )}

        <FieldPair>
          <FieldBox label={tt("Previous Treatment", "Tidligere behandling")} empty={!visit.previousTreatment}>
            {visit.previousTreatment || notProvided}
          </FieldBox>
          <FieldBox label={tt("Question for the Veterinarian", "Spørgsmål til dyrlægen")} empty={!visit.questionsVet}>
            {visit.questionsVet || notProvided}
          </FieldBox>
        </FieldPair>

        {!!visit.attachments?.length && (
          <>
            <SectionLabel>{tt("Photos, Video & Audio", "Fotos, video & lyd")}</SectionLabel>
            <div className="pdfBlock">
              <AttachmentGallery attachments={visit.attachments} />
            </div>
          </>
        )}

        <DocFooter petName={petName} lang={lang} page={1} totalPages={totalPages} />
      </DocPage>

      {/* ---------- PAGE 2: Patient & Health Information ---------- */}
      <DocPage className="docPage">
        <DocHeader lang={lang} subtitle={subtitle} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 2 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{pet.name}</h2>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {tt("Visit date", "Besøgsdato")}: {visit.visitDate || tt("Not specified", "Ikke angivet")}
          </div>
        </div>
        <h3 style={{ margin: "2px 0 2px 0", fontSize: 16, color: "var(--text)" }}>
          {tt("Patient and Health Information", "Patient- og sundhedsoplysninger")}
        </h3>
        <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
          {tt(
            "Every field is retained. 'Not provided' is not interpreted as 'none'.",
            "Alle felter bevares. 'Ikke oplyst' fortolkes ikke som 'ingen'."
          )}
        </p>

        {!!basicsRows.length && (
          <>
            <SectionLabel color="var(--green)">{tt("Patient Information", "Patientinformation")}</SectionLabel>
            <InfoTable rows={basicsRows} />
          </>
        )}

        <SectionLabel color="var(--green)">
          {tt("Health Background Supplied by Owner", "Sundhedsbaggrund oplyst af ejeren")}
        </SectionLabel>
        <div>
          <AskedInfoRow label={tt("Meds / Supplements", "Medicin / tilskud")} value={medsSupplements} placeholder={notProvided} />
          <AskedInfoRow
            label={tt("Known Conditions (Vet-Diagnosed)", "Kendte tilstande (dyrlæge-diagnosticeret)")}
            value={knownConditions}
            placeholder={notProvided}
            shaded
          />
          <AskedInfoRow
            label={tt("Recent Tests / Results", "Nylige tests / resultater")}
            value={recentTests}
            placeholder={notProvided}
          />
          {healthRows.map((r, i) => (
            <div key={r.label} className="pdfBlock" style={{ padding: "8px 10px", background: (i + 3) % 2 === 1 ? "var(--bg)" : "var(--card)", borderRadius: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
              <div style={{ width: 190, flexShrink: 0, color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{r.label}</div>
              <div style={{ fontSize: 14, color: "var(--text)" }}>{r.value}</div>
            </div>
          ))}
        </div>

        <div className="pdfBlock" style={{ marginTop: 14, padding: "10px 12px", background: "var(--bg)", borderRadius: 8, fontSize: 12, color: "var(--muted)" }}>
          <strong style={{ color: "var(--text)" }}>{tt("Reading key:", "Sådan læses det:")}</strong>{" "}
          {tt(
            "'None known' is an owner answer. 'Not provided' means no answer was entered.",
            "'Ingen kendte' er et ejer-svar. 'Ikke oplyst' betyder, at der ikke blev indtastet et svar."
          )}
        </div>

        <DocFooter petName={petName} lang={lang} page={2} totalPages={totalPages} />
      </DocPage>

      {/* ---------- PAGE 3: Visit Notes (only once the vet visit has happened) ---------- */}
      {note && (
        <DocPage className="docPage">
          <DocHeader lang={lang} subtitle={subtitle} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 2 }}>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{pet.name}</h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {tt("Visit date", "Besøgsdato")}: {visit.visitDate || tt("Not specified", "Ikke angivet")}
            </div>
          </div>
          <h3 style={{ margin: "2px 0 14px 0", fontSize: 16, color: "var(--green)" }}>{tt("Visit Notes", "Besøgsnoter")}</h3>

          {note.vetName && <FieldBox label={tt("Veterinarian", "Dyrlæge")}>{note.vetName}</FieldBox>}
          {note.diagnosis && (
            <FieldBox label={tt("Diagnosis / Findings", "Diagnose / Fund")} shaded>
              {note.diagnosis}
            </FieldBox>
          )}
          {note.testsPerformed && <FieldBox label={tt("Tests Performed", "Udførte tests")}>{note.testsPerformed}</FieldBox>}
          {note.treatmentMeds && (
            <FieldBox label={tt("Medications / Treatment", "Medicin / Behandling")} shaded>
              {note.treatmentMeds}
            </FieldBox>
          )}
          {note.homeInstructions && (
            <FieldBox label={tt("Instructions at Home", "Instruktioner derhjemme")}>{note.homeInstructions}</FieldBox>
          )}
          {note.followUp && (
            <FieldBox label={tt("Follow-up Plan", "Opfølgningsplan")} shaded>
              {note.followUp}
            </FieldBox>
          )}

          {!!note.attachments?.length && (
            <>
              <SectionLabel color="var(--green)">{tt("Photos, Video & Audio", "Fotos, video & lyd")}</SectionLabel>
              <div className="pdfBlock">
                <AttachmentGallery attachments={note.attachments} />
              </div>
            </>
          )}

          <DocFooter petName={petName} lang={lang} page={3} totalPages={totalPages} />
        </DocPage>
      )}
    </div>
  );
}
