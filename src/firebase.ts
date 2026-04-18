import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_YOURS_HERE",
  authDomain: "PASTE_YOURS_HERE",
  projectId: "PASTE_YOURS_HERE",
  storageBucket: "PASTE_YOURS_HERE",
  messagingSenderId: "PASTE_YOURS_HERE",
  appId: "PASTE_YOURS_HERE"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
