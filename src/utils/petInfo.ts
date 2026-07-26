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
  push(lang === "da" ? "Neutraliseret" : "Neutered status", pet.neuteredStatus);
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
