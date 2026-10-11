import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const usePlaceLikes = (placeId) => {
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!placeId) return;
    const unsub = onSnapshot(doc(db, "places", placeId), (doc) => {
      if (doc.exists()) {
        setLikesCount(doc.data().likesCount || 0);
      }
    });
    return () => unsub();
  }, [placeId]);

  return likesCount;
};