import React from "react";
import type { VisitNote } from "../firestore";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="vo-row">
      <div className="vo-label">{label}</div>
      <div className="vo-value">{value}</div>
    </div>
  );
}

export function ViewOnlyNotes({ note }: { note?: VisitNote }) {
  const hasAny =
    !!note &&
    !!(
      note.vetName ||
      note.diagnosis ||
      note.testsPerformed ||
      note.treatmentMeds ||
      note.homeInstructions ||
      note.followUp
    );

  return (
    <div className="vo">
      <h3 className="vo-title">Visit Notes</h3>

      <div className="vo-card">
        <Row label="Vet Name" value={note?.vetName} />
        <Row label="Diagnosis / Findings" value={note?.diagnosis} />
        <Row label="Tests Performed" value={note?.testsPerformed} />
        <Row label="Treatment / Medications" value={note?.treatmentMeds} />
        <Row label="Home Instructions" value={note?.homeInstructions} />
        <Row label="Follow-up" value={note?.followUp} />
      </div>

      {!hasAny && <p className="muted">No visit notes saved yet.</p>}
    </div>
  );
}
