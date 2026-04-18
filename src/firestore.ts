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

export const getVisitNote = async (visitId: string) => {
  const q = query(collection(db, "visitNotes"), where("visitId", "==", visitId));
  const snap = await getDocs(q);
  return snap.docs[0]?.data() as VisitNote | undefined;
};
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /pets/{petId} {
        allow read, write: if isOwner(userId);

        match /visits/{visitId} {
          allow read, write: if isOwner(userId);
        }
      }
    }
  }
}
