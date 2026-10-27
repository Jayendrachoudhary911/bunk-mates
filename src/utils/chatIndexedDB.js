/**
 * src/utils/chatIndexedDB.js
 *
 * High-performance, quota-limitless IndexedDB storage for BunkMate chat and group chat messages.
 * Provides instant 0ms offline-first retrieval, prevents browser UI thread locking,
 * and eliminates white screen blank loads during refreshes.
 */

const DB_NAME = "bunkmates_chat_store";
const DB_VERSION = 1;
const MESSAGES_STORE = "messages";
const META_STORE = "chat_metadata";

// Synchronous memory cache for 0ms initial React hydration
const memoryMessagesCache = new Map();
const memoryMetaCache = new Map();

// Eagerly preload memoryMetaCache from localStorage on module initialization for 0ms sync access
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const rawChat = localStorage.getItem("bunkmate_chat_meta_map");
    if (rawChat) {
      const parsed = JSON.parse(rawChat);
      Object.entries(parsed).forEach(([k, v]) => memoryMetaCache.set(k, v));
    }
    const rawGroup = localStorage.getItem("bunkmate_group_meta_map");
    if (rawGroup) {
      const parsed = JSON.parse(rawGroup);
      Object.entries(parsed).forEach(([k, v]) => memoryMetaCache.set(k, v));
    }
  }
} catch (e) {}

let dbPromise = null;

function getDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, { keyPath: "chatKey" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "chatKey" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = (event) => {
      console.warn("[chatIndexedDB] Failed to open IndexedDB:", event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

/**
 * Get messages synchronously from memory cache if available (0ms latency)
 */
export function getCachedMessagesSync(chatKey) {
  if (!chatKey) return [];
  if (memoryMessagesCache.has(chatKey)) {
    return memoryMessagesCache.get(chatKey);
  }
  // Fallback to localStorage for first bootstrap
  try {
    const raw = localStorage.getItem(`bunkmate_cache_chat_msgs_${chatKey}`) ||
                localStorage.getItem(`bunkmate_cache_group_msgs_${chatKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryMessagesCache.set(chatKey, parsed);
        return parsed;
      }
    }
  } catch (e) {}
  return [];
}

/**
 * Retrieves cached messages for a given chatKey from IndexedDB
 */
export async function getMessagesFromDB(chatKey) {
  if (!chatKey) return [];
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([MESSAGES_STORE], "readonly");
      const store = transaction.objectStore(MESSAGES_STORE);
      const req = store.get(chatKey);

      req.onsuccess = () => {
        const result = req.result;
        if (result && Array.isArray(result.messages)) {
          memoryMessagesCache.set(chatKey, result.messages);
          resolve(result.messages);
        } else {
          resolve(getCachedMessagesSync(chatKey));
        }
      };

      req.onerror = () => {
        resolve(getCachedMessagesSync(chatKey));
      };
    });
  } catch (err) {
    return getCachedMessagesSync(chatKey);
  }
}

/**
 * Serializes and saves messages for the selected chat into IndexedDB
 */
export async function saveMessagesToDB(chatKey, messages) {
  if (!chatKey || !Array.isArray(messages)) return;

  // Clone and sanitize messages for structured cloning
  const sanitized = messages.slice(-150).map((m) => {
    let timestampSeconds = null;
    let timestampIso = null;

    if (m.timestamp) {
      if (typeof m.timestamp.toDate === "function") {
        const d = m.timestamp.toDate();
        timestampSeconds = Math.floor(d.getTime() / 1000);
        timestampIso = d.toISOString();
      } else if (m.timestamp.seconds != null) {
        timestampSeconds = m.timestamp.seconds;
        timestampIso = new Date(m.timestamp.seconds * 1000).toISOString();
      } else if (typeof m.timestamp === "string" || typeof m.timestamp === "number") {
        const d = new Date(m.timestamp);
        timestampSeconds = Math.floor(d.getTime() / 1000);
        timestampIso = d.toISOString();
      }
    }

    return {
      ...m,
      timestamp: timestampSeconds ? { seconds: timestampSeconds } : null,
      timestampIso: timestampIso || null,
    };
  });

  // Update in-memory cache instantly
  memoryMessagesCache.set(chatKey, sanitized);

  try {
    const db = await getDB();
    const transaction = db.transaction([MESSAGES_STORE], "readwrite");
    const store = transaction.objectStore(MESSAGES_STORE);
    store.put({
      chatKey,
      messages: sanitized,
      updatedAt: Date.now(),
    });
  } catch (err) {
    // If IndexedDB fails, keep in memory cache
    console.warn(`[chatIndexedDB] Error persisting messages for ${chatKey}:`, err);
  }
}

/**
 * Saves chat metadata (e.g. snippet, unread count, last timestamp)
 */
export async function saveChatMetaToDB(chatKey, meta) {
  if (!chatKey || !meta) return;
  memoryMetaCache.set(chatKey, meta);

  try {
    const db = await getDB();
    const transaction = db.transaction([META_STORE], "readwrite");
    const store = transaction.objectStore(META_STORE);
    store.put({
      chatKey,
      ...meta,
      updatedAt: Date.now(),
    });
  } catch (err) {
    // ignore
  }
}

/**
 * Gets all stored chat metadata (useful for rendering Chats list instantly)
 */
export async function getAllChatMetaFromDB() {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([META_STORE], "readonly");
      const store = transaction.objectStore(META_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = req.result || [];
        const map = {};
        list.forEach((item) => {
          if (item.chatKey) {
            map[item.chatKey] = item;
            memoryMetaCache.set(item.chatKey, item);
          }
        });
        resolve(map);
      };

      req.onerror = () => {
        resolve({});
      };
    });
  } catch (err) {
    return {};
  }
}

/**
 * Saves the latest message, timestamp and unread count for a chat in IndexedDB and memory
 */
export async function saveLastMessageToDB(chatId, { lastMessage, timestamp, unreadCount = 0, isGroup = false }) {
  if (!chatId) return;

  let tsMillis = 0;
  if (timestamp) {
    if (typeof timestamp.toDate === "function") {
      tsMillis = timestamp.toDate().getTime();
    } else if (timestamp instanceof Date) {
      tsMillis = timestamp.getTime();
    } else if (timestamp.seconds != null) {
      tsMillis = timestamp.seconds * 1000;
    } else if (typeof timestamp === "number") {
      tsMillis = timestamp;
    } else if (typeof timestamp === "string") {
      tsMillis = new Date(timestamp).getTime();
    }
  }

  const metaObj = {
    chatKey: chatId,
    lastMessage: typeof lastMessage === "string" ? lastMessage : (lastMessage?.text || "No messages yet"),
    timestamp: tsMillis || Date.now(),
    unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
    isGroup: Boolean(isGroup),
    updatedAt: Date.now(),
  };

  memoryMetaCache.set(chatId, metaObj);

  // Backup to localStorage for sync recovery on fresh tab
  try {
    const key = isGroup ? "bunkmate_group_meta_map" : "bunkmate_chat_meta_map";
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[chatId] = metaObj;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {}

  // Broadcast to other components in 0ms without Firestore network calls
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bm_last_message_updated", {
        detail: { chatId, ...metaObj },
      })
    );
  }

  try {
    const db = await getDB();
    const transaction = db.transaction([META_STORE], "readwrite");
    const store = transaction.objectStore(META_STORE);
    store.put(metaObj);
  } catch (err) {
    // ignore
  }
}

/**
 * Synchronous retrieval of cached chat metadata map
 */
export function getAllChatMetaSync(isGroup = false) {
  const map = {};
  for (const [key, val] of memoryMetaCache.entries()) {
    if (Boolean(val.isGroup) === Boolean(isGroup)) {
      map[key] = val;
    }
  }
  try {
    const key = isGroup ? "bunkmate_group_meta_map" : "bunkmate_chat_meta_map";
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return { ...stored, ...map };
  } catch (e) {
    return map;
  }
}

/**
 * Check if a chat's metadata is already cached locally (memory or localStorage)
 */
export function hasChatMeta(chatId) {
  if (!chatId) return false;
  if (memoryMetaCache.has(chatId)) return true;
  try {
    const chatStored = JSON.parse(localStorage.getItem("bunkmate_chat_meta_map") || "{}");
    if (chatStored[chatId]) return true;
    const groupStored = JSON.parse(localStorage.getItem("bunkmate_group_meta_map") || "{}");
    if (groupStored[chatId]) return true;
  } catch (e) {}
  return false;
}

/**
 * Synchronous get for a single chat's metadata
 */
export function getChatMetaSync(chatId) {
  if (!chatId) return null;
  if (memoryMetaCache.has(chatId)) return memoryMetaCache.get(chatId);
  try {
    const chatStored = JSON.parse(localStorage.getItem("bunkmate_chat_meta_map") || "{}");
    if (chatStored[chatId]) return chatStored[chatId];
    const groupStored = JSON.parse(localStorage.getItem("bunkmate_group_meta_map") || "{}");
    if (groupStored[chatId]) return groupStored[chatId];
  } catch (e) {}
  return null;
}

/**
 * Batch saves multiple last messages to IndexedDB in a single transaction
 */
export async function batchSaveChatMetaToDB(metaList) {
  if (!Array.isArray(metaList) || metaList.length === 0) return;

  const chatLocalStorageUpdates = {};
  const groupLocalStorageUpdates = {};

  metaList.forEach((item) => {
    if (!item.chatId) return;
    const isGroup = Boolean(item.isGroup);
    let tsMillis = 0;
    const timestamp = item.timestamp;
    if (timestamp) {
      if (typeof timestamp.toDate === "function") {
        tsMillis = timestamp.toDate().getTime();
      } else if (timestamp instanceof Date) {
        tsMillis = timestamp.getTime();
      } else if (timestamp.seconds != null) {
        tsMillis = timestamp.seconds * 1000;
      } else if (typeof timestamp === "number") {
        tsMillis = timestamp;
      } else if (typeof timestamp === "string") {
        tsMillis = new Date(timestamp).getTime();
      }
    }

    const metaObj = {
      chatKey: item.chatId,
      lastMessage: typeof item.lastMessage === "string" ? item.lastMessage : (item.lastMessage?.text || "No messages yet"),
      timestamp: tsMillis || Date.now(),
      unreadCount: typeof item.unreadCount === "number" ? item.unreadCount : 0,
      isGroup,
      updatedAt: Date.now(),
    };

    memoryMetaCache.set(item.chatId, metaObj);
    if (isGroup) {
      groupLocalStorageUpdates[item.chatId] = metaObj;
    } else {
      chatLocalStorageUpdates[item.chatId] = metaObj;
    }
  });

  // Bulk update localStorage
  try {
    if (Object.keys(chatLocalStorageUpdates).length > 0) {
      const existing = JSON.parse(localStorage.getItem("bunkmate_chat_meta_map") || "{}");
      Object.assign(existing, chatLocalStorageUpdates);
      localStorage.setItem("bunkmate_chat_meta_map", JSON.stringify(existing));
    }
    if (Object.keys(groupLocalStorageUpdates).length > 0) {
      const existing = JSON.parse(localStorage.getItem("bunkmate_group_meta_map") || "{}");
      Object.assign(existing, groupLocalStorageUpdates);
      localStorage.setItem("bunkmate_group_meta_map", JSON.stringify(existing));
    }
  } catch (e) {}

  // Bulk transaction in IndexedDB
  try {
    const db = await getDB();
    const transaction = db.transaction([META_STORE], "readwrite");
    const store = transaction.objectStore(META_STORE);
    metaList.forEach((item) => {
      const meta = memoryMetaCache.get(item.chatId);
      if (meta) store.put(meta);
    });
  } catch (err) {
    // ignore
  }
}

/**
 * Marks a chat or group chat as read (unreadCount: 0) in memory, localStorage, and IndexedDB
 */
export async function markChatAsReadInDB(chatId, isGroup = false) {
  if (!chatId) return;
  const existing = memoryMetaCache.get(chatId);
  const updatedMeta = {
    ...(existing || {}),
    chatKey: chatId,
    unreadCount: 0,
    isGroup: Boolean(isGroup),
    updatedAt: Date.now(),
  };

  memoryMetaCache.set(chatId, updatedMeta);

  // Update localStorage map
  try {
    const key = isGroup ? "bunkmate_group_meta_map" : "bunkmate_chat_meta_map";
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    if (stored[chatId]) {
      stored[chatId].unreadCount = 0;
      stored[chatId].updatedAt = Date.now();
    } else {
      stored[chatId] = updatedMeta;
    }
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (e) {}

  // Broadcast to other components in 0ms
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bm_last_message_updated", {
        detail: { chatId, ...updatedMeta, unreadCount: 0 },
      })
    );
  }

  // Update IndexedDB store
  try {
    const db = await getDB();
    const transaction = db.transaction([META_STORE], "readwrite");
    const store = transaction.objectStore(META_STORE);
    store.put(updatedMeta);
  } catch (err) {}
}


