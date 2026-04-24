import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit } from "../firestore";
import { addVisit, getUserPets } from "../firestore";

type Props = {
  lang: Lang;
  userId: string;
  onCancel: () => void;
  onComplete: () => void;
};

export default function PrepareWizard({ lang, userId, onCancel, onComplete }: Props) {
  const t = useTranslation(lang);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [petSaveMode, setPetSaveMode] = useState<"new" | "existing" | "unassigned" | null>(null);

  const [petName, setPetName] = useState("");

  const [draft, setDraft] = useState<Visit>({
    userId,
    petId: "",
    visitDate: "",
    mainConcern: "",
    whenStart: "",
    howProgressing: "",
    patterns: "",
    associatedSigns: "",
    previousTreatment: "",
    questionsVet: ""
  });

  useEffect(() => {
    const loadPets = async () => {
      const list = await getUserPets(userId);
      setPets(list);
    };
    loadPets();
  }, [userId]);

  return (
    <div>Wizard placeholder</div>
  );
}
