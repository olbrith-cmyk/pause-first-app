import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit, VisitNote } from "../firestore";
import {
  addVisit,
  addVisitNote,
  deleteVisit,
  getUserPets,
  getUserVisits,
  getVisitNote,
  updateVisit,
  updateVisitNote
} from "../firestore";
import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
import { ViewOnlyNotes } from "./ViewOnlyNotes";

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

const emptyNote = (userId: string, visitId: string): VisitNote => ({
  userId,
  visitId,
  vetName: "",
  diagnosis: "",
  testsPerformed: "",
  treatmentMeds: "",
  homeInstructions: "",
  followUp: ""
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

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);
  const [loadedNote, setLoadedNote] = useState<VisitNote | null>(null);

  const [prepMode, setPrepMode] = useState<"view" | "edit">("view");
  const [notesMode, setNotesMode] = useState<"view" | "edit">("view");

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const selectedVisit = useMemo(() => {
    return selectedVisitId ? visits.find((v) => v.id === selectedVisitId) ?? null : null;
  }, [selectedVisitId, visits]);

  const selectedPet = useMemo(() => {
    return selectedVisit ? pets.find((p) => p.id === selectedVisit.petId) ?? null : null;
  }, [selectedVisit, pets]);

  const save = async () => {
    if (!editing.petId) return alert("Pick a pet first");
    try {
      if (editing.id) {
        const { id, ...rest } = editing;
        await updateVisit(id, rest);
      } else {
        await addVisit(editing);
      }
      setEditing(emptyVisit(userId));
      await load();
      alert(t.saved);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  const remove = async (visitId: string) => {
    if (!confirm("Delete visit?")) return;
    await deleteVisit(visitId);
    await load();
    if (selectedVisitId === visitId) setSelectedVisitId(null);
  };

  const openVisitView = (visit: Visit) => {
    setSelectedVisitId(visit.id!);
    setEditing(visit);
    setPrepMode("view");
    setNotesMode("view");
    setLoadedNote(null);
    setEditingNote(null);
  };

  const openVisitEdit = (visit: Visit) => {
    setSelectedVisitId(visit.id!);
    setEditing(visit);
    setPrepMode("edit");
    setNotesMode("view");
    setLoadedNote(null);
    setEditingNote(null);
  };

  const loadNoteForVisit = async (visitId: string) => {
    try {
      const note = await getVisitNote(userId, visitId);
      setLoadedNote(note ? note : null);
      setEditingNote(note ? note : emptyNote(userId, visitId));
    } catch (e: any) {
      alert("Error loading note: " + (e?.message ?? String(e)));
    }
  };

  const saveNote = async () => {
    if (!editingNote) return;
    try {
      if (editingNote.id) {
        const { id, ...rest } = editingNote;
        await updateVisitNote(id, rest);
      } else {
        await addVisitNote(editingNote);
      }
      alert(t.saved);
      setNotesMode("view");
      await load();
      await loadNoteForVisit(editingNote.visitId);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  // ---------------- PREPARE MODE ----------------
  if (mode === "prepare") {
    return (
      <div className="stack">
        <h3>{t.prepareVisit}</h3>

        {/* If a visit is selected, show view/edit panel */}
        {selectedVisit && (
          <div className="panel">
            <div className="panelHeader">
              <h4 style={{ margin: 0 }}>
                {selectedPet?.name || "(Unnamed)"} — {selectedVisit.visitDate || "No date"}
              </h4>
              <div className="row">
                {prepMode === "view" ? (
                  <button className="btn btnSecondary" onClick={() => setPrepMode("edit")}>
                    Edit
                  </button>
                ) : (
                  <button className="btn btnSecondary" onClick={() => setPrepMode("view")}>
                    Cancel
                  </button>
                )}
                <button className="btn btnSecondary" onClick={() => setSelectedVisitId(null)}>
                  ← Back
                </button>
              </div>
            </div>

            {prepMode === "view" ? (
              <ViewOnlyPrepare visit={selectedVisit} />
            ) : (
              <>
                {/* Edit form (same as your old form, but bound to editing) */}
                <label className="label">
                  {t.petName}
                  <select
                    className="input"
                    value={editing.petId}
                    onChange={(e) => setEditing({ ...editing, petId: e.target.value })}
                  >
                    <option value="">-- {t.petName} --</option>
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

                <label className="label">
                  {t.whenStart}
                  <textarea
                    className="textarea"
                    value={editing.whenStart}
                    onChange={(e) => setEditing({ ...editing, whenStart: e.target.value })}
                  />
                </label>

                <label className="label">
                  {t.howProgressing}
                  <textarea
                    className="textarea"
                    value={editing.howProgressing}
                    onChange={(e) => setEditing({ ...editing, howProgressing: e.target.value })}
                  />
                </label>

                <label className="label">
                  {t.patterns}
                  <textarea
                    className="textarea"
                    value={editing.patterns}
                    onChange={(e) => setEditing({ ...editing, patterns: e.target.value })}
                  />
                </label>

                <label className="label">
                  {t.associatedSigns}
                  <textarea
                    className="textarea"
                    value={editing.associatedSigns}
                    onChange={(e) =>
