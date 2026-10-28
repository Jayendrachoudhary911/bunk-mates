// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from 'firebase/messaging';
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA",
    authDomain: "bunk-mates-beccc.firebaseapp.com",
    projectId: "bunk-mates-beccc",
    storageBucket: "bunk-mates-beccc.firebasestorage.app",
    messagingSenderId: "37810808180",
    appId: "1:37810808180:web:94ca726e3c8f195a26f821",
    measurementId: "G-Y78WBDGF5Z"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with IndexedDB and Session persistence only (never localStorage)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserSessionPersistence],
  });
} catch (e) {
  auth = getAuth(app);
}

// Immediately remove any legacy auth keys from localStorage
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const fbaseKey = `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`;
    localStorage.removeItem(fbaseKey);
    localStorage.removeItem("bunkmates_auth_user");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("firebase:authUser:") || k === "bunkmates_auth_user")) {
        localStorage.removeItem(k);
      }
    }
  }
} catch (e) {}
const googleProvider = new GoogleAuthProvider();
const firestore = getFirestore(app);
const db = getFirestore(app);
const storage = getStorage(app);
let messaging = null;
try {
  if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.serviceWorker) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn("Firebase messaging not supported in this environment:", e.message);
}
const functions = getFunctions(app);

// Add cleanup hooks for QR session user and remote device kill-switch on signOut
const originalSignOut = auth.signOut ? auth.signOut.bind(auth) : null;
auth.signOut = async () => {
  if (typeof window !== "undefined") {
    const fbaseKey = `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`;
    sessionStorage.removeItem("bunkmates_auth_user");
    sessionStorage.removeItem("bunkmates_auth_welcome");
    sessionStorage.removeItem("bunkmates_qr_user");
    localStorage.removeItem("bunkmates_auth_user");
    localStorage.removeItem("bunkmates_linked_device_id");
    localStorage.removeItem("bunkmates_linked_uid");
    localStorage.removeItem(fbaseKey);

    try {
      if (window.indexedDB) {
        const req = window.indexedDB.open("firebaseLocalStorageDb", 1);
        req.onsuccess = (e) => {
          const idb = e.target.result;
          if (idb.objectStoreNames.contains("firebaseLocalStorage")) {
            const tx = idb.transaction("firebaseLocalStorage", "readwrite");
            tx.objectStore("firebaseLocalStorage").delete(fbaseKey);
          }
        };
      }
    } catch (idbErr) {
      console.warn("Could not delete from firebaseLocalStorageDb on sign out:", idbErr);
    }
  }
  if (originalSignOut) {
    return await originalSignOut();
  }
};

export { firebaseConfig, auth, googleProvider, db, firestore, storage, messaging, functions };


