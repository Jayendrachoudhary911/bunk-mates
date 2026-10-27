/**
 * High-performance, quota-safe local storage cache for BunkMate chats & group chats.
 * Provides instant 0ms offline-first hydration and real-time reconciliation with Firestore.
 */

const STORAGE_PREFIX = "bunkmate_cache_";
const MAX_CACHED_MESSAGES = 80;

// Automatically purge any legacy chat/group message caches from localStorage
try {
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && k.includes("_msgs_")) {
        localStorage.removeItem(k);
      }
    }
  }
} catch (e) {}

/**
 * Safely parse JSON from localStorage
 */
export const getCachedData = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[chatCache] Error reading cache for ${key}:`, err);
    return fallback;
  }
};

/**
 * Safely set JSON in localStorage with quota-exceeded fallback protection
 */
export const setCachedData = (key, value) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    // If quota exceeded, clear stale chat caches
    if (err.name === "QuotaExceededError" || err.code === 22) {
      console.warn("[chatCache] Storage quota exceeded, purging oldest chat caches...");
      purgeOldCaches();
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      } catch (retryErr) {
        console.error("[chatCache] Failed even after purge:", retryErr);
      }
    }
  }
};

/**
 * Clears old chat cache entries if storage is nearing quota
 */
export const purgeOldCaches = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX) && k.includes("_msgs_")) {
        keysToRemove.push(k);
      }
    }
    // Remove half of the oldest message caches
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch (e) {
    // ignore
  }
};

/**
 * Serializes a message array for clean storage (handles Firestore Timestamps & removes massive base64 payloads)
 */
export const serializeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  // Keep the most recent messages up to MAX_CACHED_MESSAGES
  const slice = messages.slice(-MAX_CACHED_MESSAGES);
  return slice.map((msg) => {
    let timestampSeconds = null;
    let timestampIso = null;

    if (msg.timestamp) {
      if (typeof msg.timestamp.toDate === "function") {
        const d = msg.timestamp.toDate();
        timestampSeconds = Math.floor(d.getTime() / 1000);
        timestampIso = d.toISOString();
      } else if (msg.timestamp.seconds != null) {
        timestampSeconds = msg.timestamp.seconds;
        timestampIso = new Date(msg.timestamp.seconds * 1000).toISOString();
      } else if (typeof msg.timestamp === "string" || typeof msg.timestamp === "number") {
        const d = new Date(msg.timestamp);
        timestampSeconds = Math.floor(d.getTime() / 1000);
        timestampIso = d.toISOString();
      }
    }

    return {
      ...msg,
      timestamp: timestampSeconds ? { seconds: timestampSeconds } : null,
      timestampIso: timestampIso || null,
      // If dataUri is excessively long (>100kb), don't bloat localStorage, keep thumbnail flag or original if small
      dataUri: msg.dataUri && msg.dataUri.length > 150000 ? null : msg.dataUri,
    };
  });
};

/**
 * Format message timestamps safely from any format (Firestore Timestamp, serialized seconds, or ISO string)
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    let date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds != null) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string" || typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      return "";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

/**
 * User profiles cache to prevent hammering Firestore users collection
 */
const inMemoryUserCache = new Map();

export const getCachedUser = (uid) => {
  if (!uid) return null;
  if (inMemoryUserCache.has(uid)) return inMemoryUserCache.get(uid);
  const cached = getCachedData(`user_${uid}`, null);
  if (cached) {
    inMemoryUserCache.set(uid, cached);
  }
  return cached;
};

export const setCachedUser = (uid, userData) => {
  if (!uid || !userData) return;
  inMemoryUserCache.set(uid, userData);
  setCachedData(`user_${uid}`, userData);
};

const chatCache = {
  getCachedData,
  setCachedData,
  serializeMessages,
  formatMessageTime,
  getCachedUser,
  setCachedUser,
};

export default chatCache;
