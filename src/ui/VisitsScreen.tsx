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
import PrepareWizard from "./PrepareWizard";

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

const AI_ASSISTANT_URL =
  "https://chatgpt.com/g/g-695a7a9e17d08191bd88b76d39f9e54f-pause-firsttm";
function AskAiLink({ label }: { label: string }) {
  return (
    <a
      href={AI_ASSISTANT_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: 12,
        marginLeft: 10,
        color: "#0066cc",
        textDecoration: "underline",
        whiteSpace: "nowrap"
      }}
      aria-label={label}
      title={label}
    >
      {label}
    </a>
  );
}

export default function VisitsScreen({
  lang,
  userId,
  mode
}: {
  lang: Lang;
  userId: string;
  mode: Mode;
  goToTab?: (next: Mode) => void; // optional (Dashboard may still pass it)
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  // PREPARE
  const [subTab, setSubTab] = useState<PrepareSubTab>("prep");
  const [showWizard, setShowWizard] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit>(emptyVisit(userId));
  const [prepViewId, setPrepViewId] = useState<string | null>(null);

  // NOTES
  const [noteVisitId, setNoteVisitId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);

  // SUMMARY
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

      {/* Section 2 starts right after this line */}
      {subTab === "prep" && (
        <>
          {prepViewId && selectedPrep && selectedPrepPet && (
            <div className="panel" style={{ marginBottom: 16, backgroundColor: "#f9f9f9" }}>
              <div className="row rowWrap" style={{ marginBottom: 12 }}>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setPrepViewId(null);
                    setEditingVisit(emptyVisit(userId));
                  }}
                >
                  ← Back to Form
                </button>
                <button
                  className="btn btnPrimary"
                  onClick={() => {
                    setEditingVisit(selectedPrep);
                    setPrepViewId(null);
                  }}
                >
                  Edit
                </button>
              </div>
              <ViewOnlyPrepare visit={selectedPrep} />
            </div>
          )}

          {!prepViewId && (
  <div className="panel">
    <div className="panelHeader">
      <h4 style={{ margin: 0 }}>{t.prepareVisit}</h4>
    </div>

    <p className="muted" style={{ marginTop: 8 }}>
      Use the guided wizard to prepare your visit step-by-step.
    </p>

    <button
      className="btn btnPrimary"
      onClick={() => setShowWizard(true)}
      type="button"
      style={{ width: "100%", marginTop: 12 }}
    >
      Start
    </button>
  </div>
)}

          {!prepViewId && visits.length > 0 && (
            <>
              <hr style={{ margin: "20px 0" }} />
              <h4>{t.yourVisits}</h4>
              {visitsSorted.map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                return (
                  <button
                    key={v.id}
                    className="itemCard"
                    onClick={() => setPrepViewId(v.id!)}
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
        </>
      )}

      {subTab === "notes" && (
        <>
          {noteVisitId && editingNote && selectedNoteVisit && (
            <>
              {!editingNote.id && (
                <div className="panel" style={{ marginBottom: 16, backgroundColor: "#f9f9f9" }}>
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
                  </div>
                  <p className="muted">No visit notes saved yet for this visit.</p>
                </div>
              )}

              {editingNote.id && (
                <div className="panel" style={{ marginBottom: 16, backgroundColor: "#f9f9f9" }}>
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
                  </div>
                  <ViewOnlyNotes note={editingNote} />
                </div>
              )}

              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveNote();
                }}
              >
                <h4>Edit Visit Notes</h4>

                <label>
                  <span className="label">{t.vetName}</span>
                  <input
                    type="text"
                    value={editingNote.vetName}
                    onChange={(e) => setEditingNote({ ...editingNote, vetName: e.target.value })}
                    placeholder="Veterinarian's name"
                  />
                </label>

                <label>
                  <span className="label">{t.diagnosis}</span>
                  <textarea
                    value={editingNote.diagnosis}
                    onChange={(e) => setEditingNote({ ...editingNote, diagnosis: e.target.value })}
                    placeholder="What did the vet find?"
                    rows={3}
                  />
                </label>

                <label>
                  <span className="label">{t.testsPerformed}</span>
                  <textarea
                    value={editingNote.testsPerformed}
                    onChange={(e) => setEditingNote({ ...editingNote, testsPerformed: e.target.value })}
                    placeholder="Blood tests, X-rays, ultrasound, etc."
                    rows={3}
                  />
                </label>

                <label>
                  <span className="label">{t.treatmentMeds}</span>
                  <textarea
                    value={editingNote.treatmentMeds}
                    onChange={(e) => setEditingNote({ ...editingNote, treatmentMeds: e.target.value })}
                    placeholder="Medications, dosage, frequency"
                    rows={3}
                  />
                </label>

                <label>
                  <span className="label">{t.homeInstructions}</span>
                  <textarea
                    value={editingNote.homeInstructions}
                    onChange={(e) => setEditingNote({ ...editingNote, homeInstructions: e.target.value })}
                    placeholder="Rest, diet changes, activity restrictions?"
                    rows={3}
                  />
                </label>

                <label>
                  <span className="label">{t.followUp}</span>
                  <input
                    type="text"
                    value={editingNote.followUp}
                    onChange={(e) => setEditingNote({ ...editingNote, followUp: e.target.value })}
                    placeholder="E.g., recheck in 2 weeks, call if symptoms worsen"
                  />
                </label>

                <div className="row rowWrap" style={{ marginTop: 16 }}>
                  <button type="submit" className="btn btnPrimary">
                    {editingNote.id ? t.update : t.save}
                  </button>
                  <button
                    type="button"
                    className="btn btnSecondary"
                    onClick={() => {
                      setNoteVisitId(null);
                      setEditingNote(null);
                    }}
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            </>
          )}

          {!noteVisitId && (
            <>
              <p className="muted">Select a visit to add or edit notes.</p>
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
                    <div className="muted">{v.mainConcern || "No main concern yet."}</div>
                  </button>
                );
              })}
            </>
          )}
        </>
      )}

      {subTab === "summary" && (
        <>
          {!docVisitId && (
            <>
              <p className="muted">Select a visit to view the summary.</p>
              {visitsSorted.map((v) => {
                const pet = pets.find((p) => p.id === v.petId);
                return (
                  <button
                    key={v.id}
                    className="itemCard"
                    onClick={() => loadDocForVisit(v.id!)}
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

          {docVisitId && docVisit && docPet && (
            <>
              <button
                className="btn btnSecondary"
                onClick={() => {
                  setDocVisitId(null);
                  setDocNote(null);
                }}
                style={{ marginBottom: 16 }}
              >
                ← Back
              </button>
              <ViewDocument
                lang={lang}
                pet={docPet}
                visit={docVisit}
                note={docNote}
              />
            </>
          )}
        </>
      )}
    </div>
  );
                }
