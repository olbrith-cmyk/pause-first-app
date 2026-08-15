import type { Lang } from "../i18n";
import type { Visit } from "../firestore";

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

export function formatDuration(value: string | undefined, unit: DurationUnit | undefined, lang: Lang): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const n = Number(v);
  const unitLabel = durationUnitLabel(unit ?? "days", lang, Number.isFinite(n) ? n : 2);
  return `${v} ${unitLabel}`;
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

// The scannable one-liner: chief complaint + duration + trend, so a vet can
// read it in the seconds they have while walking into the room.
export function headlineLine(visit: Pick<Visit, "durationValue" | "durationUnit" | "trend">, lang: Lang): string {
  const bits: string[] = [];
  const duration = formatDuration(visit.durationValue, visit.durationUnit, lang);
  if (duration) bits.push(duration);
  const trend = trendLabel(visit.trend, lang);
  if (trend) bits.push(trend);
  return bits.join(" · ");
}
