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
  updateVisitNote,
  addPet
} from "../firestore";

import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
import { ViewOnlyNotes } from "./ViewOnlyNotes";
import PrepareWizard from "./PrepareWizard";

export type Mode = "myVisits" | "prepare";

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
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [openVisitId, setOpenVisitId] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<VisitNote | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);
  const [noteVisitId, setNoteVisitId] = useState<string | null>(null);

  // For PREPARE mode: choose pet or add new
  const [showChoosePetModal, setShowChoosePetModal] = useState(false);
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [editingNewPet, setEditingNewPet] = useState<Pet>(emptyPet(userId));
  const [petFormError, setPetFormError] = useState<string | null>(null);
  const [selectedPetForWizard, setSelectedPetForWizard] = useState<Pet | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
  }, [userId]);

  // Show "Choose Pet" modal when in PREPARE mode
  useEffect(() => {
    if (mode === "prepare") {
      setShowChoosePetModal(true);
    }
  }, [mode]);

  const visitsSorted = useMemo(() => {
    return [...visits].sort((a, b) => {
      const ad = a.visitDate || "";
      const bd = b.visitDate || "";
      return bd.localeCompare(ad);
    });
  }, [visits]);

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
      setEditingNote(null);
      setNoteVisitId(null);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

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

  // PREPARE MODE: Handle pet selection
  const handleSelectPetForWizard = (pet: Pet) => {
    setSelectedPetForWizard(pet);
    setShowChoosePetModal(false);
    setShowWizard(true);
  };

  const handleContinueWithoutProfile = () => {
    // Create a temporary unnamed pet object
    const unnamedPet: Pet = {
      userId,
      name: "(Unnamed pet)",
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
    };
    setSelectedPetForWizard(unnamedPet);
    setShowChoosePetModal(false);
    setShowWizard(true);
  };

  const handleSaveNewPet = async () => {
    setPetFormError(null);
    try {
      if (!editingNewPet.name.trim()) {
        setPetFormError("Pet name is required");
        return;
      }
      await addPet(editingNewPet);
      await load();
      
      // Get the newly created pet
      const updated = await getUserPets(userId);
      const newPet = updated.find((p) => p.name === editingNewPet.name);
      
      if (newPet) {
        setSelectedPetForWizard(newPet);
        setShowAddPetForm(false);
        setEditingNewPet(emptyPet(userId));
        setShowWizard(true);
      }
    } catch (e: any) {
      setPetFormError(e?.message ?? String(e));
    }
  };

  // MY VISITS
  if (mode === "myVisits") {
    const openVisit = openVisitId ? visits.find((v) => v.id === openVisitId) ?? null : null;
    const openPet = openVisit ? pets.find((p) => p.id === openVisit.petId) ?? null : null;

    return (
      <div className="pageContent">
        <div className="stack">
          <h3>{t.myVisits}</h3>

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
                  ← {t.back}
                </button>

                <button
                  className="btn btnSecondary"
                  onClick={async () => {
                    await loadNoteForVisit(openVisit.id!);
                  }}
                >
                  Edit Visit Notes
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

          {editingNote && noteVisitId && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panelHeader">
                <h4 style={{ margin: 0 }}>Edit Visit Notes</h4>
              </div>

              <label className="label">
                {t.vetName}
                <input
                  className="input"
                  value={editingNote.vetName}
                  onChange={(e) => setEditingNote({ ...editingNote, vetName: e.target.value })}
                  placeholder="Vet's name"
                />
              </label>

              <label className="label">
                {t.diagnosis}
                <textarea
                  className="textarea"
                  value={editingNote.diagnosis}
                  onChange={(e) => setEditingNote({ ...editingNote, diagnosis: e.target.value })}
                  placeholder="What did the vet find?"
                  rows={4}
                />
              </label>

              <label className="label">
                {t.testsPerformed}
                <textarea
                  className="textarea"
                  value={editingNote.testsPerformed}
                  onChange={(e) => setEditingNote({ ...editingNote, testsPerformed: e.target.value })}
                  placeholder="Any tests done?"
                  rows={3}
                />
              </label>

              <label className="label">
                {t.treatmentMeds}
                <textarea
                  className="textarea"
                  value={editingNote.treatmentMeds}
                  onChange={(e) => setEditingNote({ ...editingNote, treatmentMeds: e.target.value })}
                  placeholder="Medications or treatment prescribed"
                  rows={3}
                />
              </label>

              <label className="label">
                {t.homeInstructions}
                <textarea
                  className="textarea"
                  value={editingNote.homeInstructions}
                  onChange={(e) => setEditingNote({ ...editingNote, homeInstructions: e.target.value })}
                  placeholder="What to do at home?"
                  rows={3}
                />
              </label>

              <label className="label">
                {t.followUp}
                <textarea
                  className="textarea"
                  value={editingNote.followUp}
                  onChange={(e) => setEditingNote({ ...editingNote, followUp: e.target.value })}
                  placeholder="Follow-up plan?"
                  rows={3}
                />
              </label>

              <div className="row" style={{ marginTop: 16, gap: 8 }}>
                <button className="btn btnPrimary" onClick={saveNote}>
                  {t.saveNote}
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setEditingNote(null);
                    setNoteVisitId(null);
                  }}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PREPARE MODE
  return (
    <div className="pageContent">
      {/* Choose Pet Modal */}
      {showChoosePetModal && !showAddPetForm && (
        <div
          className="modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            className="modalOverlay"
            onClick={() => setShowChoosePetModal(false)}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
          />
          <div
            className="modalContent"
            style={{
              position: "relative",
              zIndex: 10000,
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            <div
              className="modalHeader"
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0 }}>Choose a Pet</h3>
              <button
                className="btnClose"
                onClick={() => setShowChoosePetModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div
              className="modalBody"
              style={{ padding: "16px", overflowY: "auto", maxHeight: "calc(90vh - 80px)" }}
            >
              {pets.length > 0 && (
                <>
                  <h4 style={{ marginTop: 0, marginBottom: 12 }}>Your Pets</h4>
                  <div className="stack" style={{ marginBottom: 20 }}>
                    {pets.map((pet) => (
                      <button
                        key={pet.id}
                        className="itemCard"
                        onClick={() => handleSelectPetForWizard(pet)}
                        style={{ cursor: "pointer", textAlign: "left" }}
                      >
                        <div className="itemTitle">{pet.name || "(Unnamed)"}</div>
                        <div className="muted">{pet.species || "Unknown species"}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="btn btnPrimary"
                  onClick={() => {
                    setShowChoosePetModal(false);
                    setShowAddPetForm(true);
                  }}
                >
                  + Add Your First Pet
                </button>

                <button
                  className="btn btnSecondary"
                  onClick={handleContinueWithoutProfile}
                >
                  Continue without pet profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pet Form Modal */}
      {showAddPetForm && (
        <div
          className="modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            className="modalOverlay"
            onClick={() => setShowAddPetForm(false)}
            style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
          />
          <div
            className="modalContent"
            style={{
              position: "relative",
              zIndex: 10000,
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}
          >
            <div
              className="modalHeader"
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0 }}>Add Your First Pet</h3>
              <button
                className="btnClose"
                onClick={() => {
                  setShowAddPetForm(false);
                  setEditingNewPet(emptyPet(userId));
                  setPetFormError(null);
                }}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div
              className="modalBody"
              style={{ padding: "16px", overflowY: "auto", maxHeight: "calc(90vh - 80px)" }}
            >
              <p style={{ fontSize: 14, color: "var(--textMuted)", marginBottom: 16 }}>
                Tell us about your pet. You can always edit this later.
              </p>

              <label className="label">
                {t.petName}
                <input
                  className="input"
                  value={editingNewPet.name}
                  onChange={(e) => setEditingNewPet({ ...editingNewPet, name: e.target.value })}
                  placeholder="Pet's name"
                />
              </label>

              <label className="label">
                {t.species}
                <input
                  className="input"
                  value={editingNewPet.species}
                  onChange={(e) => setEditingNewPet({ ...editingNewPet, species: e.target.value })}
                  placeholder="e.g., Dog, Cat"
                />
              </label>

              <label className="label">
                {t.age}
                <input
                  className="input"
                  value={editingNewPet.age}
                  onChange={(e) => setEditingNewPet({ ...editingNewPet, age: e.target.value })}
                  placeholder="e.g., 3 years"
                />
              </label>

              <label className="label">
                {t.sex}
                <input
                  className="input"
                  value={editingNewPet.sex}
                  onChange={(e) => setEditingNewPet({ ...editingNewPet, sex: e.target.value })}
                  placeholder="e.g., Male, Female"
                />
              </label>

              <label className="label">
                {t.weight}
                <input
                  className="input"
                  value={editingNewPet.weight}
                  onChange={(e) => setEditingNewPet({ ...editingNewPet, weight: e.target.value })}
                  placeholder="e.g., 25 kg"
                />
              </label>

              {petFormError && (
                <div className="alert alertError" style={{ marginTop: 12 }}>
                  {t.error}: {petFormError}
                </div>
              )}

              <div className="row" style={{ marginTop: 16, gap: 8 }}>
                <button className="btn btnPrimary" onClick={handleSaveNewPet}>
                  {t.savePet}
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setShowAddPetForm(false);
                    setEditingNewPet(emptyPet(userId));
                    setPetFormError(null);
                  }}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard */}
      {showWizard && selectedPetForWizard && (
        <PrepareWizard
          lang={lang}
          userId={userId}
          petId={selectedPetForWizard.id || "temp"}
          petName={selectedPetForWizard.name || "Your pet"}
          onClose={async () => {
            setShowWizard(false);
            setSelectedPetForWizard(null);
            setShowChoosePetModal(false);
            await load();
          }}
        />
      )}

      {/* Default home screen (if modals not showing) */}
      {!showChoosePetModal && !showAddPetForm && !showWizard && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            gap: 24,
            textAlign: "center",
            padding: "40px 20px"
          }}
        >
          <div style={{ fontSize: 64 }}>🐾</div>
          <div>
            <h2 style={{ margin: "0 0 12px 0", color: "var(--blue)", fontSize: 28 }}>
              Walk in Prepared
            </h2>
            <p style={{ color: "var(--textMuted)", margin: 0, fontSize: 16, lineHeight: 1.6, maxWidth: 450 }}>
              Choose a pet (or add one) and start gathering your observations. Partner with your vet by preparing for the visit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
