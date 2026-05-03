import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "kagongmap.firebaseapp.com",
  projectId: "kagongmap",
  storageBucket: "kagongmap.firebasestorage.app",
  messagingSenderId: "1045730662094",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-72RS70211S",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
