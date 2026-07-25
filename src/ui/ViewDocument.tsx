import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit, VisitNote } from "../firestore";
import { exportToPDF, shareWithVet } from "../utils/pdfExport";

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

  return (
    <div className="stack">
      <h3>{t.viewDocument}</h3>

      <div id="document-content" className="panel" style={{ padding: "24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px", borderBottom: "2px solid var(--border)", paddingBottom: "16px" }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "600" }}>
            {pet.name}
          </h2>
          <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>
            Visit Date: {visit.visitDate || "Not specified"}
          </p>
        </div>

        {/* Main Concern */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Main Concern</h4>
          <p style={{ margin: "0", lineHeight: "1.6" }}>
            {visit.mainConcern || "(Not provided)"}
          </p>
        </div>

        {/* When Did It Start */}
        {visit.whenStart && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>When Did This Start?</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.whenStart}</p>
          </div>
        )}

        {/* How Is It Progressing */}
        {visit.howProgressing && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>How Is It Progressing?</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.howProgressing}</p>
          </div>
        )}

        {/* Patterns */}
        {visit.patterns && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Patterns or Triggers</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.patterns}</p>
          </div>
        )}

        {/* Associated Signs */}
        {visit.associatedSigns && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Associated Signs</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.associatedSigns}</p>
          </div>
        )}

        {/* Previous Treatment */}
        {visit.previousTreatment && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Previous Treatment</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.previousTreatment}</p>
          </div>
        )}

        {/* Questions for Vet */}
        {visit.questionsVet && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Questions for Your Veterinarian</h4>
            <p style={{ margin: "0", lineHeight: "1.6" }}>{visit.questionsVet}</p>
          </div>
        )}

        {/* Visit Notes Section */}
        {note && (
          <>
            <hr style={{ margin: "24px 0", border: "none", borderTop: "2px solid var(--border)" }} />

            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Visit Notes</h3>

            {note.vetName && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Veterinarian</h4>
                <p style={{ margin: "0" }}>{note.vetName}</p>
              </div>
            )}

            {note.diagnosis && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Diagnosis / Findings</h4>
                <p style={{ margin: "0", lineHeight: "1.6" }}>{note.diagnosis}</p>
              </div>
            )}

            {note.testsPerformed && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Tests Performed</h4>
                <p style={{ margin: "0", lineHeight: "1.6" }}>{note.testsPerformed}</p>
              </div>
            )}

            {note.treatmentMeds && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Medications / Treatment</h4>
                <p style={{ margin: "0", lineHeight: "1.6" }}>{note.treatmentMeds}</p>
              </div>
            )}

            {note.homeInstructions && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Instructions at Home</h4>
                <p style={{ margin: "0", lineHeight: "1.6" }}>{note.homeInstructions}</p>
              </div>
            )}

            {note.followUp && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "var(--primary)" }}>Follow-up Plan</h4>
                <p style={{ margin: "0", lineHeight: "1.6" }}>{note.followUp}</p>
              </div>
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
