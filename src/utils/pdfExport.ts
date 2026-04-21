import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Lang } from "../i18n";
import type { Pet, Visit, VisitNote } from "../firestore";

function buildShareText(params: { visit: Visit; pet: Pet; note: VisitNote | null; lang: Lang }) {
  const { visit, pet, note, lang } = params;

  const lines: string[] = [];

  if (lang === "da") {
    lines.push(`Pause First™ – forberedelse til dyrlægebesøg`);
    lines.push(`Kæledyr: ${pet.name}`);
    lines.push(`Dato: ${visit.visitDate || "(ingen dato)"}`);
    lines.push("");
    lines.push(`Hovedbekymring: ${visit.mainConcern || "(ikke angivet)"}`);
    if (visit.whenStart) lines.push(`Hvornår startede det: ${visit.whenStart}`);
    if (visit.howProgressing) lines.push(`Hvordan udvikler det sig: ${visit.howProgressing}`);
    if (visit.patterns) lines.push(`Mønstre/triggere: ${visit.patterns}`);
    if (visit.associatedSigns) lines.push(`Tilknyttede tegn: ${visit.associatedSigns}`);
    if (visit.previousTreatment) lines.push(`Tidligere behandling: ${visit.previousTreatment}`);
    if (visit.questionsVet) lines.push(`Spørgsmål til dyrlægen: ${visit.questionsVet}`);

    if (note) {
      lines.push("");
      lines.push("Besøgsnoter:");
      if (note.vetName) lines.push(`Dyrlæge: ${note.vetName}`);
      if (note.diagnosis) lines.push(`Diagnose/fund: ${note.diagnosis}`);
      if (note.testsPerformed) lines.push(`Udførte tests: ${note.testsPerformed}`);
      if (note.treatmentMeds) lines.push(`Medicin/behandling: ${note.treatmentMeds}`);
      if (note.homeInstructions) lines.push(`Instruktioner derhjemme: ${note.homeInstructions}`);
      if (note.followUp) lines.push(`Opfølgning: ${note.followUp}`);
    }
  } else {
    lines.push(`Pause First™ – vet visit preparation`);
    lines.push(`Pet: ${pet.name}`);
    lines.push(`Date: ${visit.visitDate || "(no date)"}`);
    lines.push("");
    lines.push(`Main concern: ${visit.mainConcern || "(not provided)"}`);
    if (visit.whenStart) lines.push(`When did this start: ${visit.whenStart}`);
    if (visit.howProgressing) lines.push(`How is it progressing: ${visit.howProgressing}`);
    if (visit.patterns) lines.push(`Patterns/triggers: ${visit.patterns}`);
    if (visit.associatedSigns) lines.push(`Associated signs: ${visit.associatedSigns}`);
    if (visit.previousTreatment) lines.push(`Previous treatment: ${visit.previousTreatment}`);
    if (visit.questionsVet) lines.push(`Questions for the vet: ${visit.questionsVet}`);

    if (note) {
      lines.push("");
      lines.push("Visit notes:");
      if (note.vetName) lines.push(`Veterinarian: ${note.vetName}`);
      if (note.diagnosis) lines.push(`Diagnosis/findings: ${note.diagnosis}`);
      if (note.testsPerformed) lines.push(`Tests performed: ${note.testsPerformed}`);
      if (note.treatmentMeds) lines.push(`Medications/treatment: ${note.treatmentMeds}`);
      if (note.homeInstructions) lines.push(`Instructions at home: ${note.homeInstructions}`);
      if (note.followUp) lines.push(`Follow-up: ${note.followUp}`);
    }
  }

  return lines.join("\n");
}

export async function exportToPDF(params: {
  visit: Visit;
  pet: Pet;
  note: VisitNote | null;
  lang: Lang;
}) {
  const el = document.getElementById("document-content");
  if (!el) throw new Error("Document content not found.");

  // Render the document content to a canvas
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  const imgData = canvas.toDataURL("image/png");

  // Create PDF (A4)
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calculate image dimensions to fit A4 width
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add extra pages if needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const fileName = `PauseFirst_${params.pet.name}_${params.visit.visitDate || "visit"}.pdf`
    .replace(/\s+/g, "_")
    .replace(/[^\w\-\.]/g, "");

  pdf.save(fileName);
}

export async function shareWithVet(params: {
  visit: Visit;
  pet: Pet;
  note: VisitNote | null;
  lang: Lang;
}) {
  const text = buildShareText(params);

  // Mobile share sheet (best UX on phones/tablets)
  const nav: any = navigator;
  if (nav.share) {
    await nav.share({
      title: "Pause First™",
      text
    });
    return;
  }

  // Desktop fallback: copy to clipboard
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard. You can paste it into an email to your vet.");
    return;
  }

  // Last resort
  alert(text);
}
