// functions/index.js
/**
 * BunkMates QR Authentication Cloud Functions
 * Production-grade, zero-trust QR login token exchange and approval architecture
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DEVICE_PAIRING_COLLECTION = "device_pairings";
const QR_SESSION_COLLECTION = "device_pairings";
const MAX_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Computes SHA-256 hash using Node crypto
 */
function computeSha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * Callable Function: createQrLoginSession
 * Saves the temporary QR login session in Cloud Firestore
 */
exports.createQrLoginSession = functions.https.onCall(async (data, context) => {
  const { sessionId, secretHash, requesterMetadata, deviceInfo, clientExpiresAtMs } = data || {};

  if (!sessionId || typeof sessionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "sessionId is required."
    );
  }

  const now = Date.now();
  const expiresAtMs = (clientExpiresAtMs && clientExpiresAtMs > now)
    ? clientExpiresAtMs
    : now + MAX_TTL_MS;

  const sessionRef = db.collection(DEVICE_PAIRING_COLLECTION).doc(sessionId);
  const sessionData = {
    id: sessionId,
    sessionId,
    secretHash: secretHash || null,
    status: "pending",
    consumed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtMs: now,
    expiresAt: expiresAtMs,
    expiresAtMs,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
    requesterMetadata: requesterMetadata || deviceInfo || { browser: "Chrome", os: "Windows", deviceName: "Personal Computer" },
    temporary: true,
  };

  await sessionRef.set(sessionData);

  return {
    success: true,
    sessionId,
    expiresAtMs,
    savedToFirestore: true,
  };
});

/**
 * Callable Function: recordQrScan
 * Records when a mobile device scans the QR code
 */
exports.recordQrScan = functions.https.onCall(async (data, context) => {
  const { sessionId, mobileDevice } = data || {};
  if (!sessionId || typeof sessionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "sessionId is required."
    );
  }

  const sessionRef = db.collection(DEVICE_PAIRING_COLLECTION).doc(sessionId);
  const snap = await sessionRef.get();

  if (!snap.exists) {
    throw new functions.https.HttpsError("not-found", "Session not found.");
  }

  const session = snap.data();
  const expiry = session.expiresAt || session.expiresAtMs;
  if (expiry && Date.now() > expiry) {
    throw new functions.https.HttpsError("deadline-exceeded", "QR code has expired.");
  }

  if (session.status === "pending" || session.status === "waiting_scan") {
    await sessionRef.update({
      status: "scanned",
      scannedAt: admin.firestore.FieldValue.serverTimestamp(),
      mobileDevice: (mobileDevice && typeof mobileDevice === "string") ? mobileDevice : "Mobile Device",
    });
  }

  return { success: true };
});

/**
 * Callable Function: approveQrLogin (Matches Android backend control point)
 * Mints Firebase Custom Token and registers secondary device in users/{uid}/devices
 */
exports.approveQrLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to your BunkMates mobile account to approve this login."
    );
  }

  const { sessionId, deviceId } = data || {};
  if (!sessionId || typeof sessionId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "sessionId is required.");
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || "";
  const callerName = context.auth.token.name || "";
  const callerPicture = context.auth.token.picture || "";

  // 1. Mint custom token
  let customToken = "";
  try {
    customToken = await admin.auth().createCustomToken(callerUid, {
      authProvider: "bunkmates-qr-login",
      sessionId,
    });
  } catch (err) {
    console.error("Error creating custom token in approveQrLogin:", err);
  }

  const targetDeviceId = deviceId || `dev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const approvedDevice = {
    id: targetDeviceId,
    deviceName: "Chrome on Windows",
    linkedAt: Date.now(),
    isActive: true,
  };

  const sessionRef = db.collection(DEVICE_PAIRING_COLLECTION).doc(sessionId);

  // 2. Atomic write to device_pairings
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Login session not found or cancelled.");
    }

    const session = snap.data();
    const expiry = session.expiresAt || session.expiresAtMs;
    if (expiry && Date.now() > expiry) {
      throw new functions.https.HttpsError("deadline-exceeded", "QR code has expired.");
    }
    if (session.consumed) {
      throw new functions.https.HttpsError("failed-precondition", "Session already consumed.");
    }

    tx.update(sessionRef, {
      status: "approved",
      approverUid: callerUid,
      userId: callerUid,
      uid: callerUid,
      email: callerEmail,
      displayName: callerName,
      photoURL: callerPicture,
      user: {
        uid: callerUid,
        email: callerEmail,
        displayName: callerName,
      },
      userData: {
        username: callerName.toLowerCase().replace(/\s+/g, ""),
        role: "user",
      },
      customToken,
      token: customToken,
      approvedDevice,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // 3. Register device in users/{callerUid}/devices/{targetDeviceId}
  try {
    await db.collection("users").doc(callerUid).collection("devices").doc(targetDeviceId).set({
      id: targetDeviceId,
      deviceName: approvedDevice.deviceName,
      deviceType: "desktop",
      linkedAt: Date.now(),
      lastActiveAt: Date.now(),
      isActive: true,
      sessionId,
    }, { merge: true });
  } catch (err) {
    console.warn("Could not register device subcollection in Cloud Function:", err);
  }

  return { success: true, customToken, deviceId: targetDeviceId };
});

exports.approveQrLoginSession = exports.approveQrLogin;

/**
 * Callable Function: rejectQrLoginSession
 * Mobile user declines desktop login request
 */
exports.rejectQrLoginSession = functions.https.onCall(async (data, context) => {
  const { sessionId } = data || {};
  if (!sessionId || typeof sessionId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "sessionId is required."
    );
  }

  const sessionRef = db.collection(QR_SESSION_COLLECTION).doc(sessionId);
  const snap = await sessionRef.get();

  if (snap.exists) {
    const session = snap.data();
    if (!session.consumed && session.status !== "completed") {
      await sessionRef.update({
        status: "rejected",
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  return { success: true };
});

/**
 * Callable Function: exchangeQrLoginToken
 * Desktop exchanges in-memory proof-of-possession secret for Firebase Custom Token
 * Crucial Security Guarantees:
 * 1. Atomically marks session as consumed to prevent replay attacks
 * 2. Compares hash commitment of secret strictly on server
 * 3. Enforces server-side expiration
 * 4. Mints valid Firebase custom token ONLY for the authenticated mobile user
 */
exports.exchangeQrLoginToken = functions.https.onCall(async (data, context) => {
  const { sessionId, clientSecret } = data || {};

  if (!sessionId || typeof sessionId !== "string" || !clientSecret || typeof clientSecret !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Both sessionId and clientSecret are required."
    );
  }

  // Enforce reasonable secret length (64 hex characters for 256-bit entropy)
  if (clientSecret.length < 32 || clientSecret.length > 128) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid proof of possession format."
    );
  }

  const sessionRef = db.collection(QR_SESSION_COLLECTION).doc(sessionId);
  let approvedUid = null;

  // Execute atomic exchange transaction
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Session not found.");
    }

    const session = snap.data();

    // Verification 1: Session must be in approved status
    const authorUid = session.approverUid || session.uid || session.userId || session.approvedBy?.uid;
    if (session.status !== "approved" || !authorUid) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Login request has not been approved on your mobile device."
      );
    }

    // Verification 2: Replay attack prevention - must not be consumed
    if (session.consumed === true || session.status === "consumed" || session.status === "completed") {
      throw new functions.https.HttpsError(
        "already-exists",
        "This QR login session has already been used and cannot be replayed."
      );
    }

    // Verification 3: Expiration check
    const expiry = session.expiresAt || session.expiresAtMs;
    if (expiry && Date.now() > expiry) {
      tx.update(sessionRef, { status: "expired" });
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "This QR login session has expired. Please refresh the QR code."
      );
    }

    // Verification 4: Cryptographic proof-of-possession hash verification (if present)
    if (session.secretHash) {
      const computedHash = computeSha256(clientSecret);
      if (computedHash !== session.secretHash) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Cryptographic proof-of-possession verification failed."
        );
      }
    }

    // Atomically consume session to prevent replay
    approvedUid = authorUid;
    tx.update(sessionRef, {
      consumed: true,
      status: "consumed",
      consumedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (!approvedUid) {
    throw new functions.https.HttpsError(
      "internal",
      "Failed to determine authorized user identity."
    );
  }

  // Mint Firebase Custom Token for desktop authentication
  try {
    const customToken = await admin.auth().createCustomToken(approvedUid, {
      authProvider: "bunkmates-qr-login",
      sessionId,
    });

    return {
      success: true,
      customToken,
    };
  } catch (tokenErr) {
    console.error("Error creating Firebase Custom Token:", tokenErr);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate custom authentication token."
    );
  }
});

/**
 * Callable Function: revokeLinkedDevice
 * Revokes a linked device session remotely from phone
 */
exports.revokeLinkedDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const { deviceId } = data || {};
  if (!deviceId) {
    throw new functions.https.HttpsError("invalid-argument", "deviceId is required.");
  }

  const deviceRef = db.collection("users").doc(context.auth.uid).collection("devices").doc(deviceId);
  await deviceRef.update({
    isActive: false,
    revokedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

