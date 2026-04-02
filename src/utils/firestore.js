import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

/**
 * Fetches all trips where user is a member with full trip context.
 */
export const fetchTripsFromFirestore = async (uid) => {
  if (!uid) return [];
  try {
    // Ensure collection name matches your DB exactly
    const tripsRef = collection(db, "trips"); 
    const q = query(tripsRef, where("members", "array-contains", uid));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        from: data.from,           // Jaipur
        to: data.to,               // Dehradun
        startDate: data.startDate, // 2026-04-02
        endDate: data.endDate,     // 2026-04-07
        members: data.members || [],
        admins: data.admins || [],
        tripId: data.tripId,
        // iconURL included here, but pruned in gemini.js to save money/tokens
        iconURL: data.iconURL, 
      };
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return [];
  }
};