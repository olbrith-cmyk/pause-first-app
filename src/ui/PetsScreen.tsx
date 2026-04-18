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
  const [editing, setEditing] = useState<Pet>(emptyPet(userId));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [petMode, setPetMode] = useState<"view" | "edit">("view");

  const load = async () => {
    const list = await getUserPets(userId);
    setPets(list);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
      setEditing(emptyPet(userId));
      setStatus(t.saved);
      setPetMode("view");
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const remove = async (petId: string) => {
    if (!confirm("Delete pet?")) return;
    await deletePet(petId);
    await load();
  };

  const openPetView = (pet: Pet) => {
    setEditing(pet);
    setPetMode("view");
  };

  const openPetEdit = () => {
    setPetMode("edit");
  };

  const cancelEdit = () => {
    setEditing(emptyPet(userId));
    setPetMode("view");
  };

  return (
    <div className="stack">
      <h3>{t.myPets}</h3>

      {/* New Pet Form */}
      {editing.id === undefined && petMode === "edit" && (
        <div className="panel">
          <h4>Add New Pet</h4>

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
            <button className="btn btnPrimary" onClick={save}>{t.savePet}</button>
            <button className="btn btnSecondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {/* View/Edit Existing Pet */}
      {editing.id && (
        <div className="panel">
          <div className="panelHeader">
            <h4>{editing.name || "(Unnamed)"}</h4>
            <div className="row">
              {petMode === "view" ? (
                <button className="btn btnSecondary" onClick={openPetEdit}>Edit</button>
              ) : (
                <button className="btn btnSecondary" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </div>

          {petMode === "view" ? (
            <ViewOnlyPet pet={editing} />
          ) : (
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
                <button className="btn btnPrimary" onClick={save}>{t.savePet}</button>
              </div>
            </>
          )}
        </div>
      )}

      <hr className="hr" />

      {/* Pet List */}
      <div className="stack">
        {pets.length === 0 && <div className="muted">No pets yet.</div>}

        {pets.map((p) => (
          <div key={p.id} className="itemCard">
            <div className="itemTitle">{p.name || "(Unnamed)"} <span className="muted">— {p.species}</span></div>
            <div className="row rowWrap">
              <button className="btn btnSecondary" onClick={() => openPetView(p)}>View</button>
              {p.id && <button className="btn btnDanger" onClick={()
