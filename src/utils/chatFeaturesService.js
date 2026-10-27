// src/utils/chatFeaturesService.js
/**
 * Global Chat Features Service
 * Handles:
 * 1. Active Chat Tracking (suppresses notifications for currently opened chat/group)
 * 2. Muted Chats & Groups Management
 * 3. In-App Notifications Preferences
 * 4. Starred / Favorite Chats & Groups
 * 5. Custom Chat Lists (Folders)
 * 6. Disappearing Messages Duration Configuration
 */

import { db, auth } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const STORAGE_KEYS = {
  MUTED_CHATS: "bm_muted_chats_v1",
  FAVORITE_CHATS: "bm_favorite_chats_v1",
  PINNED_CHATS: "bm_pinned_chats_v1",
  UNREAD_CHATS: "bm_unread_override_chats_v1",
  CHAT_LISTS: "bm_custom_chat_lists_v1",
  IN_APP_NOTIFS: "bm_in_app_notifs_enabled",
  DISAPPEARING_SETTINGS: "bm_disappearing_settings_v1",
};

// ─── 1. Active Chat Tracker (Memory Singleton) ───────────────────────────
let currentActiveChat = null; // { type: 'direct' | 'group', id, friendId, groupName }
const activeChatListeners = new Set();

export const setActiveChat = (chatInfo) => {
  currentActiveChat = chatInfo;
  activeChatListeners.forEach((fn) => {
    try {
      fn(currentActiveChat);
    } catch {}
  });

  // Sync to Firestore user profile so friends/groups know we have this chat open
  try {
    const uid = auth?.currentUser?.uid;
    if (uid && chatInfo) {
      updateDoc(doc(db, "users", uid), {
        activeChat: {
          id: chatInfo.id || null,
          friendId: chatInfo.friendId || null,
          groupName: chatInfo.groupName || null,
          updatedAt: Date.now(),
        },
      }).catch(() => {});
    }
  } catch {}
};

export const clearActiveChat = () => {
  currentActiveChat = null;
  activeChatListeners.forEach((fn) => {
    try {
      fn(null);
    } catch {}
  });

  // Clear activeChat in Firestore
  try {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      updateDoc(doc(db, "users", uid), {
        activeChat: null,
      }).catch(() => {});
    }
  } catch {}
};

export const getActiveChat = () => currentActiveChat;

export const isChatCurrentlyActive = (chatIdOrName) => {
  if (!currentActiveChat || !chatIdOrName) return false;
  const target = String(chatIdOrName).toLowerCase();
  if (currentActiveChat.id && String(currentActiveChat.id).toLowerCase() === target) return true;
  if (currentActiveChat.friendId && String(currentActiveChat.friendId).toLowerCase() === target) return true;
  if (currentActiveChat.groupName && String(currentActiveChat.groupName).toLowerCase() === target) return true;
  return false;
};

export const subscribeActiveChat = (listener) => {
  activeChatListeners.add(listener);
  return () => activeChatListeners.delete(listener);
};

// ─── 2. In-App Notifications Preference ──────────────────────────────────
export const isInAppNotificationsEnabled = () => {
  const val = localStorage.getItem(STORAGE_KEYS.IN_APP_NOTIFS);
  return val === null ? true : val === "true";
};

export const setInAppNotificationsEnabled = (enabled) => {
  localStorage.setItem(STORAGE_KEYS.IN_APP_NOTIFS, String(enabled));
  window.dispatchEvent(new CustomEvent("bm_in_app_notifs_changed", { detail: enabled }));
};

// ─── 3. Muted Chats & Groups Management ──────────────────────────────────
export const getMutedChats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MUTED_CHATS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const isChatMuted = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const muted = getMutedChats();
  const entry = muted[String(chatIdOrName)];
  if (!entry) return false;
  if (entry.until && entry.until < Date.now()) {
    // Expired mute, cleanup
    unmuteChat(chatIdOrName);
    return false;
  }
  return true;
};

export const muteChat = (chatIdOrName, durationMs = null) => {
  if (!chatIdOrName) return;
  const muted = getMutedChats();
  muted[String(chatIdOrName)] = {
    mutedAt: Date.now(),
    until: durationMs ? Date.now() + durationMs : null, // null means forever / until unmuted
  };
  localStorage.setItem(STORAGE_KEYS.MUTED_CHATS, JSON.stringify(muted));
  window.dispatchEvent(new CustomEvent("bm_chat_mute_changed", { detail: { id: chatIdOrName, muted: true } }));

  try {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      updateDoc(doc(db, "users", uid), {
        [`mutedChats.${chatIdOrName}`]: durationMs ? Date.now() + durationMs : true,
      }).catch(() => {});
    }
  } catch {}
};

export const unmuteChat = (chatIdOrName) => {
  if (!chatIdOrName) return;
  const muted = getMutedChats();
  delete muted[String(chatIdOrName)];
  localStorage.setItem(STORAGE_KEYS.MUTED_CHATS, JSON.stringify(muted));
  window.dispatchEvent(new CustomEvent("bm_chat_mute_changed", { detail: { id: chatIdOrName, muted: false } }));

  try {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      updateDoc(doc(db, "users", uid), {
        [`mutedChats.${chatIdOrName}`]: null,
      }).catch(() => {});
    }
  } catch {}
};

export const toggleMuteChat = (chatIdOrName, durationMs = null) => {
  if (isChatMuted(chatIdOrName)) {
    unmuteChat(chatIdOrName);
    return false;
  } else {
    muteChat(chatIdOrName, durationMs);
    return true;
  }
};

// ─── 4. Starred / Favorite Chats & Groups ────────────────────────────────
export const getFavoriteChats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITE_CHATS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isChatFavorite = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const favorites = getFavoriteChats();
  return favorites.includes(String(chatIdOrName));
};

export const toggleFavoriteChat = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const id = String(chatIdOrName);
  const favorites = getFavoriteChats();
  let updated;
  let isFav;
  if (favorites.includes(id)) {
    updated = favorites.filter((f) => f !== id);
    isFav = false;
  } else {
    updated = [...favorites, id];
    isFav = true;
  }
  localStorage.setItem(STORAGE_KEYS.FAVORITE_CHATS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_favorite_chats_changed", { detail: updated }));
  return isFav;
};

// ─── 5. Custom Chat Lists (Folders) ──────────────────────────────────────
export const DEFAULT_CHAT_LISTS = [
  { id: "unread", name: "Unread", isSystem: true, icon: "mark_chat_unread" },
  { id: "favorites", name: "Favorites", isSystem: true, icon: "star" },
  { id: "groups", name: "Groups", isSystem: true, icon: "groups" },
];

export const getCustomChatLists = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_LISTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const createCustomChatList = ({ name, icon = "folder", chatIds = [] }) => {
  if (!name || !name.trim()) return null;
  const lists = getCustomChatLists();
  const newList = {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    icon,
    chatIds: Array.isArray(chatIds) ? chatIds : [],
    createdAt: Date.now(),
  };
  const updated = [...lists, newList];
  localStorage.setItem(STORAGE_KEYS.CHAT_LISTS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_custom_lists_changed", { detail: updated }));
  return newList;
};

export const updateCustomChatList = (listId, updates) => {
  const lists = getCustomChatLists();
  const updated = lists.map((l) => (l.id === listId ? { ...l, ...updates } : l));
  localStorage.setItem(STORAGE_KEYS.CHAT_LISTS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_custom_lists_changed", { detail: updated }));
};

export const deleteCustomChatList = (listId) => {
  const lists = getCustomChatLists();
  const updated = lists.filter((l) => l.id !== listId);
  localStorage.setItem(STORAGE_KEYS.CHAT_LISTS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_custom_lists_changed", { detail: updated }));
};

export const toggleChatInList = (listId, chatIdOrName) => {
  const lists = getCustomChatLists();
  const list = lists.find((l) => l.id === listId);
  if (!list) return;
  const id = String(chatIdOrName);
  const exists = (list.chatIds || []).includes(id);
  const updatedChatIds = exists
    ? list.chatIds.filter((c) => c !== id)
    : [...(list.chatIds || []), id];
  updateCustomChatList(listId, { chatIds: updatedChatIds });
};

// ─── 6. Disappearing Messages Duration Configuration ─────────────────────
export const DISAPPEARING_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 24 * 60 * 60 * 1000, label: "24 Hours" },
  { value: 7 * 24 * 60 * 60 * 1000, label: "7 Days" },
  { value: 90 * 24 * 60 * 60 * 1000, label: "90 Days" },
];

export const getChatDisappearingDuration = (chatIdOrName, fallbackDocDuration = null) => {
  if (fallbackDocDuration !== null && fallbackDocDuration !== undefined && Number(fallbackDocDuration) >= 0) {
    if (Number(fallbackDocDuration) > 0) return Number(fallbackDocDuration);
  }
  if (!chatIdOrName) return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISAPPEARING_SETTINGS);
    const settings = raw ? JSON.parse(raw) : {};
    return settings[String(chatIdOrName)] || 0;
  } catch {
    return 0;
  }
};

export const setChatDisappearingDuration = (chatIdOrName, durationMs, type = "direct") => {
  if (!chatIdOrName) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISAPPEARING_SETTINGS);
    const settings = raw ? JSON.parse(raw) : {};
    if (durationMs > 0) {
      settings[String(chatIdOrName)] = durationMs;
    } else {
      delete settings[String(chatIdOrName)];
    }
    localStorage.setItem(STORAGE_KEYS.DISAPPEARING_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent("bm_disappearing_changed", {
        detail: { id: chatIdOrName, durationMs },
      })
    );

    // Sync to Firestore chat or group document
    const collName = type === "group" ? "groupChats" : "chats";
    updateDoc(doc(db, collName, String(chatIdOrName)), {
      disappearingDuration: durationMs > 0 ? durationMs : 0,
    }).catch(() => {});
  } catch {}
};

export const isMessageExpired = (msg) => {
  if (!msg) return false;
  if (!msg.expiresAt) return false;
  return Number(msg.expiresAt) < Date.now();
};

// ─── 7. Pinned Chats Management ──────────────────────────────────────────
export const getPinnedChats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PINNED_CHATS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isChatPinned = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const pinned = getPinnedChats();
  return pinned.includes(String(chatIdOrName));
};

export const togglePinChat = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const id = String(chatIdOrName);
  const pinned = getPinnedChats();
  let updated;
  let isPinned;
  if (pinned.includes(id)) {
    updated = pinned.filter((p) => p !== id);
    isPinned = false;
  } else {
    updated = [id, ...pinned];
    isPinned = true;
  }
  localStorage.setItem(STORAGE_KEYS.PINNED_CHATS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_pinned_chats_changed", { detail: updated }));
  return isPinned;
};

// ─── 8. Marked Unread Chats Override ─────────────────────────────────────
export const getMarkedUnreadChats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNREAD_CHATS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isChatMarkedUnread = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  return getMarkedUnreadChats().includes(String(chatIdOrName));
};

export const toggleMarkChatUnread = (chatIdOrName) => {
  if (!chatIdOrName) return false;
  const id = String(chatIdOrName);
  const list = getMarkedUnreadChats();
  let updated;
  let isUnread;
  if (list.includes(id)) {
    updated = list.filter((u) => u !== id);
    isUnread = false;
  } else {
    updated = [...list, id];
    isUnread = true;
  }
  localStorage.setItem(STORAGE_KEYS.UNREAD_CHATS, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("bm_unread_chats_changed", { detail: updated }));
  return isUnread;
};

export const clearMarkChatUnread = (chatIdOrName) => {
  if (!chatIdOrName) return;
  const id = String(chatIdOrName);
  const list = getMarkedUnreadChats();
  if (list.includes(id)) {
    const updated = list.filter((u) => u !== id);
    localStorage.setItem(STORAGE_KEYS.UNREAD_CHATS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("bm_unread_chats_changed", { detail: updated }));
  }
};

