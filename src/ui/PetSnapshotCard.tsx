import { useMemo, useState } from "react";
import type { Pet } from "../firestore";

function vaccineLabel(lang: "da" | "en", v?: Pet["vaccinationStatus"]) {
  if (!v) return "";
  if (lang === "da") {
    if (v === "up_to_date") return "Opdateret";
    if (v === "not_up_to_date") return "Ikke opdateret";
    return "Ikke sikker";
  }
  if (v === "up_to_date") return "Up to date";
  if (v === "not_up_to_date") return "Not up to date";
  return "Not sure";
}

export default function PetSnapshotCard(props: {
  pet: Pet | null;
  lang: "da" | "en";
  defaultOpen?: boolean;
  onEditForThisVisit?: () => void;   // optional (later)
  onUpdatePetInfo?: () => void;      // optional (later)
}) {
  const { pet, lang, defaultOpen = false } = props;
  const [open, setOpen] = useState(defaultOpen);

  const rows = useMemo(() => {
    if (!pet) return [];

    const vLabel = vaccineLabel(lang, pet.vaccinationStatus);
    const vDate = pet.vaccinationLastDate?.trim();

    const out: { label: string; value: string }[] = [];

    const push = (label: string, value?: string) => {
      const v = (value ?? "").trim();
      if (v) out.push({ label, value: v });
    };

    push(lang === "da" ? "Art" : "Species", pet.species);
    push(lang === "da" ? "Alder" : "Age", pet.age);
    push(lang === "da" ? "Køn" : "Sex", pet.sex);
    push(lang === "da" ? "Vægt" : "Weight", pet.weight);
    push(lang === "da" ? "Mikrochip" : "Microchip", pet.microchip);

    if (vLabel || vDate) {
      push(
        lang === "da" ? "Vaccinationer" : "Vaccinations",
        [vLabel, vDate ? (lang === "da" ? `Sidst: ${vDate}` : `Last: ${vDate}`) : ""]
          .filter(Boolean)
          .join(" • ")
      );
    }

    push(lang === "da" ? "Foder" : "Diet / feed", pet.diet);
    push(lang === "da" ? "Forebyggelse" : "Preventatives", pet.preventatives);
    push(lang === "da" ? "Medicin" : "Medications", pet.medications);
    push(lang === "da" ? "Allergier/reaktioner" : "Allergies / reactions", pet.allergies);
    push(lang === "da" ? "Operationer/indgreb" : "Surgeries / procedures", pet.surgeries);
    push(lang === "da" ? "Livsstil/miljø" : "Lifestyle / environment", pet.lifestyle);

    return out;
  }, [pet, lang]);

  if (!pet) return null;

  // Collapsed one-liner (keep it short)
  const collapsedLine = useMemo(() => {
    const bits: string[] = [];
    const vLabel = vaccineLabel(lang, pet.vaccinationStatus);
    if (vLabel) bits.push(`${lang === "da" ? "Vacciner" : "Vaccines"}: ${vLabel}`);
    if (pet.diet?.trim()) bits.push(`${lang === "da" ? "Foder" : "Diet"}: ${pet.diet.trim()}`);
    if (pet.preventatives?.trim())
      bits.push(`${lang === "da" ? "Forebyggelse" : "Preventatives"}: ${pet.preventatives.trim()}`);
    return bits.join(" • ");
  }, [pet, lang]);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {lang === "da" ? "Pet Snapshot (baggrund)" : "Pet Snapshot (background)"}
        </div>

        <button className="btnSecondary" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? (lang === "da" ? "Skjul" : "Hide") : (lang === "da" ? "Vis" : "Show")}
        </button>
      </div>

      {!open && (
        <div style={{ marginTop: 8, fontSize: 14, color: "rgba(15,25,35,0.92)" }}>
          {collapsedLine || (lang === "da" ? "Ingen baggrundsoplysninger endnu." : "No background info yet.")}
        </div>
      )}

      {open && (
        <div style={{ marginTop: 10 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", gap: 10, padding: "6px 0" }}>
              <div style={{ width: 160, fontWeight: 700, color: "rgba(15,25,35,0.75)" }}>
                {r.label}
              </div>
              <div style={{ flex: 1, color: "rgba(15,25,35,0.92)" }}>{r.value}</div>
            </div>
          ))}

          {(props.onEditForThisVisit || props.onUpdatePetInfo) && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {props.onEditForThisVisit && (
                <button className="btnSecondary" type="button" onClick={props.onEditForThisVisit}>
                  {lang === "da" ? "Redigér kun for dette besøg" : "Edit for this visit"}
                </button>
              )}
              {props.onUpdatePetInfo && (
                <button className="btnPrimary" type="button" onClick={props.onUpdatePetInfo}>
                  {lang === "da" ? "Opdatér Pet Info" : "Update Pet Info"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
