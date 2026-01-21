import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const useFriendLikesCount = (placeId, friends = []) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!placeId || friends.length === 0) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchFriendLikes = async () => {
      try {
        // Firestore allows max 10 in `in`
        const chunks = [];
        for (let i = 0; i < friends.length; i += 10) {
          chunks.push(friends.slice(i, i + 10));
        }

        let total = 0;

        for (const chunk of chunks) {
          const q = query(
            collection(db, "users"),
            where("__name__", "in", chunk),
            where("likedTrips", "array-contains", placeId)
          );

          const snap = await getDocs(q);
          total += snap.size;
        }

        if (!cancelled) setCount(total);
      } catch (e) {
        console.error("Friend likes fetch failed", e);
      }
    };

    fetchFriendLikes();

    return () => {
      cancelled = true;
    };
  }, [placeId, friends]);

  return count;
};
