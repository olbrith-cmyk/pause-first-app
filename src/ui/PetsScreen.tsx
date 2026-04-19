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

export default function PetsScreen({ lang, userId }: { lang: Lang; userId: string }) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Pet>(emptyPet(userId));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  };

  const cancel = () => {
    setSelected(null);
    setEditing(emptyPet(userId));
    setMode("view");
    setStatus(null);
    setError(null);
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
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{t.myPets}</h3>
        <button className="btn btnPrimary" onClick={startNew}>
          + {t.savePet}
        </button>
      </div>

      {(selected || mode === "edit") && (
        <div className="panel">
          <div className="panelHeader">
  <h4 style={{ margin: 0 }}>
    {selected ? selected.name || "(Unnamed)" : "New Pet"}
  </h4>
</div>

          {mode === "view" && selected && <ViewOnlyPet pet={selected} />}

          {mode === "edit" && (
            <>
              <div className="grid2">
                <label className="label">
                  {t.petName}
                  <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </label>
                <label className="label">
                  {t.species}
                  <input className="input" value={editing.species} onChange={(e) => setEditing({ ...editing, species: e.target.value })} />
                </label>

                <label className="label">
                  {t.age}
                  <input className="input" value={editing.age} onChange={(e) => setEditing({ ...editing, age: e.target.value })} />
                </label>
                <label className="label">
                  {t.sex}
                  <input className="input" value={editing.sex} onChange={(e) => setEditing({ ...editing, sex: e.target.value })} />
                </label>

                <label className="label">
                  {t.weight}
                  <input className="input" value={editing.weight} onChange={(e) => setEditing({ ...editing, weight: e.target.value })} />
                </label>
                <label className="label">
                  {t.microchip}
                  <input className="input" value={editing.microchip} onChange={(e) => setEditing({ ...editing, microchip: e.target.value })} />
                </label>

                <label className="label">
                  {t.allergies}
                  <textarea className="textarea" value={editing.allergies} onChange={(e) => setEditing({ ...editing, allergies: e.target.value })} />
                </label>
                <label className="label">
                  {t.medications}
                  <textarea className="textarea" value={editing.medications} onChange={(e) => setEditing({ ...editing, medications: e.target.value })} />
                </label>

                <label className="label">
                  {t.diet}
                  <textarea className="textarea" value={editing.diet} onChange={(e) => setEditing({ ...editing, diet: e.target.value })} />
                </label>
                <label className="label">
                  {t.clinic}
                  <input className="input" value={editing.clinic} onChange={(e) => setEditing({ ...editing, clinic: e.target.value })} />
                </label>

                <label className="label">
                  {t.emergencyContact}
                  <input className="input" value={editing.emergencyContact} onChange={(e) => setEditing({ ...editing, emergencyContact: e.target.value })} />
                </label>
                <label className="label">
                  {t.notes}
                  <textarea className="textarea" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
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
        {pets.length === 0 && <div className="muted">No pets yet.</div>}

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
    <div className="muted">Tap to open</div>
  </button>
))}
      </div>
    </div>
  );
}
