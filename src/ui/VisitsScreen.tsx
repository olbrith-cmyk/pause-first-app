import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

import type { Pet, Visit, VisitNote } from "../firestore";
import {
  addVisitNote,
  getUserPets,
  getUserVisits,
  getVisitNote,
  updateVisitNote,
  addPet,
  deleteVisitFully
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

export default function VisitsScreen({
  lang,
  userId,
  mode,
  onWizardOpenChange,
  onModeChange,
  onGoHome,
  onGoToAnimals,
  onOpenVisitChange,
  backSignal,
}: {
  lang: Lang;
  userId: string;
  mode: Mode;
  onWizardOpenChange?: (open: boolean) => void;
  onModeChange?: (mode: Mode) => void;
  onGoHome?: () => void;
  onGoToAnimals?: () => void;

  // NEW: tell Dashboard when a visit detail is open
  onOpenVisitChange?: (openVisitId: string | null) => void;

  // NEW: Dashboard increments this to request "Back" (close open visit)
  backSignal?: number;
}) {
  
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [openVisitId, setOpenVisitId] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<VisitNote | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);
  const [noteVisitId, setNoteVisitId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
  setToast(message);
  window.setTimeout(() => setToast(null), 2200);
};
  // Prepare flow
  const [showChoosePetModal, setShowChoosePetModal] = useState(false);
  const [selectedPetForWizard, setSelectedPetForWizard] = useState<Pet | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
  load();
}, [userId]);

useEffect(() => {
  if (mode === "prepare") {
    setShowChoosePetModal(true);
  }
}, [mode]);

useEffect(() => {
  onWizardOpenChange?.(showWizard);
}, [showWizard, onWizardOpenChange]);

useEffect(() => {
  if (!backSignal) return;
  if (!openVisitId) return;

  // Close the open visit details (acts like Back)
  setOpenVisitId(null);
  onOpenVisitChange?.(null);
  setOpenNote(null);
}, [backSignal]);

  // Drafts (for "Continue draft")
  const draftVisits = useMemo(() => {
    return visits
      .filter((v) => (v.status ?? "final") === "draft")
      .sort((a, b) => {
        const ad = (a.updatedAt as any)?.toMillis?.() ?? 0;
        const bd = (b.updatedAt as any)?.toMillis?.() ?? 0;
        return bd - ad;
      });
  }, [visits]);

  // Final visits (for main list)
  const finalVisitsSorted = useMemo(() => {
    return visits
      .filter((v) => (v.status ?? "final") !== "draft")
      .sort((a, b) => {
        const ad = a.visitDate || "";
        const bd = b.visitDate || "";
        return bd.localeCompare(ad);
      });
  }, [visits]);

  const openVisitCard = async (visitId: string) => {
  setOpenVisitId(visitId);
  onOpenVisitChange?.(visitId);
  try {
      const note = await getVisitNote(userId, visitId);
      setOpenNote(note ?? null);
    } catch (e) {
      console.error("Error loading note:", e);
      setOpenNote(null);
    }
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
      setEditingNote(null);
      setNoteVisitId(null);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };
  
const handleDeleteVisit = async (visitId: string) => {
  const ok = window.confirm(
    lang === "da"
      ? "Vil du slette dette besøg? Dette kan ikke fortrydes."
      : "Delete this visit? This cannot be undone."
  );
  if (!ok) return;

  try {
    await deleteVisitFully(userId, visitId);

    // Close any open panels/editors
    setOpenVisitId(null);
    onOpenVisitChange?.(null);
    setOpenNote(null);
    setEditingNote(null);
    setNoteVisitId(null);

    await load();
  } catch (e: any) {
    alert(t.error + ": " + (e?.message ?? String(e)));
  }
};
  
  const handleSelectPetForWizard = (pet: Pet) => {
    setSelectedPetForWizard(pet);
    setShowChoosePetModal(false);
    setShowWizard(true);
  };

  const openWizardForVisit = (visitId: string, petId: string) => {
    const pet = pets.find((p) => p.id === petId) ?? null;
    setEditingVisitId(visitId);
    setSelectedPetForWizard(pet);
    setShowChoosePetModal(false);
    setShowWizard(true);
  };

  const isDraft = (v: Visit) => (v.status ?? "final") === "draft";

  const hasAnyPreparation = (v: Visit) => {
    return !!(
      v.mainConcern?.trim() ||
      v.whenStart?.trim() ||
      v.howProgressing?.trim() ||
      v.patterns?.trim() ||
      v.associatedSigns?.trim() ||
      v.previousTreatment?.trim() ||
      v.questionsVet?.trim() ||
      (v.currentStatus && Object.keys(v.currentStatus).length > 0)
    );
  };

  const prepStatusText = (v: Visit) => {
    if (isDraft(v)) return lang === "da" ? "Forberedelse: Kladde" : "Prep: Draft";
    if (hasAnyPreparation(v)) return lang === "da" ? "Forberedelse: Klar" : "Prep: Ready";
    return lang === "da" ? "Forberedelse: Ikke udfyldt" : "Prep: Not started";
  };

  const notesStatusTextFromVisit = (v: Visit) => {
    const hasNotes = v.hasNotes === true;
    if (lang === "da") return `Noter: ${hasNotes ? "Ja" : "Nej"}`;
    return `Notes: ${hasNotes ? "Yes" : "No"}`;
  };

  // Critical fix: create a real minimal pet so visits are saved & accessible later
  const handleContinueWithoutProfile = async () => {
    try {
      const minimalPet: Pet = {
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

      await addPet(minimalPet);
      await load();

      const updated = await getUserPets(userId);
      const createdPet = [...updated].reverse().find((p) => p.name === "(Unnamed pet)") ?? null;

      if (!createdPet?.id) {
        alert("Could not create pet. Please try again.");
        return;
      }

      setSelectedPetForWizard(createdPet);
      setShowChoosePetModal(false);
      setShowWizard(true);
    } catch (e: any) {
      alert(t.error + ": " + (e?.message ?? String(e)));
    }
  };

  // -------------------------
  // MY VISITS
  // -------------------------
  if (mode === "myVisits") {
    const openVisit = openVisitId ? visits.find((v) => v.id === openVisitId) ?? null : null;
    const openPet = openVisit ? pets.find((p) => p.id === openVisit.petId) ?? null : null;

    return (
      <div className="pageContent">
        <div className="stack">
          <h3>{t.myVisits}</h3>

          {/* Continue draft */}
{draftVisits.length > 0 && !openVisit && (
  <div className="panel" style={{ marginBottom: 12 }}>
    <div className="panelHeader">
      <h4 style={{ margin: 0 }}>{lang === "da" ? "Fortsæt kladde" : "Continue draft"}</h4>
    </div>

    <div className="stack">
      {draftVisits.slice(0, 3).map((v) => {
        const pet = pets.find((p) => p.id === v.petId);
        return (
          <button
            key={v.id}
            className="itemCard"
            onClick={() => openVisitCard(v.id!)}   // ✅ open details screen (not wizard)
            style={{ cursor: "pointer", textAlign: "left" }}
          >
            <div className="itemTitle">
              {pet?.name || "(Unnamed)"} — {v.visitDate || "No date"}
            </div>

            <div className="muted">
              {v.mainConcern ||
                (lang === "da"
                  ? "Kladde (ingen hovedbekymring endnu)"
                  : "Draft (no main concern yet)")}
            </div>

            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              {prepStatusText(v)} • {notesStatusTextFromVisit(v)}
            </div>
          </button>
        );
      })}
    </div>
  </div>
)}

          {finalVisitsSorted.length === 0 && draftVisits.length === 0 && (
            <div className="muted">{lang === "da" ? "Ingen besøg endnu." : "No visits yet."}</div>
          )}

          {!openVisit && (
  <>
    {/* Second headline for non-draft visits */}
    {finalVisitsSorted.length > 0 && (
      <div style={{ marginTop: draftVisits.length > 0 ? 8 : 0, marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>
          {lang === "da" ? "Gemte besøg" : "Saved visits"}
        </h4>
        <div className="muted" style={{ marginTop: 4 }}>
          {lang === "da"
            ? "Færdige besøgsnotater (ikke kladder)"
            : "Finished Visit Briefs (not drafts)"}
        </div>
      </div>
    )}

    {finalVisitsSorted.map((v) => {
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

          <div className="muted">
            {v.mainConcern ||
              (lang === "da" ? "Ingen hovedbekymring endnu." : "No main concern yet.")}
          </div>

          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            {prepStatusText(v)} • {notesStatusTextFromVisit(v)}
          </div>
        </button>
      );
    })}
  </>
)}

          {openVisit && (
            <div className="panel">
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
  <button
    className="btn btnSecondary btnSmall"
    style={{ flex: 1 }}
    onClick={() => {
      setEditingVisitId(openVisit.id!);
      setSelectedPetForWizard(openPet ?? null);
      setShowWizard(true);
    }}
  >
    {(openVisit.status ?? "final") === "draft"
      ? (lang === "da" ? "Fortsæt kladde" : "Continue")
      : (lang === "da" ? "Redigér" : "Edit")}
  </button>

  <button
    className="btn btnSecondary btnSmall"
    style={{ flex: 1 }}
    onClick={async () => {
      await loadNoteForVisit(openVisit.id!);
    }}
  >
    {lang === "da" ? "Noter" : "Notes"}
  </button>

  <button
    className="btn btnSecondary btnSmall btnDanger"
    style={{ flex: 1 }}
    onClick={() => handleDeleteVisit(openVisit.id!)}
  >
    {lang === "da" ? "Slet" : "Delete"}
  </button>
</div>

              <div className="panelHeader">
                <h4 style={{ margin: 0 }}>
                  {openPet?.name || "(Unnamed)"} — {openVisit.visitDate || "No date"}
                </h4>
                <div className="muted" style={{ marginTop: 6 }}>
                  {prepStatusText(openVisit)} • {notesStatusTextFromVisit(openVisit)}
                </div>
              </div>

              <h4 style={{ marginTop: 12 }}>{lang === "da" ? "Forberedelse" : "Preparation"}</h4>
              <ViewOnlyPrepare visit={openVisit} />

              <h4 style={{ marginTop: 16 }}>{lang === "da" ? "Besøgsnoter" : "Visit Notes"}</h4>
              {openNote ? (
                <ViewOnlyNotes note={openNote} />
              ) : (
                <div className="muted">
                  {lang === "da" ? "Ingen besøgsnoter endnu." : "No visit notes yet."}
                </div>
              )}
            </div>
          )}

          {editingNote && noteVisitId && (
            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panelHeader">
                <h4 style={{ margin: 0 }}>
                  {lang === "da" ? "Redigér besøgsnoter" : "Edit Visit Notes"}
                </h4>
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
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, testsPerformed: e.target.value })
                  }
                  placeholder="Any tests done?"
                  rows={3}
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
                  placeholder="Medications or treatment prescribed"
                  rows={3}
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

        {/* Wizard can also be opened from My Visits */}
        {showWizard && selectedPetForWizard?.id && (
          <PrepareWizard
            lang={lang}
            userId={userId}
            mode="prepare"
            petId={selectedPetForWizard.id}
            petName={selectedPetForWizard.name || "(Unnamed)"}
            visitId={editingVisitId ?? undefined}
            onClose={async () => {
              setShowWizard(false);
              setEditingVisitId(null);
              setSelectedPetForWizard(null);
              await load();
            }}
            onComplete={async () => {
              setShowWizard(false);
              setEditingVisitId(null);
              setSelectedPetForWizard(null);
              await load();
            }}
            onToast={showToast}
          />
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }
  
  // -------------------------
  // PREPARE MODE
  // -------------------------
  return (
    <div className="pageContent">
      {/* Choose Pet Modal */}
      {showChoosePetModal && (
        <div
          className="modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modalOverlay"
            onClick={() => {
              setShowChoosePetModal(false);
              onGoHome?.();
            }}
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
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="modalHeader"
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>{lang === "da" ? "Vælg et dyr" : "Choose an Animal"}</h3>
              <button
                className="btnClose"
                onClick={() => {
                  setShowChoosePetModal(false);
                  onGoHome?.();
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
              {pets.length > 0 && (
                <>
                  <h4 style={{ marginTop: 0, marginBottom: 12 }}>
                    {lang === "da" ? "Dine dyr" : "Your Animals"}
                  </h4>

                  <div className="stack" style={{ marginBottom: 20 }}>
                    {pets.map((pet) => (
                      <button
                        key={pet.id}
                        className="itemCard"
                        onClick={() => handleSelectPetForWizard(pet)}
                        style={{ cursor: "pointer", textAlign: "left" }}
                      >
                        <div className="itemTitle">{pet.name || "(Unnamed)"}</div>
                        <div className="muted">
                          {pet.species || (lang === "da" ? "Ukendt art" : "Unknown species")}
                        </div>
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
    onGoToAnimals?.();
  }}
>
  {lang === "da" ? "Tilføj en dyreprofil" : "Add an animal profile"}
</button>

                <button className="btn btnSecondary" onClick={handleContinueWithoutProfile}>
                  {lang === "da" ? "Fortsæt uden dyreprofil" : "Continue without animal profile"}
                </button>

                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setShowChoosePetModal(false);
                    onGoHome?.();
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
      {showWizard && selectedPetForWizard?.id && (
        <PrepareWizard
          lang={lang}
          userId={userId}
          mode="prepare"
          petId={selectedPetForWizard.id}
          petName={selectedPetForWizard.name || "(Unnamed)"}
          visitId={editingVisitId ?? undefined}
          onClose={async () => {
            setShowWizard(false);
            setEditingVisitId(null);
            setSelectedPetForWizard(null);
            setShowChoosePetModal(false);
            await load();
          }}
          onComplete={async () => {
            setShowWizard(false);
            setEditingVisitId(null);
            setSelectedPetForWizard(null);
            setShowChoosePetModal(false);
            await load();
          }}
          onToast={showToast}
        />
      )}

      {/* Fallback (if wizard not open) */}
      {!showWizard && !showChoosePetModal && (
        <div className="panel">
          <div className="muted">
            {lang === "da"
              ? "Vælg et dyr for at starte forberedelsen."
              : "Choose an animal to start preparing."}
          </div>

          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <button className="btn btnPrimary" onClick={() => setShowChoosePetModal(true)}>
              {lang === "da" ? "Vælg dyr" : "Choose Animal"}
            </button>

            <button
              className="btn btnSecondary"
              onClick={() => {
                onGoHome?.();
              }}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
     {toast && <div className="toast">{toast}</div>} 
    </div>
  );
}
