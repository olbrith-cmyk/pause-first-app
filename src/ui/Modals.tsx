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
  
export function PrivacyPolicy({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = useTranslation(lang);

  if (lang === "da") {
    return (
      <ModalShell title="Privatlivspolitik" onClose={onClose}>
        <p className="muted">Senest opdateret: Juli 2026</p>

        <h3>1. Introduktion</h3>
        <p>
          Pause First™ ("vi," "os," eller "vores") er forpligtet til at beskytte dit privatliv.
          Denne privatlivspolitik forklarer, hvordan vi indsamler, bruger og beskytter dine
          oplysninger, når du bruger vores webapplikation ("Tjenesten").
        </p>
        <p>
          Pause First™ er en del af <strong>Cykeldyrlægen</strong>.
        </p>

        <h3>2. Oplysninger Vi Indsamler</h3>
        <p><strong>Oplysninger du giver direkte:</strong></p>
        <ul className="list">
          <li>Kontooplysninger (navn, e-mailadresse, adgangskode)</li>
          <li>Kæledyrsoplysninger (kæledyrets navn, art og andre detaljer du vælger at tilføje)</li>
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

        <h3>3. Hvordan Vi Bruger Dine Oplysninger</h3>
        <ul className="list">
          <li>For at oprette og vedligeholde din konto</li>
          <li>For at gemme og organisere dine kæledyrsoplysninger og besøgsnoter</li>
          <li>For at hjælpe dig med at forberede dig til dyrlægebesøg</li>
          <li>For at forbedre tjenesten og løse problemer</li>
          <li>For at overholde juridiske forpligtelser</li>
        </ul>

        <h3>4. Hvad Vi IKKE Gør</h3>
        <ul className="list">
          <li>Vi sælger ikke dine data</li>
          <li>Vi deler ikke dine data med tredjeparter til marketing eller annoncering</li>
        </ul>

        <h3>5. Datalagring & Sikkerhed</h3>
        <p>
          Dine oplysninger lagres ved hjælp af <strong>Firebase</strong> (Google Cloud
          infrastruktur), herunder Firebase Authentication og Firestore. Vi bruger kryptering under
          transmission (SSL/TLS) og adgangskontroller (sikkerhedsregler) designet til at begrænse
          adgangen til dine egne data.
        </p>

        <h3>6. Dine Rettigheder</h3>
        <p>
          Du kan få adgang til, rette eller slette dine data når som helst. For at anmode om hjælp,
          kontakt: <strong>info@pausefirstmethod.com</strong>.
        </p>

        <h3>7. Dataopbevaring</h3>
        <p>
          Dine data opbevares, så længe din konto er aktiv. Hvis du sletter din konto, fjerner vi
          dine data fra vores systemer inden for 30 dage (underlagt tekniske og juridiske krav).
        </p>

        <h3>8. Tredjepartstjenester</h3>
        <p>
          Vi bruger Firebase (af Google) til autentificering og datalagring. Googles
          privatlivspraksis er beskrevet her:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            https://policies.google.com/privacy
          </a>
        </p>
        <p>
          Tjenesten hostes via <strong>Vercel</strong> og <strong>Netlify</strong>, som i kraft af
          hostingen kan behandle grundlæggende tekniske oplysninger (fx IP-adresse og server-logs).
          Deres privatlivspolitikker er tilgængelige her:{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
            vercel.com/legal/privacy-policy
          </a>{" "}
          og{" "}
          <a href="https://www.netlify.com/privacy/" target="_blank" rel="noreferrer">
            netlify.com/privacy
          </a>
          .
        </p>
        <p>
          Appen har også en valgfri funktion, <strong>"Pause First AI-assistent"</strong>, som
          åbner en brugerdefineret GPT hostet på OpenAIs ChatGPT-platform i en ny fane. Denne
          funktion er helt valgfri — vi sender dig kun derhen, hvis du selv vælger at åbne den, og
          alt hvad du skriver der, behandles af OpenAI og ikke af Pause First™. OpenAIs
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
        Pause First™ ("we," "us," or "our") is committed to protecting your privacy. This Privacy
        Policy explains how we collect, use, and safeguard your information when you use our web
        application (the "Service").
      </p>
      <p>
        Pause First™ is part of <strong>Cykeldyrlægen</strong>.
      </p>

      <h3>2. Information We Collect</h3>
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

      <h3>3. How We Use Your Information</h3>
      <ul className="list">
        <li>To create and maintain your account</li>
        <li>To store and organize your pet's information and visit notes</li>
        <li>To help you prepare for veterinary visits</li>
        <li>To improve the Service and fix issues</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h3>4. What We Do NOT Do</h3>
      <ul className="list">
        <li>We do not sell your data</li>
        <li>We do not share your data with third parties for marketing/advertising</li>
      </ul>

      <h3>5. Data Storage & Security</h3>
      <p>
        Your information is stored using <strong>Firebase</strong> (Google Cloud infrastructure),
        including Firebase Authentication and Firestore. We use encryption in transit (SSL/TLS) and
        access controls (security rules) designed to limit access to your own data.
      </p>

      <h3>6. Your Rights</h3>
      <p>
        You can access, correct, or delete your data at any time. To request help, contact:
        <strong> info@pausefirstmethod.com</strong>.
      </p>

      <h3>7. Data Retention</h3>
      <p>
        Your data is kept as long as your account is active. If you delete your account, we remove
        your data from our systems within 30 days (subject to technical and legal requirements).
      </p>

      <h3>8. Third-Party Services</h3>
      <p>
        We use Firebase (by Google) for authentication and data storage. Google's privacy
        practices are described here:{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          https://policies.google.com/privacy
        </a>
      </p>
      <p>
        The Service is hosted via <strong>Vercel</strong> and <strong>Netlify</strong>, which as
        part of providing hosting infrastructure may process basic technical information (such as
        IP address and server logs). Their privacy policies are available here:{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          vercel.com/legal/privacy-policy
        </a>{" "}
        and{" "}
        <a href="https://www.netlify.com/privacy/" target="_blank" rel="noreferrer">
          netlify.com/privacy
        </a>
        .
      </p>
      <p>
        The app also has an optional <strong>"Pause First AI Assistant"</strong> feature that
        opens a custom GPT hosted on OpenAI's ChatGPT platform in a new tab. This feature is
        entirely optional — we only send you there if you choose to open it, and anything you
        type there is processed by OpenAI, not by Pause First™. OpenAI's privacy practices are
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
