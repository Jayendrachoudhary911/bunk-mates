import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import placesData from "../data/data.json";

export default function useUniversalSearch(searchTerm, options = {}) {
  const { maxPerCollection = 200 } = options;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    notes: [],
    reminders: [],
    trips: [],
    places: [],
  });
  const currentUser = auth.currentUser;
  const lastQuery = useRef("");

  useEffect(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    
    // Even with empty search, fetch all users but don't filter them
    const fetchData = async () => {
      setLoading(true);
      try {
        // Helper to read a collection with optional owner filter
        const readAndFilter = async (colName, opts = {}) => {
          const q = query(
            collection(db, colName), 
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          const docs = [];
          snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

          // Return all users without filtering
          if (colName === "users") {
            return docs;
          }

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
              doc.displayName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            if (opts.onlyOwner && currentUser) {
              if (doc.owner !== currentUser.uid && doc.createdBy !== currentUser.uid && doc.uid !== currentUser.uid) {
                return false;
              }
            }
            
            return !term || hay.includes(lower);
          });
        };

        // Read firestore collections
        const [users, notes, reminders, trips] = await Promise.all([
          readAndFilter("users"),
          readAndFilter("notes"),
          readAndFilter("reminders"),
          readAndFilter("trips"),
        ]);

        // Filter places from local data
        let places = [];
        if (term) { // Only filter places if there's a search term
          try {
            const allStates = Array.isArray(placesData.states) ? placesData.states : [];
            const rawPlaces = allStates.flatMap(state => 
              (state.districts || []).flatMap(district => 
                (district.places || []).map(p => ({ 
                  id: p.name.replace(/\s/g, '_') + '_' + state.code + '_' + district.name,
                  location: `${district.name}, ${state.name}`, 
                  city: district.name,
                  state: state.name,
                  ...p 
                }))
              )
            );

            places = rawPlaces.filter(doc => {
              const hay = [
                doc.name,
                doc.title,
                doc.placeName,
                doc.description,
                doc.location,
                doc.city,
                doc.address,
                doc.type,
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
        }


        // For trips: limit to trips created by current user
        const myTrips = trips.filter(t => {
          if (!currentUser) return false;
          return (t.owner === currentUser.uid || t.createdBy === currentUser.uid || t.uid === currentUser.uid);
        });

        setResults({
          users,
          notes: term ? notes : [],
          reminders: term ? reminders : [],
          trips: term ? myTrips : [],
          places: term ? places : [],
        });
      } catch (e) {
        console.error("Search error", e);
        setResults(prev => prev);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
    
  }, [searchTerm, maxPerCollection, currentUser]);

  return { results, loading };
}