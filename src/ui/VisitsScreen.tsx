import { ViewOnlyNotes } from "./ViewOnlyNotes";
import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
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
  const [prepViewId, setPrepViewId] = useState<string | null>(null);
const [prepMode, setPrepMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Visit>(emptyVisit(userId));

  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);
const [notesMode, setNotesMode] = useState<"view" | "edit">("view");
  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
  }, [userId]);

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
  };

  const loadNote = async (visitId: string) => {
    try {
      const note = await getVisitNote(userId, visitId);
      setSelectedVisitId(visitId);
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
      setEditingNote(null);
      setSelectedVisitId(null);
      await load();
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };
const selectedPrep = prepViewId ? visits.find((v) => v.id === prepViewId) ?? null : null;
const selectedPrepPet = selectedPrep ? pets.find((p) => p.id === selectedPrep.petId) ?? null : null;
  if (mode === "prepare") {
    return (
      <div className="stack">
        <h3>{t.prepareVisit}</h3>
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
            placeholder="Be specific..."
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
            onChange={(e) => setEditing({ ...editing, associatedSigns: e.target.value })}
          />
        </label>

        <label className="label">
          {t.previousTreatment}
          <textarea
            className="textarea"
            value={editing.previousTreatment}
            onChange={(e) => setEditing({ ...editing, previousTreatment: e.target.value })}
          />
        </label>

        <label className="label">
          {t.questionsVet}
          <textarea
            className="textarea"
            value={editing.questionsVet}
            onChange={(e) => setEditing({ ...editing, questionsVet: e.target.value })}
          />
        </label>

        <div className="row">
          <button className="btn btnPrimary" onClick={save}>
            {t.savePrep}
          </button>
          {editing.id && (
            <button className="btn btnSecondary" onClick={() => setEditing(emptyVisit(userId))}>
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

    {prepMode === "view" ? (
      <ViewOnlyPrepare visit={selectedPrep} />
    ) : (
      <div className="stack">
        <div className="alert alertInfo">Editing this saved preparation</div>
      </div>
    )}

    <div className="row rowWrap" style={{ marginTop: 12 }}>
      {prepMode === "view" ? (
        <button className="btn btnSecondary" onClick={() => { setPrepMode("edit"); setEditing(selectedPrep); }}>
          Edit
        </button>
      ) : (
        <button className="btn btnSecondary" onClick={() => setPrepMode("view")}>
          Cancel
        </button>
      )}

      <button className="btn btnSecondary" onClick={() => { setPrepViewId(null); setPrepMode("view"); }}>
        ← Back
      </button>
    </div>
  </div>
)}
        <h4>Your Visits</h4>
        {visits.length === 0 && <div className="muted">No visits yet.</div>}

        {visits.map((v) => {
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
    setPrepMode("view");
    setTimeout(() => {
      document.getElementById("prep-view-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }}
>
  View
</button>

<button className="btn btnSecondary" onClick={() => setEditing(v)}>
  Edit
</button>

{v.id && (
  <button className="btn btnDanger" onClick={() => remove(v.id!)}>
    Delete
  </button>
)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (mode === "notes") {
    const selectedVisit = selectedVisitId
      ? visits.find((v) => v.id === selectedVisitId) ?? null
      : null;

    return (
      <div className="stack">
        <h3>{t.visitNotes}</h3>

        {!selectedVisit && (
          <>
            <div className="muted">Select a visit to add notes:</div>

            {visits.length === 0 && (
              <div className="alert alertWarn">
                No visits yet. Create one in "Prepare Visit" first.
              </div>
            )}

            {visits.map((v) => {
              const pet = pets.find((p) => p.id === v.petId);
              return (
                <button
                  key={v.id}
                  className="itemCard"
                  onClick={() => {
                    setSelectedVisitId(v.id!);
                    setEditingNote(null);
                  }}
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

        {selectedVisit && !editingNote && (
          <div className="panel" id="notes-view-panel">
            <div className="row rowWrap" style={{ marginBottom: 12 }}>
              <button
                className="btn btnSecondary"
                onClick={() => {
                  setSelectedVisitId(null);
                  setEditingNote(null);
                }}
              >
                ← Back
              </button>

              <button
                className="btn btnSecondary"
                onClick={() => {
                  setEditingNote(emptyNote(userId, selectedVisit.id!));
                  setTimeout(() => {
                    document
                      .getElementById("notes-view-panel")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
              >
                Edit
              </button>
            </div>

            <div className="panelHeader">
              <h4 style={{ margin: 0 }}>
                {pets.find((p) => p.id === selectedVisit.petId)?.name || "(Unnamed)"} —{" "}
                {selectedVisit.visitDate || "No date"}
              </h4>
            </div>

            {editingNote ? (
              <ViewOnlyNotes note={editingNote} />
            ) : (
              <div className="muted">No notes yet. Click Edit to add them.</div>
            )}
          </div>
        )}
{selectedVisit && !editingNote && (
  <div className="panel" id="notes-view-panel">
    <div className="row rowWrap" style={{ marginBottom: 12 }}>
      <button
        className="btn btnSecondary"
        onClick={() => {
          setSelectedVisitId(null);
          setEditingNote(null);
        }}
      >
        ← Back
      </button>

      <button
        className="btn btnSecondary"
        onClick={() =>
  setEditingNote({
  userId: "",
  visitId: selectedVisit.id!,
  vetName: selectedVisit.vetName || "",
  diagnosis: selectedVisit.diagnosis || "",
  testsPerformed: selectedVisit.testsPerformed || "",
  treatmentMeds: selectedVisit.treatmentMeds || "",
  homeInstructions: selectedVisit.homeInstructions || "",
  followUp: selectedVisit.followUp || "",
})
}
      >
        Edit
      </button>
    </div>

    <div className="panelHeader">
      <h4 style={{ margin: 0 }}>
        {pets.find((p) => p.id === selectedVisit.petId)?.name || "(Unnamed)"} —{" "}
        {selectedVisit.visitDate || "No date"}
      </h4>
    </div>

    <ViewOnlyNotes
  note={{
    userId: "",
    visitId: selectedVisit.id!,
    vetName: selectedVisit.vetName || "",
    diagnosis: selectedVisit.diagnosis || "",
    testsPerformed: selectedVisit.testsPerformed || "",
    treatmentMeds: selectedVisit.treatmentMeds || "",
    homeInstructions: selectedVisit.homeInstructions || "",
    followUp: selectedVisit.followUp || "",
  }}
/>
  </div>
)}
                {selectedVisit && editingNote && (
          <>
            <button
              className="btn btnSecondary"
              onClick={() => {
                setEditingNote(null);
                setSelectedVisitId(null);
              }}
            >
              ← Back
            </button>

            <h4>
              {pets.find((p) => p.id === selectedVisit.petId)?.name || "(Unnamed)"} —{" "}
              {selectedVisit.visitDate || "No date"}
            </h4>

            <label className="label">
              {t.vetName}
              <input
                className="input"
                value={editingNote.vetName}
                onChange={(e) => setEditingNote({ ...editingNote, vetName: e.target.value })}
              />
            </label>

            <label className="label">
              {t.diagnosis}
              <textarea
                className="textarea"
                value={editingNote.diagnosis}
                onChange={(e) => setEditingNote({ ...editingNote, diagnosis: e.target.value })}
              />
            </label>

            <label className="label">
              {t.testsPerformed}
              <textarea
                className="textarea"
                value={editingNote.testsPerformed}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, testsPerformed: e.target.value })
                }
              />
            </label>

            <label className="label">
              {t.treatmentMeds}
              <textarea
                className="textarea"
                value={editingNote.treatmentMeds}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, treatmentMeds: e.target.value })
                }
              />
            </label>

            <label className="label">
              {t.homeInstructions}
              <textarea
                className="textarea"
                value={editingNote.homeInstructions}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, homeInstructions: e.target.value })
                }
              />
            </label>

            <label className="label">
              {t.followUp}
              <textarea
                className="textarea"
                value={editingNote.followUp}
                onChange={(e) => setEditingNote({ ...editingNote, followUp: e.target.value })}
              />
            </label>

            <div className="row">
              <button className="btn btnPrimary" onClick={saveNote}>
                {t.saveNotes}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  // mode === "document"
  return (
    <div className="stack">
      <h3>{t.viewDocument}</h3>

      <div className="alert alertInfo">
        You can print this page (Ctrl+P or Cmd+P) to take with you to your vet visit.
      </div>

      {!selectedVisitId && (
        <>
          <div className="muted">Select a visit to view:</div>
          {visits.length === 0 && <div className="alert alertWarn">No visits yet.</div>}

          {visits.map((v) => {
            const pet = pets.find((p) => p.id === v.petId);
            return (
              <button
                key={v.id}
                className="itemCard"
                onClick={() => {
  setSelectedVisitId(v.id!);
  setEditingNote(null);
}}
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

      {selectedVisitId && (
        <>
          <button className="btn btnSecondary" onClick={() => setSelectedVisitId(null)}>
            ← Back
          </button>

          <div className="printDocument">
            {visits
              .filter((v) => v.id === selectedVisitId)
              .map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                return (
                  <div key={v.id}>
                    <h2>{pet?.name || "(Unnamed)"}</h2>
                    <p>
                      <strong>Visit Date:</strong> {v.visitDate}
                    </p>

                    <h3>Preparation</h3>
                    <p>
                      <strong>Main Concern:</strong> {v.mainConcern}
                    </p>
                    <p>
                      <strong>When Started:</strong> {v.whenStart}
                    </p>
                    <p>
                      <strong>Progression:</strong> {v.howProgressing}
                    </p>
                    <p>
                      <strong>Patterns:</strong> {v.patterns}
                    </p>
                    <p>
                      <strong>Associated Signs:</strong> {v.associatedSigns}
                    </p>
                    <p>
                      <strong>Previous Treatment:</strong> {v.previousTreatment}
                    </p>
                    <p>
                      <strong>Questions for Vet:</strong> {v.questionsVet}
                    </p>
                  </div>
                );
              })}
          </div>

          <button className="btn btnPrimary" onClick={() => window.print()} style={{ marginTop: 16 }}>
            Print / Save as PDF
          </button>
        </>
      )}
    </div>
  );
}
