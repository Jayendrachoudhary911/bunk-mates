import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

export const useUserRealtime = () => {
  const [userData, setUserData] = useState({ likedTrips: [], savedTrips: [] });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });
    return () => unsub();
  }, []);

  return userData;
};