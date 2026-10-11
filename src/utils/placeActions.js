import { db, auth } from "../firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

/* ──────────────────────────────────────────────── */
/* 🔥 LIKE / UNLIKE PLACE (OPTIMIZED & ATOMIC) */
/* ──────────────────────────────────────────────── */
export const toggleLikePlace = async (placeId, isCurrentlyLiked) => {
  const user = auth.currentUser;
  if (!user || !placeId) return;

  const uid = user.uid;
  const userRef = doc(db, "users", uid);
  const placeRef = doc(db, "places", placeId);

  const batch = writeBatch(db);

  try {
    /* 1️⃣ GLOBAL LIKE COUNTER (atomic & concurrent-safe) */
    batch.set(
      placeRef,
      {
        likesCount: increment(isCurrentlyLiked ? -1 : 1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    /* 2️⃣ USER LIKE STATE (safe even if doc is missing) */
    batch.set(
      userRef,
      {
        likedTrips: isCurrentlyLiked
          ? arrayRemove(placeId)
          : arrayUnion(placeId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    /* 3️⃣ NON-BLOCKING HAPTIC (best-effort only) */
    if (!isCurrentlyLiked && typeof navigator !== "undefined") {
      navigator.vibrate?.([8, 20, 8]);
    }
  } catch (error) {
    console.error("toggleLikePlace failed:", {
      placeId,
      uid,
      error,
    });
  }
};

/* ──────────────────────────────────────────────── */
/* 🔖 SAVE / UNSAVE PLACE (FAST PATH) */
/* ──────────────────────────────────────────────── */
export const toggleSavePlace = async (placeId, isCurrentlySaved) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !placeId) return;

  const userRef = doc(db, "users", uid);

  try {
    await updateDoc(userRef, {
      savedTrips: isCurrentlySaved
        ? arrayRemove(placeId)
        : arrayUnion(placeId),
    });

    if (navigator.vibrate) navigator.vibrate(8);
  } catch (error) {
    console.error("Save update failed:", error);
  }
};
