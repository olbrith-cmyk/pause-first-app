import { useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

function ModalShell({
  title,
  children,
  onClose
}: {
  title: string;
  children: any;
  onClose: () => void;
}) {
  return (
    <div className="modalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">{title}</h2>
          <button className="modalClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

export function EmergencyGuide({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  if (lang === "da") {
    return (
      <ModalShell title={t.emergencyGuide} onClose={onClose}>
        <div className="alert alertInfo">
          Pause First™ er et forberedelsesværktøj til ikke-akutte dyrlægebesøg. Det hjælper dig med
          at organisere oplysninger om symptomer, der er opstået gradvist eller virker milde. Stol
          altid på din mavefornemmelse — er du i tvivl, så ring til din dyrlæge eller nærmeste
          akutklinik med det samme.
        </div>

        <h3>Almindelige tegn på en veterinær nødsituation</h3>
        <ul className="list">
          <li>
            <strong>Vejrtrækningsbesvær eller kvælning</strong> — Anstrengt, overfladisk eller hurtig
            vejrtrækning
          </li>
          <li>
            <strong>Bevidstløshed eller kollaps</strong> — Manglende reaktion eller pludseligt fald
          </li>
          <li>
            <strong>Alvorligt traume</strong> — Påkørsel, dybe sår eller andre større skader
          </li>
          <li>
            <strong>Manglende evne til at lade vandet eller afføre sig</strong> — Presser uden
            resultat
          </li>
          <li>
            <strong>Mistanke om forgiftning</strong> — Kendt indtagelse af giftige stoffer
          </li>
          <li>
            <strong>Ukontrolleret opkastning eller diarré med blod</strong> — Vedvarende eller
            blodigt opkast/afføring
          </li>
          <li>
            <strong>Øjenskade eller pludseligt øjenproblem</strong> — Sammenknebne øjne, poter mod
            øjet, rødme, hævelse, udflod, uklart/blåligt udseende
          </li>
          <li>
            <strong>Tegn på svær smerte</strong> — Klynken, aggression eller manglende evne til at
            bevæge sig
          </li>
          <li>
            <strong>Blege eller blålige tandkød</strong> — Dårlig blodcirkulation eller åndenød
          </li>
          <li>
            <strong>Symptomer på hedeslag</strong> — Kraftig savlen, hurtig vejrtrækning eller
            sløvhed
          </li>
          <li>
            <strong>Manglende evne til at bevæge sig eller lammelse</strong> — Tab af førlighed
            eller koordination
          </li>
          <li>
            <strong>Krampeanfald</strong> — Ukontrollerede kramper eller muskelspasmer
          </li>
        </ul>

        <p className="alert alertInfo">
          Er du i tvivl, så kontakt din dyrlæge eller nærmeste akutklinik med det samme.
        </p>

        <div className="row">
          <button className="btn btnSecondary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={t.emergencyGuide} onClose={onClose}>
      <div className="alert alertInfo">
        Pause First™ is a preparation tool for non-emergency vet visits. It helps you organize
        information about symptoms that started gradually or seem mild. Always trust your instincts
        — when in doubt, call your vet or the nearest emergency clinic immediately.
      </div>

      <h3>Common Signs of a Veterinary Emergency</h3>
      <ul className="list">
        <li>
          <strong>Difficulty breathing or choking</strong> — Labored, shallow, or rapid breathing
        </li>
        <li>
          <strong>Loss of consciousness or collapse</strong> — Unresponsiveness or sudden falling
        </li>
        <li>
          <strong>Severe trauma</strong> — Hit by car, deep wounds, or major injuries
        </li>
        <li>
          <strong>Inability to urinate or defecate</strong> — Straining without producing waste
        </li>
        <li>
          <strong>Suspected poisoning or toxin exposure</strong> — Known ingestion of toxic substances
        </li>
        <li>
          <strong>Uncontrollable vomiting or diarrhea with blood</strong> — Persistent or bloody discharge
        </li>
        <li>
          <strong>Eye injury or sudden eye problem</strong> — Squinting, pawing, redness, swelling,
          discharge, cloudy/blue appearance
        </li>
        <li>
          <strong>Signs of severe pain</strong> — Whimpering, aggression, or inability to move
        </li>
        <li>
          <strong>Pale or blue gums</strong> — Poor circulation or respiratory distress
        </li>
        <li>
          <strong>Heat stroke symptoms</strong> — Excessive drooling, panting, or lethargy
        </li>
        <li>
          <strong>Inability to move or paralysis</strong> — Loss of limb function or coordination
        </li>
        <li>
          <strong>Seizures</strong> — Uncontrolled convulsions or muscle spasms
        </li>
      </ul>

      <p className="alert alertInfo">
        When in doubt, contact your vet or the nearest emergency clinic immediately.
      </p>

      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </ModalShell>
  );
}

export function MedicalDisclaimer({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  if (lang === "da") {
    return (
      <ModalShell title={t.medicalDisclaimer} onClose={onClose}>
        <p>
          Pause First™ er udelukkende et forberedelsesværktøj — ikke en erstatning for
          dyrlægefaglig rådgivning. Kontakt altid din dyrlæge. Ved akutte tilfælde, kontakt din
          dyrlæge eller dyreklinik med det samme.
        </p>

        <div className="calloutBox">
          <p>
            Dette værktøj er designet til at hjælpe dig med at organisere dine tanker og
            observationer før et dyrlægebesøg. Det stiller ikke diagnoser, behandler ikke og
            erstatter ikke professionel dyrlægefaglig rådgivning, diagnose eller behandling.
          </p>
        </div>

        <div className="row">
          <button className="btn btnSecondary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={t.medicalDisclaimer} onClose={onClose}>
      <p>
        Pause First™ is a preparation tool only—not a substitute for veterinary advice. Always
        consult your veterinarian. In emergencies, contact your vet or animal clinic immediately.
      </p>

      <div className="calloutBox">
        <p>
          This tool is designed to help you organize your thoughts and observations before a vet
          visit. It does not diagnose, treat, or replace professional veterinary medical advice,
          diagnosis, or treatment.
        </p>
      </div>

      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </ModalShell>
  );
}

// Shown once, the first time someone taps "Pause First AI Assistant" — both
// a consent moment (the disclosure otherwise only lives in the Privacy
// Policy, easy to miss) and a heads-up that they're about to leave the app,
// so the brand switch to ChatGPT doesn't feel like a broken link.
export function AiAssistantConsent({
  lang,
  onConfirm,
  onClose
}: {
  lang: Lang;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useTranslation(lang);

  if (lang === "da") {
    return (
      <ModalShell title={t.aiAssistant} onClose={onClose}>
        <p>
          Du fortsætter nu i <strong>ChatGPT</strong> (drevet af OpenAI) i en ny fane — en
          brugerdefineret GPT sat op af Pause First™. Alt, hvad du skriver der, behandles af
          OpenAI, ikke af Pause First™, og intet fra samtalen bliver gemt.
        </p>
        <div className="row">
          <button className="btn btnSecondary" onClick={onClose}>
            {lang === "da" ? "Annuller" : "Cancel"}
          </button>
          <button className="btn btnPrimary" onClick={onConfirm}>
            {lang === "da" ? "Fortsæt til ChatGPT" : "Continue to ChatGPT"}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={t.aiAssistant} onClose={onClose}>
      <p>
        You're about to continue in <strong>ChatGPT</strong> (powered by OpenAI) in a new tab — a
        custom GPT set up by Pause First™. Anything you type there is processed by OpenAI, not by
        Pause First™, and nothing from that conversation is stored.
      </p>
      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btnPrimary" onClick={onConfirm}>
          Continue to ChatGPT
        </button>
      </div>
    </ModalShell>
  );
}

// A native window.confirm() is easy to click through on reflex (e.g. aiming
// for "Log out" and hitting "Delete Account" instead, since they sit next to
// each other in the menu) — this requires deliberately typing a confirmation
// word, so an accidental click can't finish the deletion.
export function DeleteAccountConfirm({
  lang,
  onConfirm,
  onClose
}: {
  lang: Lang;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const confirmWord = lang === "da" ? "SLET" : "DELETE";
  const canConfirm = typed.trim().toUpperCase() === confirmWord;

  const title = lang === "da" ? "Slet konto permanent?" : "Permanently delete your account?";

  return (
    <ModalShell title={title} onClose={onClose}>
      {lang === "da" ? (
        <>
          <p>
            <strong>Dette kan ikke fortrydes.</strong> Alle dine dyreprofiler, besøgsforberedelser,
            noter og eventuelle fotos/vedhæftninger slettes permanent — ikke kun log ud.
          </p>
          <p>
            Skriv <strong>{confirmWord}</strong> for at bekræfte:
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>This cannot be undone.</strong> All your animal profiles, Visit Briefs, notes,
            and any photos/attachments will be permanently deleted — not just signed out.
          </p>
          <p>
            Type <strong>{confirmWord}</strong> to confirm:
          </p>
        </>
      )}

      <input
        className="input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={confirmWord}
        autoFocus
      />

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btnSecondary" onClick={onClose}>
          {lang === "da" ? "Annuller" : "Cancel"}
        </button>
        <button className="btn btnDanger" onClick={onConfirm} disabled={!canConfirm}>
          {lang === "da" ? "Slet alt permanent" : "Permanently delete everything"}
        </button>
      </div>
    </ModalShell>
  );
}

export function PrivacyPolicy({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  if (lang === "da") {
    return (
      <ModalShell title="Privatlivspolitik" onClose={onClose}>
        <p className="muted">Senest opdateret: Juli 2026</p>

        <h3>1. Introduktion</h3>
        <p>
          Pause First™ er forpligtet til at beskytte dit privatliv. Denne privatlivspolitik
          forklarer, hvordan Pause First™ indsamler, bruger og beskytter dine oplysninger, når du
          bruger webapplikationen ("Tjenesten").
        </p>
        <p>
          Pause First™ er en del af <strong>Cykeldyrlægen</strong>.
        </p>

        <h3>2. Indsamlede Oplysninger</h3>
        <p><strong>Oplysninger du giver direkte:</strong></p>
        <ul className="list">
          <li>Kontooplysninger (navn, e-mailadresse, adgangskode)</li>
          <li>Dyreoplysninger (dyrets navn, art og andre detaljer du vælger at tilføje)</li>
          <li>
            Sundhedsoplysninger du indtaster (symptomer, forberedelsesnoter, besøgsnoter, diagnoser,
            medicin, behandlingsnoter)
          </li>
        </ul>

        <p><strong>Oplysninger indsamlet automatisk:</strong></p>
        <ul className="list">
          <li>Grundlæggende enhed- og browseroplysninger</li>
          <li>Grundlæggende brugsdata, der er nødvendig for at drive og forbedre tjenesten</li>
        </ul>

        <h3>3. Sådan Bruges Dine Oplysninger</h3>
        <ul className="list">
          <li>For at oprette og vedligeholde din konto</li>
          <li>For at gemme og organisere dine dyreoplysninger og besøgsnoter</li>
          <li>For at hjælpe dig med at forberede dig til dyrlægebesøg</li>
          <li>For at forbedre tjenesten og løse problemer</li>
          <li>For at overholde juridiske forpligtelser</li>
        </ul>

        <h3>4. Hvad Pause First™ IKKE Gør</h3>
        <ul className="list">
          <li>Dine data sælges ikke</li>
          <li>Dine data deles ikke med tredjeparter til marketing eller annoncering</li>
        </ul>

        <h3>5. Datalagring & Sikkerhed</h3>
        <p>
          Dine oplysninger lagres ved hjælp af <strong>Firebase</strong> (Google Cloud
          infrastruktur), herunder Firebase Authentication og Firestore. Der bruges kryptering
          under transmission (SSL/TLS) og adgangskontroller (sikkerhedsregler) designet til at
          begrænse adgangen til dine egne data.
        </p>

        <h3>6. Dine Rettigheder</h3>
        <p>
          Du kan få adgang til, rette eller slette dine data når som helst. For at anmode om hjælp,
          kontakt: <strong>info@pausefirstmethod.com</strong>.
        </p>

        <h3>7. Dataopbevaring</h3>
        <p>
          Dine data opbevares, så længe din konto er aktiv. Hvis du sletter din konto, fjernes dine
          data fra systemerne inden for 30 dage (underlagt tekniske og juridiske krav).
        </p>

        <h3>8. Tredjepartstjenester</h3>
        <p>
          Firebase (af Google) bruges til autentificering og datalagring. Googles
          privatlivspraksis er beskrevet her:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            https://policies.google.com/privacy
          </a>
        </p>
        <p>
          Tjenesten hostes via <strong>Vercel</strong>, som i kraft af hostingen kan behandle
          grundlæggende tekniske oplysninger (fx IP-adresse og server-logs). Vercels
          privatlivspolitik er tilgængelig her:{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
            vercel.com/legal/privacy-policy
          </a>
          .
        </p>
        <p>
          Appen har også en valgfri funktion, <strong>"Pause First AI-assistent"</strong>, som
          åbner en brugerdefineret GPT hostet på OpenAIs ChatGPT-platform i en ny fane. Denne
          funktion er helt valgfri — den åbnes kun, hvis du selv vælger det, og alt hvad du
          skriver der, behandles af OpenAI og ikke af Pause First™. OpenAIs
          privatlivspraksis er beskrevet her:{" "}
          <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer">
            openai.com/policies/privacy-policy
          </a>
          .
        </p>

        <h3>9. Kontaktoplysninger</h3>
        <p>
          <strong>Pause First™</strong> (del af Cykeldyrlægen v/Ólbrith Hansen)
          <br />
          Halgreensgade 13
          <br />
          2300 København S
          <br />
          Danmark
        </p>
        <p>
          E-mail: <strong>info@pausefirstmethod.com</strong>
          <br />
          Websted: <strong>www.pausefirstmethod.com</strong>
          <br />
          CVR nr. <strong>43902067</strong>
        </p>

        <p className="muted">
          GDPR-note: Hvis du er i EU, kan du have yderligere rettigheder under GDPR, herunder
          retten til at indgive en klage til din lokale databeskyttelsesmyndighed.
        </p>

        <div className="row">
          <button className="btn btnSecondary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </ModalShell>
    );
  }

  // English version (default)
  return (
    <ModalShell title="Privacy Policy" onClose={onClose}>
      <p className="muted">Last Updated: July 2026</p>

      <h3>1. Introduction</h3>
      <p>
        Pause First™ is committed to protecting your privacy. This Privacy Policy explains how
        Pause First™ collects, uses, and safeguards your information when you use the web
        application (the "Service").
      </p>
      <p>
        Pause First™ is part of <strong>Cykeldyrlægen</strong>.
      </p>

      <h3>2. Information Collected</h3>
      <p><strong>Information you provide directly:</strong></p>
      <ul className="list">
        <li>Account information (name, email address, password)</li>
        <li>Pet information (pet name, species, and other details you choose to add)</li>
        <li>
          Health information you enter (symptoms, preparation notes, visit notes, diagnoses,
          medications, treatment notes)
        </li>
      </ul>

      <p><strong>Information collected automatically:</strong></p>
      <ul className="list">
        <li>Basic device and browser information</li>
        <li>Basic usage data needed to operate and improve the Service</li>
      </ul>

      <h3>3. How Your Information Is Used</h3>
      <ul className="list">
        <li>To create and maintain your account</li>
        <li>To store and organize your pet's information and visit notes</li>
        <li>To help you prepare for veterinary visits</li>
        <li>To improve the Service and fix issues</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h3>4. What Pause First™ Does NOT Do</h3>
      <ul className="list">
        <li>Your data is not sold</li>
        <li>Your data is not shared with third parties for marketing/advertising</li>
      </ul>

      <h3>5. Data Storage & Security</h3>
      <p>
        Your information is stored using <strong>Firebase</strong> (Google Cloud infrastructure),
        including Firebase Authentication and Firestore. Encryption in transit (SSL/TLS) and
        access controls (security rules) are used, designed to limit access to your own data.
      </p>

      <h3>6. Your Rights</h3>
      <p>
        You can access, correct, or delete your data at any time. To request help, contact:
        <strong> info@pausefirstmethod.com</strong>.
      </p>

      <h3>7. Data Retention</h3>
      <p>
        Your data is kept as long as your account is active. If you delete your account, your data
        is removed from the systems within 30 days (subject to technical and legal requirements).
      </p>

      <h3>8. Third-Party Services</h3>
      <p>
        Firebase (by Google) is used for authentication and data storage. Google's privacy
        practices are described here:{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          https://policies.google.com/privacy
        </a>
      </p>
      <p>
        The Service is hosted via <strong>Vercel</strong>, which as part of providing hosting
        infrastructure may process basic technical information (such as IP address and server
        logs). Vercel's privacy policy is available here:{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          vercel.com/legal/privacy-policy
        </a>
        .
      </p>
      <p>
        The app also has an optional <strong>"Pause First AI Assistant"</strong> feature that
        opens a custom GPT hosted on OpenAI's ChatGPT platform in a new tab. This feature is
        entirely optional — it only opens if you choose to open it, and anything you type there
        is processed by OpenAI, not by Pause First™. OpenAI's privacy practices are
        described here:{" "}
        <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer">
          openai.com/policies/privacy-policy
        </a>
        .
      </p>

      <h3>9. Contact Details</h3>
      <p>
        <strong>Pause First™</strong> (part of Cykeldyrlægen v/Ólbrith Hansen)
        <br />
        Halgreensgade 13
        <br />
        2300 København S
        <br />
        Denmark
      </p>
      <p>
        Email: <strong>info@pausefirstmethod.com</strong>
        <br />
        Website: <strong>www.pausefirstmethod.com</strong>
        <br />
        CVR nr. <strong>43902067</strong>
      </p>

      <p className="muted">
        GDPR note: If you are in the EU, you may have additional rights under GDPR, including the
        right to lodge a complaint with your local data protection authority.
      </p>

      <div className="row">
        <button className="btn btnSecondary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </ModalShell>
  );
}
