import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase"; // adjust path

export function usePlaceLikesCount(placeId, initialCount = 0) {
  const [likesCount, setLikesCount] = useState(initialCount);

  useEffect(() => {
    if (!placeId) return;

    const ref = doc(db, "places", placeId);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLikesCount(snap.data().likesCount ?? 0);
      }
    });

    return () => unsub();
  }, [placeId]);

  return likesCount;
}
