import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Lang } from "../i18n";
import type { Attachment, AttachmentType, CurrentStatus, Pet, TriState, Visit, VisitNote } from "../firestore";
import { patientInfoLines, signalmentLine } from "./petInfo";
import { formatDuration, trendLabel, urgencyIcon, urgencyLabel } from "./visitBrief";

function currentStatusLines(cs: CurrentStatus | undefined, lang: Lang): string[] {
  if (!cs) return [];

  const items: Array<{ key: keyof CurrentStatus; labelDa: string; labelEn: string; notesKey: keyof CurrentStatus }> = [
    { key: "appetite", labelDa: "Appetit", labelEn: "Appetite", notesKey: "appetiteNotes" },
    { key: "drinking", labelDa: "Drikker", labelEn: "Drinking", notesKey: "drinkingNotes" },
    { key: "energy", labelDa: "Energi", labelEn: "Energy", notesKey: "energyNotes" },
    { key: "toileting", labelDa: "Toiletvaner", labelEn: "Toileting", notesKey: "toiletingNotes" },
    { key: "gi", labelDa: "Mave/tarm", labelEn: "GI", notesKey: "giNotes" },
    { key: "breathing", labelDa: "Vejrtrækning", labelEn: "Breathing", notesKey: "breathingNotes" },
    { key: "mobilityPain", labelDa: "Bevægelse/smerte", labelEn: "Mobility/pain", notesKey: "mobilityPainNotes" },
    { key: "skinEars", labelDa: "Hud/ører", labelEn: "Skin/ears", notesKey: "skinEarsNotes" }
  ];

  const different: string[] = [];
  const notSure: string[] = [];
  const asUsual: string[] = [];

  for (const it of items) {
    const v = (cs[it.key] as TriState) ?? "normal";
    const notes = ((cs[it.notesKey] as string) ?? "").trim();
    const label = lang === "da" ? it.labelDa : it.labelEn;
    const line = notes ? `${label}: ${notes}` : label;
    if (v === "changed") different.push(line);
    else if (v === "na") notSure.push(line);
    else asUsual.push(label);
  }

  const lines: string[] = [];
  if (different.length) lines.push(`${lang === "da" ? "Anderledes" : "Different"}: ${different.join(", ")}`);
  if (notSure.length) lines.push(`${lang === "da" ? "Ikke relevant / ved ikke" : "N/A / not sure"}: ${notSure.join(", ")}`);
  if (asUsual.length) lines.push(`${lang === "da" ? "Som normalt" : "As usual"}: ${asUsual.join(", ")}`);

  const otherNotes = (cs.otherNotes ?? "").trim();
  if (otherNotes) lines.push(otherNotes);

  return lines;
}

function buildShareText(params: { visit: Visit; pet: Pet; note: VisitNote | null; lang: Lang }) {
  const { visit, pet, note, lang } = params;

  const lines: string[] = [];

  const medicationsSupplements = visit.medicationsSupplements ?? "";
  const knownConditions = ((visit as any).knownConditions as string) ?? "";
  const recentTests = ((visit as any).recentTests as string) ?? "";

  const visitDateParsed = visit.visitDate ? new Date(visit.visitDate) : null;
  const signalmentAsOf = visitDateParsed && !Number.isNaN(visitDateParsed.getTime()) ? visitDateParsed : new Date();

  if (lang === "da") {
    lines.push(buildEmailTitle(pet, visit, lang));
    lines.push(`Pause First™ – forberedelse til dyrlægebesøg`);
    lines.push(`Dyr: ${pet.name}`);
    const signalmentDa = signalmentLine(pet, lang, signalmentAsOf);
    if (signalmentDa) lines.push(signalmentDa);
    lines.push(`Dato: ${visit.visitDate || "(ingen dato)"}`);

    lines.push("");
    lines.push(`Hovedbekymring: ${visit.mainConcern || "(ikke angivet)"}`);
    if (visit.urgency) lines.push(`Bekymringsniveau: ${urgencyIcon(visit.urgency)} ${urgencyLabel(visit.urgency, lang)}`);
    const duration = formatDuration(visit.durationValue, visit.durationUnit, lang);
    if (duration) lines.push(`Varighed: ${duration}`);
    if (visit.trend) lines.push(`Udvikling: ${trendLabel(visit.trend, lang)}`);
    if (visit.whenStart) lines.push(`Hvornår startede det: ${visit.whenStart}`);
    if (visit.howProgressing) lines.push(`Hvordan udvikler det sig: ${visit.howProgressing}`);
    if (visit.patterns) lines.push(`Mønstre/triggere: ${visit.patterns}`);
    if (visit.associatedSigns) lines.push(`Tilknyttede tegn: ${visit.associatedSigns}`);

    const statusLines = currentStatusLines(visit.currentStatus, lang);
    if (statusLines.length) {
      lines.push("");
      lines.push("Status lige nu:");
      lines.push(...statusLines);
    }

    if (visit.otherDetails) lines.push(`Andre detaljer: ${visit.otherDetails}`);
    if (medicationsSupplements) lines.push(`Medicin/tilskud: ${medicationsSupplements}`);
    if (knownConditions) lines.push(`Kendte tilstande (diagnosticeret): ${knownConditions}`);
    if (recentTests) lines.push(`Nylige tests/resultater: ${recentTests}`);
    if (visit.previousTreatment) lines.push(`Tidligere behandling: ${visit.previousTreatment}`);
    if (visit.questionsVet) lines.push(`Spørgsmål til dyrlægen: ${visit.questionsVet}`);

    const patientLines = patientInfoLines(pet, lang);
    if (patientLines.length) {
      lines.push("");
      lines.push("Om patienten:");
      lines.push(...patientLines);
    }

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
    lines.push(buildEmailTitle(pet, visit, lang));
    lines.push(`Pause First™ – vet visit preparation`);
    lines.push(`Pet: ${pet.name}`);
    const signalmentEn = signalmentLine(pet, lang, signalmentAsOf);
    if (signalmentEn) lines.push(signalmentEn);
    lines.push(`Date: ${visit.visitDate || "(no date)"}`);

    lines.push("");
    lines.push(`Main concern: ${visit.mainConcern || "(not provided)"}`);
    if (visit.urgency) lines.push(`Urgency: ${urgencyIcon(visit.urgency)} ${urgencyLabel(visit.urgency, lang)}`);
    const duration = formatDuration(visit.durationValue, visit.durationUnit, lang);
    if (duration) lines.push(`Duration: ${duration}`);
    if (visit.trend) lines.push(`Trend: ${trendLabel(visit.trend, lang)}`);
    if (visit.whenStart) lines.push(`When did this start: ${visit.whenStart}`);
    if (visit.howProgressing) lines.push(`How is it progressing: ${visit.howProgressing}`);
    if (visit.patterns) lines.push(`Patterns/triggers: ${visit.patterns}`);
    if (visit.associatedSigns) lines.push(`Associated signs: ${visit.associatedSigns}`);

    const statusLines = currentStatusLines(visit.currentStatus, lang);
    if (statusLines.length) {
      lines.push("");
      lines.push("Current status:");
      lines.push(...statusLines);
    }

    if (visit.otherDetails) lines.push(`Other details: ${visit.otherDetails}`);
    if (medicationsSupplements) lines.push(`Meds/supplements: ${medicationsSupplements}`);
    if (knownConditions) lines.push(`Known conditions (vet-diagnosed): ${knownConditions}`);
    if (recentTests) lines.push(`Recent tests/results: ${recentTests}`);
    if (visit.previousTreatment) lines.push(`Previous treatment: ${visit.previousTreatment}`);
    if (visit.questionsVet) lines.push(`Questions for the vet: ${visit.questionsVet}`);

    const patientLines = patientInfoLines(pet, lang);
    if (patientLines.length) {
      lines.push("");
      lines.push("About the patient:");
      lines.push(...patientLines);
    }

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

function describeAttachments(attachments: Attachment[], lang: Lang): string {
  const counts: Record<AttachmentType, number> = { photo: 0, video: 0, audio: 0 };
  for (const a of attachments) counts[a.type]++;

  const parts: string[] = [];
  if (counts.photo) {
    parts.push(lang === "da" ? `${counts.photo} foto${counts.photo > 1 ? "s" : ""}` : `${counts.photo} photo${counts.photo > 1 ? "s" : ""}`);
  }
  if (counts.video) {
    parts.push(lang === "da" ? `${counts.video} video${counts.video > 1 ? "er" : ""}` : `${counts.video} video${counts.video > 1 ? "s" : ""}`);
  }
  if (counts.audio) {
    parts.push(
      lang === "da"
        ? `${counts.audio} lydoptagelse${counts.audio > 1 ? "r" : ""}`
        : `${counts.audio} audio recording${counts.audio > 1 ? "s" : ""}`
    );
  }
  return parts.join(", ");
}

// Used as both the email/share subject (the "title" field passed to
// navigator.share) and the heading line of the body text, so a vet or
// clinic staff member can tell what it's about at a glance.
function buildEmailTitle(pet: Pet, visit: Visit, lang: Lang): string {
  if (lang === "da") {
    return visit.visitDate
      ? `Vedrørende ${pet.name}s besøg i klinikken den ${visit.visitDate}`
      : `Vedrørende ${pet.name}s besøg i klinikken`;
  }
  return visit.visitDate
    ? `Regarding ${pet.name}'s clinic visit on ${visit.visitDate}`
    : `Regarding ${pet.name}'s clinic visit`;
}

// Short cover-note text used when the PDF is actually going out as a real
// attachment in this share — the PDF already carries the full detail, so the
// email body just needs to say what's attached instead of repeating it all.
function buildShortShareText(params: { visit: Visit; pet: Pet; lang: Lang }, attachmentsIncluded: Attachment[]): string {
  const { visit, pet, lang } = params;
  const attachmentsDesc = describeAttachments(attachmentsIncluded, lang);

  if (lang === "da") {
    const attachedList = ["PDF-oversigt", attachmentsDesc].filter(Boolean).join(" + ");
    return [
      buildEmailTitle(pet, visit, lang),
      `Pause First™ – forberedelse til dyrlægebesøg`,
      `Dyr: ${pet.name}`,
      `Dato: ${visit.visitDate || "(ingen dato)"}`,
      "",
      `Vedhæftet: ${attachedList}.`,
      "",
      "Se den vedhæftede PDF for alle detaljer (patientinfo, hovedbekymring, status m.m.).",
      "Ikke medicinsk rådgivning."
    ].join("\n");
  }

  const attachedList = ["PDF summary", attachmentsDesc].filter(Boolean).join(" + ");
  return [
    buildEmailTitle(pet, visit, lang),
    `Pause First™ – vet visit preparation`,
    `Pet: ${pet.name}`,
    `Date: ${visit.visitDate || "(no date)"}`,
    "",
    `Attached: ${attachedList}.`,
    "",
    "See the attached PDF for full details (patient info, main concern, status, etc).",
    "Not medical advice."
  ].join("\n");
}

async function renderDocumentPdf(params: { visit: Visit; pet: Pet }): Promise<{ pdf: jsPDF; fileName: string }> {
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

  return { pdf, fileName };
}

export async function exportToPDF(params: {
  visit: Visit;
  pet: Pet;
  note: VisitNote | null;
  lang: Lang;
}) {
  const { pdf, fileName } = await renderDocumentPdf(params);
  pdf.save(fileName);
}

async function generatePdfFile(params: { visit: Visit; pet: Pet }): Promise<File | null> {
  try {
    const { pdf, fileName } = await renderDocumentPdf(params);
    const blob = pdf.output("blob");
    return new File([blob], fileName, { type: "application/pdf" });
  } catch (e) {
    console.error("Failed to generate PDF for sharing", e);
    return null;
  }
}

function filenameFromAttachmentUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname.split("/o/")[1];
    if (!path) return null;
    const objectName = decodeURIComponent(path).split("/").pop() ?? "";
    const parts = objectName.split("-");
    // Stored as "{timestamp}-{random}-{originalFilename}"
    return parts.length >= 3 ? parts.slice(2).join("-") : objectName || null;
  } catch {
    return null;
  }
}

function fallbackMimeType(type: AttachmentType): string {
  if (type === "photo") return "image/jpeg";
  if (type === "video") return "video/mp4";
  return "audio/mp4";
}

async function attachmentToFile(attachment: Attachment, index: number): Promise<File | null> {
  try {
    const res = await fetch(attachment.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const fallbackExt = attachment.type === "photo" ? "jpg" : attachment.type === "video" ? "mp4" : "m4a";
    const name = filenameFromAttachmentUrl(attachment.url) ?? `${attachment.type}-${index + 1}.${fallbackExt}`;
    // Android Chrome's Web Share API rejects the whole file list if any file
    // has an empty/generic MIME type, which happens when Storage doesn't
    // report one — always fall back to a real, specific type.
    const type = blob.type && blob.type !== "application/octet-stream" ? blob.type : fallbackMimeType(attachment.type);
    return new File([blob], name, { type });
  } catch (e) {
    console.error("Failed to fetch attachment for sharing (likely a Storage CORS config issue)", e);
    return null;
  }
}

async function attachmentsToFiles(
  attachments: Attachment[]
): Promise<{ files: File[]; succeeded: Attachment[]; failedCount: number }> {
  const results = await Promise.all(attachments.map((a, i) => attachmentToFile(a, i)));
  const files: File[] = [];
  const succeeded: Attachment[] = [];
  results.forEach((f, i) => {
    if (f) {
      files.push(f);
      succeeded.push(attachments[i]);
    }
  });
  return { files, succeeded, failedCount: attachments.length - files.length };
}

function downloadFiles(files: File[]) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export async function shareWithVet(params: {
  visit: Visit;
  pet: Pet;
  note: VisitNote | null;
  lang: Lang;
}) {
  const { visit, pet, note, lang } = params;
  const fullText = buildShareText(params);
  const emailTitle = buildEmailTitle(pet, visit, lang);

  const attachments = [...(visit.attachments ?? []), ...(note?.attachments ?? [])];
  const [pdfFile, attachmentResult] = await Promise.all([
    generatePdfFile({ visit, pet }),
    attachments.length
      ? attachmentsToFiles(attachments)
      : Promise.resolve({ files: [] as File[], succeeded: [] as Attachment[], failedCount: 0 })
  ]);

  const { files: attachmentFiles, succeeded: succeededAttachments, failedCount } = attachmentResult;
  const files = pdfFile ? [pdfFile, ...attachmentFiles] : attachmentFiles;

  const pdfWarning = !pdfFile
    ? lang === "da"
      ? " (PDF'en kunne ikke oprettes — se browserkonsollen for detaljer.)"
      : " (The PDF couldn't be generated — check the browser console for details.)"
    : "";

  const attachmentWarning =
    (failedCount
      ? lang === "da"
        ? ` (${failedCount} fil(er) kunne ikke inkluderes — se browserkonsollen for detaljer.)`
        : ` (${failedCount} file(s) couldn't be included — check the browser console for details.)`
      : "") + pdfWarning;

  const nav: any = navigator;
  const canShare = (candidateFiles: File[]) =>
    candidateFiles.length > 0 && typeof nav.canShare === "function" && nav.canShare({ files: candidateFiles });

  // Wraps navigator.share so a real failure (e.g. iOS Safari rejecting the
  // call because too much time passed between the tap and the share — which
  // can happen while we're generating the PDF/fetching attachments — falls
  // through to the next tier below instead of surfacing a raw error. A user
  // deliberately closing the share sheet (AbortError) is left alone either way.
  const attemptShare = async (payload: { title: string; text: string; files?: File[] }): Promise<"shared" | "cancelled" | "failed"> => {
    try {
      await nav.share(payload);
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
      console.error("navigator.share failed", e);
      return "failed";
    }
  };

  // Mobile share sheet, with every file attached if the device supports it.
  // The PDF already carries every detail, so the body text is just a short
  // cover note describing what's attached rather than repeating it all.
  if (nav.share && canShare(files)) {
    const shortText = pdfFile
      ? buildShortShareText({ visit, pet, lang }, succeededAttachments)
      : fullText;
    const result = await attemptShare({ title: emailTitle, text: shortText, files });
    if (result === "shared") {
      if (failedCount) alert((lang === "da" ? "Delt." : "Shared.") + attachmentWarning);
      return;
    }
    if (result === "cancelled") return;
    // "failed" -> fall through and try a smaller share instead of giving up
  }

  // Some browsers reject sharing multiple files together (e.g. a mix of PDF +
  // video/audio) but will happily share the PDF alone — fall back to that and
  // download the rest for manual attaching, instead of giving up on native
  // sharing entirely.
  if (nav.share && pdfFile && canShare([pdfFile])) {
    const shortText = buildShortShareText({ visit, pet, lang }, []);
    const result = await attemptShare({ title: emailTitle, text: shortText, files: [pdfFile] });
    if (result === "shared") {
      if (attachmentFiles.length) {
        downloadFiles(attachmentFiles);
        alert(
          (lang === "da"
            ? `PDF'en blev delt. Din enhed kan ikke dele flere filer på én gang, så ${attachmentFiles.length} vedhæftning(er) downloades separat — vedhæft dem manuelt.`
            : `Shared the PDF. Your device can't share multiple files at once, so ${attachmentFiles.length} attachment(s) are downloading separately — attach them manually.`) +
            attachmentWarning
        );
      } else if (failedCount) {
        alert((lang === "da" ? "PDF'en blev delt." : "Shared the PDF.") + attachmentWarning);
      }
      return;
    }
    if (result === "cancelled") return;
  }

  if (nav.share) {
    // No files are going out with this share, so use the full text — it's
    // the only copy of the detail the recipient will get unless the
    // downloaded files below get attached manually.
    const result = await attemptShare({ title: emailTitle, text: fullText });
    if (result === "shared") {
      if (files.length) {
        alert(
          (lang === "da"
            ? "Teksten blev delt. Din enhed understøtter ikke deling af filer her — de downloades nu, så du kan vedhæfte dem manuelt."
            : "Shared the text. Your device doesn't support sharing files this way — downloading them now so you can attach them manually.") +
            attachmentWarning
        );
        downloadFiles(files);
      } else if (failedCount) {
        alert((lang === "da" ? "Teksten blev delt." : "Shared the text.") + attachmentWarning);
      }
      return;
    }
    if (result === "cancelled") return;
  }

  // Desktop fallback: copy text, download any attachments for manual attaching
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(fullText);
    if (files.length) {
      downloadFiles(files);
      alert(
        (lang === "da"
          ? `Teksten er kopieret. ${files.length} fil(er) downloades — vedhæft dem til din e-mail.`
          : `Text copied. ${files.length} file(s) are downloading — attach them to your email.`) + attachmentWarning
      );
    } else {
      alert(
        (lang === "da"
          ? "Teksten er kopieret. Du kan indsætte den i en e-mail til din dyrlæge."
          : "Copied to clipboard. You can paste it into an email to your vet.") + attachmentWarning
      );
    }
    return;
  }

  // Last resort
  if (files.length) downloadFiles(files);
  alert(fullText);
}
