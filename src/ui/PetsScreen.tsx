import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type {
  Pet,
  Visit,
  VisitNote,
  PetMedicationItem,
  PetVaccineItem,
  PetPreventativeItem
} from "../firestore";
import { addPet, deletePet, getUserPets, updatePet, getUserVisits, getVisitNote } from "../firestore";
import { ViewOnlyPet } from "./ViewOnlyPet";
import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
import { ViewOnlyNotes } from "./ViewOnlyNotes";
import PrepareWizard from "./PrepareWizard";

const emptyPet = (userId: string): Pet => ({
  userId,
  name: "",
  species: "",
  age: "", // legacy (kept for old data; not shown in UI)
  breedType: "",
  dateOfBirth: "",
  sex: "",
  neuteredStatus: "",
  weight: "",
  microchip: "",
  allergies: "",
  medications: "", // legacy (kept; not shown in UI)
  diet: "",
  medsSupplements: [],
  vaccinations: [],
  preventativesList: [],
  clinic: "",
  emergencyContact: "",
  notes: ""
});

const blankMed = (): PetMedicationItem => ({
  name: "",
  dose: "",
  howOften: "",
  notes: "",
  unsureDose: false
});

const blankVaccine = (): PetVaccineItem => ({
  vaccine: "",
  dateGiven: "",
  notes: "",
  unsureName: false
});

const blankPreventative = (): PetPreventativeItem => ({
  type: "",
  productName: "",
  howOften: "",
  lastGiven: "",
  notes: ""
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panelHeader">
        <h4 style={{ margin: 0 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function PetsScreen({
  lang,
  userId,
  onFirstPetSaved,
  startInAddMode,
  onEnteredAddMode,
}: {
  lang: Lang;
  userId: string;
  onFirstPetSaved?: () => void;
  startInAddMode?: boolean;
  onEnteredAddMode?: () => void;
}) {
  
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Pet>(emptyPet(userId));

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isFirstPet, setIsFirstPet] = useState(false);

  // Wizard + visit viewing
  const [showWizard, setShowWizard] = useState(false);
  const [viewingVisit, setViewingVisit] = useState<Visit | null>(null);
  const [viewingVisitNote, setViewingVisitNote] = useState<VisitNote | null>(null);

  const load = async () => {
    const [petList, visitList] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(petList);
    setVisits(visitList);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
  if (!startInAddMode) return;
  startNew();
  onEnteredAddMode?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [startInAddMode]);

  const selectedPetVisits = useMemo(() => {
    if (!selected?.id) return [];
    return visits
      .filter((v) => v.petId === selected.id)
      .sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));
  }, [visits, selected]);

  const openView = (pet: Pet) => {
    setSelected(pet);
    setEditing({
      ...emptyPet(userId),
      ...pet,
      medsSupplements: pet.medsSupplements ?? [],
      vaccinations: pet.vaccinations ?? [],
      preventativesList: pet.preventativesList ?? []
    });
    setMode("view");
    setViewingVisit(null);
    setViewingVisitNote(null);
    setStatus(null);
    setError(null);
  };

  const startNew = () => {
    setSelected(null);
    setEditing(emptyPet(userId));
    setMode("edit");
    setStatus(null);
    setError(null);
    setIsFirstPet(pets.length === 0);
    setViewingVisit(null);
    setViewingVisitNote(null);
  };

  const cancel = () => {
    setSelected(null);
    setEditing(emptyPet(userId));
    setMode("view");
    setStatus(null);
    setError(null);
    setIsFirstPet(false);
    setViewingVisit(null);
    setViewingVisitNote(null);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditing({
      ...emptyPet(userId),
      ...selected,
      medsSupplements: selected.medsSupplements ?? [],
      vaccinations: selected.vaccinations ?? [],
      preventativesList: selected.preventativesList ?? []
    });
    setMode("edit");
    setStatus(null);
    setError(null);
  };

  const save = async () => {
    setError(null);
    setStatus(null);
    try {
      // Normalize arrays so Firestore always gets arrays (not undefined)
      const normalized: Pet = {
        ...editing,
        medsSupplements: editing.medsSupplements ?? [],
        vaccinations: editing.vaccinations ?? [],
        preventativesList: editing.preventativesList ?? []
      };

      if (normalized.id) {
        const { id, ...rest } = normalized;
        await updatePet(id, rest);
      } else {
        await addPet(normalized);
      }

      setStatus(t.saved);
      await load();
      setMode("view");

      // If it was the first pet, optionally notify parent
      if (isFirstPet && !normalized.id && onFirstPetSaved) {
        setTimeout(() => onFirstPetSaved(), 300);
      }

      // Re-select updated pet if editing existing
      if (normalized.id) {
        const updated = (await getUserPets(userId)).find((p) => p.id === normalized.id) ?? null;
        setSelected(updated);
        if (updated) {
          setEditing({
            ...emptyPet(userId),
            ...updated,
            medsSupplements: updated.medsSupplements ?? [],
            vaccinations: updated.vaccinations ?? [],
            preventativesList: updated.preventativesList ?? []
          });
        }
      } else {
        // New pet: go back to list
        cancel();
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const remove = async (petId: string) => {
    if (!confirm(lang === "da" ? "Slet kæledyr?" : "Delete pet?")) return;
    await deletePet(petId);
    await load();
    cancel();
  };

  const openVisitView = async (visit: Visit) => {
    setViewingVisit(visit);
    try {
      const note = await getVisitNote(userId, visit.id!);
      setViewingVisitNote(note ?? null);
    } catch (e) {
      console.error("Error loading visit note:", e);
      setViewingVisitNote(null);
    }
  };

  return (
    <div className="pageContent">
      <div className="stack">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
  <h3 style={{ margin: 0 }}>{lang === "da" ? "Mine dyr" : "My animals"}</h3>

  {mode === "edit" ? (
    <button className="btn btnSecondary" onClick={cancel}>
      {lang === "da" ? "Annuller" : "Cancel"}
    </button>
  ) : (
    <button className="btn btnPrimary" onClick={startNew}>
      {pets.length === 0
        ? lang === "da"
          ? "+ Tilføj dit første dyr"
          : "+ Add your first animal"
        : lang === "da"
          ? "+ Tilføj endnu et dyr"
          : "+ Add another animal"}
    </button>
  )}
</div>

        {/* List of pets (when nothing selected and not editing) */}
        {!selected && mode !== "edit" && (
          <div className="stack">
            {pets.length === 0 ? (
              <div className="muted">
                {lang === "da"
                  ? "Ingen kæledyr endnu. Klik “+ Tilføj dit første kæledyr” for at komme i gang."
                  : 'No pets yet. Click "+ Add Your First Pet" to get started.'}
              </div>
            ) : (
              pets.map((pet) => (
                <button
                  key={pet.id}
                  className="itemCard"
                  onClick={() => openView(pet)}
                  style={{ cursor: "pointer", textAlign: "left" }}
                >
                  <div className="itemTitle">{pet.name || "(Unnamed)"}</div>
                  <div className="muted">{pet.species || (lang === "da" ? "Ukendt art" : "Unknown species")}</div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Main panel (selected pet or editing) */}
        {(selected || mode === "edit") && (
          <div className="panel">
            <div className="panelHeader">
              <h4 style={{ margin: 0 }}>
                {isFirstPet && !selected
                  ? lang === "da"
                    ? "Tilføj dit første kæledyr"
                    : "Add Your First Pet"
                  : selected
                    ? selected.name || "(Unnamed)"
                    : lang === "da"
                      ? "Nyt kæledyr"
                      : "New Pet"}
              </h4>
            </div>

            {/* VIEW MODE */}
            {mode === "view" && selected && !viewingVisit && (
              <>
                <ViewOnlyPet pet={selected} />

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn btnPrimary" onClick={() => setShowWizard(true)}>
                    {lang === "da" ? "+ Tilføj besøg for " : "+ Add visit for "}
                    {selected.name || (lang === "da" ? "dette kæledyr" : "this pet")}
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <h4 style={{ margin: "8px 0" }}>{lang === "da" ? "Besøg" : "Visits"}</h4>
                  {selectedPetVisits.length === 0 ? (
                    <div className="muted">
                      {lang === "da" ? "Ingen besøg endnu for dette kæledyr." : "No visits yet for this pet."}
                    </div>
                  ) : (
                    <div className="stack">
                      {selectedPetVisits.map((v) => (
                        <button
                          key={v.id}
                          className="itemCard"
                          onClick={() => openVisitView(v)}
                          style={{ cursor: "pointer", textAlign: "left" }}
                        >
                          <div className="itemTitle">{v.visitDate || (lang === "da" ? "Ingen dato" : "No date")}</div>
                          <div className="muted">
                            {v.mainConcern || (lang === "da" ? "Ingen hovedbekymring endnu." : "No main concern yet.")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="row" style={{ marginTop: 16, gap: 8 }}>
                  <button className="btn btnPrimary" onClick={openEdit}>
                    {t.editPet}
                  </button>
                  <button className="btn btnSecondary" onClick={() => remove(selected.id!)}>
                    {t.deletePet}
                  </button>
                  <button className="btn btnSecondary" onClick={cancel}>
                    {t.cancel}
                  </button>
                </div>
              </>
            )}

            {/* VIEWING A VISIT */}
            {mode === "view" && viewingVisit && (
              <>
                <div className="row" style={{ marginBottom: 12 }}>
                  <button
                    className="btn btnSecondary"
                    onClick={() => {
                      setViewingVisit(null);
                      setViewingVisitNote(null);
                    }}
                  >
                    ← {t.back}
                  </button>
                </div>

                <ViewOnlyPrepare visit={viewingVisit} />
                {viewingVisitNote ? (
                  <ViewOnlyNotes note={viewingVisitNote} />
                ) : (
                  <div className="muted">{lang === "da" ? "Ingen besøgsnoter endnu." : "No visit notes yet."}</div>
                )}
              </>
            )}

            {/* EDIT MODE */}
            {mode === "edit" && (
              <>
                {/* Helper microcopy */}
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--textMuted)",
                    marginBottom: 12,
                    background: "rgba(20,40,60,0.04)",
                    border: "1px solid rgba(20,40,60,0.10)",
                    padding: 12,
                    borderRadius: 12
                  }}
                >
                  {lang === "da"
                    ? "Udfyld dette én gang — vi genbruger det til at udfylde dit Notat til dyrlægen automatisk."
                    : "Fill this in once — we’ll reuse it to auto‑fill your Visit Briefs."}
                </div>

                <Section title={lang === "da" ? "Om dit kæledyr" : "About your pet"}>
                  <div className="stack">
                    <label className="label">
                      {t.petName}
                      <input
                        className="input"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        placeholder={lang === "da" ? "fx Alf" : "e.g., Alf"}
                      />
                    </label>

                    <label className="label">
                      {t.species}
                      <input
                        className="input"
                        value={editing.species}
                        onChange={(e) => setEditing({ ...editing, species: e.target.value })}
                        placeholder={lang === "da" ? "fx Hund / Kat / Kanin" : "e.g., Dog / Cat / Rabbit"}
                      />
                    </label>

                    <label className="label">
                      {lang === "da" ? "Race / type (valgfrit)" : "Breed / type (optional)"}
                      <input
                        className="input"
                        value={editing.breedType ?? ""}
                        onChange={(e) => setEditing({ ...editing, breedType: e.target.value })}
                        placeholder={
                          lang === "da"
                            ? "fx Labrador / Huskat korthår / Blandingsrace"
                            : "e.g., Labrador / Domestic shorthair / Mixed"
                        }
                      />
                    </label>

                    <label className="label">
                      {lang === "da" ? "Fødselsdato (valgfrit)" : "Date of birth (optional)"}
                      <input
                        className="input"
                        value={editing.dateOfBirth ?? ""}
                        onChange={(e) => setEditing({ ...editing, dateOfBirth: e.target.value })}
                        placeholder={lang === "da" ? "DD/MM/ÅÅÅÅ (eller cirka)" : "DD/MM/YYYY (or approximate)"}
                      />
                    </label>

                    <label className="label">
                      {t.sex}
                      <input
                        className="input"
                        value={editing.sex}
                        onChange={(e) => setEditing({ ...editing, sex: e.target.value })}
                        placeholder={lang === "da" ? "Hun / Han" : "Female / Male"}
                      />
                    </label>

                    <label className="label">
                      {lang === "da"
                        ? "Kastreret/steriliseret (valgfrit)"
                        : "Neutered/spayed status (optional)"}
                      <input
                        className="input"
                        value={editing.neuteredStatus ?? ""}
                        onChange={(e) => setEditing({ ...editing, neuteredStatus: e.target.value })}
                        placeholder={
                          lang === "da"
                            ? "Kastreret / Steriliseret / Ikke kastreret / Ved ikke"
                            : "Neutered / Spayed / Not neutered / Not sure"
                        }
                      />
                    </label>
                  </div>
                </Section>

                <Section title={lang === "da" ? "Sundhedsbasics" : "Health basics"}>
                  <div className="stack">
                    <label className="label">
                      {t.weight}
                      <input
                        className="input"
                        value={editing.weight}
                        onChange={(e) => setEditing({ ...editing, weight: e.target.value })}
                        placeholder={
                          lang === "da"
                            ? "fx 19 kg (valgfrit: sidst opdateret 12/05/2026)"
                            : "e.g., 19 kg (optional: last updated 12/05/2026)"
                        }
                      />
                    </label>

                    <label className="label">
                      {t.allergies}
                      <textarea
                        className="textarea"
                        value={editing.allergies}
                        onChange={(e) => setEditing({ ...editing, allergies: e.target.value })}
                        rows={3}
                        placeholder={
                          lang === "da"
                            ? "fx kylling, pollen, reaktion på penicillin (hvis kendt)"
                            : "e.g., chicken, pollen, reaction to penicillin (if known)"
                        }
                      />
                    </label>

                    <label className="label">
                      {t.diet}
                      <textarea
                        className="textarea"
                        value={editing.diet}
                        onChange={(e) => setEditing({ ...editing, diet: e.target.value })}
                        rows={3}
                        placeholder={
                          lang === "da"
                            ? "fx Royal Canin Gastro — 2 måltider/dag + godbidder"
                            : "e.g., Royal Canin Gastro — 2 meals/day + treats"
                        }
                      />
                    </label>

                    {/* Structured meds list */}
                    <div style={{ marginTop: 6 }}>
                      <h4 style={{ margin: "6px 0" }}>
                        {lang === "da" ? "Medicin & tilskud (valgfrit)" : "Medications & supplements (optional)"}
                      </h4>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {lang === "da"
                          ? "Tilføj det, du giver fast — inkl. dosis og hvor ofte."
                          : "Add anything you give regularly — include dose and how often."}
                      </div>

                                            {(editing.medsSupplements ?? []).map((item, idx) => (
                        <div
                          key={`med-${idx}`}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 10,
                            background: "white"
                          }}
                        >
                          <div className="stack">
                            <label className="label">
                              {lang === "da" ? "Navn" : "Name"}
                              <input
                                className="input"
                                value={item.name}
                                onChange={(e) => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                                placeholder={lang === "da" ? "fx Apoquel" : "e.g., Apoquel"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Dosis" : "Dose"}
                              <input
                                className="input"
                                value={item.dose ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next[idx] = { ...next[idx], dose: e.target.value };
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                                placeholder={lang === "da" ? "fx 5,4 mg" : "e.g., 5.4 mg"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Hvor ofte" : "How often"}
                              <input
                                className="input"
                                value={item.howOften ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next[idx] = { ...next[idx], howOften: e.target.value };
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                                placeholder={
                                  lang === "da" ? "fx 1 tablet 1 gang dagligt" : "e.g., 1 tablet once daily"
                                }
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Noter (valgfrit)" : "Notes (optional)"}
                              <input
                                className="input"
                                value={item.notes ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next[idx] = { ...next[idx], notes: e.target.value };
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                                placeholder={
                                  lang === "da"
                                    ? "fx gives med mad / startet marts 2026"
                                    : "e.g., with food / started March 2026"
                                }
                              />
                            </label>

                            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                              <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={() => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next[idx] = { ...next[idx], unsureDose: !next[idx].unsureDose };
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                              >
                                {lang === "da" ? "Jeg er ikke sikker på dosis" : "I’m not sure about the dose"}
                              </button>

                              <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={() => {
                                  const next = [...(editing.medsSupplements ?? [])];
                                  next.splice(idx, 1);
                                  setEditing({ ...editing, medsSupplements: next });
                                }}
                                style={{ borderColor: "#d33", color: "#d33" }}
                              >
                                {lang === "da" ? "Fjern" : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            medsSupplements: [...(editing.medsSupplements ?? []), blankMed()]
                          })
                        }
                      >
                        {lang === "da" ? "+ Tilføj medicin/tilskud" : "+ Add medication/supplement"}
                      </button>
                    </div>

                    {/* Vaccinations */}
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: "6px 0" }}>
                        {lang === "da" ? "Vaccinationer (valgfrit)" : "Vaccinations (optional)"}
                      </h4>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {lang === "da"
                          ? "Tilføj det, du ved — cirka datoer er helt ok."
                          : "Add what you know — approximate dates are okay."}
                      </div>

                      {(editing.vaccinations ?? []).map((item, idx) => (
                        <div
                          key={`vac-${idx}`}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 10,
                            background: "white"
                          }}
                        >
                          <div className="stack">
                            <label className="label">
                              {lang === "da" ? "Vaccine" : "Vaccine"}
                              <input
                                className="input"
                                value={item.vaccine}
                                onChange={(e) => {
                                  const next = [...(editing.vaccinations ?? [])];
                                  next[idx] = { ...next[idx], vaccine: e.target.value };
                                  setEditing({ ...editing, vaccinations: next });
                                }}
                                placeholder={
                                  lang === "da"
                                    ? "fx Rabies / basisvaccine / Lepto / Kennel cough"
                                    : "e.g., Rabies / DHPP / Lepto / Kennel cough"
                                }
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Dato givet" : "Date given"}
                              <input
                                className="input"
                                value={item.dateGiven ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.vaccinations ?? [])];
                                  next[idx] = { ...next[idx], dateGiven: e.target.value };
                                  setEditing({ ...editing, vaccinations: next });
                                }}
                                placeholder={lang === "da" ? "DD/MM/ÅÅÅÅ (eller måned/år)" : "DD/MM/YYYY (or month/year)"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Noter (valgfrit)" : "Notes (optional)"}
                              <input
                                className="input"
                                value={item.notes ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.vaccinations ?? [])];
                                  next[idx] = { ...next[idx], notes: e.target.value };
                                  setEditing({ ...editing, vaccinations: next });
                                }}
                                placeholder={lang === "da" ? "fx booster i 2027 / mild reaktion" : "e.g., booster due in 2027 / mild reaction"}
                              />
                            </label>

                            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                              <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={() => {
                                  const next = [...(editing.vaccinations ?? [])];
                                  next[idx] = { ...next[idx], unsureName: !next[idx].unsureName };
                                  setEditing({ ...editing, vaccinations: next });
                                }}
                              >
                                {lang === "da"
                                  ? "Jeg kender ikke det præcise vaccinenavn"
                                  : "I don’t know the exact vaccine name"}
                              </button>

                              <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={() => {
                                  const next = [...(editing.vaccinations ?? [])];
                                  next.splice(idx, 1);
                                  setEditing({ ...editing, vaccinations: next });
                                }}
                                style={{ borderColor: "#d33", color: "#d33" }}
                              >
                                {lang === "da" ? "Fjern" : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            vaccinations: [...(editing.vaccinations ?? []), blankVaccine()]
                          })
                        }
                      >
                        {lang === "da" ? "+ Tilføj vaccine" : "+ Add vaccine"}
                      </button>
                    </div>

                    {/* Preventatives */}
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ margin: "6px 0" }}>
                        {lang === "da" ? "Forebyggende behandling (valgfrit)" : "Preventative treatments (optional)"}
                      </h4>
                      <div className="muted" style={{ marginBottom: 10 }}>
                        {lang === "da"
                          ? "Inkludér loppe/flåt og ormekur — hvilket produkt og hvornår det sidst blev givet."
                          : "Include flea/tick and deworming — what product and when it was last given."}
                      </div>

                      {(editing.preventativesList ?? []).map((item, idx) => (
                        <div
                          key={`prev-${idx}`}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 10,
                            background: "white"
                          }}
                        >
                          <div className="stack">
                            <label className="label">
                              {lang === "da" ? "Type" : "Type"}
                              <input
                                className="input"
                                value={item.type}
                                onChange={(e) => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next[idx] = { ...next[idx], type: e.target.value };
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                placeholder={lang === "da" ? "Loppe / Flåt / Ormekur / Andet" : "Flea / Tick / Deworming / Other"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Produktnavn" : "Product name"}
                              <input
                                className="input"
                                value={item.productName ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next[idx] = { ...next[idx], productName: e.target.value };
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                placeholder={lang === "da" ? "fx Bravecto / NexGard / Milbemax" : "e.g., Bravecto / NexGard / Milbemax"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Hvor ofte" : "How often"}
                              <input
                                className="input"
                                value={item.howOften ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next[idx] = { ...next[idx], howOften: e.target.value };
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                placeholder={lang === "da" ? "fx månedligt / hver 12. uge" : "e.g., monthly / every 12 weeks"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Sidst givet" : "Last given"}
                              <input
                                className="input"
                                value={item.lastGiven ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next[idx] = { ...next[idx], lastGiven: e.target.value };
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                placeholder={lang === "da" ? "DD/MM/ÅÅÅÅ (eller cirka)" : "DD/MM/YYYY (or approximate)"}
                              />
                            </label>

                            <label className="label">
                              {lang === "da" ? "Noter (valgfrit)" : "Notes (optional)"}
                              <input
                                className="input"
                                value={item.notes ?? ""}
                                onChange={(e) => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next[idx] = { ...next[idx], notes: e.target.value };
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                placeholder={lang === "da" ? "fx spot-on / tyggetablet / sprunget over sidste måned" : "e.g., topical / chew / missed last month"}
                              />
                            </label>

                            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                              <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={() => {
                                  const next = [...(editing.preventativesList ?? [])];
                                  next.splice(idx, 1);
                                  setEditing({ ...editing, preventativesList: next });
                                }}
                                style={{ borderColor: "#d33", color: "#d33" }}
                              >
                                {lang === "da" ? "Fjern" : "Remove"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            preventativesList: [...(editing.preventativesList ?? []), blankPreventative()]
                          })
                        }
                      >
                        {lang === "da" ? "+ Tilføj forebyggende behandling" : "+ Add preventative"}
                      </button>
                    </div>
                  </div>
                </Section>

                <Section title={lang === "da" ? "ID & noter" : "IDs & notes"}>
                  <div className="stack">
                    <label className="label">
                      {t.microchip}
                      <input
                        className="input"
                        value={editing.microchip}
                        onChange={(e) => setEditing({ ...editing, microchip: e.target.value })}
                        placeholder={lang === "da" ? "Kun tal hvis muligt (valgfrit)" : "Numbers only if possible (optional)"}
                      />
                    </label>

                    <label className="label">
                      {t.notes}
                      <textarea
                        className="textarea"
                        value={editing.notes}
                        onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                        rows={4}
                        placeholder={
                          lang === "da"
                            ? "Alt der kan hjælpe hos dyrlægen: temperament, håndtering, transportstress, kroniske ting osv."
                            : "Anything that helps at the vet: temperament, handling, travel stress, chronic issues, etc."
                        }
                      />
                    </label>
                  </div>
                </Section>

                {error && (
                  <div className="alert alertError" style={{ marginTop: 12 }}>
                    {t.error}: {error}
                  </div>
                )}
                {status && (
                  <div className="alert alertOk" style={{ marginTop: 12 }}>
                    {status}
                  </div>
                )}

                <div className="row" style={{ marginTop: 16, gap: 8 }}>
                  <button className="btn btnPrimary" onClick={save}>
                    {t.savePet}
                  </button>
                  <button className="btn btnSecondary" onClick={cancel}>
                    {t.cancel}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && selected && (
  <PrepareWizard
    lang={lang}
    userId={userId}
    petId={selected.id!}
    petName={selected.name || "Your pet"}
    onClose={() => {
      setShowWizard(false);
    }}
  />
)}
    </div>
  );
}
