import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type {
  Pet,
  Visit,
  VisitNote,
  PetMedicationItem,
  PetVaccineItem,
  PetPreventativeItem
} from "../firestore";
import { addPet, deletePet, getUserPets, updatePet, getUserVisits, getVisitNote } from "../firestore";
import { ViewOnlyPet } from "./ViewOnlyPet";
import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
import { ViewOnlyNotes } from "./ViewOnlyNotes";
import PrepareWizard from "./PrepareWizard";

const emptyPet = (userId: string): Pet => ({
  userId,
  name: "",
  species: "",
  age: "", // legacy (not shown)
  breedType: "",
  dateOfBirth: "",
  sex: "",
  neuteredStatus: "",
  weight: "",
  microchip: "",
  allergies: "",
  medications: "", // legacy (not shown)
  diet: "",
  medsSupplements: [],
  vaccinations: [],
  preventativesList: [],
  clinic: "",
  emergencyContact: "",
  notes: ""
});

const blankMed = (): PetMedicationItem => ({
  name: "",
  dose: "",
  howOften: "",
  notes: "",
  unsureDose: false
});

const blankVaccine = (): PetVaccineItem => ({
  vaccine: "",
  dateGiven: "",
  notes: "",
  unsureName: false
});

const blankPreventative = (): PetPreventativeItem => ({
  type: "",
  productName: "",
  howOften: "",
  lastGiven: "",
  notes: ""
});

export default function PetsScreen({
  lang,
  userId,
  onFirstPetSaved
}: {
  lang: Lang;
  userId: string;
  onFirstPetSaved?: () => void;
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selected, setSelected] = useState<Pet | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editing, setEditing] = useState<Pet>(emptyPet(userId));

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isFirstPet, setIsFirstPet] = useState(false);

  // Wizard + visit viewing
  const [showWizard, setShowWizard] = useState(false);
  const [viewingVisit, setViewingVisit] = useState<Visit | null>(null);
  const [viewingVisitNote, setViewingVisitNote] = useState<VisitNote | null>(null);

  const load = async () => {
    const [petList, visitList] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(petList);
    setVisits(visitList);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
