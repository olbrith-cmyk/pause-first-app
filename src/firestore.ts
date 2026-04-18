if (mode === "notes") {
  const selectedVisit = selectedVisitId ? visits.find(v => v.id === selectedVisitId) : null;

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
                onClick={() => loadNote(v.id!)}
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
            {pets.find(p => p.id === selectedVisit.petId)?.name || "(Unnamed)"} —{" "}
            {selectedVisit.visitDate}
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
