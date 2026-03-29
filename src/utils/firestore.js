import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const fetchTripsFromFirestore = async (uid) => {
  try {
    const snapshot = await getDocs(collection(db, "trips"));
    const trips = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Filter trips where user is a member
      if (data.members?.includes(uid)) {
        trips.push({ id: doc.id, ...data });
      }
    });

    return trips;
  } catch (error) {
    console.error(error);
    return [];
  }
};