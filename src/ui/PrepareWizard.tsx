return (
  <>
    {/* Overlay */}
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        zIndex: 1999
      }}
    />

    {/* Modal panel */}
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "92%",
        maxWidth: 520,
        maxHeight: "90vh",
        backgroundColor: "#fff",
        borderRadius: 12,
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>{t.prepareVisit}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Step {step + 1} of 7
          </div>
        </div>

        <button
          className="btn btnSecondary"
          onClick={onCancel}
          disabled={saving}
          type="button"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, overflowY: "auto" }}>
        <div className="panel">
          <div className="panelHeader">
            <h4 style={{ margin: 0 }}>Wizard placeholder</h4>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Next we’ll add the actual step questions and Next/Back buttons.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 10
        }}
      >
        <button className="btn btnSecondary" onClick={onCancel} disabled={saving} type="button">
          {t.cancel}
        </button>

        <div style={{ flex: 1 }} />

        <button className="btn btnSecondary" onClick={() => {}} disabled type="button">
          Back
        </button>

        <button className="btn btnPrimary" onClick={() => {}} disabled type="button">
          Next
        </button>
      </div>
    </div>
  </>
);
