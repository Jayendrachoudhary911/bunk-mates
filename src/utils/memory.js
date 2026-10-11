import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export const getUserMemory = async (uid) => {
  const ref = doc(db, "ai_memory", uid);
  const snap = await getDoc(ref);

  return snap.exists()
    ? snap.data()
    : { summary: "", messages: [], preferences: {} };
};

export const saveMessage = async (uid, message) => {
  const ref = doc(db, "ai_memory", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      summary: "",
      messages: [message],
      preferences: {},
    });
  } else {
    const data = snap.data();
    await updateDoc(ref, {
      messages: [...(data.messages || []), message],
    });
  }
};

// 🔥 NEW: Save Preferences
export const updatePreferences = async (uid, newPrefs) => {
  const ref = doc(db, "ai_memory", uid);
  const snap = await getDoc(ref);

  const existing = snap.data()?.preferences || {};

  await updateDoc(ref, {
    preferences: { ...existing, ...newPrefs },
  });
};

export const updateSummary = async (uid, summary) => {
  const ref = doc(db, "ai_memory", uid);
  await updateDoc(ref, { summary });
};