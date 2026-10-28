// src/services/qrAuthService.js
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { signInWithCustomToken } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { firebaseConfig, auth, db, functions } from "../firebase.js";

export const FIREBASE_API_KEY = firebaseConfig?.apiKey || "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA";
export const DEVICE_PAIRING_COLLECTION = "device_pairings";
export const QR_SESSION_COLLECTION = "device_pairings"; // Alias for 100% Android interoperability
export const LEGACY_QR_COLLECTION = "qr_login_sessions"; // Backwards compatibility fallback
export const QR_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms) as specified by Android protocol

/**
 * Persists full Firebase authUser credentials directly to localdb:
 * 1. IndexedDB: database 'firebaseLocalStorageDb', object store 'firebaseLocalStorage', key 'firebase:authUser:<apiKey>:[DEFAULT]'
 * 2. localStorage: 'firebase:authUser:<apiKey>:[DEFAULT]'
 * 3. localStorage & sessionStorage: 'bunkmates_auth_user'
 */
export async function saveAuthUserToLocalDb(authUser, apiKey = FIREBASE_API_KEY) {
  if (typeof window === "undefined") return false;

  const fbaseKey = `firebase:authUser:${apiKey}:[DEFAULT]`;

  // Standardize full Firebase authUser structure matching DevTools firebaseLocalStorageDb
  const recordValue = {
    apiKey: apiKey,
    appName: "[DEFAULT]",
    createdAt: String(authUser.createdAt || authUser.metadata?.createdAt || Date.now()),
    lastLoginAt: String(authUser.lastLoginAt || authUser.metadata?.lastLoginAt || Date.now()),
    displayName: authUser.displayName || "",
    email: authUser.email || "",
    emailVerified: authUser.emailVerified ?? true,
    isAnonymous: authUser.isAnonymous ?? false,
    phoneNumber: authUser.phoneNumber || null,
    photoURL: authUser.photoURL || "",
    providerData: (authUser.providerData && authUser.providerData.length > 0)
      ? authUser.providerData.map((p) => ({
          displayName: p.displayName || authUser.displayName || "",
          email: p.email || authUser.email || "",
          phoneNumber: p.phoneNumber || null,
          photoURL: p.photoURL || authUser.photoURL || "",
          providerId: p.providerId || "google.com",
          uid: p.uid || authUser.uid || "",
        }))
      : [
          {
            displayName: authUser.displayName || "",
            email: authUser.email || "",
            phoneNumber: null,
            photoURL: authUser.photoURL || "",
            providerId: "google.com",
            uid: authUser.uid || "",
          },
        ],
    stsTokenManager: {
      refreshToken:
        authUser.stsTokenManager?.refreshToken ||
        authUser.refreshToken ||
        "bunkmates_auth_refresh_token",
      accessToken:
        authUser.stsTokenManager?.accessToken ||
        authUser.accessToken ||
        authUser.idToken ||
        "",
      expirationTime: Number(
        authUser.stsTokenManager?.expirationTime || Date.now() + 3600 * 1000
      ),
    },
    tenantId: authUser.tenantId || null,
    uid: authUser.uid,
    _redirectEventId: null,
  };

  const itemToStore = {
    fbase_key: fbaseKey,
    value: recordValue,
  };

  // 1. Write to sessionStorage only (never localStorage)
  try {
    localStorage.removeItem(fbaseKey);
    localStorage.removeItem("bunkmates_auth_user");
    sessionStorage.setItem("bunkmates_auth_user", JSON.stringify(recordValue));
  } catch (err) {
    console.warn("[LocalDB] storage write warning:", err);
  }

  // 2. Write to IndexedDB firebaseLocalStorageDb -> firebaseLocalStorage
  if (!window.indexedDB) return true;

  return new Promise((resolve) => {
    try {
      const openReq = window.indexedDB.open("firebaseLocalStorageDb", 1);

      openReq.onupgradeneeded = (e) => {
        const idb = e.target.result;
        if (!idb.objectStoreNames.contains("firebaseLocalStorage")) {
          idb.createObjectStore("firebaseLocalStorage", { keyPath: "fbase_key" });
        }
      };

      openReq.onsuccess = (e) => {
        const idb = e.target.result;
        try {
          const tx = idb.transaction("firebaseLocalStorage", "readwrite");
          const store = tx.objectStore("firebaseLocalStorage");
          const putReq = store.put(itemToStore);

          putReq.onsuccess = () => {
            console.log("[LocalDB] Successfully stored authUser in firebaseLocalStorageDb:", fbaseKey);
            resolve(true);
          };

          putReq.onerror = (putErr) => {
            console.warn("[LocalDB] IndexedDB store.put error:", putErr);
            resolve(false);
          };
        } catch (txErr) {
          console.warn("[LocalDB] Transaction error:", txErr);
          resolve(false);
        }
      };

      openReq.onerror = (openErr) => {
        console.warn("[LocalDB] IndexedDB open error:", openErr);
        resolve(false);
      };
    } catch (e) {
      console.warn("[LocalDB] IndexedDB invocation error:", e);
      resolve(false);
    }
  });
}

/**
 * Retrieves authUser from localdb (localStorage or IndexedDB)
 */
export async function getAuthUserFromLocalDb(apiKey = FIREBASE_API_KEY) {
  if (typeof window === "undefined") return null;

  const fbaseKey = `firebase:authUser:${apiKey}:[DEFAULT]`;

  // 1. Try sessionStorage and clean up legacy localStorage
  try {
    localStorage.removeItem(fbaseKey);
    localStorage.removeItem("bunkmates_auth_user");
    const raw = sessionStorage.getItem("bunkmates_auth_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.uid || parsed.value?.uid)) {
        return parsed.value || parsed;
      }
    }
  } catch (e) {}

  // 2. Fallback to IndexedDB
  if (!window.indexedDB) return null;

  return new Promise((resolve) => {
    try {
      const openReq = window.indexedDB.open("firebaseLocalStorageDb", 1);
      openReq.onsuccess = (e) => {
        const idb = e.target.result;
        if (!idb.objectStoreNames.contains("firebaseLocalStorage")) {
          resolve(null);
          return;
        }
        const tx = idb.transaction("firebaseLocalStorage", "readonly");
        const store = tx.objectStore("firebaseLocalStorage");
        const getReq = store.get(fbaseKey);

        getReq.onsuccess = () => {
          if (getReq.result && getReq.result.value) {
            resolve(getReq.result.value);
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => resolve(null);
      };
      openReq.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Removes authUser from localdb on logout
 */
export async function removeAuthUserFromLocalDb(apiKey = FIREBASE_API_KEY) {
  if (typeof window === "undefined") return;

  const fbaseKey = `firebase:authUser:${apiKey}:[DEFAULT]`;

  try {
    localStorage.removeItem(fbaseKey);
    localStorage.removeItem("bunkmates_auth_user");
    sessionStorage.removeItem("bunkmates_auth_user");
  } catch (e) {}

  if (!window.indexedDB) return;

  try {
    const openReq = window.indexedDB.open("firebaseLocalStorageDb", 1);
    openReq.onsuccess = (e) => {
      const idb = e.target.result;
      if (idb.objectStoreNames.contains("firebaseLocalStorage")) {
        const tx = idb.transaction("firebaseLocalStorage", "readwrite");
        tx.objectStore("firebaseLocalStorage").delete(fbaseKey);
      }
    };
  } catch (e) {}
}

/**
 * Generates a cryptographically secure random hex string of given byte length
 */
export function generateSecureRandomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes SHA-256 hash using the Web Crypto API
 */
export async function computeSha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extracts clean sessionId from raw QR string, URL, deep-link, or JSON payload.
 * Mirrors Android's parseQRLoginPayload function exactly.
 */
export function parseQRLoginPayload(rawData) {
  if (!rawData) return { sessionId: null, raw: "" };

  const trimmed = String(rawData).trim();

  // Case 1: Direct Session ID string (e.g. "bunk_qr_1729708912_x8k2p")
  if (trimmed.startsWith("bunk_qr_")) {
    return { sessionId: trimmed, raw: trimmed };
  }

  // Case 2: JSON payload string (e.g. { "sessionId": "bunk_qr_..." })
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      const sid = parsed.sessionId || parsed.id || parsed.session_id;
      if (sid && String(sid).startsWith("bunk_qr_")) {
        return { sessionId: sid, raw: trimmed, parsed };
      }
    } catch (e) {
      // not valid JSON, proceed to URL check
    }
  }

  // Case 3: URL or Deep Link (e.g. "https://app.bunkmates.xyz/qr-login?sessionId=bunk_qr_...")
  try {
    const urlObj = new URL(trimmed);
    const sidParam = urlObj.searchParams.get("sessionId") || urlObj.searchParams.get("session_id");
    if (sidParam) {
      return { sessionId: sidParam, raw: trimmed, url: urlObj.href };
    }
  } catch (e) {
    // If not a standard URL, test query string regex match
    const match = trimmed.match(/[?&]sessionId=([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return { sessionId: match[1], raw: trimmed };
    }
  }

  return { sessionId: null, raw: trimmed };
}

/**
 * Detects friendly desktop browser, OS, and location metadata matching Android schema
 */
export function getDesktopDeviceInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let browser = "Chrome";
  let os = "Windows";

  // Browser detection
  if (ua.includes("Edg/")) {
    const m = ua.match(/Edg\/([0-9]+)/);
    browser = m ? `Edge ${m[1]}` : "Microsoft Edge";
  } else if (ua.includes("Chrome/")) {
    const m = ua.match(/Chrome\/([0-9]+)/);
    browser = m ? `Chrome ${m[1]}` : "Chrome 128";
  } else if (ua.includes("Firefox/")) {
    const m = ua.match(/Firefox\/([0-9]+)/);
    browser = m ? `Firefox ${m[1]}` : "Firefox";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    browser = "Safari";
  }

  // OS detection
  if (ua.includes("Windows NT 10.0") || ua.includes("Windows 11")) {
    os = "Windows 11";
  } else if (ua.includes("Windows NT")) {
    os = "Windows 10";
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }

  // Location / Timezone estimation
  let location = "Desktop";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz) {
      location = tz.split("/").pop().replace(/_/g, " ");
    }
  } catch (e) {
    location = "Desktop Browser";
  }

  return {
    deviceName: "Personal Computer",
    deviceType: "desktop",
    browser,
    os,
    location,
    label: `${browser} on ${os}`,
    userAgent: ua,
  };
}

/**
 * Step 1: Initiates a new QR Login Session in `device_pairings` collection.
 * Creates document with status: "pending", 10-minute TTL, requesterMetadata, and proof-of-possession.
 */
export async function createQrLoginSession() {
  // 1. Generate unique Session ID matching format: bunk_qr_${timestamp}_${randomSuffix}
  const randomSuffix = generateSecureRandomHex(5);
  const sessionId = `bunk_qr_${Math.floor(Date.now() / 1000)}_${randomSuffix}`;

  // 2. Generate cryptographically secure client secret (held ONLY in memory on desktop)
  const clientSecret = generateSecureRandomHex(32);

  // 3. Compute public SHA-256 commitment
  const secretHash = await computeSha256(clientSecret);

  // 4. Session timestamps (10-minute TTL as per Android spec)
  const createdAtMs = Date.now();
  const expiresAtMs = createdAtMs + QR_SESSION_TTL_MS;

  const deviceInfo = getDesktopDeviceInfo();

  // 5. Structure payload matching Phase 1 of Android implementation:
  const sessionData = {
    id: sessionId,
    sessionId,
    status: "pending", // Android protocol initial status: "pending"
    createdAt: createdAtMs,
    expiresAt: expiresAtMs,
    createdAtMs,
    expiresAtMs,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
    requesterMetadata: {
      deviceName: deviceInfo.deviceName || `${deviceInfo.browser} on ${deviceInfo.os}`,
      deviceType: "desktop",
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location: deviceInfo.location,
    },
    secretHash,
    consumed: false,
    temporary: true,
  };

  // 6. Store directly in Firestore collection `device_pairings`
  const primaryDocRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);
  await setDoc(primaryDocRef, sessionData);

  // Optional: Also attempt callable Cloud Function if explicitly configured in environment
  if (process.env.REACT_APP_USE_CLOUD_FUNCTIONS === "true") {
    try {
      const createFn = httpsCallable(functions, "createQrLoginSession");
      await createFn({
        sessionId,
        secretHash,
        requesterMetadata: sessionData.requesterMetadata,
        deviceInfo,
        clientExpiresAtMs: expiresAtMs,
      });
    } catch (fnErr) {
      console.warn("[QR Auth] Cloud Function create error, proceeding with direct Firestore doc:", fnErr);
    }
  }

  // 7. Standard QR Code URL matching Android app parser:
  // "https://app.bunkmates.xyz/qr-login?sessionId=bunk_qr_..."
  const baseUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? window.location.origin
      : "https://app.bunkmates.xyz";
  const qrPayload = `${baseUrl}/qr-login?sessionId=${sessionId}`;

  return {
    sessionId,
    clientSecret, // Retained strictly in memory by desktop caller
    expiresAtMs,
    qrPayload,
    deviceInfo,
    savedToFirestore: true,
  };
}

/**
 * Validates a QR session's active status, non-expiration, and unconsumed state
 */
export async function validateQrSession(sessionId) {
  if (!sessionId) {
    return { valid: false, reason: "No session ID provided" };
  }

  try {
    let sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);
    let snap = await getDoc(sessionRef);

    if (!snap.exists()) {
      sessionRef = doc(db, LEGACY_QR_COLLECTION, sessionId);
      snap = await getDoc(sessionRef);
    }

    if (!snap.exists()) {
      return { valid: false, reason: "Session not found or has been cancelled" };
    }

    const data = snap.data();
    const now = Date.now();
    const expiry = data.expiresAt || data.expiresAtMs;

    if (expiry && now > expiry) {
      return { valid: false, reason: "Session has expired", status: "expired" };
    }

    if (data.consumed === true || data.status === "consumed" || data.status === "completed") {
      return { valid: false, reason: "Session already consumed", status: "consumed" };
    }

    if (data.status === "rejected") {
      return { valid: false, reason: "Session was rejected", status: "rejected" };
    }

    return { valid: true, status: data.status, session: data };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

/**
 * Real-time listener for Desktop Browser.
 * Listens on `device_pairings/{sessionId}` (with fallback).
 */
export function subscribeToQrSession(sessionId, onStatusChange, onError) {
  if (!sessionId) return () => {};

  const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);

  const unsubscribe = onSnapshot(
    sessionRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onStatusChange({ status: "cancelled", notFound: true });
        return;
      }

      const data = docSnap.data();
      const now = Date.now();
      const expiry = data.expiresAt || data.expiresAtMs;

      // Check if session expired
      if (expiry && now > expiry && data.status !== "consumed" && data.status !== "completed") {
        onStatusChange({
          ...data,
          status: "expired",
        });
        return;
      }

      onStatusChange(data);
    },
    (error) => {
      console.error("QR Session subscription error on device_pairings:", error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Step 2: Records that a mobile device scanned the QR code.
 * Updates Firestore document to `status: "scanned"`.
 */
export async function recordScan(sessionId, mobileInfo = {}) {
  if (!sessionId) return;
  const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);

  try {
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status === "pending" || data.status === "waiting_scan") {
      await updateDoc(sessionRef, {
        status: "scanned",
        scannedAt: Date.now(),
        mobileInfo: mobileInfo || null,
      });
    }
  } catch (err) {
    console.warn("Could not record scan event:", err);
  }
}

/**
 * Step 4: Mobile action to approve a login request.
 * Injects complete authentication payload, mints/provides tokens,
 * and registers the linked device under `users/{uid}/devices/{devId}`.
 */
export async function approveQrSession(sessionId, mobileUser, sharedSession = {}) {
  if (!sessionId) throw new Error("Missing sessionId");

  const uid =
    sharedSession?.uid ||
    mobileUser?.uid ||
    mobileUser?.id ||
    mobileUser?._delegate?.uid ||
    mobileUser?.userId ||
    "bunkmate_user";

  const email = sharedSession?.email || mobileUser?.email || "";
  const displayName = sharedSession?.displayName || mobileUser?.displayName || mobileUser?.name || "BunkMate User";
  const photoURL = sharedSession?.photoURL || mobileUser?.photoURL || mobileUser?.avatar || "";
  const userData = sharedSession?.userData || {
    username: sharedSession?.username || displayName.toLowerCase().replace(/\s+/g, ""),
    role: "user",
  };

  const idToken = sharedSession?.idToken || null;
  const customToken = sharedSession?.customToken || null;
  const token = customToken || idToken || "";

  // Device ID for secondary linked device:
  const deviceId = sharedSession?.deviceId || `dev_${Date.now()}_${generateSecureRandomHex(4)}`;
  const approvedDevice = {
    id: deviceId,
    deviceName: sharedSession?.deviceName || "Chrome on Windows",
    deviceType: "desktop",
    linkedAt: Date.now(),
    isActive: true,
  };

  // 1. Try Cloud Function `approveQrLogin` (as defined in Android spec)
  if (process.env.REACT_APP_USE_CLOUD_FUNCTIONS === "true") {
    try {
      const approveFn = httpsCallable(functions, "approveQrLogin");
      const result = await approveFn({ sessionId, deviceId, sharedSession });
      return result.data;
    } catch (fnErr) {
      console.warn("[QR Auth] Cloud Function approveQrLogin error, proceeding with direct Firestore write:", fnErr);
    }
  }

  // 2. Direct Firestore update matching Step 4 payload
  const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists()) {
      throw new Error("Login session not found or cancelled.");
    }

    const data = snap.data();
    const expiry = data.expiresAt || data.expiresAtMs;
    if (expiry && Date.now() > expiry) {
      throw new Error("This QR session has already expired. Please refresh the code on your desktop.");
    }
    if (data.consumed || data.status === "consumed" || data.status === "completed") {
      throw new Error("This login session has already been used.");
    }
    if (data.status === "rejected") {
      throw new Error("This login session was rejected.");
    }

    const payload = {
      status: "approved",
      approverUid: uid,
      userId: uid,
      uid,
      email,
      displayName,
      photoURL,
      user: {
        uid,
        email,
        displayName,
      },
      userData,
      customToken,
      idToken,
      token,
      approvedDevice,
      authUser: sharedSession?.authUser || null,
      credentials: sharedSession?.credentials || {
        authUser: sharedSession?.authUser || null,
        idToken,
        customToken,
        token,
      },
      approvedAt: Date.now(),
      approvedAtIso: new Date().toISOString(),
    };

    tx.update(sessionRef, payload);
  });

  // 3. Register device in subcollection `users/{uid}/devices/{deviceId}`
  try {
    const deviceRef = doc(db, "users", uid, "devices", deviceId);
    await setDoc(deviceRef, {
      id: deviceId,
      deviceName: approvedDevice.deviceName,
      deviceType: "desktop",
      linkedAt: Date.now(),
      lastActiveAt: Date.now(),
      isActive: true,
      sessionId,
    }, { merge: true });
  } catch (devErr) {
    console.warn("Could not register device under users/{uid}/devices:", devErr);
  }

  return { success: true, deviceId };
}

/**
 * Mobile action to reject a login request
 */
export async function rejectQrSession(sessionId) {
  if (!sessionId) return;
  const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    status: "rejected",
    rejectedAt: Date.now(),
  }).catch(() => {});
}

/**
 * Cancels a QR session from desktop
 */
export async function cancelQrSession(sessionId) {
  if (!sessionId) return;
  try {
    const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
  } catch (e) {
    console.warn("Error deleting cancelled QR session:", e);
  }
}

/**
 * Step 5: Desktop Login Consumption
 * Triggered when doc.status === "approved".
 * Extracts token, calls signInWithCustomToken (or authenticates user session),
 * marks status: "consumed", registers device kill-switch listener, and synchronizes session.
 */
export async function exchangeQrLoginToken({ sessionId, clientSecret }) {
  if (!sessionId) {
    throw new Error("Invalid parameters: missing sessionId.");
  }

  const sessionRef = doc(db, DEVICE_PAIRING_COLLECTION, sessionId);

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists()) {
      throw new Error("QR Session not found or was cancelled.");
    }

    const data = snap.data();

    // 1. Status verification
    if (data.status !== "approved") {
      throw new Error("Login request has not been approved on your mobile device.");
    }

    // 2. Replay attack protection
    if (data.consumed === true || data.status === "consumed" || data.status === "completed") {
      throw new Error("This QR session has already been used and cannot be replayed.");
    }

    // 3. Expiration check
    const expiry = data.expiresAt || data.expiresAtMs;
    if (expiry && Date.now() > expiry) {
      tx.update(sessionRef, { status: "expired" });
      throw new Error("QR code has expired. Please generate a new code.");
    }

    // 4. Proof-of-possession verification (if secretHash is present)
    if (clientSecret && data.secretHash) {
      const computedHash = await computeSha256(clientSecret);
      if (computedHash !== data.secretHash) {
        throw new Error("Cryptographic verification failed: Proof-of-possession secret does not match.");
      }
    }

    // 5. Mark document as "consumed"
    tx.update(sessionRef, {
      status: "consumed",
      consumed: true,
      consumedAt: Date.now(),
    });

    // 6. Extract token & user identity
    const customToken = data.customToken || data.token;
    const idToken = data.idToken;
    const uid = data.uid || data.userId || data.approverUid || data.user?.uid || "bunkmate_user";
    const email = data.email || data.user?.email || "";
    const displayName = data.displayName || data.user?.displayName || "BunkMate User";
    const photoURL = data.photoURL || `https://api.dicebear.com/9.x/glass/svg?seed=${uid}&radius=50`;
    const userData = data.userData || {};
    const approvedDevice = data.approvedDevice || null;

    // 7. Authenticate desktop Firebase Auth instance
    let firebaseUser = null;
    if (customToken) {
      try {
        const userCred = await signInWithCustomToken(auth, customToken);
        firebaseUser = userCred.user;
      } catch (authErr) {
        console.warn("[QR Auth] signInWithCustomToken notice:", authErr.message);
      }
    }

    const userObj = {
      uid: firebaseUser?.uid || uid,
      email: firebaseUser?.email || email,
      displayName: firebaseUser?.displayName || displayName,
      photoURL: firebaseUser?.photoURL || photoURL,
      userData,
      idToken: idToken || null,
      isQrAuth: true,
      linkedDeviceId: approvedDevice?.id || null,
      loginTimestamp: new Date().toISOString(),
    };

    // 8. Persist credentials and authUser in localdb (IndexedDB firebaseLocalStorageDb & localStorage)
    const rawAuthUser = data.authUser || data.credentials?.authUser || {};
    const authUserRecord = {
      apiKey: FIREBASE_API_KEY,
      appName: "[DEFAULT]",
      createdAt: String(rawAuthUser.createdAt || data.createdAt || Date.now()),
      lastLoginAt: String(Date.now()),
      displayName: displayName,
      email: email,
      emailVerified: rawAuthUser.emailVerified ?? true,
      isAnonymous: rawAuthUser.isAnonymous ?? false,
      phoneNumber: rawAuthUser.phoneNumber || null,
      photoURL: photoURL,
      providerData: (rawAuthUser.providerData && rawAuthUser.providerData.length > 0)
        ? rawAuthUser.providerData
        : [
            {
              displayName,
              email,
              phoneNumber: null,
              photoURL,
              providerId: "google.com",
              uid,
            },
          ],
      stsTokenManager: rawAuthUser.stsTokenManager || {
        refreshToken: rawAuthUser.stsTokenManager?.refreshToken || "bunkmates_auth_refresh_token",
        accessToken: customToken || idToken || "",
        expirationTime: Number(rawAuthUser.stsTokenManager?.expirationTime || (Date.now() + 3600 * 1000)),
      },
      tenantId: rawAuthUser.tenantId || null,
      uid,
      _redirectEventId: null,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("bunkmates_auth_user", JSON.stringify(userObj));
      localStorage.removeItem("bunkmates_auth_user");
      sessionStorage.setItem("bunkmates_auth_welcome", "true");

      if (approvedDevice?.id) {
        localStorage.setItem("bunkmates_linked_device_id", approvedDevice.id);
        localStorage.setItem("bunkmates_linked_uid", uid);
      }

      // Persist directly into IndexedDB firebaseLocalStorageDb and localStorage
      await saveAuthUserToLocalDb(authUserRecord, FIREBASE_API_KEY);
    }

    return {
      success: true,
      user: firebaseUser || userObj,
      approvedDevice,
      uid,
      authUser: authUserRecord,
    };
  });
}

/**
 * Remote Kill-Switch: Listens in real time to `users/{uid}/devices/{deviceId}`.
 * If the device is revoked or deleted from the mobile app's Linked Devices screen,
 * the desktop browser immediately signs out.
 */
export function listenToDeviceKillSwitch(uid, deviceId, onRevoked) {
  if (!uid || !deviceId) return () => {};

  const deviceRef = doc(db, "users", uid, "devices", deviceId);

  const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
    // If device document deleted or marked inactive
    if (!docSnap.exists() || docSnap.data()?.isActive === false) {
      console.warn("[Kill-Switch] Device session was terminated remotely from phone.");
      if (typeof window !== "undefined") {
        localStorage.removeItem("bunkmates_linked_device_id");
        localStorage.removeItem("bunkmates_linked_uid");
        sessionStorage.removeItem("bunkmates_auth_user");
        localStorage.removeItem("bunkmates_auth_user");
      }
      auth.signOut().catch(() => {});
      if (onRevoked) onRevoked();
    }
  });

  return unsubscribe;
}

/**
 * Revokes a linked device remotely (e.g. from mobile's Linked Devices list)
 */
export async function revokeLinkedDevice(uid, deviceId) {
  if (!uid || !deviceId) return;
  try {
    const deviceRef = doc(db, "users", uid, "devices", deviceId);
    await updateDoc(deviceRef, {
      isActive: false,
      revokedAt: Date.now(),
    });
  } catch (err) {
    console.warn("Could not revoke device:", err);
  }
}



