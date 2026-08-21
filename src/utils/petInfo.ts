import type { Lang } from "../i18n";
import type { Pet, PetMedicationItem, PetPreventativeItem, PetVaccineItem } from "../firestore";

function formatMed(item: PetMedicationItem, lang: Lang): string {
  const bits: string[] = [];
  if (item.name?.trim()) bits.push(item.name.trim());

  const doseBits: string[] = [];
  if (item.unsureDose) doseBits.push(lang === "da" ? "dosis usikker" : "dose unsure");
  else if (item.dose?.trim()) doseBits.push(item.dose.trim());
  if (item.howOften?.trim()) doseBits.push(item.howOften.trim());
  if (doseBits.length) bits.push(`(${doseBits.join(", ")})`);

  if (item.notes?.trim()) bits.push(`- ${item.notes.trim()}`);
  return bits.join(" ");
}

function formatVaccine(item: PetVaccineItem, lang: Lang): string {
  const name = item.unsureName
    ? lang === "da" ? "Ukendt vaccine" : "Unknown vaccine"
    : item.vaccine?.trim() || (lang === "da" ? "Vaccine" : "Vaccine");

  const bits = [name];
  if (item.dateGiven?.trim()) bits.push(`(${item.dateGiven.trim()})`);
  if (item.notes?.trim()) bits.push(`- ${item.notes.trim()}`);
  return bits.join(" ");
}

function formatPreventative(item: PetPreventativeItem, lang: Lang): string {
  const bits: string[] = [];
  if (item.type?.trim()) bits.push(item.type.trim());
  if (item.productName?.trim()) bits.push(`- ${item.productName.trim()}`);

  const freqBits: string[] = [];
  if (item.howOften?.trim()) freqBits.push(item.howOften.trim());
  if (item.lastGiven?.trim()) {
    freqBits.push(lang === "da" ? `sidst: ${item.lastGiven.trim()}` : `last: ${item.lastGiven.trim()}`);
  }
  if (freqBits.length) bits.push(`(${freqBits.join(", ")})`);

  if (item.notes?.trim()) bits.push(`- ${item.notes.trim()}`);
  return bits.join(" ");
}

function vaccineStatusLabel(v: Pet["vaccinationStatus"] | undefined, lang: Lang): string {
  if (v === "up_to_date") return lang === "da" ? "Opdateret" : "Up to date";
  if (v === "not_up_to_date") return lang === "da" ? "Ikke opdateret" : "Not up to date";
  if (v === "unknown") return lang === "da" ? "Ikke sikker" : "Not sure";
  return "";
}

export function indoorOutdoorLabel(v: Pet["indoorOutdoor"] | undefined, lang: Lang): string {
  if (v === "indoor") return lang === "da" ? "Indendørs" : "Indoor";
  if (v === "outdoor") return lang === "da" ? "Udendørs" : "Outdoor";
  if (v === "both") return lang === "da" ? "Begge dele" : "Both";
  return "";
}

export function medicationsSummary(pet: Pet, lang: Lang): string {
  if (pet.medsSupplements && pet.medsSupplements.length > 0) {
    return pet.medsSupplements.map((m) => formatMed(m, lang)).filter(Boolean).join("; ");
  }
  return (pet.medications ?? "").trim();
}

export function vaccinationsSummary(pet: Pet, lang: Lang): string {
  if (pet.vaccinations && pet.vaccinations.length > 0) {
    return pet.vaccinations.map((v) => formatVaccine(v, lang)).filter(Boolean).join("; ");
  }
  const vLabel = vaccineStatusLabel(pet.vaccinationStatus, lang);
  const vDate = pet.vaccinationLastDate?.trim();
  return [vLabel, vDate ? (lang === "da" ? `sidst: ${vDate}` : `last: ${vDate}`) : ""]
    .filter(Boolean)
    .join(" • ");
}

export function preventativesSummary(pet: Pet, lang: Lang): string {
  if (pet.preventativesList && pet.preventativesList.length > 0) {
    return pet.preventativesList.map((p) => formatPreventative(p, lang)).filter(Boolean).join("; ");
  }
  return (pet.preventatives ?? "").trim();
}

function ageOrBirthSummary(pet: Pet): string {
  if (pet.dateOfBirth?.trim()) return pet.dateOfBirth.trim();
  return (pet.age ?? "").trim();
}

// dateOfBirth is a freeform text field ("DD/MM/YYYY (or approximate)" is
// just a placeholder, not enforced) — parse the common case, and let
// anything else fall through to being shown as typed.
function parseDateOfBirth(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime()) || d.getMonth() !== month - 1) return null;
  return d;
}

function pluralize(n: number, lang: Lang, unit: "year" | "month" | "day"): string {
  const forms: Record<Lang, Record<"year" | "month" | "day", [string, string]>> = {
    en: { year: ["year", "years"], month: ["month", "months"], day: ["day", "days"] },
    da: { year: ["år", "år"], month: ["måned", "måneder"], day: ["dag", "dage"] }
  };
  const [singular, plural] = forms[lang][unit];
  return `${n} ${n === 1 ? singular : plural}`;
}

// Age as of a given date (the visit date, when known — clinically that's
// the age that matters, not today's) computed from dateOfBirth: years once
// the pet is a year or older, otherwise months, otherwise days for very
// young animals. Falls back to the raw dateOfBirth/age text if it can't be
// parsed as a date.
function computedAgeText(pet: Pet, lang: Lang, asOf: Date): string {
  const dobRaw = pet.dateOfBirth?.trim();
  const dob = dobRaw ? parseDateOfBirth(dobRaw) : null;
  if (!dob || dob.getTime() > asOf.getTime()) return ageOrBirthSummary(pet);

  let years = asOf.getFullYear() - dob.getFullYear();
  let months = asOf.getMonth() - dob.getMonth();
  let days = asOf.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years >= 1) return pluralize(years, lang, "year");
  if (months >= 1) return pluralize(months, lang, "month");
  return pluralize(Math.max(days, 0), lang, "day");
}

// Species + breed + age, e.g. "Dog · Labrador · 4 years" — the "signalment"
// a vet expects right alongside the pet's name, since a name alone doesn't
// say what they're walking in to see. Age is computed as of `asOf` (pass
// the visit date so it reflects the pet's age at that visit, not today).
export function signalmentLine(pet: Pet, lang: Lang, asOf: Date = new Date()): string {
  return [pet.species, pet.breedType, computedAgeText(pet, lang, asOf)]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

export function patientInfoRows(pet: Pet, lang: Lang): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value?: string) => {
    const v = (value ?? "").trim();
    if (v) rows.push({ label, value: v });
  };

  push(lang === "da" ? "Art" : "Species", pet.species);
  push(lang === "da" ? "Race" : "Breed", pet.breedType);
  push(lang === "da" ? "Fødselsdato / alder" : "Date of birth / age", ageOrBirthSummary(pet));
  push(lang === "da" ? "Køn" : "Sex", pet.sex);
  push(lang === "da" ? "Kastreret/steriliseret" : "Neutered status", pet.neuteredStatus);
  push(lang === "da" ? "Indendørs/udendørs" : "Indoor/outdoor", indoorOutdoorLabel(pet.indoorOutdoor, lang));
  push(lang === "da" ? "Vægt" : "Weight", pet.weight);
  push(lang === "da" ? "Mikrochip" : "Microchip", pet.microchip);
  push(lang === "da" ? "Vaccinationer" : "Vaccinations", vaccinationsSummary(pet, lang));
  push(lang === "da" ? "Foder" : "Diet / feed", pet.diet);
  push(lang === "da" ? "Forebyggelse" : "Preventatives", preventativesSummary(pet, lang));
  push(lang === "da" ? "Medicin" : "Medications", medicationsSummary(pet, lang));
  push(lang === "da" ? "Allergier/reaktioner" : "Allergies / reactions", pet.allergies);
  push(lang === "da" ? "Operationer/indgreb" : "Surgeries / procedures", pet.surgeries);
  push(lang === "da" ? "Livsstil/miljø" : "Lifestyle / environment", pet.lifestyle);
  push(lang === "da" ? "Noter" : "Notes", pet.notes);

  return rows;
}

export function patientInfoLines(pet: Pet, lang: Lang): string[] {
  return patientInfoRows(pet, lang).map((r) => `${r.label}: ${r.value}`);
}
