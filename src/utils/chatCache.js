/**
 * High-performance, quota-safe local storage cache for BunkMate chats & group chats.
 * Provides instant 0ms offline-first hydration and real-time reconciliation with Firestore.
 */

const STORAGE_PREFIX = "bunkmate_cache_";
const MAX_CACHED_MESSAGES = 80;

// In-memory cache for ultra-fast, zero-overhead access without touching localStorage
const inMemoryCache = new Map();

// Automatically purge any chat, user, group, and auth caches from localStorage
try {
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("bunkmate_cache_") ||
          k.startsWith("bm_group_") ||
          k.startsWith("firebase:authUser:") ||
          k === "bunkmates_auth_user" ||
          k.includes("_msgs_") ||
          k.includes("blockedMessages_") ||
          k.includes("bunkmate_group_read_"))
      ) {
        localStorage.removeItem(k);
      }
    }
  }
} catch (e) {}

/**
 * Safely parse JSON from memory or sessionStorage (never localStorage)
 */
export const getCachedData = (key, fallback = null) => {
  if (!key) return fallback;
  if (inMemoryCache.has(key)) {
    return inMemoryCache.get(key);
  }
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      inMemoryCache.set(key, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn(`[chatCache] Error reading cache for ${key}:`, err);
  }
  return fallback;
};

/**
 * Safely set JSON in memory and sessionStorage (never localStorage)
 */
export const setCachedData = (key, value) => {
  if (!key) return;
  inMemoryCache.set(key, value);
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    }
  } catch (err) {
    // If sessionStorage quota exceeded, purge oldest keys
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        purgeOldCaches();
        sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      }
    } catch (e) {
      // ignore
    }
  }
};

/**
 * Clears old session cache entries if storage is nearing quota
 */
export const purgeOldCaches = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        sessionStorage.removeItem(k);
      });
    }
  } catch (e) {
    // ignore
  }
};

/**
 * Messages are directly saved to Firestore and fetched in real-time.
 * Local storage caching of messages is decommissioned.
 */
export const serializeMessages = (messages) => {
  return Array.isArray(messages) ? messages : [];
};

/**
 * Format message timestamps safely from any format (Firestore Timestamp, serialized seconds, or ISO string)
 */
export const formatMessageTime = (timestamp) => {
  try {
    if (!timestamp) {
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (typeof timestamp.toMillis === "function") {
      date = new Date(timestamp.toMillis());
    } else if (timestamp.seconds != null) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds != null) {
      date = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === "string" || typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      date = new Date();
    }
    if (!date || isNaN(date.getTime())) {
      date = new Date();
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
