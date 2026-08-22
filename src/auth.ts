import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  deleteUser,
  User
} from "firebase/auth";
import { firebaseApp } from "./firebase";

const auth = getAuth(firebaseApp);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const startDemo = () => signInAnonymously(auth);

// Rolls back a just-created account, used when signup succeeded but the
// activation code it was gated on turned out to be invalid (e.g. a race
// against another signup using the same code).
export const cancelSignup = (user: User) => deleteUser(user);

export const logIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const logOut = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
