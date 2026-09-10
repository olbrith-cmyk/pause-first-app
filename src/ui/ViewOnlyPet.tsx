import type { Lang } from "../i18n";
import type { Pet } from "../firestore";
import { fullProfileRows } from "../utils/petInfo";
import PetAvatar from "./PetAvatar";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="vo-row">
      <div className="vo-label">{label}</div>
      <div className="vo-value">{value}</div>
    </div>
  );
}

export function ViewOnlyPet({ pet, lang }: { pet: Pet; lang: Lang }) {
  const rows = fullProfileRows(pet, lang);

  return (
    <div className="vo">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PetAvatar photoUrl={pet.photoUrl} size={44} />
        <h3 className="vo-title" style={{ margin: 0 }}>
          {lang === "da" ? "Dyreprofil" : "Pet Profile"}
        </h3>
      </div>
      <div className="vo-card">
        <Row label={lang === "da" ? "Navn" : "Name"} value={pet.name} />
        <Row label={lang === "da" ? "Klinik" : "Clinic"} value={pet.clinic} />
        <Row label={lang === "da" ? "Nødkontakt" : "Emergency contact"} value={pet.emergencyContact} />
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}
