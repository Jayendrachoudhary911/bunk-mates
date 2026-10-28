/**
 * src/utils/chatIndexedDB.js
 *
 * IndexedDB chat and message storage has been decommissioned.
 * All direct chats, group chats, and message streams are fetched directly in real-time from Firestore.
 * This module cleans up any existing legacy IndexedDB database and cache entries from client browsers.
 */

// Purge legacy IndexedDB database if it exists
if (typeof window !== "undefined" && window.indexedDB) {
  try {
    const delReq = window.indexedDB.deleteDatabase("bunkmates_chat_store");
    delReq.onsuccess = () => {};
    delReq.onerror = () => {};
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Purge any legacy localStorage message or metadata cache items
try {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem("bunkmate_chat_meta_map");
    localStorage.removeItem("bunkmates_auth_user");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("bunkmate_cache_") ||
          key.startsWith("bm_group_") ||
          key.startsWith("firebase:authUser:") ||
          key === "bunkmates_auth_user" ||
          key.includes("blockedMessages_") ||
          key.includes("bunkmate_group_read_"))
      ) {
        localStorage.removeItem(key);
      }
    }
  }
} catch (e) {
  // Ignore cleanup errors
}

// Safe no-op exports for backward compatibility
export function getCachedMessagesSync() {
  return [];
}

export async function getMessagesFromDB() {
  return [];
}

export async function saveMessagesToDB() {}

export async function saveChatMetaToDB() {}

export async function getAllChatMetaFromDB() {
  return {};
}

export async function saveLastMessageToDB() {}

export function getAllChatMetaSync() {
  return {};
}

export function hasChatMeta() {
  return false;
}

export function getChatMetaSync() {
  return null;
}

export async function batchSaveChatMetaToDB() {}

export async function markChatAsReadInDB() {}

const chatIndexedDB = {
  getCachedMessagesSync,
  getMessagesFromDB,
  saveMessagesToDB,
  saveChatMetaToDB,
  getAllChatMetaFromDB,
  saveLastMessageToDB,
  getAllChatMetaSync,
  hasChatMeta,
  getChatMetaSync,
  batchSaveChatMetaToDB,
  markChatAsReadInDB,
};

export default chatIndexedDB;
