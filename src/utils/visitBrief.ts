import type { Lang } from "../i18n";

export type DurationUnit = "hours" | "days" | "weeks" | "months";
export type Trend = "better" | "worse" | "same";
export type Urgency = "routine" | "concerned" | "very_worried";

const durationUnitLabels: Record<Lang, Record<DurationUnit, { singular: string; plural: string }>> = {
  en: {
    hours: { singular: "hour", plural: "hours" },
    days: { singular: "day", plural: "days" },
    weeks: { singular: "week", plural: "weeks" },
    months: { singular: "month", plural: "months" }
  },
  da: {
    hours: { singular: "time", plural: "timer" },
    days: { singular: "dag", plural: "dage" },
    weeks: { singular: "uge", plural: "uger" },
    months: { singular: "måned", plural: "måneder" }
  }
};

export function durationUnitLabel(unit: DurationUnit, lang: Lang, count: number): string {
  const forms = durationUnitLabels[lang][unit];
  return count === 1 ? forms.singular : forms.plural;
}

// Bare "2 days", with no "Duration:" label — for contexts (like a table row
// or column already headed "Duration") where the label would be redundant.
export function durationText(value: string | undefined, unit: DurationUnit | undefined, lang: Lang): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const n = Number(v);
  const unitLabel = durationUnitLabel(unit ?? "days", lang, Number.isFinite(n) ? n : 2);
  return `${v} ${unitLabel}`;
}

// Labeled explicitly ("Duration: ...") rather than a bare "2 days" — an
// unlabeled number reads as ambiguous next to other durations that can
// appear elsewhere in the same document (e.g. "leash walks for 3 days" in
// Previous Treatment), which is a different fact entirely.
export function formatDuration(value: string | undefined, unit: DurationUnit | undefined, lang: Lang): string {
  const t = durationText(value, unit, lang);
  if (!t) return "";
  return lang === "da" ? `Varighed: ${t}` : `Duration: ${t}`;
}

export function trendLabel(trend: Trend | undefined, lang: Lang): string {
  if (!trend) return "";
  const labels: Record<Lang, Record<Trend, string>> = {
    en: { better: "Getting better", worse: "Getting worse", same: "About the same" },
    da: { better: "Bliver bedre", worse: "Bliver værre", same: "Uændret" }
  };
  return labels[lang][trend];
}

export function urgencyLabel(urgency: Urgency | undefined, lang: Lang): string {
  if (!urgency) return "";
  const labels: Record<Lang, Record<Urgency, string>> = {
    en: { routine: "Routine", concerned: "Somewhat worried", very_worried: "Very worried" },
    da: { routine: "Rutine", concerned: "Lidt bekymret", very_worried: "Meget bekymret" }
  };
  return labels[lang][urgency];
}

// Shared color semantics: routine reads as calm (green), concerned as a
// heads-up (blue), very_worried as the same tone as "changed" elsewhere in
// the app (red) — matches the Current Status chip coloring.
export function urgencyTone(urgency: Urgency | undefined): "changed" | "notSure" | "asUsual" | null {
  if (urgency === "very_worried") return "changed";
  if (urgency === "concerned") return "notSure";
  if (urgency === "routine") return "asUsual";
  return null;
}

// A colored dot carries the severity signal on its own, so urgency still
// reads instantly even when its chip color happens to match a neighboring
// pill (e.g. "concerned" and the duration pill are both blue).
export function urgencyIcon(urgency: Urgency | undefined): string {
  if (urgency === "very_worried") return "🔴";
  if (urgency === "concerned") return "🟡";
  if (urgency === "routine") return "🟢";
  return "";
}
