import { EmergencyGuide, MedicalDisclaimer } from "./Modals";
import { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";

type Tab = "pets" | "myVisits" | "prepare" | "notes" | "document";

export default function Dashboard({
  lang,
  userId,
  email
}: {
  lang: Lang;
  userId: string;
  email: string;
}) {
  const t = useTranslation(lang);
  const [tab, setTab] = useState<Tab>("pets");
  const [showEmergency, setShowEmergency] = useState(false);
const [showDisclaimer, setShowDisclaimer] = useState(false);

const tabs = useMemo(
  () => [
    { id: "pets" as const, label: t.myPets },
    { id: "myVisits" as const, label: t.myVisits ?? "My Visits" },
    { id: "prepare" as const, label: t.prepareVisit },
    { id: "notes" as const, label: t.visitNotes },
    { id: "document" as const, label: t.viewDocument }
  ],
  [t]
);

  return (
    <main className="card">
      <div className="topRow">
        <div className="row">
  <button className="btn btnSecondary" onClick={() => setShowEmergency(true)}>
    {t.emergencyGuide}
  </button>
  <button className="btn btnSecondary" onClick={() => setShowDisclaimer(true)}>
    {t.medicalDisclaimer}
  </button>
</div>
        <div className="muted">Signed in as: {email}</div>
      </div>

      <div className="tabs">
        {tabs.map((x) => (
          <button
            key={x.id}
            className={`tab ${tab === x.id ? "tabActive" : ""}`}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="panel">
        {tab === "pets" && <PetsScreen lang={lang} userId={userId} />}
{(tab === "myVisits" || tab === "prepare" || tab === "notes" || tab === "document") && (
  <VisitsScreen
    lang={lang}
    userId={userId}
    mode={tab}
    goToTab={(next) => setTab(next)}
  />
)}
      </div>
      {showEmergency && (
  <EmergencyGuide lang={lang} onClose={() => setShowEmergency(false)} />
)}
{showDisclaimer && (
  <MedicalDisclaimer lang={lang} onClose={() => setShowDisclaimer(false)} />
)}
    </main>
  );
}
