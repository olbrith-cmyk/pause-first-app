import type { TriState } from "../firestore";

type Props = {
  lang: "da" | "en";
  value: TriState;
  onChange: (next: TriState) => void;
};

export default function TriToggle({ lang, value, onChange }: Props) {
  const labels =
    lang === "da"
      ? { normal: "Som normalt", changed: "Anderledes", na: "Ikke sikker" }
      : { normal: "As usual", changed: "Different", na: "Not sure" };

  const options: { key: TriState; label: string }[] = [
    { key: "normal", label: labels.normal },
    { key: "changed", label: labels.changed },
    { key: "na", label: labels.na }
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            className={`btn ${active ? "btnPrimary" : "btnSecondary"}`}
            onClick={() => onChange(opt.key)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              flex: "1 1 120px",
              minWidth: 120
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
