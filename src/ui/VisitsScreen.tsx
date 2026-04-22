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
import ViewDocument from "./ViewDocument";

export type Mode = "myVisits" | "prepare";
type PrepareSubTab = "prep" | "notes" | "summary";

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
  goToTab?: (next: Mode) => void; // optional for backward compatibility
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  // PREPARE
  const [subTab, setSubTab] = useState<PrepareSubTab>("prep");
  const [editingVisit, setEditingVisit] = useState<Visit>(emptyVisit(userId));
  const [prepViewId, setPrepViewId] = useState<string | null>(null);

  // NOTES (selected visit)
  const [noteVisitId, setNoteVisitId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);

  // SUMMARY (selected visit)
  const [docVisitId, setDocVisitId] = useState<string | null>(null);
  const [docNote, setDocNote] = useState<VisitNote | null>(null);

  // MY VISITS
  const [openVisitId, setOpenVisitId] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<VisitNote | null>(null);

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const visitsSorted = useMemo(() => {
    return [...visits].sort((a, b) => {
      const ad = a.visitDate || "";
      const bd = b.visitDate || "";
      return bd.localeCompare(ad);
    });
  }, [visits]);

  const selectedPrep = prepViewId ? visits.find((v) => v.id === prepViewId) ?? null : null;
  const selectedPrepPet = selectedPrep ? pets.find((p) => p.id === selectedPrep.petId) ?? null : null;

  const saveVisit = async () => {
    if (!editingVisit.petId) return alert("Pick a pet first");
    try {
      if (editingVisit.id) {
        const { id, ...rest } = editingVisit;
        await updateVisit(id, rest);
      } else {
        await addVisit(editingVisit);
      }
      alert(t.saved);
      setEditingVisit(emptyVisit(userId));
      await load();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  const removeVisit = async (visitId: string) => {
    if (!confirm("Delete visit?")) return;
    await deleteVisit(visitId);
    await load();
  };

  const loadNoteForVisit = async (visitId: string) => {
    setNoteVisitId(visitId);
    try {
      const note = await getVisitNote(userId, visitId);
      setEditingNote(note ?? emptyNote(userId, visitId));
    } catch (e) {
      console.error("Error loading note:", e);
      setEditingNote(emptyNote(userId, visitId));
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
      await load();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  const loadDocForVisit = async (visitId: string) => {
    setDocVisitId(visitId);
    try {
      const note = await getVisitNote(userId, visitId);
      setDocNote(note ?? null);
    } catch (e) {
      console.error("Error loading note:", e);
      setDocNote(null);
    }
  };

  // =========================
  // MY VISITS (archive)
  // =========================
  if (mode === "myVisits") {
    const openVisit = openVisitId ? visits.find((v) => v.id === openVisitId) ?? null : null;
    const openPet = openVisit ? pets.find((p) => p.id === openVisit.petId) ?? null : null;

    const openVisitCard = async (visitId: string) => {
      setOpenVisitId(visitId);
      try {
        const note = await getVisitNote(userId, visitId);
        setOpenNote(note ?? null);
      } catch (e) {
        console.error("Error loading note:", e);
        setOpenNote(null);
      }
    };

    return (
      <div className="stack">
        <h3>{(t as any).myVisits ?? "My Visits"}</h3>

        {visitsSorted.length === 0 && <div className="muted">No visits yet.</div>}

        {!openVisit && (
          <>
            {visitsSorted.map((v) => {
              const pet = pets.find((p) => p.id === v.petId);
              return (
                <button
                  key={v.id}
                  className="itemCard"
                  onClick={() => openVisitCard(v.id!)}
                  style={{ cursor: "pointer", textAlign: "left" }}
                >
                  <div className="itemTitle">
                    {pet?.name || "(Unnamed)"} — {v.visitDate || "No date"}
                  </div>
                  <div className="muted">{v.mainConcern || "No main concern yet."}</div>
                </button>
              );
            })}
          </>
        )}

        {openVisit && (
          <div className="panel">
            <div className="row rowWrap" style={{ marginBottom: 12 }}>
              <button
                className="btn btnSecondary"
                onClick={() => {
                  setOpenVisitId(null);
                  setOpenNote(null);
                }}
              >
                ← Back
              </button>

              <button
                className="btn btnSecondary"
                onClick={() => {
                  setEditingVisit(openVisit);
                  setPrepViewId(openVisit.id!);
                  setSubTab("prep");
                }}
              >
                Edit Preparation
              </button>

              <button
                className="btn btnSecondary"
                onClick={async () => {
                  await loadNoteForVisit(openVisit.id!);
                  setSubTab("notes");
                }}
              >
                Edit Visit Notes
              </button>

              <button
                className="btn btnSecondary"
                onClick={async () => {
                  await loadDocForVisit(openVisit.id!);
                  setSubTab("summary");
                }}
              >
                Summary
              </button>
            </div>

            <div className="panelHeader">
              <h4 style={{ margin: 0 }}>
                {openPet?.name || "(Unnamed)"} — {openVisit.visitDate || "No date"}
              </h4>
            </div>

            <h4 style={{ marginTop: 12 }}>Preparation</h4>
            <ViewOnlyPrepare visit={openVisit} />

            <h4 style={{ marginTop: 16 }}>Visit Notes</h4>
            {openNote ? <ViewOnlyNotes note={openNote} /> : <div className="muted">No visit notes yet.</div>}
          </div>
        )}
      </div>
    );
  }

  // =========================
  // PREPARE (primary workflow)
  // =========================
  const selectedNoteVisit = noteVisitId ? visits.find((v) => v.id === noteVisitId) ?? null : null;

  const docVisit = docVisitId ? visits.find((v) => v.id === docVisitId) ?? null : null;
  const docPet = docVisit ? pets.find((p) => p.id === docVisit.petId) ?? null : null;

  return (
    <div className="stack">
      <h3>{t.prepareVisit}</h3>

      {/* Sub-tabs inside Prepare */}
      <div className="tabs" style={{ marginTop: 4 }}>
        <button
          className={`tab ${subTab === "prep" ? "tabActive" : ""}`}
          onClick={() => setSubTab("prep")}
        >
          Preparation
        </button>
        <button
          className={`tab ${subTab === "notes" ? "tabActive" : ""}`}
          onClick={() => setSubTab("notes")}
        >
          {t.visitNotes}
        </button>
        <button
          className={`tab ${subTab === "summary" ? "tabActive" : ""}`}
          onClick={() => setSubTab("summary")}
        >
          Summary
        </button>
      </div>

      {/* PREP */}
      {subTab === "prep" && (
        <>
          <label className="label">
            {t.petName}
            <select
              className="input"
              value={editingVisit.petId}
              onChange={(e) => setEditingVisit({ ...editingVisit, petId: e.target.value })}
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
              value={editingVisit.visitDate}
              onChange={(e) => setEditingVisit({ ...editingVisit, visitDate: e.target.value })}
            />
          </label>

          <label className="label">
            {t.mainConcern}
            <textarea
              className="textarea"
              value={editingVisit.mainConcern}
              onChange={(e) => setEditingVisit({ ...editingVisit, mainConcern: e.target.value })}
              placeholder="What is the main concern? What changed?"
            />
          </label>

          <label className="label">
            {t.whenStart}
            <textarea
              className="textarea"
              value={editingVisit.whenStart}
              onChange={(e) => setEditingVisit({ ...editingVisit, whenStart: e.target.value })}
              placeholder="e.g., Started 3 days ago, noticed after the hike on Saturday, gradually over 2 weeks..."
            />
          </label>

          <label className="label">
            {t.howProgressing}
            <textarea
              className="textarea"
              value={editingVisit.howProgressing}
              onChange={(e) => setEditingVisit({ ...editingVisit, howProgressing: e.target.value })}
              placeholder="Getting worse each day, seems to improve after rest, worst in the morning..."
            />
          </label>

          <label className="label">
            {t.patterns}
            <textarea
              className="textarea"
              value={editingVisit.patterns}
              onChange={(e) => setEditingVisit({ ...editingVisit, patterns: e.target.value })}
              placeholder="Only after running, happens at night, happens after eating certain foods..."
            />
          </label>

          <label className="label">
            {t.associatedSigns}
            <textarea
              className="textarea"
              value={editingVisit.associatedSigns}
              onChange={(e) =>
                setEditingVisit({ ...editingVisit, associatedSigns: e.target.value })
              }
              placeholder="Not eating as much, vomiting once, drinking more water, licking paws..."
            />
          </label>

          <label className="label">
            {t.previousTreatment}
            <textarea
              className="textarea"
              value={editingVisit.previousTreatment}
              onChange={(e) =>
                setEditingVisit({ ...editingVisit, previousTreatment: e.target.value })
              }
              placeholder="Had this 6 months ago, tried antibiotics, didn't help much..."
            />
          </label>

          <label className="label">
            {t.questionsVet}
            <textarea
              className="textarea"
              value={editingVisit.questionsVet}
              onChange={(e) =>
                setEditingVisit({ ...editingVisit, questionsVet: e.target.value })
              }
              placeholder="Is this serious? Will it get better? What can I do at home?"
            />
          </label>

          <div className="row rowWrap">
            <button className="btn btnPrimary" onClick={saveVisit}>
              {t.savePrep}
            </button>

            {editingVisit.id && (
              <button className="btn btnSecondary" onClick={() => setEditingVisit(emptyVisit(userId))}>
                {t.clearForm}
              </button>
            )}
          </div>

          <hr className="hr" />

          {selectedPrep && (
            <div className="panel" id="prep-view-panel">
              <div className="panelHeader">
                <h4 style={{ margin: 0 }}>
                  {selectedPrepPet?.name || "(Unnamed)"} — {selectedPrep.visitDate || "No date"}
                </h4>
              </div>

              <ViewOnlyPrepare visit={selectedPrep} />

              <div className="row rowWrap" style={{ marginTop: 12 }}>
                <button className="btn btnSecondary" onClick={() => setEditingVisit(selectedPrep)}>
                  Edit
                </button>
                <button className="btn btnSecondary" onClick={() => setPrepViewId(null)}>
                  ← Back
                </button>
              </div>
            </div>
          )}

          <h4>Your Visits</h4>
          {visitsSorted.length === 0 && <div className="muted">No visits yet.</div>}

          {visitsSorted.map((v) => {
            const pet = pets.find((p) => p.id === v.petId);
            return (
              <div key={v.id} className="itemCard">
                <div className="itemTitle">
                  {pet?.name || "(Unnamed)"} — {v.visitDate || "No date"}
                </div>
                <div className="muted">{v.mainConcern}</div>

                <div className="row rowWrap">
                  <button
                    className="btn btnSecondary"
                    onClick={() => {
                      setPrepViewId(v.id!);
                      setTimeout(() => {
                        document
                          .getElementById("prep-view-panel")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 0);
                    }}
                  >
                    View
                  </button>

                  <button className="btn btnSecondary" onClick={() => setEditingVisit(v)}>
                    Edit
                  </button>

                  <button
                    className="btn btnSecondary"
                    onClick={async () => {
                      await loadNoteForVisit(v.id!);
                      setSubTab("notes");
                    }}
                  >
                    {t.visitNotes}
                  </button>

                  <button
                    className="btn btnSecondary"
                    onClick={async () => {
                      await loadDocForVisit(v.id!);
                      setSubTab("summary");
                    }}
                  >
                    Summary
                  </button>

                  {v.id && (
                    <button className="btn btnDanger" onClick={() => removeVisit(v.id!)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* NOTES */}
      {subTab === "notes" && (
        <>
          {!noteVisitId && (
            <>
              <div className="muted">Select a visit to add notes:</div>

              {visitsSorted.length === 0 && (
                <div className="alert alertWarn">
                  No visits yet. Create one in "Prepare Visit" first.
                </div>
              )}

              {visitsSorted.map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                return (
                  <button
                    key={v.id}
                    className="itemCard"
                    onClick={() => loadNoteForVisit(v.id!)}
                    style={{ cursor: "pointer", textAlign: "left" }}
                  >
                    <div className="itemTitle">
                      {pet?.name || "(Unnamed)"} — {v.visitDate || "No date"}
                    </div>
                    <div className="muted">{v.mainConcern}</div>
                  </button>
                );
              })}
            </>
          )}

          {noteVisitId && selectedNoteVisit && editingNote && (
            <>
              <div className="row rowWrap" style={{ marginBottom: 12 }}>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setNoteVisitId(null);
                    setEditingNote(null);
                  }}
                >
                  ← Back
                </button>

                <button
                  className="btn btnSecondary"
                  onClick={async () => {
                    await loadDocForVisit(noteVisitId);
                    setSubTab("summary");
                  }}
                >
                  Summary
                </button>
              </div>

              <h4>
