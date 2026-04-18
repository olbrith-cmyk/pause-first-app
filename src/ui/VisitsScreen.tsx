import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit } from "../firestore";
import { addVisit, deleteVisit, getUserPets, getUserVisits, updateVisit } from "../firestore";

type Mode = "prepare" | "notes" | "document";

const emptyVisit = (userId: string): Visit => ({
  userId,
  petId: "",
  visitDate: "",
  mainConcern: "",
  whenStart: "",
  howProgressing: "",
  patterns: "",
  associatedSigns: "",
  previousTreatment: "",
  questionsVet: ""
});

export default function VisitsScreen({
  lang,
  userId,
  mode
}: {
  lang: Lang;
  userId: string;
  mode: Mode;
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [editing, setEditing] = useState<Visit>(emptyVisit(userId));

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const petName = useMemo(() => {
    const p = pets.find(x => x.id === editing.petId);
    return p?.name ?? "";
  }, [editing.petId, pets]);

  const save = async () => {
    if (!editing.petId) return alert("Pick a pet first");
    if (editing.id) {
      const { id, ...rest } = editing;
      await updateVisit(id, rest);
    } else {
      await addVisit(editing);
    }
    setEditing(emptyVisit(userId));
    await load();
    alert(t.saved);
  };

  const remove = async (visitId: string) => {
    if (!confirm("Delete visit?")) return;
    await deleteVisit(visitId);
    await load();
  };

  if (mode === "document") {
    return (
      <div className="stack">
        <div className="alert alertInfo">
          You can print this page (Ctrl+P or Cmd+P) to take with you to your vet visit.
        </div>
        <div className="alert alertWarn">
          Document view will be added in Pack 2C (print layout + PDF).
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <h3>{mode === "prepare" ? t.prepareVisit : t.visitNotes}</h3>

      <div className="alert alertWarn">
        {mode === "notes"
          ? "Visit Notes form will be added in Pack 2C."
          : "Prepare Visit form is starting now; we’ll expand fields in Pack 2C."}
      </div>

      <label className="label">
        {t.petName}
        <select
          className="input"
          value={editing.petId}
          onChange={(e) => setEditing({ ...editing, petId: e.target.value })}
        >
          <option value="">--</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || "(Unnamed)"} — {p.species}
            </option>
          ))}
        </select>
      </label>

      <label className="label">
        {t.visitDate}
        <input
          className="input"
          type="date"
          value={editing.visitDate}
          onChange={(e) => setEditing({ ...editing, visitDate: e.target.value })}
        />
      </label>

      <label className="label">
        {t.mainConcern}
        <textarea
          className="textarea"
          value={editing.mainConcern}
          onChange={(e) => setEditing({ ...editing, mainConcern: e.target.value })}
        />
      </label>

      <div className="row">
        <button className="
