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
  writeBatch
} from "firebase/firestore";
import { deleteUser, getAuth } from "firebase/auth";
import { firebaseApp } from "./firebase";

const db = getFirestore(firebaseApp);

// --------------------
// Types
// --------------------

export interface Pet {
  id?: string;
  userId: string;
  name: string;
  species: string;
  age: string;
  sex: string;
  weight: string;
  microchip: string;
  allergies: string;
  medications: string;
  diet: string;
  clinic: string;
  emergencyContact: string;
  notes: string;

  // NEW (optional) — Pet Snapshot / background
  vaccinationStatus?: "up_to_date" | "not_up_to_date" | "unknown";
  vaccinationLastDate?: string;
  preventatives?: string; // v1 free text (later split into flea/tick/worm/heartworm)
  surgeries?: string;
  lifestyle?: string; // indoor/outdoor, other animals, travel, etc.
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

  // NEW (optional) — broad catch-all “Other details for the vet”
  otherDetails?: string;

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
  updateDoc(doc(db, "pets", petId), data);

export const deletePet = (petId: string) => deleteDoc(doc(db, "pets", petId));

export const getUserPets = async (userId: string) => {
  const q = query(collection(db, "pets"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pet));
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
