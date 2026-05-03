"use client";
import { useEffect } from "react";
import { isSupported, getAnalytics } from "firebase/analytics";
import { firebaseApp } from "@/lib/firebase/firebase";

export default function FirebaseAnalytics() {
  useEffect(() => {
    isSupported().then((ok) => {
      if (ok) getAnalytics(firebaseApp);
    });
  }, []);
  return null;
}
