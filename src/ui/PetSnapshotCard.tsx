import { useMemo, useState } from "react";
import type { Pet } from "../firestore";
import { fullProfileRows, preventativesSummary, vaccinationsSummary } from "../utils/petInfo";

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
    return fullProfileRows(pet, lang);
  }, [pet, lang]);

  if (!pet) return null;

  // Collapsed one-liner (keep it short)
  const collapsedLine = useMemo(() => {
    const bits: string[] = [];
    const vSummary = vaccinationsSummary(pet, lang);
    if (vSummary) bits.push(`${lang === "da" ? "Vacciner" : "Vaccines"}: ${vSummary}`);
    if (pet.diet?.trim()) bits.push(`${lang === "da" ? "Foder" : "Diet"}: ${pet.diet.trim()}`);
    const pSummary = preventativesSummary(pet, lang);
    if (pSummary) bits.push(`${lang === "da" ? "Forebyggelse" : "Preventatives"}: ${pSummary}`);
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
