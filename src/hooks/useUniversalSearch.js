import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import placesData from "../data/data.json";

/**
 * useUniversalSearch
 * - Performs limited Firestore reads and client-side filters for substring matches.
 * - Returns grouped results: users, friends, notes, reminders, trips, places.
 *
 * Notes:
 * - For production, add server-side search index (Algolia / Elastic / Firestore text index).
 * - Keep read limits small to avoid high reads. Adjust limits as required.
 */
export default function useUniversalSearch(searchTerm, options = {}) {
  const { maxPerCollection = 200 } = options;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    friends: [],
    notes: [],
    reminders: [],
    trips: [],
    places: [],
  });
  const currentUser = auth.currentUser;
  const lastQuery = useRef("");

  useEffect(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) {
      setResults({
        users: [],
        friends: [],
        notes: [],
        reminders: [],
        trips: [],
        places: [],
      });
      setLoading(false);
      lastQuery.current = "";
      return;
    }
    // debounce small delay
    const t = setTimeout(async () => {
      if (term === lastQuery.current) return;
      lastQuery.current = term;
      setLoading(true);
      try {
        // Helper to read a collection with optional owner filter
        const readAndFilter = async (colName, opts = {}) => {
          const q = query(collection(db, colName), orderBy("createdAt", "desc"), limit(maxPerCollection));
          const snap = await getDocs(q);
          const docs = [];
          snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
          const lower = term;
          return docs.filter(doc => {
            const hay = [
              doc.name,
              doc.title,
              doc.username,
              doc.email,
              doc.text,
              doc.content,
              doc.location,
              doc.placeName,
              doc.description,
              doc.ownerName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            if (opts.onlyOwner && currentUser) {
              if (doc.owner !== currentUser.uid && doc.createdBy !== currentUser.uid && doc.uid !== currentUser.uid) {
                return false;
              }
            }
            return hay.includes(lower);
          });
        };

        // Read firestore collections
        const [users, notes, reminders, trips] = await Promise.all([
          readAndFilter("users"),
          readAndFilter("notes"),
          readAndFilter("reminders"),
          readAndFilter("trips"),
        ]);

        // Filter places from local data file (src/data/data.json) - FIXED LOGIC
        let places = [];
        try {
          const allStates = Array.isArray(placesData.states) ? placesData.states : [];
          
          // Flatten the nested structure: states -> districts -> places
          const rawPlaces = allStates.flatMap(state => 
            (state.districts || []).flatMap(district => 
              (district.places || []).map(p => ({ 
                // Create a unique ID and add location context
                id: p.name.replace(/\s/g, '_') + '_' + state.code + '_' + district.name,
                location: `${district.name}, ${state.name}`, 
                city: district.name,
                state: state.name,
                ...p 
              }))
            )
          );

          places = rawPlaces
            .filter(doc => {
              const hay = [
                doc.name,
                doc.title,
                doc.placeName,
                doc.description,
                doc.location,
                doc.city,
                doc.address,
                doc.type, // Added searchable fields
                doc.bestTimeToVisit,
                doc.weather,
                doc.season,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return hay.includes(term);
            });
        } catch (e) {
          console.warn("Failed to filter local places data:", e);
          places = [];
        }


        // compute friends subset if currentUser has friends array
        let friends = [];
        if (currentUser) {
          try {
            const usersSnap = await getDocs(query(collection(db, "users"), limit(200)));
            const allUsers = [];
            usersSnap.forEach(d => allUsers.push({ id: d.id, ...d.data() }));
            const me = allUsers.find(u => u.uid === currentUser.uid || u.id === currentUser.uid) || {};
            const myFriends = me.friends || me.friendIds || [];
            friends = allUsers.filter(u => {
              const match = (u.name || u.username || u.email || "").toLowerCase().includes(term);
              const isFriend = myFriends.includes(u.uid) || myFriends.includes(u.id) || false;
              return match && isFriend;
            });
          } catch (e) {
            friends = users.slice(0, 10); // fallback
          }
        }

        // For trips: limit to trips created by current user (owner)
        const myTrips = trips.filter(t => {
          if (!currentUser) return false;
          return (t.owner === currentUser.uid || t.createdBy === currentUser.uid || t.uid === currentUser.uid);
        });

        setResults({
          users,
          friends,
          notes,
          reminders,
          trips: myTrips,
          places,
        });
      } catch (e) {
        console.error("Search error", e);
        setResults(prev => prev); // keep old
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchTerm, maxPerCollection, currentUser]);

  return { results, loading };
}