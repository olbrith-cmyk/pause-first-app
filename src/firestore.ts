import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  setDoc,
  writeBatch,
  runTransaction
} from "firebase/firestore";
import { deleteUser, getAuth } from "firebase/auth";
import { firebaseApp } from "./firebase";

const db = getFirestore(firebaseApp);

// --------------------
// Types
// --------------------

export interface PetMedicationItem {
  name: string;
  dose?: string;
  howOften?: string;
  notes?: string;
  unsureDose?: boolean;
}

export interface PetVaccineItem {
  vaccine: string;
  dateGiven?: string;
  notes?: string;
  unsureName?: boolean;
}

export interface PetPreventativeItem {
  type: string; // Flea/Tick/Deworming/etc (free text or dropdown values)
  productName?: string;
  howOften?: string;
  lastGiven?: string;
  notes?: string;
}

export interface Pet {
  id?: string;
  userId: string;

  // About your pet
  name: string;
  species: string;
  photoUrl?: string;

  // Legacy field (keep for backwards compatibility; we will stop showing it in UI)
  age: string;

  // NEW (optional) — v2 basic info
  breedType?: string;
  dateOfBirth?: string; // "DD/MM/YYYY (or approximate)"
  sex: string;
  neuteredStatus?: string; // "Neutered / Spayed / Not neutered / Not sure" (stored as string)

  // Health basics
  weight: string;
  allergies: string;

  // Legacy field (keep for backwards compatibility; we will stop showing it in UI)
  medications: string;

  diet: string;

  // NEW (optional) — structured lists
  medsSupplements?: PetMedicationItem[];
  vaccinations?: PetVaccineItem[];
  preventativesList?: PetPreventativeItem[];

  // Clinic / admin
  clinic: string;
  emergencyContact: string;

  // IDs & notes
  microchip: string;
  notes: string;

  // Existing optional snapshot fields (keep)
  vaccinationStatus?: "up_to_date" | "not_up_to_date" | "unknown";
  vaccinationLastDate?: string;

  // v1 free text (keep)
  preventatives?: string;

  surgeries?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "both"; // structured, feeds Patient Info
  lifestyle?: string; // other animals, travel, etc. (indoor/outdoor now its own field above)

  // True only for the pet pre-populated by seedDemoData for a demo account.
  // Used to allow creating new visits only for this pet in demo mode.
  isDemoSeed?: boolean;

  updatedAt?: Timestamp;
  createdAt?: Timestamp;
}

export type TriState = "normal" | "changed" | "na";

export interface CurrentStatus {
  appetite: TriState;
  appetiteNotes?: string;

  drinking: TriState;
  drinkingNotes?: string;

  energy: TriState;
  energyNotes?: string;

  toileting: TriState;
  toiletingNotes?: string;

  gi: TriState; // vomiting/diarrhea
  giNotes?: string;

  breathing: TriState; // breathing/coughing
  breathingNotes?: string;

  mobilityPain: TriState;
  mobilityPainNotes?: string;

  skinEars: TriState;
  skinEarsNotes?: string;

  otherNotes?: string;
}

export type AttachmentType = "photo" | "video" | "audio";

export interface Attachment {
  id: string; // client-generated id for UI lists
  type: AttachmentType;
  url: string; // Firebase Storage download URL
  caption?: string;
  createdAt: string; // ISO string for easy sorting/display
}

export type OrganizeMode = "private" | "ai";

export interface Visit {
  id?: string;
  userId: string;
  petId: string;

  // metadata
  visitDate: string;

  // Visit Brief (anamnesis-style) — existing fields (keep!)
  mainConcern: string;
  whenStart: string;
  howProgressing: string;
  patterns: string;
  associatedSigns: string;

  // NEW (optional) — how worried the owner is, shown next to Main Concern
  // so the vet gets an urgency signal at a glance.
  urgency?: "routine" | "concerned" | "very_worried";

  // NEW (optional) — structured duration + trend, feeds the scannable
  // headline line (chief complaint + duration + trend) at the top of the
  // Brief, instead of relying on freeform text alone.
  durationValue?: string;
  durationUnit?: "hours" | "days" | "weeks" | "months";
  trend?: "better" | "worse" | "same";

  // NEW (optional) — broad catch-all “Other details for the vet”
  otherDetails?: string;

  // NEW (optional) — severity, framed as observable impact on daily life
  // rather than a false-precision 1–10 scale.
  functionalImpact?: string;

  previousTreatment: string;
  medicationsSupplements?: string;
  questionsVet: string;

  // NEW (optional) — “How is your animal doing right now?” step
  currentStatus?: CurrentStatus;

  // NEW (optional) — paste/import support
  importText?: string;
  importOrganizedBy?: OrganizeMode;
  importOrganizedAt?: Timestamp;

  // NEW (optional) — attachments (photos/videos/audio)
  attachments?: Attachment[];

  // NEW — draft/final support
  status?: "draft" | "final";

  // NEW — derived flags for fast UI
  hasNotes?: boolean;
  notesUpdatedAt?: Timestamp;

  // True only for the visits pre-populated by seedDemoData for a demo
  // account. Used to allow PDF download / vet sharing only for these
  // visits in demo mode, not for anything created from scratch.
  isDemoSeed?: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface VisitNote {
  id?: string;
  userId: string;
  visitId: string;
  vetName: string;
  diagnosis: string;
  testsPerformed: string;
  treatmentMeds: string;
  homeInstructions: string;
  followUp: string;

  // NEW (optional) — paste/import for take-home notes
  importText?: string;
  importOrganizedBy?: OrganizeMode;
  importOrganizedAt?: Timestamp;

  // NEW (optional) — attachments (e.g., discharge sheet photo, audio)
  attachments?: Attachment[];

  createdAt?: Timestamp;
}

// Per-account preferences (remember A/B choice)
export interface UserProfile {
  id?: string; // same as userId
  userId: string;

  // Remembered choice for organizing pasted text
  aiOrganizeEnabled: boolean; // default false
  organizeMode: OrganizeMode; // default "private"

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// --------------------
// User Profile
// --------------------

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as UserProfile;
};

export const upsertUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const ref = doc(db, "users", userId);

  // Ensure defaults exist if creating for first time
  const existing = await getUserProfile(userId);

  const base: UserProfile = existing ?? {
    userId,
    aiOrganizeEnabled: false,
    organizeMode: "private",
    createdAt: Timestamp.now()
  };

  const next: UserProfile = {
    ...base,
    ...data,
    userId,
    updatedAt: Timestamp.now()
  };

  await setDoc(ref, next, { merge: true });
  return next;
};

// --------------------
// Pets
// --------------------

export const addPet = (pet: Pet) =>
  addDoc(collection(db, "pets"), { ...pet, createdAt: Timestamp.now() });

export const updatePet = (petId: string, data: Partial<Pet>) =>
  updateDoc(doc(db, "pets", petId), { ...data, updatedAt: Timestamp.now() });

export const deletePet = (petId: string) => deleteDoc(doc(db, "pets", petId));

export const getUserPets = async (userId: string) => {
  const q = query(collection(db, "pets"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
};

export const getPetById = async (userId: string, petId: string): Promise<Pet | null> => {
  const ref = doc(db, "pets", petId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  if (data.userId !== userId) return null;

  return { id: snap.id, ...data } as Pet;
};

// --------------------
// Visits
// --------------------

export const addVisit = (visit: Visit) =>
  addDoc(collection(db, "visits"), {
    ...visit,
    status: visit.status ?? "final",
    hasNotes: visit.hasNotes ?? false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

export const updateVisit = (visitId: string, data: Partial<Visit>) =>
  updateDoc(doc(db, "visits", visitId), { ...data, updatedAt: Timestamp.now() });

export const deleteVisit = (visitId: string) => deleteDoc(doc(db, "visits", visitId));

export const getUserVisits = async (userId: string) => {
  const q = query(collection(db, "visits"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Visit));
};

export const getVisitById = async (userId: string, visitId: string): Promise<Visit | null> => {
  const ref = doc(db, "visits", visitId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  // Safety: ensure user owns it
  if (data.userId !== userId) return null;

  return { id: snap.id, ...data } as Visit;
};

// Mark the parent visit so My Visits can show Notes status without extra reads
export const markVisitHasNotes = (visitId: string, hasNotes: boolean) =>
  updateDoc(doc(db, "visits", visitId), {
    hasNotes,
    notesUpdatedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

// --------------------
// Visit Notes
// --------------------

export const addVisitNote = async (note: VisitNote) => {
  const res = await addDoc(collection(db, "visitNotes"), {
    ...note,
    createdAt: Timestamp.now()
  });

  await markVisitHasNotes(note.visitId, true);
  return res;
};

export const updateVisitNote = async (noteId: string, data: Partial<VisitNote>) => {
  const res = await updateDoc(doc(db, "visitNotes", noteId), data);

  if (data.visitId) {
    await markVisitHasNotes(data.visitId, true);
  }

  return res;
};

export const getVisitNote = async (userId: string, visitId: string) => {
  const q = query(
    collection(db, "visitNotes"),
    where("userId", "==", userId),
    where("visitId", "==", visitId)
  );
  const snap = await getDocs(q);
  const d = snap.docs[0];
  return d ? ({ id: d.id, ...d.data() } as VisitNote) : undefined;
};

export const deleteVisitNotesForVisit = async (userId: string, visitId: string) => {
  const q = query(
    collection(db, "visitNotes"),
    where("userId", "==", userId),
    where("visitId", "==", visitId)
  );
  const snap = await getDocs(q);

  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

  // If no notes remain, mark parent visit as not having notes
  await markVisitHasNotes(visitId, false);

  return snap.size;
};

export const deleteVisitFully = async (userId: string, visitId: string) => {
  await deleteVisitNotesForVisit(userId, visitId);
  await deleteVisit(visitId);
};

// --------------------
// Delete Account (with full data cleanup)
// --------------------

async function deleteAllDocsForUser(params: { collectionName: string; userId: string }) {
  const { collectionName, userId } = params;

  const q = query(collection(db, collectionName), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) return 0;

  // Firestore batch limit is 500 ops
  let deleted = 0;
  let batch = writeBatch(db);
  let opCount = 0;

  for (const d of snap.docs) {
    batch.delete(d.ref);
    opCount += 1;
    deleted += 1;

    if (opCount >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return deleted;
}

// --------------------
// Activation codes (gate signup behind a purchased code)
// --------------------

export type ActivationCodeCheckResult = { valid: boolean; reason?: "not_found" | "used" };
export type ActivationCodeRedeemResult = { ok: boolean; reason?: "not_found" | "used" };

// Read-only pre-check so a bad/used code fails fast, before we create an
// account for it. The real enforcement is the transaction in
// redeemActivationCode below — this is just for quick, friendly feedback.
export async function checkActivationCode(code: string): Promise<ActivationCodeCheckResult> {
  const ref = doc(db, "activationCodes", code.trim());
  const snap = await getDoc(ref);
  if (!snap.exists()) return { valid: false, reason: "not_found" };
  if ((snap.data() as any).used) return { valid: false, reason: "used" };
  return { valid: true };
}

// Atomically flips a code from unused to used. Runs as a transaction so two
// signups racing on the same code can't both succeed.
export async function redeemActivationCode(code: string, userId: string): Promise<ActivationCodeRedeemResult> {
  const ref = doc(db, "activationCodes", code.trim());
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("not_found");
      if ((snap.data() as any).used) throw new Error("used");
      tx.update(ref, { used: true, usedByUserId: userId, usedAt: Timestamp.now() });
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message === "used" ? "used" : "not_found" };
  }
}

export async function deleteUserAccount(userId: string) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("Not logged in.");
  if (user.uid !== userId) throw new Error("User mismatch. Please log in again.");

  const results: Record<string, number> = {};

  // Delete in order: notes → visits → pets
  results["visitNotes"] = await deleteAllDocsForUser({ collectionName: "visitNotes", userId });
  results["visits"] = await deleteAllDocsForUser({ collectionName: "visits", userId });
  results["pets"] = await deleteAllDocsForUser({ collectionName: "pets", userId });

  // Delete user profile doc directly (users/{userId})
  try {
    await deleteDoc(doc(db, "users", userId));
    results["users"] = 1;
  } catch {
    results["users"] = 0;
  }

  // Finally delete the auth user
  try {
    await deleteUser(user);
  } catch (e: any) {
    if (e?.code === "auth/requires-recent-login") {
      throw new Error(
        "For security, please log out and log in again, then try deleting your account once more."
      );
    }
    throw e;
  }

  return results;
}
