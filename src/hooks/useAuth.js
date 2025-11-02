// src/hooks/useAuth.js
import React, { useState, useEffect } from 'react';
// ** IMPORTANT: Replace '../firebase' with the actual path to your initialized Firebase auth instance
import { auth, firestore } from '../firebase'; // Assuming you have auth and firestore instances exported

// Custom hook to listen for Firebase Auth state changes
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is the Firebase listener that updates the user state whenever
    // the sign-in status changes (login, logout, token refresh, etc.)
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, []);

  // You can extend this hook to also fetch the user's document from Firestore
  // based on user?.uid if you need more profile data (like profileVisibility).
  
  return { user, loading };
};

// ** Alternative/Extension: A hook to get the full user doc (including 'profileVisibility') **
// This is what you would use to fetch data beyond basic auth
/*
export const useUserDoc = (uid) => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (!uid) {
            setUserData(null);
            return;
        }

        const docRef = firestore.collection('users').doc(uid);
        const unsubscribe = docRef.onSnapshot((doc) => {
            if (doc.exists) {
                setUserData(doc.data());
            }
        });

        return unsubscribe;
    }, [uid]);

    return userData;
};
*/