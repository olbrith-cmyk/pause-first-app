import React from "react";
import type { Pet } from "../firestore";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="vo-row">
      <div className="vo-label">{label}</div>
      <div className="vo-value">{value}</div>
    </div>
  );
}

export function ViewOnlyPet({ pet }: { pet: Pet }) {
  return (
    <div className="vo">
      <h3 className="vo-title">Pet Profile</h3>
      <div className="vo-card">
        <Row label="Name" value={pet.name} />
        <Row label="Species" value={pet.species} />
        <Row label="Age" value={pet.age} />
        <Row label="Sex" value={pet.sex} />
        <Row label="Weight" value={pet.weight} />
        <Row label="Microchip" value={pet.microchip} />
        <Row label="Allergies" value={pet.allergies} />
        <Row label="Medications" value={pet.medications} />
        <Row label="Diet" value={pet.diet} />
        <Row label="Clinic" value={pet.clinic} />
        <Row label="Emergency Contact" value={pet.emergencyContact} />
        <Row label="Notes" value={pet.notes} />
      </div>
    </div>
  );
}
