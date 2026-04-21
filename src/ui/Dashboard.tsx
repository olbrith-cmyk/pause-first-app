import { logOut } from "../auth";
import { deleteUserAccount } from "../firestore";
import { EmergencyGuide, MedicalDisclaimer, PrivacyPolicy } from "./Modals";
import { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";

import PetsScreen from "./PetsScreen";
import VisitsScreen from "./VisitsScreen";
import type { Mode } from "./VisitsScreen";

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
  const [showPrivacy, setShowPrivacy] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "pets" as const, label: t.myPets },
      { id: "myVisits" as const, label: (t as any).myVisits ?? "My Visits" },
      { id: "prepare" as const, label: t.prepareVisit },
      { id: "notes" as const, label: t.visitNotes },
      { id: "document" as const, label: t.viewDocument }
    ],
    [t]
  );

  const handleDeleteAccount = async () => {
    const ok = confirm(
      "Are you sure? This will permanently delete your account and all your data."
    );
    if (!ok) return;

    try {
      await deleteUserAccount(userId);
      alert("Account deleted successfully.");
      await logOut();
    } catch (error: any) {
      const message = 
