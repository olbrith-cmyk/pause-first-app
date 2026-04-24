import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet } from "../firestore";
import { addPet, deletePet, getUserPets, updatePet } from "../firestore";
import { ViewOnlyPet } from "./ViewOnlyPet";

const emptyPet = (userId: string): Pet => ({
  userId,
  name: "",
  species: "",
  age: "",
  sex: "",
  weight: "",
  microchip: "",
  allergies: "",
  medications: "",
  diet: "",
  clinic: "",
  emergencyContact: "",
  notes: ""
});

export default function PetsScreen({
  lang,
  userId,
  onFirstPetSaved
}: {
  lang: Lang;
  userId: string;
  onFirstPetSaved?: () => void;
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Pet>(emptyPet(userId));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFirstPet, setIsFirstPet] = useState(false);

  const load = async () => {
    const list = await getUserPets(userId);
    setPets(list);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const openView = (pet: Pet) => {
    setSelected(pet);
    setEditing(pet);
    setMode("view");
  };

  const openEdit = () => {
    setMode("edit");
  };

  const startNew = () => {
    setSelected(null);
    setEditing(emptyPet(userId));
    setMode("edit");
    setStatus(null);
    setError(null);
    setIsFirstPet(pets.length === 0);
  };

  const cancel = () => {
    setSelected(null);
    setEditing(emptyPet(userId));
    setMode("view");
    setStatus(null);
    setError(null);
    setIsFirstPet(false);
  };

  const save = async () => {
    setError(null);
    setStatus(null);
    try {
      if (editing.id) {
        const { id, ...rest } = editing;
        await updatePet(id, rest);
      } else {
        await addPet(editing);
      }
      setStatus(t.saved);
      setMode("view");
      await load();

      // If this was the first pet, trigger onboarding callback
      if (isFirstPet && !editing.id && onFirstPetSaved) {
        setTimeout(() => {
          onFirstPetSaved();
        }, 500);
      }

      if (editing.id) {
        const updated = (await getUserPets(userId)).find((p) => p.id === editing.id);
        if (updated) {
          setSelected(updated);
          setEditing(updated);
        }
      } else {
        cancel();
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const remove = async (petId: string) => {
    if (!confirm("Delete pet?")) return;
    await deletePet(petId);
    await load();
    cancel();
  };

    return (
    <div className="pageContent">
      <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{t.myPets}</h3>
        <button className="btn btnPrimary" onClick={startNew}>
  + {t.addPet}
</button>
      </div>

      {pets.length === 0 && mode !== "edit" && (
        <div className="alert alertInfo" style={{ backgroundColor: "var(--bgAlt)", border: "1px solid var(--border)", padding: "16px", borderRadius: "8px" }}>
          <strong>Welcome to Pause First! 👋</strong>
          <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>
            Start by adding your pet's information. This helps you prepare better for vet visits.
          </p>
        </div>
      )}

      {(selected || mode === "edit") && (
        <div className="panel">
          <div className="panelHeader">
            <h4 style={{ margin: 0 }}>
              {isFirstPet && !selected ? "🐾 Add Your First Pet" : selected ? selected.name || "(Unnamed)" : "New Pet"}
            </h4>
          </div>

          {isFirstPet && !selected && mode === "edit" && (
            <p style={{ fontSize: "14px", color: "var(--textMuted)", marginBottom: "16px" }}>
              Tell us about your pet. You can always edit this later.
            </p>
          )}

          {mode === "view" && selected && <ViewOnlyPet pet={selected} />}

          {mode === "edit" && (
            <>
              <div className="grid2">
                <label className="label">
                  {t.petName}
                  <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g., Max" />
                </label>
                <label className="label">
                  {t.species}
                  <input className="input" value={editing.species} onChange={(e) => setEditing({ ...editing, species: e.target.value })} placeholder="e.g., Dog" />
                </label>

                <label className="label">
                  {t.age}
                  <input className="input" value={editing.age} onChange={(e) => setEditing({ ...editing, age: e.target.value })} placeholder="e.g., 3 years" />
                </label>
                <label className="label">
                  {t.sex}
                  <input className="input" value={editing.sex} onChange={(e) => setEditing({ ...editing, sex: e.target.value })} placeholder="e.g., Male" />
                </label>

                <label className="label">
                  {t.weight}
                  <input className="input" value={editing.weight} onChange={(e) => setEditing({ ...editing, weight: e.target.value })} placeholder="e.g., 25 kg" />
                </label>
                <label className="label">
                  {t.microchip}
                  <input className="input" value={editing.microchip} onChange={(e) => setEditing({ ...editing, microchip: e.target.value })} placeholder="Optional" />
                </label>

                <label className="label">
                  {t.allergies}
                  <textarea className="textarea" value={editing.allergies} onChange={(e) => setEditing({ ...editing, allergies: e.target.value })} placeholder="Any known allergies?" />
                </label>
                <label className="label">
                  {t.medications}
                  <textarea className="textarea" value={editing.medications} onChange={(e) => setEditing({ ...editing, medications: e.target.value })} placeholder="Current medications?" />
                </label>

                <label className="label">
                  {t.diet}
                  <textarea className="textarea" value={editing.diet} onChange={(e) => setEditing({ ...editing, diet: e.target.value })} placeholder="Diet or feeding notes?" />
                </label>
                <label className="label">
                  {t.clinic}
                  <input className="input" value={editing.clinic} onChange={(e) => setEditing({ ...editing, clinic: e.target.value })} placeholder="Your vet clinic name" />
                </label>

                <label className="label">
                  {t.emergencyContact}
                  <input className="input" value={editing.emergencyContact} onChange={(e) => setEditing({ ...editing, emergencyContact: e.target.value })} placeholder="Emergency contact" />
                </label>
                <label className="label">
                  {t.notes}
                  <textarea className="textarea" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Any other notes?" />
                </label>
              </div>

              {error && <div className="alert alertError">{t.error}: {error}</div>}
              {status && <div className="alert alertOk">{status}</div>}

              <div className="row">
                <button className="btn btnPrimary" onClick={save}>
                  {t.savePet}
                </button>
              </div>
            </>
          )}
          <div className="row rowWrap" style={{ marginTop: 12 }}>
            {selected && mode === "view" && (
              <button className="btn btnSecondary" onClick={openEdit}>
                {t.editPet}
              </button>
            )}

            <button className="btn btnSecondary" onClick={cancel}>
              Cancel
            </button>

            {selected?.id && (
              <button className="btn btnDanger" onClick={() => remove(selected.id!)}>
                {t.deletePet}
              </button>
            )}
          </div>
        </div>
      )}

      <hr className="hr" />

      <div className="stack">
        {pets.length === 0 && mode !== "edit" && <div className="muted">No pets yet. Click "+ Add Pet" to get started.</div>}

        {pets.map((p) => (
          <button
            key={p.id}
            className="itemCard"
            onClick={() => openView(p)}
            style={{ cursor: "pointer", textAlign: "left" }}
          >
            <div className="itemTitle">
              {p.name || "(Unnamed)"} <span className="muted">— {p.species}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
