import React from "react";
import type { Visit } from "../firestore";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="vo-row">
      <div className="vo-label">{label}</div>
      <div className="vo-value">{value}</div>
    </div>
  );
}

export function ViewOnlyPrepare({ visit }: { visit: Visit }) {
  const hasAny = !!(
    visit.mainConcern ||
    visit.whenStart ||
    visit.howProgressing ||
    visit.patterns ||
    visit.associatedSigns ||
    visit.previousTreatment ||
    visit.questionsVet
  );

  return (
    <div className="vo">
      <h3 className="vo-title">Preparation</h3>

      <div className="vo-card">
        <Row label="Main Concern" value={visit.mainConcern} />
        <Row label="When Started" value={visit.whenStart} />
        <Row label="Progression" value={visit.howProgressing} />
        <Row label="Patterns / Triggers" value={visit.patterns} />
        <Row label="Associated Signs" value={visit.associatedSigns} />
        <Row label="Previous Treatment" value={visit.previousTreatment} />
        <Row label="Questions for Vet" value={visit.questionsVet} />
      </div>

      {!hasAny && <p className="muted">No preparation saved yet.</p>}
    </div>
  );
}
