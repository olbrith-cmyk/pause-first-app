// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCX5qQcR2q-CyaAJFMyGk8PbP6mGRQCbM",
  authDomain: "pause-first.firebaseapp.com",
  projectId: "pause-first",
  storageBucket: "pause-first.firebasestorage.app",
  messagingSenderId: "343532727072",
  appId: "1:343532727072:web:993f08c3a72f8b4ff78545",
  measurementId: "G-X8LXCFYHBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
