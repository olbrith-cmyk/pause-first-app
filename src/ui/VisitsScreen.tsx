import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { useTranslation } from "../i18n";
import type { Pet, Visit, VisitNote } from "../firestore";
import {
  addVisit,
  addVisitNote,
  deleteVisit,
  getUserPets,
  getUserVisits,
  getVisitNote,
  updateVisit,
  updateVisitNote
} from "../firestore";
import { ViewOnlyPrepare } from "./ViewOnlyPrepare";
import { ViewOnlyNotes } from "./ViewOnlyNotes";

type Mode = "prepare" | "notes" | "document";

const emptyVisit = (userId: string): Visit => ({
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

const emptyNote = (userId: string, visitId: string): VisitNote => ({
  userId,
  visitId,
  vetName: "",
  diagnosis: "",
  testsPerformed: "",
  treatmentMeds: "",
  homeInstructions: "",
  followUp: ""
});

export default function VisitsScreen({
  lang,
  userId,
  mode
}: {
  lang: Lang;
  userId: string;
  mode: Mode;
}) {
  const t = useTranslation(lang);

  const [pets, setPets] = useState<Pet[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [editing, setEditing] = useState<Visit>(emptyVisit(userId));
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VisitNote | null>(null);
  const [loadedNote, setLoadedNote] = useState<VisitNote | null>(null);
  const [prepMode, setPrepMode] = useState<"view" | "edit">("view");
  const [notesMode, setNotesMode] = useState<"view" | "edit">("view");

  const load = async () => {
    const [p, v] = await Promise.all([getUserPets(userId), getUserVisits(userId)]);
    setPets(p);
    setVisits(v);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const selectedVisit = useMemo(() => {
    return selectedVisitId ? visits.find((v) => v.id === selectedVisitId) ?? null : null;
  }, [selectedVisitId, visits]);

  const selectedPet = useMemo(() => {
    return selectedVisit ? pets.find((p) => p.id === selectedVisit.petId) ?? null : null;
  }, [selectedVisit, pets]);

  const save = async () => {
    if (!editing.petId) return alert("Pick a pet first");
    try {
      if (
