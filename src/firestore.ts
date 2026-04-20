import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

const db = getFirestore(firebaseApp);

// Types
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
  createdAt?: Timestamp;
}

export interface Visit {
  id?: string;
  userId: string;
  petId: string;
  visitDate: string;
  mainConcern: string;
  whenStart: string;
  howProgressing: string;
  patterns: string;
  associatedSigns: string;
  previousTreatment: string;
  questionsVet: string;
  createdAt?: Timestamp;
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
  createdAt?: Timestamp;
}

// Pets
export const addPet = (pet: Pet) =>
  addDoc(collection(db, "pets"), { ...pet, createdAt: Timestamp.now() });

export const updatePet = (petId: string, data: Partial<Pet>) =>
  updateDoc(doc(db, "pets", petId), data);

export const deletePet = (petId: string) => deleteDoc(doc(db, "pets", petId));

export const getUserPets = async (userId: string) => {
  const q = query(collection(db, "pets"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Pet));
};

// Visits
export const addVisit = (visit: Visit) =>
  addDoc(collection(db, "visits"), { ...visit, createdAt: Timestamp.now() });

export const updateVisit = (visitId: string, data: Partial<Visit>) =>
  updateDoc(doc(db, "visits", visitId), data);

export const deleteVisit = (visitId: string) => deleteDoc(doc(db, "visits", visitId));

export const getUserVisits = async (userId: string) => {
  const q = query(collection(db, "visits"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit));
};

// Visit Notes
export const addVisitNote = (note: VisitNote) =>
  addDoc(collection(db, "visitNotes"), { ...note, createdAt: Timestamp.now() });

export const updateVisitNote = (noteId: string, data: Partial<VisitNote>) =>
  updateDoc(doc(db, "visitNotes", noteId), data);

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
// Delete Account (with full data cleanup)
import { writeBatch } from "firebase/firestore";
import { deleteUser, getAuth } from "firebase/auth";

async function deleteAllDocsForUser(params: {
  collectionName: string;
  userId: string;
}) {
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

  if (!user) {
    throw new Error("Not logged in.");
  }

  if (user.uid !== userId) {
    throw new Error("User mismatch. Please log in again.");
  }

  // Delete all Firestore docs for this user (in order: notes → visits → pets)
  const collectionsToDelete = ["visitNotes", "visits", "pets"];

  const results: Record<string, number> = {};
  for (const name of collectionsToDelete) {
    results[name] = await deleteAllDocsForUser({ collectionName: name, userId });
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
