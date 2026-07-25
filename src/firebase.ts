import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCX5qQcR2q-CyaAJFMyGk8PbP6mGRQCbM",
  authDomain: "pause-first.firebaseapp.com",
  projectId: "pause-first",
  storageBucket: "pause-first.firebasestorage.app",
  messagingSenderId: "343532727072",
  appId: "1:343532727072:web:993f08c3a72f8b4ff78545",
  measurementId: "G-X8LXCFYHBQ"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
